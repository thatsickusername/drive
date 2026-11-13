import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { ChunkWorkerOutput } from '../generators/terrainWorker';
import { TerrainConfig } from '../config/terrainConfig';

export class TerrainChunk {
  public readonly cx: number;
  public readonly cz: number;
  public readonly key: string;

  public group: THREE.Group;
  private terrainMesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private treeInstancedMesh: THREE.InstancedMesh | null = null;
  private boulderInstancedMesh: THREE.InstancedMesh | null = null;
  private structureGroup: THREE.Group | null = null;

  private rigidBodies: RAPIER.RigidBody[] = [];

  constructor(
    data: ChunkWorkerOutput,
    config: TerrainConfig,
    scene: THREE.Scene,
    rapier: typeof RAPIER,
    world: RAPIER.World,
    sharedMaterials?: {
      terrainMaterial: THREE.Material;
      waterMaterial: THREE.Material;
      treeMaterial: THREE.Material;
      boulderMaterial: THREE.Material;
      treeGeometry: THREE.BufferGeometry;
      boulderGeometry: THREE.BufferGeometry;
    }
  ) {
    this.cx = data.cx;
    this.cz = data.cz;
    this.key = `${data.cx},${data.cz}`;

    this.group = new THREE.Group();
    const worldCenterX = data.cx * config.chunkSize;
    const worldCenterZ = data.cz * config.chunkSize;

    // 1. Build Terrain Mesh
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
    geometry.computeVertexNormals();

    const mat = sharedMaterials?.terrainMaterial || new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.05,
      flatShading: true,
    });

    this.terrainMesh = new THREE.Mesh(geometry, mat);
    this.terrainMesh.position.set(worldCenterX, 0, worldCenterZ);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = false;
    this.group.add(this.terrainMesh);

    // 2. Rapier Heightfield Collider
    const scale = new rapier.Vector3(config.chunkSize, 1.0, config.chunkSize);
    const bodyDesc = rapier.RigidBodyDesc.fixed().setTranslation(worldCenterX, 0, worldCenterZ);
    const rigidBody = world.createRigidBody(bodyDesc);

    const heightfieldDesc = rapier.ColliderDesc.heightfield(
      config.segments,
      config.segments,
      data.rapierHeights,
      scale
    )
      .setFriction(0.85)
      .setRestitution(0.01);

    world.createCollider(heightfieldDesc, rigidBody);
    this.rigidBodies.push(rigidBody);

    // 3. Water Plane (if chunk has river vertices)
    if (data.hasRiver) {
      const waterGeo = new THREE.PlaneGeometry(config.chunkSize, config.chunkSize, 4, 4);
      waterGeo.rotateX(-Math.PI / 2);
      const waterMat = sharedMaterials?.waterMaterial || new THREE.MeshStandardMaterial({
        color: 0x1f3844,
        roughness: 0.15,
        metalness: 0.6,
        transparent: true,
        opacity: 0.82,
      });
      this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
      this.waterMesh.position.set(worldCenterX, config.riverLevel, worldCenterZ);
      this.waterMesh.receiveShadow = true;
      this.group.add(this.waterMesh);
    }

    // 4. Instanced Trees & Colliders
    const treeCount = data.treeMatrices.length / 16;
    if (treeCount > 0) {
      const treeGeo = sharedMaterials?.treeGeometry || this.createTreeGeometry();
      const treeMat = sharedMaterials?.treeMaterial || new THREE.MeshStandardMaterial({
        color: 0x3d4734,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true,
      });

      this.treeInstancedMesh = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
      this.treeInstancedMesh.instanceMatrix.copyArray(data.treeMatrices);
      this.treeInstancedMesh.instanceMatrix.needsUpdate = true;
      this.treeInstancedMesh.castShadow = true;
      this.treeInstancedMesh.receiveShadow = true;
      this.group.add(this.treeInstancedMesh);

      // Physics Colliders for trees
      for (const tc of data.treeColliders) {
        const tBodyDesc = rapier.RigidBodyDesc.fixed().setTranslation(tc.x, tc.y, tc.z);
        const tBody = world.createRigidBody(tBodyDesc);
        const tColDesc = rapier.ColliderDesc.cylinder(tc.halfHeight, tc.radius)
          .setFriction(0.9);
        const col = world.createCollider(tColDesc, tBody);
        (col as any).userData = {
          type: 'winch_anchor',
          harvestable: true,
          isWinchAnchor: tc.isWinchAnchor,
        };
        this.rigidBodies.push(tBody);
      }
    }

    // 5. Instanced Boulders & Colliders
    const boulderCount = data.boulderMatrices.length / 16;
    if (boulderCount > 0) {
      const boulderGeo = sharedMaterials?.boulderGeometry || new THREE.DodecahedronGeometry(1.0, 1);
      const boulderMat = sharedMaterials?.boulderMaterial || new THREE.MeshStandardMaterial({
        color: 0x5a5d60,
        roughness: 0.95,
        metalness: 0.08,
        flatShading: true,
      });

      this.boulderInstancedMesh = new THREE.InstancedMesh(boulderGeo, boulderMat, boulderCount);
      this.boulderInstancedMesh.instanceMatrix.copyArray(data.boulderMatrices);
      this.boulderInstancedMesh.instanceMatrix.needsUpdate = true;
      this.boulderInstancedMesh.castShadow = true;
      this.boulderInstancedMesh.receiveShadow = true;
      this.group.add(this.boulderInstancedMesh);

      // Physics Colliders for boulders
      for (const bc of data.boulderColliders) {
        const bBodyDesc = rapier.RigidBodyDesc.fixed().setTranslation(bc.x, bc.y, bc.z);
        const bBody = world.createRigidBody(bBodyDesc);
        const bColDesc = rapier.ColliderDesc.cuboid(bc.hx, bc.hy, bc.hz)
          .setFriction(0.95)
          .setRestitution(0.01);
        world.createCollider(bColDesc, bBody);
        this.rigidBodies.push(bBody);
      }
    }

    // 6. Structures
    if (data.structureData) {
      this.buildStructure(data.structureData, rapier, world);
    }

    scene.add(this.group);
  }

  private createTreeGeometry(): THREE.BufferGeometry {
    // Compound geometry: trunk + cone canopy
    const trunk = new THREE.CylinderGeometry(0.2, 0.35, 2.0, 6);
    trunk.translate(0, 1.0, 0);
    const foliage = new THREE.ConeGeometry(1.6, 4.0, 6);
    foliage.translate(0, 3.5, 0);

    // Merge or use simple group (trunk + foliage cone)
    return foliage;
  }

  private buildStructure(
    s: NonNullable<ChunkWorkerOutput['structureData']>,
    rapier: typeof RAPIER,
    world: RAPIER.World
  ): void {
    this.structureGroup = new THREE.Group();
    this.structureGroup.position.set(s.x, s.y, s.z);
    this.structureGroup.rotation.y = s.yaw;

    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x47494d,
      roughness: 0.9,
    });
    const rustMetalMat = new THREE.MeshStandardMaterial({
      color: 0x8a4b32,
      roughness: 0.7,
      metalness: 0.4,
    });

    if (s.type === 'WATCHTOWER') {
      // 4 wooden/steel leg stilts + observation deck
      const legGeo = new THREE.BoxGeometry(0.4, 8.0, 0.4);
      for (const [lx, lz] of [[-2, -2], [2, -2], [2, 2], [-2, 2]]) {
        const leg = new THREE.Mesh(legGeo, rustMetalMat);
        leg.position.set(lx, 4.0, lz);
        leg.castShadow = true;
        this.structureGroup.add(leg);
      }
      const cabinGeo = new THREE.BoxGeometry(5.2, 3.0, 5.2);
      const cabin = new THREE.Mesh(cabinGeo, concreteMat);
      cabin.position.set(0, 9.5, 0);
      cabin.castShadow = true;
      this.structureGroup.add(cabin);

      // Physics box
      const bodyDesc = rapier.RigidBodyDesc.fixed().setTranslation(s.x, s.y + 4.0, s.z);
      const body = world.createRigidBody(bodyDesc);
      const colDesc = rapier.ColliderDesc.cuboid(2.5, 4.0, 2.5).setFriction(0.8);
      world.createCollider(colDesc, body);
      this.rigidBodies.push(body);
    } else if (s.type === 'FUEL_DEPOT') {
      // Cylindrical tanks
      const tankGeo = new THREE.CylinderGeometry(2.4, 2.4, 7.0, 12);
      tankGeo.rotateZ(Math.PI / 2);
      for (let i = 0; i < 2; i++) {
        const tank = new THREE.Mesh(tankGeo, rustMetalMat);
        tank.position.set(0, 2.6, (i - 0.5) * 6.5);
        tank.castShadow = true;
        this.structureGroup.add(tank);

        const bodyDesc = rapier.RigidBodyDesc.fixed().setTranslation(s.x, s.y + 2.6, s.z + (i - 0.5) * 6.5);
        const body = world.createRigidBody(bodyDesc);
        const colDesc = rapier.ColliderDesc.cylinder(3.5, 2.4).setFriction(0.8);
        world.createCollider(colDesc, body);
        this.rigidBodies.push(body);
      }
    } else {
      // Outpost / Ranger Cabin
      const bldgGeo = new THREE.BoxGeometry(7.0, 3.8, 6.0);
      const bldg = new THREE.Mesh(bldgGeo, concreteMat);
      bldg.position.set(0, 1.9, 0);
      bldg.castShadow = true;
      this.structureGroup.add(bldg);

      const bodyDesc = rapier.RigidBodyDesc.fixed().setTranslation(s.x, s.y + 1.9, s.z);
      const body = world.createRigidBody(bodyDesc);
      const colDesc = rapier.ColliderDesc.cuboid(3.5, 1.9, 3.0).setFriction(0.8);
      world.createCollider(colDesc, body);
      this.rigidBodies.push(body);
    }

    this.group.add(this.structureGroup);
  }

  public dispose(scene: THREE.Scene, world: RAPIER.World): void {
    if (this.terrainMesh) {
      this.terrainMesh.geometry.dispose();
      this.terrainMesh = null;
    }
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      this.waterMesh = null;
    }
    if (this.treeInstancedMesh) {
      this.treeInstancedMesh.dispose();
      this.treeInstancedMesh = null;
    }
    if (this.boulderInstancedMesh) {
      this.boulderInstancedMesh.dispose();
      this.boulderInstancedMesh = null;
    }

    for (const body of this.rigidBodies) {
      world.removeRigidBody(body);
    }
    this.rigidBodies.length = 0;

    scene.remove(this.group);
  }
}
