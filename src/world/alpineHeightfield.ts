import * as THREE from 'three';
import { createSeededNoise2D } from './math/prng';

export type SurfaceType = 'PISTE' | 'POWDER' | 'ROCK' | 'ICE';

export interface TerrainSample {
  height: number;
  surfaceType: SurfaceType;
  pisteDist: number;
  normal: THREE.Vector3;
  slopeDeg: number;
}

export interface SplinePiste {
  name: string;
  isHalfpipe?: boolean;
  width: number;
  depth?: number;
  points: THREE.Vector3[];
}

/**
 * Creates flat-ish rideable benches separated by steep rock cliff bands
 */
export function smoothTerrace(h: number, stepHeight: number, sharpness: number): number {
  if (h <= 0) return h;
  const scaled = h / stepHeight;
  const floor = Math.floor(scaled);
  const frac = Math.max(0, Math.min(1, scaled - floor));
  const p1 = Math.pow(frac, sharpness);
  const p2 = Math.pow(1.0 - frac, sharpness);
  const sum = p1 + p2;
  const s = sum > 1e-6 ? p1 / sum : frac;
  return (floor + s) * stepHeight;
}

export class AlpineHeightfield {
  private noise2D = createSeededNoise2D('ALVDALEN_TERRAIN_V1');
  private warpNoise2D = createSeededNoise2D('ALVDALEN_WARP_V1');
  private islandNoise2D = createSeededNoise2D('ALVDALEN_ISLANDS_V1');

  public pistes: SplinePiste[] = [];
  public pads: { x: number; z: number; radius: number; targetHeight: number }[] = [];

  constructor() {}

  /**
   * Fast 5-layer height evaluation for the Alvdalen inclined massif
   */
  public sampleHeightQuick(x: number, z: number): number {
    // Layer 1: The Tilted Wedge (Macro Slope)
    // 2.4 km x 2.4 km: z from -1200 (summit backwall) to +1200 (river valley)
    const t = Math.max(0.0, Math.min(1.0, (850.0 - z) / 2050.0));
    const hWedge = 520.0 * Math.pow(t, 1.45);

    // River bed drop and islands for z > 850
    let riverBed = 0.0;
    if (z > 850.0) {
      const riverT = Math.min(1.0, (z - 850.0) / 90.0);
      let bed = -8.0 * riverT;
      const islandVal = this.islandNoise2D(x * 0.005, z * 0.005);
      if (islandVal > 0.15) {
        bed += (islandVal - 0.15) * 16.0; // Forested island crests rising above 0m
      }
      riverBed = bed;
    }

    // Layer 2: Central Dividing Gorge
    // Centerline: x = sin(z * 0.0025) * 90
    // Width: ~180m at top, flaring to ~280m near the river
    const gorgeCenterX = Math.sin(z * 0.0025) * 90.0;
    const tGorge = Math.max(0.0, Math.min(1.0, (z + 1200.0) / 2050.0));
    const gorgeWidth = 180.0 + tGorge * 100.0;
    const distGorge = Math.abs(x - gorgeCenterX);
    const sigma = gorgeWidth * 0.42;
    const gaussianTrench = Math.exp(-0.5 * (distGorge * distGorge) / (sigma * sigma));
    const gorgeCarve = 0.45 * hWedge * gaussianTrench;

    let h = hWedge - gorgeCarve;

    // Layer 3: Natural Alpine Relief & Skiable Bowls (Continuous downhill grade)
    const mountainMask = Math.max(0.0, Math.min(1.0, (870.0 - z) / 220.0));
    // Macro alpine bowls & spur ridges (scale ~ 400m - 600m, amplitude ~ 85m)
    const nBowl1 = this.noise2D(x * 0.002, z * 0.0016);
    const nBowl2 = this.noise2D(x * 0.0042 + 7.4, z * 0.0035 + 2.1) * 0.35;
    const macroRelief = (nBowl1 + nBowl2) * 75.0 * mountainMask;
    h += macroRelief;

    // Layer 4: Smooth Ski Bowls, Rolling Snow Hummocks & Wind Lips
    // Smooth harmonic chutes (C1/C2 continuous, zero-crease, no sawtooth artifacts)
    const warpX = x + 30.0 * this.warpNoise2D(x * 0.002, z * 0.001);
    const warpZ = z + 30.0 * this.warpNoise2D(x * 0.002 + 4.5, z * 0.001 + 8.2);
    const smoothChute = this.noise2D(warpX * 0.003, warpZ * 0.0018) * 16.0 * mountainMask;
    h += smoothChute;

    // Organic snow rollers and wind lips (gentle 2m - 4m undulating surface relief)
    const snowRollers = (
      this.noise2D(x * 0.012 + 1.2, z * 0.012 + 3.4) * 3.2 +
      Math.sin(x * 0.02 + z * 0.015) * 1.2
    ) * mountainMask;
    h += snowRollers;

    // Settle into river basin for z > 850
    if (z > 850.0) {
      const basinBlend = Math.min(1.0, (z - 850.0) / 90.0);
      h = THREE.MathUtils.lerp(h, riverBed, basinBlend);
    }

    // Outer boundary containment
    if (z < -1050.0) {
      const backwallFactor = Math.min(1.0, (-1050.0 - z) / 150.0);
      h += backwallFactor * backwallFactor * 120.0;
    }
    const absX = Math.abs(x);
    if (absX > 1020.0) {
      const sideFactor = Math.min(1.0, (absX - 1020.0) / 180.0);
      h += sideFactor * sideFactor * 130.0;
    }

    return h;
  }

