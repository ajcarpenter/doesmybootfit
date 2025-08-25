import type { CarConfig } from '../config/cars';
import type { ItemConfig } from '../config/items';
import { checkAllCollisionsAndFit } from './fitUtils';

export type SceneObj = {
  id: number;
  itemKey: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { yaw: number; pitch: number; roll: number };
  snapToFloor?: boolean;
  snapRot?: boolean;
};

type Orient = {
  // Size of the box along world axes for this orientation (cm)
  sx: number; // X extent
  sy: number; // Y extent (vertical)
  sz: number; // Z extent
  // Rotation to achieve this orientation
  yaw: number; // around Y
  pitch: number; // around X
  roll: number; // around Z
  label: string;
};

// Generate the 6 axis-aligned orientations (upright, on side, on end) with 0/90 yaw
function getOrientations(item: ItemConfig): Orient[] {
  const { W, T, L } = item;
  return [
    // Upright (T vertical)
    { sx: W, sy: T, sz: L, yaw: 0, pitch: 0, roll: 0, label: 'upright yaw0' },
    { sx: L, sy: T, sz: W, yaw: 90, pitch: 0, roll: 0, label: 'upright yaw90' },
    // On side (W vertical) -> roll 90 brings X to Y
    { sx: T, sy: W, sz: L, yaw: 0, pitch: 0, roll: 90, label: 'side yaw0' },
    { sx: L, sy: W, sz: T, yaw: 90, pitch: 0, roll: 90, label: 'side yaw90' },
    // On end (L vertical) -> pitch -90 brings Z to Y
    { sx: W, sy: L, sz: T, yaw: 0, pitch: -90, roll: 0, label: 'end yaw0' },
    { sx: T, sy: L, sz: W, yaw: 90, pitch: -90, roll: 0, label: 'end yaw90' },
  ];
}

// Try to pack as many items as possible for a given orientation using a simple grid sweep (x,z,y)
function packForOrient(
  car: CarConfig,
  shelfIn: boolean,
  itemKey: string,
  orient: Orient,
  getItemByKey: (k: string) => ItemConfig
): SceneObj[] {
  const placed: SceneObj[] = [];
  const { sx, sy, sz, yaw, pitch, roll } = orient;

  // Determine vertical limit
  const topY = (car as any).bootMesh ? (() => {
    try {
      const slabs = (car as any).bootMesh.slabs as Array<{ y: number }>;
      if (!Array.isArray(slabs) || slabs.length === 0) return shelfIn ? car.H_shelf_in : car.H_shelf_out;
      return slabs.map(s => s.y).sort((a, b) => a - b)[slabs.length - 1];
    } catch { return shelfIn ? car.H_shelf_in : car.H_shelf_out; }
  })() : (shelfIn ? car.H_shelf_in : car.H_shelf_out);

  const nx = Math.max(0, Math.floor(car.W / sx));
  const nz = Math.max(0, Math.floor(car.D / sz));
  const ny = Math.max(0, Math.floor(topY / sy));
  if (nx === 0 || nz === 0 || ny === 0) return placed;

  // Small nudges to mitigate floating precision and tolerance
  const eps = 0.0; // keep tight; tolerances are handled in fitUtils

  let idBase = Date.now();
  for (let iy = 0; iy < ny; iy++) {
    const y = sy * (iy + 0.5);
    for (let iz = 0; iz < nz; iz++) {
      const z = sz * (iz + 0.5) + eps;
      for (let ix = 0; ix < nx; ix++) {
        const x = sx * (ix + 0.5) + eps;
        const obj: SceneObj = {
          id: idBase++,
          itemKey,
          name: 'Banana Box',
          position: { x, y, z },
          rotation: { yaw, pitch, roll },
          snapToFloor: false,
          snapRot: false,
        };
        // Validate using existing fit/collision logic
        const tentative = [...placed, obj].map(o => ({ ...o }));
        checkAllCollisionsAndFit(tentative as any, car, shelfIn, getItemByKey);
        const me = tentative[tentative.length - 1] as any;
        if (me.fitStatus === 'Fits') {
          placed.push(obj);
        }
      }
    }
  }
  return placed;
}

