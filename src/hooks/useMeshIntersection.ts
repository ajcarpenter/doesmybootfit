import React from 'react';
import * as THREE from 'three';
import { PRESET_ITEMS } from '../config/items';

export function useMeshIntersection(
  car: any,
  shelfIn: boolean,
  objects: any[],
  activeObjectId: number | null,
  userItems?: Record<string, any>
) {
  return React.useMemo(() => {
    if (!(car as any).bootMesh || activeObjectId == null) return null;
    const active = objects.find((o) => o.id === activeObjectId);
    if (!active) return null;
    const dims = (PRESET_ITEMS as any)[active.itemKey] || (userItems && userItems[active.itemKey]);
    if (!dims) return null;
    const boots: any = (car as any).bootMesh;
    const halfW = car.W / 2;
    const maxY = shelfIn ? car.H_shelf_in : Infinity;
    const sections = boots.slabs
      .map((s: any) => ({
        y: s.y,
        z0: Math.max(0, Math.min(s.zStart, car.D)),
        z1: Math.max(0, Math.min(s.zStart + s.depth, car.D)),
        back: Math.min(halfW, Math.max(0, s.backHalfW)),
        front: Math.min(halfW, Math.max(0, s.frontHalfW)),
      }))
      .filter((sec: any) => sec.z1 > sec.z0 && sec.y <= maxY)
      .sort((a: any, b: any) => a.y - b.y);
    if (sections.length < 2) return null;
    const topY = sections[sections.length - 1].y;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const interpAtY = (y: number) => {
      const clampedY = Math.max(sections[0].y, Math.min(topY, y));
      let i = 0;
      while (i < sections.length - 1 && clampedY > sections[i + 1].y) i++;
      const a = sections[i];
      const b = sections[Math.min(i + 1, sections.length - 1)];
      const span = Math.max(1e-6, b.y - a.y);
      const t = Math.max(0, Math.min(1, (clampedY - a.y) / span));
      return {
        y: clampedY,
        z0: lerp(a.z0, b.z0, t),
        z1: lerp(a.z1, b.z1, t),
        back: lerp(a.back, b.back, t),
        front: lerp(a.front, b.front, t),
      };
    };

    const pitch = (active.rotation.pitch * Math.PI) / 180;
    const yaw = (active.rotation.yaw * Math.PI) / 180;
    const roll = (active.rotation.roll * Math.PI) / 180;
    const euler = new THREE.Euler(pitch, yaw, roll, 'XYZ');
    const rot = new THREE.Matrix4().makeRotationFromEuler(euler);
    const ux = new THREE.Vector3(1, 0, 0).applyMatrix4(rot).normalize();
    const uy = new THREE.Vector3(0, 1, 0).applyMatrix4(rot).normalize();
    const uz = new THREE.Vector3(0, 0, 1).applyMatrix4(rot).normalize();
    const c = new THREE.Vector3(active.position.x, active.position.y, active.position.z);
    const e: [number, number, number] = [dims.W / 2, dims.T / 2, dims.L / 2];
    const signs: Array<[number, number, number]> = [
      [+1, +1, +1],
      [+1, +1, -1],
      [+1, -1, +1],
      [+1, -1, -1],
      [-1, +1, +1],
      [-1, +1, -1],
      [-1, -1, +1],
      [-1, -1, -1],
    ];
    const corners = signs.map(([sx, sy, sz]) =>
      new THREE.Vector3()
        .copy(c)
        .add(ux.clone().multiplyScalar(sx * e[0]))
        .add(uy.clone().multiplyScalar(sy * e[1]))
        .add(uz.clone().multiplyScalar(sz * e[2]))
    );

    const secY = interpAtY(active.position.y);
    const secPoints: Array<[number, number]> = [
      [-secY.back, secY.z0],
      [secY.back, secY.z0],
      [secY.front, secY.z1],
      [-secY.front, secY.z1],
    ];

    const ptsXZ: Array<[number, number]> = corners.map((p) => [p.x, p.z]);
    const hull = (() => {
      if (ptsXZ.length <= 3) return ptsXZ;
      const pts = ptsXZ.slice();
      let l = 0;
      for (let i = 1; i < pts.length; i++) if (pts[i][0] < pts[l][0]) l = i;
      const res: Array<[number, number]> = [];
      let p = l;
      do {
        res.push(pts[p]);
        let q = (p + 1) % pts.length;
        for (let r = 0; r < pts.length; r++) {
          const [px, pz] = pts[p];
          const [qx, qz] = pts[q];
          const [rx, rz] = pts[r];
          const cross = (qx - px) * (rz - pz) - (qz - pz) * (rx - px);
          if (cross < 0) q = r;
        }
        p = q;
      } while (p !== l);
      return res;
    })();

    return { y: secY.y, secPoints, objHull: hull };
  }, [activeObjectId, objects, userItems, car, shelfIn]);
}
