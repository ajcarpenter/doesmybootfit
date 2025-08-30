// Utility functions for fit/collision logic, upgraded to support full yaw/pitch/roll using OBB and SAT
import type { CarConfig } from '../config/cars';
import type { MeshBootConfig } from '../types';
import { Euler, Matrix4, Vector3 } from 'three';

// Global geometric tolerance in cm (handles float error and edge-touching)
const TOL = 1.0; // 1 cm

export interface SceneObject {
  id: number;
  itemKey: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { yaw: number; pitch: number; roll: number };
  isColliding?: boolean;
  fitStatus?: string;
  mesh?: any; // For compatibility, but not used in React logic
}

export interface ItemConfig {
  name: string;
  L: number;
  W: number;
  T: number;
}

// Oriented Bounding Box structure
type OBB = {
  c: Vector3; // center
  u: [Vector3, Vector3, Vector3]; // local axes in world space (unit vectors)
  e: [number, number, number]; // half sizes (L/2, T/2, W/2)
  corners: Vector3[]; // 8 corners in world space
};

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

function buildOBB(obj: SceneObject, item: ItemConfig): OBB {
  const pitch = toRadians(obj.rotation.pitch);
  const yaw = toRadians(obj.rotation.yaw);
  const roll = toRadians(obj.rotation.roll);

  const euler = new Euler(pitch, yaw, roll, 'XYZ');
  const rot = new Matrix4().makeRotationFromEuler(euler);

  const ux = new Vector3(1, 0, 0).applyMatrix4(rot).normalize();
  const uy = new Vector3(0, 1, 0).applyMatrix4(rot).normalize();
  const uz = new Vector3(0, 0, 1).applyMatrix4(rot).normalize();
  const c = new Vector3(obj.position.x, obj.position.y, obj.position.z);
  // Half-extents aligned to rendered geometry [W (X), T (Y), L (Z)]
  const e: [number, number, number] = [item.W / 2, item.T / 2, item.L / 2];

  // Precompute corners: c ± e0*ux ± e1*uy ± e2*uz
  const signs = [
    [+1, +1, +1],
    [+1, +1, -1],
    [+1, -1, +1],
    [+1, -1, -1],
    [-1, +1, +1],
    [-1, +1, -1],
    [-1, -1, +1],
    [-1, -1, -1],
  ] as const;
  const corners = signs.map(([sx, sy, sz]) =>
    new Vector3()
      .copy(c)
      .add(new Vector3().copy(ux).multiplyScalar(sx * e[0]))
      .add(new Vector3().copy(uy).multiplyScalar(sy * e[1]))
      .add(new Vector3().copy(uz).multiplyScalar(sz * e[2]))
  );

  return { c, u: [ux, uy, uz], e, corners };
}

// Project an OBB onto an axis and return its radius (half-length) along that axis
function projectionRadius(obb: OBB, axis: Vector3): number {
  const ax = Math.abs(axis.dot(obb.u[0]));
  const ay = Math.abs(axis.dot(obb.u[1]));
  const az = Math.abs(axis.dot(obb.u[2]));
  return obb.e[0] * ax + obb.e[1] * ay + obb.e[2] * az;
}

function isZeroVector(v: Vector3, eps = 1e-8) {
  return v.lengthSq() < eps;
}

// SAT test for OBB vs OBB
function obbIntersects(a: OBB, b: OBB): boolean {
  const T = new Vector3().subVectors(b.c, a.c);
  const axes: Vector3[] = [];
  axes.push(a.u[0].clone(), a.u[1].clone(), a.u[2].clone());
  axes.push(b.u[0].clone(), b.u[1].clone(), b.u[2].clone());
  // Cross products of axes
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const axis = new Vector3().copy(a.u[i]).cross(b.u[j]);
      if (!isZeroVector(axis)) axes.push(axis.normalize());
    }
  }

  for (const axis of axes) {
    const rA = projectionRadius(a, axis);
    const rB = projectionRadius(b, axis);
    const dist = Math.abs(T.dot(axis));
    // Consider small overlaps (<= TOL) as separated to avoid false collisions on boundaries
    if (dist >= rA + rB - TOL) return false; // Separating axis found (with tolerance)
  }
  return true; // No separating axis, they intersect
}

function obbCornersInsideAABB(obb: OBB, bounds: { min: Vector3; max: Vector3 }, tol = TOL) {
  return obb.corners.every(
    (p) =>
      p.x >= bounds.min.x - tol &&
      p.x <= bounds.max.x + tol &&
      p.y >= bounds.min.y - tol &&
      p.y <= bounds.max.y + tol &&
      p.z >= bounds.min.z - tol &&
      p.z <= bounds.max.z + tol
  );
}

function anyCornerAbove(obb: OBB, y: number, tol = TOL) {
  return obb.corners.some((p) => p.y > y + tol);
}

// -- Mesh-mode fit helpers ----------------------------------------------------

type Section = { y: number; z0: number; z1: number; back: number; front: number };

