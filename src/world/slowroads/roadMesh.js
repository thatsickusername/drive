// Road ribbon mesh generator extracted from Slow Roads
// Generates continuous road surface geometry, banking, UVs, and vertex attributes for markings and bridges

export class RoadMeshGenerator {
  constructor(options = {}) {
    this.roadWidth = options.roadWidth || 8.0;
    this.curbWidth = options.curbWidth || 0.4;
    this.curbHeight = options.curbHeight || 0.15;
    this.uvStep = options.uvStep || (10 / (this.roadWidth * 2));
  }

  /**
   * Generates a road ribbon mesh from a sequence of fine midline nodes
   * @param {Array<object>} nodes - array of fine nodes [{p: {x,y,z}, n: {x,z}, bank: 0, bridge: false, markings: {...}}]
   * @returns {object} { positions, normals, uvs, bridgeArr, markingsArr, indices }
   */
  generateRoadMesh(nodes) {
    if (!nodes || nodes.length < 2) return null;

    const nodeCount = nodes.length;
    // 4 cross-section vertices per node: Left Curb, Left Edge, Right Edge, Right Curb
    const crossSectionVerts = 4;
    const totalVerts = nodeCount * crossSectionVerts;
    const totalQuads = (nodeCount - 1) * (crossSectionVerts - 1);

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);
    const bridgeArr = new Float32Array(totalVerts);
    const paintSolidArr = new Float32Array(totalVerts);

    const indices = new (totalVerts > 65535 ? Uint32Array : Uint16Array)(totalQuads * 6);

    let vIdx = 0;
    let uvIdx = 0;
    let distAlongRoad = 0;

    const halfWidth = this.roadWidth / 2;
    const totalHalf = halfWidth + this.curbWidth;

    for (let i = 0; i < nodeCount; i++) {
      const cur = nodes[i];
      if (i > 0) {
        const prev = nodes[i - 1];
        const dx = cur.p.x - prev.p.x;
        const dy = cur.p.y - prev.p.y;
        const dz = cur.p.z - prev.p.z;
        distAlongRoad += Math.sqrt(dx * dx + dy * dy + dz * dz);
      }

      // Orthogonal normal vector on XZ plane
      let nx = 0;
      let nz = 0;
      if (cur.n && (cur.n.x !== 0 || cur.n.z !== 0)) {
        nx = cur.n.x;
        nz = cur.n.z;
      } else {
        let dirX = 1;
        let dirZ = 0;
        if (i < nodeCount - 1) {
          dirX = nodes[i + 1].p.x - cur.p.x;
          dirZ = nodes[i + 1].p.z - cur.p.z;
        } else if (i > 0) {
          dirX = cur.p.x - nodes[i - 1].p.x;
          dirZ = cur.p.z - nodes[i - 1].p.z;
        }
        const len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
        nx = -dirZ / len;
        nz = dirX / len;
      }

      const bank = cur.bank || 0;
      const isBridge = cur.bridge ? 1.0 : 0.0;
      const vCoord = distAlongRoad * this.uvStep;

      // 4 points across the road cross section spanning exact road surface
      const offsets = [
        { lat: -halfWidth, elev: 0, u: 0.0 },
        { lat: -halfWidth * 0.333, elev: 0, u: 0.333 },
        { lat: halfWidth * 0.333, elev: 0, u: 0.667 },
        { lat: halfWidth, elev: 0, u: 1.0 }
      ];

      for (let j = 0; j < 4; j++) {
        const off = offsets[j];
        positions[vIdx * 3] = cur.p.x + nx * off.lat;
        positions[vIdx * 3 + 1] = cur.p.y + off.elev;
        positions[vIdx * 3 + 2] = cur.p.z + nz * off.lat;

        // Normal facing straight up flush with carved bed
        normals[vIdx * 3] = 0;
        normals[vIdx * 3 + 1] = 1.0;
        normals[vIdx * 3 + 2] = 0;

        uvs[uvIdx * 2] = off.u;
        uvs[uvIdx * 2 + 1] = vCoord;

        bridgeArr[vIdx] = isBridge;
        paintSolidArr[vIdx] = cur.hasSolidLine ? 1.0 : 0.0;

        vIdx++;
        uvIdx++;
      }
    }

    // Connect quads between adjacent node slices
    let iIdx = 0;
    for (let i = 0; i < nodeCount - 1; i++) {
      const rowA = i * crossSectionVerts;
      const rowB = (i + 1) * crossSectionVerts;

      for (let j = 0; j < crossSectionVerts - 1; j++) {
        const a = rowA + j;
        const b = rowB + j;
        const c = rowB + (j + 1);
        const d = rowA + (j + 1);

        indices[iIdx++] = a;
        indices[iIdx++] = b;
        indices[iIdx++] = d;

        indices[iIdx++] = d;
        indices[iIdx++] = b;
        indices[iIdx++] = c;
      }
    }

    return {
      positions,
      normals,
      uvs,
      bridge: bridgeArr,
      paintSolid: paintSolidArr,
      indices,
      vertCount: totalVerts,
      indexCount: iIdx
    };
  }
}

export default RoadMeshGenerator;
