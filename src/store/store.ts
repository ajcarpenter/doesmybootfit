import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PRESET_CARS } from '../config/cars';
import { PRESET_ITEMS } from '../config/items';
import { checkAllCollisionsAndFit } from '../utils/fitUtils';
import { packBananaBoxes } from '../utils/bananaPack';

type Vec3 = { x: number; y: number; z: number };
type SceneObj = {
  id: number;
  itemKey: string;
  name: string;
  position: any;
  rotation: any;
  [k: string]: any;
};

export interface AppState {
  carKey: string;
  shelfIn: boolean;
  userCars: Record<string, any>;
  userItems: Record<string, { name: string; L: number; W: number; T: number }>;
  sceneObjects: SceneObj[];
  activeObjectId: number | null;
  showGizmo: boolean;
  cameraPos: Vec3 | null;
  cameraTarget: Vec3 | null;
  meshEditMode: boolean;
  // item modal ui
  itemModalOpen: boolean;
  editItemKey: string | null;

  // current car config
  car: any;

  // actions
  setCarKey: (k: string) => void;
  setShelfIn: (v: boolean) => void;
  setUserCars: (v: Record<string, any>) => void;
  setUserItems: (v: Record<string, { name: string; L: number; W: number; T: number }>) => void;
  setActiveObjectId: (id: number | null) => void;
  setShowGizmo: (v: boolean) => void;
  setCamera: (pos: Vec3 | null, target: Vec3 | null) => void;
  setMeshEditMode: (v: boolean) => void;
  setSceneObjectsWithFit: (next: SceneObj[] | ((prev: SceneObj[]) => SceneObj[])) => void;
  updateActiveObject: (patch: Partial<SceneObj>) => void;
  updateMeshSlab: (index: number, patch: any) => void;
  bananaPack: () => void;
  loadFromSharedHash: () => boolean; // returns true if loaded shared
  resetAll: () => void;
  generateShareLink: () => string;
  applyLoadedState: (payload: any) => void;

  // item modal + user items CRUD
  openNewItemModal: () => void;
  openEditItemModal: (key: string) => void;
  closeItemModal: () => void;
  saveUserItem: (item: { name: string; L: number; W: number; T: number }, key?: string) => void;
  deleteUserItem: (key: string) => void;

  // scene object CRUD
  addItemByKey: (itemKey: string) => void;
  renameObject: (id: number, name: string) => void;
  deleteObject: (id: number) => void;
  duplicateObject: (id: number) => void;
  recenterSelected: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      carKey: 'ENYAQ',
      shelfIn: true,
      userCars: {},
      userItems: {},
      sceneObjects: [],
      activeObjectId: null,
      showGizmo: false,
      cameraPos: null,
      cameraTarget: null,
      meshEditMode: false,
      itemModalOpen: false,
      editItemKey: null,
      car: (PRESET_CARS as any)['ENYAQ'],

      setCarKey: (k) => {
        const nextCar = (PRESET_CARS as any)[k] || (get().userCars as any)[k];
        set({ carKey: k, car: nextCar });
        try {
          (get().setSceneObjectsWithFit as any)((arr: SceneObj[]) => arr);
        } catch {}
      },
      setShelfIn: (v) => {
        set({ shelfIn: v });
        try {
          (get().setSceneObjectsWithFit as any)((arr: SceneObj[]) => arr);
        } catch {}
      },
      setUserCars: (v) => {
        const key = get().carKey;
        const nextCar = (PRESET_CARS as any)[key] || (v as any)[key];
        set({ userCars: v, car: nextCar });
      },
      setUserItems: (v) => set({ userItems: v }),
      setActiveObjectId: (id) => set({ activeObjectId: id }),
      setShowGizmo: (v) => set({ showGizmo: v }),
      setCamera: (pos, target) => set({ cameraPos: pos, cameraTarget: target }),
      setMeshEditMode: (v) => set({ meshEditMode: v }),

      setSceneObjectsWithFit: (next) => {
        const state = get();
        const curr = state.sceneObjects;
        const car = state.car;
        const shelfIn = state.shelfIn;
        const getItemByKey = (key: string) =>
          (PRESET_ITEMS as any)[key] || (state.userItems as any)[key];
        const nextArray = typeof next === 'function' ? (next as any)(curr) : next;
        const cloned: SceneObj[] = (nextArray as SceneObj[]).map((o: SceneObj) => ({ ...o }));
        checkAllCollisionsAndFit(cloned, car, shelfIn, getItemByKey);
        set({ sceneObjects: cloned });
      },

