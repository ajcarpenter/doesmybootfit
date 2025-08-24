import React from 'react';
import * as THREE from 'three';
import Typeahead from './components/Typeahead';
import logo from '/logo.png';
import { PRESET_CARS } from './config/cars';
import { PRESET_ITEMS } from './config/items';
import CarModal from './components/CarModal';
import ItemModal from './components/ItemModal';

interface SidebarProps {
  carKey: string;
  setCarKey: (key: string) => void;
  shelfIn: boolean;
  setShelfIn: (v: boolean) => void;
  userCars: Record<string, any>;
  setUserCars: (cars: Record<string, any>) => void;
  userItems: Record<string, any>;
  setUserItems: (items: Record<string, any>) => void;
  sceneObjects: any[];
  setSceneObjects: (objs: any[] | ((prev: any[]) => any[])) => void;
  activeObjectId: number | null;
  setActiveObjectId: (id: number | null) => void;
  resetState?: () => void;
  generateShareLink?: () => string;
  applyLoadedState?: (saved: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  carKey, setCarKey, shelfIn, setShelfIn, userCars, setUserCars, userItems, setUserItems,
  sceneObjects, setSceneObjects, activeObjectId, setActiveObjectId, resetState, generateShareLink, applyLoadedState
}) => {
  // Typeahead state
  const [carInput, setCarInput] = React.useState('');
  const [itemInput, setItemInput] = React.useState('');

  // Modal state
  const [carModalOpen, setCarModalOpen] = React.useState(false);
  const [editCarKey, setEditCarKey] = React.useState<string | null>(null);
  const [itemModalOpen, setItemModalOpen] = React.useState(false);
  const [editItemKey, setEditItemKey] = React.useState<string | null>(null);
  const [snapRot, setSnapRot] = React.useState(false);

  // Car options
  const carOptions = [
    ...Object.entries(PRESET_CARS).map(([key, c]) => ({ key, name: (c as any).name })),
    ...Object.entries(userCars).map(([key, c]) => ({ key, name: (c as any).name })),
  ];
  // Item options
  const itemOptions = [
    ...Object.entries(PRESET_ITEMS).map(([key, i]) => ({ key, name: (i as any).name })),
    ...Object.entries(userItems).map(([key, i]) => ({ key, name: (i as any).name })),
  ];

  function handleCarSelect(key: string) {
    setCarKey(key);
    const cfg = PRESET_CARS[key] || userCars[key];
    setCarInput(cfg?.name || '');
  }
  // Keep carInput reflecting the selected car name
  React.useEffect(() => {
    const cfg = PRESET_CARS[carKey] || userCars[carKey];
    setCarInput(cfg?.name || '');
  }, [carKey, userCars]);
  function handleAddItem(key: string) {
    const config = PRESET_ITEMS[key] || userItems[key];
    if (!config) return;
    const id = Date.now();
    const car = PRESET_CARS[carKey] || userCars[carKey];
    const newObj = {
      id,
      itemKey: key,
      name: `${config.name} #${sceneObjects.length + 1}`,
      position: { x: car.W / 2, y: config.T / 2, z: car.D / 2 }, // Place base on floor
      rotation: { yaw: 0, pitch: 0, roll: 0 },
  snapToFloor: true,
      isColliding: false,
      fitStatus: 'Checking...'
    };
    setSceneObjects([...sceneObjects, newObj]);
    setActiveObjectId(id);
    setItemInput('');
  }
  function handleRename(id: number, name: string) {
    setSceneObjects(sceneObjects.map(o => o.id === id ? { ...o, name } : o));
  }
  function handleDelete(id: number) {
    setSceneObjects(sceneObjects.filter(o => o.id !== id));
    if (activeObjectId === id) setActiveObjectId(null);
  }
  function handleRecenterSelected() {
    if (activeObjectId == null) return;
    const car = PRESET_CARS[carKey] || userCars[carKey];
    setSceneObjects(sceneObjects.map(o => {
      if (o.id !== activeObjectId) return o;
      const dims = PRESET_ITEMS[o.itemKey] || userItems[o.itemKey];
      let y = o.position.y;
      if (o.snapToFloor && dims) {
        // rotation reset => use half thickness as projected Y when at 0,0,0
        y = (dims.T || 0) / 2;
      }
      return {
        ...o,
        position: { x: car.W / 2, y, z: car.D / 2 },
        rotation: { yaw: 0, pitch: 0, roll: 0 }
      };
    }));
  }

  // Fit/collision update on scene change
  // Fit handled in App-level setter

  // Disable shelf toggle if car has no removable shelf
  const selectedCar = PRESET_CARS[carKey] || userCars[carKey];
  const hasRemovableShelf = selectedCar?.H_shelf_in !== selectedCar?.H_shelf_out;
  const activeObj = sceneObjects.find(o => o.id === activeObjectId);
  const activeDims = activeObj ? (PRESET_ITEMS[activeObj.itemKey] || userItems[activeObj.itemKey]) : null;
  const selectedCarHeight = shelfIn ? selectedCar?.H_shelf_in : selectedCar?.H_shelf_out;
  function updateActive(patch: any) {
    if (!activeObj) return;
    setSceneObjects(sceneObjects.map(o => o.id === activeObj.id ? { ...o, ...patch } : o));
  }
  // Rotation-aware projected vertical half-extent
  function getProjectedHalfY(d: { W: number; T: number; L: number }, rot: { yaw: number; pitch: number; roll: number }) {
    const halfW = d.W / 2, halfT = d.T / 2, halfL = d.L / 2;
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(rot.pitch || 0),
      THREE.MathUtils.degToRad(rot.yaw || 0),
      THREE.MathUtils.degToRad(rot.roll || 0),
      'XYZ'
    );
    const m = new THREE.Matrix4().makeRotationFromEuler(euler);
    const ux = new THREE.Vector3(1,0,0).applyMatrix4(m).normalize();
    const uy = new THREE.Vector3(0,1,0).applyMatrix4(m).normalize();
    const uz = new THREE.Vector3(0,0,1).applyMatrix4(m).normalize();
    const projectedHalfY = Math.abs(ux.y) * halfW + Math.abs(uy.y) * halfT + Math.abs(uz.y) * halfL;
    return projectedHalfY;
  }
  function clampYToBootByProjHalfY(yDesired: number, projHalfY: number) {
    const H = selectedCarHeight || activeDims?.T || 0;
    return Math.max(projHalfY, Math.min(yDesired, H - projHalfY));
  }
  function clampX(x: number) {
    if (!activeDims) return x;
    const halfW = activeDims.W / 2; // width maps to X
    return Math.max(halfW, Math.min(x, selectedCar.W - halfW));
  }
  function clampZ(z: number) {
    if (!activeDims) return z;
    const halfL = activeDims.L / 2; // depth maps to Z
    return Math.max(halfL, Math.min(z, selectedCar.D - halfL));
  }
  function clampY(y: number) {
    if (!activeDims || !selectedCarHeight) return y;
    const half = activeDims.T / 2;
    return Math.max(half, Math.min(y, selectedCarHeight - half));
  }
  function q(angle: number) {
    return snapRot ? Math.round(angle / 90) * 90 : angle;
  }

  // Modal handlers
  function handleAddCustomCar() {
    setEditCarKey(null);
    setCarModalOpen(true);
  }
  function handleEditCar(key: string) {
    setEditCarKey(key);
    setCarModalOpen(true);
  }
  function handleSaveCar(car: any, key?: string) {
    const k = key || `user_${Date.now()}`;
    setUserCars({ ...userCars, [k]: car });
    setCarModalOpen(false);
    if (!key) setCarKey(k);
  }
  function handleDeleteCar(key: string) {
    const { [key]: _, ...rest } = userCars;
    setUserCars(rest);
    setCarModalOpen(false);
    if (carKey === key) setCarKey('ENYAQ');
  }
  function handleAddCustomItem() {
    setEditItemKey(null);
    setItemModalOpen(true);
  }
  function handleSaveItem(item: any, key?: string) {
    const k = key || `user_${Date.now()}`;
    setUserItems({ ...userItems, [k]: item });
    setItemModalOpen(false);
  }
  function handleDeleteItem(key: string) {
    const { [key]: _, ...rest } = userItems;
    setUserItems(rest);
    setItemModalOpen(false);
  }

  // Initialize AdSense unit once mounted
  React.useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <>
      <aside className="sidebar">
        <header className="section">
          <div className="logo-container">
            <img src={logo} alt="Does My Boot Fit Logo" className="logo-img" />
          </div>
          <div className="fit-status">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Fit Status
              <span
                className="info-dot"
                role="img"
                aria-label="Fit status legend"
                title="Legend: Fits = green, Too Tall = yellow, Exceeds Bounds = orange, Colliding = red"
              >
                i
              </span>
            </h2>
            <div className="badges">
              {(() => {
                const s = activeObjectId == null ? undefined : sceneObjects.find(o => o.id === activeObjectId)?.fitStatus;
                const cls = s === 'Fits' ? 'green' : s === 'Too Tall' ? 'yellow' : s === 'Exceeds Bounds' ? 'orange' : s === 'Colliding' ? 'red' : '';
                return <span className={`badge ${cls}`}>{s || 'No item'}</span>;
              })()}
            </div>
          </div>
          <p className="description">Use mouse to orbit and scroll to zoom. Drag an item to move it on the floor.</p>
        </header>
        <section className="section">
          <h3>Car Model</h3>
          <div className="button-group">
            <Typeahead
              options={carOptions}
              placeholder="Search or select car..."
              onSelect={handleCarSelect}
              value={carInput}
              setValue={setCarInput}
              inputId="carSelectorInput"
              dropdownId="carSelectorDropdown"
              clearOnSelect={false}
            />
            <button className="btn" onClick={() => handleEditCar(carKey)} style={{ display: userCars[carKey] ? 'inline-block' : 'none' }}>Edit</button>
            <button className="btn danger" onClick={() => handleDeleteCar(carKey)} style={{ display: userCars[carKey] ? 'inline-block' : 'none' }}>Delete</button>
          </div>
          <div className="button-group button-group-margin">
            <button className="btn" onClick={handleAddCustomCar}>+ Add Custom Car</button>
          </div>
          <div className="input-grid input-grid-margin">
            <div className="input-group"><label>Width</label><input type="number" step="0.1" value={(PRESET_CARS[carKey] || userCars[carKey])?.W || ''} readOnly /></div>
            <div className="input-group"><label>Depth</label><input type="number" step="0.1" value={(PRESET_CARS[carKey] || userCars[carKey])?.D || ''} readOnly /></div>
            <div className="input-group"><label>Height</label><input type="number" step="0.1" value={shelfIn ? (PRESET_CARS[carKey] || userCars[carKey])?.H_shelf_in : (PRESET_CARS[carKey] || userCars[carKey])?.H_shelf_out || ''} readOnly /></div>
          </div>
          <div className="toggle-group toggle-group-margin">
            <label htmlFor="shelfToggle">Parcel Shelf In</label>
            <label className="toggle-switch">
              <input type="checkbox" id="shelfToggle" checked={shelfIn} disabled={!hasRemovableShelf} onChange={e => setShelfIn(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
        </section>
        <section className="section">
          <h3>Manage Items</h3>
          <div className="button-group button-group-margin">
            <Typeahead
              options={itemOptions}
              placeholder="Add item to boot..."
              onSelect={handleAddItem}
              value={itemInput}
              setValue={setItemInput}
              inputId="addItemTypeaheadInput"
              dropdownId="addItemTypeaheadDropdown"
            />
          </div>
          {sceneObjects.length > 0 && (
            <div className="object-list" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '0.75rem' }}>
              {sceneObjects.map(obj => {
                const isActive = activeObjectId === obj.id;
                return (
                  <div
                    key={obj.id}
                    className={`object-row${isActive ? ' active' : ''}`}
                    aria-selected={isActive}
                    style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <span
                      className={`active-tick${isActive ? ' on' : ''}`}
                      title={isActive ? 'Selected' : ''}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <input
                      value={obj.name}
                      onChange={e => handleRename(obj.id, e.target.value)}
                      style={{ flex: 1, minWidth: 0 }}
                    />
                    <button className="btn" title={isActive ? 'Selected' : 'Select'} onClick={() => setActiveObjectId(obj.id)} disabled={isActive}>●</button>
                    <button className="btn danger" title="Delete" onClick={() => handleDelete(obj.id)}>✕</button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="button-group button-group-margin">
            <button className="btn" onClick={handleAddCustomItem}>+ Add Custom Item</button>
          </div>
          <div className="button-group button-group-margin" style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <button className="btn" onClick={handleRecenterSelected} disabled={activeObjectId == null} style={{ flex: 1 }}>Recenter</button>
          </div>
        </section>
        {activeObj && activeDims && (
          <section className="section">
            <h3>Object Controls</h3>
            <div className="toggle-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="snapRot">Snap rotations to 90°</label>
              <label className="toggle-switch">
                <input
                  id="snapRot"
                  type="checkbox"
                  checked={snapRot}
                  onChange={e => {
                    const next = e.target.checked;
                    setSnapRot(next);
                    if (next && activeObj) {
                      const quant = (a: number) => Math.round(a / 90) * 90;
                      const newRot = {
                        yaw: quant(activeObj.rotation.yaw),
                        pitch: quant(activeObj.rotation.pitch),
                        roll: quant(activeObj.rotation.roll),
                      };
                      if (activeObj.snapToFloor && activeDims) {
                        const phY = getProjectedHalfY(activeDims, newRot);
                        const y = clampYToBootByProjHalfY(phY, phY);
                        updateActive({ rotation: newRot, position: { ...activeObj.position, y } });
                      } else {
                        updateActive({ rotation: newRot });
                      }
                    }
                  }}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="toggle-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="snapToFloor">Snap to floor</label>
              <label className="toggle-switch">
                <input
                  id="snapToFloor"
                  type="checkbox"
                  checked={!!activeObj.snapToFloor}
                  onChange={e => {
                    const next = e.target.checked;
                    if (!activeDims) return;
                    if (next) {
                      const phY = getProjectedHalfY(activeDims, activeObj.rotation);
                      const y = clampYToBootByProjHalfY(phY, phY);
                      updateActive({ snapToFloor: true, position: { ...activeObj.position, y } });
                    } else {
                      updateActive({ snapToFloor: false });
                    }
                  }}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="slider-group">
              <label>
                X
                <input type="number" value={activeObj.position.x.toFixed(1)} onChange={e => updateActive({ position: { ...activeObj.position, x: clampX(parseFloat(e.target.value) || 0) } })} />
              </label>
              <input type="range" min={activeDims.W / 2} max={selectedCar.W - activeDims.W / 2} step={0.5} value={activeObj.position.x}
                onChange={e => updateActive({ position: { ...activeObj.position, x: clampX(parseFloat(e.target.value)) } })} />

              <label>
                Z
                <input type="number" value={activeObj.position.z.toFixed(1)} onChange={e => updateActive({ position: { ...activeObj.position, z: clampZ(parseFloat(e.target.value) || 0) } })} />
              </label>
              <input type="range" min={activeDims.L / 2} max={selectedCar.D - activeDims.L / 2} step={0.5} value={activeObj.position.z}
                onChange={e => updateActive({ position: { ...activeObj.position, z: clampZ(parseFloat(e.target.value)) } })} />

              <label>
                Y
                <input type="number" value={activeObj.position.y.toFixed(1)} disabled={!!activeObj.snapToFloor} title={activeObj.snapToFloor ? 'Disable Snap to floor to edit Y' : undefined} onChange={e => updateActive({ snapToFloor: false, position: { ...activeObj.position, y: clampY(parseFloat(e.target.value) || 0) } })} />
              </label>
              <input type="range" min={activeDims.T / 2} max={(selectedCarHeight || activeDims.T) - activeDims.T / 2} step={0.5} value={activeObj.position.y} disabled={!!activeObj.snapToFloor}
                title={activeObj.snapToFloor ? 'Disable Snap to floor to edit Y' : undefined}
                onChange={e => updateActive({ snapToFloor: false, position: { ...activeObj.position, y: clampY(parseFloat(e.target.value)) } })} />

              <label>
                Yaw
                <input type="number" value={activeObj.rotation.yaw} onChange={e => {
                  const yaw = q(Number(e.target.value));
                  if (activeObj.snapToFloor && activeDims) {
                    const phY = getProjectedHalfY(activeDims, { ...activeObj.rotation, yaw });
                    const y = clampYToBootByProjHalfY(phY, phY);
                    updateActive({ rotation: { ...activeObj.rotation, yaw }, position: { ...activeObj.position, y } });
                  } else {
                    updateActive({ rotation: { ...activeObj.rotation, yaw } });
                  }
                }} />
              </label>
              <input type="range" min={-180} max={180} step={1} value={activeObj.rotation.yaw}
                onChange={e => {
                  const yaw = q(Number(e.target.value));
                  if (activeObj.snapToFloor && activeDims) {
                    const phY = getProjectedHalfY(activeDims, { ...activeObj.rotation, yaw });
                    const y = clampYToBootByProjHalfY(phY, phY);
                    updateActive({ rotation: { ...activeObj.rotation, yaw }, position: { ...activeObj.position, y } });
                  } else {
                    updateActive({ rotation: { ...activeObj.rotation, yaw } });
                  }
                }} />

              <label>
                Pitch
                <input type="number" value={activeObj.rotation.pitch} onChange={e => {
                  const pitch = q(Number(e.target.value));
                  if (activeObj.snapToFloor && activeDims) {
                    const phY = getProjectedHalfY(activeDims, { ...activeObj.rotation, pitch });
                    const y = clampYToBootByProjHalfY(phY, phY);
                    updateActive({ rotation: { ...activeObj.rotation, pitch }, position: { ...activeObj.position, y } });
                  } else {
                    updateActive({ rotation: { ...activeObj.rotation, pitch } });
                  }
                }} />
              </label>
              <input type="range" min={-180} max={180} step={1} value={activeObj.rotation.pitch}
                onChange={e => {
                  const pitch = q(Number(e.target.value));
                  if (activeObj.snapToFloor && activeDims) {
                    const phY = getProjectedHalfY(activeDims, { ...activeObj.rotation, pitch });
                    const y = clampYToBootByProjHalfY(phY, phY);
                    updateActive({ rotation: { ...activeObj.rotation, pitch }, position: { ...activeObj.position, y } });
                  } else {
                    updateActive({ rotation: { ...activeObj.rotation, pitch } });
                  }
                }} />

              <label>
                Roll
                <input type="number" value={activeObj.rotation.roll} onChange={e => {
                  const roll = q(Number(e.target.value));
                  if (activeObj.snapToFloor && activeDims) {
                    const phY = getProjectedHalfY(activeDims, { ...activeObj.rotation, roll });
                    const y = clampYToBootByProjHalfY(phY, phY);
                    updateActive({ rotation: { ...activeObj.rotation, roll }, position: { ...activeObj.position, y } });
                  } else {
                    updateActive({ rotation: { ...activeObj.rotation, roll } });
                  }
                }} />
              </label>
              <input type="range" min={-180} max={180} step={1} value={activeObj.rotation.roll}
                onChange={e => {
                  const roll = q(Number(e.target.value));
                  if (activeObj.snapToFloor && activeDims) {
                    const phY = getProjectedHalfY(activeDims, { ...activeObj.rotation, roll });
                    const y = clampYToBootByProjHalfY(phY, phY);
                    updateActive({ rotation: { ...activeObj.rotation, roll }, position: { ...activeObj.position, y } });
                  } else {
                    updateActive({ rotation: { ...activeObj.rotation, roll } });
                  }
                }} />
            </div>
          </section>
        )}
        <section className="section">
          {/* Ad Unit */}
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-9583160305658839"
            data-ad-slot="YOUR_AD_SLOT_ID"
            data-full-width-responsive="true"
          />
          <script>
            {`window.addEventListener('load', () => { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {} });`}
          </script>
        </section>
        <section className="section">
          <h3>Share / Backup</h3>
          <div className="button-group button-group-margin" style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1 }} title="Download current scene as JSON" onClick={() => {
              try {
                const json = localStorage.getItem('bootFitCheckerState');
                const data = json ? JSON.parse(json) : { };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'boot-fit-scene.json';
                a.click();
                URL.revokeObjectURL(url);
              } catch {}
            }}>Export JSON</button>
            <button className="btn" style={{ flex: 1 }} title="Load scene from JSON" onClick={() => (document.getElementById('importSceneFile') as HTMLInputElement)?.click()}>Import JSON</button>
            <input id="importSceneFile" type="file" accept="application/json" style={{ display: 'none' }} onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const text = await f.text();
              try {
                const payload = JSON.parse(text);
                applyLoadedState?.(payload);
              } catch {}
            }} />
            <button className="btn" style={{ flex: 1 }} title="Copy a shareable permalink" onClick={async () => {
              try {
                const link = generateShareLink?.();
                if (link) await navigator.clipboard.writeText(link);
              } catch {}
            }}>Copy Link</button>
            <button className="btn danger" style={{ flex: 1 }} title="Reset and clear all saved state" onClick={resetState}>Reset & Clear</button>
          </div>
        </section>
        <footer className="sidebar-footer">
          <div className="disclaimer">
            <strong>Disclaimer:</strong> All data on this site is not verified and should not be used for any purchasing decisions.
          </div>
          <div className="copyright">
            &copy; Andrew Carpenter, 2025
          </div>
          <div className="footer-links">
            <a href="https://bsky.app/profile/ajcarpenter.com" target="_blank" rel="noopener">Bluesky</a>
            <a href="https://github.com/ajcarpenter/doesmybootfit" target="_blank" rel="noopener">GitHub</a>
          </div>
        </footer>
      </aside>
      <CarModal
        open={carModalOpen}
        initialCar={editCarKey ? { ...userCars[editCarKey], key: editCarKey } : undefined}
        onSave={handleSaveCar}
        onDelete={handleDeleteCar}
        onClose={() => setCarModalOpen(false)}
        isEdit={!!editCarKey}
      />
      <ItemModal
        open={itemModalOpen}
        initialItem={editItemKey ? { ...userItems[editItemKey], key: editItemKey } : undefined}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        onClose={() => setItemModalOpen(false)}
        isEdit={!!editItemKey}
      />
    </>
  );
};

export default Sidebar;
