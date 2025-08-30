import React, { useState, useEffect } from 'react';
import type { CarConfig } from '../config/cars';
import type { MeshBootConfig, MeshSlab } from '../types';

interface CarModalProps {
  open: boolean;
  initialCar?: Partial<CarConfig & { key?: string }>;
  onSave: (car: CarConfig, key?: string) => void;
  onDelete?: (key: string) => void;
  onClose: () => void;
  isEdit?: boolean;
}

const CarModal: React.FC<CarModalProps> = ({
  open,
  initialCar,
  onSave,
  onDelete,
  onClose,
  isEdit,
}) => {
  const [name, setName] = useState(initialCar?.name || '');
  const [W, setW] = useState(initialCar?.W || 100);
  const [D, setD] = useState(initialCar?.D || 70);
  const [hasShelf, setHasShelf] = useState<boolean>(() =>
    initialCar?.H_shelf_in != null && initialCar?.H_shelf_out != null
      ? initialCar.H_shelf_in !== initialCar.H_shelf_out
      : true
  );
  const [H_shelf_in, setHIn] = useState(initialCar?.H_shelf_in ?? 40);
  const [H_shelf_out, setHOut] = useState(initialCar?.H_shelf_out ?? 60);
  const [singleH, setSingleH] = useState<number>(
    initialCar?.H_shelf_in ?? initialCar?.H_shelf_out ?? 50
  );
  const [error, setError] = useState('');
  const [bootShapeMode, setBootShapeMode] = useState<'cube' | 'mesh'>(
    (initialCar?.bootShapeMode as any) || (initialCar?.bootMesh ? 'mesh' : 'cube')
  );
  const [meshSlabs, setMeshSlabs] = useState<MeshSlab[]>(() => {
    if (initialCar?.bootShapeMode === 'mesh' && (initialCar as any)?.bootMesh?.slabs) {
      return [...((initialCar as any).bootMesh.slabs as MeshSlab[])];
    }
    return [];
  });

  useEffect(() => {
    setName(initialCar?.name || '');
    setW(initialCar?.W || 100);
    setD(initialCar?.D || 70);
    const inH = initialCar?.H_shelf_in ?? 40;
    const outH = initialCar?.H_shelf_out ?? 60;
    setHasShelf(
      initialCar?.H_shelf_in != null && initialCar?.H_shelf_out != null ? inH !== outH : true
    );
    setHIn(inH);
    setHOut(outH);
    setSingleH(initialCar?.H_shelf_in ?? initialCar?.H_shelf_out ?? 50);
    setError('');
    setBootShapeMode(
      (initialCar?.bootShapeMode as any) || (initialCar?.bootMesh ? 'mesh' : 'cube')
    );
    if (initialCar?.bootShapeMode === 'mesh' && (initialCar as any)?.bootMesh?.slabs) {
      setMeshSlabs([...((initialCar as any).bootMesh.slabs as MeshSlab[])]);
    } else {
      setMeshSlabs([]);
    }
  }, [initialCar, open]);

  function makeDefaultSlab(): MeshSlab {
    const h = hasShelf ? H_shelf_out || 50 : singleH || 50;
    return {
      y: 0,
      height: Math.max(1, h),
      zStart: 0,
      depth: Math.max(1, D || 70),
      backHalfW: Math.max(1, (W || 100) / 2),
      frontHalfW: Math.max(1, (W || 100) / 2),
    };
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name required');
    if (W <= 0 || D <= 0) return setError('All dimensions must be positive');
    const finalHIn = hasShelf ? H_shelf_in : singleH;
    const finalHOut = hasShelf ? H_shelf_out : singleH;
    if (finalHIn <= 0 || finalHOut <= 0) return setError('All dimensions must be positive');

    let extra: Partial<CarConfig> = {};
    if (bootShapeMode === 'mesh') {
      const slabs = (meshSlabs.length ? meshSlabs : [makeDefaultSlab()]).map((s) => ({
        y: Math.max(0, s.y),
        height: Math.max(0.1, s.height),
        zStart: Math.max(0, Math.min(s.zStart, D)),
        depth: Math.max(
          0.1,
          Math.min(s.depth, Math.max(0.1, D - Math.max(0, Math.min(s.zStart, D))))
        ),
        backHalfW: Math.max(0.1, Math.min(s.backHalfW, W / 2)),
        frontHalfW: Math.max(0.1, Math.min(s.frontHalfW, W / 2)),
      }));
      extra = { bootShapeMode: 'mesh', bootMesh: { slabs } as unknown as MeshBootConfig } as any;
    } else {
      extra = { bootShapeMode: 'cube', bootMesh: undefined } as any;
    }

    onSave(
      { name, W, D, H_shelf_in: finalHIn, H_shelf_out: finalHOut, ...(extra as any) },
      initialCar?.key
    );
  };

  return open ? (
    <div className="modal-overlay" style={{ display: 'block' }}>
      <div className="modal-content">
        <h3>{isEdit ? 'Edit Car' : 'Add Car'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          </div>
          {bootShapeMode !== 'mesh' && (
            <>
              <div className="input-group">
                <label>
                  Width (cm)
                  <input type="number" value={W} onChange={(e) => setW(Number(e.target.value))} />
                </label>
              </div>
              <div className="input-group">
                <label>
                  Depth (cm)
                  <input type="number" value={D} onChange={(e) => setD(Number(e.target.value))} />
                </label>
              </div>
            </>
          )}
          <div className="input-group">
            <label>
              Boot shape
              <select
                value={bootShapeMode}
                onChange={(e) => setBootShapeMode(e.target.value as any)}
              >
                <option value="cube">Box (simple)</option>
                <option value="mesh">Mesh (beta)</option>
              </select>
            </label>
          </div>
          <div className="toggle-group" style={{ margin: '0.5rem 0' }}>
            <label htmlFor="hasShelfToggle">Has removable parcel shelf</label>
            <label className="toggle-switch">
              <input
                id="hasShelfToggle"
                type="checkbox"
                checked={hasShelf}
                onChange={(e) => setHasShelf(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
          {bootShapeMode !== 'mesh' &&
            (hasShelf ? (
              <>
                <div className="input-group">
                  <label>
                    Height (shelf in, cm)
                    <input
                      type="number"
                      value={H_shelf_in}
                      onChange={(e) => setHIn(Number(e.target.value))}
                    />
                  </label>
                </div>
                <div className="input-group">
                  <label>
                    Height (shelf out, cm)
                    <input
                      type="number"
                      value={H_shelf_out}
                      onChange={(e) => setHOut(Number(e.target.value))}
                    />
                  </label>
                </div>
              </>
            ) : (
              <div className="input-group">
                <label>
                  Height (cm)
                  <input
                    type="number"
                    value={singleH}
                    onChange={(e) => setSingleH(Number(e.target.value))}
                  />
                </label>
              </div>
            ))}

          {bootShapeMode === 'mesh' && (
            <div style={{ borderTop: '1px solid #2a2f3a', marginTop: 12, paddingTop: 12 }}>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>
                Mesh slabs (symmetric trapezoids)
              </div>
              {meshSlabs.length === 0 && (
                <div className="badge" style={{ marginBottom: 8 }}>
                  No slabs yet. A default slab will be created if left empty.
                </div>
              )}
              {meshSlabs.map((s, i) => (
                <div key={i} className="input-grid" style={{ alignItems: 'end', marginBottom: 8 }}>
                  <div className="input-group">
                    <label>
                      y
                      <input
                        type="number"
                        value={s.y}
                        onChange={(e) =>
                          setMeshSlabs((v) =>
                            v.map((sv, idx) =>
                              idx === i ? { ...sv, y: Number(e.target.value) } : sv
                            )
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="input-group">
                    <label>
                      height
                      <input
                        type="number"
                        value={s.height}
                        onChange={(e) =>
                          setMeshSlabs((v) =>
                            v.map((sv, idx) =>
                              idx === i ? { ...sv, height: Number(e.target.value) } : sv
                            )
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="input-group">
                    <label>
                      zStart
                      <input
                        type="number"
                        value={s.zStart}
                        onChange={(e) =>
                          setMeshSlabs((v) =>
                            v.map((sv, idx) =>
                              idx === i ? { ...sv, zStart: Number(e.target.value) } : sv
                            )
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="input-group">
                    <label>
                      depth
                      <input
                        type="number"
                        value={s.depth}
                        onChange={(e) =>
                          setMeshSlabs((v) =>
                            v.map((sv, idx) =>
                              idx === i ? { ...sv, depth: Number(e.target.value) } : sv
                            )
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="input-group">
                    <label>
                      backHalfW
                      <input
                        type="number"
                        value={s.backHalfW}
                        onChange={(e) =>
                          setMeshSlabs((v) =>
                            v.map((sv, idx) =>
                              idx === i ? { ...sv, backHalfW: Number(e.target.value) } : sv
                            )
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="input-group">
                    <label>
                      frontHalfW
                      <input
                        type="number"
                        value={s.frontHalfW}
                        onChange={(e) =>
                          setMeshSlabs((v) =>
                            v.map((sv, idx) =>
                              idx === i ? { ...sv, frontHalfW: Number(e.target.value) } : sv
                            )
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="button-group" style={{ marginTop: 0 }}>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => setMeshSlabs((v) => v.filter((_, idx) => idx !== i))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div className="button-group">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setMeshSlabs((v) => [...v, makeDefaultSlab()])}
                >
                  + Add slab
                </button>
              </div>
            </div>
          )}
          {error && (
            <div className="badge red" style={{ marginBottom: 8 }}>
              {error}
            </div>
          )}
          <div className="button-group">
            <button type="submit" className="btn primary">
              {isEdit ? 'Save' : 'Add'}
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            {isEdit && onDelete && initialCar?.key && (
              <button
                type="button"
                className="btn danger"
                onClick={() => onDelete(initialCar.key!)}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  ) : null;
};

export default CarModal;
