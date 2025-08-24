// Utility functions for fit/collision logic, upgraded to support full yaw/pitch/roll using OBB and SAT
import type { CarConfig } from '../config/cars';
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
    new Vector3().copy(c)
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
  return obb.corners.every((p) =>
    p.x >= bounds.min.x - tol && p.x <= bounds.max.x + tol &&
    p.y >= bounds.min.y - tol && p.y <= bounds.max.y + tol &&
    p.z >= bounds.min.z - tol && p.z <= bounds.max.z + tol
  );
}

function anyCornerAbove(obb: OBB, y: number, tol = TOL) {
  return obb.corners.some((p) => p.y > y + tol);
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

  // Fit status against boot AABB [0..W] x [0..bootHeight] x [0..D]
  const bootHeight = shelfIn ? car.H_shelf_in : car.H_shelf_out;
  const bootBounds = { min: new Vector3(0, 0, 0), max: new Vector3(car.W, bootHeight, car.D) };

  for (const { obj, obb } of obbs) {
    const inside = obbCornersInsideAABB(obb, bootBounds);
  const above = anyCornerAbove(obb, bootHeight);

    let reason = 'Fits';
    if (obj.isColliding) reason = 'Colliding';
    else if (!inside) {
      // Distinguish height vs planar bounds
      if (above) reason = 'Too Tall';
      else reason = 'Exceeds Bounds';
    }
    obj.fitStatus = reason;
  }
}
