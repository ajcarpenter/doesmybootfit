import React, { useState, useEffect } from 'react';

interface ItemModalProps {
  open: boolean;
  initialItem?: Partial<{ name: string; L: number; W: number; T: number; key?: string }>;
  onSave: (item: { name: string; L: number; W: number; T: number }, key?: string) => void;
  onDelete?: (key: string) => void;
  onClose: () => void;
  isEdit?: boolean;
}

const ItemModal: React.FC<ItemModalProps> = ({ open, initialItem, onSave, onDelete, onClose, isEdit }) => {
  const [name, setName] = useState(initialItem?.name || '');
  const [L, setL] = useState(initialItem?.L || 40);
  const [W, setW] = useState(initialItem?.W || 30);
  const [T, setT] = useState(initialItem?.T || 20);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(initialItem?.name || '');
    setL(initialItem?.L || 40);
    setW(initialItem?.W || 30);
    setT(initialItem?.T || 20);
    setError('');
  }, [initialItem, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name required');
    if (L <= 0 || W <= 0 || T <= 0) return setError('All dimensions must be positive');
    onSave({ name, L, W, T }, initialItem?.key);
  };

  return open ? (
    <div className="modal-overlay" style={{ display: 'block' }}>
      <div className="modal-content">
        <h3>{isEdit ? 'Edit Item' : 'Add Item'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="input-group"><label>Name<input value={name} onChange={e => setName(e.target.value)} /></label></div>
          <div className="input-group"><label>Length (cm)<input type="number" value={L} onChange={e => setL(Number(e.target.value))} /></label></div>
          <div className="input-group"><label>Width (cm)<input type="number" value={W} onChange={e => setW(Number(e.target.value))} /></label></div>
          <div className="input-group"><label>Thickness (cm)<input type="number" value={T} onChange={e => setT(Number(e.target.value))} /></label></div>
          {error && <div className="badge red" style={{ marginBottom: 8 }}>{error}</div>}
          <div className="button-group">
            <button type="submit" className="btn primary">{isEdit ? 'Save' : 'Add'}</button>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            {isEdit && onDelete && initialItem?.key && (
              <button type="button" className="btn danger" onClick={() => onDelete(initialItem.key!)}>Delete</button>
            )}
          </div>
        </form>
      </div>
    </div>
  ) : null;
};

export default ItemModal;
