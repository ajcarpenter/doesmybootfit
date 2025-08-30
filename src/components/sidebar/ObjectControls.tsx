import React from 'react';
import {
  SnapRotationToggle,
  SnapToFloorToggle,
  PositionSliders,
  RotationSliders,
} from './object-controls';

const ObjectControls: React.FC = () => {
  return (
    <section className="section">
      <h3>Object Controls</h3>
      <SnapRotationToggle />
      <SnapToFloorToggle />
      <div className="slider-group">
        <PositionSliders />
        <RotationSliders />
      </div>
    </section>
  );
};

export default ObjectControls;
