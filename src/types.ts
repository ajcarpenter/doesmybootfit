export type Rotation = { yaw: number; pitch: number; roll: number };
export type Vec3 = { x: number; y: number; z: number };
export type ItemDims = { L: number; W: number; T: number };
export type CarDims = { W: number; D: number; H_shelf_in: number; H_shelf_out: number; name: string };
export type SceneObject = {
  id: number;
  itemKey: string;
  name: string;
  position: Vec3;
  rotation: Rotation;
  dims?: ItemDims;
  snapToFloor?: boolean;
  isColliding?: boolean;
  fitStatus?: string;
};
