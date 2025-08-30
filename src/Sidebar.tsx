import React from 'react';
// car config used in CarSection
import ItemModal from './components/ItemModal';
import ObjectControls from './components/sidebar/ObjectControls';
import ManageItems from './components/sidebar/ManageItems';
import ShareBackup from './components/sidebar/ShareBackup';
import SidebarHeader from './components/sidebar/SidebarHeader';
import SidebarFooter from './components/sidebar/SidebarFooter';
import CarSection from './components/sidebar/CarSection';
import { useStore } from './store/store';

const Sidebar: React.FC = () => {
  const userItems = useStore((s) => s.userItems);
  const sceneObjects = useStore((s) => s.sceneObjects);
  const activeObjectId = useStore((s) => s.activeObjectId);
  // Modal + CRUD from store
  const itemModalOpen = useStore((s) => s.itemModalOpen);
  const editItemKey = useStore((s) => s.editItemKey);
  const closeItemModal = useStore((s) => s.closeItemModal);
  const saveUserItem = useStore((s) => s.saveUserItem);
  const deleteUserItem = useStore((s) => s.deleteUserItem);
  const resetAll = useStore((s) => s.resetAll);
  const generateShareLink = useStore((s) => s.generateShareLink);
  const applyLoadedState = useStore((s) => s.applyLoadedState);

  // Disable shelf toggle if car has no removable shelf
  // Object control math moved into ObjectControls

  // Modal handlers
  // car CRUD handled in CarSection
  // item modal handlers now in store

  // AdSense handled in AdUnit component

  return (
    <>
      <aside className="sidebar">
        <SidebarHeader activeObjectId={activeObjectId} sceneObjects={sceneObjects} />
        <CarSection />
        <ManageItems />
        <ObjectControls />
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
          importJson={(payload) => applyLoadedState(payload)}
          copyLink={async () => {
            try {
              const link = generateShareLink();
              if (link) await navigator.clipboard.writeText(link);
            } catch {}
          }}
          reset={() => resetAll()}
        />
        <SidebarFooter />
      </aside>
      {/* Car modal is managed inside CarSection now */}
      <ItemModal
        open={itemModalOpen}
        initialItem={editItemKey ? { ...userItems[editItemKey], key: editItemKey } : undefined}
        onSave={(item, key) => saveUserItem(item as any, key)}
        onDelete={(key) => deleteUserItem(key as string)}
        onClose={closeItemModal}
        isEdit={!!editItemKey}
      />
    </>
  );
};

export default Sidebar;
