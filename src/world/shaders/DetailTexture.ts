import * as THREE from 'three';

/**
 * Generates a seamless 1024x1024 procedural snow detail texture as specified in
 * SNOW_SHADING_AND_INTERACTION.md Section 2.1 & 2.2.
 *
 * Implements organic domain-warped Voronoi ice crystal microfacets with 30-degree dome flanks,
 * flake clustering, and crystalline cavity ambient occlusion.
 *
 * Payload:
 * - R: Crystalline microfacet normal X [-1..1] packed as [0..255]
 * - G: Crystalline microfacet normal Y [-1..1] packed as [0..255]
 * - B: Tactile snow grain height & cavity ambient occlusion [0..255]
 * - A: Stochastic sparkle phase seed [0..255]
 */
export function createSnowDetailTexture(): THREE.DataTexture {
  const size = 1024;
  const data = new Uint8Array(size * size * 4);

  // Periodic hash table for seamless 2D wrapping
  const permSize = 256;
  const perm = new Uint16Array(permSize * 2);
  let seed = 987654321;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const p = new Uint16Array(permSize);
  for (let i = 0; i < permSize; i++) p[i] = i;
  for (let i = permSize - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < permSize * 2; i++) {
    perm[i] = p[i & (permSize - 1)];
  }

  const hash2D = (xi: number, yi: number, period: number) => {
    const x = ((xi % period) + period) % period;
    const y = ((yi % period) + period) % period;
    return perm[perm[x & (permSize - 1)] + (y & (permSize - 1))];
  };

  // Smooth periodic value noise
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const pnoise = (u: number, v: number, period: number) => {
    const x = u * period;
    const y = v * period;
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const h00 = hash2D(xi, yi, period) / 65535.0;
    const h10 = hash2D(xi + 1, yi, period) / 65535.0;
    const h01 = hash2D(xi, yi + 1, period) / 65535.0;
    const h11 = hash2D(xi + 1, yi + 1, period) / 65535.0;

    const fx = fade(xf);
    const fy = fade(yf);

    const bot = h00 + fx * (h10 - h00);
    const top = h01 + fx * (h11 - h01);
    return bot + fy * (top - bot);
  };

  // Periodic Voronoi noise with domain warping and 30-degree dome flanks
  const voronoi2D = (u: number, v: number, period: number) => {
    // Subtle periodic domain warp for organic crystalline irregularity
    const wu = u + 0.045 * pnoise(u, v, 2);
    const wv = v + 0.045 * pnoise(u + 0.5, v + 0.5, 2);

    const x = wu * period;
    const y = wv * period;
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    let d1 = 10.0;
    let d2 = 10.0;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = xi + dx;
        const ny = yi + dy;
        const h = hash2D(nx, ny, period);
        const px = dx + ((h & 0xff) / 255.0) * 0.70 + 0.15;
        const py = dy + (((h >> 8) & 0xff) / 255.0) * 0.70 + 0.15;
        const dist = Math.hypot(px - xf, py - yf);
        if (dist < d1) {
          d2 = d1;
          d1 = dist;
        } else if (dist < d2) {
          d2 = dist;
        }
      }
    }
    // 30-degree dome flank profile
    const dome = Math.cos(Math.min(d1 * Math.PI * 0.62, Math.PI * 0.5));
    const edge = Math.min(1.0, (d2 - d1) * 2.2);
    return { dome, edge };
  };

  const heightGrid = new Float32Array(size * size);

  // 1. Synthesize multi-scale snow morphology
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const idx = y * size + x;

      // Primary crystalline grains (period 6)
      const v6 = voronoi2D(u, v, 6);
      // Secondary fine dendritic crystal facets (period 12)
      const v12 = voronoi2D(u + 0.33, v + 0.67, 12);
      // Flake clustering mounds (period 3)
      const mound = pnoise(u, v, 3);

      const crystal = v6.dome * 0.58 + v12.edge * 0.26 + mound * 0.16;
      heightGrid[idx] = Math.max(0.0, Math.min(1.0, crystal));
    }
  }

  // 2. Derive analytical microfacet normal slopes
  const step = 2;
  for (let y = 0; y < size; y++) {
    const yPrev = (y - step + size) % size;
    const yNext = (y + step) % size;
    for (let x = 0; x < size; x++) {
      const xPrev = (x - step + size) % size;
      const xNext = (x + step) % size;
      const idx = y * size + x;

      const hL = heightGrid[y * size + xPrev];
      const hR = heightGrid[y * size + xNext];
      const hD = heightGrid[yPrev * size + x];
      const hU = heightGrid[yNext * size + x];

      // Physical slope scaled for 30-degree dome flanks
      const dx = (hR - hL) * 14.0;
      const dy = (hU - hD) * 14.0;

      const nx = Math.max(0, Math.min(255, Math.round(128 + Math.max(-1.0, Math.min(1.0, dx)) * 127)));
      const ny = Math.max(0, Math.min(255, Math.round(128 + Math.max(-1.0, Math.min(1.0, dy)) * 127)));

      // Tactile crystal grain height and cavity AO
      const hByte = Math.max(0, Math.min(255, Math.round(heightGrid[idx] * 255)));
      // Sparkle phase seed
      const sparkleSeed = Math.floor(rand() * 256);

      const pIdx = idx * 4;
      data[pIdx + 0] = nx;
      data[pIdx + 1] = ny;
      data[pIdx + 2] = hByte;
      data[pIdx + 3] = sparkleSeed;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return texture;
}
