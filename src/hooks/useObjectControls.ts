import * as THREE from 'three';
import type { ItemDims, Rotation } from '../types';

export function useObjectControls() {
  function getProjectedHalfY(d: ItemDims, rot: Rotation) {
    const halfW = d.W / 2, halfT = d.T / 2, halfL = d.L / 2;
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(rot.pitch || 0),
      THREE.MathUtils.degToRad(rot.yaw || 0),
      THREE.MathUtils.degToRad(rot.roll || 0),
      'XYZ'
    );
    const m = new THREE.Matrix4().makeRotationFromEuler(euler);
    const ux = new THREE.Vector3(1,0,0).applyMatrix4(m).normalize();
    const uy = new THREE.Vector3(0,1,0).applyMatrix4(m).normalize();
    const uz = new THREE.Vector3(0,0,1).applyMatrix4(m).normalize();
    const projectedHalfY = Math.abs(ux.y) * halfW + Math.abs(uy.y) * halfT + Math.abs(uz.y) * halfL;
    return projectedHalfY;
  }

  function quantize(angle: number, enabled: boolean) {
    return enabled ? Math.round(angle / 90) * 90 : angle;
  }

  return { getProjectedHalfY, quantize };
}
