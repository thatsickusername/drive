// Road terrain carving and blending logic extracted from Slow Roads ($s)
// Seamlessly carves roadbed, curbs, embankment shoulders, and ditches into the heightmap

import { PerlinNoise } from './perlin.js';

// Quintic smoother function (Gt)
export function quinticSmooth(t) {
  return (t * (t * 6 - 15) + 10) * t * t * t;
}

// Road transition curve (oa)
export function roadTransitionCurve(t) {
  if (t > 0.3333) {
    const lerp = 1 - (t - 0.3333) / 0.6667;
    return 1 - lerp * lerp * 0.5;
  }
  return t * 1.5;
}

export class RoadTerrainBlender {
  constructor(config = {}) {
    this.roadWidth = config.roadWidth || 8;
    this.halfWidth = this.roadWidth / 2;
    this.curbWidth = config.curbWidth || 0.4;
    this.margin = config.margin || 16;
    this.isGreenlane = config.isGreenlane || false;
    this.isOffroad = config.isOffroad || false;

    // 4 Procedural micro-noise generators used in Slow Roads for organic blending
    this.noiseQs = new PerlinNoise({
      scale: 0.03,
      offset: 0,
      resolution: 7,
      depth: 2,
      upscale: 3,
      tileSize: 40,
      spiralise: false,
      repeated: true
    });

    this.noiseKt = new PerlinNoise({
      scale: 0.5,
      offset: 0,
      resolution: 5,
      depth: 3,
      upscale: 3,
      tileSize: 25,
      spiralise: false,
      repeated: true
    });

    this.noiseKs = new PerlinNoise({
      scale: 5,
      offset: 0,
      resolution: 5,
      depth: 2,
      upscale: 2,
      tileSize: 200,
      spiralise: false,
      repeated: true
    });

    this.noiseJs = new PerlinNoise({
      scale: 8,
      offset: 1,
      resolution: 7,
      depth: 2,
      upscale: 3,
      tileSize: 100,
      spiralise: false,
      repeated: true
    });
  }

  setRoadWidth(w) {
    this.roadWidth = w;
    this.halfWidth = w / 2;
  }

  /**
   * Blends the natural terrain height with the road surface and embankment
   * @param {number} terrainHeight - natural heightmap elevation at (worldX, worldZ)
   * @param {object} hit - nearest road node data {n: node, t: 0..1, d: lateralDist}
   * @param {number} worldX - world X coordinate
   * @param {number} worldZ - world Z coordinate
   * @returns {number} final carved terrain height
   */
  getBlendedHeight(terrainHeight, hit, worldX, worldZ) {
    if (!hit || !hit.n || !hit.n.next) return terrainHeight;

    const nodeA = hit.n;
    const nodeB = hit.n.next;
    const t = hit.t || 0;
    let dist = hit.d;

    // Interpolate node properties
    const nodeH = nodeA.h + t * (nodeB.h - nodeA.h);
    const nodeGfa = (nodeA.gfa || 0) + t * ((nodeB.gfa || 0) - (nodeA.gfa || 0));
    const nodeG = (nodeA.g || 0) + t * ((nodeB.g || 0) - (nodeA.g || 0));
    const nodeBlend = (nodeA.blend !== undefined ? nodeA.blend : 1) +
      t * ((nodeB.blend !== undefined ? nodeB.blend : 1) - (nodeA.blend !== undefined ? nodeA.blend : 1));

    // Road surface elevation at projection point
    let roadY = nodeA.p.y + t * (nodeB.p.y - nodeA.p.y);

    let ga = 0;
    const side = hit.s || 1;
    if (side === Math.sign(nodeG)) {
      ga = Math.max(0, Math.abs(nodeG) - 1) / 3;
    }

    let w = this.halfWidth;
    let widthLerp = 1;

    if (this.isOffroad) {
      if (this.isGreenlane) {
        w += this.curbWidth * 2;
      } else {
        w += this.curbWidth + ga;
      }
      if (dist < w) widthLerp = dist / w;
      dist += 0.4;
      if (this.isGreenlane) {
        dist += 0.2 + this.noiseKt.getXZ(worldX, worldZ) * 0.5;
      } else {
        dist += this.noiseKt.getXZ(worldX, worldZ);
      }
    } else {
      w = this.halfWidth + this.curbWidth + 0.25 + ga;
    }

    roadY -= 0.01 + 0.01 * nodeGfa;
    ga = Math.min(1, Math.max(0, ga)) ** 2;

    const roadMargin = this.margin * (0.4 + 0.6 * nodeBlend);

    let normDist = (dist - w) / 16;
    if (normDist < 0) normDist = 0;
    if (normDist > 1) normDist = 1;
    normDist = (1 - normDist) ** 2;

    let modifiedTerrain = terrainHeight;
    if (this.isOffroad && normDist > 0) {
      modifiedTerrain += normDist * this.noiseKs.getXZ(worldX, worldZ) * 0.4;
      if (ga > 0) {
        modifiedTerrain += this.noiseJs.getXZ(worldX, worldZ) * normDist * ga;
      }
    }

    if (dist < w + roadMargin) {
      // Under paved road surface (without bridge), clamp directly to road elevation
      if (!this.isOffroad && dist < this.halfWidth && !nodeA.bridge) {
        return roadY;
      }

      const tNorm = Math.max(0, Math.min(1, (dist - w) / roadMargin));
      let lerpFactor = quinticSmooth(tNorm);

      if (this.isOffroad) {
        const hFactor = 1 - ga;
        if (hFactor > 0) {
          const atVal = 3.0;
          if (hit.d < w) {
            modifiedTerrain += atVal * hFactor;
          } else {
            modifiedTerrain += quinticSmooth(1 - (hit.d - w) / roadMargin) * atVal * hFactor;
          }
        }
        roadY += this.noiseQs.getXZ(worldX, worldZ);

        // Superelevation / road banking adjustment
        const slope = (nodeA.bank || 0) * (1 - t) + (nodeB.bank || 0) * t;
        let bankFactor = (widthLerp * side + 1) / 2;
        bankFactor = bankFactor * bankFactor * 2 - 1;
        roadY += Math.abs(slope) * bankFactor * (this.isGreenlane ? 0.5 : 1);
      }

      // Bridge handling: suppress terrain elevation changes under bridge spans
      if (nodeA.bridge && nodeB.bridge) {
        if (nodeB.next && nodeB.next.bridge) {
          if (nodeA.prev && nodeA.prev.bridge) {
            lerpFactor = 1;
          } else {
            lerpFactor = Math.max(t, lerpFactor);
          }
        } else {
          lerpFactor = Math.max(1 - t, lerpFactor);
        }

        const bridgeMargin = 4;
        if (dist < this.halfWidth + this.curbWidth + bridgeMargin && modifiedTerrain > roadY) {
          let m = 1 - Math.max(0, (this.halfWidth + this.curbWidth + bridgeMargin - dist) / bridgeMargin);
          const sub = lerpFactor * 0.33;
          m = (m - sub) * (1 / (1 - sub));
          lerpFactor = m;
        }
      }

      return modifiedTerrain * lerpFactor + roadY * (1 - lerpFactor);
    }

    return modifiedTerrain;
  }
}

export default RoadTerrainBlender;
