import * as THREE from 'three';
import { AlpineHeightfield } from './alpineHeightfield';

export interface RawLodGeometryData {
  positions: Float32Array;
  normals: Float32Array;
  colors: Uint8Array;
  indices: Uint16Array;
}

export interface RawChunkData {
  cx: number;
  cz: number;
  worldChunkCenterX: number;
  worldChunkCenterZ: number;
  centerSurfaceY: number;
  rapierHeights: Float32Array;
  lod0: RawLodGeometryData;
  lod1: RawLodGeometryData;
  lod2: RawLodGeometryData;
}

export interface RawPineChunkData {
  cz: number;
  count: number;
  matrices: Float32Array;
}

export interface RawMassifData {
  chunks: RawChunkData[];
  pineChunks: RawPineChunkData[];
}

export const MASSIF_CHUNK_SIZE = 400.0;
export const MASSIF_SEGMENTS = 100;

/**
 * Pure worker-safe generator producing all 36 terrain chunk LODs, Rapier heightfields,
 * and spatially partitioned pine instance matrices as transferable typed arrays.
 */
export function buildMassifRawData(
  sunDirObj: { x: number; y: number; z: number },
  transferables?: Transferable[]
): RawMassifData {
  const heightfield = new AlpineHeightfield();
  const N = MASSIF_SEGMENTS;
  const V = N + 1;
  const chunkSize = MASSIF_CHUNK_SIZE;
  const skirtDepth = 45.0;
  const delta = chunkSize / N;
  const twoDelta = 2.0 * delta;

  const gridVerts = V * V;
  const skirtVerts = V * 4;
  const totalVerts = gridVerts + skirtVerts;

  const gridTriangles = N * N * 2;
  const skirtTriangles = N * 4 * 2;
  const totalTriangles = gridTriangles + skirtTriangles;

  const colorPiste = new THREE.Color(0xffffff);
  const colorPowder = new THREE.Color(0xfef9f6);
  const colorSnowShadow = new THREE.Color(0x9ca9cb);
  const colorRock = new THREE.Color(0x443a34);
  const colorIce = new THREE.Color(0x729ab8);

  const extW = V + 2; // 103
  const extH = new Float32Array(extW * extW);
  const tempColor = new THREE.Color();

  const chunks: RawChunkData[] = [];
  const pushTransfer = (arr: ArrayBufferView) => {
    if (transferables) transferables.push(arr.buffer);
  };

  for (let cx = -3; cx <= 2; cx++) {
    for (let cz = -3; cz <= 2; cz++) {
      const worldChunkCenterX = (cx + 0.5) * chunkSize;
      const worldChunkCenterZ = (cz + 0.5) * chunkSize;

      // 1. Single-pass height evaluation into scratch buffer (Invariant 1: r * V + c)
      for (let r = -1; r <= N + 1; r++) {
        const localX = (r / N - 0.5) * chunkSize;
        const wx = worldChunkCenterX + localX;
        const rowOffset = (r + 1) * extW;

        for (let c = -1; c <= N + 1; c++) {
          const localZ = (c / N - 0.5) * chunkSize;
          const wz = worldChunkCenterZ + localZ;
          extH[rowOffset + (c + 1)] = heightfield.sampleHeightQuick(wx, wz);
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
          const vertIndex = r * V + c;
          rapierHeights[vertIndex] = wy;

          const pIdx = vertIndex * 3;
          positions[pIdx + 0] = localX;
          positions[pIdx + 1] = wy;
          positions[pIdx + 2] = localZ;

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
          const pisteDist = heightfield.getPisteDistance(wx, wz);
          const surfaceType = heightfield.getSurfaceType(wy, slopeDeg, pisteDist, wz);

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
            const nDotSun = nx * sunDirObj.x + ny * sunDirObj.y + nz * sunDirObj.z;
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

      // 3. Build LOD1 (50x50) and LOD2 (25x25) before adding LOD0 skirts
      const buildLodData = (lodN: number, strideStep: number): RawLodGeometryData => {
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

        pushTransfer(lPos);
        pushTransfer(lNorm);
        pushTransfer(lCol);
        pushTransfer(lIdx);
        return { positions: lPos, normals: lNorm, colors: lCol, indices: lIdx };
      };

      const lod1 = buildLodData(50, 2);
      const lod2 = buildLodData(25, 4);

      // 4. LOD0 indices & skirts
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

      pushTransfer(rapierHeights);
      pushTransfer(positions);
      pushTransfer(normals);
      pushTransfer(colors);
      pushTransfer(indices);

      chunks.push({
        cx,
        cz,
        worldChunkCenterX,
        worldChunkCenterZ,
        centerSurfaceY: extH[51 * extW + 51],
        rapierHeights,
        lod0: { positions, normals, colors, indices },
        lod1,
        lod2
      });
    }
  }

  // 5. Generate spatially partitioned pine matrices (matching exact deterministic layout)
  const maxTrees = 1200;
  let totalTreeCount = 0;
  const chunkFloatLists: number[][] = Array.from({ length: 36 }, () => []);
  const posVec = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scaleVec = new THREE.Vector3();
  const upAxis = new THREE.Vector3(0, 1, 0);
  const mat = new THREE.Matrix4();

  const addTree = (x: number, y: number, z: number, rotY: number, sx: number, sy: number, sz: number) => {
    const cx = Math.min(2, Math.max(-3, Math.floor(x / chunkSize)));
    const cz = Math.min(2, Math.max(-3, Math.floor(z / chunkSize)));
    const chunkIdx = (cx + 3) * 6 + (cz + 3);

    posVec.set(x, y, z);
    quat.setFromAxisAngle(upAxis, rotY);
    scaleVec.set(sx, sy, sz);
    mat.compose(posVec, quat, scaleVec);

    const list = chunkFloatLists[chunkIdx];
    const el = mat.elements;
    for (let i = 0; i < 16; i++) list.push(el[i]);
    totalTreeCount++;
  };

  const canyonRightPines = [
    { x: -228, z: -232, s: 0.85 },
    { x: -224, z: -218, s: 0.82 },
    { x: -220, z: -204, s: 0.80 },
    { x: -216, z: -190, s: 0.82 },
    { x: -212, z: -176, s: 0.78 },
    { x: -208, z: -162, s: 0.76 },
    { x: -204, z: -148, s: 0.74 },
    { x: -238, z: -228, s: 0.86 },
    { x: -234, z: -214, s: 0.84 },
    { x: -230, z: -200, s: 0.82 },
    { x: -226, z: -186, s: 0.80 },
    { x: -222, z: -172, s: 0.78 },
    { x: -218, z: -158, s: 0.76 },
    { x: -214, z: -144, s: 0.74 },
    { x: -164, z: -230, s: 0.65 },
    { x: -168, z: -218, s: 0.68 },
    { x: -172, z: -206, s: 0.64 },
    { x: -176, z: -194, s: 0.60 },
    { x: -80, z: -160, s: 0.70 },
    { x: -68, z: -148, s: 0.68 },
    { x: -55, z: -135, s: 0.72 },
    { x: -42, z: -122, s: 0.70 },
    { x: -30, z: -110, s: 0.68 },
    { x: -18, z: -98, s: 0.65 },
    { x: -160, z: -380, s: 0.55 },
    { x: -150, z: -375, s: 0.58 },
    { x: -140, z: -370, s: 0.52 },
    { x: -130, z: -365, s: 0.56 },
    { x: -120, z: -360, s: 0.54 }
  ];

  for (const p of canyonRightPines) {
    if (totalTreeCount >= maxTrees) break;
    const sample = heightfield.sampleTerrain(p.x, p.z);
    const rotY = Math.sin(p.x * 2.1 + p.z * 4.3) * Math.PI;
    addTree(p.x, sample.height - 0.4, p.z, rotY, p.s * 0.95, p.s * 1.05, p.s * 0.95);
  }

  const groveCount = 55;
  const treesPerGrove = 22;

  for (let g = 0; g < groveCount; g++) {
    if (totalTreeCount >= maxTrees) break;
    const gAngle = g * 2.39996;
    const gDist = 180.0 + Math.sqrt(g / groveCount) * 820.0;
    const gcx = Math.cos(gAngle) * gDist;
    const gcz = -350.0 + (g / groveCount) * 1150.0 + (Math.sin(g * 7.1) * 90.0);

    if (Math.hypot(gcx - (-190.0), gcz - (-245.0)) < 200.0) continue;
    const centerH = heightfield.sampleHeightQuick(gcx, gcz);
    if (centerH < 2.0 || centerH > 270.0) continue;

    const centerSample = heightfield.sampleTerrain(gcx, gcz);
    if (
      centerSample.slopeDeg > 30.0 ||
      centerSample.surfaceType === 'ROCK' ||
      centerSample.surfaceType === 'ICE'
    ) {
      continue;
    }

    const groveRadius = 38.0 + Math.abs(Math.sin(g * 3.7)) * 25.0;
    for (let t = 0; t < treesPerGrove; t++) {
      if (totalTreeCount >= maxTrees) break;
      const subAngle = (t * 2.39996) + Math.sin(t * 1.5);
      const subDist = Math.sqrt((t + 0.5) / treesPerGrove) * groveRadius;
      const tx = gcx + Math.cos(subAngle) * subDist;
      const tz = gcz + Math.sin(subAngle) * subDist;

      if (Math.hypot(tx - (-190.0), tz - (-245.0)) < 180.0) continue;

      const h = heightfield.sampleHeightQuick(tx, tz);
      if (h <= 1.5 || h >= 280.0) continue;

      const sample = heightfield.sampleTerrain(tx, tz);
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

  const pineChunks: RawPineChunkData[] = [];
  for (let chunkIdx = 0; chunkIdx < 36; chunkIdx++) {
    const list = chunkFloatLists[chunkIdx];
    if (list.length === 0) continue;
    const matrices = new Float32Array(list);
    pushTransfer(matrices);
    pineChunks.push({
      cz: (chunkIdx % 6) - 3,
      count: list.length / 16,
      matrices
    });
  }

  return { chunks, pineChunks };
}
