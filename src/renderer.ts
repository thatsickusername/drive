import * as THREE from 'three';
import { SkyDome } from './world/SkyDome';
import { AirborneSparkles } from './world/AirborneSparkles';

export class Renderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public fillLight: THREE.DirectionalLight;
  public skyDome: SkyDome;
  public sparkles: AirborneSparkles;
  public readonly sunDir = new THREE.Vector3(-190, 130, -50).normalize();

  public isNightMode: boolean = false;
  public nightFactor: number = 0.0;
  private targetNightFactor: number = 0.0;

  // Day Lighting Palette (Acceptance Criteria 1)
  public readonly daySunColor = new THREE.Color(0xfff6ec);
  public readonly dayShadowColor = new THREE.Color(0x9ca9cb);
  public readonly dayHemiSky = new THREE.Color(0x9eb3dc);
  public readonly dayHemiGround = new THREE.Color(0xfceee5);
  public readonly dayFog = new THREE.Color(0xf8ebe6);
  public readonly dayBg = new THREE.Color(0xf6eef3);

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
    this.dirLight.position.set(-190, 130, -50);
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

  public setLightingMode(mode: 'day' | 'night', instant: boolean = false): void {
    this.isNightMode = mode === 'night';
    this.targetNightFactor = this.isNightMode ? 1.0 : 0.0;
    if (instant) {
      this.nightFactor = this.targetNightFactor;
      this.applyLightingLerp(this.nightFactor);
    }
  }

  public toggleLightingMode(): 'day' | 'night' {
    this.setLightingMode(this.isNightMode ? 'day' : 'night');
    return this.isNightMode ? 'night' : 'day';
  }

  public applyLightingLerp(f: number): void {
    this.currentSunColor.lerpColors(this.daySunColor, this.nightMoonColor, f);
    this.currentShadowColor.lerpColors(this.dayShadowColor, this.nightShadowColor, f);

    this.dirLight.color.copy(this.currentSunColor);
    this.dirLight.intensity = THREE.MathUtils.lerp(2.05, 1.42, f);

    this.hemiLight.color.lerpColors(this.dayHemiSky, this.nightHemiSky, f);
    this.hemiLight.groundColor.lerpColors(this.dayHemiGround, this.nightHemiGround, f);
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.88, 1.02, f);

    this.fillLight.color.lerpColors(new THREE.Color(0xdedbe0), new THREE.Color(0x52668c), f);
    this.fillLight.intensity = THREE.MathUtils.lerp(0.12, 0.16, f);

    this.scene.background = (new THREE.Color().copy(this.dayBg)).lerp(this.nightBg, f);
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.lerpColors(this.dayFog, this.nightFog, f);
      this.scene.fog.near = THREE.MathUtils.lerp(180, 95, f);
      this.scene.fog.far = THREE.MathUtils.lerp(1500, 1220, f);
    }
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(1.08, 1.06, f);
    this.skyDome.setNightFactor(f);
    this.sparkles.setColor(new THREE.Color(0xffeedd).lerp(new THREE.Color(0xcbe0ff), f));
  }

  public updateLighting(time: number, targetPos: THREE.Vector3, cameraPos: THREE.Vector3, delta: number = 0.016): void {
    if (Math.abs(this.nightFactor - this.targetNightFactor) > 0.0005) {
      this.nightFactor = THREE.MathUtils.damp(this.nightFactor, this.targetNightFactor, 7.5, delta);
      this.applyLightingLerp(this.nightFactor);
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
