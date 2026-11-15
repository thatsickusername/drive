// Layered RBF heightmap generator extracted from Slow Roads
// Generates multi-octave rolling hills, mountains, and plains with anchor peak interpolation

import { BaseTileCache } from './baseTileCache.js';
import { Alea } from './alea.js';

export class LayeredHeightmap extends BaseTileCache {
  constructor(config = {}) {
    super(config);
    this.config = {
      seed: 'a',
      scale: 1,
      offset: 0,
      resolution: 5,
      upresFactor: 2,
      depth: 3,
      depthHeightFactor: 1,
      layerResolutions: [3, 6, 9],
      squared: false,
      temper: false,
      temperBelow: 100,
      temperMin: 0.25,
      temperBase: 0,
      spiralise: true,
      maxCached: 32,
      tileScaleRandom: 0,
      repeated: false,
      ...config
    };
    this.protoTile = null;

    if (this.config.layerResolutions && this.config.layerResolutions.length > 0) {
      this.config.depth = this.config.layerResolutions.length;
    } else {
      this.generateLayerResolutions();
    }
  }

  generateLayerResolutions() {
    this.config.layerResolutions = [];
    let currentRes = this.config.resolution;
    for (let i = 0; i < this.config.depth; i++) {
      this.config.layerResolutions.push(currentRes);
      currentRes += this.config.upresFactor * (i + 1);
    }
  }

  generateTile(tileX, tileZ) {
    if (this.config.repeated && this.protoTile) return this.protoTile;

    const layers = [];
    const prng = this.config.repeated
      ? Alea(this.config.seed)
      : Alea(`${this.config.seed}#${this.curLayer[tileX < 0 ? 0 : 1]}#${tileX}#${tileZ}`);

    const scaleRandom = 1 + prng() * this.config.tileScaleRandom - this.config.tileScaleRandom / 2;
    let heightMultiplier = this.config.depthHeightFactor;

    for (let d = 0; d < this.config.depth; d++) {
      const res = this.config.layerResolutions[d];
      const normFactor = (this.config.resolution / res) * heightMultiplier;
      heightMultiplier *= this.config.depthHeightFactor;

      const layerGrid = [];
      const radius = 1 / res;
      const radiusSq = radius * radius;

      for (let i = 0; i < res; i++) {
        const row = [];
        for (let j = 0; j < res; j++) {
          let h = prng() * 2 - 1;
          if (this.config.squared) {
            if (h < 0) {
              h *= -(h * (1 + h)) * 4;
            } else {
              h *= h * (1 - h) * 4;
            }
          }
          h *= normFactor;
          row.push({
            x: (i + 0.5) / res,
            y: h * this.config.scale * scaleRandom,
            z: (j + 0.5) / res,
            r: radius,
            r2: radiusSq
          });
        }
        layerGrid.push(row);
      }
      layers.push(layerGrid);
    }

    if (this.config.repeated) {
      this.protoTile = layers;
    }
    return layers;
  }

  roadLerp(t) {
    if (t > 0.3333) {
      const lerp = 1 - (t - 0.3333) / 0.6667;
      return 1 - lerp * lerp * 0.5;
    }
    return t * 1.5;
  }

  getCurvature(x, z) {
    return 0;
  }

  getMidlineXZ(x, z) {
    return this.getXZ(x, z);
  }

