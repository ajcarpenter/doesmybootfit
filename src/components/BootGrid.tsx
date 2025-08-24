import React from 'react';
import { Grid } from '@react-three/drei';
import type { CarConfig } from '../config/cars';

const BootGrid: React.FC<{ car: CarConfig }> = ({ car }) => (
  <Grid
    args={[car.W, car.D]}
    position={[car.W / 2, 0.02, car.D / 2]}
    cellColor="#60a5fa"
    sectionColor="#3b82f6"
    fadeDistance={0}
    infiniteGrid={false}
  />
);

export default BootGrid;
