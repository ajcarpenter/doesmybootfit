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

export const BootLabels: React.FC<{ car: CarConfig }> = ({ car }) => {
  function makeTexture(text: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const fontSize = 24; // bigger labels
    const padding = 10;
    ctx.font = `700 ${fontSize}px 'Inter', Arial, sans-serif`;
    const textWidth = ctx.measureText(text).width;
    canvas.width = Math.ceil(textWidth + padding * 2);
    canvas.height = Math.ceil(fontSize * 1.9);
    // Ensure crisp rendering
    ctx.font = `700 ${fontSize}px 'Inter', Arial, sans-serif`;
    // Rounded rect background
    ctx.fillStyle = 'rgba(30,34,44,0.95)';
    const r = 10;
    const w = canvas.width, h = canvas.height;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
    // Text
    ctx.fillStyle = '#e6e6e6';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, h / 2);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }
  // Floor-aligned placement, slightly above to avoid z-fighting, and offset from bounds
  const y = 0.15;
  const offset = 8; // cm offset outside the boot bounds
  // Plane sizes in world units (cm)
  const planeW = 22;
  const planeH = 10;
  const matProps = { transparent: true, depthTest: false, depthWrite: false } as const;
  return (
    <>
      {/* Front (z just outside front edge) */}
      <mesh position={[car.W / 2, y, car.D + offset]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial attach="material" map={makeTexture('Front')} {...matProps} />
      </mesh>
      {/* Back (z just outside back edge) */}
      <mesh position={[car.W / 2, y, -offset]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial attach="material" map={makeTexture('Back')} {...matProps} />
      </mesh>
      {/* Left (x just outside left edge) */}
      <mesh position={[-offset, y, car.D / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial attach="material" map={makeTexture('Left')} {...matProps} />
      </mesh>
      {/* Right (x just outside right edge) */}
      <mesh position={[car.W + offset, y, car.D / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial attach="material" map={makeTexture('Right')} {...matProps} />
      </mesh>
    </>
  );
};

interface BootBoxProps {
  car: CarConfig;
  shelfIn: boolean;
}

const BootBox: React.FC<BootBoxProps> = ({ car, shelfIn }) => {
  return (
    <>
  <BootWireframe car={car} height={shelfIn ? car.H_shelf_in : car.H_shelf_out} />
  <BootLabels car={car} />
    </>
  );
};

export default BootBox;