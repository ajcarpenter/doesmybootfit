import React from 'react';
import { Html } from '@react-three/drei';

interface MeshEditOverlayProps {
  car: any;
  onUpdateMeshSlab?: (
    index: number,
    next: { y?: number; zStart?: number; depth?: number; backHalfW?: number; frontHalfW?: number }
  ) => void;
  setEditingHandles: (v: boolean) => void;
}

const MeshEditOverlay: React.FC<MeshEditOverlayProps> = ({
  car,
  onUpdateMeshSlab,
  setEditingHandles,
}) => {
  if (!(car.bootShapeMode === 'mesh' && car.bootMesh && car.bootMesh.slabs?.length > 0))
    return null;
  const halfW = car.W / 2;
  return (
    <group>
      {car.bootMesh.slabs
        .map((s: any, i: number) => ({
          sourceIdx: i,
          y: s.y,
          z0: Math.max(0, Math.min(s.zStart, car.D)),
          z1: Math.max(0, Math.min(s.zStart + s.depth, car.D)),
          back: Math.min(halfW, Math.max(0, s.backHalfW)),
          front: Math.min(halfW, Math.max(0, s.frontHalfW)),
        }))
        .sort((a: any, b: any) => a.y - b.y)
        .map((sec: any, orderIdx: number) => (
          <group key={`sec-${orderIdx}`} position={[car.W / 2, sec.y, 0]}>
            {/* Y handle */}
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
                const dy = (e.movementY ?? 0) * -0.1;
                onUpdateMeshSlab && onUpdateMeshSlab(sec.sourceIdx, { y: Math.max(0, sec.y + dy) });
              }}
              renderOrder={20}
            >
              <sphereGeometry args={[2.0, 16, 16]} />
              <meshBasicMaterial color="#22c55e" depthTest={false} />
            </mesh>

            {/* Corner handles */}
            {[
              [-sec.back, 0, sec.z0],
              [sec.back, 0, sec.z0],
              [-sec.front, 0, sec.z1],
              [sec.front, 0, sec.z1],
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
                  const dx = mX * 0.1;
                  const dz = mZ * 0.1;
                  if (ci === 0 || ci === 1) {
                    const nextBack = Math.max(0, Math.min(car.W / 2, Math.abs(p[0] + dx)));
                    const nextZ0 = Math.max(0, Math.min(car.D, sec.z0 + dz));
                    onUpdateMeshSlab &&
                      onUpdateMeshSlab(sec.sourceIdx, {
                        backHalfW: nextBack,
                        zStart: Math.max(0, Math.min(nextZ0, sec.z1)),
                      });
                  } else {
                    const nextFront = Math.max(0, Math.min(car.W / 2, Math.abs(p[0] + dx)));
                    const z1 = sec.z1 + dz;
                    const nextZ1 = Math.max(sec.z0, Math.min(car.D, z1));
                    onUpdateMeshSlab &&
                      onUpdateMeshSlab(sec.sourceIdx, {
                        depth: Math.max(0.1, nextZ1 - sec.z0),
                        frontHalfW: nextFront,
                      });
                  }
                }}
                renderOrder={20}
              >
                <boxGeometry args={[2.0, 2.0, 2.0]} />
                <meshBasicMaterial color="#fde047" depthTest={false} />
              </mesh>
            ))}

            {/* Labels for widths and depth */}
            <Html
              position={[0, 0, sec.z0]}
              center
              sprite
              distanceFactor={25}
              style={{ pointerEvents: 'auto' }}
            >
              <div
                style={{
                  transform: 'scale(3.0)',
                  transformOrigin: 'center',
                  background: 'rgba(24,25,28,0.96)',
                  color: '#e6e6e6',
                  padding: '10px 14px',
                  borderRadius: 12,
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: 0.2,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const curr = (sec.back * 2).toFixed(1);
                  const val = prompt('Back width (cm):', curr);
                  if (!val) return;
                  const num = Math.max(0.1, Math.min(car.W, parseFloat(val)));
                  onUpdateMeshSlab && onUpdateMeshSlab(sec.sourceIdx, { backHalfW: num / 2 });
                }}
              >
                ⟷ {(sec.back * 2).toFixed(1)} cm
              </div>
            </Html>
            <Html
              position={[0, 0, sec.z1]}
              center
              sprite
              distanceFactor={25}
              style={{ pointerEvents: 'auto' }}
            >
              <div
                style={{
                  transform: 'scale(3.0)',
                  transformOrigin: 'center',
                  background: 'rgba(24,25,28,0.96)',
                  color: '#e6e6e6',
                  padding: '10px 14px',
                  borderRadius: 12,
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: 0.2,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const curr = (sec.front * 2).toFixed(1);
                  const val = prompt('Front width (cm):', curr);
                  if (!val) return;
                  const num = Math.max(0.1, Math.min(car.W, parseFloat(val)));
                  onUpdateMeshSlab && onUpdateMeshSlab(sec.sourceIdx, { frontHalfW: num / 2 });
                }}
              >
                ⟷ {(sec.front * 2).toFixed(1)} cm
              </div>
            </Html>
            {(() => {
              const midZ = (sec.z0 + sec.z1) / 2;
              const off = 6;
              const depthVal = (sec.z1 - sec.z0).toFixed(1);
              const onEditDepth = () => {
                const val = prompt('Depth (cm):', depthVal);
                if (!val) return;
                const num = Math.max(0.1, Math.min(car.D, parseFloat(val)));
                const nextZ1 = Math.max(sec.z0, Math.min(car.D, sec.z0 + num));
                onUpdateMeshSlab &&
                  onUpdateMeshSlab(sec.sourceIdx, { depth: Math.max(0.1, nextZ1 - sec.z0) });
              };
              return (
                <>
                  <Html
                    position={[-sec.back - off, 0, midZ]}
                    center
                    sprite
                    distanceFactor={25}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div
                      style={{
                        transform: 'scale(3.0)',
                        transformOrigin: 'center',
                        background: 'rgba(24,25,28,0.96)',
                        color: '#e6e6e6',
                        padding: '10px 14px',
                        borderRadius: 12,
                        fontSize: 18,
                        fontWeight: 800,
                        letterSpacing: 0.2,
                        cursor: 'pointer',
                      }}
                      onClick={onEditDepth}
                    >
                      ↔ {depthVal} cm
                    </div>
                  </Html>
                  <Html
                    position={[sec.front + off, 0, midZ]}
                    center
                    sprite
                    distanceFactor={25}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div
                      style={{
                        transform: 'scale(3.0)',
                        transformOrigin: 'center',
                        background: 'rgba(24,25,28,0.96)',
                        color: '#e6e6e6',
                        padding: '10px 14px',
                        borderRadius: 12,
                        fontSize: 18,
                        fontWeight: 800,
                        letterSpacing: 0.2,
                        cursor: 'pointer',
                      }}
                      onClick={onEditDepth}
                    >
                      ↔ {depthVal} cm
                    </div>
                  </Html>
                </>
              );
            })()}
          </group>
        ))}

      {/* Height labels */}
      {(() => {
        const ordered = car
          .bootMesh!.slabs.map((s: any, i: number) => ({ sourceIdx: i, y: s.y }))
          .sort((a: any, b: any) => a.y - b.y);
        const groups: React.ReactElement[] = [];
        for (let i = 0; i < ordered.length - 1; i++) {
          const a = ordered[i];
          const b = ordered[i + 1];
          const dy = b.y - a.y;
          if (dy <= 0) continue;
          groups.push(
            <Html
              key={`h-${i}`}
              position={[car.W / 2, a.y + dy / 2, car.D / 2]}
              center
              sprite
              distanceFactor={25}
              style={{ pointerEvents: 'auto' }}
            >
              <div
                style={{
                  transform: 'scale(3.0)',
                  transformOrigin: 'center',
                  background: 'rgba(24,25,28,0.96)',
                  color: '#e6e6e6',
                  padding: '10px 14px',
                  borderRadius: 12,
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: 0.2,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const curr = dy.toFixed(1);
                  const val = prompt('Height to next slab (cm):', curr);
                  if (!val) return;
                  const num = Math.max(0.1, parseFloat(val));
                  const nextY = Math.max(0, a.y + num);
                  onUpdateMeshSlab && onUpdateMeshSlab(b.sourceIdx, { y: nextY });
                }}
              >
                ↕ {dy.toFixed(1)} cm
              </div>
            </Html>
          );
        }
        return groups;
      })()}
    </group>
  );
};

export default MeshEditOverlay;
