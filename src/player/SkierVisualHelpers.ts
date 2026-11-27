import * as THREE from 'three';
import { SkierCharacter } from './character/SkierRig';
import { SnowSprayParams, SnowSpraySystem } from '../world/trails/SnowSpraySystem';

function syncLocalMatrixWorld(obj: THREE.Object3D): void {
  obj.updateMatrix();
  if (obj.parent) {
    obj.matrixWorld.multiplyMatrices(obj.parent.matrixWorld, obj.matrix);
  } else {
    obj.matrixWorld.copy(obj.matrix);
  }
}

/**
 * Grounds the rig in the carved rut floor and clamps ski contact probes above terrain without
 * traversing upper-body/arm/head bones.
 */
export function updateSkierFootGrounding(
  actorRoot: THREE.Object3D,
  rig: SkierCharacter,
  terrainSampler: ((x: number, z: number) => number) | null,
  isGrounded: boolean,
  normalY: number,
  currentOffset: number,
  dt: number,
  sphereRadius: number,
  crouchOffset: number,
  scratchContactPos: THREE.Vector3
): number {
  const baseElev = -sphereRadius + 0.016 + crouchOffset;
  rig.root.position.y = baseElev;

  let nextOffset = currentOffset;
  if (isGrounded && terrainSampler) {
    // Update only the root -> visualRoot -> rig.root -> hips -> leg chains
    syncLocalMatrixWorld(actorRoot);
    if (rig.root.parent && rig.root.parent !== actorRoot) {
      syncLocalMatrixWorld(rig.root.parent);
    }
    syncLocalMatrixWorld(rig.root);
    syncLocalMatrixWorld(rig.joints.hips);
    if (rig.joints.leftHip) rig.joints.leftHip.updateMatrixWorld(true);
    if (rig.joints.rightHip) rig.joints.rightHip.updateMatrixWorld(true);

    let maxPenetration = 0.0;
    const targetClearance = 0.016;
    const contacts = rig.footContacts;

    for (let i = 0; i < contacts.length; i++) {
      contacts[i].getWorldPosition(scratchContactPos);
      const localGroundY = terrainSampler(scratchContactPos.x, scratchContactPos.z);
      const penetration = (localGroundY + targetClearance) - scratchContactPos.y;
      if (penetration > maxPenetration) {
        maxPenetration = penetration;
      }
    }

    const clampedNormalY = Math.max(0.25, normalY);
    const normPenetration = maxPenetration / clampedNormalY;

    if (normPenetration > 0) {
      nextOffset = Math.max(nextOffset, normPenetration);
    } else {
      nextOffset = THREE.MathUtils.damp(nextOffset, 0.0, 14.0, dt);
    }
    rig.root.position.y += nextOffset;
  } else {
    nextOffset = THREE.MathUtils.damp(nextOffset, 0.0, 14.0, dt);
  }

  return nextOffset;
}

/**
 * Populates a reusable SnowSprayParams struct and steps the particle emitter.
 */
export function emitSkierSnowSpray(
  snowSpray: SnowSpraySystem | null,
  dt: number,
  sp: SnowSprayParams,
  pos: THREE.Vector3,
  fwd: THREE.Vector3,
  right: THREE.Vector3,
  normal: THREE.Vector3,
  speed: number,
  leanAngle: number,
  slipAngleDeg: number,
  vLateral: number,
  isGrounded: boolean,
  isDrifting: boolean,
  isSharpTurn: boolean,
  sphereRadius: number
): void {
  if (!snowSpray) return;
  sp.posX = pos.x;
  sp.posY = pos.y;
  sp.posZ = pos.z;
  sp.fwdX = fwd.x;
  sp.fwdY = fwd.y;
  sp.fwdZ = fwd.z;
  sp.rightX = right.x;
  sp.rightY = right.y;
  sp.rightZ = right.z;
  sp.normalX = normal.x;
  sp.normalY = normal.y;
  sp.normalZ = normal.z;
  sp.speed = speed;
  sp.leanAngle = leanAngle;
  sp.slipAngleDeg = slipAngleDeg;
  sp.vLateral = vLateral;
  sp.isGrounded = isGrounded;
  sp.isDrifting = isDrifting;
  sp.isSharpTurn = isSharpTurn;
  sp.sphereRadius = sphereRadius;
  snowSpray.update(dt, sp);
}
