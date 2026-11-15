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

      let effectiveHalfWidth = this.halfWidth;

      if (!isBridge) {
        const sLong = ((nodeA.i || 0) + t) * 10.0;

        // Dynamic Road Width Breathing:
        // Smoothly modulates road width between ~5.8m (technical bottleneck) and ~10.4m (passing turnout/apron)
        const widthWander = Math.sin(sLong * 0.0062) * 0.65 + Math.cos(sLong * 0.0028 + 1.2) * 0.45;
        effectiveHalfWidth = this.halfWidth * (1.0 + widthWander * 0.28);

        // Non-linear probability distribution for rut depth:
        // By default (>85% of the trail), ruts are very subtle and shallow (~-0.04m to -0.06m).
        // Only in rare, occasional spots (mud hollows, tight bends) does it reach mild peak depth (~-0.14m).
        const rawWander = 0.50 + 0.30 * Math.sin(sLong * 0.012) + 0.20 * Math.cos(sLong * 0.0051 + 0.8);
        const normWander = Math.max(0, Math.min(1, rawWander));
        const depthMod = 0.25 + 0.75 * Math.pow(normWander, 3.2);
        const sideAsym = Math.sin(sLong * 0.009 + 0.9) * 0.25;
        const sideFactor = 1.0 + side * sideAsym;

        // Increased Micro-Sinuosity Centerline Wander:
        // Real vehicle tracks snake and weave naturally within the cleared corridor (+/-0.65m)
        // following continuous smooth wavelengths without any sign-flip steps.
        const centerMeander = Math.sin(sLong * 0.012) * 0.42 + Math.cos(sLong * 0.0055 + 1.2) * 0.26;
        const trackSignedDist = (side * dist) - centerMeander;
        const trackDist = Math.abs(trackSignedDist);

        // Long-wave subtle trail undulations along vehicle paths (smooth, no sharp ripples)
        const trailWhoop = (Math.sin(sLong * 0.025) * 0.05 + Math.sin(sLong * 0.055 + 1.2) * 0.03) * depthMod;

        // 1. Soft, gentle wheel ruts:
        // Wide, shallow scoops positioned proportionally to current road width (C1 smooth everywhere)
        const rutCenter = effectiveHalfWidth * 0.58 + 0.12 * Math.sin(sLong * 0.016);
        const rutHalfWidth = effectiveHalfWidth * 0.48; // Wide, soft cradle

        let rutOffset = 0;
        const rutDist = Math.abs(trackDist - rutCenter);
        if (rutDist < rutHalfWidth) {
          const rutNorm = rutDist / rutHalfWidth;
          const rutShape = 0.5 + 0.5 * Math.cos(Math.PI * rutNorm);
          rutOffset = -0.14 * depthMod * rutShape;
        }

        // 2. Subtle, low center crown between left and right ruts
        let crownOffset = 0;
        if (trackDist < rutCenter) {
          const crownNorm = trackDist / rutCenter;
          const crownShape = 0.5 + 0.5 * Math.cos(Math.PI * crownNorm);
          crownOffset = 0.045 * depthMod * crownShape;
        }

        // 3. Gentle, soft earthen shoulder berms
        let bermOffset = 0;
        const bermPeak = effectiveHalfWidth * 1.02 + 0.15 * Math.sin(sLong * 0.013);
        const bermHalfWidth = effectiveHalfWidth * 0.45;
        const bermDist = Math.abs(dist - bermPeak);
        if (bermDist < bermHalfWidth) {
          const bermNorm = bermDist / bermHalfWidth;
          const bermShape = 0.5 + 0.5 * Math.cos(Math.PI * bermNorm);
          bermOffset = 0.12 * depthMod * sideFactor * bermShape;
        }

        // 4. Continuous Bench-Cut Hillside Cut-and-Fill:
        // Evaluates whether this side of the road cuts into the uphill mountain face (cut bank)
        // or overlooks the downhill valley (fill slope) using continuous polynomial weights.
        const hillsideDelta = terrainHeight - roadY;
        const cutFillBias = Math.max(-1, Math.min(1, hillsideDelta / 4.0));
        const uphillWeight = Math.max(0, cutFillBias);
        const downhillWeight = Math.max(0, -cutFillBias);

        // Uphill Cut Flank: Gentle drainage swale along the inner shoulder
        const swaleCenter = effectiveHalfWidth * 0.90;
        const swaleWidth = effectiveHalfWidth * 0.32;
        const swaleDist = Math.abs(dist - swaleCenter);
        if (swaleDist < swaleWidth) {
          const swaleShape = 0.5 + 0.5 * Math.cos(Math.PI * (swaleDist / swaleWidth));
          bermOffset -= 0.08 * uphillWeight * depthMod * swaleShape;
        }

        // Downhill Fill Flank: Gentle protective fill-bank
        if (bermDist < bermHalfWidth) {
          const fillShape = 0.5 + 0.5 * Math.cos(Math.PI * (bermDist / bermHalfWidth));
          bermOffset += 0.09 * downhillWeight * depthMod * fillShape;
        }

        // 5. Dynamic Superelevation (Banked Curves & Apex Camber):
        // Automatically banks the roadbed into corners based on curve rate (node.da):
        // Outside of the curve is elevated (+0.18m) and inside apex is scooped,
        // providing realistic suspension load-transfer through switchbacks and hairpins.
        const turnCurvature = (nodeA.da || 0) * (1 - t) + (nodeB.da || 0) * t;
        const bankIntensity = Math.max(-0.20, Math.min(0.20, turnCurvature * 2.8));
        const lateralRatio = Math.min(1.0, dist / effectiveHalfWidth);
        const bankDelta = bankIntensity * side * lateralRatio * depthMod;

        // Combine into continuous macro off-road profile:
        // Whoops naturally concentrate in the wheel ruts where vehicle torque carves depressions
        const whoopFactor = Math.max(0, 1 - Math.abs(trackDist - rutCenter) / (effectiveHalfWidth * 0.5));
        profileDelta = rutOffset + crownOffset + bermOffset + trailWhoop * whoopFactor + bankDelta;
      }

      const roadSurfaceY = roadY + profileDelta;

      if (dist < effectiveHalfWidth) {
        return roadSurfaceY;
      }

      // Smooth embankment blend: on bridges/causeways, use an engineered 8.0m slope margin
      // that smoothly transitions down to the valley/lake floor with C2 continuity (eliminates jagged raster teeth).
      const transitionMargin = isBridge ? 8.0 : roadMargin;
      const tNorm = Math.max(0, Math.min(1, (dist - effectiveHalfWidth) / transitionMargin));
      const lerpFactor = quinticSmooth(tNorm);

      return modifiedTerrain * lerpFactor + roadSurfaceY * (1 - lerpFactor);
    }

    return modifiedTerrain;
  }
}

export default RoadTerrainBlender;
