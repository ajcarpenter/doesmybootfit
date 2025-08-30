import React from 'react';
import { useStore } from '../../../store/store';
import { useObjectControls } from '../../../hooks/useObjectControls';
import { PRESET_ITEMS } from '../../../config/items';
import { selectActiveObject } from '../../../store/store';

const RotationSliders: React.FC = () => {
  const obj = useStore(selectActiveObject);
  const setSceneObjectsWithFit = useStore((s) => s.setSceneObjectsWithFit);
  const userItems = useStore((s) => s.userItems);
  const shelfIn = useStore((s) => s.shelfIn);
  const car = useStore((s) => s.car);
  const { getProjectedHalfY, quantize } = useObjectControls();
  const dims = obj ? (PRESET_ITEMS as any)[obj.itemKey] || (userItems as any)[obj.itemKey] : null;
  if (!obj || !dims || !car) return null;

  const selectedCarHeight = shelfIn ? car.H_shelf_in : car.H_shelf_out;
  const clampYToBootByProjHalfY = (yDesired: number, projHalfY: number) => {
    const H = selectedCarHeight || dims.T || 0;
    return Math.max(projHalfY, Math.min(yDesired, H - projHalfY));
  };

  const onChangeAxis = (axis: 'yaw' | 'pitch' | 'roll', v: number) => {
    const nextVal = quantize(v, !!obj.snapRot);
    if (obj.snapToFloor) {
      const phY = getProjectedHalfY(dims, { ...obj.rotation, [axis]: nextVal } as any);
      const y = clampYToBootByProjHalfY(phY, phY);
      setSceneObjectsWithFit((arr: any[]) =>
        arr.map((o) =>
          o.id === obj.id
            ? { ...o, rotation: { ...o.rotation, [axis]: nextVal }, position: { ...o.position, y } }
            : o
        )
      );
    } else {
      setSceneObjectsWithFit((arr: any[]) =>
        arr.map((o) =>
          o.id === obj.id ? { ...o, rotation: { ...o.rotation, [axis]: nextVal } } : o
        )
      );
    }
  };

  return (
    <>
      <label>
        Yaw
        <input
          type="number"
          value={obj.rotation.yaw}
          onChange={(e) => onChangeAxis('yaw', Number(e.target.value))}
        />
      </label>
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={obj.rotation.yaw}
        onChange={(e) => onChangeAxis('yaw', Number(e.target.value))}
      />

      <label>
        Pitch
        <input
          type="number"
          value={obj.rotation.pitch}
          onChange={(e) => onChangeAxis('pitch', Number(e.target.value))}
        />
      </label>
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={obj.rotation.pitch}
        onChange={(e) => onChangeAxis('pitch', Number(e.target.value))}
      />

      <label>
        Roll
        <input
          type="number"
          value={obj.rotation.roll}
          onChange={(e) => onChangeAxis('roll', Number(e.target.value))}
        />
      </label>
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={obj.rotation.roll}
        onChange={(e) => onChangeAxis('roll', Number(e.target.value))}
      />
    </>
  );
};

export default RotationSliders;
