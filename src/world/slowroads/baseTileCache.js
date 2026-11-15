// Base tile caching class for procedural terrain generation in Slow Roads
// Provides 2D tile hashing, LRU cache eviction, and layer rotation for infinite generation

const DEFAULT_CONFIG = {
  maxCached: 32,
  spiralise: true
};

const COORD_OFFSET = 100;

export class BaseTileCache {
  constructor(config = {}) {
    this.cache = {};
    this.cacheAccess = {};
    this.cacheLayer = {};
    this.cacheCount = 0;
    this.tileSize = 3000;
    this.curLayer = [0, 0];
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  destroy() {
    delete this.cache;
    delete this.cacheAccess;
    delete this.cacheLayer;
  }

  getXZ(x, z) {
    return 0;
  }

  getXZLayer(x, z, layer) {
    return 0;
  }

  getCurvature(x, z) {
    let hAvg = 0;
    hAvg += this.getXZ(x + 5, z, 1);
    hAvg += this.getXZ(x - 5, z, 1);
    hAvg += this.getXZ(x, z + 5, 1);
    hAvg += this.getXZ(x, z - 5, 1);
    hAvg = hAvg / 4 - this.getXZ(x, z);
    return hAvg * 0.005;
  }

  generateTile(tileX, tileZ) {
    return [];
  }

  getTile(tileX, tileZ) {
    const bx = tileX + COORD_OFFSET;
    const bz = tileZ + COORD_OFFSET;
    if (this.cache[bx] && this.cache[bx][bz]) {
      this.cacheAccess[bx][bz] = 2;
    } else {
      this.cacheTile(tileX, tileZ);
    }
    return this.cache[bx][bz];
  }

  cacheTile(tileX, tileZ) {
    this.cacheCount++;
    this.pruneCache();
    const tileData = this.generateTile(tileX, tileZ);
    const bx = tileX + COORD_OFFSET;
    const bz = tileZ + COORD_OFFSET;
    if (!(bx in this.cache)) {
      this.cache[bx] = {};
      this.cacheLayer[bx] = {};
      this.cacheAccess[bx] = {};
    }
    this.cache[bx][bz] = tileData;
    this.cacheLayer[bx][bz] = this.curLayer[tileX < 0 ? 0 : 1];
    this.cacheAccess[bx][bz] = 2;
  }

  customPruneTile(tileX, tileZ) {}

  pruneCache(forceAll = false) {
    if (!forceAll && this.cacheCount <= this.config.maxCached) return;

    for (const ox in this.cache) {
      for (const oz in this.cache[ox]) {
        if (
          this.cacheAccess[ox][oz] < 0 ||
          this.cacheLayer[ox][oz] !== this.curLayer[ox < COORD_OFFSET ? 0 : 1]
        ) {
          delete this.cache[ox][oz];
          delete this.cacheAccess[ox][oz];
          delete this.cacheLayer[ox][oz];
          this.customPruneTile(ox, oz);
          this.cacheCount--;
          if (!forceAll && this.cacheCount <= this.config.maxCached) break;
        } else {
          this.cacheAccess[ox][oz] -= 1;
        }
      }
      if (Object.keys(this.cache[ox]).length === 0) {
        delete this.cache[ox];
        delete this.cacheAccess[ox];
        delete this.cacheLayer[ox];
      }
      if (!forceAll && this.cacheCount <= this.config.maxCached) break;
    }
  }

  incrementLayer(side, force = false) {
    if (!this.config.spiralise && !force) return;
    this.curLayer[side]++;
    this.setLayers(this.curLayer, force);
  }

  setLayers(layers, force = false) {
    if (!this.config.spiralise && !force) return;
    this.curLayer[0] = layers[0];
    this.curLayer[1] = layers[1];
    this.pruneCache(true);
  }

  cosLerp(t) {
    return (Math.cos(t * Math.PI) + 1) / 2;
  }

  sharpLerp(t) {
    return 1 - t;
  }

  smoothLerp(t) {
    return -1 * (3 - t * 2) * t * t + 1;
  }

  smootherLerp(t) {
    return -1 * ((t * (t * 6 - 15) + 10) * t * t * t) + 1;
  }

  sharpLerpAB(a, b, t) {
    return (b - a) * t + a;
  }

  smootherLerpAB(a, b, t) {
    return (b - a) * ((t * (t * 6 - 15) + 10) * t * t * t) + a;
  }
}

export default BaseTileCache;
