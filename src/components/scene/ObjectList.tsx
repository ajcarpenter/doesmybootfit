import React from 'react';
import { PRESET_ITEMS } from '../../config/items';
import DraggableBox from '../DraggableBox';

type Vec3 = { x: number; y: number; z: number };

export interface ObjectListProps {
  bootDims: { W: number; D: number; H: number };
  objects: any[];
  activeObjectId: number | null;
  setSceneObjects: (objs: any[]) => void;
  setActiveObjectId: (id: number | null) => void;
  allowDrag: boolean;
  showGizmoEnabled?: boolean;
  userItems?: Record<string, { name: string; L: number; W: number; T: number }>;
}

const ObjectList: React.FC<ObjectListProps> = ({
  bootDims,
  objects,
  activeObjectId,
  setSceneObjects,
  setActiveObjectId,
  allowDrag,
  showGizmoEnabled,
  userItems,
}) => {
  return (
    <>
      {objects.map((obj) => {
        const dims = (PRESET_ITEMS as any)[obj.itemKey] ||
          (userItems && userItems[obj.itemKey]) || { L: 10, W: 10, T: 10 };
        return (
          <DraggableBox
            key={obj.id}
            obj={{ ...obj, bootDims }}
            dims={dims}
            isActive={activeObjectId === obj.id}
            showGizmo={!!showGizmoEnabled && activeObjectId === obj.id}
            allowDrag={allowDrag}
            onPointerDown={() => {
              setActiveObjectId(obj.id);
            }}
            onPointerUp={() => {
              /* no-op */
            }}
            onDrag={(pos: Vec3) => {
              // y will be finalized by clampToBoot inside the box using full rotation-aware projected half extents
              setSceneObjects(objects.map((o) => (o.id === obj.id ? { ...o, position: pos } : o)));
            }}
            onRotate={({ yaw, pitch, roll }, nextY) => {
              setSceneObjects(
                objects.map((o) =>
                  o.id === obj.id
                    ? {
                        ...o,
                        rotation: { yaw, pitch, roll },
                        position:
                          typeof nextY === 'number' ? { ...o.position, y: nextY } : o.position,
                      }
                    : o
                )
              );
            }}
          />
        );
      })}
    </>
  );
};

export default ObjectList;
