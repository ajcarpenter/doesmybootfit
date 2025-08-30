import React from 'react';
import { useStore } from '../../../store/store';
import { PRESET_ITEMS } from '../../../config/items';
import { selectActiveObject } from '../../../store/store';

const PositionSliders: React.FC = () => {
  const active = useStore(selectActiveObject);
  const car = useStore((s) => s.car);
  const setSceneObjectsWithFit = useStore((s) => s.setSceneObjectsWithFit);
  const shelfIn = useStore((s) => s.shelfIn);
  const userItems = useStore((s) => s.userItems);

  const obj = active;
  const dims = obj ? (PRESET_ITEMS as any)[obj.itemKey] || (userItems as any)[obj.itemKey] : null;
  if (!obj || !dims || !car) return null;

  const selectedCarHeight = shelfIn ? car.H_shelf_in : car.H_shelf_out;
  const clampX = (x: number) => {
    const halfW = dims.W / 2;
    return Math.max(halfW, Math.min(x, car.W - halfW));
  };
  const clampZ = (z: number) => {
    const halfL = dims.L / 2;
    return Math.max(halfL, Math.min(z, car.D - halfL));
  };
  const clampY = (y: number) => {
    const half = dims.T / 2;
    const H = selectedCarHeight || dims.T;
    return Math.max(half, Math.min(y, H - half));
  };

  return (
    <>
      <label>
        X
        <input
          type="number"
          value={obj.position.x.toFixed(1)}
          onChange={(e) =>
            setSceneObjectsWithFit((arr: any[]) =>
              arr.map((o) =>
                o.id === obj.id
                  ? {
                      ...o,
                      position: { ...o.position, x: clampX(parseFloat(e.target.value) || 0) },
                    }
                  : o
              )
            )
          }
        />
      </label>
      <input
        type="range"
        min={dims.W / 2}
        max={car.W - dims.W / 2}
        step={0.5}
        value={obj.position.x}
        onChange={(e) =>
          setSceneObjectsWithFit((arr: any[]) =>
            arr.map((o) =>
              o.id === obj.id
                ? { ...o, position: { ...o.position, x: clampX(parseFloat(e.target.value)) } }
                : o
            )
          )
        }
      />

      <label>
        Z
        <input
          type="number"
          value={obj.position.z.toFixed(1)}
          onChange={(e) =>
            setSceneObjectsWithFit((arr: any[]) =>
              arr.map((o) =>
                o.id === obj.id
                  ? {
                      ...o,
                      position: { ...o.position, z: clampZ(parseFloat(e.target.value) || 0) },
                    }
                  : o
              )
            )
          }
        />
      </label>
      <input
        type="range"
        min={dims.L / 2}
        max={car.D - dims.L / 2}
        step={0.5}
        value={obj.position.z}
        onChange={(e) =>
          setSceneObjectsWithFit((arr: any[]) =>
            arr.map((o) =>
              o.id === obj.id
                ? { ...o, position: { ...o.position, z: clampZ(parseFloat(e.target.value)) } }
                : o
            )
          )
        }
      />

      <label>
        Y
        <input
          type="number"
          value={obj.position.y.toFixed(1)}
          disabled={!!obj.snapToFloor}
          title={obj.snapToFloor ? 'Disable Snap to floor to edit Y' : undefined}
          onChange={(e) =>
            setSceneObjectsWithFit((arr: any[]) =>
              arr.map((o) =>
                o.id === obj.id
                  ? {
                      ...o,
                      snapToFloor: false,
                      position: { ...o.position, y: clampY(parseFloat(e.target.value) || 0) },
                    }
                  : o
              )
            )
          }
        />
      </label>
      <input
        type="range"
        min={dims.T / 2}
        max={(selectedCarHeight || dims.T) - dims.T / 2}
        step={0.5}
        value={obj.position.y}
        disabled={!!obj.snapToFloor}
        title={obj.snapToFloor ? 'Disable Snap to floor to edit Y' : undefined}
        onChange={(e) =>
          setSceneObjectsWithFit((arr: any[]) =>
            arr.map((o) =>
              o.id === obj.id
                ? {
                    ...o,
                    snapToFloor: false,
                    position: { ...o.position, y: clampY(parseFloat(e.target.value)) },
                  }
                : o
            )
          )
        }
      />
    </>
  );
};

export default PositionSliders;
