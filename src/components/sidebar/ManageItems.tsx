import React from 'react';
import Typeahead from '../Typeahead';
import { PRESET_ITEMS } from '../../config/items';
import { useStore } from '../../store/store';

const ManageItems: React.FC = () => {
  const userItems = useStore((s) => s.userItems);
  const sceneObjects = useStore((s) => s.sceneObjects);
  const activeObjectId = useStore((s) => s.activeObjectId);
  const setActiveObjectId = useStore((s) => s.setActiveObjectId);
  const addItemByKey = useStore((s) => s.addItemByKey);
  const renameObject = useStore((s) => s.renameObject);
  const deleteObject = useStore((s) => s.deleteObject);
  const duplicateObject = useStore((s) => s.duplicateObject);
  const openNewItemModal = useStore((s) => s.openNewItemModal);
  const recenterSelected = useStore((s) => s.recenterSelected);
  const [itemInput, setItemInput] = React.useState('');

  const itemOptions = [
    ...Object.entries(PRESET_ITEMS).map(([key, i]) => ({ key, name: (i as any).name })),
    ...Object.entries(userItems).map(([key, i]) => ({ key, name: (i as any).name })),
  ];

  function handleAddItem(key: string) {
    addItemByKey(key);
    setItemInput('');
  }

  function handleRename(id: number, name: string) {
    renameObject(id, name);
  }
  function handleDelete(id: number) {
    deleteObject(id);
  }

  function handleDuplicate(id: number) {
    duplicateObject(id);
  }

  return (
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
        <div
          className="object-list"
          style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '0.75rem' }}
        >
          {sceneObjects.map((obj) => {
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
                  onChange={(e) => handleRename(obj.id, e.target.value)}
                  style={{ flex: 1, minWidth: 0 }}
                />
                <button
                  className="btn"
                  title={isActive ? 'Selected' : 'Select'}
                  onClick={() => setActiveObjectId(obj.id)}
                  disabled={isActive}
                >
                  ●
                </button>
                <button className="btn" title="Duplicate" onClick={() => handleDuplicate(obj.id)}>
                  ⧉
                </button>
                <button className="btn danger" title="Delete" onClick={() => handleDelete(obj.id)}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="button-group button-group-margin">
        <button className="btn" onClick={openNewItemModal}>
          + Add Custom Item
        </button>
      </div>
      <div
        className="button-group button-group-margin"
        style={{ display: 'flex', gap: '0.5rem', width: '100%' }}
      >
        <button
          className="btn"
          onClick={recenterSelected}
          disabled={activeObjectId == null}
          style={{ flex: 1 }}
        >
          Recenter
        </button>
      </div>
    </section>
  );
};

export default ManageItems;
