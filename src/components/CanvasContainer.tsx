import React from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import BootScene from './BootScene';
import { useStore } from '../store/store';

const CanvasContainer: React.FC = () => {
  const car = useStore((s) => s.car);
  const shelfIn = useStore((s) => s.shelfIn);
  const objects = useStore((s) => s.sceneObjects);
  const activeObjectId = useStore((s) => s.activeObjectId);
  const setSceneObjects = useStore((s) => s.setSceneObjectsWithFit) as any;
  const setActiveObjectId = useStore((s) => s.setActiveObjectId);
  const showGizmoEnabled = useStore((s) => s.showGizmo);
  const cameraPosition = useStore((s) => s.cameraPos || (undefined as any));
  const cameraTarget = useStore((s) => s.cameraTarget || (undefined as any));
  const onCameraChange = useStore((s) => s.setCamera);
  const userItems = useStore((s) => s.userItems);
  const meshEditMode = useStore((s) => s.meshEditMode);
  const setMeshEditMode = useStore((s) => s.setMeshEditMode);
  const onUpdateMeshSlab = useStore((s) => s.updateMeshSlab);
  const bananaPack = useStore((s) => s.bananaPack);
  const setShowGizmo = useStore((s) => s.setShowGizmo);
  const showGizmo = useStore((s) => s.showGizmo);
  const [hover, setHover] = React.useState(false);

  React.useEffect(() => {
    function onToggle() {
      setShowGizmo(!showGizmo);
    }
    function onBananaPack() {
      bananaPack();
    }
    window.addEventListener('toggle-rotation-gizmo', onToggle as any);
    window.addEventListener('banana-pack', onBananaPack as any);
    return () => {
      window.removeEventListener('toggle-rotation-gizmo', onToggle as any);
      window.removeEventListener('banana-pack', onBananaPack as any);
    };
  }, [bananaPack, setShowGizmo, showGizmo]);
  return (
    <main className="canvas-container" style={{ position: 'relative' }}>
      <div
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: 8 }}
      >
        <button
          aria-pressed={!!showGizmoEnabled}
          title={showGizmoEnabled ? 'Hide rotation gizmo' : 'Show rotation gizmo'}
          onClick={() => setShowGizmo(!showGizmoEnabled)}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.14)',
            background: hover ? 'rgba(24,25,28,0.92)' : 'rgba(24,25,28,0.8)',
            color: '#e6e6e6',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            cursor: 'pointer',
          }}
        >
          {showGizmoEnabled ? '⟳ Rotation: On' : '⟳ Rotation: Off'}
        </button>
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
              cursor: 'pointer',
            }}
          >
            {meshEditMode ? '✎ Mesh Edit: On' : '✎ Mesh Edit: Off'}
          </button>
        )}
        <button
          title="Pack Banana Boxes"
          onClick={() => bananaPack()}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(24,25,28,0.8)',
            color: '#e6e6e6',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            cursor: 'pointer',
          }}
        >
          🍌 Banana Box Mode
        </button>
        <button
          title="Reset camera view"
          onClick={() => {
            const defaultPos = { x: 200, y: 200, z: 260 };
            const defaultTarget = {
              x: car.W / 2,
              y: Math.min(40, (shelfIn ? car.H_shelf_in : car.H_shelf_out) * 0.25),
              z: car.D / 2,
            };
            onCameraChange && onCameraChange(defaultPos, defaultTarget);
          }}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(24,25,28,0.8)',
            color: '#e6e6e6',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            cursor: 'pointer',
          }}
        >
          ↺ Reset View
        </button>
      </div>
      <Canvas
        camera={{
          position: [cameraPosition?.x ?? 200, cameraPosition?.y ?? 200, cameraPosition?.z ?? 260],
          fov: 45,
          near: 0.1,
          far: 2000,
        }}
        style={{ width: '100%', height: '100%' }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        frameloop="always"
      >
        <AdaptiveDpr pixelated />
        <BootScene
          car={car as any}
          shelfIn={shelfIn}
          objects={objects}
          activeObjectId={activeObjectId}
          setSceneObjects={setSceneObjects}
          setActiveObjectId={setActiveObjectId}
          showGizmoEnabled={!!showGizmoEnabled}
          cameraPosition={cameraPosition as any}
          cameraTarget={cameraTarget as any}
          onCameraChange={onCameraChange as any}
          userItems={userItems}
          meshEditMode={!!meshEditMode}
          onUpdateMeshSlab={onUpdateMeshSlab as any}
        />
      </Canvas>
    </main>
  );
};

export default CanvasContainer;
