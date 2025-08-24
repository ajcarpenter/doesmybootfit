import React from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

interface DraggableBoxProps {
  obj: any;
  dims: { L: number; W: number; T: number };
  isActive: boolean;
  onDrag: (pos: { x: number; y: number; z: number }) => void;
  onPointerDown: () => void;
  onPointerUp: () => void;
}

const DraggableBox: React.FC<DraggableBoxProps> = ({ obj, dims, isActive, onDrag, onPointerDown, onPointerUp }) => {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();
  const [dragging, setDragging] = React.useState(false);

  function getPointerFloorPos(e: any) {
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const pointer = new THREE.Vector2(x, y);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y=0
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersect);
    return intersect;
  }

  function clampToBoot(pos: { x: number; y: number; z: number }) {
    // Rotation-aware projected half extents on X and Z
    const halfW = dims.W / 2; // width (X)
    const halfT = dims.T / 2; // height (Y)
    const halfL = dims.L / 2; // depth (Z)
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(obj.rotation.pitch),
      THREE.MathUtils.degToRad(obj.rotation.yaw),
      THREE.MathUtils.degToRad(obj.rotation.roll),
      'XYZ'
    );
    const rot = new THREE.Matrix4().makeRotationFromEuler(euler);
    const ux = new THREE.Vector3(1, 0, 0).applyMatrix4(rot).normalize();
    const uy = new THREE.Vector3(0, 1, 0).applyMatrix4(rot).normalize();
    const uz = new THREE.Vector3(0, 0, 1).applyMatrix4(rot).normalize();
      const projectedHalfX = Math.abs(ux.x) * halfW + Math.abs(uy.x) * halfT + Math.abs(uz.x) * halfL;
      const projectedHalfY = Math.abs(ux.y) * halfW + Math.abs(uy.y) * halfT + Math.abs(uz.y) * halfL;
      const projectedHalfZ = Math.abs(ux.z) * halfW + Math.abs(uy.z) * halfT + Math.abs(uz.z) * halfL;

      const maxY = (obj.bootDims?.H ?? Infinity) - projectedHalfY;
      const desiredY = obj.snapToFloor ? projectedHalfY : obj.position.y; // snap bottom to floor when enabled
    return {
      x: Math.max(projectedHalfX, Math.min(pos.x, obj.bootDims.W - projectedHalfX)),
        y: Math.max(projectedHalfY, Math.min(desiredY, maxY)),
      z: Math.max(projectedHalfZ, Math.min(pos.z, obj.bootDims.D - projectedHalfZ)),
    };
  }

  return (
    <mesh
      ref={meshRef}
      position={[obj.position.x, obj.position.y, obj.position.z]}
      rotation={[
        THREE.MathUtils.degToRad(obj.rotation.pitch),
        THREE.MathUtils.degToRad(obj.rotation.yaw),
        THREE.MathUtils.degToRad(obj.rotation.roll)
      ]}
      onPointerDown={e => {
        if (!isActive) return;
        e.stopPropagation();
        setDragging(true);
        if (onPointerDown) onPointerDown();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerUp={e => {
        setDragging(false);
        if (onPointerUp) onPointerUp();
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      }}
      onPointerMove={e => {
        if (!dragging) return;
        const intersect = getPointerFloorPos(e);
        onDrag(clampToBoot(intersect));
      }}
  // avoid scaling to prevent visual bleed outside bounds
  // scale={isActive ? 1.02 : 1}
      castShadow
    >
  {/* width (X), height (Y), depth (Z) */}
  <boxGeometry args={[dims.W, dims.T, dims.L]} />
      {
        (() => {
          let color = '#2196f3';
          let opacity = 0.35;
          let depthTest = false; // x-ray style by default
          if (obj.fitStatus === 'Fits') {
            color = '#21c07a';
            opacity = 0.3;
          } else if (obj.fitStatus === 'Too Tall') {
            color = '#f1c40f';
            opacity = 0.35;
          } else if (obj.isColliding || obj.fitStatus === 'Exceeds Bounds' || obj.fitStatus === 'Colliding') {
            color = '#ff6b6b';
            opacity = 0.5;
            depthTest = false;
          }
          return <meshStandardMaterial color={color} transparent opacity={opacity} depthTest={depthTest} />;
        })()
      }
      { (obj.isColliding || obj.fitStatus === 'Colliding') && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(dims.W, dims.T, dims.L)]} />
          <lineBasicMaterial color="#ff3b3b" linewidth={2} depthTest={false} />
        </lineSegments>
      )}
    </mesh>
  );
};

export default DraggableBox;
