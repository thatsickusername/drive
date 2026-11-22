import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { AlpineHeightfield, TerrainSample } from './alpineHeightfield';
import { createSnowMaterial } from './SnowMaterial';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
  public readonly sunDir = new THREE.Vector3(-190, 130, -50).normalize();

  constructor(
    private scene: THREE.Scene,
    private rapier: typeof RAPIER,
    private world: RAPIER.World
  ) {
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.heightfield = new AlpineHeightfield();

    this.terrainMaterial = createSnowMaterial({
      sunDir: this.sunDir,
      sunColor: new THREE.Color(0xffefe2),
      shadowColor: new THREE.Color(0x94a6cf)
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

    const colorPiste = new THREE.Color(0xffffff); // Groomed corduroy snow (crisp clean white track)
    const colorPowder = new THREE.Color(0xfcf6f2); // Off-piste natural powder snow (warm creamy peach-tinted white)
    const colorSnowShadow = new THREE.Color(0x94a6cf); // Serene periwinkle lavender leeward shade
    const colorRock = new THREE.Color(0x423832); // Warm exposed rugged granite bedrock
    const colorIce = new THREE.Color(0x709ab8); // Glacial frozen lake blue ice
    const sunDir = this.sunDir;

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

            // Vertex Color blending (Clear visual distinction: PISTE, POWDER, ROCK, ICE)
            if (wy <= 0.5) {
              tempColor.copy(colorIce);
            } else if (sample.surfaceType === 'ROCK' || sample.slopeDeg > 38.0) {
              const rockBlend = Math.min(1.0, Math.max(0.0, (sample.slopeDeg - 36.0) / 10.0));
              tempColor.copy(colorPowder).lerp(colorRock, Math.max(0.70, rockBlend));
            } else if (sample.surfaceType === 'PISTE' || sample.pisteDist < 26.0) {
              const blend = Math.max(0, Math.min(1, 1.0 - sample.pisteDist / 26.0));
              tempColor.copy(colorPowder).lerp(colorPiste, blend);
              // Subtle corduroy grooming ridge micro-shading
              const corduroy = (Math.sin(wx * 2.2 + wz * 0.5) * 0.5 + 0.5) * 0.025 * blend;
              tempColor.addScalar(corduroy);
            } else {
              tempColor.copy(colorPowder);
              // Leeward shadow tinting on wind lips and convex powder rolls
              const nDotSun = sample.normal.x * sunDir.x + sample.normal.y * sunDir.y + sample.normal.z * sunDir.z;
              if (nDotSun < 0.35) {
                const leewardFactor = Math.max(0, (0.35 - nDotSun) / 0.65);
                tempColor.lerp(colorSnowShadow, leewardFactor * 0.55);
              }
              // Fall-line subtle wind-scoured micro-contrast
              const windScour = Math.sin(wx * 0.45 + wz * 0.18) * 0.015;
              tempColor.r = Math.min(1.0, Math.max(0.0, tempColor.r + windScour));
              tempColor.g = Math.min(1.0, Math.max(0.0, tempColor.g + windScour));
              tempColor.b = Math.min(1.0, Math.max(0.0, tempColor.b + windScour * 1.3));
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

  private createSnowyPineGeometry(): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [];

    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.35, 0.65, 4.0, 6);
    trunkGeom.translate(0, 2.0, 0);
    const trunkCount = trunkGeom.attributes.position.count;
    const trunkColors = new Float32Array(trunkCount * 3);
    for (let i = 0; i < trunkCount; i++) {
      trunkColors[i * 3 + 0] = 0.22;
      trunkColors[i * 3 + 1] = 0.16;
      trunkColors[i * 3 + 2] = 0.12;
    }
    trunkGeom.setAttribute('color', new THREE.BufferAttribute(trunkColors, 3));
    parts.push(trunkGeom);

    // 3 tiered stylized foliage cones with thick white snow caps
    const tiers = [
      { radius: 4.5, height: 7.2, y: 5.8 },
      { radius: 3.5, height: 6.2, y: 9.6 },
      { radius: 2.3, height: 5.2, y: 13.5 }
    ];

    for (const tier of tiers) {
      const coneGeom = new THREE.ConeGeometry(tier.radius, tier.height, 6, 2);
      coneGeom.translate(0, tier.y, 0);
      const pos = coneGeom.attributes.position;
      const count = pos.count;
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const py = pos.getY(i);
        // Upper 62% of each cone tier is covered in thick snow
        if (py > tier.y - tier.height * 0.12) {
          colors[i * 3 + 0] = 0.98;
          colors[i * 3 + 1] = 0.98;
          colors[i * 3 + 2] = 1.0;
        } else {
          // Dark alpine evergreen needles underneath
          colors[i * 3 + 0] = 0.10;
          colors[i * 3 + 1] = 0.19;
          colors[i * 3 + 2] = 0.14;
        }
      }

      coneGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      parts.push(coneGeom);
    }

    const merged = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
    return merged || new THREE.ConeGeometry(3.8, 16.0, 6);
  }

  // Spawn 14m - 24m tall alpine pine trees (roughly 10x player height to sell real mountain scale)
  private spawnInstancedPines(): void {
    const treeFoliageGeom = this.createSnowyPineGeometry();

    const treeMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.03
    });

    const maxTrees = 1200;
    this.treeInstancedMesh = new THREE.InstancedMesh(treeFoliageGeom, treeMaterial, maxTrees);
    this.treeInstancedMesh.castShadow = true;
    this.treeInstancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let treeCount = 0;

    // 1. Curated stand of snowy pines along the right ridge shoulder (matching acceptance criteria 1)
    const canyonRightPines = [
      // Row 1 (inner crest along the right slope)
      { x: -228, z: -232, s: 0.85 },
      { x: -224, z: -218, s: 0.82 },
      { x: -220, z: -204, s: 0.80 },
      { x: -216, z: -190, s: 0.82 },
      { x: -212, z: -176, s: 0.78 },
      { x: -208, z: -162, s: 0.76 },
      { x: -204, z: -148, s: 0.74 },
      // Row 2 (outer crest along the right slope)
      { x: -238, z: -228, s: 0.86 },
      { x: -234, z: -214, s: 0.84 },
      { x: -230, z: -200, s: 0.82 },
      { x: -226, z: -186, s: 0.80 },
      { x: -222, z: -172, s: 0.78 },
      { x: -218, z: -158, s: 0.76 },
      { x: -214, z: -144, s: 0.74 },
      // Left shoulder sparse trees on mid-slope (matching reference)
      { x: -164, z: -230, s: 0.65 },
      { x: -168, z: -218, s: 0.68 },
      { x: -172, z: -206, s: 0.64 },
      { x: -176, z: -194, s: 0.60 },
      // Distant ridge crest pines
      { x: -80, z: -160, s: 0.70 },
      { x: -68, z: -148, s: 0.68 },
      { x: -55, z: -135, s: 0.72 },
      { x: -42, z: -122, s: 0.70 },
      { x: -30, z: -110, s: 0.68 },
      { x: -18, z: -98, s: 0.65 },
      // Distant summit crest pines
      { x: -160, z: -380, s: 0.55 },
      { x: -150, z: -375, s: 0.58 },
      { x: -140, z: -370, s: 0.52 },
      { x: -130, z: -365, s: 0.56 },
      { x: -120, z: -360, s: 0.54 }
    ];

    for (const p of canyonRightPines) {
      if (treeCount >= maxTrees) break;
      const sample = this.heightfield.sampleTerrain(p.x, p.z);
      dummy.position.set(p.x, sample.height - 0.4, p.z);
      dummy.rotation.y = Math.sin(p.x * 2.1 + p.z * 4.3) * Math.PI;
      dummy.scale.set(p.s * 0.95, p.s * 1.05, p.s * 0.95);
      dummy.updateMatrix();
      this.treeInstancedMesh.setMatrixAt(treeCount++, dummy.matrix);
    }

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

      // Exclude canyon overlook area around spawn 4 so curated trees define the scene cleanly
      const distToSpawn4 = Math.hypot(gcx - (-190.0), gcz - (-245.0));
      if (distToSpawn4 < 200.0) continue;

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

        if (Math.hypot(tx - (-190.0), tz - (-245.0)) < 180.0) continue;

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

  public update(time: number, cameraPos: THREE.Vector3): void {
    if (this.terrainMaterial && this.terrainMaterial.userData && this.terrainMaterial.userData.update) {
      this.terrainMaterial.userData.update(time, this.sunDir, cameraPos);
    }
  }
}
