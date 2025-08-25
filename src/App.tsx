import React from 'react';
import './App.css';
import '../styles/main.css';
import CanvasContainer from './components/CanvasContainer';
import Sidebar from './Sidebar';

import { PRESET_CARS } from './config/cars';
import { PRESET_ITEMS } from './config/items';
import { checkAllCollisionsAndFit } from './utils/fitUtils';

const App: React.FC = () => {
  // App-wide state
  const [carKey, setCarKey] = React.useState('ENYAQ');
  const [shelfIn, setShelfIn] = React.useState(true);
  const [userCars, setUserCars] = React.useState<Record<string, any>>({});
  const [userItems, setUserItems] = React.useState<Record<string, { name: string; L: number; W: number; T: number }>>({});
  const [sceneObjects, setSceneObjects] = React.useState<any[]>([]);
  const [activeObjectId, setActiveObjectId] = React.useState<number | null>(null);
  const [showGizmo, setShowGizmo] = React.useState<boolean>(false);
  const [cameraPos, setCameraPos] = React.useState<{ x: number; y: number; z: number } | null>(null);
  const [cameraTarget, setCameraTarget] = React.useState<{ x: number; y: number; z: number } | null>(null);
  const [meshEditMode, setMeshEditMode] = React.useState<boolean>(false);
  // Prevent initial save from overwriting loaded state; once true, save effect activates
  const [hasLoaded, setHasLoaded] = React.useState(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      // Hash-based shared state
      if (window.location.hash.startsWith('#s=')) {
        const enc = window.location.hash.slice(3);
        const json = decodeURIComponent(escape(atob(enc)));
        const shared = JSON.parse(json);
        if (shared) {
          if (shared.carKey) setCarKey(shared.carKey);
          if (typeof shared.shelfIn === 'boolean') setShelfIn(shared.shelfIn);
          if (shared.userCars) setUserCars(shared.userCars);
          if (shared.userItems) setUserItems(shared.userItems);
          if (Array.isArray(shared.sceneObjects)) {
            // Recompute fit immediately based on shared configs
            const carCfg = (PRESET_CARS as any)[shared.carKey] || (shared.userCars || {})[shared.carKey];
            const getItem = (k: string) => (PRESET_ITEMS as any)[k] || (shared.userItems || {})[k];
            const cloned = shared.sceneObjects.map((o: any) => ({ ...o }));
            if (carCfg) checkAllCollisionsAndFit(cloned, carCfg, !!shared.shelfIn, getItem);
            setSceneObjects(cloned);
          }
          if (shared.activeObjectId !== undefined) setActiveObjectId(shared.activeObjectId);
          if (shared.camera && shared.camera.pos) setCameraPos(shared.camera.pos);
          if (shared.camera && shared.camera.target) setCameraTarget(shared.camera.target);
          // Clear the share hash so subsequent refreshes use localStorage state
          try {
            const urlNoHash = `${window.location.pathname}${window.location.search}`;
            window.history.replaceState(null, '', urlNoHash);
          } catch {}
          return; // skip localStorage if hash present
        }
      }
      const raw = localStorage.getItem('bootFitCheckerState');
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.carKey) setCarKey(saved.carKey);
        if (typeof saved.shelfIn === 'boolean') setShelfIn(saved.shelfIn);
        if (saved.userCars) setUserCars(saved.userCars);
        if (saved.userItems) setUserItems(saved.userItems);
        if (Array.isArray(saved.sceneObjects)) {
          const carCfg = (PRESET_CARS as any)[saved.carKey] || (saved.userCars || {})[saved.carKey];
          const getItem = (k: string) => (PRESET_ITEMS as any)[k] || (saved.userItems || {})[k];
          const cloned = saved.sceneObjects.map((o: any) => ({ ...o }));
          if (carCfg) checkAllCollisionsAndFit(cloned, carCfg, !!saved.shelfIn, getItem);
          setSceneObjects(cloned);
        }
  if (saved.activeObjectId !== undefined) setActiveObjectId(saved.activeObjectId);
  if (saved.showGizmoEnabled !== undefined) setShowGizmo(!!saved.showGizmoEnabled);
  else if (saved.showGizmoId !== undefined) setShowGizmo(!!saved.showGizmoId);
  if (saved.camera && saved.camera.pos) setCameraPos(saved.camera.pos);
  if (saved.camera && saved.camera.target) setCameraTarget(saved.camera.target);
      }
    } catch {}
    finally {
      // Mark that we've completed initial load attempt
      setHasLoaded(true);
    }
  }, []);

  // Save to localStorage on changes
  React.useEffect(() => {
    if (!hasLoaded) return; // skip until initial load finishes
    const stateToSave = {
      carKey,
      shelfIn,
      userCars,
      userItems,
  activeObjectId,
  showGizmoEnabled: showGizmo,
  camera: cameraPos || cameraTarget ? { pos: cameraPos, target: cameraTarget } : undefined,
      sceneObjects: sceneObjects.map(o => ({
        id: o.id,
        itemKey: o.itemKey,
        name: o.name,
        position: o.position,
        rotation: o.rotation,
  dims: o.dims,
  snapToFloor: !!o.snapToFloor,
  snapRot: !!o.snapRot,
      })),
    };
    localStorage.setItem('bootFitCheckerState', JSON.stringify(stateToSave));
  }, [hasLoaded, carKey, shelfIn, userCars, userItems, sceneObjects, activeObjectId, showGizmo, cameraPos, cameraTarget]);

  // Listen for global toggle events from Canvas overlay
  React.useEffect(() => {
    function onToggle() {
      setShowGizmo(v => !v);
    }
    window.addEventListener('toggle-rotation-gizmo', onToggle as any);
    return () => window.removeEventListener('toggle-rotation-gizmo', onToggle as any);
  }, []);

  const car = PRESET_CARS[carKey] || userCars[carKey];
  const isUserCar = !!userCars[carKey];
  const handleUpdateMeshSlab = React.useCallback((index: number, patch: any) => {
    if (!isUserCar) return; // only mutate user cars
    const curr = userCars[carKey];
    if (!curr || curr.bootShapeMode !== 'mesh' || !curr.bootMesh || !Array.isArray(curr.bootMesh.slabs)) return;
    const slabs = curr.bootMesh.slabs.map((s: any, i: number) => i === index ? { ...s, ...patch } : s);
    const nextCar = { ...curr, bootMesh: { slabs } };
    setUserCars({ ...userCars, [carKey]: nextCar });
  }, [userCars, carKey, isUserCar, setUserCars]);

  // Helper: get item by key
  const getItemByKey = React.useCallback((key: string) => (PRESET_ITEMS as any)[key] || (userItems as any)[key], [userItems]);

  // Setter that recomputes fit/collision before applying
  type SceneObj = { id: number; itemKey: string; name: string; position: any; rotation: any; [k: string]: any };
  const rafRef = React.useRef<number | null>(null);
  const queuedRef = React.useRef<SceneObj[] | null>(null);
  const setSceneObjectsWithFit = React.useCallback((next: SceneObj[] | ((prev: SceneObj[]) => SceneObj[])) => {
    const nextArray = typeof next === 'function' ? (next as any)(sceneObjects) : next;
    const cloned: SceneObj[] = (nextArray as SceneObj[]).map((o: SceneObj) => ({ ...o }));
  // Optimistically set immediately so persistence sees the change even if the page is refreshed before rAF
  setSceneObjects(cloned);
  queuedRef.current = cloned;
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const data = queuedRef.current;
        if (!data) return;
        queuedRef.current = null;
        checkAllCollisionsAndFit(data, car, shelfIn, getItemByKey);
        setSceneObjects(data);
      });
    }
  }, [sceneObjects, car, shelfIn, getItemByKey]);

  // Recompute when car or shelf changes
  React.useEffect(() => {
    if (sceneObjects.length) {
      const cloned = sceneObjects.map(o => ({ ...o }));
      checkAllCollisionsAndFit(cloned, car, shelfIn, getItemByKey);
      setSceneObjects(cloned);
    }
  }, [carKey, shelfIn]);

  // Reset state helper
  const resetState = React.useCallback(() => {
    localStorage.removeItem('bootFitCheckerState');
    setCarKey('ENYAQ');
    setShelfIn(true);
    setUserCars({});
    setUserItems({});
    setSceneObjects([]);
    setActiveObjectId(null);
  }, []);

  return (
    <div className="container">
      <Sidebar
        carKey={carKey}
        setCarKey={setCarKey}
        shelfIn={shelfIn}
        setShelfIn={setShelfIn}
        userCars={userCars}
        setUserCars={setUserCars}
        userItems={userItems}
        setUserItems={setUserItems}
        sceneObjects={sceneObjects}
        setSceneObjects={setSceneObjectsWithFit}
        activeObjectId={activeObjectId}
        setActiveObjectId={setActiveObjectId}
        resetState={resetState}
        generateShareLink={() => {
          const stateToSave = {
            carKey,
            shelfIn,
            userCars,
            userItems,
            activeObjectId,
            showGizmoEnabled: showGizmo,
            camera: cameraPos || cameraTarget ? { pos: cameraPos, target: cameraTarget } : undefined,
            sceneObjects: sceneObjects.map(o => ({
              id: o.id,
              itemKey: o.itemKey,
              name: o.name,
              position: o.position,
              rotation: o.rotation,
              dims: o.dims,
              snapToFloor: !!o.snapToFloor,
              snapRot: !!o.snapRot,
            })),
          };
          const json = JSON.stringify(stateToSave);
          const encoded = btoa(unescape(encodeURIComponent(json)));
          const base = `${window.location.origin}${window.location.pathname}`;
          return `${base}#s=${encoded}`;
        }}
        applyLoadedState={(payload) => {
          try {
            if (payload.carKey) setCarKey(payload.carKey);
            if (typeof payload.shelfIn === 'boolean') setShelfIn(payload.shelfIn);
            if (payload.userCars) setUserCars(payload.userCars);
            if (payload.userItems) setUserItems(payload.userItems);
            if (Array.isArray(payload.sceneObjects)) setSceneObjectsWithFit(payload.sceneObjects);
            if (payload.activeObjectId !== undefined) setActiveObjectId(payload.activeObjectId);
          } catch {}
        }}
      />
      <CanvasContainer
        car={car}
        shelfIn={shelfIn}
        objects={sceneObjects}
        activeObjectId={activeObjectId}
        setSceneObjects={setSceneObjectsWithFit}
        setActiveObjectId={setActiveObjectId}
  showGizmoEnabled={showGizmo}
  cameraPosition={cameraPos || undefined}
  cameraTarget={cameraTarget || undefined}
  onCameraChange={(pos, target) => { setCameraPos(pos); setCameraTarget(target); }}
  userItems={userItems}
  meshEditMode={meshEditMode}
  setMeshEditMode={setMeshEditMode}
  onUpdateMeshSlab={handleUpdateMeshSlab}
      />
    </div>
  );
};

export default App;
