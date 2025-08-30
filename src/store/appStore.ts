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

  // derived
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
  updateMeshSlab: (index: number, patch: any) => void;
  bananaPack: () => void;
  loadFromSharedHash: () => boolean; // returns true if loaded shared
}

export const useAppStore = create<AppState>()(
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

      get car() {
        const { carKey, userCars } = get();
        return (PRESET_CARS as any)[carKey] || userCars[carKey];
      },

      setCarKey: (k) => set({ carKey: k }),
      setShelfIn: (v) => set({ shelfIn: v }),
      setUserCars: (v) => set({ userCars: v }),
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
          set({
            carKey: shared.carKey || 'ENYAQ',
            shelfIn: typeof shared.shelfIn === 'boolean' ? shared.shelfIn : true,
            userCars: shared.userCars || {},
            userItems: shared.userItems || {},
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
    }),
    { name: 'bootFitCheckerState' }
  )
);
