import React from 'react';
import Typeahead from '../Typeahead';
import { PRESET_CARS } from '../../config/cars';
import CarModal from '../CarModal';

interface Props {
  carKey: string;
  setCarKey: (key: string) => void;
  shelfIn: boolean;
  setShelfIn: (v: boolean) => void;
  userCars: Record<string, any>;
  setUserCars: (cars: Record<string, any>) => void;
}

const CarSection: React.FC<Props> = ({ carKey, setCarKey, shelfIn, setShelfIn, userCars, setUserCars }) => {
  const [carInput, setCarInput] = React.useState('');
  const [carModalOpen, setCarModalOpen] = React.useState(false);
  const [editCarKey, setEditCarKey] = React.useState<string | null>(null);

  const carOptions = [
    ...Object.entries(PRESET_CARS).map(([key, c]) => ({ key, name: (c as any).name })),
    ...Object.entries(userCars).map(([key, c]) => ({ key, name: (c as any).name })),
  ];

  function handleCarSelect(key: string) {
    setCarKey(key);
    const cfg = PRESET_CARS[key] || userCars[key];
    setCarInput(cfg?.name || '');
  }

  React.useEffect(() => {
    const cfg = PRESET_CARS[carKey] || userCars[carKey];
    setCarInput(cfg?.name || '');
  }, [carKey, userCars]);

  function handleAddCustomCar() {
    setEditCarKey(null);
    setCarModalOpen(true);
  }
  function handleEditCar(key: string) {
    setEditCarKey(key);
    setCarModalOpen(true);
  }
  function handleSaveCar(car: any, key?: string) {
    const k = key || `user_${Date.now()}`;
    setUserCars({ ...userCars, [k]: car });
    setCarModalOpen(false);
    if (!key) setCarKey(k);
  }
  function handleDeleteCar(key: string) {
    const { [key]: _, ...rest } = userCars;
    setUserCars(rest);
    setCarModalOpen(false);
    if (carKey === key) setCarKey('ENYAQ');
  }

  const selectedCar = PRESET_CARS[carKey] || userCars[carKey];
  const hasRemovableShelf = selectedCar?.H_shelf_in !== selectedCar?.H_shelf_out;

  return (
    <section className="section">
      <h3>Car Model</h3>
      <div className="button-group">
        <Typeahead
          options={carOptions}
          placeholder="Search or select car..."
          onSelect={handleCarSelect}
          value={carInput}
          setValue={setCarInput}
          inputId="carSelectorInput"
          dropdownId="carSelectorDropdown"
          clearOnSelect={false}
        />
        <button className="btn" onClick={() => handleEditCar(carKey)} style={{ display: userCars[carKey] ? 'inline-block' : 'none' }}>Edit</button>
        <button className="btn danger" onClick={() => handleDeleteCar(carKey)} style={{ display: userCars[carKey] ? 'inline-block' : 'none' }}>Delete</button>
      </div>
      <div className="button-group button-group-margin">
        <button className="btn" onClick={handleAddCustomCar}>+ Add Custom Car</button>
      </div>
      <div className="input-grid input-grid-margin">
        <div className="input-group"><label>Width</label><input type="number" step="0.1" value={selectedCar?.W || ''} readOnly /></div>
        <div className="input-group"><label>Depth</label><input type="number" step="0.1" value={selectedCar?.D || ''} readOnly /></div>
        <div className="input-group"><label>Height</label><input type="number" step="0.1" value={shelfIn ? selectedCar?.H_shelf_in : selectedCar?.H_shelf_out || ''} readOnly /></div>
      </div>
      <div className="toggle-group toggle-group-margin">
        <label htmlFor="shelfToggle">Parcel Shelf In</label>
        <label className="toggle-switch">
          <input type="checkbox" id="shelfToggle" checked={shelfIn} disabled={!hasRemovableShelf} onChange={e => setShelfIn(e.target.checked)} />
          <span className="slider"></span>
        </label>
      </div>

      <CarModal
        open={carModalOpen}
        initialCar={editCarKey ? { ...userCars[editCarKey], key: editCarKey } : undefined}
        onSave={handleSaveCar}
        onDelete={handleDeleteCar}
        onClose={() => setCarModalOpen(false)}
        isEdit={!!editCarKey}
      />
    </section>
  );
};

export default CarSection;
