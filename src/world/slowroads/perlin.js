// Perlin noise generators extracted from Slow Roads
// Includes the multi-octave tiled Perlin generator (Xe) and compact 2D gradient noise (tt)

import { BaseTileCache } from './baseTileCache.js';
import { Alea } from './alea.js';

const TWO_PI = Math.PI * 2;

export class PerlinNoise extends BaseTileCache {
  constructor(config = {}) {
    super(config);
    this.config = {
      seed: 'a',
      scale: 1,
      resolution: 5,
      depth: 3,
      upscale: 3,
      offset: 0,
      maxCached: 32,
      tileSize: 3000,
      depthScaleFactor: 1,
      repeated: false,
      ...config
    };
    this.protoTile = null;
    this.tileSize = this.config.tileSize;
  }

  getXZ(x, z, maxDepth = null) {
    const tx = x / this.tileSize;
    const tz = z / this.tileSize;
    const ox = Math.floor(tx);
    const oz = Math.floor(tz);
    const px = tx - ox;
    const pz = tz - oz;
    const tile = this.getTile(ox, oz);
    const depthLimit = maxDepth || this.config.depth;

    let totalHeight = 0;
    let sq = this.config.resolution;
    let depthScaleFactor = 1;

    for (let depth = 0; depth < tile.length; depth++) {
      if (depth === depthLimit) break;
      const layer = tile[depth];
      const sx = px * sq;
      const sz = pz * sq;
      const ix = Math.floor(sx);
      const ix1 = ix + 1;
      const iz = Math.floor(sz);
      const iz1 = iz + 1;
      const qx = sx - ix;
      const qz = sz - iz;

      // Bottom grid edge
      const n0_0 = this.dotGridGradient(layer, ix, iz, sx, sz);
      let n1_0;
      if (ix1 < sq) {
        n1_0 = this.dotGridGradient(layer, ix1, iz, sx, sz);
      } else {
        const nextXTile = this.getTile(ox + 1, oz);
        n1_0 = this.dotGridGradient(nextXTile[depth], 0, iz, sx - sq, sz);
      }
      const int0 = this.smootherLerp(n0_0, n1_0, qx);

      // Top grid edge
      let n0_1, n1_1;
      if (iz1 < sq) {
        n0_1 = this.dotGridGradient(layer, ix, iz1, sx, sz);
        if (ix1 < sq) {
          n1_1 = this.dotGridGradient(layer, ix1, iz1, sx, sz);
        } else {
          const nextXTile = this.getTile(ox + 1, oz);
          n1_1 = this.dotGridGradient(nextXTile[depth], 0, iz1, sx - sq, sz);
        }
      } else {
        const nextZTile = this.getTile(ox, oz + 1);
        n0_1 = this.dotGridGradient(nextZTile[depth], ix, 0, sx, sz - sq);
        if (ix1 < sq) {
          n1_1 = this.dotGridGradient(nextZTile[depth], ix1, 0, sx, sz - sq);
        } else {
          const nextXZTile = this.getTile(ox + 1, oz + 1);
          n1_1 = this.dotGridGradient(nextXZTile[depth], 0, 0, sx - sq, sz - sq);
        }
      }
      const int1 = this.smootherLerp(n0_1, n1_1, qx);

      const heightFactor = this.config.resolution / sq;
      totalHeight += this.smootherLerp(int0, int1, qz) * heightFactor * depthScaleFactor;
      depthScaleFactor *= this.config.depthScaleFactor;
      sq = this.getNextDepthResolution(sq);
    }

    return totalHeight * this.config.scale + this.config.offset;
  }

  smootherLerp(a, b, t) {
    return (b - a) * ((t * (t * 6 - 15) + 10) * t * t * t) + a;
  }

  generateTile(tileX, tileZ) {
    if (this.config.repeated && this.protoTile) return this.protoTile;

    const prng = this.config.repeated
      ? Alea(this.config.seed)
      : Alea(`${this.config.seed}#${this.curLayer[tileX < 0 ? 0 : 1]}#${tileX}#${tileZ}`);

    let currentRes = this.config.resolution;
    const tileOctaves = [];

    for (let d = 0; d < this.config.depth; d++) {
      const octaveGrid = [];
      for (let x = 0; x < currentRes; x++) {
        const col = [];
        for (let z = 0; z < currentRes; z++) {
          const angle = prng() * TWO_PI;
          col.push({ x: Math.cos(angle), y: Math.sin(angle) });
        }
        octaveGrid.push(col);
      }
      tileOctaves.push(octaveGrid);
      currentRes = this.getNextDepthResolution(currentRes);
    }

    if (this.config.repeated) {
      this.protoTile = tileOctaves;
    }
    return tileOctaves;
  }

  getNextDepthResolution(res) {
    return Math.round(res * this.config.upscale);
  }

  dotGridGradient(layer, ix, iz, sx, sz) {
    const grad = layer[ix][iz];
    return (sx - ix) * grad.x + (sz - iz) * grad.y;
  }
}

// Compact 2D perlin noise helper (from Hills generator)
export class PerlinNoise2D {
  constructor(depth = 3, res = 20, seed = 'perlin') {
    this.layers = [];
    this.amplitudeFactor = 1;
    this.depth = depth;
    this.res = res;

    const prng = Alea(seed);
    let currentRes = res;
    for (let d = 0; d < depth; d++) {
      const grid = [];
      for (let x = 0; x < currentRes; x++) {
        const col = [];
        for (let z = 0; z < currentRes; z++) {
          const angle = prng() * TWO_PI;
          col.push({ x: Math.cos(angle), y: Math.sin(angle) });
        }
        col.push({ ...col[0] });
        grid.push(col);
      }
      grid.push([...grid[0]]);
      this.layers.push(grid);
      currentRes *= 2;
    }

    let sum = 0;
    let factor = 1;
    for (let d = 0; d < depth; d++) {
      sum += factor;
      factor /= 2;
    }
    this.amplitudeFactor = 0.5 + (1 / sum) * 0.5;
  }

  get(x, z) {
    const fracX = x - Math.floor(x);
    const fracZ = z - Math.floor(z);
    let res = this.res;
    let val = 0;

    for (const layer of this.layers) {
      const sx = fracX * res;
      const sz = fracZ * res;
      const ix = Math.floor(sx);
      const ix1 = ix + 1;
      const iz = Math.floor(sz);
      const iz1 = iz + 1;
      const qx = sx - ix;
      const qz = sz - iz;

      const n0 = this.dotGridGradient(layer[ix][iz], ix, iz, sx, sz);
      const n1 = this.dotGridGradient(layer[ix1][iz], ix1, iz, sx, sz);
      const int0 = this.smootherLerp(n0, n1, qx);

      const n2 = this.dotGridGradient(layer[ix][iz1], ix, iz1, sx, sz);
      const n3 = this.dotGridGradient(layer[ix1][iz1], ix1, iz1, sx, sz);
      const int1 = this.smootherLerp(n2, n3, qx);

      val += this.smootherLerp(int0, int1, qz);
      res *= 2;
    }

    return val * this.amplitudeFactor;
  }

  smootherLerp(a, b, t) {
    return (b - a) * ((t * (t * 6 - 15) + 10) * t * t * t) + a;
  }

  dotGridGradient(grad, ix, iz, sx, sz) {
    return (sx - ix) * grad.x + (sz - iz) * grad.y;
  }
}

export default PerlinNoise;
