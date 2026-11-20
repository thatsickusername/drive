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
  private iceMesh: THREE.Mesh | null = null;

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
    this.createFrozenRiverPlane();
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
    const colorPowder = new THREE.Color(0xeef3f8);
    const colorSnowShadow = new THREE.Color(0xdce7f2); // Cooler leeward rim & wind-lip shadow tint
    const colorRock = new THREE.Color(0x6e5c52);
    const colorIce = new THREE.Color(0x7da3b8);
    const sunDir = new THREE.Vector3(160, 120, 90).normalize();

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

            // Vertex Color blending (Alvdalen natural snow-dominant alpine biome)
            if (wy <= 0.5) {
              tempColor.copy(colorIce);
            } else if (sample.slopeDeg > 42.0) {
              const rockBlend = Math.min(1.0, (sample.slopeDeg - 42.0) / 8.0);
              tempColor.copy(colorPowder).lerp(colorRock, rockBlend);
            } else if (sample.surfaceType === 'PISTE') {
              const blend = Math.max(0, Math.min(1, 1.0 - sample.pisteDist / 32.0));
              tempColor.copy(colorPowder).lerp(colorPiste, blend);
            } else {
              tempColor.copy(colorPowder);
              // Rim/horizon contrast on convex crests & leeward shadow tinting on wind lips
              const nDotSun = sample.normal.x * sunDir.x + sample.normal.y * sunDir.y + sample.normal.z * sunDir.z;
              if (nDotSun < 0.35) {
                const leewardFactor = Math.max(0, (0.35 - nDotSun) / 0.65);
                tempColor.lerp(colorSnowShadow, leewardFactor * 0.45);
              }
              // Fall-line subtle wind-scoured normal micro-contrast
              const windScour = Math.sin(wx * 0.45 + wz * 0.18) * 0.012;
              tempColor.r = Math.min(1.0, Math.max(0.0, tempColor.r + windScour));
              tempColor.g = Math.min(1.0, Math.max(0.0, tempColor.g + windScour));
              tempColor.b = Math.min(1.0, Math.max(0.0, tempColor.b + windScour * 1.25));
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
          .setRestitution(0.0);

        const collider = this.world.createCollider(heightfieldDesc, rigidBody);
        this.rigidBodies.push(rigidBody);
        this.colliders.push(collider);
      }
    }
  }

  // Flat Frozen River / Ice Mesh across the bottom basin (z in [800, 1220]) at y = 0
  private createFrozenRiverPlane(): void {
    const iceGeom = new THREE.PlaneGeometry(2400, 420);
    iceGeom.rotateX(-Math.PI / 2);
    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x7da3b8,
      roughness: 0.12,
      metalness: 0.18,
      side: THREE.FrontSide
    });
    this.iceMesh = new THREE.Mesh(iceGeom, iceMat);
    this.iceMesh.position.set(0, 0, 1010);
    this.iceMesh.receiveShadow = true;
    this.group.add(this.iceMesh);
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

    // Deterministic organic grove clustering (natural pine stands instead of grid lines)
    const groveCount = 55;
    const treesPerGrove = 22;

    for (let g = 0; g < groveCount; g++) {
      if (treeCount >= maxTrees) break;

      // Seeded pseudo-random placement for grove centers
      const gAngle = g * 2.39996; // Golden angle distribution
      const gDist = 180.0 + Math.sqrt(g / groveCount) * 820.0;
      const gcx = Math.cos(gAngle) * gDist;
      const gcz = -350.0 + (g / groveCount) * 1150.0 + (Math.sin(g * 7.1) * 90.0);

      // Check grove center validity
      const centerSample = this.heightfield.sampleTerrain(gcx, gcz);
      if (
        centerSample.height < 2.0 ||
        centerSample.height > 270.0 ||
        centerSample.slopeDeg > 30.0 ||
        centerSample.surfaceType === 'ROCK' ||
        centerSample.surfaceType === 'ICE'
      ) {
        continue;
      }

      // Scatter organic pine cluster around grove center
      const groveRadius = 38.0 + Math.abs(Math.sin(g * 3.7)) * 25.0;

      for (let t = 0; t < treesPerGrove; t++) {
        if (treeCount >= maxTrees) break;

        const subAngle = (t * 2.39996) + Math.sin(t * 1.5);
        const subDist = Math.sqrt((t + 0.5) / treesPerGrove) * groveRadius;
        const tx = gcx + Math.cos(subAngle) * subDist;
        const tz = gcz + Math.sin(subAngle) * subDist;

        const sample = this.heightfield.sampleTerrain(tx, tz);

        if (
          sample.height > 1.5 &&
          sample.height < 280.0 &&
          sample.slopeDeg < 32.0 &&
          sample.surfaceType !== 'ROCK' &&
          sample.surfaceType !== 'ICE'
        ) {
          const scaleY = 0.85 + Math.abs(Math.sin(tx * 0.05 + tz * 0.05)) * 0.45;
          const scaleXZ = 0.80 + Math.abs(Math.cos(tx * 0.05)) * 0.35;

          dummy.position.set(tx, sample.height - 0.5, tz);
          dummy.rotation.y = Math.sin(tx * 3.1 + tz * 5.7) * Math.PI;
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

    if (this.iceMesh) {
      this.iceMesh.geometry.dispose();
      (this.iceMesh.material as THREE.Material).dispose();
      this.group.remove(this.iceMesh);
      this.iceMesh = null;
    }

    if (this.treeInstancedMesh) {
      this.treeInstancedMesh.geometry.dispose();
      this.group.remove(this.treeInstancedMesh);
      this.treeInstancedMesh = null;
    }

    this.scene.remove(this.group);
  }
}