export function packBananaBoxes(
  car: CarConfig,
  shelfIn: boolean,
  getItemByKey: (k: string) => ItemConfig
): SceneObj[] {
  const itemKey = 'BANANA_BOX';
  const item = getItemByKey(itemKey);
  if (!item) return [];

  // Try all single-orientation packs and pick the best by count
  const orients = getOrientations(item);
  let best: SceneObj[] = [];
  for (const o of orients) {
    const placed = packForOrient(car, shelfIn, itemKey, o, getItemByKey);
    if (placed.length > best.length) best = placed;
  }
  // Also try a mixed-orientation greedy pack with multi-offset grid
  const mixed = packMixed(car, shelfIn, itemKey, item, getItemByKey);
  return mixed.length > best.length ? mixed : best;
}

// Mixed-orientation greedy packing with multi-offset grid for denser layouts
function packMixed(
  car: CarConfig,
  shelfIn: boolean,
  itemKey: string,
  item: ItemConfig,
  getItemByKey: (k: string) => ItemConfig
): SceneObj[] {
  const orients = getOrientations(item);
  // Grid steps based on smallest extents across orientations
  const stepX = Math.min(...orients.map(o => o.sx));
  const stepY = Math.min(...orients.map(o => o.sy));
  const stepZ = Math.min(...orients.map(o => o.sz));

  const nx = Math.max(0, Math.floor(car.W / stepX));
  const nz = Math.max(0, Math.floor(car.D / stepZ));
  // Determine vertical limit
  const topY = (car as any).bootMesh ? (() => {
    try {
      const slabs = (car as any).bootMesh.slabs as Array<{ y: number }>;
      if (!Array.isArray(slabs) || slabs.length === 0) return shelfIn ? car.H_shelf_in : car.H_shelf_out;
      return slabs.map(s => s.y).sort((a, b) => a - b)[slabs.length - 1];
    } catch { return shelfIn ? car.H_shelf_in : car.H_shelf_out; }
  })() : (shelfIn ? car.H_shelf_in : car.H_shelf_out);
  const ny = Math.max(0, Math.floor(topY / stepY));

  if (nx === 0 || nz === 0 || ny === 0) return [];

  // Orientation preference: prioritize shorter height, then smaller footprint
  const orientOrder = orients
    .slice()
    .sort((a, b) => (a.sy - b.sy) || (a.sx * a.sz - b.sx * b.sz));

  const xOffsets = [0, stepX / 2];
  const zOffsets = [0, stepZ / 2];

  let bestRun: SceneObj[] = [];
  for (const xOff of xOffsets) {
    for (const zOff of zOffsets) {
      const placed: SceneObj[] = [];
      let idBase = Date.now();
      for (let iy = 0; iy < ny; iy++) {
        const y = stepY * (iy + 0.5);
        for (let iz = 0; iz < nz; iz++) {
          const z = zOff + stepZ * (iz + 0.5);
          for (let ix = 0; ix < nx; ix++) {
            const x = xOff + stepX * (ix + 0.5);
            // Try orientations in order; place the first that fits
            for (const o of orientOrder) {
              const obj: SceneObj = {
                id: idBase++,
                itemKey,
                name: 'Banana Box',
                position: { x, y, z },
                rotation: { yaw: o.yaw, pitch: o.pitch, roll: o.roll },
                snapToFloor: false,
                snapRot: false,
              };
              const tentative = [...placed, obj].map(o2 => ({ ...o2 }));
              checkAllCollisionsAndFit(tentative as any, car, shelfIn, getItemByKey);
              const me = tentative[tentative.length - 1] as any;
              if (me.fitStatus === 'Fits') {
                placed.push(obj);
                break;
              }
            }
            // if none fits, leave this cell empty
          }
        }
      }
      if (placed.length > bestRun.length) bestRun = placed;
    }
  }
  return bestRun;
}
