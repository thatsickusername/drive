import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { AlpineHeightfield } from './alpineHeightfield';
import { createSnowMaterial } from './shaders/SnowMaterial';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class AlpineMassif {
  public group: THREE.Group;
  public heightfield: AlpineHeightfield;
  private chunkLODs: THREE.LOD[] = [];
  private rigidBodies: RAPIER.RigidBody[] = [];
  private colliders: RAPIER.Collider[] = [];
  private treeMeshes: THREE.InstancedMesh[] = [];
  private treeLodGroups: { high: THREE.InstancedMesh; low: THREE.InstancedMesh; center: THREE.Vector3 }[] = [];
  private treeFoliageGeom: THREE.BufferGeometry | null = null;
  private treeLowGeom: THREE.BufferGeometry | null = null;
  private treeMaterial: THREE.MeshStandardMaterial | null = null;
  private iceMesh: THREE.Mesh | null = null;

  // Single static scratch buffer for 103x103 extended chunk heights (reused across all 36 chunks)
  private static readonly extHeightGrid = new Float32Array(103 * 103);

  // Fixed 6x6 Grid of 400m chunks (2,400m x 2,400m total span)
  public readonly chunkSize = 400.0;
  public readonly segments = 100; // ~4.0m vertex spacing
  public readonly chunksAcross = 6;

  private terrainMaterial: THREE.MeshStandardMaterial;
  public readonly sunDir = new THREE.Vector3(140, 110, -50).normalize();

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
      sunColor: new THREE.Color(0xfff6ec),
      shadowColor: new THREE.Color(0x9ca9cb)
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
    const delta = chunkSize / N;
    const twoDelta = 2.0 * delta;

    const gridVerts = V * V;
    const skirtVerts = V * 4;
    const totalVerts = gridVerts + skirtVerts;

    const gridTriangles = N * N * 2;
    const skirtTriangles = N * 4 * 2;
    const totalTriangles = gridTriangles + skirtTriangles;

    const colorPiste = new THREE.Color(0xffffff); // Groomed corduroy snow (crisp clean white track)
    const colorPowder = new THREE.Color(0xfef9f6); // Off-piste natural powder snow (soft pastel white)
    const colorSnowShadow = new THREE.Color(0x9ca9cb); // Serene periwinkle lavender leeward shade
    const colorRock = new THREE.Color(0x443a34); // Warm exposed rugged granite bedrock
    const colorIce = new THREE.Color(0x729ab8); // Glacial frozen lake blue ice
    const sunDir = this.sunDir;

    const extW = V + 2; // 103
    const extH = AlpineMassif.extHeightGrid;
    const tempColor = new THREE.Color();
    const scale = new this.rapier.Vector3(chunkSize, 1.0, chunkSize);

    // 6x6 chunks: cx in [-3, -2, -1, 0, 1, 2], cz in [-3, -2, -1, 0, 1, 2]
    for (let cx = -3; cx <= 2; cx++) {
      for (let cz = -3; cz <= 2; cz++) {
        const worldChunkCenterX = (cx + 0.5) * chunkSize;
        const worldChunkCenterZ = (cz + 0.5) * chunkSize;

        // 1. Single-pass height evaluation into scratch buffer (respecting Invariant 1: r * V + c)
        for (let r = -1; r <= N + 1; r++) {
          const localX = (r / N - 0.5) * chunkSize;
          const wx = worldChunkCenterX + localX;
          const rowOffset = (r + 1) * extW;

          for (let c = -1; c <= N + 1; c++) {
            const localZ = (c / N - 0.5) * chunkSize;
            const wz = worldChunkCenterZ + localZ;
            extH[rowOffset + (c + 1)] = this.heightfield.sampleHeightQuick(wx, wz);
          }
        }

        const rapierHeights = new Float32Array(gridVerts);
        const positions = new Float32Array(totalVerts * 3);
        const normals = new Float32Array(totalVerts * 3);
        const colors = new Uint8Array(totalVerts * 3);
        const indices = new Uint16Array(totalTriangles * 3);

        // 2. Derive heights, central-difference normals, and vertex colors directly from buffer
        for (let r = 0; r <= N; r++) {
          const localX = (r / N - 0.5) * chunkSize;
          const wx = worldChunkCenterX + localX;
          const rowOffset = (r + 1) * extW;

          for (let c = 0; c <= N; c++) {
            const localZ = (c / N - 0.5) * chunkSize;
            const wz = worldChunkCenterZ + localZ;
            const colIdx = c + 1;

            const wy = extH[rowOffset + colIdx];

            // Invariant 1: Rapier heightfield indexing strictly r * V + c (row along X, col along Z)
            const vertIndex = r * V + c;
            rapierHeights[vertIndex] = wy;

            const pIdx = vertIndex * 3;
            positions[pIdx + 0] = localX;
            positions[pIdx + 1] = wy;
            positions[pIdx + 2] = localZ;

            // Central difference normal from height buffer
            const hL = extH[r * extW + colIdx];
            const hR = extH[(r + 2) * extW + colIdx];
            const hD = extH[rowOffset + c];
            const hU = extH[rowOffset + (c + 2)];

            const dx = hL - hR;
            const dy = twoDelta;
            const dz = hD - hU;
            const invLen = 1.0 / Math.sqrt(dx * dx + dy * dy + dz * dz);
            const nx = dx * invLen;
            const ny = dy * invLen;
            const nz = dz * invLen;

            normals[pIdx + 0] = nx;
            normals[pIdx + 1] = ny;
            normals[pIdx + 2] = nz;

            const slopeDeg = Math.acos(Math.min(1.0, Math.max(0.0, ny))) * (180.0 / Math.PI);
            const pisteDist = this.heightfield.getPisteDistance(wx, wz);
            const surfaceType = this.heightfield.getSurfaceType(wy, slopeDeg, pisteDist, wz);

            // Vertex Color blending (Clear visual distinction: PISTE, POWDER, ROCK, ICE)
            if (wy <= 0.5) {
              tempColor.copy(colorIce);
            } else if (surfaceType === 'ROCK' || slopeDeg > 42.0) {
              const rockBlend = Math.min(1.0, Math.max(0.0, (slopeDeg - 40.0) / 10.0));
              tempColor.copy(colorPowder).lerp(colorRock, Math.max(0.70, rockBlend));
            } else if (surfaceType === 'PISTE' || pisteDist < 26.0) {
              const blend = Math.max(0, Math.min(1, 1.0 - pisteDist / 26.0));
              tempColor.copy(colorPowder).lerp(colorPiste, blend);
            } else {
              tempColor.copy(colorPowder);
              // Subtle leeward shadow tinting on deep hollows
              const nDotSun = nx * sunDir.x + ny * sunDir.y + nz * sunDir.z;
              if (nDotSun < 0.25) {
                const leewardFactor = Math.max(0, (0.25 - nDotSun) / 0.75);
                tempColor.lerp(colorSnowShadow, leewardFactor * 0.25);
              }
            }

            colors[pIdx + 0] = Math.round(tempColor.r * 255);
            colors[pIdx + 1] = Math.round(tempColor.g * 255);
            colors[pIdx + 2] = Math.round(tempColor.b * 255);
          }
        }

        // 3. Build multi-resolution surface & skirt geometries (LOD0: 100x100, LOD1: 50x50, LOD2: 25x25)
        const buildLodGeometry = (lodN: number, strideStep: number): THREE.BufferGeometry => {
          const lodV = lodN + 1;
          const lodGridVerts = lodV * lodV;
          const lodTotalVerts = lodGridVerts + lodV * 4;
          const lodTotalTris = lodN * lodN * 2 + lodN * 4 * 2;

          const lPos = new Float32Array(lodTotalVerts * 3);
          const lNorm = new Float32Array(lodTotalVerts * 3);
          const lCol = new Uint8Array(lodTotalVerts * 3);
          const lIdx = new Uint16Array(lodTotalTris * 3);

          for (let rl = 0; rl <= lodN; rl++) {
            const r = rl * strideStep;
            for (let cl = 0; cl <= lodN; cl++) {
              const c = cl * strideStep;
              const srcP = (r * V + c) * 3;
              const dstP = (rl * lodV + cl) * 3;
              lPos[dstP + 0] = positions[srcP + 0];
              lPos[dstP + 1] = positions[srcP + 1];
              lPos[dstP + 2] = positions[srcP + 2];
              lNorm[dstP + 0] = normals[srcP + 0];
              lNorm[dstP + 1] = normals[srcP + 1];
              lNorm[dstP + 2] = normals[srcP + 2];
              lCol[dstP + 0] = colors[srcP + 0];
              lCol[dstP + 1] = colors[srcP + 1];
              lCol[dstP + 2] = colors[srcP + 2];
            }
          }

          let idxOffset = 0;
          for (let rl = 0; rl < lodN; rl++) {
            for (let cl = 0; cl < lodN; cl++) {
              const a = rl * lodV + cl;
              const b = (rl + 1) * lodV + cl;
              const d = rl * lodV + (cl + 1);
              const e = (rl + 1) * lodV + (cl + 1);
              lIdx[idxOffset++] = a;
              lIdx[idxOffset++] = d;
              lIdx[idxOffset++] = b;
              lIdx[idxOffset++] = b;
              lIdx[idxOffset++] = d;
              lIdx[idxOffset++] = e;
            }
          }

          let vIdx = lodGridVerts;
          const addSkirt = (startGridIdx: number, stride: number, count: number, isReversed: boolean) => {
            const edgeStart = vIdx;
            for (let i = 0; i < count; i++) {
              const surfaceIdx = startGridIdx + i * stride;
              lPos[vIdx * 3 + 0] = lPos[surfaceIdx * 3 + 0];
              lPos[vIdx * 3 + 1] = lPos[surfaceIdx * 3 + 1] - skirtDepth;
              lPos[vIdx * 3 + 2] = lPos[surfaceIdx * 3 + 2];
              lNorm[vIdx * 3 + 0] = lNorm[surfaceIdx * 3 + 0];
              lNorm[vIdx * 3 + 1] = lNorm[surfaceIdx * 3 + 1];
              lNorm[vIdx * 3 + 2] = lNorm[surfaceIdx * 3 + 2];
              lCol[vIdx * 3 + 0] = Math.round(lCol[surfaceIdx * 3 + 0] * 0.7);
              lCol[vIdx * 3 + 1] = Math.round(lCol[surfaceIdx * 3 + 1] * 0.7);
              lCol[vIdx * 3 + 2] = Math.round(lCol[surfaceIdx * 3 + 2] * 0.7);
              vIdx++;
            }
            for (let i = 0; i < count - 1; i++) {
              const topA = startGridIdx + i * stride;
              const topB = startGridIdx + (i + 1) * stride;
              const botA = edgeStart + i;
              const botB = edgeStart + (i + 1);
              if (isReversed) {
                lIdx[idxOffset++] = topA;
                lIdx[idxOffset++] = botA;
                lIdx[idxOffset++] = topB;
                lIdx[idxOffset++] = topB;
                lIdx[idxOffset++] = botA;
                lIdx[idxOffset++] = botB;
              } else {
                lIdx[idxOffset++] = topA;
                lIdx[idxOffset++] = topB;
                lIdx[idxOffset++] = botA;
                lIdx[idxOffset++] = topB;
                lIdx[idxOffset++] = botB;
                lIdx[idxOffset++] = botA;
              }
            }
          };

          addSkirt(0, 1, lodV, true);
          addSkirt(lodN * lodV, 1, lodV, false);
          addSkirt(0, lodV, lodV, false);
          addSkirt(lodN, lodV, lodV, true);

          const geom = new THREE.BufferGeometry();
          geom.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
          geom.setAttribute('normal', new THREE.BufferAttribute(lNorm, 3));
          geom.setAttribute('color', new THREE.BufferAttribute(lCol, 3, true));
          geom.setIndex(new THREE.BufferAttribute(lIdx, 1));
          geom.computeBoundingBox();
          geom.computeBoundingSphere();
          return geom;
        };

        // Build LOD0 directly from full buffers (avoiding extra copy) and subsample LOD1/LOD2
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

        // 4. Perimeter skirts for LOD0
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

            colors[vIdx * 3 + 0] = Math.round(colors[surfaceIdx * 3 + 0] * 0.7);
            colors[vIdx * 3 + 1] = Math.round(colors[surfaceIdx * 3 + 1] * 0.7);
            colors[vIdx * 3 + 2] = Math.round(colors[surfaceIdx * 3 + 2] * 0.7);

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

        // 5. Create Chunk LOD (centered at chunk surface height for accurate 3D distance switching)
        const centerSurfaceY = extH[51 * extW + 51];
        const lod = new THREE.LOD();
        lod.autoUpdate = false;
        lod.position.set(worldChunkCenterX, centerSurfaceY, worldChunkCenterZ);
        lod.matrixAutoUpdate = false;
        lod.updateMatrix();

        const geometry0 = new THREE.BufferGeometry();
        geometry0.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry0.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geometry0.setAttribute('color', new THREE.BufferAttribute(colors, 3, true));
        geometry0.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry0.computeBoundingBox();
        geometry0.computeBoundingSphere();

        const geometry1 = buildLodGeometry(50, 2);
        const geometry2 = buildLodGeometry(25, 4);

        const makeChunkMesh = (geom: THREE.BufferGeometry): THREE.Mesh => {
          const m = new THREE.Mesh(geom, this.terrainMaterial);
          m.position.set(0, -centerSurfaceY, 0);
          m.receiveShadow = true;
          m.castShadow = false;
          m.matrixAutoUpdate = false;
          m.updateMatrix();
          return m;
        };

        lod.addLevel(makeChunkMesh(geometry0), 0);
        lod.addLevel(makeChunkMesh(geometry1), 480);
        lod.addLevel(makeChunkMesh(geometry2), 950);

        this.group.add(lod);
        this.chunkLODs.push(lod);

        // 6. Build Rapier Heightfield Collider
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
    iceGeom.computeBoundingBox();
    iceGeom.computeBoundingSphere();

    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x7da3b8,
      roughness: 0.12,
      metalness: 0.18,
      side: THREE.FrontSide
    });
    this.iceMesh = new THREE.Mesh(iceGeom, iceMat);
    this.iceMesh.position.set(0, 0, 1010);
    this.iceMesh.receiveShadow = true;
    this.iceMesh.castShadow = false;
    this.iceMesh.matrixAutoUpdate = false;
    this.iceMesh.updateMatrix();
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
    const finalGeom = merged || new THREE.ConeGeometry(3.8, 16.0, 6);
    finalGeom.computeBoundingBox();
    finalGeom.computeBoundingSphere();
    return finalGeom;
  }

  private createSnowyPineLowGeometry(): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [];

    const trunkGeom = new THREE.CylinderGeometry(0.35, 0.65, 4.0, 5);
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

    const coneGeom = new THREE.ConeGeometry(4.5, 14.2, 5, 2);
    coneGeom.translate(0, 9.5, 0);
    const pos = coneGeom.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const py = pos.getY(i);
      if (py > 9.5 - 14.2 * 0.12) {
        colors[i * 3 + 0] = 0.98;
        colors[i * 3 + 1] = 0.98;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3 + 0] = 0.10;
        colors[i * 3 + 1] = 0.19;
        colors[i * 3 + 2] = 0.14;
      }
    }
    coneGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    parts.push(coneGeom);

    const merged = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
    const finalGeom = merged || new THREE.ConeGeometry(4.2, 16.0, 5);
    finalGeom.computeBoundingBox();
    finalGeom.computeBoundingSphere();
    return finalGeom;
  }

  // Spawn 14m - 24m tall alpine pine trees partitioned spatially per chunk for frustum culling
  private spawnInstancedPines(): void {
    this.treeFoliageGeom = this.createSnowyPineGeometry();
    this.treeLowGeom = this.createSnowyPineLowGeometry();

    this.treeMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.03
    });

    const maxTrees = 1200;
    const dummy = new THREE.Object3D();
    let totalTreeCount = 0;

    // 36 chunk buckets for spatial partitioning (cx in [-3, 2], cz in [-3, 2])
    const chunkMatrices: THREE.Matrix4[][] = Array.from({ length: 36 }, () => []);

    const addTree = (x: number, y: number, z: number, rotY: number, sx: number, sy: number, sz: number) => {
      const cx = Math.min(2, Math.max(-3, Math.floor(x / this.chunkSize)));
      const cz = Math.min(2, Math.max(-3, Math.floor(z / this.chunkSize)));
      const chunkIdx = (cx + 3) * 6 + (cz + 3);

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, rotY, 0);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();

      chunkMatrices[chunkIdx].push(dummy.matrix.clone());
      totalTreeCount++;
    };

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
      if (totalTreeCount >= maxTrees) break;
      const sample = this.heightfield.sampleTerrain(p.x, p.z);
      const rotY = Math.sin(p.x * 2.1 + p.z * 4.3) * Math.PI;
      addTree(p.x, sample.height - 0.4, p.z, rotY, p.s * 0.95, p.s * 1.05, p.s * 0.95);
    }

    // Deterministic organic grove clustering (natural pine stands instead of grid lines)
    const groveCount = 55;
    const treesPerGrove = 22;

    for (let g = 0; g < groveCount; g++) {
      if (totalTreeCount >= maxTrees) break;

      // Seeded pseudo-random placement for grove centers
      const gAngle = g * 2.39996; // Golden angle distribution
      const gDist = 180.0 + Math.sqrt(g / groveCount) * 820.0;
      const gcx = Math.cos(gAngle) * gDist;
      const gcz = -350.0 + (g / groveCount) * 1150.0 + (Math.sin(g * 7.1) * 90.0);

      // Exclude canyon overlook area around spawn 4 so curated trees define the scene cleanly
      const distToSpawn4 = Math.hypot(gcx - (-190.0), gcz - (-245.0));
      if (distToSpawn4 < 200.0) continue;

      // Check grove center validity
      const centerH = this.heightfield.sampleHeightQuick(gcx, gcz);
      if (centerH < 2.0 || centerH > 270.0) continue;

      const centerSample = this.heightfield.sampleTerrain(gcx, gcz);
      if (
        centerSample.slopeDeg > 30.0 ||
        centerSample.surfaceType === 'ROCK' ||
        centerSample.surfaceType === 'ICE'
      ) {
        continue;
      }

      // Scatter organic pine cluster around grove center
      const groveRadius = 38.0 + Math.abs(Math.sin(g * 3.7)) * 25.0;

      for (let t = 0; t < treesPerGrove; t++) {
        if (totalTreeCount >= maxTrees) break;

        const subAngle = (t * 2.39996) + Math.sin(t * 1.5);
        const subDist = Math.sqrt((t + 0.5) / treesPerGrove) * groveRadius;
        const tx = gcx + Math.cos(subAngle) * subDist;
        const tz = gcz + Math.sin(subAngle) * subDist;

        if (Math.hypot(tx - (-190.0), tz - (-245.0)) < 180.0) continue;

        const h = this.heightfield.sampleHeightQuick(tx, tz);
        if (h <= 1.5 || h >= 280.0) continue;

        const sample = this.heightfield.sampleTerrain(tx, tz);

        if (
          sample.slopeDeg < 32.0 &&
          sample.surfaceType !== 'ROCK' &&
          sample.surfaceType !== 'ICE'
        ) {
          const scaleY = 0.85 + Math.abs(Math.sin(tx * 0.05 + tz * 0.05)) * 0.45;
          const scaleXZ = 0.80 + Math.abs(Math.cos(tx * 0.05)) * 0.35;
          const rotY = Math.sin(tx * 3.1 + tz * 5.7) * Math.PI;

          addTree(tx, sample.height - 0.5, tz, rotY, scaleXZ, scaleY, scaleXZ);
        }
      }
    }

    // Instantiate partitioned InstancedMeshes per chunk for frustum culling & shadow discipline
    for (let chunkIdx = 0; chunkIdx < 36; chunkIdx++) {
      const matrices = chunkMatrices[chunkIdx];
      if (matrices.length === 0) continue;

      const cz = (chunkIdx % 6) - 3;
      const instancedMesh = new THREE.InstancedMesh(this.treeFoliageGeom, this.treeMaterial, matrices.length);
      for (let i = 0; i < matrices.length; i++) {
        instancedMesh.setMatrixAt(i, matrices[i]);
      }

      // Invariant 4: instanceMatrix.needsUpdate set once at boot, never per frame
      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.matrixAutoUpdate = false;
      instancedMesh.updateMatrix();
      instancedMesh.computeBoundingSphere();
      instancedMesh.computeBoundingBox();

      // Shadow discipline: only chunks in active mountain terrain cast shadows, distant river bed skipped
      instancedMesh.castShadow = (cz <= 0);
      instancedMesh.receiveShadow = true;

      // Low-poly distant pine LOD sharing the exact same instanceMatrix buffer
      const lowMesh = new THREE.InstancedMesh(this.treeLowGeom!, this.treeMaterial, matrices.length);
      lowMesh.instanceMatrix = instancedMesh.instanceMatrix;
      lowMesh.matrixAutoUpdate = false;
      lowMesh.updateMatrix();
      if (instancedMesh.boundingSphere) lowMesh.boundingSphere = instancedMesh.boundingSphere.clone();
      if (instancedMesh.boundingBox) lowMesh.boundingBox = instancedMesh.boundingBox.clone();
      lowMesh.castShadow = false;
      lowMesh.receiveShadow = false;
      lowMesh.visible = false;

      const center = instancedMesh.boundingSphere
        ? instancedMesh.boundingSphere.center.clone()
        : new THREE.Vector3();

      this.group.add(instancedMesh);
      this.group.add(lowMesh);
      this.treeMeshes.push(instancedMesh, lowMesh);
      this.treeLodGroups.push({ high: instancedMesh, low: lowMesh, center });
    }
  }

  public updateLOD(camera: THREE.Camera): void {
    for (let i = 0; i < this.chunkLODs.length; i++) {
      this.chunkLODs[i].update(camera);
    }
    const camPos = camera.position;
    const pineLodDistSq = 450 * 450;
    for (let i = 0; i < this.treeLodGroups.length; i++) {
      const entry = this.treeLodGroups[i];
      const useHigh = camPos.distanceToSquared(entry.center) <= pineLodDistSq;
      entry.high.visible = useHigh;
      entry.low.visible = !useHigh;
    }
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

    for (const lod of this.chunkLODs) {
      for (const level of lod.levels) {
        const mesh = level.object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      }
      this.group.remove(lod);
    }
    this.chunkLODs = [];

    if (this.iceMesh) {
      this.iceMesh.geometry.dispose();
      (this.iceMesh.material as THREE.Material).dispose();
      this.group.remove(this.iceMesh);
      this.iceMesh = null;
    }

    for (const treeMesh of this.treeMeshes) {
      treeMesh.dispose();
      this.group.remove(treeMesh);
    }
    this.treeMeshes = [];
    this.treeLodGroups = [];

    if (this.treeFoliageGeom) {
      this.treeFoliageGeom.dispose();
      this.treeFoliageGeom = null;
    }
    if (this.treeLowGeom) {
      this.treeLowGeom.dispose();
      this.treeLowGeom = null;
    }
    if (this.treeMaterial) {
      this.treeMaterial.dispose();
      this.treeMaterial = null;
    }

    if (this.terrainMaterial) {
      this.terrainMaterial.dispose();
    }

    this.scene.remove(this.group);
  }

  public update(
    time: number,
    cameraPos: THREE.Vector3,
    playerPos?: THREE.Vector3,
    nightFactor: number = 0.0,
    sunColor?: THREE.Color,
    shadowColor?: THREE.Color,
    goldenFactor: number = 0.0
  ): void {
    if (this.terrainMaterial && this.terrainMaterial.userData && this.terrainMaterial.userData.update) {
      this.terrainMaterial.userData.update(time, this.sunDir, cameraPos, playerPos, nightFactor, sunColor, shadowColor, goldenFactor);
    }
  }
}