  getXZ(x, z, maxDepth = null, isRoad = false) {
    const wx = x / this.tileSize;
    const wz = z / this.tileSize;
    const ox = Math.floor(wx);
    const oz = Math.floor(wz);
    const px = wx - ox;
    const pz = wz - oz;
    const tile = this.getTile(ox, oz);
    const depthLimit = maxDepth || this.config.depth;

    let totalHeight = 0;

    for (let depth = 0; depth < tile.length; depth++) {
      if (depth === depthLimit) break;

      const sq = this.config.layerResolutions[depth];
      const sqb = sq - 1;
      const layer = tile[depth];

      const ix = Math.floor(px * sq - 0.5);
      const iz = Math.floor(pz * sq - 0.5);
      let layerHeight = 0;

      // Cell (ix, iz)
      if (ix >= 0) {
        if (iz >= 0) {
          layerHeight += this.lerpHeight(px, pz, layer[ix][iz]);
        } else {
          const neighbor = this.getTile(ox, oz - 1)[depth];
          layerHeight += this.lerpHeight(px, pz + 1, neighbor[ix][sqb]);
        }
        if (iz < sqb) {
          layerHeight += this.lerpHeight(px, pz, layer[ix][iz + 1]);
        } else {
          const neighbor = this.getTile(ox, oz + 1)[depth];
          layerHeight += this.lerpHeight(px, pz - 1, neighbor[ix][0]);
        }
      } else {
        if (iz >= 0) {
          const neighbor = this.getTile(ox - 1, oz)[depth];
          layerHeight += this.lerpHeight(px + 1, pz, neighbor[sqb][iz]);
        } else {
          const neighbor = this.getTile(ox - 1, oz - 1)[depth];
          layerHeight += this.lerpHeight(px + 1, pz + 1, neighbor[sqb][sqb]);
        }
        if (iz < sqb) {
          const neighbor = this.getTile(ox - 1, oz)[depth];
          layerHeight += this.lerpHeight(px + 1, pz, neighbor[sqb][iz + 1]);
        } else {
          const neighbor = this.getTile(ox - 1, oz + 1)[depth];
          layerHeight += this.lerpHeight(px + 1, pz - 1, neighbor[sqb][0]);
        }
      }

      // Cell (ix + 1, iz)
      if (ix < sqb) {
        if (iz >= 0) {
          layerHeight += this.lerpHeight(px, pz, layer[ix + 1][iz]);
        } else {
          const neighbor = this.getTile(ox, oz - 1)[depth];
          layerHeight += this.lerpHeight(px, pz + 1, neighbor[ix + 1][sqb]);
        }
        if (iz < sqb) {
          layerHeight += this.lerpHeight(px, pz, layer[ix + 1][iz + 1]);
        } else {
          const neighbor = this.getTile(ox, oz + 1)[depth];
          layerHeight += this.lerpHeight(px, pz - 1, neighbor[ix + 1][0]);
        }
      } else {
        if (iz >= 0) {
          const neighbor = this.getTile(ox + 1, oz)[depth];
          layerHeight += this.lerpHeight(px - 1, pz, neighbor[0][iz]);
        } else {
          const neighbor = this.getTile(ox + 1, oz - 1)[depth];
          layerHeight += this.lerpHeight(px - 1, pz + 1, neighbor[0][sqb]);
        }
        if (iz < sqb) {
          const neighbor = this.getTile(ox + 1, oz)[depth];
          layerHeight += this.lerpHeight(px - 1, pz, neighbor[0][iz + 1]);
        } else {
          const neighbor = this.getTile(ox + 1, oz + 1)[depth];
          layerHeight += this.lerpHeight(px - 1, pz - 1, neighbor[0][0]);
        }
      }

      let temper = 1;
      if (this.config.temper && depth > 0) {
        temper = Math.min(
          Math.max(
            this.config.temperMin,
            (totalHeight + this.config.offset + this.config.temperBase) / this.config.temperBelow
          ),
          1
        );
      }

      totalHeight += layerHeight * temper;
    }

    return totalHeight + this.config.offset;
  }