      updateActiveObject: (patch) => {
        const { activeObjectId } = get();
        if (activeObjectId == null) return;
        const updater = (arr: SceneObj[]) =>
          arr.map((o) => (o.id === activeObjectId ? { ...o, ...patch } : o));
        (get().setSceneObjectsWithFit as any)(updater);
      },

      updateMeshSlab: (index, patch) => {
        const { carKey, userCars } = get();
        const isUserCar = !!userCars[carKey];
        if (!isUserCar) return;
        const curr = userCars[carKey];
        if (
          !curr ||
          curr.bootShapeMode !== 'mesh' ||
          !curr.bootMesh ||
          !Array.isArray(curr.bootMesh.slabs)
        )
          return;
        const slabs = curr.bootMesh.slabs.map((s: any, i: number) =>
          i === index ? { ...s, ...patch } : s
        );
        const nextCar = { ...curr, bootMesh: { slabs } };
        set({ userCars: { ...userCars, [carKey]: nextCar } });
      },

      bananaPack: () => {
        const state = get();
        const car = state.car;
        const shelfIn = state.shelfIn;
        const getItem = (k: string) => (PRESET_ITEMS as any)[k] || (state.userItems as any)[k];
        const packed = packBananaBoxes(car, shelfIn, getItem) as any[];
        checkAllCollisionsAndFit(packed as any, car, shelfIn, getItem);
        set({ sceneObjects: packed as any, activeObjectId: packed.length ? packed[0].id : null });
      },

      loadFromSharedHash: () => {
        try {
          if (!window.location.hash.startsWith('#s=')) return false;
          const enc = window.location.hash.slice(3);
          const json = decodeURIComponent(escape(atob(enc)));
          const shared = JSON.parse(json);
          if (!shared) return false;
          const nextKey = shared.carKey || 'ENYAQ';
          const nextUserCars = shared.userCars || {};
          set({
            carKey: nextKey,
            shelfIn: typeof shared.shelfIn === 'boolean' ? shared.shelfIn : true,
            userCars: nextUserCars,
            userItems: shared.userItems || {},
            car: (PRESET_CARS as any)[nextKey] || (nextUserCars as any)[nextKey],
          });
          if (Array.isArray(shared.sceneObjects)) {
            const carCfg =
              (PRESET_CARS as any)[shared.carKey] || (shared.userCars || {})[shared.carKey];
            const getItem = (k: string) => (PRESET_ITEMS as any)[k] || (shared.userItems || {})[k];
            const cloned = shared.sceneObjects.map((o: any) => ({ ...o }));
            if (carCfg) checkAllCollisionsAndFit(cloned, carCfg, !!shared.shelfIn, getItem);
            set({ sceneObjects: cloned });
          }
          if (shared.activeObjectId !== undefined) set({ activeObjectId: shared.activeObjectId });
          if (shared.camera?.pos || shared.camera?.target)
            set({
              cameraPos: shared.camera?.pos || null,
              cameraTarget: shared.camera?.target || null,
            });
          try {
            const urlNoHash = `${window.location.pathname}${window.location.search}`;
            window.history.replaceState(null, '', urlNoHash);
          } catch {}
          return true;
        } catch {
          return false;
        }
      },

      resetAll: () => {
        try {
          localStorage.removeItem('bootFitCheckerState');
        } catch {}
        set({
          carKey: 'ENYAQ',
          shelfIn: true,
          userCars: {},
          userItems: {},
          sceneObjects: [],
          activeObjectId: null,
          cameraPos: null,
          cameraTarget: null,
          showGizmo: false,
          meshEditMode: false,
          car: (PRESET_CARS as any)['ENYAQ'],
        });
      },

