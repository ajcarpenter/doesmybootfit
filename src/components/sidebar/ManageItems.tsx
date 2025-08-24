import React from 'react';
import Typeahead from '../Typeahead';
import { PRESET_ITEMS } from '../../config/items';
import type { SceneObject } from '../../types';

interface Props {
  carW: number;
  carD: number;
  userItems: Record<string, any>;
  sceneObjects: SceneObject[];
  setSceneObjects: (objs: SceneObject[] | ((prev: SceneObject[]) => SceneObject[])) => void;
  activeObjectId: number | null;
  setActiveObjectId: (id: number | null) => void;
  onAddCustomItem?: () => void;
  onRecenterSelected?: () => void;
}

const ManageItems: React.FC<Props> = ({ carW, carD, userItems, sceneObjects, setSceneObjects, activeObjectId, setActiveObjectId, onAddCustomItem, onRecenterSelected }) => {
  const [itemInput, setItemInput] = React.useState('');

  const itemOptions = [
    ...Object.entries(PRESET_ITEMS).map(([key, i]) => ({ key, name: (i as any).name })),
    ...Object.entries(userItems).map(([key, i]) => ({ key, name: (i as any).name })),
  ];

  function handleAddItem(key: string) {
    const config = (PRESET_ITEMS as any)[key] || (userItems as any)[key];
    if (!config) return;
    const id = Date.now();
    const newObj: SceneObject = {
      id,
      itemKey: key,
      name: `${config.name} #${sceneObjects.length + 1}`,
      position: { x: carW / 2, y: config.T / 2, z: carD / 2 },
      rotation: { yaw: 0, pitch: 0, roll: 0 },
      snapToFloor: true,
      isColliding: false,
      fitStatus: 'Checking...'
    };
    setSceneObjects([...(sceneObjects as any), newObj] as any);
    setActiveObjectId(id);
    setItemInput('');
  }

  function handleRename(id: number, name: string) {
    setSceneObjects(sceneObjects.map(o => (o.id === id ? { ...o, name } : (o as any))) as any);
  }
  function handleDelete(id: number) {
    setSceneObjects(sceneObjects.filter(o => o.id !== id) as any);
    if (activeObjectId === id) setActiveObjectId(null);
  }

  function handleDuplicate(id: number) {
    const source = sceneObjects.find(o => o.id === id);
    if (!source) return;
    const newId = Date.now();
    // Name: append (copy) for clarity
    const newName = `${source.name} (copy)`;
    // Slight offset so it's visible; user can adjust if near bounds
    const newPos = {
      x: source.position.x + 3,
      y: source.position.y,
      z: source.position.z + 3,
    };
    const newObj: SceneObject = {
      ...source,
      id: newId,
      name: newName,
      position: newPos,
      // fit flags will be recomputed by App's rAF pipeline
    } as SceneObject;
    setSceneObjects([...(sceneObjects as any), newObj] as any);
    setActiveObjectId(newId);
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
        <div className="object-list" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '0.75rem' }}>
          {sceneObjects.map(obj => {
            const isActive = activeObjectId === obj.id;
            return (
              <div key={obj.id} className={`object-row${isActive ? ' active' : ''}`} aria-selected={isActive} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`active-tick${isActive ? ' on' : ''}`} title={isActive ? 'Selected' : ''} aria-hidden="true">✓</span>
                <input value={obj.name} onChange={e => handleRename(obj.id, e.target.value)} style={{ flex: 1, minWidth: 0 }} />
                <button className="btn" title={isActive ? 'Selected' : 'Select'} onClick={() => setActiveObjectId(obj.id)} disabled={isActive}>●</button>
                <button className="btn" title="Duplicate" onClick={() => handleDuplicate(obj.id)}>⧉</button>
                <button className="btn danger" title="Delete" onClick={() => handleDelete(obj.id)}>✕</button>
              </div>
            );
          })}
        </div>
      )}
      <div className="button-group button-group-margin">
        <button className="btn" onClick={onAddCustomItem}>+ Add Custom Item</button>
      </div>
      <div className="button-group button-group-margin" style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
        <button className="btn" onClick={onRecenterSelected} disabled={activeObjectId == null} style={{ flex: 1 }}>Recenter</button>
      </div>
    </section>
  );
};

export default ManageItems;
