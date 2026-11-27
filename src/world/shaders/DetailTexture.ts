import * as THREE from 'three';
import { generateSnowDetailData } from './detailTextureData';

let cachedSnowDetailTexture: THREE.DataTexture | null = null;
let cachedSnowDetailSize: number = 0;

/**
 * Wraps pre-synthesized RGBA detail bytes into a cached seamless THREE.DataTexture.
 */
export function createSnowDetailTextureFromData(
  data: Uint8Array<ArrayBuffer>,
  size: number = 1024,
  anisotropy: number = 4
): THREE.DataTexture {
  if (cachedSnowDetailTexture && cachedSnowDetailSize === size) {
    cachedSnowDetailTexture.anisotropy = Math.max(1, Math.min(4, anisotropy));
    cachedSnowDetailTexture.needsUpdate = true;
    return cachedSnowDetailTexture;
  }

  if (cachedSnowDetailTexture) {
    cachedSnowDetailTexture.dispose();
    cachedSnowDetailTexture = null;
    cachedSnowDetailSize = 0;
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
  texture.anisotropy = Math.max(1, Math.min(4, anisotropy));
  texture.needsUpdate = true;

  cachedSnowDetailTexture = texture;
  cachedSnowDetailSize = size;
  return texture;
}

/**
 * Generates (or returns cached) seamless procedural snow detail texture.
 */
export function createSnowDetailTexture(anisotropy: number = 4, size: number = 1024): THREE.DataTexture {
  if (cachedSnowDetailTexture && cachedSnowDetailSize === size) {
    cachedSnowDetailTexture.anisotropy = Math.max(1, Math.min(4, anisotropy));
    return cachedSnowDetailTexture;
  }
  const data = generateSnowDetailData(size);
  return createSnowDetailTextureFromData(data, size, anisotropy);
}

export function getCachedSnowDetailTexture(): THREE.DataTexture | null {
  return cachedSnowDetailTexture;
}

export function disposeSnowDetailTexture(): void {
  if (cachedSnowDetailTexture) {
    cachedSnowDetailTexture.dispose();
    cachedSnowDetailTexture = null;
    cachedSnowDetailSize = 0;
  }
}
