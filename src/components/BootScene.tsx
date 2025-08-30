import React from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { CarConfig } from '../config/cars';
import BootBox, { BootLabels } from './BootBox';
import BootFloor from './BootFloor';
import BootGrid from './BootGrid';
import BootMesh from './BootMesh';
import ObjectList from './scene/ObjectList';
import ShelfPlane from './scene/ShelfPlane';
import MeshEditOverlay from './scene/MeshEditOverlay';
import MeshIntersectionOverlay from './scene/MeshIntersectionOverlay';

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
  onCameraChange?: (
    pos: { x: number; y: number; z: number },
    target: { x: number; y: number; z: number }
  ) => void;
  userItems?: Record<string, { name: string; L: number; W: number; T: number }>;
  meshEditMode?: boolean;
  onUpdateMeshSlab?: (
    index: number,
    next: { y?: number; zStart?: number; depth?: number; backHalfW?: number; frontHalfW?: number }
  ) => void;
}

const BootScene: React.FC<BootSceneProps> = ({
  car,
  shelfIn,
  objects,
  activeObjectId,
  setSceneObjects,
  setActiveObjectId,
  showGizmoEnabled,
  cameraPosition,
  cameraTarget,
  onCameraChange,
  userItems,
  meshEditMode,
  onUpdateMeshSlab,
}) => {
  const bootDims = { W: car.W, D: car.D, H: shelfIn ? car.H_shelf_in : car.H_shelf_out };
  const [draggingId, setDraggingId] = React.useState<number | null>(null);
  const [rotating] = React.useState<boolean>(false);
  const [editingHandles, setEditingHandles] = React.useState<boolean>(false);
  const isDragging = draggingId !== null;
  const { camera } = useThree();
  const controlsRef = React.useRef<any>(null);

  // Visualization moved to MeshIntersectionOverlay

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
      {/* Render either the box outline or the custom mesh volume (hide box when mesh mode is active) */}
      {car.bootShapeMode === 'mesh' && car.bootMesh ? (
        <BootMesh car={car} shelfIn={shelfIn} shelfY={car.H_shelf_in} config={car.bootMesh} />
      ) : (
        <BootBox car={car} shelfIn={shelfIn} />
      )}
      {/* Direction labels should always be visible and on the floor */}
      <BootLabels car={car} />
      <BootFloor car={car} />
      <BootGrid car={car} />
      {/* Shelf plane visual (hidden in mesh mode) */}
      <ShelfPlane
        carW={car.W}
        carD={car.D}
        shelfY={shelfIn ? car.H_shelf_in : car.H_shelf_out}
        visible={!(car.bootShapeMode === 'mesh' && car.bootMesh)}
      />
      {/* Objects */}
      <ObjectList
        bootDims={bootDims}
        objects={objects}
        activeObjectId={activeObjectId}
        setSceneObjects={setSceneObjects}
        setActiveObjectId={(id) => {
          setActiveObjectId(id);
          if (id != null) setDraggingId(id);
        }}
        allowDrag={!editingHandles}
        showGizmoEnabled={showGizmoEnabled}
        userItems={userItems}
      />
      {/* Simple in-scene handles for mesh editing: one gizmo per section plane (y), and corner handles per plane */}
      {meshEditMode && (
        <MeshEditOverlay
          car={car}
          onUpdateMeshSlab={onUpdateMeshSlab}
          setEditingHandles={setEditingHandles}
        />
      )}
      {/* Mesh intersection visualization for the active object */}
      <MeshIntersectionOverlay
        car={car}
        shelfIn={shelfIn}
        objects={objects}
        activeObjectId={activeObjectId}
        userItems={userItems}
      />
      <OrbitControls
        ref={controlsRef}
        target={[cameraTarget?.x ?? car.W / 2, cameraTarget?.y ?? 0, cameraTarget?.z ?? car.D / 2]}
        enabled={!isDragging && !rotating && !editingHandles}
        makeDefault
        onChange={(e: any) => {
          if (!onCameraChange) return;
          const cam = e?.target?.object || e?.target?.camera;
          if (!cam) return;
          try {
            const pos = { x: cam.position.x, y: cam.position.y, z: cam.position.z };
            const tgtV = e?.target?.target;
            const tgt = tgtV
              ? { x: tgtV.x, y: tgtV.y, z: tgtV.z }
              : { x: car.W / 2, y: 0, z: car.D / 2 };
            onCameraChange(pos, tgt);
          } catch {}
        }}
      />
    </>
  );
};

export default BootScene;
