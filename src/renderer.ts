import * as THREE from 'three';
import { SkyDome } from './world/SkyDome';
import { AirborneSparkles } from './world/AirborneSparkles';
import { DayNightCycle } from './world/DayNightCycle';

export type LightingMode = 'day' | 'golden' | 'night';

export class Renderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public fillLight: THREE.DirectionalLight;
  public skyDome: SkyDome;
  public sparkles: AirborneSparkles;
  public readonly sunDir = new THREE.Vector3(140, 110, -50).normalize();

  public cycle: DayNightCycle = new DayNightCycle();
  public autoCycle: boolean = true;

  public get lightingMode(): LightingMode {
    const p = this.cycle.currentPhase;
    if (p === 'day') return 'day';
    if (p === 'night') return 'night';
    return 'golden';
  }
  public get isNightMode(): boolean {
    return this.cycle.currentPhase === 'night';
  }
  public get isGoldenMode(): boolean {
    return this.cycle.currentPhase === 'sunset' || this.cycle.currentPhase === 'sunrise';
  }

  public lightingFactor: number = 0.0; // 0.0 = Day, 1.0 = Golden, 2.0 = Night
  private targetLightingFactor: number = 0.0;
  public goldenFactor: number = 0.0;
  public nightFactor: number = 0.0;

  // Day Lighting Palette (Acceptance Criteria 1)
  public readonly daySunColor = new THREE.Color(0xfff6ec);
  public readonly dayShadowColor = new THREE.Color(0x9ca9cb);
  public readonly dayHemiSky = new THREE.Color(0x9eb3dc);
  public readonly dayHemiGround = new THREE.Color(0xfceee5);
  public readonly dayFog = new THREE.Color(0xf8ebe6);
  public readonly dayBg = new THREE.Color(0xf6eef3);

  // Golden Hour Lighting Palette (Acceptance Criteria 3 - Radiant sunset / sunrise glow)
  public readonly goldenSunColor = new THREE.Color(0xffdeb8);
  public readonly goldenShadowColor = new THREE.Color(0x9488ac);
  public readonly goldenHemiSky = new THREE.Color(0x847298);
  public readonly goldenHemiGround = new THREE.Color(0xf6baa4);
  public readonly goldenFog = new THREE.Color(0xdf9a8e);
  public readonly goldenBg = new THREE.Color(0x806e8f);

  // Night Lighting Palette (Acceptance Criteria 2 - Soft pastel night glow)
  public readonly nightMoonColor = new THREE.Color(0xf0f4ff);
  public readonly nightShadowColor = new THREE.Color(0x727ca8);
  public readonly nightHemiSky = new THREE.Color(0x44527e);
  public readonly nightHemiGround = new THREE.Color(0x7a84ac);
  public readonly nightFog = new THREE.Color(0x627098);
  public readonly nightBg = new THREE.Color(0x2d3a5a);

  public readonly currentSunColor = new THREE.Color();
  public readonly currentShadowColor = new THREE.Color();

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf6eef3);
    this.scene.fog = new THREE.Fog(0xf8ebe6, 180, 1500);

    this.currentSunColor.copy(this.daySunColor);
    this.currentShadowColor.copy(this.dayShadowColor);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      3000
    );
    this.camera.position.set(0, 10, -20);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    // Directional celestial light (Sun by day, Moon by night)
    this.dirLight = new THREE.DirectionalLight(0xfff6ec, 2.05);
    this.dirLight.position.set(140, 110, -50);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 450;
    const shadowD = 100;
    this.dirLight.shadow.camera.left = -shadowD;
    this.dirLight.shadow.camera.right = shadowD;
    this.dirLight.shadow.camera.top = shadowD;
    this.dirLight.shadow.camera.bottom = -shadowD;
    this.dirLight.shadow.bias = -0.0002;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // Ambient hemisphere light
    this.hemiLight = new THREE.HemisphereLight(0x9eb3dc, 0xfceee5, 0.88);
    this.scene.add(this.hemiLight);

    // Subtle neutral fill light
    this.fillLight = new THREE.DirectionalLight(0xdedbe0, 0.12);
    this.fillLight.position.set(130, 80, 80);
    this.scene.add(this.fillLight);

    // Stylized gradient SkyDome & floating diamond sparkles
    this.skyDome = new SkyDome();
    this.scene.add(this.skyDome.mesh);

    this.sparkles = new AirborneSparkles();
    this.scene.add(this.sparkles.points);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  public setLightingMode(mode: LightingMode, instant: boolean = false): void {
    if (mode === 'golden') {
      this.cycle.jumpToPhase('sunset', true);
      this.targetLightingFactor = 1.0;
    } else if (mode === 'night') {
      this.cycle.jumpToPhase('night', false);
      this.targetLightingFactor = 2.0;
    } else {
      this.cycle.jumpToPhase('day', false);
      this.targetLightingFactor = 0.0;
    }
    if (instant) {
      this.lightingFactor = this.targetLightingFactor;
      this.applyLightingLerp(this.lightingFactor);
    }
  }

  public toggleLightingMode(): LightingMode {
    this.cycle.advanceToNextPhase();
    this.targetLightingFactor = this.cycle.lightingFactor;
    return this.lightingMode;
  }

  public applyLightingLerp(t: number): void {
    if (t <= 1.0) {
      // Blend between Day (0.0) and Golden Hour (1.0)
      const u = THREE.MathUtils.clamp(t, 0.0, 1.0);
      this.goldenFactor = u;
      this.nightFactor = 0.0;

      this.currentSunColor.lerpColors(this.daySunColor, this.goldenSunColor, u);
      this.currentShadowColor.lerpColors(this.dayShadowColor, this.goldenShadowColor, u);

      this.dirLight.color.copy(this.currentSunColor);
      this.dirLight.intensity = THREE.MathUtils.lerp(2.05, 2.15, u);

      this.hemiLight.color.lerpColors(this.dayHemiSky, this.goldenHemiSky, u);
      this.hemiLight.groundColor.lerpColors(this.dayHemiGround, this.goldenHemiGround, u);
      this.hemiLight.intensity = THREE.MathUtils.lerp(0.88, 0.96, u);

      this.fillLight.color.lerpColors(new THREE.Color(0xdedbe0), new THREE.Color(0x94657b), u);
      this.fillLight.intensity = THREE.MathUtils.lerp(0.12, 0.16, u);

      this.scene.background = (new THREE.Color().copy(this.dayBg)).lerp(this.goldenBg, u);
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.lerpColors(this.dayFog, this.goldenFog, u);
        this.scene.fog.near = THREE.MathUtils.lerp(180, 140, u);
        this.scene.fog.far = THREE.MathUtils.lerp(1500, 1350, u);
      }
      this.renderer.toneMappingExposure = THREE.MathUtils.lerp(1.08, 1.08, u);
      this.sparkles.setColor(new THREE.Color(0xffeedd).lerp(new THREE.Color(0xffdfb8), u));
    } else {
      // Blend between Golden Hour (1.0) and Night (2.0)
      const u = THREE.MathUtils.clamp(t - 1.0, 0.0, 1.0);
      this.goldenFactor = 1.0 - u;
      this.nightFactor = u;

      this.currentSunColor.lerpColors(this.goldenSunColor, this.nightMoonColor, u);
      this.currentShadowColor.lerpColors(this.goldenShadowColor, this.nightShadowColor, u);

      this.dirLight.color.copy(this.currentSunColor);
      this.dirLight.intensity = THREE.MathUtils.lerp(2.15, 1.42, u);

      this.hemiLight.color.lerpColors(this.goldenHemiSky, this.nightHemiSky, u);
      this.hemiLight.groundColor.lerpColors(this.goldenHemiGround, this.nightHemiGround, u);
      this.hemiLight.intensity = THREE.MathUtils.lerp(0.96, 1.02, u);

      this.fillLight.color.lerpColors(new THREE.Color(0x94657b), new THREE.Color(0x52668c), u);
      this.fillLight.intensity = THREE.MathUtils.lerp(0.16, 0.16, u);

      this.scene.background = (new THREE.Color().copy(this.goldenBg)).lerp(this.nightBg, u);
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.lerpColors(this.goldenFog, this.nightFog, u);
        this.scene.fog.near = THREE.MathUtils.lerp(140, 95, u);
        this.scene.fog.far = THREE.MathUtils.lerp(1350, 1220, u);
      }
      this.renderer.toneMappingExposure = THREE.MathUtils.lerp(1.08, 1.06, u);
      this.sparkles.setColor(new THREE.Color(0xffdfb8).lerp(new THREE.Color(0xcbe0ff), u));
    }

    this.skyDome.setLightingFactors(this.goldenFactor, this.nightFactor);
  }

  public updateLighting(time: number, targetPos: THREE.Vector3, cameraPos: THREE.Vector3, delta: number = 0.016): void {
    if (this.autoCycle && !this.cycle.isPaused) {
      this.lightingFactor = this.cycle.update(delta);
      this.applyLightingLerp(this.lightingFactor);
    } else {
      if (Math.abs(this.lightingFactor - this.targetLightingFactor) > 0.0005) {
        this.lightingFactor = THREE.MathUtils.damp(this.lightingFactor, this.targetLightingFactor, 7.5, delta);
        this.applyLightingLerp(this.lightingFactor);
      }
    }

    // Keep high-resolution shadow map centered on player
    this.dirLight.target.position.copy(targetPos);
    this.dirLight.position.set(
      targetPos.x - 190,
      targetPos.y + 130,
      targetPos.z - 50
    );
    this.dirLight.target.updateMatrixWorld();
    this.dirLight.updateMatrixWorld();

    this.skyDome.update(time, cameraPos);
    this.sparkles.update(time, targetPos);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
