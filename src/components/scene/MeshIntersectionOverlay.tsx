import React from 'react';
import * as THREE from 'three';
import { useMeshIntersection } from '../../hooks/useMeshIntersection';

interface MeshIntersectionOverlayProps {
  car: any;
  shelfIn: boolean;
  objects: any[];
  activeObjectId: number | null;
  userItems?: Record<string, any>;
}

const MeshIntersectionOverlay: React.FC<MeshIntersectionOverlayProps> = ({
  car,
  shelfIn,
  objects,
  activeObjectId,
  userItems,
}) => {
  const data = useMeshIntersection(car, shelfIn, objects, activeObjectId, userItems);
  if (!data) return null;
  return (
    <group>
      <mesh
        position={[car.W / 2, data.y + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={40}
        raycast={() => null}
      >
        <shapeGeometry
          args={[
            (() => {
              const s = new THREE.Shape();
              const pts = data.secPoints;
              s.moveTo(pts[0][0], pts[0][1]);
              for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
              s.closePath();
              return s;
            })(),
          ]}
        />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.25}
          depthTest={false}
          depthWrite={false}
          blending={THREE.MultiplyBlending}
        />
      </mesh>
      <mesh
        position={[0, data.y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={41}
        raycast={() => null}
      >
        <shapeGeometry
          args={[
            (() => {
              const s = new THREE.Shape();
              const pts = data.objHull;
              s.moveTo(pts[0][0], pts[0][1]);
              for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
              s.closePath();
              return s;
            })(),
          ]}
        />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.25}
          depthTest={false}
          depthWrite={false}
          blending={THREE.MultiplyBlending}
        />
      </mesh>
    </group>
  );
};

export default MeshIntersectionOverlay;
