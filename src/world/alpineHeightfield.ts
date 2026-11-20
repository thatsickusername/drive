import * as THREE from 'three';
import { createSeededNoise2D } from './math/prng';

export type SurfaceType = 'PISTE' | 'POWDER' | 'ROCK';

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

export class AlpineHeightfield {
  private noise2D = createSeededNoise2D('GMA_ALPINE_V2');
  private warpNoise2D = createSeededNoise2D('GMA_WARP_V2');

  public pistes: SplinePiste[] = [];

  // Flattened station pads matching Grand Mountain Adventure tiering
  public pads = [
    { x: 0, z: 920, radius: 90, targetHeight: 20 },     // Base Village Lodge (20m)
    { x: 0, z: 120, radius: 75, targetHeight: 190 },    // Mid-Mountain Hub Plateau (190m)
    { x: -100, z: -900, radius: 55, targetHeight: 538 },// Main Summit Station (540m)
    { x: -680, z: -320, radius: 48, targetHeight: 358 },// West Peak Station (360m)
    { x: 650, z: -260, radius: 48, targetHeight: 308 }, // East Park Station (310m)
  ];

  constructor() {
    this.initPisteSplines();
  }

  private initPisteSplines(): void {
    // 1. Summit Glacier Run to Mid Hub (Winding Alpine Chute & Bowls ~ 1,400m path)
    const summitToMidCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-100, 538, -900),
      new THREE.Vector3(-140, 480, -780),
      new THREE.Vector3(-40, 420, -650),
      new THREE.Vector3(70, 360, -510),
      new THREE.Vector3(-30, 300, -360),
      new THREE.Vector3(50, 245, -180),
      new THREE.Vector3(0, 190, 120)
    ]);

    // 2. Mid-Mountain Hub to Base Village (Wide Forest Groomer ~ 1,100m path)
    const midToBaseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 190, 120),
      new THREE.Vector3(90, 150, 290),
      new THREE.Vector3(-80, 110, 480),
      new THREE.Vector3(70, 65, 680),
      new THREE.Vector3(-30, 35, 820),
      new THREE.Vector3(0, 20, 920)
    ]);

    // 3. West Peak Powder Highway (Wide cruising highway ~ 1,650m path)
    const westHighwayCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-680, 358, -320),
      new THREE.Vector3(-580, 305, -140),
      new THREE.Vector3(-460, 240, 60),
      new THREE.Vector3(-320, 175, 260),
      new THREE.Vector3(-180, 110, 480),
      new THREE.Vector3(-80, 55, 720),
      new THREE.Vector3(0, 20, 920)
    ]);

    // 4. East Freestyle Slopestyle Run (Park lines ~ 1,500m path)
    const eastFreestyleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(650, 308, -260),
      new THREE.Vector3(540, 255, -80),
      new THREE.Vector3(420, 195, 120),
      new THREE.Vector3(290, 140, 340),
      new THREE.Vector3(160, 85, 580),
      new THREE.Vector3(60, 40, 780),
      new THREE.Vector3(0, 20, 920)
    ]);

    // 5. Natural Glacial Halfpipe Gully (Quartic U-shaped trough ~ 450m path)
    const halfpipeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(320, 185, -80),
      new THREE.Vector3(280, 150, 40),
      new THREE.Vector3(260, 120, 170),
      new THREE.Vector3(220, 85, 300)
    ]);

    const curves = [
      { name: 'Summit Glacier Run', curve: summitToMidCurve, width: 34, isHalfpipe: false },
      { name: 'Valley Forest Groomer', curve: midToBaseCurve, width: 36, isHalfpipe: false },
      { name: 'West Powder Highway', curve: westHighwayCurve, width: 38, isHalfpipe: false },
      { name: 'East Freestyle Park', curve: eastFreestyleCurve, width: 34, isHalfpipe: false },
      { name: 'Glacial Halfpipe Gully', curve: halfpipeCurve, width: 26, isHalfpipe: true, depth: 5.5 }
    ];

    for (const c of curves) {
      const pointCount = Math.max(35, Math.round(c.curve.getLength() / 6));
      const points = c.curve.getSpacedPoints(pointCount);
      this.pistes.push({
        name: c.name,
        width: c.width,
        isHalfpipe: c.isHalfpipe,
        depth: c.depth,
        points
      });
    }
  }

  private smax(a: number, b: number, k: number = 38.0): number {
    const h = Math.max(k - Math.abs(a - b), 0.0) / k;
    return Math.max(a, b) + h * h * k * 0.25;
  }

  private smoothstep(min: number, max: number, value: number): number {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
  }

  // Layer 1: Macro Massif Envelope (2.4km footprint, 520m vertical drop)
  public getMacroEnvelope(x: number, z: number): number {
    // 1. Main Summit: (x: -100, z: -900) — Height 540m, Radius 620m
    const dSummit = Math.hypot(x - (-100), z - (-900));
    const hSummit = dSummit < 620 ? 540 * Math.pow(1.0 - (dSummit / 620), 1.95) : 0;

    // 2. West Peak: (x: -680, z: -320) — Height 360m, Radius 480m
    const dWest = Math.hypot(x - (-680), z - (-320));
    const hWest = dWest < 480 ? 360 * Math.pow(1.0 - (dWest / 480), 1.8) : 0;

    // 3. East Park Ridge: (x: 650, z: -260) — Height 310m, Radius 460m
    const dEast = Math.hypot(x - 650, z - (-260));
    const hEast = dEast < 460 ? 310 * Math.pow(1.0 - (dEast / 460), 1.8) : 0;

    // 4. Mid-Mountain Hub: (x: 0, z: 120) — Height 190m, Radius 340m
    const dMid = Math.hypot(x - 0, z - 120);
    const hMid = dMid < 340 ? 190 * Math.pow(1.0 - (dMid / 340), 1.6) : 0;

    // Merge high peaks
    let env = this.smax(hSummit, this.smax(hWest, hEast, 36.0), 45.0);

    // Merge Mid-Mountain Hub terrace
    env = this.smax(env, hMid, 40.0);

    // 5. Separating Ridges (Sightline Blockers between Valleys)
    // Ridge 1 (Between West Bowl and Central Glacier Chute)
    const dRidge1 = this.distToLineSegment(x, z, -420, -680, -260, 20);
    if (dRidge1 < 180) {
      const rFactor = 1.0 - dRidge1 / 180;
      env += rFactor * rFactor * 65.0; // +65m prominent sightline blocker
    }

    // Ridge 2 (Between Central Glacier Chute and East Freestyle Bowl)
    const dRidge2 = this.distToLineSegment(x, z, 300, -620, 220, 40);
    if (dRidge2 < 170) {
      const rFactor = 1.0 - dRidge2 / 170;
      env += rFactor * rFactor * 55.0; // +55m sightline blocker
    }

    // 6. Natural Base Drainage & Gentle Runout: Base floor clamped to 20m
    env = Math.max(20.0, env);

    // Flatter runout around Base Village (z > 700): softens grade to 5-10°
    if (z > 680) {
      const runoutBlend = this.smoothstep(680, 960, z);
      env = THREE.MathUtils.lerp(env, 20.0, runoutBlend * 0.82);
    }

    // 7. Boundary Bowl Rim around outer 120m of the 2,400m map (half-size = 1,200m)
    const distFromCenter = Math.max(Math.abs(x), Math.abs(z));
    const rimStart = 1200 - 140; // 1,060m
    if (distFromCenter > rimStart) {
      const rimFactor = this.smoothstep(rimStart, 1200, distFromCenter);
      env += rimFactor * rimFactor * 240.0;
    }

    return env;
  }

  private distToLineSegment(px: number, pz: number, x1: number, z1: number, x2: number, z2: number): number {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const l2 = dx * dx + dz * dz;
    if (l2 < 1e-4) return Math.hypot(px - x1, pz - z1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / l2));
    return Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz));
  }

  // Layer 2: Domain-Warped Alpine Ridges
  private getAlpineRidges(x: number, z: number, macroEnv: number): number {
    const warpX = x + 50.0 * this.warpNoise2D(x * 0.0018, z * 0.0018);
    const warpZ = z + 50.0 * this.warpNoise2D(x * 0.0018 + 7.4, z * 0.0018 + 3.2);

    const r1 = 1.0 - Math.abs(this.noise2D(warpX * 0.0022, warpZ * 0.0022));
    const r2 = 1.0 - Math.abs(this.noise2D(warpX * 0.0055, warpZ * 0.0055));
    const r3 = 1.0 - Math.abs(this.noise2D(warpX * 0.014, warpZ * 0.014));

    const rawRidges = r1 * 55.0 + r2 * 22.0 + r3 * 8.0;

    // Exponential slope / altitude weighting: craggy on peaks, gentle in valleys
    const altitudeWeight = Math.min(1.0, Math.pow(macroEnv / 540.0, 1.3));
    return rawRidges * altitudeWeight;
  }

  private distToSegment(
    px: number,
    pz: number,
    a: THREE.Vector3,
    b: THREE.Vector3
  ): { dist: number; splineY: number } {
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const apx = px - a.x;
    const apz = pz - a.z;

    const abLenSq = abx * abx + abz * abz;
    if (abLenSq < 1e-6) {
      return { dist: Math.hypot(apx, apz), splineY: a.y };
    }

    const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / abLenSq));
    const projX = a.x + t * abx;
    const projZ = a.z + t * abz;
    const dist = Math.hypot(px - projX, pz - projZ);
    const splineY = a.y + t * (b.y - a.y);

    return { dist, splineY };
  }

  // Sample the complete 4-layer terrain pipeline
  public sampleTerrain(x: number, z: number): TerrainSample {
    const macroEnv = this.getMacroEnvelope(x, z);
    const ridges = this.getAlpineRidges(x, z, macroEnv);
    let height = macroEnv + ridges;

    let minPisteDist = 999.0;
    let closestSplineY = height;
    let isInsideHalfpipe = false;
    let halfpipeCarve = 0;

    for (const piste of this.pistes) {
      for (let i = 0; i < piste.points.length - 1; i++) {
        const seg = this.distToSegment(x, z, piste.points[i], piste.points[i + 1]);
        if (seg.dist < minPisteDist) {
          minPisteDist = seg.dist;
          closestSplineY = seg.splineY;
        }

        // Quartic U-shaped trough for natural halfpipe
        if (piste.isHalfpipe && seg.dist < piste.width) {
          isInsideHalfpipe = true;
          const u = seg.dist / piste.width;
          const depth = piste.depth ?? 5.5;
          const carve = -depth * (1.0 - Math.pow(u, 4));
          if (carve < halfpipeCarve) halfpipeCarve = carve;
        }
      }
    }

    // Blend groomed piste smoothly toward spline elevation
    const pisteWidth = 32.0;
    if (minPisteDist < pisteWidth) {
      const blend = this.smoothstep(pisteWidth, 0, minPisteDist);
      height = THREE.MathUtils.lerp(height, closestSplineY, blend * 0.78);
    }

    if (isInsideHalfpipe) {
      height += halfpipeCarve;
    }

    // Circular smoothstep pad stamps (Lodge, Mid-Hub, and Peak stations)
    for (const pad of this.pads) {
      const d = Math.hypot(x - pad.x, z - pad.z);
      if (d < pad.radius) {
        const blend = this.smoothstep(pad.radius, pad.radius * 0.45, d);
        height = THREE.MathUtils.lerp(height, pad.targetHeight, blend);
      }
    }

    // Layer 4: Surfable Snow Dunes (Sword of the Sea Feel on off-piste powder)
    if (minPisteDist > 25.0) {
      const duneWeight = this.smoothstep(25.0, 55.0, minPisteDist);
      const dune = Math.sin(x * 0.035 + Math.cos(z * 0.025) * 1.5) * Math.cos(z * 0.03) * 2.2;
      height += dune * duneWeight;
    }

    // Normal evaluation via central difference
    const eps = 1.2;
    const hL = this.sampleHeightQuick(x - eps, z);
    const hR = this.sampleHeightQuick(x + eps, z);
    const hD = this.sampleHeightQuick(x, z - eps);
    const hU = this.sampleHeightQuick(x, z + eps);

    const normal = new THREE.Vector3(hL - hR, 2.0 * eps, hD - hU).normalize();
    const slopeDeg = Math.acos(Math.min(1.0, Math.max(0.0, normal.y))) * (180 / Math.PI);

    let surfaceType: SurfaceType = 'POWDER';
    if (minPisteDist <= pisteWidth) {
      surfaceType = 'PISTE';
    } else if (slopeDeg > 38.0) {
      surfaceType = 'ROCK';
    }

    return {
      height,
      surfaceType,
      pisteDist: minPisteDist,
      normal,
      slopeDeg
    };
  }

  public sampleHeightQuick(x: number, z: number): number {
    const macroEnv = this.getMacroEnvelope(x, z);
    const ridges = this.getAlpineRidges(x, z, macroEnv);
    let height = macroEnv + ridges;

    let minPisteDist = 999.0;
    let closestSplineY = height;
    let halfpipeCarve = 0;

    for (const piste of this.pistes) {
      for (let i = 0; i < piste.points.length - 1; i++) {
        const seg = this.distToSegment(x, z, piste.points[i], piste.points[i + 1]);
        if (seg.dist < minPisteDist) {
          minPisteDist = seg.dist;
          closestSplineY = seg.splineY;
        }
        if (piste.isHalfpipe && seg.dist < piste.width) {
          const u = seg.dist / piste.width;
          const depth = piste.depth ?? 5.5;
          const carve = -depth * (1.0 - Math.pow(u, 4));
          if (carve < halfpipeCarve) halfpipeCarve = carve;
        }
      }
    }

    if (minPisteDist < 32.0) {
      const blend = this.smoothstep(32.0, 0, minPisteDist);
      height = THREE.MathUtils.lerp(height, closestSplineY, blend * 0.78);
    }
    height += halfpipeCarve;

    for (const pad of this.pads) {
      const d = Math.hypot(x - pad.x, z - pad.z);
      if (d < pad.radius) {
        const blend = this.smoothstep(pad.radius, pad.radius * 0.45, d);
        height = THREE.MathUtils.lerp(height, pad.targetHeight, blend);
      }
    }

    if (minPisteDist > 25.0) {
      const duneWeight = this.smoothstep(25.0, 55.0, minPisteDist);
      const dune = Math.sin(x * 0.035 + Math.cos(z * 0.025) * 1.5) * Math.cos(z * 0.03) * 2.2;
      height += dune * duneWeight;
    }

    return height;
  }
}
