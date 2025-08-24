import React from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PRESET_ITEMS } from '../config/items';
import type { CarConfig } from '../config/cars';
import BootBox from './BootBox';
import BootFloor from './BootFloor';
import BootGrid from './BootGrid';
import DraggableBox from './DraggableBox';

interface BootSceneProps {
  car: CarConfig;
  shelfIn: boolean;
  objects: any[];
  activeObjectId: number | null;
  setSceneObjects: (objs: any[]) => void;
  setActiveObjectId: (id: number | null) => void;
  showGizmoEnabled?: boolean;
  cameraPosition?: { x: number; y: number; z: number };
  cameraTarget?: { x: number; y: number; z: number };
  onCameraChange?: (pos: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }) => void;
  userItems?: Record<string, { name: string; L: number; W: number; T: number }>;
}

const BootScene: React.FC<BootSceneProps> = ({ car, shelfIn, objects, activeObjectId, setSceneObjects, setActiveObjectId, showGizmoEnabled, cameraPosition, cameraTarget, onCameraChange, userItems }) => {
  const bootDims = { W: car.W, D: car.D, H: shelfIn ? car.H_shelf_in : car.H_shelf_out };
  const [draggingId, setDraggingId] = React.useState<number | null>(null);
  const [rotating, setRotating] = React.useState<boolean>(false);
  const isDragging = draggingId !== null;
  const { camera } = useThree();
  const controlsRef = React.useRef<any>(null);

  // Apply external camera position/target updates (e.g., Reset View or restore from storage)
  React.useEffect(() => {
    let changed = false;
    if (cameraPosition) {
      camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
      changed = true;
    }
    if (cameraTarget && controlsRef.current) {
      controlsRef.current.target.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
      changed = true;
    }
    if (changed && controlsRef.current) {
      controlsRef.current.update();
    }
  }, [cameraPosition, cameraTarget, camera]);
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[200, 300, 200]} intensity={0.8} />
      <BootBox car={car} shelfIn={shelfIn} />
      <BootFloor car={car} />
      <BootGrid car={car} />
      {/* Shelf plane visual */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[car.W / 2, (shelfIn ? car.H_shelf_in : car.H_shelf_out), car.D / 2]}> 
        <planeGeometry args={[car.W, car.D]} />
        <meshBasicMaterial color="#5dade2" transparent opacity={0.1} depthWrite={false} />
      </mesh>
      {objects.map(obj => {
        const dims = (PRESET_ITEMS as any)[obj.itemKey] || (userItems && userItems[obj.itemKey]) || { L: 10, W: 10, T: 10 };
        return (
          <DraggableBox
            key={obj.id}
            obj={{ ...obj, bootDims }}
            dims={dims}
            isActive={activeObjectId === obj.id}
            showGizmo={!!showGizmoEnabled && activeObjectId === obj.id}
            onPointerDown={() => {
              setActiveObjectId(obj.id);
              setDraggingId(obj.id);
            }}
            onDrag={pos => {
              // y will be finalized by clampToBoot inside the box using full rotation-aware projected half extents
              setSceneObjects(objects.map(o => o.id === obj.id ? { ...o, position: pos } : o));
            }}
            onPointerUp={() => setDraggingId(null)}
            onRotate={({ yaw, pitch, roll }, nextY) => {
              setSceneObjects(objects.map(o => o.id === obj.id ? {
                ...o,
                rotation: { yaw, pitch, roll },
                position: typeof nextY === 'number' ? { ...o.position, y: nextY } : o.position,
              } : o));
            }}
            onRotateStart={() => setRotating(true)}
            onRotateEnd={() => setRotating(false)}
          />
        );
      })}
      <OrbitControls
        ref={controlsRef}
        target={[cameraTarget?.x ?? car.W / 2, cameraTarget?.y ?? 0, cameraTarget?.z ?? car.D / 2]}
        enabled={!isDragging && !rotating}
        makeDefault
        onChange={(e: any) => {
          if (!onCameraChange) return;
          const cam = e?.target?.object || (e?.target?.camera);
          if (!cam) return;
          try {
            const pos = { x: cam.position.x, y: cam.position.y, z: cam.position.z };
            const tgtV = e?.target?.target;
            const tgt = tgtV ? { x: tgtV.x, y: tgtV.y, z: tgtV.z } : { x: car.W / 2, y: 0, z: car.D / 2 };
            onCameraChange(pos, tgt);
          } catch {}
        }}
      />
    </>
  );
};

export default BootScene;
