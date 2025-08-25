export type Rotation = { yaw: number; pitch: number; roll: number };
export type Vec3 = { x: number; y: number; z: number };
export type ItemDims = { L: number; W: number; T: number };
export type CarDims = { W: number; D: number; H_shelf_in: number; H_shelf_out: number; name: string };
export type MeshSlab = {
  y: number; // bottom Y of slab
  height: number; // vertical extent
  zStart: number; // starting Z from boot origin
  depth: number; // length along Z
  backHalfW: number; // half width at zStart
  frontHalfW: number; // half width at zStart + depth
};
export type MeshBootConfig = { slabs: MeshSlab[] };
export type SceneObject = {
  id: number;
  itemKey: string;
  name: string;
  position: Vec3;
  rotation: Rotation;
  dims?: ItemDims;
  snapToFloor?: boolean;
  snapRot?: boolean;
  isColliding?: boolean;
  fitStatus?: string;
};
