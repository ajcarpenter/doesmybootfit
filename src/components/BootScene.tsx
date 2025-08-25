import React from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PRESET_ITEMS } from '../config/items';
import type { CarConfig } from '../config/cars';
import BootBox, { BootLabels } from './BootBox';
import BootFloor from './BootFloor';
import BootGrid from './BootGrid';
import DraggableBox from './DraggableBox';
import BootMesh from './BootMesh';

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
  meshEditMode?: boolean;
  onUpdateMeshSlab?: (index: number, next: { y?: number; zStart?: number; depth?: number; backHalfW?: number; frontHalfW?: number }) => void;
}

const BootScene: React.FC<BootSceneProps> = ({ car, shelfIn, objects, activeObjectId, setSceneObjects, setActiveObjectId, showGizmoEnabled, cameraPosition, cameraTarget, onCameraChange, userItems, meshEditMode, onUpdateMeshSlab }) => {
  const bootDims = { W: car.W, D: car.D, H: shelfIn ? car.H_shelf_in : car.H_shelf_out };
  const [draggingId, setDraggingId] = React.useState<number | null>(null);
  const [rotating, setRotating] = React.useState<boolean>(false);
  const [editingHandles, setEditingHandles] = React.useState<boolean>(false);
  const isDragging = draggingId !== null;
  const { camera } = useThree();
  const controlsRef = React.useRef<any>(null);

  // Mesh fit visualization for active object: section fill + object footprint (overlap shows intersection)
  const meshFitViz = React.useMemo(() => {
    if (!(car as any).bootMesh || activeObjectId == null) return null;
    const active = objects.find(o => o.id === activeObjectId);
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
      let i = 0; while (i < sections.length - 1 && clampedY > sections[i + 1].y) i++;
      const a = sections[i]; const b = sections[Math.min(i + 1, sections.length - 1)];
      const span = Math.max(1e-6, b.y - a.y);
      const t = Math.max(0, Math.min(1, (clampedY - a.y) / span));
      return { y: clampedY, z0: lerp(a.z0, b.z0, t), z1: lerp(a.z1, b.z1, t), back: lerp(a.back, b.back, t), front: lerp(a.front, b.front, t) };
    };

    // Build OBB corners for active
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
    const signs: Array<[number, number, number]> = [[+1,+1,+1],[+1,+1,-1],[+1,-1,+1],[+1,-1,-1],[-1,+1,+1],[-1,+1,-1],[-1,-1,+1],[-1,-1,-1]];
    const corners = signs.map(([sx, sy, sz]) => new THREE.Vector3().copy(c)
      .add(ux.clone().multiplyScalar(sx * e[0]))
      .add(uy.clone().multiplyScalar(sy * e[1]))
      .add(uz.clone().multiplyScalar(sz * e[2])));

    // Build a section polygon at object center Y (in XZ plane)
    const secY = interpAtY(active.position.y);
    const secPoints: Array<[number, number]> = [
      [-secY.back, secY.z0],
      [ secY.back, secY.z0],
      [ secY.front, secY.z1],
      [-secY.front, secY.z1],
    ];

    // Project OBB corners onto XZ and compute convex hull for footprint
    const ptsXZ: Array<[number, number]> = corners.map((p) => [p.x, p.z]);
    // Gift wrap / Jarvis for up to 8 points
    const hull = (() => {
      if (ptsXZ.length <= 3) return ptsXZ;
      const pts = ptsXZ.slice();
      // Find leftmost
      let l = 0; for (let i = 1; i < pts.length; i++) if (pts[i][0] < pts[l][0]) l = i;
      const res: Array<[number, number]> = [];
      let p = l;
      do {
        res.push(pts[p]);
        let q = (p + 1) % pts.length;
        for (let r = 0; r < pts.length; r++) {
          const [px, pz] = pts[p]; const [qx, qz] = pts[q]; const [rx, rz] = pts[r];
          const cross = (qx - px) * (rz - pz) - (qz - pz) * (rx - px);
          if (cross < 0) q = r; // turn right -> choose r
        }
        p = q;
      } while (p !== l);
      return res;
    })();

    return { y: secY.y, secPoints, objHull: hull };
  }, [activeObjectId, objects, userItems, car, shelfIn]);

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
      {!(car.bootShapeMode === 'mesh' && car.bootMesh) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[car.W / 2, (shelfIn ? car.H_shelf_in : car.H_shelf_out), car.D / 2]}> 
          <planeGeometry args={[car.W, car.D]} />
          <meshBasicMaterial color="#5dade2" transparent opacity={0.1} depthWrite={false} />
        </mesh>
      )}
  {objects.map(obj => {
        const dims = (PRESET_ITEMS as any)[obj.itemKey] || (userItems && userItems[obj.itemKey]) || { L: 10, W: 10, T: 10 };
        return (
          <DraggableBox
            key={obj.id}
            obj={{ ...obj, bootDims }}
            dims={dims}
            isActive={activeObjectId === obj.id}
            showGizmo={!!showGizmoEnabled && activeObjectId === obj.id}
            allowDrag={!editingHandles}
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
    {/* Simple in-scene handles for mesh editing: one gizmo per section plane (y), and corner handles per plane */}
      {meshEditMode && car.bootShapeMode === 'mesh' && car.bootMesh && car.bootMesh.slabs?.length > 0 && (
        <group>
          {/* In mesh edit mode the global labels above are already rendered */}
          {car.bootMesh.slabs
            .map((s, i) => ({
              sourceIdx: i,
              y: s.y,
              z0: Math.max(0, Math.min(s.zStart, car.D)),
              z1: Math.max(0, Math.min(s.zStart + s.depth, car.D)),
              back: Math.min(car.W / 2, Math.max(0, s.backHalfW)),
              front: Math.min(car.W / 2, Math.max(0, s.frontHalfW)),
            }))
            .sort((a, b) => a.y - b.y)
            .map((sec, orderIdx) => (
              <group key={`sec-${orderIdx}`} position={[car.W / 2, sec.y, 0]}>
                {/* Y handle (drag up/down) */}
                <mesh
                  position={[0, 0, car.D / 2]}
                  onPointerDown={(e: any) => {
                    e.stopPropagation();
                    setEditingHandles(true);
                    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                  }}
                  onPointerUp={(e: any) => {
                    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
                    setEditingHandles(false);
                  }}
                  onPointerOut={() => setEditingHandles(false)}
                  onPointerMove={(e: any) => {
                    if (e.buttons !== 1) return;
                    const dy = (e.movementY ?? 0) * -0.1; // simple pixel->cm mapping
                    onUpdateMeshSlab && onUpdateMeshSlab(sec.sourceIdx, { y: Math.max(0, sec.y + dy) });
                  }}
                  renderOrder={20}
                >
                  <sphereGeometry args={[2.0, 16, 16]} />
                  <meshBasicMaterial color="#22c55e" depthTest={false} />
                </mesh>

                {/* Corner handles: back-left/back-right/front-left/front-right on this plane */}
                {[
                  [-sec.back, 0, sec.z0],
                  [ sec.back, 0, sec.z0],
                  [-sec.front, 0, sec.z1],
                  [ sec.front, 0, sec.z1],
                ].map((p, ci) => (
                  <mesh
                    key={`sec-${orderIdx}-c${ci}`}
                    position={[p[0], p[1], p[2]]}
                    onPointerDown={(e: any) => {
                      e.stopPropagation();
                      setEditingHandles(true);
                      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                    }}
                    onPointerUp={(e: any) => {
                      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
                      setEditingHandles(false);
                    }}
                    onPointerOut={() => setEditingHandles(false)}
                    onPointerMove={(e: any) => {
                      if (e.buttons !== 1) return;
                      const mX = e.movementX ?? 0;
                      const mZ = e.movementY ?? 0;
                      // Positive dx should move the handle right (+x), positive dz should move it forward (+z)
                      const dx = mX * 0.1;
                      const dz = mZ * 0.1;
                      if (ci === 0 || ci === 1) {
                        // back edge: adjust backHalfW (x) and zStart
                        const nextBack = Math.max(0, Math.min(car.W / 2, Math.abs(p[0] + dx)));
                        const nextZ0 = Math.max(0, Math.min(car.D, sec.z0 + dz));
                        onUpdateMeshSlab && onUpdateMeshSlab(sec.sourceIdx, { backHalfW: nextBack, zStart: Math.max(0, Math.min(nextZ0, sec.z1)) });
                      } else {
                        // front edge: adjust frontHalfW (x) and z1 (via depth)
                        const nextFront = Math.max(0, Math.min(car.W / 2, Math.abs(p[0] + dx)));
                        const z1 = sec.z1 + dz;
                        const nextZ1 = Math.max(sec.z0, Math.min(car.D, z1));
                        onUpdateMeshSlab && onUpdateMeshSlab(sec.sourceIdx, { depth: Math.max(0.1, nextZ1 - sec.z0), frontHalfW: nextFront });
                      }
                    }}
                    renderOrder={20}
                  >
                    <boxGeometry args={[2.0, 2.0, 2.0]} />
                    <meshBasicMaterial color="#fde047" depthTest={false} />
                  </mesh>
                ))}

                {/* Labels for widths and depth with click-to-edit */}
                <Html position={[0, 0, sec.z0]} center sprite distanceFactor={25} style={{ pointerEvents: 'auto' }}>
                  <div style={{ transform: 'scale(3.0)', transformOrigin: 'center', background: 'rgba(24,25,28,0.96)', color: '#e6e6e6', padding: '10px 14px', borderRadius: 12, fontSize: 18, fontWeight: 800, letterSpacing: 0.2, cursor: 'pointer' }}
                    onClick={() => {
                      const curr = (sec.back * 2).toFixed(1);
                      const val = prompt('Back width (cm):', curr);
                      if (!val) return;
                      const num = Math.max(0.1, Math.min(car.W, parseFloat(val)));
                      onUpdateMeshSlab && onUpdateMeshSlab(sec.sourceIdx, { backHalfW: num / 2 });
                    }}
                  >⟷ {(sec.back * 2).toFixed(1)} cm</div>
                </Html>
                <Html position={[0, 0, sec.z1]} center sprite distanceFactor={25} style={{ pointerEvents: 'auto' }}>
                  <div style={{ transform: 'scale(3.0)', transformOrigin: 'center', background: 'rgba(24,25,28,0.96)', color: '#e6e6e6', padding: '10px 14px', borderRadius: 12, fontSize: 18, fontWeight: 800, letterSpacing: 0.2, cursor: 'pointer' }}
                    onClick={() => {
                      const curr = (sec.front * 2).toFixed(1);
                      const val = prompt('Front width (cm):', curr);
                      if (!val) return;
                      const num = Math.max(0.1, Math.min(car.W, parseFloat(val)));
                      onUpdateMeshSlab && onUpdateMeshSlab(sec.sourceIdx, { frontHalfW: num / 2 });
                    }}
                  >⟷ {(sec.front * 2).toFixed(1)} cm</div>
                </Html>
                {(() => {
                  const midZ = (sec.z0 + sec.z1) / 2;
                  const off = 6; // cm offset outside the profile to avoid overlap with handles
                  const depthVal = (sec.z1 - sec.z0).toFixed(1);
                  const onEditDepth = () => {
                    const val = prompt('Depth (cm):', depthVal);
                    if (!val) return;
                    const num = Math.max(0.1, Math.min(car.D, parseFloat(val)));
                    const nextZ1 = Math.max(sec.z0, Math.min(car.D, sec.z0 + num));
                    onUpdateMeshSlab && onUpdateMeshSlab(sec.sourceIdx, { depth: Math.max(0.1, nextZ1 - sec.z0) });
                  };
                  return (
                    <>
                      <Html position={[-sec.back - off, 0, midZ]} center sprite distanceFactor={25} style={{ pointerEvents: 'auto' }}>
                        <div style={{ transform: 'scale(3.0)', transformOrigin: 'center', background: 'rgba(24,25,28,0.96)', color: '#e6e6e6', padding: '10px 14px', borderRadius: 12, fontSize: 18, fontWeight: 800, letterSpacing: 0.2, cursor: 'pointer' }}
                          onClick={onEditDepth}
                        >↔ {depthVal} cm</div>
                      </Html>
                      <Html position={[sec.front + off, 0, midZ]} center sprite distanceFactor={25} style={{ pointerEvents: 'auto' }}>
                        <div style={{ transform: 'scale(3.0)', transformOrigin: 'center', background: 'rgba(24,25,28,0.96)', color: '#e6e6e6', padding: '10px 14px', borderRadius: 12, fontSize: 18, fontWeight: 800, letterSpacing: 0.2, cursor: 'pointer' }}
                          onClick={onEditDepth}
                        >↔ {depthVal} cm</div>
                      </Html>
                    </>
                  );
                })()}
              </group>
            ))}

          {/* Height labels between consecutive sections */}
          {(() => {
            const ordered = car.bootMesh!.slabs
              .map((s, i) => ({ sourceIdx: i, y: s.y }))
              .sort((a, b) => a.y - b.y);
            const groups: React.ReactElement[] = [];
            for (let i = 0; i < ordered.length - 1; i++) {
              const a = ordered[i];
              const b = ordered[i + 1];
              const dy = b.y - a.y;
              if (dy <= 0) continue;
              groups.push(
                <Html key={`h-${i}`} position={[car.W / 2, a.y + dy / 2, car.D / 2]} center sprite distanceFactor={25} style={{ pointerEvents: 'auto' }}>
                  <div style={{ transform: 'scale(3.0)', transformOrigin: 'center', background: 'rgba(24,25,28,0.96)', color: '#e6e6e6', padding: '10px 14px', borderRadius: 12, fontSize: 18, fontWeight: 800, letterSpacing: 0.2, cursor: 'pointer' }}
                    onClick={() => {
                      const curr = dy.toFixed(1);
                      const val = prompt('Height to next slab (cm):', curr);
                      if (!val) return;
                      const num = Math.max(0.1, parseFloat(val));
                      const nextY = Math.max(0, a.y + num);
                      onUpdateMeshSlab && onUpdateMeshSlab(b.sourceIdx, { y: nextY });
                    }}
                  >↕ {dy.toFixed(1)} cm</div>
                </Html>
              );
            }
            return groups;
          })()}
        </group>
      )}
      {/* Mesh intersection visualization for the active object */}
      {meshFitViz && (
        <group>
          {/* Section fill at object's height (XZ-plane polygon) */}
          <mesh position={[car.W / 2, meshFitViz.y + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={40} raycast={() => null}>
            <shapeGeometry args={[(() => { const s = new THREE.Shape(); const pts = meshFitViz.secPoints; s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath(); return s; })()]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.25} depthTest={false} depthWrite={false} blending={THREE.MultiplyBlending} />
          </mesh>
          {/* Object footprint fill (convex hull of projected corners) */}
          <mesh position={[0, meshFitViz.y, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={41} raycast={() => null}>
            <shapeGeometry args={[(() => { const s = new THREE.Shape(); const pts = meshFitViz.objHull; s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath(); return s; })()]} />
            <meshBasicMaterial color="#0ea5e9" transparent opacity={0.25} depthTest={false} depthWrite={false} blending={THREE.MultiplyBlending} />
          </mesh>
        </group>
      )}
      <OrbitControls
        ref={controlsRef}
        target={[cameraTarget?.x ?? car.W / 2, cameraTarget?.y ?? 0, cameraTarget?.z ?? car.D / 2]}
        enabled={!isDragging && !rotating && !editingHandles}
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
