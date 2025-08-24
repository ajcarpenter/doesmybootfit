import React from 'react';
import type { ItemDims, SceneObject, CarDims } from '../../types';
import { useObjectControls } from '../../hooks/useObjectControls';

interface Props {
  activeObj: SceneObject;
  activeDims: ItemDims;
  car: CarDims;
  shelfIn: boolean;
  updateActive: (patch: Partial<SceneObject>) => void;
}

const ObjectControls: React.FC<Props> = ({ activeObj, activeDims, car, shelfIn, updateActive }) => {
  const { getProjectedHalfY, quantize } = useObjectControls();
  const [snapRot, setSnapRot] = React.useState(!!activeObj.snapRot);

  const selectedCarHeight = shelfIn ? car.H_shelf_in : car.H_shelf_out;

  function clampYToBootByProjHalfY(yDesired: number, projHalfY: number) {
    const H = selectedCarHeight || activeDims?.T || 0;
    return Math.max(projHalfY, Math.min(yDesired, H - projHalfY));
  }
  function clampX(x: number) {
    const halfW = activeDims.W / 2;
    return Math.max(halfW, Math.min(x, car.W - halfW));
  }
  function clampZ(z: number) {
    const halfL = activeDims.L / 2;
    return Math.max(halfL, Math.min(z, car.D - halfL));
  }
  function clampY(y: number) {
    const half = activeDims.T / 2;
    const H = selectedCarHeight || activeDims.T;
    return Math.max(half, Math.min(y, H - half));
  }

  return (
    <section className="section">
      <h3>Object Controls</h3>
      <div className="toggle-group" style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="snapRot">Snap rotations to 90°</label>
        <label className="toggle-switch">
          <input
            id="snapRot"
            type="checkbox"
            checked={snapRot}
            onChange={e => {
              const next = e.target.checked;
              setSnapRot(next);
              if (next && activeObj) {
                const quant = (a: number) => Math.round(a / 90) * 90;
                const newRot = {
                  yaw: quant(activeObj.rotation.yaw),
                  pitch: quant(activeObj.rotation.pitch),
                  roll: quant(activeObj.rotation.roll),
                };
                if (activeObj.snapToFloor && activeDims) {
                  const phY = getProjectedHalfY(activeDims, newRot);
                  const y = clampYToBootByProjHalfY(phY, phY);
                  updateActive({ rotation: newRot, position: { ...activeObj.position, y } });
                } else {
                  updateActive({ rotation: newRot });
                }
              }
              updateActive({ snapRot: next });
            }}
          />
          <span className="slider"></span>
        </label>
      </div>
      <div className="toggle-group" style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="snapToFloor">Snap to floor</label>
        <label className="toggle-switch">
          <input
            id="snapToFloor"
            type="checkbox"
            checked={!!activeObj.snapToFloor}
            onChange={e => {
              const next = e.target.checked;
              if (next) {
                const phY = getProjectedHalfY(activeDims, activeObj.rotation);
                const y = clampYToBootByProjHalfY(phY, phY);
                updateActive({ snapToFloor: true, position: { ...activeObj.position, y } });
              } else {
                updateActive({ snapToFloor: false });
              }
            }}
          />
          <span className="slider"></span>
        </label>
      </div>
      <div className="slider-group">
        <label>
          X
          <input type="number" value={activeObj.position.x.toFixed(1)} onChange={e => updateActive({ position: { ...activeObj.position, x: clampX(parseFloat(e.target.value) || 0) } })} />
        </label>
        <input type="range" min={activeDims.W / 2} max={car.W - activeDims.W / 2} step={0.5} value={activeObj.position.x}
          onChange={e => updateActive({ position: { ...activeObj.position, x: clampX(parseFloat(e.target.value)) } })} />

        <label>
          Z
          <input type="number" value={activeObj.position.z.toFixed(1)} onChange={e => updateActive({ position: { ...activeObj.position, z: clampZ(parseFloat(e.target.value) || 0) } })} />
        </label>
        <input type="range" min={activeDims.L / 2} max={car.D - activeDims.L / 2} step={0.5} value={activeObj.position.z}
          onChange={e => updateActive({ position: { ...activeObj.position, z: clampZ(parseFloat(e.target.value)) } })} />

        <label>
          Y
          <input type="number" value={activeObj.position.y.toFixed(1)} disabled={!!activeObj.snapToFloor} title={activeObj.snapToFloor ? 'Disable Snap to floor to edit Y' : undefined} onChange={e => updateActive({ snapToFloor: false, position: { ...activeObj.position, y: clampY(parseFloat(e.target.value) || 0) } })} />
        </label>
        <input type="range" min={activeDims.T / 2} max={(selectedCarHeight || activeDims.T) - activeDims.T / 2} step={0.5} value={activeObj.position.y} disabled={!!activeObj.snapToFloor}
          title={activeObj.snapToFloor ? 'Disable Snap to floor to edit Y' : undefined}
          onChange={e => updateActive({ snapToFloor: false, position: { ...activeObj.position, y: clampY(parseFloat(e.target.value)) } })} />

        <label>
          Yaw
          <input type="number" value={activeObj.rotation.yaw} onChange={e => {
            const yaw = quantize(Number(e.target.value), snapRot);
            if (activeObj.snapToFloor) {
              const phY = getProjectedHalfY(activeDims, { ...activeObj.rotation, yaw });
              const y = clampYToBootByProjHalfY(phY, phY);
              updateActive({ rotation: { ...activeObj.rotation, yaw }, position: { ...activeObj.position, y } });
            } else {
              updateActive({ rotation: { ...activeObj.rotation, yaw } });
            }
          }} />
        </label>
        <input type="range" min={-180} max={180} step={1} value={activeObj.rotation.yaw}
          onChange={e => {
            const yaw = quantize(Number(e.target.value), snapRot);
            if (activeObj.snapToFloor) {
              const phY = getProjectedHalfY(activeDims, { ...activeObj.rotation, yaw });
              const y = clampYToBootByProjHalfY(phY, phY);
              updateActive({ rotation: { ...activeObj.rotation, yaw }, position: { ...activeObj.position, y } });
            } else {
              updateActive({ rotation: { ...activeObj.rotation, yaw } });
            }
          }} />

        <label>
          Pitch
          <input type="number" value={activeObj.rotation.pitch} onChange={e => {
            const pitch = quantize(Number(e.target.value), snapRot);
            if (activeObj.snapToFloor) {
              const phY = getProjectedHalfY(activeDims, { ...activeObj.rotation, pitch });
              const y = clampYToBootByProjHalfY(phY, phY);
              updateActive({ rotation: { ...activeObj.rotation, pitch }, position: { ...activeObj.position, y } });
            } else {
              updateActive({ rotation: { ...activeObj.rotation, pitch } });
            }
          }} />
        </label>
        <input type="range" min={-180} max={180} step={1} value={activeObj.rotation.pitch}
          onChange={e => {
            const pitch = quantize(Number(e.target.value), snapRot);
            if (activeObj.snapToFloor) {
              const phY = getProjectedHalfY(activeDims, { ...activeObj.rotation, pitch });
              const y = clampYToBootByProjHalfY(phY, phY);
              updateActive({ rotation: { ...activeObj.rotation, pitch }, position: { ...activeObj.position, y } });
            } else {
              updateActive({ rotation: { ...activeObj.rotation, pitch } });
            }
          }} />

        <label>
          Roll
          <input type="number" value={activeObj.rotation.roll} onChange={e => {
            const roll = quantize(Number(e.target.value), snapRot);
            if (activeObj.snapToFloor) {
              const phY = getProjectedHalfY(activeDims, { ...activeObj.rotation, roll });
              const y = clampYToBootByProjHalfY(phY, phY);
              updateActive({ rotation: { ...activeObj.rotation, roll }, position: { ...activeObj.position, y } });
            } else {
              updateActive({ rotation: { ...activeObj.rotation, roll } });
            }
          }} />
        </label>
        <input type="range" min={-180} max={180} step={1} value={activeObj.rotation.roll}
          onChange={e => {
            const roll = quantize(Number(e.target.value), snapRot);
            if (activeObj.snapToFloor) {
              const phY = getProjectedHalfY(activeDims, { ...activeObj.rotation, roll });
              const y = clampYToBootByProjHalfY(phY, phY);
              updateActive({ rotation: { ...activeObj.rotation, roll }, position: { ...activeObj.position, y } });
            } else {
              updateActive({ rotation: { ...activeObj.rotation, roll } });
            }
          }} />
      </div>
    </section>
  );
};

export default ObjectControls;
