import React from 'react';
import { useStore, selectActiveObject } from '../../../store/store';
import { useObjectControls } from '../../../hooks/useObjectControls';
import { PRESET_ITEMS } from '../../../config/items';

const SnapToFloorToggle: React.FC = () => {
  const obj = useStore(selectActiveObject);
  const setSceneObjectsWithFit = useStore((s) => s.setSceneObjectsWithFit);
  const userItems = useStore((s) => s.userItems);
  const car = useStore((s) => s.car);
  const shelfIn = useStore((s) => s.shelfIn);
  const { getProjectedHalfY } = useObjectControls();

  const checked = !!obj?.snapToFloor;
  const dims = obj ? (PRESET_ITEMS as any)[obj.itemKey] || (userItems as any)[obj.itemKey] : null;

  const toggle = (next: boolean) => {
    if (!obj || !car) return;
    if (next) {
      if (!dims) return;
      const phY = getProjectedHalfY(dims, obj.rotation);
      const H = (shelfIn ? car.H_shelf_in : car.H_shelf_out) || dims.T || 0;
      const y = Math.max(phY, Math.min(phY, H - phY));
      setSceneObjectsWithFit((arr: any[]) =>
        arr.map((o) =>
          o.id === obj.id ? { ...o, snapToFloor: true, position: { ...o.position, y } } : o
        )
      );
    } else {
      setSceneObjectsWithFit((arr: any[]) =>
        arr.map((o) => (o.id === obj.id ? { ...o, snapToFloor: false } : o))
      );
    }
  };

  if (!obj) return null;

  return (
    <div className="toggle-group" style={{ marginBottom: '0.75rem' }}>
      <label htmlFor="snapToFloor">Snap to floor</label>
      <label className="toggle-switch">
        <input
          id="snapToFloor"
          type="checkbox"
          checked={checked}
          onChange={(e) => toggle(e.target.checked)}
        />
        <span className="slider"></span>
      </label>
    </div>
  );
};

export default SnapToFloorToggle;
