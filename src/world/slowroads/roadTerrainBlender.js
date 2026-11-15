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
      // Natural heavily-traveled multi-vehicle off-road profile:
      // Broad, deeply scooped wheel lanes (~4.6m separation across 8m roadbed),
      // wide undulating center crown, and thick rounded earthen shoulder berms.
      // Uses smooth C1 cosine bells and macro longitudinal wavelengths (>=35m) to eliminate all polygon choppiness.
      const isBridge = !!(nodeA.bridge || nodeB.bridge);
      let profileDelta = 0;

      if (!isBridge) {
        const sLong = ((nodeA.i || 0) + t) * 10.0;

        // Non-linear probability distribution for rut depth:
        // In the most probable/predominant scenario (~75-80% of the trail), deformation is mild (~0.35x - 0.50x or -0.10m to -0.14m).
        // Only in occasional stretches (~20% of the trail: dips, wet basins, steep turns) does it surge up to full depth (1.0x or -0.28m).
        const rawWander = 0.50 + 0.30 * Math.sin(sLong * 0.012) + 0.20 * Math.cos(sLong * 0.0051 + 0.8);
        const normWander = Math.max(0, Math.min(1, rawWander));
        const depthMod = 0.35 + 0.65 * Math.pow(normWander, 2.4);
        const sideAsym = Math.sin(sLong * 0.009 + 0.9) * 0.35;
        const sideFactor = 1.0 + side * sideAsym;

        // Long-wave natural trail washboard / whoop undulations along vehicle paths
        const trailWhoop = (Math.sin(sLong * 0.032) * 0.10 + Math.sin(sLong * 0.071 + 1.2) * 0.06) * depthMod;

        // 1. Wide, heavily-traveled multi-vehicle wheel ruts:
        // Positioned wider at ~2.3m lateral offset (4.6m total track separation across 8m roadbed)
        const rutCenter = 2.30 + 0.30 * Math.sin(sLong * 0.018 + side * 0.7);
        const rutHalfWidth = 1.65; // Wide 3.3m diameter scooped wheel lane

        let rutOffset = 0;
        const rutDist = Math.abs(dist - rutCenter);
        if (rutDist < rutHalfWidth) {
          // Smooth, rounded cosine cradle with zero derivative at bottom and edges (no kinks)
          const rutNorm = rutDist / rutHalfWidth;
          const rutShape = 0.5 + 0.5 * Math.cos(Math.PI * rutNorm);
          rutOffset = -0.28 * depthMod * rutShape;
        }

        // 2. Broad, weathered center crown / hump between left and right ruts
        let crownOffset = 0;
        if (dist < rutCenter) {
          const crownNorm = dist / rutCenter;
          const crownShape = 0.5 + 0.5 * Math.cos(Math.PI * crownNorm);
          crownOffset = 0.09 * depthMod * crownShape;
        }

        // 3. Thick, rounded outer dirt berm (shoulder banks pushed outward by traffic)
        let bermOffset = 0;
        const bermPeak = 4.10 + 0.35 * Math.sin(sLong * 0.013);
        const bermHalfWidth = 1.70; // 3.4m wide rounded earthen mound
        const bermDist = Math.abs(dist - bermPeak);
        if (bermDist < bermHalfWidth) {
          const bermNorm = bermDist / bermHalfWidth;
          const bermShape = 0.5 + 0.5 * Math.cos(Math.PI * bermNorm);
          bermOffset = 0.24 * depthMod * sideFactor * bermShape;
        }

        // 4. Bench-Cut Hillside Cut-and-Fill Asymmetry:
        // Evaluates whether this side of the road cuts into the uphill mountain face (cut bank)
        // or overlooks the downhill valley (fill slope).
        const hillsideDelta = terrainHeight - roadY;
        const cutFillBias = Math.max(-1, Math.min(1, hillsideDelta / 3.5));

        if (cutFillBias > 0.05) {
          // Uphill Cut Flank: Dirt was excavated into the mountain.
          // Forms an uphill drainage ditch/swale along the inner shoulder (dist ~3.2m - 4.2m)
          const swaleDist = Math.abs(dist - 3.6);
          if (swaleDist < 1.1) {
            const swaleShape = 0.5 + 0.5 * Math.cos(Math.PI * (swaleDist / 1.1));
            bermOffset -= 0.16 * cutFillBias * depthMod * swaleShape;
          }
        } else if (cutFillBias < -0.05) {
          // Downhill Fill Flank: Excavated earth was pushed over the cliff edge.
          // Builds up a taller, protective earthen fill-berm on the precipice side
          const fillFactor = -cutFillBias;
          const fillShape = bermDist < bermHalfWidth ? 0.5 + 0.5 * Math.cos(Math.PI * (bermDist / bermHalfWidth)) : 0;
          bermOffset += 0.18 * fillFactor * depthMod * fillShape;
        }

        // Combine into continuous macro off-road profile:
        // Whoops naturally concentrate in the wheel ruts where vehicle torque carves depressions
        const whoopFactor = Math.max(0, 1 - Math.abs(dist - rutCenter) / 2.0);
        profileDelta = rutOffset + crownOffset + bermOffset + trailWhoop * whoopFactor;
      }

      const roadSurfaceY = roadY + profileDelta;

      if (dist < this.halfWidth) {
        return roadSurfaceY;
      }

      const tNorm = Math.max(0, Math.min(1, (dist - this.halfWidth) / roadMargin));
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

      return modifiedTerrain * lerpFactor + roadSurfaceY * (1 - lerpFactor);
    }

    return modifiedTerrain;
  }
}

export default RoadTerrainBlender;
