import React from 'react';
import { PRESET_CARS } from './config/cars';
import { PRESET_ITEMS } from './config/items';
import ItemModal from './components/ItemModal';
import ObjectControls from './components/sidebar/ObjectControls';
import ManageItems from './components/sidebar/ManageItems';
import ShareBackup from './components/sidebar/ShareBackup';
import FitStatus from './components/sidebar/FitStatus';
import CarSection from './components/sidebar/CarSection';

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
  // Modal state
  const [itemModalOpen, setItemModalOpen] = React.useState(false);
  const [editItemKey, setEditItemKey] = React.useState<string | null>(null);

  // Item options handled in ManageItems

  // car selection handled in CarSection
  // Item add/rename/delete handled in ManageItems
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
  const activeObj = sceneObjects.find(o => o.id === activeObjectId);
  const activeDims = activeObj ? (PRESET_ITEMS[activeObj.itemKey] || userItems[activeObj.itemKey]) : null;
  function updateActive(patch: any) {
    if (!activeObj) return;
    setSceneObjects(sceneObjects.map(o => o.id === activeObj.id ? { ...o, ...patch } : o));
  }
  // Object control math moved into ObjectControls

  // Modal handlers
  // car CRUD handled in CarSection
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

  // AdSense handled in AdUnit component

  return (
    <>
      <aside className="sidebar">
        <header className="section">
          <div className="logo-container">
            <img src="/logo.png" alt="Does My Boot Fit Logo" className="logo-img" />
          </div>
          <FitStatus activeObjectId={activeObjectId} sceneObjects={sceneObjects} />
          <p className="description">Use mouse to orbit and scroll to zoom. Drag an item to move it on the floor.</p>
        </header>
        <CarSection
          carKey={carKey}
          setCarKey={setCarKey}
          shelfIn={shelfIn}
          setShelfIn={setShelfIn}
          userCars={userCars}
          setUserCars={setUserCars}
        />
        <ManageItems
          carW={(selectedCar as any)?.W}
          carD={(selectedCar as any)?.D}
          userItems={userItems}
          sceneObjects={sceneObjects as any}
          setSceneObjects={setSceneObjects as any}
          activeObjectId={activeObjectId}
          setActiveObjectId={setActiveObjectId}
          onAddCustomItem={handleAddCustomItem}
          onRecenterSelected={handleRecenterSelected}
        />
        {activeObj && activeDims && (
          <ObjectControls
            activeObj={activeObj as any}
            activeDims={activeDims as any}
            car={selectedCar as any}
            shelfIn={shelfIn}
            updateActive={(patch) => updateActive(patch)}
          />
        )}
  {/* Ads temporarily disabled until AdSense approval */}
        <ShareBackup
          exportJson={() => {
            try {
              const json = localStorage.getItem('bootFitCheckerState');
              const data = json ? JSON.parse(json) : {};
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'boot-fit-scene.json';
              a.click();
              URL.revokeObjectURL(url);
            } catch {}
          }}
          importJson={(payload) => applyLoadedState?.(payload)}
          copyLink={async () => {
            try {
              const link = generateShareLink?.();
              if (link) await navigator.clipboard.writeText(link);
            } catch {}
          }}
          reset={() => resetState?.()}
        />
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
  {/* Car modal is managed inside CarSection now */}
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
