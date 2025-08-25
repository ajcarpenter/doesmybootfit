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
  showGizmoEnabled?: boolean;
  cameraPosition?: { x: number; y: number; z: number };
  cameraTarget?: { x: number; y: number; z: number };
  onCameraChange?: (pos: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }) => void;
  userItems?: Record<string, { name: string; L: number; W: number; T: number }>;
  meshEditMode?: boolean;
  setMeshEditMode?: (v: boolean) => void;
  onUpdateMeshSlab?: (index: number, patch: { y?: number; zStart?: number; depth?: number; backHalfW?: number; frontHalfW?: number }) => void;
}> = ({ car, shelfIn, objects, activeObjectId, setSceneObjects, setActiveObjectId, showGizmoEnabled, cameraPosition, cameraTarget, onCameraChange, userItems, meshEditMode, setMeshEditMode, onUpdateMeshSlab }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <main className="canvas-container" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: 8 }}>
        <button
          aria-pressed={!!showGizmoEnabled}
          title={showGizmoEnabled ? 'Hide rotation gizmo' : 'Show rotation gizmo'}
          onClick={() => {
            const evt = new CustomEvent('toggle-rotation-gizmo');
            window.dispatchEvent(evt);
          }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.14)',
            background: hover ? 'rgba(24,25,28,0.92)' : 'rgba(24,25,28,0.8)',
            color: '#e6e6e6',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            cursor: 'pointer'
          }}
        >{showGizmoEnabled ? '⟳ Rotation: On' : '⟳ Rotation: Off'}</button>
        {car.bootShapeMode === 'mesh' && car.bootMesh && (
          <button
            aria-pressed={!!meshEditMode}
            title={meshEditMode ? 'Exit mesh edit mode' : 'Enter mesh edit mode'}
            onClick={() => setMeshEditMode && setMeshEditMode(!meshEditMode)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(24,25,28,0.8)',
              color: meshEditMode ? '#d1fae5' : '#e6e6e6',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              cursor: 'pointer'
            }}
          >{meshEditMode ? '✎ Mesh Edit: On' : '✎ Mesh Edit: Off'}</button>
        )}
        <button
          title="Pack Banana Boxes"
          onClick={() => {
            const evt = new CustomEvent('banana-pack');
            window.dispatchEvent(evt);
          }}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(24,25,28,0.8)',
            color: '#e6e6e6',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            cursor: 'pointer'
          }}
        >🍌 Banana Box Mode</button>
    <button
          title="Reset camera view"
          onClick={() => {
      const defaultPos = { x: 200, y: 200, z: 260 };
      const defaultTarget = { x: car.W / 2, y: Math.min(40, (shelfIn ? car.H_shelf_in : car.H_shelf_out) * 0.25), z: car.D / 2 };
            onCameraChange && onCameraChange(defaultPos, defaultTarget);
          }}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(24,25,28,0.8)',
            color: '#e6e6e6',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            cursor: 'pointer'
          }}
        >↺ Reset View</button>
      </div>
      <Canvas
        camera={{ position: [cameraPosition?.x ?? 200, cameraPosition?.y ?? 200, cameraPosition?.z ?? 260], fov: 45, near: 0.1, far: 2000 }}
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
          showGizmoEnabled={!!showGizmoEnabled}
          cameraPosition={cameraPosition}
          cameraTarget={cameraTarget}
          onCameraChange={onCameraChange}
          userItems={userItems}
          meshEditMode={!!meshEditMode}
          onUpdateMeshSlab={onUpdateMeshSlab}
        />
      </Canvas>
    </main>
  );
};

export default CanvasContainer;
