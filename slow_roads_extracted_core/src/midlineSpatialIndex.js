// Spatial partitioning grid for the midline road nodes
// Extracted from Slow Roads (class r7)
// Enables O(1) query of the nearest road segment and distance for terrain carving and meshing

const TILE_OFFSET = 1000;
const SEGMENT_CHUNK_SIZE = 20;

function closestPointOnSegment(px, pz, ax, az, bx, bz) {
  const abx = bx - ax;
  const abz = bz - az;
  const apx = px - ax;
  const apz = pz - az;

  const abLenSq = abx * abx + abz * abz;
  if (abLenSq === 0) {
    return { t: 0, dSq: apx * apx + apz * apz, x: ax, z: az };
  }

  let t = (apx * abx + apz * abz) / abLenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * abx;
  const projZ = az + t * abz;
  const dx = px - projX;
  const dz = pz - projZ;

  return { t, dSq: dx * dx + dz * dz, x: projX, z: projZ };
}

function distSqToNode(px, pz, node) {
  if (!node || !node.p) return Infinity;
  const dx = px - node.p.x;
  const dz = pz - node.p.z;
  return dx * dx + dz * dz;
}

export class MidlineSpatialIndex {
  constructor(tileSize = 400) {
    this.tileSize = tileSize;
    this.tileIndex = {};
    this.lastSeenIndex = {};
    this.lookaheadNode = null;
    this.margin = 120;
    this.step = this.margin * 2;
    if (this.step > this.tileSize) this.step *= 0.5;
  }

  initialise(headNode, margin = 120) {
    this.tileIndex = {};
    this.lastSeenIndex = {};
    this.lookaheadNode = headNode;
    this.margin = margin;
    this.step = margin * 2;
    if (this.step > this.tileSize) this.step *= 0.5;
  }

  update(horizonNodeIndex = null) {
    if (!this.lookaheadNode) return;

    while (this.lookaheadNode) {
      if (horizonNodeIndex !== null && this.lookaheadNode.i >= horizonNodeIndex) {
        break;
      }

      let ptx = null;
      let ptz = null;

      for (let ox = -this.margin; ox <= this.margin; ox += this.step) {
        for (let oz = -this.margin; oz <= this.margin; oz += this.step) {
          const mx = this.lookaheadNode.p.x + ox;
          const mz = this.lookaheadNode.p.z + oz;
          const tx = Math.floor(mx / this.tileSize) + TILE_OFFSET;
          const tz = Math.floor(mz / this.tileSize) + TILE_OFFSET;

          if (tx === ptx && tz === ptz) continue;
          ptx = tx;
          ptz = tz;

          if (!this.tileIndex[tx]) {
            this.tileIndex[tx] = {};
            this.lastSeenIndex[tx] = {};
          }
          if (!this.tileIndex[tx][tz]) {
            this.tileIndex[tx][tz] = [];
          }
          this.lastSeenIndex[tx][tz] = this.lookaheadNode.i;

          const segments = this.tileIndex[tx][tz];
          const curSeg = segments[0];

          if (
            !curSeg ||
            curSeg.tail.i < this.lookaheadNode.i - 2 ||
            curSeg.tail.i - curSeg.head.i >= SEGMENT_CHUNK_SIZE
          ) {
            if (curSeg && curSeg.tail.i - curSeg.head.i > 15) {
              curSeg.mid = curSeg.head;
              const half = (curSeg.tail.i + curSeg.head.i) / 2;
              while (curSeg.mid.i < half && curSeg.mid.next) {
                curSeg.mid = curSeg.mid.next;
              }
            }
            segments.unshift({
              head: this.lookaheadNode,
              tail: this.lookaheadNode,
              bounds: {
                minX: this.lookaheadNode.p.x,
                maxX: this.lookaheadNode.p.x,
                minZ: this.lookaheadNode.p.z,
                maxZ: this.lookaheadNode.p.z
              }
            });
            continue;
          }

          if (curSeg.tail.i !== this.lookaheadNode.i) {
            curSeg.tail = this.lookaheadNode;
            curSeg.bounds.minX = Math.min(this.lookaheadNode.p.x, curSeg.bounds.minX);
            curSeg.bounds.maxX = Math.max(this.lookaheadNode.p.x, curSeg.bounds.maxX);
            curSeg.bounds.minZ = Math.min(this.lookaheadNode.p.z, curSeg.bounds.minZ);
            curSeg.bounds.maxZ = Math.max(this.lookaheadNode.p.z, curSeg.bounds.maxZ);
          }
        }
      }

      if (!this.lookaheadNode.next) break;
      this.lookaheadNode = this.lookaheadNode.next;
    }
  }

  retireTile(tileX, tileZ) {
    const tx = tileX + TILE_OFFSET;
    const tz = tileZ + TILE_OFFSET;
    if (this.tileIndex[tx] && this.tileIndex[tx][tz]) {
      delete this.tileIndex[tx][tz];
      delete this.lastSeenIndex[tx][tz];
      if (Object.keys(this.tileIndex[tx]).length === 0) {
        delete this.tileIndex[tx];
        delete this.lastSeenIndex[tx];
      }
    }
  }

