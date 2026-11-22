import * as THREE from 'three';
import { SkyDome } from './world/SkyDome';
import { AirborneSparkles } from './world/AirborneSparkles';

export class Renderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public dirLight: THREE.DirectionalLight;
  public skyDome: SkyDome;
  public sparkles: AirborneSparkles;
  public readonly sunDir = new THREE.Vector3(-190, 130, -50).normalize();

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    // Soft pastel daytime alpine background & atmospheric fog
    this.scene.background = new THREE.Color(0xf6eef3);
    this.scene.fog = new THREE.Fog(0xf8ebe6, 180, 1500);

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

    // Soft warm daytime sun (#fff6ec) positioned to cast forward-left shadows across the slope
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

    // Soft pastel periwinkle sky (#9eb3dc) and pale champagne bounce (#fceee5)
    const hemiLight = new THREE.HemisphereLight(0x9eb3dc, 0xfceee5, 0.88);
    this.scene.add(hemiLight);

    // Subtle neutral fill light
    const fillLight = new THREE.DirectionalLight(0xdedbe0, 0.12);
    fillLight.position.set(130, 80, 80);
    this.scene.add(fillLight);

    // Stylized gradient SkyDome & floating diamond sparkles
    this.skyDome = new SkyDome();
    this.scene.add(this.skyDome.mesh);

    this.sparkles = new AirborneSparkles();
    this.scene.add(this.sparkles.points);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  public updateLighting(time: number, targetPos: THREE.Vector3, cameraPos: THREE.Vector3): void {
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