  getXZLayer(x, z, targetLayer, maxDepth = this.config.depth) {
    const wx = x / this.tileSize;
    const wz = z / this.tileSize;
    const ox = Math.floor(wx);
    const oz = Math.floor(wz);
    const px = wx - ox;
    const pz = wz - oz;
    const tile = this.getTile(ox, oz);
    const depthLimit = maxDepth || this.config.depth;

    let totalHeight = 0;

    for (let depth = 0; depth < tile.length; depth++) {
      if (depth === depthLimit) break;
      if (depth !== targetLayer) continue;

      const sq = this.config.layerResolutions[depth];
      const sqb = sq - 1;
      const layer = tile[depth];

      const ix = Math.floor(px * sq - 0.5);
      const iz = Math.floor(pz * sq - 0.5);
      let layerHeight = 0;

      if (ix >= 0) {
        if (iz >= 0) {
          layerHeight += this.lerpHeight(px, pz, layer[ix][iz]);
        } else {
          const neighbor = this.getTile(ox, oz - 1)[depth];
          layerHeight += this.lerpHeight(px, pz + 1, neighbor[ix][sqb]);
        }
        if (iz < sqb) {
          layerHeight += this.lerpHeight(px, pz, layer[ix][iz + 1]);
        } else {
          const neighbor = this.getTile(ox, oz + 1)[depth];
          layerHeight += this.lerpHeight(px, pz - 1, neighbor[ix][0]);
        }
      } else {
        if (iz >= 0) {
          const neighbor = this.getTile(ox - 1, oz)[depth];
          layerHeight += this.lerpHeight(px + 1, pz, neighbor[sqb][iz]);
        } else {
          const neighbor = this.getTile(ox - 1, oz - 1)[depth];
          layerHeight += this.lerpHeight(px + 1, pz + 1, neighbor[sqb][sqb]);
        }
        if (iz < sqb) {
          const neighbor = this.getTile(ox - 1, oz)[depth];
          layerHeight += this.lerpHeight(px + 1, pz, neighbor[sqb][iz + 1]);
        } else {
          const neighbor = this.getTile(ox - 1, oz + 1)[depth];
          layerHeight += this.lerpHeight(px + 1, pz - 1, neighbor[sqb][0]);
        }
      }

      if (ix < sqb) {
        if (iz >= 0) {
          layerHeight += this.lerpHeight(px, pz, layer[ix + 1][iz]);
        } else {
          const neighbor = this.getTile(ox, oz - 1)[depth];
          layerHeight += this.lerpHeight(px, pz + 1, neighbor[ix + 1][sqb]);
        }
        if (iz < sqb) {
          layerHeight += this.lerpHeight(px, pz, layer[ix + 1][iz + 1]);
        } else {
          const neighbor = this.getTile(ox, oz + 1)[depth];
          layerHeight += this.lerpHeight(px, pz - 1, neighbor[ix + 1][0]);
        }
      } else {
        if (iz >= 0) {
          const neighbor = this.getTile(ox + 1, oz)[depth];
          layerHeight += this.lerpHeight(px - 1, pz, neighbor[0][iz]);
        } else {
          const neighbor = this.getTile(ox + 1, oz - 1)[depth];
          layerHeight += this.lerpHeight(px - 1, pz + 1, neighbor[0][sqb]);
        }
        if (iz < sqb) {
          const neighbor = this.getTile(ox + 1, oz)[depth];
          layerHeight += this.lerpHeight(px - 1, pz, neighbor[0][iz + 1]);
        } else {
          const neighbor = this.getTile(ox + 1, oz + 1)[depth];
          layerHeight += this.lerpHeight(px - 1, pz - 1, neighbor[0][0]);
        }
      }

      totalHeight += layerHeight;
      break;
    }

    return totalHeight + this.config.offset;
  }

  lerpHeight(px, pz, anchor) {
    const dx = anchor.x - px;
    const dz = anchor.z - pz;
    const distSq = dx * dx + dz * dz;
    if (distSq < anchor.r2) {
      return this.smootherLerpKernel(distSq / anchor.r2) * anchor.y;
    }
    return 0;
  }

  smootherLerpKernel(t) {
    return -1 * ((t * (t * 6 - 15) + 10) * t * t * t) + 1;
  }
}

export default LayeredHeightmap;
