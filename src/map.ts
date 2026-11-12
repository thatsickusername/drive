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
    // 1. Clean flat asphalt testing ground as originally designed
    const groundGeo = new THREE.BoxGeometry(320, 2, 320);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x272b30,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -1, 0);
    ground.receiveShadow = true;
    this.group.add(ground);
    this.createStaticTrimesh(ground, rapier, world);

    const grid = new THREE.GridHelper(320, 64, 0x4f5b66, 0x343d46);
    grid.position.y = 0.02;
    this.group.add(grid);

    // 2. Obstacle Course: Speed breakers, staggered articulation mounds, ramps, mud bog & rock crawl
    this.createSpeedBreakers(rapier, world);
    this.createStaggeredArticulationBumps(rapier, world);
    this.createTestRamps(rapier, world);
    this.createPerimeterBarriers(rapier, world);
    this.createMudBogZone(rapier, world);
    this.createRockCrawlZone(rapier, world);
  }

  private createSpeedBreakers(rapier: typeof RAPIER, world: RAPIER.World): void {
    // Yellow/black striped safety speed breakers across the central test lane
    const speedBreakerMat = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      roughness: 0.6,
      metalness: 0.2
    });

    const breakerZPositions = [15, 25, 35, 45, 55];
    for (let i = 0; i < breakerZPositions.length; i++) {
      const z = breakerZPositions[i];
      // Rounded speed bump using a half-cylinder geometry
      const bumpHeight = 0.22 + i * 0.04; // Gradually higher speed bumps to test suspension compression
      const bumpWidth = 1.2;
      const bumpLength = 16;

      const bumpGeo = new THREE.CylinderGeometry(bumpWidth * 0.5, bumpWidth * 0.5, bumpLength, 16, 1, false, 0, Math.PI);
      bumpGeo.rotateZ(Math.PI / 2);
      bumpGeo.rotateY(Math.PI / 2);

      const bump = new THREE.Mesh(bumpGeo, speedBreakerMat);
      bump.scale.set(1.0, bumpHeight / (bumpWidth * 0.5), 1.0);
      bump.position.set(0, 0, z);
      bump.castShadow = true;
      bump.receiveShadow = true;
      this.group.add(bump);
      this.createStaticTrimesh(bump, rapier, world);
    }
  }

  private createStaggeredArticulationBumps(rapier: typeof RAPIER, world: RAPIER.World): void {
    // Staggered left/right bumps to specifically test individual tyre up-and-down travel
    const bumpMat = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      roughness: 0.5,
      metalness: 0.3
    });

    for (let i = 0; i < 10; i++) {
      const z = 80 + i * 4.5;
      const isLeft = i % 2 === 0;
      const x = isLeft ? -1.8 : 1.8;

      const moundGeo = new THREE.SphereGeometry(1.6, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const mound = new THREE.Mesh(moundGeo, bumpMat);
      mound.scale.set(1.1, 0.28, 1.6);
      mound.position.set(x, 0, z);
      mound.castShadow = true;
      mound.receiveShadow = true;
      this.group.add(mound);
      this.createStaticTrimesh(mound, rapier, world);
    }
  }

  private createTestRamps(rapier: typeof RAPIER, world: RAPIER.World): void {
    const rampMat = new THREE.MeshStandardMaterial({
      color: 0xe67e22,
      roughness: 0.4,
      metalness: 0.3
    });

    // 1. Moderate Jump Ramp (Straight ahead at z = 140)
    const jumpRamp = this.createWedgeMesh(10, 2.4, 14, rampMat);
    jumpRamp.position.set(0, 0, 140);
    this.group.add(jumpRamp);
    this.createStaticTrimesh(jumpRamp, rapier, world);

    // 2. High-speed Smooth Launch Ramp (West lane)
    const launchRamp = this.createWedgeMesh(12, 3.8, 18, rampMat);
    launchRamp.position.set(-35, 0, 40);
    launchRamp.rotation.y = Math.PI;
    this.group.add(launchRamp);
    this.createStaticTrimesh(launchRamp, rapier, world);

    // 3. Side Bank Wedge (East lane)
    const sideBank = this.createWedgeMesh(10, 1.8, 25, rampMat);
    sideBank.position.set(35, 0, -30);
    this.group.add(sideBank);
    this.createStaticTrimesh(sideBank, rapier, world);

    // 4. Stepped curb obstacles (South area)
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x95a5a6,
      roughness: 0.7,
      metalness: 0.2
    });

    const stepHeights = [0.15, 0.25, 0.35, 0.45];
    for (let i = 0; i < stepHeights.length; i++) {
      const h = stepHeights[i];
      const step = new THREE.Mesh(new THREE.BoxGeometry(14, h, 3.5), curbMat);
      step.position.set(0, h * 0.5, -25 - i * 6);
      step.castShadow = true;
      step.receiveShadow = true;
      this.group.add(step);
      this.createStaticTrimesh(step, rapier, world);
    }
  }

  private createPerimeterBarriers(rapier: typeof RAPIER, world: RAPIER.World): void {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x7f8c8d,
      roughness: 0.8
    });

    const half = 150;
    const configs = [
      { size: [300, 2.5, 2], pos: [0, 1.25, half] },
      { size: [300, 2.5, 2], pos: [0, 1.25, -half] },
      { size: [2, 2.5, 300], pos: [half, 1.25, 0] },
      { size: [2, 2.5, 300], pos: [-half, 1.25, 0] }
    ];

    for (const conf of configs) {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(conf.size[0], conf.size[1], conf.size[2]),
        wallMat
      );
      wall.position.set(conf.pos[0], conf.pos[1], conf.pos[2]);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.group.add(wall);
      this.createStaticTrimesh(wall, rapier, world);
    }
  }

  private createWedgeMesh(
    width: number,
    height: number,
    length: number,
    mat: THREE.Material
  ): THREE.Mesh {
    const halfW = width * 0.5;
    const halfL = length * 0.5;

    // Build right triangular prism ramp
    const vertices = new Float32Array([
      // Bottom face
      -halfW, 0, -halfL,
       halfW, 0, -halfL,
       halfW, 0,  halfL,
      -halfW, 0,  halfL,

      // Top back edge
      -halfW, height, halfL,
       halfW, height, halfL
    ]);

    const indices = [
      // Bottom
      0, 1, 2,  0, 2, 3,
      // Slanted ramp face
      0, 4, 5,  0, 5, 1,
      // Back vertical face
      2, 5, 4,  2, 4, 3,
      // Left side triangle
      0, 3, 4,
      // Right side triangle
      1, 5, 2
    ];

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  private createMudBogZone(rapier: typeof RAPIER, world: RAPIER.World): void {
    const mudMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817, // Deep muddy brown
      roughness: 0.95,
      metalness: 0.05
    });

    // Mud bog basin on the West Lane
    const mudGeo = new THREE.BoxGeometry(28, 0.45, 60);
    const mudMesh = new THREE.Mesh(mudGeo, mudMat);
    mudMesh.position.set(-50, 0.12, -20);
    mudMesh.receiveShadow = true;
    this.group.add(mudMesh);
    this.createStaticTrimesh(mudMesh, rapier, world);

    // Mud approach ramps
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x4d331e, roughness: 0.9 });
    const entryRamp = this.createWedgeMesh(28, 0.35, 6, rampMat);
    entryRamp.position.set(-50, 0, 13);
    this.group.add(entryRamp);
    this.createStaticTrimesh(entryRamp, rapier, world);

    const exitRamp = this.createWedgeMesh(28, 0.35, 6, rampMat);
    exitRamp.rotation.y = Math.PI;
    exitRamp.position.set(-50, 0, -53);
    this.group.add(exitRamp);
    this.createStaticTrimesh(exitRamp, rapier, world);
  }

  private createRockCrawlZone(rapier: typeof RAPIER, world: RAPIER.World): void {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x5b646b,
      roughness: 0.88,
      metalness: 0.12
    });

    // Rock boulders and stone slabs across the East Lane
    const rockLocations = [
      { x: 45, z: 25, rx: 2.2, ry: 0.55, rz: 2.5 },
      { x: 52, z: 34, rx: 1.8, ry: 0.65, rz: 2.0 },
      { x: 44, z: 42, rx: 2.6, ry: 0.70, rz: 2.4 },
      { x: 50, z: 52, rx: 2.1, ry: 0.60, rz: 2.2 },
      { x: 46, z: 62, rx: 2.8, ry: 0.80, rz: 2.9 }
    ];

    for (const r of rockLocations) {
      const rockGeo = new THREE.DodecahedronGeometry(1.6, 1);
      const rockMesh = new THREE.Mesh(rockGeo, rockMat);
      rockMesh.scale.set(r.rx, r.ry, r.rz);
      rockMesh.position.set(r.x, r.ry * 0.4, r.z);
      rockMesh.rotation.set(0.3, r.x * 0.2, 0.1);
      rockMesh.castShadow = true;
      rockMesh.receiveShadow = true;
      this.group.add(rockMesh);
      this.createStaticTrimesh(rockMesh, rapier, world);
    }
  }

  private createStaticTrimesh(
    mesh: THREE.Mesh,
    rapier: typeof RAPIER,
    world: RAPIER.World
  ): void {
    mesh.updateMatrixWorld(true);
    const geometry = mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);

    const positions = geometry.attributes.position.array as Float32Array;
    let indices: Uint32Array;

    if (geometry.index) {
      indices = new Uint32Array(geometry.index.array);
    } else {
      const count = positions.length / 3;
      indices = new Uint32Array(count);
      for (let i = 0; i < count; i++) indices[i] = i;
    }

    const groundBodyDesc = rapier.RigidBodyDesc.fixed();
    const groundBody = world.createRigidBody(groundBodyDesc);

    const groundColliderDesc = rapier.ColliderDesc.trimesh(positions, indices)
      .setFriction(0.8)
      .setRestitution(0.02);

    world.createCollider(groundColliderDesc, groundBody);
    this.rigidBodies.push(groundBody);
  }
}
