import * as THREE from 'three';
import { CarvedSnowTrail } from '../world/trails/CarvedSnowTrail';
import { SnowSpraySystem, SnowSprayParams } from '../world/trails/SnowSpraySystem';
import { SnowAudio } from '../audio/SnowAudio';
import { emitSkierSnowSpray } from './SkierVisualHelpers';

export interface SkierEffectsFrameInput {
  dt: number;
  position: THREE.Vector3;
  forward: THREE.Vector3;
  right: THREE.Vector3;
  interpNormal: THREE.Vector3;
  smoothNormal: THREE.Vector3;
  speed: number;
  vLateral: number;
  leanAngle: number;
  steerX: number;
  slipAngleDeg: number;
  gripUtilization: number;
  isGrounded: boolean;
  isDrifting: boolean;
  isSlashing: boolean;
  isSlideTurn: boolean;
  isSharpTurn: boolean;
  sphereRadius: number;
}

/**
 * Owns skier audio synthesis, carved snow trail ribbon, and spray particle emission,
 * keeping SkierController focused on physics, interpolation, and character rigging.
 */
export class SkierEffects {
  private readonly scene: THREE.Scene;
  private readonly audio = new SnowAudio();
  private readonly trailRibbon: CarvedSnowTrail;
  private readonly snowSpray: SnowSpraySystem;
  private audioInitHandler: (() => void) | null = null;

  private readonly _sprayParams: SnowSprayParams = {
    posX: 0,
    posY: 0,
    posZ: 0,
    fwdX: 0,
    fwdY: 0,
    fwdZ: 0,
    rightX: 1,
    rightY: 0,
    rightZ: 0,
    normalX: 0,
    normalY: 1,
    normalZ: 0,
    speed: 0,
    leanAngle: 0,
    slipAngleDeg: 0,
    vLateral: 0,
    isGrounded: false,
    isDrifting: false,
    isSharpTurn: false,
    sphereRadius: 0.45
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.snowSpray = new SnowSpraySystem(scene, 900);
    this.trailRibbon = new CarvedSnowTrail(scene);

    const initAudio = () => {
      this.audio.init();
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('pointerdown', initAudio);
      this.audioInitHandler = null;
    };
    this.audioInitHandler = initAudio;
    window.addEventListener('keydown', initAudio, { once: true });
    window.addEventListener('pointerdown', initAudio, { once: true });
  }

  public setTerrainSampler(sampler: (x: number, z: number) => number): void {
    this.trailRibbon.setTerrainSampler(sampler);
  }

  public onJumpStart(): void {
    this.trailRibbon.onJumpStart();
  }

  public onCrash(): void {
    this.trailRibbon.onCrash();
  }

  public onRespawn(): void {
    this.trailRibbon.onRespawn();
  }

  public playPolePlant(): void {
    this.audio.playPolePlant();
  }

  public playLandThump(cleanLanding: boolean): void {
    this.audio.playLandThump(cleanLanding);
  }

  public emitCrashBurst(x: number, y: number, z: number, sphereRadius: number): void {
    this.snowSpray.emitCrashBurst(x, y, z, sphereRadius);
  }

  public updateFrame(frame: SkierEffectsFrameInput): void {
    const sprayLean = Math.sign(frame.leanAngle || frame.steerX) * Math.min(
      1.0,
      Math.max(
        Math.abs(frame.steerX),
        Math.abs(frame.leanAngle) * (frame.isDrifting || frame.isSlashing ? 1.0 : 0.65)
      )
    );

    emitSkierSnowSpray(
      this.snowSpray,
      frame.dt,
      this._sprayParams,
      frame.position,
      frame.forward,
      frame.right,
      frame.interpNormal,
      frame.speed,
      sprayLean,
      frame.slipAngleDeg,
      frame.vLateral,
      frame.isGrounded,
      frame.isSlideTurn,
      frame.isSharpTurn,
      frame.sphereRadius
    );

    this.trailRibbon.update(
      frame.position,
      frame.right,
      frame.smoothNormal,
      frame.isGrounded,
      frame.slipAngleDeg,
      frame.speed,
      frame.isDrifting,
      frame.leanAngle
    );

    this.audio.update(
      frame.speed,
      frame.vLateral,
      frame.isGrounded,
      frame.isDrifting,
      frame.gripUtilization
    );
  }

  public updateLighting(sunColor?: THREE.Color): void {
    this.snowSpray.setLightingColor(sunColor);
  }

  public dispose(): void {
    if (this.audioInitHandler) {
      window.removeEventListener('keydown', this.audioInitHandler);
      window.removeEventListener('pointerdown', this.audioInitHandler);
      this.audioInitHandler = null;
    }
    this.audio.dispose();
    this.trailRibbon.dispose(this.scene);
    this.snowSpray.dispose(this.scene);
  }
}
