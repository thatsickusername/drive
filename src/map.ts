import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';

export class GameMap {
  public group: THREE.Group;
  public rigidBodies: RAPIER.RigidBody[] = [];

  constructor(scene: THREE.Scene, rapier: typeof RAPIER, world: RAPIER.World) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.buildMap(rapier, world);
  }

  private buildMap(rapier: typeof RAPIER, world: RAPIER.World): void {
    const groundGeo = new THREE.BoxGeometry(300, 2, 300);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2e353b,
      roughness: 0.85,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -1, 0);
    ground.receiveShadow = true;
    this.group.add(ground);
    this.createStaticTrimesh(ground, rapier, world);

    const gridHelper = new THREE.GridHelper(300, 60, 0x556677, 0x3d4852);
    gridHelper.position.y = 0.02;
    this.group.add(gridHelper);

    const rampMat = new THREE.MeshStandardMaterial({
      color: 0xe67e22,
      roughness: 0.5,
      metalness: 0.2
    });

    const ramp1 = this.createRampMesh(14, 3, 24, rampMat);
    ramp1.position.set(0, 1.5, 30);
    ramp1.rotation.x = -Math.PI * 0.08;
    this.group.add(ramp1);
    this.createStaticTrimesh(ramp1, rapier, world);

    const ramp2 = this.createRampMesh(18, 5, 28, rampMat);
    ramp2.position.set(-35, 2.5, -40);
    ramp2.rotation.y = Math.PI * 0.25;
    ramp2.rotation.x = -Math.PI * 0.1;
    this.group.add(ramp2);
    this.createStaticTrimesh(ramp2, rapier, world);

    const ramp3 = this.createRampMesh(16, 4, 25, rampMat);
    ramp3.position.set(45, 2.0, -20);
    ramp3.rotation.y = -Math.PI * 0.4;
    ramp3.rotation.x = -Math.PI * 0.09;
    this.group.add(ramp3);
    this.createStaticTrimesh(ramp3, rapier, world);

    const obsMat = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      roughness: 0.4,
      metalness: 0.3
    });

    const obstacleConfigs = [
      { size: [6, 4, 6], pos: [20, 2, 20] },
      { size: [8, 5, 8], pos: [-25, 2.5, 20] },
      { size: [12, 3, 6], pos: [0, 1.5, -30] },
      { size: [4, 6, 20], pos: [-40, 3, 10] },
      { size: [4, 6, 20], pos: [40, 3, 10] }
    ];

    for (const conf of obstacleConfigs) {
      const boxGeo = new THREE.BoxGeometry(conf.size[0], conf.size[1], conf.size[2]);
      const mesh = new THREE.Mesh(boxGeo, obsMat);
      mesh.position.set(conf.pos[0], conf.pos[1], conf.pos[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      this.createStaticTrimesh(mesh, rapier, world);
    }

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x7f8c8d,
      roughness: 0.9
    });
    const perimeterWalls = [
      { size: [300, 8, 4], pos: [0, 4, 150] },
      { size: [300, 8, 4], pos: [0, 4, -150] },
      { size: [4, 8, 300], pos: [150, 4, 0] },
      { size: [4, 8, 300], pos: [-150, 4, 0] }
    ];

    for (const wall of perimeterWalls) {
      const wallGeo = new THREE.BoxGeometry(wall.size[0], wall.size[1], wall.size[2]);
      const mesh = new THREE.Mesh(wallGeo, wallMat);
      mesh.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);
      mesh.receiveShadow = true;
      this.group.add(mesh);
      this.createStaticTrimesh(mesh, rapier, world);
    }
  }

  private createRampMesh(w: number, h: number, d: number, mat: THREE.Material): THREE.Mesh {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  private createStaticTrimesh(
    mesh: THREE.Mesh,
    rapier: typeof RAPIER,
    world: RAPIER.World
  ): void {
    mesh.updateMatrixWorld(true);
    const geometry = mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);

    const positionAttribute = geometry.attributes.position;
    const vertices = new Float32Array(positionAttribute.array);

    let indices: Uint32Array;
    if (geometry.index) {
      indices = new Uint32Array(geometry.index.array);
    } else {
      indices = new Uint32Array(positionAttribute.count);
      for (let i = 0; i < indices.length; i++) {
        indices[i] = i;
      }
    }

    const bodyDesc = rapier.RigidBodyDesc.fixed();
    const body = world.createRigidBody(bodyDesc);
    const colliderDesc = rapier.ColliderDesc.trimesh(vertices, indices);
    colliderDesc.setFriction(0.85);
    colliderDesc.setRestitution(0.1);
    world.createCollider(colliderDesc, body);

    this.rigidBodies.push(body);
    geometry.dispose();
  }
}
