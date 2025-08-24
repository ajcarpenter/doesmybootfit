import React, { useState, useEffect } from 'react';
import type { CarConfig } from '../config/cars';

interface CarModalProps {
  open: boolean;
  initialCar?: Partial<CarConfig & { key?: string }>;
  onSave: (car: CarConfig, key?: string) => void;
  onDelete?: (key: string) => void;
  onClose: () => void;
  isEdit?: boolean;
}

const CarModal: React.FC<CarModalProps> = ({ open, initialCar, onSave, onDelete, onClose, isEdit }) => {
  const [name, setName] = useState(initialCar?.name || '');
  const [W, setW] = useState(initialCar?.W || 100);
  const [D, setD] = useState(initialCar?.D || 70);
  const [hasShelf, setHasShelf] = useState<boolean>(() =>
    initialCar?.H_shelf_in != null && initialCar?.H_shelf_out != null
      ? initialCar.H_shelf_in !== initialCar.H_shelf_out
      : true
  );
  const [H_shelf_in, setHIn] = useState(initialCar?.H_shelf_in ?? 40);
  const [H_shelf_out, setHOut] = useState(initialCar?.H_shelf_out ?? 60);
  const [singleH, setSingleH] = useState<number>(initialCar?.H_shelf_in ?? initialCar?.H_shelf_out ?? 50);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(initialCar?.name || '');
    setW(initialCar?.W || 100);
    setD(initialCar?.D || 70);
    const inH = initialCar?.H_shelf_in ?? 40;
    const outH = initialCar?.H_shelf_out ?? 60;
    setHasShelf((initialCar?.H_shelf_in != null && initialCar?.H_shelf_out != null) ? inH !== outH : true);
    setHIn(inH);
    setHOut(outH);
    setSingleH(initialCar?.H_shelf_in ?? initialCar?.H_shelf_out ?? 50);
    setError('');
  }, [initialCar, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name required');
    if (W <= 0 || D <= 0) return setError('All dimensions must be positive');
    if (hasShelf) {
      if (H_shelf_in <= 0 || H_shelf_out <= 0) return setError('All dimensions must be positive');
      onSave({ name, W, D, H_shelf_in, H_shelf_out }, initialCar?.key);
    } else {
      if (singleH <= 0) return setError('All dimensions must be positive');
      onSave({ name, W, D, H_shelf_in: singleH, H_shelf_out: singleH }, initialCar?.key);
    }
  };

  return open ? (
    <div className="modal-overlay" style={{ display: 'block' }}>
      <div className="modal-content">
        <h3>{isEdit ? 'Edit Car' : 'Add Car'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="input-group"><label>Name<input value={name} onChange={e => setName(e.target.value)} /></label></div>
          <div className="input-group"><label>Width (cm)<input type="number" value={W} onChange={e => setW(Number(e.target.value))} /></label></div>
          <div className="input-group"><label>Depth (cm)<input type="number" value={D} onChange={e => setD(Number(e.target.value))} /></label></div>
          <div className="toggle-group" style={{ margin: '0.5rem 0' }}>
            <label htmlFor="hasShelfToggle">Has removable parcel shelf</label>
            <label className="toggle-switch">
              <input id="hasShelfToggle" type="checkbox" checked={hasShelf} onChange={e => setHasShelf(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
          {hasShelf ? (
            <>
              <div className="input-group"><label>Height (shelf in, cm)<input type="number" value={H_shelf_in} onChange={e => setHIn(Number(e.target.value))} /></label></div>
              <div className="input-group"><label>Height (shelf out, cm)<input type="number" value={H_shelf_out} onChange={e => setHOut(Number(e.target.value))} /></label></div>
            </>
          ) : (
            <div className="input-group"><label>Height (cm)<input type="number" value={singleH} onChange={e => setSingleH(Number(e.target.value))} /></label></div>
          )}
          {error && <div className="badge red" style={{ marginBottom: 8 }}>{error}</div>}
          <div className="button-group">
            <button type="submit" className="btn primary">{isEdit ? 'Save' : 'Add'}</button>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            {isEdit && onDelete && initialCar?.key && (
              <button type="button" className="btn danger" onClick={() => onDelete(initialCar.key!)}>Delete</button>
            )}
          </div>
        </form>
      </div>
    </div>
  ) : null;
};

export default CarModal;