      generateShareLink: () => {
        const state = get();
        const {
          carKey,
          shelfIn,
          userCars,
          userItems,
          activeObjectId,
          showGizmo,
          cameraPos,
          cameraTarget,
          sceneObjects,
        } = state as any;
        const stateToSave = {
          carKey,
          shelfIn,
          userCars,
          userItems,
          activeObjectId,
          showGizmoEnabled: showGizmo,
          camera: cameraPos || cameraTarget ? { pos: cameraPos, target: cameraTarget } : undefined,
          sceneObjects: sceneObjects.map((o: any) => ({
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
      },

      applyLoadedState: (payload) => {
        try {
          if (!payload || typeof payload !== 'object') return;
          const toSet: any = {};
          if (payload.carKey) toSet.carKey = payload.carKey;
          if (typeof payload.shelfIn === 'boolean') toSet.shelfIn = payload.shelfIn;
          if (payload.userCars) toSet.userCars = payload.userCars;
          if (payload.userItems) toSet.userItems = payload.userItems;
          if (payload.activeObjectId !== undefined) toSet.activeObjectId = payload.activeObjectId;
          if (Object.keys(toSet).length) set(toSet);
          if (Array.isArray(payload.sceneObjects))
            get().setSceneObjectsWithFit(payload.sceneObjects as any);
        } catch {}
      },

      // Item modal + user item CRUD
      openNewItemModal: () => set({ itemModalOpen: true, editItemKey: null }),
      openEditItemModal: (key) => set({ itemModalOpen: true, editItemKey: key }),
      closeItemModal: () => set({ itemModalOpen: false }),
      saveUserItem: (item, key) => {
        const { userItems } = get();
        const k = key || `user_${Date.now()}`;
        set({ userItems: { ...userItems, [k]: item }, itemModalOpen: false, editItemKey: null });
      },
      deleteUserItem: (key) => {
        const { userItems } = get();
        const { [key]: _omit, ...rest } = userItems as any;
        set({ userItems: rest, itemModalOpen: false, editItemKey: null });
      },

      // Scene object CRUD
      addItemByKey: (itemKey) => {
        const state = get();
        const car = state.car;
        const cfg = (PRESET_ITEMS as any)[itemKey] || (state.userItems as any)[itemKey];
        if (!cfg || !car) return;
        const id = Date.now();
        const newObj: SceneObj = {
          id,
          itemKey,
          name: `${cfg.name} #${(state.sceneObjects?.length || 0) + 1}`,
          position: { x: car.W / 2, y: (cfg.T || 0) / 2, z: car.D / 2 },
          rotation: { yaw: 0, pitch: 0, roll: 0 },
          snapToFloor: true,
          isColliding: false,
          fitStatus: 'Checking...',
        } as any;
        state.setSceneObjectsWithFit([...(state.sceneObjects as any), newObj] as any);
        set({ activeObjectId: id });
      },
      renameObject: (id, name) => {
        const updater = (arr: SceneObj[]) => arr.map((o) => (o.id === id ? { ...o, name } : o));
        (get().setSceneObjectsWithFit as any)(updater);
      },
      deleteObject: (id) => {
        const state = get();
        const next = state.sceneObjects.filter((o) => o.id !== id);
        state.setSceneObjectsWithFit(next as any);
        if (state.activeObjectId === id) set({ activeObjectId: null });
      },
      duplicateObject: (id) => {
        const state = get();
        const src = state.sceneObjects.find((o) => o.id === id);
        if (!src) return;
        const newId = Date.now();
        const newObj = {
          ...src,
          id: newId,
          name: `${src.name} (copy)`,
          position: { ...src.position, x: src.position.x + 3, z: src.position.z + 3 },
        } as any;
        state.setSceneObjectsWithFit([...(state.sceneObjects as any), newObj] as any);
        set({ activeObjectId: newId });
      },
      recenterSelected: () => {
        const state = get();
        const { activeObjectId } = state;
        if (activeObjectId == null) return;
        const carCfg = state.car;
        const obj = state.sceneObjects.find((o) => o.id === activeObjectId);
        if (!obj || !carCfg) return;
        const dims =
          (PRESET_ITEMS as any)[obj.itemKey] || (state.userItems as any)[obj.itemKey] || {};
        let y = obj.position?.y || 0;
        if (obj.snapToFloor && dims) y = (dims.T || 0) / 2;
        const updater = (arr: SceneObj[]) =>
          arr.map((o) =>
            o.id === activeObjectId
              ? ({
                  ...o,
                  position: { x: carCfg.W / 2, y, z: carCfg.D / 2 },
                  rotation: { yaw: 0, pitch: 0, roll: 0 },
                } as any)
              : o
          );
        (state.setSceneObjectsWithFit as any)(updater);
      },
    }),
    { name: 'bootFitCheckerState' }
  )
);

// Selectors for memoized/derived reads
export const selectActiveObject = (s: AppState) =>
  s.sceneObjects.find((o) => o.id === s.activeObjectId) || null;
export const selectActiveDims = (s: AppState) => {
  const obj = s.sceneObjects.find((o) => o.id === s.activeObjectId);
  if (!obj) return null;
  return (PRESET_ITEMS as any)[obj.itemKey] || (s.userItems as any)[obj.itemKey] || null;
};
export const selectCamera = (s: AppState) => ({ pos: s.cameraPos, target: s.cameraTarget });
export const selectCarShelfHeight = (s: AppState) => {
  const car = s.car || ({} as any);
  return s.shelfIn ? car.H_shelf_in : car.H_shelf_out;
};
