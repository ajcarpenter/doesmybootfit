import React from 'react';

interface ShelfPlaneProps {
  carW: number;
  carD: number;
  shelfY: number;
  visible?: boolean;
}

const ShelfPlane: React.FC<ShelfPlaneProps> = ({ carW, carD, shelfY, visible = true }) => {
  if (!visible) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[carW / 2, shelfY, carD / 2]}>
      <planeGeometry args={[carW, carD]} />
      <meshBasicMaterial color="#5dade2" transparent opacity={0.1} depthWrite={false} />
    </mesh>
  );
};

export default ShelfPlane;
