import React from 'react';

interface Props {
  activeObjectId: number | null;
  sceneObjects: Array<{ id: number; fitStatus?: string }>;
}

const FitStatus: React.FC<Props> = ({ activeObjectId, sceneObjects }) => {
  const status = React.useMemo(() => {
    if (activeObjectId == null) return undefined;
    return sceneObjects.find(o => o.id === activeObjectId)?.fitStatus;
  }, [activeObjectId, sceneObjects]);
  const cls = status === 'Fits' ? 'green' : status === 'Too Tall' ? 'yellow' : status === 'Exceeds Bounds' ? 'orange' : status === 'Colliding' ? 'red' : '';

  return (
    <div className="fit-status">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        Fit Status
        <span
          className="info-dot"
          role="img"
          aria-label="Fit status legend"
          title="Legend: Fits = green, Too Tall = yellow, Exceeds Bounds = orange, Colliding = red"
        >
          i
        </span>
      </h2>
      <div className="badges">
        <span className={`badge ${cls}`}>{status || 'No item'}</span>
      </div>
    </div>
  );
};

export default FitStatus;