  isCloseToRoad(worldX, worldZ, maxDist = 50) {
    const tileX = Math.floor(worldX / this.tileSize) + TILE_OFFSET;
    const tileZ = Math.floor(worldZ / this.tileSize) + TILE_OFFSET;
    const tile = this.tileIndex[tileX]?.[tileZ];
    if (!tile) return false;

    const maxDistSq = maxDist * maxDist;

    for (const seg of tile) {
      if (
        worldX < seg.bounds.minX - maxDist ||
        worldX > seg.bounds.maxX + maxDist ||
        worldZ < seg.bounds.minZ - maxDist ||
        worldZ > seg.bounds.maxZ + maxDist
      ) {
        continue;
      }

      let closest = closestPointOnSegment(
        worldX,
        worldZ,
        seg.head.p.x,
        seg.head.p.z,
        seg.tail.p.x,
        seg.tail.p.z
      );

      if (seg.mid && closest.dSq < maxDistSq * 1.5) {
        const cpA = closestPointOnSegment(
          worldX,
          worldZ,
          seg.head.p.x,
          seg.head.p.z,
          seg.mid.p.x,
          seg.mid.p.z
        );
        const cpB = closestPointOnSegment(
          worldX,
          worldZ,
          seg.mid.p.x,
          seg.mid.p.z,
          seg.tail.p.x,
          seg.tail.p.z
        );
        closest = cpA.dSq < cpB.dSq ? (cpA.dSq < closest.dSq ? cpA : closest) : (cpB.dSq < closest.dSq ? cpB : closest);
      }

      if (closest.dSq < maxDistSq) return true;
    }

    return false;
  }

  getClosestNode(worldX, worldZ, maxDist = 50) {
    const tileX = Math.floor(worldX / this.tileSize) + TILE_OFFSET;
    const tileZ = Math.floor(worldZ / this.tileSize) + TILE_OFFSET;
    const tile = this.tileIndex[tileX]?.[tileZ];
    if (!tile) return null;

    let closestDistSq = maxDist * maxDist;
    let closestNode = null;

    for (const seg of tile) {
      if (
        worldX < seg.bounds.minX - maxDist ||
        worldX > seg.bounds.maxX + maxDist ||
        worldZ < seg.bounds.minZ - maxDist ||
        worldZ > seg.bounds.maxZ + maxDist
      ) {
        continue;
      }

      let closest = closestPointOnSegment(
        worldX,
        worldZ,
        seg.head.p.x,
        seg.head.p.z,
        seg.tail.p.x,
        seg.tail.p.z
      );
      let useMidA = false;
      let useMidB = false;

      if (seg.mid && closest.dSq < closestDistSq * 2) {
        const cpA = closestPointOnSegment(
          worldX,
          worldZ,
          seg.head.p.x,
          seg.head.p.z,
          seg.mid.p.x,
          seg.mid.p.z
        );
        const cpB = closestPointOnSegment(
          worldX,
          worldZ,
          seg.mid.p.x,
          seg.mid.p.z,
          seg.tail.p.x,
          seg.tail.p.z
        );
        if (cpA.dSq < cpB.dSq) {
          if (cpA.dSq < closest.dSq) {
            closest = cpA;
            useMidA = true;
          }
        } else {
          if (cpB.dSq < closest.dSq) {
            closest = cpB;
            useMidB = true;
          }
        }
      }

      if (closest.dSq < closestDistSq * 1.25) {
        closestDistSq = closest.dSq;
        if (closest.t < 0.5) {
          closestNode = useMidB ? seg.mid : seg.head;
        } else {
          closestNode = useMidA ? seg.mid : seg.tail;
        }
      }
    }

    if (!closestNode) return null;

    // Local gradient search along linked list neighbors for exact minimum
    let cur = closestNode;
    let d = distSqToNode(worldX, worldZ, cur);
    let dn = distSqToNode(worldX, worldZ, cur.next);
    while (dn < d && cur.next) {
      cur = cur.next;
      d = dn;
      dn = distSqToNode(worldX, worldZ, cur.next);
    }

    if (cur.i === closestNode.i && cur.prev) {
      let dp = distSqToNode(worldX, worldZ, cur.prev);
      while (dp < d && cur.prev && cur.prev.prev) {
        cur = cur.prev;
        d = dp;
        dp = distSqToNode(worldX, worldZ, cur.prev);
      }
    }

    if (d > maxDist * maxDist) return null;

    // Test both adjacent segments: [cur.prev, cur] and [cur, cur.next] to avoid
    // half-segment t=0 clamping which creates 5-meter staircase steps on slopes
    let bestSeg = null;
    let nodeA = cur;
    let nodeB = cur.next || cur;

    if (cur.next) {
      const segNext = closestPointOnSegment(
        worldX,
        worldZ,
        cur.p.x,
        cur.p.z,
        cur.next.p.x,
        cur.next.p.z
      );
      bestSeg = segNext;
      nodeA = cur;
      nodeB = cur.next;
    }

    if (cur.prev) {
      const segPrev = closestPointOnSegment(
        worldX,
        worldZ,
        cur.prev.p.x,
        cur.prev.p.z,
        cur.p.x,
        cur.p.z
      );
      if (!bestSeg || segPrev.dSq < bestSeg.dSq) {
        bestSeg = segPrev;
        nodeA = cur.prev;
        nodeB = cur;
      }
    }

    if (!bestSeg) return null;
    if (bestSeg.dSq > maxDist * maxDist) return null;

    // Lateral side: 2D cross product of segment vector (AB) with vector from A to query point
    const abx = nodeB.p.x - nodeA.p.x;
    const abz = nodeB.p.z - nodeA.p.z;
    const apx = worldX - nodeA.p.x;
    const apz = worldZ - nodeA.p.z;
    const cross = apx * abz - apz * abx;
    const side = cross >= 0 ? 1 : -1;

    return {
      n: nodeA,
      d: Math.sqrt(bestSeg.dSq),
      dSq: bestSeg.dSq,
      t: bestSeg.t,
      s: side,
      projX: bestSeg.x,
      projZ: bestSeg.z
    };
  }
}

export default MidlineSpatialIndex;
