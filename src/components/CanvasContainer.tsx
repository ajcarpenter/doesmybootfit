import React from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import BootScene from './BootScene';
import type { CarConfig } from '../config/cars';

const CanvasContainer: React.FC<{
  car: CarConfig;
  shelfIn: boolean;
  objects: any[];
  activeObjectId: number | null;
  setSceneObjects: (objs: any[]) => void;
  setActiveObjectId: (id: number | null) => void;
  userItems?: Record<string, { name: string; L: number; W: number; T: number }>;
}> = ({ car, shelfIn, objects, activeObjectId, setSceneObjects, setActiveObjectId, userItems }) => {
  return (
    <main className="canvas-container">
      <Canvas
        camera={{ position: [150, 150, 180], fov: 45, near: 0.1, far: 2000 }}
        style={{ width: '100%', height: '100%' }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        frameloop="always"
      >
        <AdaptiveDpr pixelated />
        <BootScene
          car={car}
          shelfIn={shelfIn}
          objects={objects}
          activeObjectId={activeObjectId}
          setSceneObjects={setSceneObjects}
          setActiveObjectId={setActiveObjectId}
          userItems={userItems}
        />
      </Canvas>
    </main>
  );
};

export default CanvasContainer;
