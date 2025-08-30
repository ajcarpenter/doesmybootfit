import React from 'react';
import FitStatus from './FitStatus';

interface SidebarHeaderProps {
  activeObjectId: number | null;
  sceneObjects: any[];
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ activeObjectId, sceneObjects }) => {
  return (
    <header className="section">
      <div className="logo-container">
        <img src="/logo.png" alt="Does My Boot Fit Logo" className="logo-img" />
      </div>
      <FitStatus activeObjectId={activeObjectId} sceneObjects={sceneObjects} />
      <p className="description">
        Use mouse to orbit and scroll to zoom. Drag an item to move it on the floor.
      </p>
    </header>
  );
};

export default SidebarHeader;
