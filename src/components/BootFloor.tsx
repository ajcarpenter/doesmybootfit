import React from 'react';
import type { CarConfig } from '../config/cars';

const BootFloor: React.FC<{ car: CarConfig }> = ({ car }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[car.W / 2, 0.01, car.D / 2]}>
    <planeGeometry args={[car.W, car.D]} />
    <meshStandardMaterial color="#0d0f14" roughness={0.8} />
  </mesh>
);

export default BootFloor;