function buildSectionsForCarMesh(
  car: { W: number; D: number; H_shelf_in: number },
  mesh: MeshBootConfig,
  shelfIn: boolean
): Section[] {
  const halfW = car.W / 2;
  const maxY = shelfIn ? car.H_shelf_in : Infinity;
  const sections = mesh.slabs
    .map((s) => ({
      y: s.y,
      z0: Math.max(0, Math.min(s.zStart, car.D)),
      z1: Math.max(0, Math.min(s.zStart + s.depth, car.D)),
      back: Math.min(halfW, Math.max(0, s.backHalfW)),
      front: Math.min(halfW, Math.max(0, s.frontHalfW)),
    }))
    .filter((sec) => sec.z1 > sec.z0 && sec.y <= maxY)
    .sort((a, b) => a.y - b.y);
  return sections;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interpolateSectionAtY(sections: Section[], y: number): Section | null {
  if (sections.length < 2) return null;
  if (y < sections[0].y - TOL) return null;
  const last = sections[sections.length - 1];
  if (y > last.y + TOL) return null;
  // Find bracketing indices
  let i = 0;
  while (i < sections.length - 1 && y > sections[i + 1].y) i++;
  const a = sections[i];
  const b = sections[Math.min(i + 1, sections.length - 1)];
  const span = Math.max(1e-6, b.y - a.y);
  const t = Math.max(0, Math.min(1, (y - a.y) / span));
  return {
    y,
    z0: lerp(a.z0, b.z0, t),
    z1: lerp(a.z1, b.z1, t),
    back: lerp(a.back, b.back, t),
    front: lerp(a.front, b.front, t),
  };
}

function pointInsideInterpolatedMesh(carW: number, p: Vector3, sec: Section, tol = TOL): boolean {
  // Check z interval first
  const zMin = Math.min(sec.z0, sec.z1) - tol;
  const zMax = Math.max(sec.z0, sec.z1) + tol;
  if (p.z < zMin || p.z > zMax) return false;
  // Floor check
  if (p.y < -tol) return false;
  const dz = Math.max(1e-6, sec.z1 - sec.z0);
  const tz = Math.max(0, Math.min(1, (p.z - sec.z0) / dz));
  const halfW = lerp(sec.back, sec.front, tz) + tol; // expand slightly for tolerance
  const xFromCenter = Math.abs(p.x - carW / 2);
  return xFromCenter <= halfW;
}

function obbCornersInsideMesh(
  obb: OBB,
  car: CarConfig,
  meshCfg: MeshBootConfig,
  shelfIn: boolean
): { inside: boolean; aboveTop: boolean } {
  const sections = buildSectionsForCarMesh(car, meshCfg, shelfIn);
  if (sections.length < 2) return { inside: false, aboveTop: false };
  const topY = sections[sections.length - 1].y;
  let aboveTop = false;
  const insideAll = obb.corners.every((p) => {
    if (p.y > topY + TOL) {
      aboveTop = true;
      return false;
    }
    // For y below first section, clamp to first to avoid null; for between/above, interpolate
    const clampedY = Math.max(sections[0].y, Math.min(topY, p.y));
    const sec = interpolateSectionAtY(sections, clampedY) || sections[0];
    return pointInsideInterpolatedMesh(car.W, p, sec, TOL);
  });
  return { inside: insideAll, aboveTop };
}

export function checkAllCollisionsAndFit(
  sceneObjects: SceneObject[],
  car: CarConfig,
  shelfIn: boolean,
  getItemByKey: (key: string) => ItemConfig
) {
  // Build OBBs for all objects once
  const obbs = sceneObjects.map((obj) => ({ obj, obb: buildOBB(obj, getItemByKey(obj.itemKey)) }));

  // Reset collision
  sceneObjects.forEach((obj) => (obj.isColliding = false));

  // Object-to-object collision using OBB SAT
  for (let i = 0; i < obbs.length; i++) {
    for (let j = i + 1; j < obbs.length; j++) {
      if (obbIntersects(obbs[i].obb, obbs[j].obb)) {
        obbs[i].obj.isColliding = true;
        obbs[j].obj.isColliding = true;
      }
    }
  }

  // Fit status: AABB for cube mode; interpolated mesh for mesh mode
  const isMesh = !!(car as any).bootMesh; // treat as mesh if a mesh config exists
  if (!isMesh) {
    const bootHeight = shelfIn ? car.H_shelf_in : car.H_shelf_out;
    const bootBounds = { min: new Vector3(0, 0, 0), max: new Vector3(car.W, bootHeight, car.D) };
    for (const { obj, obb } of obbs) {
      const inside = obbCornersInsideAABB(obb, bootBounds);
      const above = anyCornerAbove(obb, bootHeight);
      let reason = 'Fits';
      if (obj.isColliding) reason = 'Colliding';
      else if (!inside) reason = above ? 'Too Tall' : 'Exceeds Bounds';
      obj.fitStatus = reason;
    }
  } else {
    const meshCfg = (car as any).bootMesh as MeshBootConfig;
    for (const { obj, obb } of obbs) {
      const { inside, aboveTop } = obbCornersInsideMesh(obb, car, meshCfg, shelfIn);
      let reason = 'Fits';
      if (obj.isColliding) reason = 'Colliding';
      else if (!inside) reason = aboveTop ? 'Too Tall' : 'Exceeds Bounds';
      obj.fitStatus = reason;
    }
  }
}
