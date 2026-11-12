import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';
import { PlayerSlotInfo } from './network/protocol';
import { SnapshotInterpolator } from './network/interpolator';

export class RemoteCar {
  public id: string;
  public slotInfo: PlayerSlotInfo;
  public mesh: THREE.Group;
  public body: RAPIER.RigidBody;
  public collider: RAPIER.Collider;

  private scene: THREE.Scene;
  private rapier: typeof RAPIER;
  private world: RAPIER.World;

  public interpolator = new SnapshotInterpolator();

  private targetPos = new THREE.Vector3();
  private targetQuat = new THREE.Quaternion();
  private wheelGroups: THREE.Group[] = [];
  private wheelMeshes: THREE.Mesh[] = [];
  private wheelMounts: THREE.Vector3[] = [];
  private nameSprite!: THREE.Sprite;

  constructor(
    scene: THREE.Scene,
    rapier: typeof RAPIER,
    world: RAPIER.World,
    slotInfo: PlayerSlotInfo
  ) {
    this.scene = scene;
    this.rapier = rapier;
    this.world = world;
    this.slotInfo = slotInfo;
    this.id = slotInfo.id;

    this.mesh = new THREE.Group();

    // 1. Build Visual Chassis with slot-assigned color
    this.buildMesh(slotInfo.colorHex);

    // 2. Setup Rapier Kinematic RigidBody for realistic player-to-player collision
    const [sx, sy, sz] = slotInfo.spawnPos;
    const bodyDesc = rapier.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(sx, sy, sz);
    this.body = world.createRigidBody(bodyDesc);

    const colliderDesc = rapier.ColliderDesc.cuboid(0.88, 0.35, 1.95)
      .setTranslation(0, 0.32, 0)
      .setFriction(0.25)
      .setRestitution(0.05);
    this.collider = world.createCollider(colliderDesc, this.body);

    this.targetPos.set(sx, sy, sz);
    this.mesh.position.set(sx, sy, sz);

    scene.add(this.mesh);
  }

  private buildMesh(colorHex: number): void {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.5,
      metalness: 0.3
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.8,
      metalness: 0.1
    });

    // Main lower chassis
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 3.9), bodyMat);
    mainBody.position.y = 0.35;
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    this.mesh.add(mainBody);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 2.1), bodyMat);
    cabin.position.set(0, 0.88, -0.2);
    cabin.castShadow = true;
    this.mesh.add(cabin);

    // Front Bumper
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 0.35), trimMat);
    bumper.position.set(0, 0.3, 2.05);
    bumper.castShadow = true;
    this.mesh.add(bumper);

    // Headlights
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hlLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16), hlMat);
    hlLeft.rotation.x = Math.PI / 2;
    hlLeft.position.set(-0.65, 0.4, 2.0);
    const hlRight = hlLeft.clone();
    hlRight.position.x = 0.65;
    this.mesh.add(hlLeft);
    this.mesh.add(hlRight);

    // Taillights
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xdd1111 });
    const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), tlMat);
    tlLeft.position.set(-0.65, 0.45, -1.98);
    const tlRight = tlLeft.clone();
    tlRight.position.x = 0.65;
    this.mesh.add(tlLeft);
    this.mesh.add(tlRight);

    // Wheels
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.7 });

    this.wheelMounts = [
      new THREE.Vector3(-1.05, 0.28, 1.35),  // FL
      new THREE.Vector3(1.05, 0.28, 1.35),   // FR
      new THREE.Vector3(-1.05, 0.28, -1.35), // RL
      new THREE.Vector3(1.05, 0.28, -1.35)   // RR
    ];

    for (let i = 0; i < 4; i++) {
      const group = new THREE.Group();
      const tireGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.36, 20);
      tireGeo.rotateZ(Math.PI / 2);
      const wheelMesh = new THREE.Mesh(tireGeo, tireMat);
      wheelMesh.castShadow = true;

      const rimGeo = new THREE.CylinderGeometry(0.48 * 0.55, 0.48 * 0.55, 0.36 * 1.02, 12);
      rimGeo.rotateZ(Math.PI / 2);
      wheelMesh.add(new THREE.Mesh(rimGeo, rimMat));

      group.add(wheelMesh);
      this.scene.add(group);

      this.wheelGroups.push(group);
      this.wheelMeshes.push(wheelMesh);
    }

    // Overhead 3D Nametag
    this.createNametag(this.slotInfo.colorName, colorHex);
  }

  private createNametag(label: string, colorHex: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(10, 14, 20, 0.85)';
    ctx.roundRect(10, 8, 236, 48, 8);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.stroke();

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    this.nameSprite = new THREE.Sprite(spriteMat);
    this.nameSprite.scale.set(2.4, 0.6, 1.0);
    this.nameSprite.position.set(0, 1.8, 0);
    this.mesh.add(this.nameSprite);
  }

  public update(renderTime: number): void {
    const state = this.interpolator.interpolate(renderTime, this.targetPos, this.targetQuat);
    if (!state) return;

    // 1. Advance Kinematic body in Rapier physics world for obstacle/player collision
    this.body.setNextKinematicTranslation(
      new this.rapier.Vector3(this.targetPos.x, this.targetPos.y, this.targetPos.z)
    );
    this.body.setNextKinematicRotation(
      new this.rapier.Quaternion(
        this.targetQuat.x,
        this.targetQuat.y,
        this.targetQuat.z,
        this.targetQuat.w
      )
    );

    // 2. Sync visual chassis
    this.mesh.position.copy(this.targetPos);
    this.mesh.quaternion.copy(this.targetQuat);

    // 3. Sync visual wheels
    const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(this.targetQuat);
    for (let i = 0; i < 4; i++) {
      const mountWorld = this.wheelMounts[i]
        .clone()
        .applyQuaternion(this.targetQuat)
        .add(this.mesh.position);

      const suspCompression = state.susp[i] ?? 0;
      const suspLength = 0.55 - suspCompression * 0.4;
      const wheelPos = mountWorld.sub(upDir.clone().multiplyScalar(suspLength));

      const grp = this.wheelGroups[i];
      grp.position.copy(wheelPos);

      // Apply steering on front wheels (0 and 1)
      if (i < 2) {
        const steerQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          state.steer
        );
        grp.quaternion.copy(this.targetQuat.clone().multiply(steerQuat));
      } else {
        grp.quaternion.copy(this.targetQuat);
      }

      this.wheelMeshes[i].rotation.x = state.spin[i] ?? 0;
    }
  }

  public onRespawn(pos: [number, number, number], yaw: number): void {
    this.targetPos.set(pos[0], pos[1], pos[2]);
    const halfYaw = yaw * 0.5;
    this.targetQuat.set(0, Math.sin(halfYaw), 0, Math.cos(halfYaw));
    this.body.setTranslation(new this.rapier.Vector3(pos[0], pos[1], pos[2]), true);
    this.body.setRotation(
      new this.rapier.Quaternion(this.targetQuat.x, this.targetQuat.y, this.targetQuat.z, this.targetQuat.w),
      true
    );
    this.mesh.position.copy(this.targetPos);
    this.mesh.quaternion.copy(this.targetQuat);
  }

  public destroy(): void {
    for (const grp of this.wheelGroups) {
      this.scene.remove(grp);
    }
    this.scene.remove(this.mesh);
    this.world.removeCollider(this.collider, false);
    this.world.removeRigidBody(this.body);
  }
}