  /**
   * Sample complete terrain state including surface normals, slope and deterministic biome
   */
  public sampleTerrain(x: number, z: number): TerrainSample {
    const height = this.sampleHeightQuick(x, z);

    // Layer 5: Surface & Biome Masking (Readability)
    // Compute normal via central difference
    const eps = 1.2;
    const hL = this.sampleHeightQuick(x - eps, z);
    const hR = this.sampleHeightQuick(x + eps, z);
    const hD = this.sampleHeightQuick(x, z - eps);
    const hU = this.sampleHeightQuick(x, z + eps);

    const normal = new THREE.Vector3(hL - hR, 2.0 * eps, hD - hU).normalize();
    const slopeDeg = Math.acos(Math.min(1.0, Math.max(0.0, normal.y))) * (180.0 / Math.PI);

    // Continuous Alvdalen Piste Networks (GMA groomed runs)
    // 1. Central Groomed Expressway (valley centerline)
    const centralPisteX = Math.sin(z * 0.0025) * 90.0;
    const distCentral = Math.abs(x - centralPisteX);

    // 2. West Flank Scenic Run
    const westPisteX = -340.0 + Math.cos(z * 0.0032) * 80.0;
    const distWest = Math.abs(x - westPisteX);

    // 3. East Bowl Slalom Run
    const eastPisteX = 340.0 + Math.sin(z * 0.0035) * 75.0;
    const distEast = Math.abs(x - eastPisteX);

    const pisteDist = Math.min(distCentral, distWest, distEast);
    const isWithinPisteBoundary = (z >= -1050.0 && z <= 830.0);
    const isPiste = isWithinPisteBoundary && (pisteDist < 26.0);

    let surfaceType: SurfaceType = 'POWDER';
    if (height <= 0.5) {
      surfaceType = 'ICE';
    } else if (slopeDeg > 38.0) {
      surfaceType = 'ROCK';
    } else if (isPiste) {
      surfaceType = 'PISTE';
    } else {
      surfaceType = 'POWDER';
    }

    return {
      height,
      surfaceType,
      pisteDist,
      normal,
      slopeDeg
    };
  }

  public getMacroEnvelope(x: number, z: number): number {
    return this.sampleHeightQuick(x, z);
  }
}
