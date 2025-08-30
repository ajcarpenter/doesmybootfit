import React from 'react';
import { useStore, selectActiveObject } from '../../../store/store';
import { useObjectControls } from '../../../hooks/useObjectControls';
import { PRESET_ITEMS } from '../../../config/items';

const SnapRotationToggle: React.FC = () => {
  const obj = useStore(selectActiveObject);
  const setSceneObjectsWithFit = useStore((s) => s.setSceneObjectsWithFit);
  const userItems = useStore((s) => s.userItems);
  const car = useStore((s) => s.car);
  const shelfIn = useStore((s) => s.shelfIn);
  const { getProjectedHalfY } = useObjectControls();
  const [snapRot, setSnapRot] = React.useState(!!obj?.snapRot);
  React.useEffect(() => {
    setSnapRot(!!obj?.snapRot);
  }, [obj?.snapRot]);

  const onChange = (next: boolean) => {
    setSnapRot(next);
    if (!obj || !car) return;
    const dims = (PRESET_ITEMS as any)[obj.itemKey] || (userItems as any)[obj.itemKey];
    const quant = (a: number) => Math.round(a / 90) * 90;
    let patch: any = { snapRot: next };
    if (next && obj) {
      const newRot = {
        yaw: quant(obj.rotation.yaw),
        pitch: quant(obj.rotation.pitch),
        roll: quant(obj.rotation.roll),
      };
      if (obj.snapToFloor && dims) {
        const phY = getProjectedHalfY(dims, newRot);
        const H = (shelfIn ? car.H_shelf_in : car.H_shelf_out) || dims.T || 0;
        const y = Math.max(phY, Math.min(obj.position.y, H - phY));
        patch = { ...patch, rotation: newRot, position: { ...obj.position, y } };
      } else {
        patch = { ...patch, rotation: newRot };
      }
    }
    setSceneObjectsWithFit((arr: any[]) =>
      arr.map((o) => (o.id === obj.id ? { ...o, ...patch } : o))
    );
  };

  return (
    <div className="toggle-group" style={{ marginBottom: '0.75rem' }}>
      <label htmlFor="snapRot">Snap rotations to 90°</label>
      <label className="toggle-switch">
        <input
          id="snapRot"
          type="checkbox"
          checked={snapRot}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider"></span>
      </label>
    </div>
  );
};

export default SnapRotationToggle;
