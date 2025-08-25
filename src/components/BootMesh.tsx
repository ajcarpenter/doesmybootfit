import React from 'react';
import * as THREE from 'three';
import type { MeshBootConfig } from '../types';

function buildGeometry(cfg: MeshBootConfig, car: { W: number; D: number }, shelfY?: number) {
  // Interpret cfg.slabs as planar cross-sections at given y, then loft between consecutive planes
  const halfW = car.W / 2;
  const sections = cfg.slabs
    .map(s => ({
      y: s.y,
      z0: Math.max(0, Math.min(s.zStart, car.D)),
      z1: Math.max(0, Math.min(s.zStart + s.depth, car.D)),
      back: Math.min(halfW, Math.max(0, s.backHalfW)),
      front: Math.min(halfW, Math.max(0, s.frontHalfW)),
    }))
    .filter(sec => sec.z1 > sec.z0)
    .sort((a, b) => a.y - b.y);

  // Apply shelf clipping: drop sections above shelfY
  const maxY = shelfY ?? Infinity;
  const clipped = sections.filter(s => s.y <= maxY);
  if (clipped.length === 0) return new THREE.BufferGeometry();

  const positions: number[] = [];
  const indices: number[] = [];
  const vertIndexPerSection: { bl: number; br: number; fl: number; fr: number }[] = [];

  // Helper to push a vertex and return its index
  const pushV = (x: number, y: number, z: number) => {
    const idx = positions.length / 3;
    positions.push(x, y, z);
    return idx;
  };

  // Build vertices for each section (back-left, back-right, front-left, front-right)
  for (const s of clipped) {
    const bl = pushV(-s.back, s.y, s.z0);
    const br = pushV(+s.back, s.y, s.z0);
    const fl = pushV(-s.front, s.y, s.z1);
    const fr = pushV(+s.front, s.y, s.z1);
    vertIndexPerSection.push({ bl, br, fl, fr });
  }

  // Caps: bottom at first section, top at last section
  const first = vertIndexPerSection[0];
  const last = vertIndexPerSection[vertIndexPerSection.length - 1];
  // Bottom cap (winding so normal faces downward or upward is fine; using DoubleSide material)
  indices.push(first.bl, first.br, first.fr, first.bl, first.fr, first.fl);
  // Top cap
  indices.push(last.bl, last.fl, last.fr, last.bl, last.fr, last.br);

  // Loft between consecutive sections: connect corresponding edges into quads (two triangles each)
  for (let i = 0; i < vertIndexPerSection.length - 1; i++) {
    const a = vertIndexPerSection[i];
    const b = vertIndexPerSection[i + 1];
    // Back face: a.bl - a.br - b.br - b.bl
    indices.push(a.bl, a.br, b.br, a.bl, b.br, b.bl);
    // Front face: a.fl - a.fr - b.fr - b.fl
    indices.push(a.fl, a.fr, b.fr, a.fl, b.fr, b.fl);
    // Left face: a.bl - a.fl - b.fl - b.bl
    indices.push(a.bl, a.fl, b.fl, a.bl, b.fl, b.bl);
    // Right face: a.br - a.fr - b.fr - b.br
    indices.push(a.br, a.fr, b.fr, a.br, b.fr, b.br);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const BootMesh: React.FC<{
  car: { W: number; D: number };
  shelfIn: boolean;
  shelfY: number;
  config: MeshBootConfig;
}> = ({ car, shelfIn, shelfY, config }) => {
  const geom = React.useMemo(() => buildGeometry(config, car, shelfIn ? shelfY : undefined), [config, car, shelfIn, shelfY]);
  return (
    <mesh position={[car.W / 2, 0, 0]} raycast={() => null} renderOrder={1} geometry={geom}>
      {/* position centers X at W/2 so mesh is symmetric about the boot's centerline */}
  <meshBasicMaterial color="#5dade2" transparent opacity={0.22} depthTest={true} depthWrite={true} side={THREE.DoubleSide} />
    </mesh>
  );
};

export default BootMesh;
