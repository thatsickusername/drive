import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { AlpineHeightfield, TerrainSample } from './alpineHeightfield';

export class AlpineMassif {
  public group: THREE.Group;
  public heightfield: AlpineHeightfield;
  private chunkMeshes: THREE.Mesh[] = [];
  private rigidBodies: RAPIER.RigidBody[] = [];
  private colliders: RAPIER.Collider[] = [];
  private treeInstancedMesh: THREE.InstancedMesh | null = null;

  // Fixed 6x6 Grid of 400m chunks (2,400m x 2,400m total span)
  public readonly chunkSize = 400.0;
  public readonly segments = 100; // ~4.0m vertex spacing
  public readonly chunksAcross = 6;

  private terrainMaterial: THREE.MeshStandardMaterial;

  constructor(
    private scene: THREE.Scene,
    private rapier: typeof RAPIER,
    private world: RAPIER.World
  ) {
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.heightfield = new AlpineHeightfield();

    this.terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.04,
      flatShading: false,
      side: THREE.FrontSide
    });

    this.generateMassif();
    this.spawnInstancedPines();
  }

  private generateMassif(): void {
    const N = this.segments;
    const V = N + 1;
    const chunkSize = this.chunkSize;
    const skirtDepth = 45.0;

    const gridVerts = V * V;
    const skirtVerts = V * 4;
    const totalVerts = gridVerts + skirtVerts;

    const gridTriangles = N * N * 2;
    const skirtTriangles = N * 4 * 2;
    const totalTriangles = gridTriangles + skirtTriangles;

    const colorPiste = new THREE.Color(0xf4f8ff);
    const colorPowder = new THREE.Color(0xe8eef5);
    const colorRock = new THREE.Color(0x4a525d);

    // 6x6 chunks: cx in [-3, -2, -1, 0, 1, 2], cz in [-3, -2, -1, 0, 1, 2]
    for (let cx = -3; cx <= 2; cx++) {
      for (let cz = -3; cz <= 2; cz++) {
        const worldChunkCenterX = (cx + 0.5) * chunkSize;
        const worldChunkCenterZ = (cz + 0.5) * chunkSize;

        const rapierHeights = new Float32Array(gridVerts);
        const positions = new Float32Array(totalVerts * 3);
        const normals = new Float32Array(totalVerts * 3);
        const colors = new Float32Array(totalVerts * 3);
        const indices = new Uint32Array(totalTriangles * 3);

        const tempColor = new THREE.Color();

        // 1. Evaluate heights, normals, and vertex colors
        for (let r = 0; r <= N; r++) {
          const localX = (r / N - 0.5) * chunkSize;
          const wx = worldChunkCenterX + localX;

          for (let c = 0; c <= N; c++) {
            const localZ = (c / N - 0.5) * chunkSize;
            const wz = worldChunkCenterZ + localZ;

            const sample: TerrainSample = this.heightfield.sampleTerrain(wx, wz);
            const wy = sample.height;

            const rapierIndex = r * V + c;
            rapierHeights[rapierIndex] = wy;

            const vertIndex = r * V + c;
            const pIdx = vertIndex * 3;
            positions[pIdx + 0] = localX;
            positions[pIdx + 1] = wy;
            positions[pIdx + 2] = localZ;

            normals[pIdx + 0] = sample.normal.x;
            normals[pIdx + 1] = sample.normal.y;
            normals[pIdx + 2] = sample.normal.z;

            // Vertex Color blending
            if (sample.surfaceType === 'PISTE') {
              const blend = Math.max(0, Math.min(1, 1.0 - sample.pisteDist / 32.0));
              tempColor.copy(colorPowder).lerp(colorPiste, blend);
            } else if (sample.slopeDeg > 38.0) {
              const rockBlend = Math.min(1.0, (sample.slopeDeg - 38.0) / 14.0);
              tempColor.copy(colorPowder).lerp(colorRock, rockBlend);
            } else {
              tempColor.copy(colorPowder);
            }

            colors[pIdx + 0] = tempColor.r;
            colors[pIdx + 1] = tempColor.g;
            colors[pIdx + 2] = tempColor.b;
          }
        }

        // 2. Build surface grid triangle indices
        let idxOffset = 0;
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            const a = r * V + c;
            const b = (r + 1) * V + c;
            const d = r * V + (c + 1);
            const e = (r + 1) * V + (c + 1);

            indices[idxOffset++] = a;
            indices[idxOffset++] = d;
            indices[idxOffset++] = b;

            indices[idxOffset++] = b;
            indices[idxOffset++] = d;
            indices[idxOffset++] = e;
          }
        }

        // 3. Perimeter skirts
        let vIdx = gridVerts;
        const addSkirtEdge = (startGridIdx: number, stride: number, count: number, isReversed: boolean) => {
          const edgeStart = vIdx;
          for (let i = 0; i < count; i++) {
            const surfaceIdx = startGridIdx + i * stride;
            positions[vIdx * 3 + 0] = positions[surfaceIdx * 3 + 0];
            positions[vIdx * 3 + 1] = positions[surfaceIdx * 3 + 1] - skirtDepth;
            positions[vIdx * 3 + 2] = positions[surfaceIdx * 3 + 2];

            normals[vIdx * 3 + 0] = normals[surfaceIdx * 3 + 0];
            normals[vIdx * 3 + 1] = normals[surfaceIdx * 3 + 1];
            normals[vIdx * 3 + 2] = normals[surfaceIdx * 3 + 2];

            colors[vIdx * 3 + 0] = colors[surfaceIdx * 3 + 0] * 0.7;
            colors[vIdx * 3 + 1] = colors[surfaceIdx * 3 + 1] * 0.7;
            colors[vIdx * 3 + 2] = colors[surfaceIdx * 3 + 2] * 0.7;

            vIdx++;
          }

          for (let i = 0; i < count - 1; i++) {
            const topA = startGridIdx + i * stride;
            const topB = startGridIdx + (i + 1) * stride;
            const botA = edgeStart + i;
            const botB = edgeStart + (i + 1);

            if (isReversed) {
              indices[idxOffset++] = topA;
              indices[idxOffset++] = botA;
              indices[idxOffset++] = topB;

              indices[idxOffset++] = topB;
              indices[idxOffset++] = botA;
              indices[idxOffset++] = botB;
            } else {
              indices[idxOffset++] = topA;
              indices[idxOffset++] = topB;
              indices[idxOffset++] = botA;

              indices[idxOffset++] = topB;
              indices[idxOffset++] = botB;
              indices[idxOffset++] = botA;
            }
          }
        };

        addSkirtEdge(0, 1, V, true);
        addSkirtEdge(N * V, 1, V, false);
        addSkirtEdge(0, V, V, false);
        addSkirtEdge(N, V, V, true);

        // 4. Create Mesh
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        const mesh = new THREE.Mesh(geometry, this.terrainMaterial);
        mesh.position.set(worldChunkCenterX, 0, worldChunkCenterZ);
        mesh.receiveShadow = true;
        mesh.castShadow = false;

        this.group.add(mesh);
        this.chunkMeshes.push(mesh);

        // 5. Build Rapier Heightfield Collider
        const scale = new this.rapier.Vector3(chunkSize, 1.0, chunkSize);
        const bodyDesc = this.rapier.RigidBodyDesc.fixed().setTranslation(worldChunkCenterX, 0, worldChunkCenterZ);
        const rigidBody = this.world.createRigidBody(bodyDesc);

        const heightfieldDesc = this.rapier.ColliderDesc.heightfield(
          N,
          N,
          rapierHeights,
          scale
        )
          .setFriction(0.02)
          .setRestitution(0.02);

        const collider = this.world.createCollider(heightfieldDesc, rigidBody);
        this.rigidBodies.push(rigidBody);
        this.colliders.push(collider);
      }
    }
  }

  // Spawn 14m - 24m tall alpine pine trees (roughly 10x player height to sell real mountain scale)
  private spawnInstancedPines(): void {
    // Build stylized alpine pine geometry: 3 tiered foliage cones + trunk
    const pineGroup = new THREE.Group();

    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.35, 0.6, 4.0, 5);
    trunkGeom.translate(0, 2.0, 0);

    // Foliage cones (16m tall overall)
    const cone1Geom = new THREE.ConeGeometry(4.2, 7.5, 6);
    cone1Geom.translate(0, 6.5, 0);

    const cone2Geom = new THREE.ConeGeometry(3.2, 6.5, 6);
    cone2Geom.translate(0, 10.5, 0);

    const cone3Geom = new THREE.ConeGeometry(2.0, 5.0, 6);
    cone3Geom.translate(0, 14.2, 0);

    // Combine into single BufferGeometry
    const trunkMesh = new THREE.Mesh(trunkGeom);
    const c1 = new THREE.Mesh(cone1Geom);
    const c2 = new THREE.Mesh(cone2Geom);
    const c3 = new THREE.Mesh(cone3Geom);
    pineGroup.add(trunkMesh, c1, c2, c3);

    // Create a simplified unified tree geometry
    const treeFoliageGeom = new THREE.ConeGeometry(3.8, 16.0, 6);
    treeFoliageGeom.translate(0, 9.0, 0);

    const treeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3325, // Deep winter alpine evergreen
      roughness: 0.75,
      metalness: 0.05
    });

    const maxTrees = 1200;
    this.treeInstancedMesh = new THREE.InstancedMesh(treeFoliageGeom, treeMaterial, maxTrees);
    this.treeInstancedMesh.castShadow = true;
    this.treeInstancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let treeCount = 0;

    // Deterministic jittered grid distribution across the lower and mid mountain (y < 360m)
    const step = 45; // 45m grid
    for (let x = -1050; x <= 1050; x += step) {
      for (let z = -650; z <= 900; z += step) {
        if (treeCount >= maxTrees) break;

        // Jitter position
        const jx = x + (Math.sin(x * 12.3 + z * 34.5) * 0.5) * 28.0;
        const jz = z + (Math.cos(x * 45.6 + z * 78.9) * 0.5) * 28.0;

        const sample = this.heightfield.sampleTerrain(jx, jz);

        // Filter: only in forest elevation zones, off groomed pistes, not on sheer rock
        if (
          sample.height > 25 &&
          sample.height < 340 &&
          sample.pisteDist > 38 &&
          sample.slopeDeg < 34 &&
          sample.surfaceType !== 'ROCK'
        ) {
          // Scale tree height between 14m and 22m tall (roughly 10x player height!)
          const scaleY = 0.9 + Math.abs(Math.sin(jx * 0.05 + jz * 0.05)) * 0.5;
          const scaleXZ = 0.85 + Math.abs(Math.cos(jx * 0.05)) * 0.35;

          dummy.position.set(jx, sample.height - 0.5, jz);
          dummy.rotation.y = Math.sin(jx + jz) * Math.PI;
          dummy.scale.set(scaleXZ, scaleY, scaleXZ);
          dummy.updateMatrix();

          this.treeInstancedMesh.setMatrixAt(treeCount, dummy.matrix);
          treeCount++;
        }
      }
    }

    this.treeInstancedMesh.count = treeCount;
    this.treeInstancedMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.treeInstancedMesh);
  }

  public dispose(): void {
    for (const c of this.colliders) {
      this.world.removeCollider(c, false);
    }
    for (const rb of this.rigidBodies) {
      this.world.removeRigidBody(rb);
    }
    this.colliders = [];
    this.rigidBodies = [];

    for (const mesh of this.chunkMeshes) {
      mesh.geometry.dispose();
      this.group.remove(mesh);
    }
    this.chunkMeshes = [];

    if (this.treeInstancedMesh) {
      this.treeInstancedMesh.geometry.dispose();
      this.group.remove(this.treeInstancedMesh);
      this.treeInstancedMesh = null;
    }

    this.scene.remove(this.group);
  }
}
