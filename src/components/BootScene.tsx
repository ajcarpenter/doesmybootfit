import React from 'react';
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
  userItems?: Record<string, { name: string; L: number; W: number; T: number }>;
}

const BootScene: React.FC<BootSceneProps> = ({ car, shelfIn, objects, activeObjectId, setSceneObjects, setActiveObjectId, userItems }) => {
  const bootDims = { W: car.W, D: car.D, H: shelfIn ? car.H_shelf_in : car.H_shelf_out };
  const [draggingId, setDraggingId] = React.useState<number | null>(null);
  const isDragging = draggingId !== null;
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
            onPointerDown={() => {
              setActiveObjectId(obj.id);
              setDraggingId(obj.id);
            }}
            onDrag={pos => {
              // y will be finalized by clampToBoot inside the box using full rotation-aware projected half extents
              setSceneObjects(objects.map(o => o.id === obj.id ? { ...o, position: pos } : o));
            }}
            onPointerUp={() => setDraggingId(null)}
          />
        );
      })}
      <OrbitControls
        target={[car.W / 2, 0, car.D / 2]}
        enabled={!isDragging}
        makeDefault
      />
    </>
  );
};

export default BootScene;
