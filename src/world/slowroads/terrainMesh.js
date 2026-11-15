// Terrain mesh generator extracted from Slow Roads
// Generates LOD terrain tile meshes with analytical normal calculation and vertical skirts to eliminate LOD seams

export class TerrainMeshGenerator {
  constructor(options = {}) {
    this.tileSize = options.tileSize || 400;
    this.skirtDepth = options.skirtDepth || 20;
    this.normalEps = options.normalEps || 1.0;
  }

  /**
   * Generates a terrain tile mesh at the specified tile coordinates
   * @param {number} tileX - tile coordinate X
   * @param {number} tileZ - tile coordinate Z
   * @param {number} segments - grid subdivision count (e.g. 32 for LOD0, 16 for LOD1)
   * @param {function} heightFunc - function(x, z) returning elevation
   * @returns {object} { positions, normals, uvs, indices } Float32/Uint16 arrays
   */
  generateTileMesh(tileX, tileZ, segments, heightFunc) {
    const startX = tileX * this.tileSize;
    const startZ = tileZ * this.tileSize;
    const step = this.tileSize / segments;
    const vertsPerRow = segments + 1;
    const gridVertCount = vertsPerRow * vertsPerRow;

    // Perimeter vertices for vertical skirts: 4 edges * (segments + 1)
    const skirtVertCount = (segments + 1) * 4;
    const totalVerts = gridVertCount + skirtVertCount;

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);

    let vIdx = 0;
    let uvIdx = 0;

    // 1. Generate surface vertices & compute analytical normals
    for (let iz = 0; iz <= segments; iz++) {
      const worldZ = startZ + iz * step;
      for (let ix = 0; ix <= segments; ix++) {
        const worldX = startX + ix * step;
        const height = heightFunc(worldX, worldZ);

        positions[vIdx * 3] = worldX;
        positions[vIdx * 3 + 1] = height;
        positions[vIdx * 3 + 2] = worldZ;

        // Analytical normal via central differences
        const hR = heightFunc(worldX + this.normalEps, worldZ);
        const hL = heightFunc(worldX - this.normalEps, worldZ);
        const hD = heightFunc(worldX, worldZ + this.normalEps);
        const hU = heightFunc(worldX, worldZ - this.normalEps);

        const nx = -(hR - hL) / (2 * this.normalEps);
        const ny = 1.0;
        const nz = -(hD - hU) / (2 * this.normalEps);
        const invLen = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);

        normals[vIdx * 3] = nx * invLen;
        normals[vIdx * 3 + 1] = ny * invLen;
        normals[vIdx * 3 + 2] = nz * invLen;

        uvs[uvIdx * 2] = ix / segments;
        uvs[uvIdx * 2 + 1] = iz / segments;

        vIdx++;
        uvIdx++;
      }
    }

    // 2. Generate surface grid triangle indices
    const gridTriangles = segments * segments * 2;
    const skirtTriangles = segments * 4 * 2;
    const indices = new (totalVerts > 65535 ? Uint32Array : Uint16Array)((gridTriangles + skirtTriangles) * 3);
    let iIdx = 0;

    for (let iz = 0; iz < segments; iz++) {
      for (let ix = 0; ix < segments; ix++) {
        const a = iz * vertsPerRow + ix;
        const b = (iz + 1) * vertsPerRow + ix;
        const c = (iz + 1) * vertsPerRow + (ix + 1);
        const d = iz * vertsPerRow + (ix + 1);

        indices[iIdx++] = a;
        indices[iIdx++] = b;
        indices[iIdx++] = d;

        indices[iIdx++] = d;
        indices[iIdx++] = b;
        indices[iIdx++] = c;
      }
    }

    // 3. Generate vertical skirts along the 4 borders
    const skirtStartIdx = vIdx;

    const addSkirtEdge = (startGridIdx, stride, count, isReversed) => {
      const edgeStart = vIdx;
      for (let i = 0; i < count; i++) {
        const surfaceIdx = startGridIdx + i * stride;
        positions[vIdx * 3] = positions[surfaceIdx * 3];
        positions[vIdx * 3 + 1] = positions[surfaceIdx * 3 + 1] - this.skirtDepth;
        positions[vIdx * 3 + 2] = positions[surfaceIdx * 3 + 2];

        normals[vIdx * 3] = normals[surfaceIdx * 3];
        normals[vIdx * 3 + 1] = normals[surfaceIdx * 3 + 1];
        normals[vIdx * 3 + 2] = normals[surfaceIdx * 3 + 2];

        uvs[uvIdx * 2] = uvs[surfaceIdx * 2];
        uvs[uvIdx * 2 + 1] = uvs[surfaceIdx * 2 + 1];

        vIdx++;
        uvIdx++;
      }

      for (let i = 0; i < count - 1; i++) {
        const topA = startGridIdx + i * stride;
        const topB = startGridIdx + (i + 1) * stride;
        const botA = edgeStart + i;
        const botB = edgeStart + (i + 1);

        if (isReversed) {
          indices[iIdx++] = topA;
          indices[iIdx++] = botA;
          indices[iIdx++] = topB;

          indices[iIdx++] = topB;
          indices[iIdx++] = botA;
          indices[iIdx++] = botB;
        } else {
          indices[iIdx++] = topA;
          indices[iIdx++] = topB;
          indices[iIdx++] = botA;

          indices[iIdx++] = topB;
          indices[iIdx++] = botB;
          indices[iIdx++] = botA;
        }
      }
    };

    // North edge (iz = 0)
    addSkirtEdge(0, 1, vertsPerRow, false);
    // South edge (iz = segments)
    addSkirtEdge(segments * vertsPerRow, 1, vertsPerRow, true);
    // West edge (ix = 0)
    addSkirtEdge(0, vertsPerRow, vertsPerRow, true);
    // East edge (ix = segments)
    addSkirtEdge(segments, vertsPerRow, vertsPerRow, false);

    return {
      positions,
      normals,
      uvs,
      indices,
      vertCount: totalVerts,
      indexCount: iIdx
    };
  }
}

export default TerrainMeshGenerator;
