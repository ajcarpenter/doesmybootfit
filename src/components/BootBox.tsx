import * as THREE from 'three';
import type { CarConfig } from '../config/cars';
import React from 'react';

const BootWireframe: React.FC<{ car: CarConfig; height: number }> = ({ car, height }) => {
  const geometry = React.useMemo(() => new THREE.BoxGeometry(car.W, height, car.D), [car.W, height, car.D]);
  const edges = React.useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);
  return (
    <lineSegments position={[car.W / 2, height / 2, car.D / 2]} geometry={edges}>
      <lineBasicMaterial attach="material" color="#b0b0b0" linewidth={2} />
    </lineSegments>
  );
};

const BootLabels: React.FC<{ car: CarConfig; height: number }> = ({ car, height }) => {
  function makeLabel(text: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const fontSize = 18;
    const padding = 6;
    ctx.font = `600 ${fontSize}px 'Inter', Arial, sans-serif`;
    const textWidth = ctx.measureText(text).width;
    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize * 1.7;
    ctx.font = `600 ${fontSize}px 'Inter', Arial, sans-serif`;
    ctx.fillStyle = 'rgba(30,34,44,0.92)';
    ctx.beginPath();
    ctx.moveTo(padding, 0);
    ctx.lineTo(canvas.width - padding, 0);
    ctx.quadraticCurveTo(canvas.width, 0, canvas.width, padding);
    ctx.lineTo(canvas.width, canvas.height - padding);
    ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - padding, canvas.height);
    ctx.lineTo(padding, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - padding);
    ctx.lineTo(0, padding);
    ctx.quadraticCurveTo(0, 0, padding, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e0e6f0';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  const y = height + 7;
  const scale: [number, number, number] = [14, 7, 1];
  return (
    <>
      <sprite position={[car.W / 2, y, car.D]} scale={scale}>
        <spriteMaterial attach="material" map={makeLabel('Front')} depthTest={false} />
      </sprite>
      <sprite position={[car.W / 2, y, 0]} scale={scale}>
        <spriteMaterial attach="material" map={makeLabel('Back')} depthTest={false} />
      </sprite>
      <sprite position={[0, y, car.D / 2]} scale={scale}>
        <spriteMaterial attach="material" map={makeLabel('Left')} depthTest={false} />
      </sprite>
      <sprite position={[car.W, y, car.D / 2]} scale={scale}>
        <spriteMaterial attach="material" map={makeLabel('Right')} depthTest={false} />
      </sprite>
    </>
  );
};

interface BootBoxProps {
  car: CarConfig;
  shelfIn: boolean;
}

const BootBox: React.FC<BootBoxProps> = ({ car, shelfIn }) => {
  const height = shelfIn ? car.H_shelf_in : car.H_shelf_out;
  return (
    <>
      <BootWireframe car={car} height={height} />
      <BootLabels car={car} height={height} />
    </>
  );
};

export default BootBox;