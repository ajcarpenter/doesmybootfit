import React from 'react';
import { Grid } from '@react-three/drei';
import type { CarConfig } from '../config/cars';

const BootGrid: React.FC<{ car: CarConfig }> = ({ car }) => (
  <Grid
    args={[car.W, car.D]}
    position={[car.W / 2, 0.01, car.D / 2]}
    cellColor="#60a5fa"
    sectionColor="#3b82f6"
    fadeDistance={0}
    infiniteGrid={false}
    onUpdate={(self: any) => {
      // Respect depth so the mesh occludes the grid under it
      if (self && self.material) {
        self.material.depthTest = true;
        self.material.depthWrite = false;
      }
      self.renderOrder = 0;
    }}
  />
);

export default BootGrid;
