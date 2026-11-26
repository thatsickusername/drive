import * as THREE from 'three';
import { Renderer } from './Renderer';
import { PhysicsEngine } from './PhysicsEngine';
import { Telemetry } from './Telemetry';
import { DynamicCameraDirector } from '../camera/CameraDirector';
import { CameraTunerOverlay } from '../camera/CameraTunerOverlay';
import { UnifiedInputController } from './InputController';
import { SkierController } from '../player/SkierController';
import { AlpineMassif } from '../world/AlpineMassif';
import { HudOverlay } from '../ui/HudOverlay';
import { LightingControls } from '../ui/LightingControls';
import { NetworkManager } from '../network/NetworkManager';

export class Game {
  public renderer!: Renderer;
  public physics!: PhysicsEngine;
  public player!: SkierController;
  public massif!: AlpineMassif;
  public cameraDirector!: DynamicCameraDirector;
  public cameraTuner!: CameraTunerOverlay;
  public inputController!: UnifiedInputController;
  public hudOverlay!: HudOverlay;
  public lightingControls!: LightingControls;
  public networkManager!: NetworkManager;
  public telemetry: Telemetry | null = null;

  private lastTime: number = 0;
  private lastHudUpdateTime: number = 0;
  private animFrameId: number | null = null;
  private readonly boundLoop = (time: number) => this.loop(time);
  private readonly boundKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Digit1') this.teleportTo(this.locations.summit);
    else if (e.code === 'Digit2') this.teleportTo(this.locations.west);
    else if (e.code === 'Digit3') this.teleportTo(this.locations.east);
    else if (e.code === 'Digit4') this.teleportTo(this.locations.canyon);
    else if (e.code === 'Digit5') this.teleportTo(this.locations.mid);
    else if (e.code === 'Digit6') this.teleportTo(this.locations.halfpipe);
    else if (e.code === 'KeyV') this.cameraDirector.togglePerspectiveMode();
    else if (e.code === 'KeyO') this.cameraTuner.toggle();
    else if (e.code === 'KeyH') this.toggleHUD();
    else if (e.code === 'KeyL' || e.code === 'KeyN') this.lightingControls.toggle();
    else if (e.code === 'KeyP') {
      this.renderer.cycle.togglePause();
      this.lightingControls.update();
    }
  };
  private readonly boundVisibilityChange = () => {
    if (document.hidden) {
      this.physics.resetAccumulator();
    } else {
      this.lastTime = performance.now();
      this.physics.resetAccumulator();
    }
  };

  // Preset mountain locations (2.4km x 2.4km Grand Mountain Adventure Resort)
  public readonly locations = {
    summit: { name: 'Main Summit Peak (Glacier Chute)', x: -300, z: -750, heading: 3.26 },
    west: { name: 'West Peak (Powder Highway)', x: -610, z: -665, heading: 2.39 },
    east: { name: 'East Park Ridge (Slopestyle Run)', x: 695, z: -410, heading: 3.43 },
    canyon: { name: 'Central Canyon Rim (Gorge Shoulder)', x: -190, z: -245, heading: 3.19 },
    mid: { name: 'Mid-Mountain Hub (Alpine Flow Cruiser)', x: 140, z: 55, heading: 2.09 },
    halfpipe: { name: 'Glacial Halfpipe Gully (Super-G Finish)', x: 360, z: 50, heading: 3.64 }
  };

  public currentSpawn = { ...this.locations.summit };

  public async start(): Promise<void> {
    const isPerf = window.location.search.includes('perf=1') || window.location.search.includes('perf') || !!(window as any).__ENABLE_PERF__;
    if (isPerf) {
      this.telemetry = new Telemetry();
      this.telemetry.mark('startup-start');
    }

    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element #game-canvas not found');
    }

    // 1. Initialize PBR ACES Renderer
    this.renderer = new Renderer(canvas);

    // 2. Initialize Rapier 3D WASM Physics Engine
    if (this.telemetry) this.telemetry.mark('wasm-init-start');
    this.physics = new PhysicsEngine();
    await this.physics.init();
    if (this.telemetry) {
      this.telemetry.mark('wasm-init-end');
      this.telemetry.measure('wasm-init', 'wasm-init-start', 'wasm-init-end');
    }

    // 3. Build 2.4km x 2.4km Alpine Massif
    if (this.telemetry) this.telemetry.mark('massif-init-start');
    this.massif = new AlpineMassif(
      this.renderer.scene,
      this.physics.rapier,
      this.physics.world
    );
    if (this.telemetry) {
      this.telemetry.mark('massif-init-end');
      this.telemetry.measure('massif-init', 'massif-init-start', 'massif-init-end');
    }

    // 4. Sample ground altitude at Summit Peak
    const initialGround = this.massif.heightfield.sampleTerrain(this.currentSpawn.x, this.currentSpawn.z);
    const spawnY = initialGround.height;

    // 5. Initialize Skier Controller
    const spawnPos = new THREE.Vector3(this.currentSpawn.x, spawnY, this.currentSpawn.z);
    this.player = new SkierController(
      this.physics.world,
      this.renderer.scene,
      spawnPos
    );
    this.player.heading = this.currentSpawn.heading;
    const terrainSampler = (x: number, z: number) => this.massif.heightfield.sampleHeightQuick(x, z);
    this.player.setTerrainSampler(terrainSampler);

    // 6. Initialize Camera Director
    this.cameraDirector = new DynamicCameraDirector(this.renderer.camera);
    this.cameraDirector.setTerrainSampler(terrainSampler);
    this.cameraDirector.initSnowboard(this.player.mesh.position, this.player.heading);

    // 7. Initialize Controller & Hotkeys
    this.inputController = new UnifiedInputController();
    this.inputController.onResetRequested = () => this.respawnAtCurrent();
    this.inputController.onFlyCamToggleRequested = () => this.toggleFlyCam();
    this.inputController.onToggleSportRequested = () => this.player.toggleSport();
    this.inputController.onToggleTwintipsRequested = () => this.player.toggleTwintips();
    this.inputController.onToggleReverseTurnRequested = () => this.player.toggleReverseTurn();

    window.addEventListener('keydown', this.boundKeyDown);

    // 8. Setup UI Overlays & Realtime Multiplayer Client
    this.hudOverlay = new HudOverlay(this.player, this.cameraDirector);
    this.lightingControls = new LightingControls(this.renderer);
    this.cameraTuner = new CameraTunerOverlay(this.cameraDirector);

    this.networkManager = new NetworkManager(
      this.renderer.scene,
      this.player,
      terrainSampler
    );
    this.networkManager.connect();

    // Parse URL query parameters
    if (window.location.search.includes('nohud')) {
      this.toggleHUD();
    }
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('timescale')) {
      const ts = parseFloat(searchParams.get('timescale') || '1');
      if (!isNaN(ts)) this.renderer.cycle.timeScale = ts;
    }
    if (searchParams.has('pause') || searchParams.get('cycle') === '0' || searchParams.get('cycle') === 'pause') {
      this.renderer.cycle.isPaused = true;
    }
    if (searchParams.has('golden') || searchParams.get('lighting') === 'golden' || searchParams.get('lighting') === 'goldenhour') {
      this.renderer.setLightingMode('golden', true);
      this.lightingControls.update();
    } else if (searchParams.has('night') || searchParams.get('lighting') === 'night') {
      this.renderer.setLightingMode('night', true);
      this.lightingControls.update();
    }

    (window as any).game = this;

    // Handle tab switching / visibility changes to pause accumulation cleanly
    document.addEventListener('visibilitychange', this.boundVisibilityChange);

    // 9. Start Game Loop
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.boundLoop);
  }

  public teleportTo(loc: { name: string; x: number; z: number; heading: number }): void {
    this.currentSpawn = { ...loc };
    const ground = this.massif.heightfield.sampleTerrain(loc.x, loc.z);
    this.player.reset(loc.x, ground.height, loc.z, loc.heading);

    if (this.cameraDirector.isFlyCam) {
      this.cameraDirector.toggleFlyCam(this.player.mesh.position);
    }
    this.cameraDirector.initSnowboard(this.player.mesh.position, this.player.heading);
  }

  public respawnAtCurrent(): void {
    const ground = this.massif.heightfield.sampleTerrain(this.currentSpawn.x, this.currentSpawn.z);
    this.player.reset(this.currentSpawn.x, ground.height, this.currentSpawn.z, this.currentSpawn.heading);
    this.cameraDirector.initSnowboard(this.player.mesh.position, this.player.heading);
  }

  public toggleFlyCam(): void {
    const isFly = this.cameraDirector.toggleFlyCam(this.player.mesh.position);
    if (!isFly) {
      // Drop boarder where camera was hovering (at safe ground clearance)
      const camPos = this.cameraDirector.camera.position;
      const ground = this.massif.heightfield.sampleTerrain(camPos.x, camPos.z);
      const safeY = Math.max(camPos.y, ground.height + 2.0);
      this.player.reset(camPos.x, safeY, camPos.z, this.cameraDirector.flyCamYaw + Math.PI);
      this.cameraDirector.initSnowboard(this.player.mesh.position, this.player.heading);
    }
  }

  public toggleHUD(): void {
    const visible = this.hudOverlay.toggle();
    this.lightingControls.setVisible(visible);
  }

  private loop(currentTime: number): void {
    const frameStart = performance.now();
    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // 1. Gather Unified Inputs
    this.inputController.update();

    let physicsDuration = 0;
    if (this.cameraDirector.isFlyCam) {
      // Fly-Cam Free Navigation
      const flyInputs = this.inputController.getFlyCamInputs();
      this.cameraDirector.updateFlyCam(
        delta,
        flyInputs.moveForward,
        flyInputs.moveRight,
        flyInputs.moveUp,
        flyInputs.yawDelta,
        flyInputs.pitchDelta
      );
    } else {
      // Grand Mountain Adventure Physics Update
      const boarderInputs = this.inputController.getBoarderInputs();

      const physStart = performance.now();
      this.physics.step(delta, (dt: number) => {
        const sample = this.massif.heightfield.sampleTerrain(
          this.player.root.position.x,
          this.player.root.position.z
        );
        this.player.fixedUpdate(dt, boarderInputs, sample);
      });
      this.player.renderUpdate(delta, boarderInputs);
      physicsDuration = performance.now() - physStart;

      // Update Follow Camera
      const lookInputs = this.inputController.getCameraLookInputs(delta);
      this.cameraDirector.updateSnowboard(
        delta,
        this.player.mesh.position,
        this.player.heading,
        this.player.speedKmh,
        lookInputs.yawDelta,
        lookInputs.pitchDelta,
        Math.abs(this.player.vLateral),
        !this.player.isGrounded,
        this.player.leanAngle,
        this.player.airTimer,
        this.player.groundDistance,
        this.player.pumpKick,
        this.player.smoothNormal,
        this.player.gmaPhysics.velocity
      );
      this.player.pumpKick = 0;
    }

    // 2. Update HUD (at 30Hz)
    if (this.hudOverlay.visible && currentTime - this.lastHudUpdateTime >= 33) {
      this.lastHudUpdateTime = currentTime;
      this.hudOverlay.update();
      this.lightingControls.update();
    }

    // 3. Update Day/Golden/Night Lighting, SkyDome, Snow Shimmer and Sparkles
    const timeSec = currentTime * 0.001;
    this.renderer.updateLighting(timeSec, this.player.mesh.position, this.renderer.camera.position, delta);
    this.massif.update(
      timeSec,
      this.renderer.camera.position,
      this.player.mesh.position,
      this.renderer.nightFactor,
      this.renderer.currentSunColor,
      this.renderer.currentShadowColor,
      this.renderer.goldenFactor
    );
    this.player.updateTrailLighting(
      timeSec,
      this.renderer.sunDir,
      this.renderer.camera.position,
      this.renderer.nightFactor,
      this.renderer.currentSunColor,
      this.renderer.currentShadowColor,
      this.renderer.goldenFactor
    );

    // 4. Update Multiplayer Networking (Remote Skiers & 20Hz Binary Synchronization)
    this.networkManager.update(delta, this.renderer.camera, {
      time: timeSec,
      sunDir: this.renderer.sunDir,
      cameraPos: this.renderer.camera.position,
      nightFactor: this.renderer.nightFactor,
      sunColor: this.renderer.currentSunColor,
      shadowColor: this.renderer.currentShadowColor,
      goldenFactor: this.renderer.goldenFactor
    });

    // 5. Render Scene
    const renderStart = performance.now();
    this.renderer.render();
    const renderDuration = performance.now() - renderStart;

    if (this.telemetry) {
      const frameDuration = performance.now() - frameStart;
      this.telemetry.recordFrame({
        frameTimeMs: frameDuration,
        physicsTimeMs: physicsDuration,
        renderTimeMs: renderDuration,
        renderInfo: { ...this.renderer.renderer.info.render },
        memoryInfo: {
          geometries: this.renderer.renderer.info.memory.geometries,
          textures: this.renderer.renderer.info.memory.textures,
          programs: (this.renderer.renderer.info as any).programs?.length ?? 0
        },
        heapUsedBytes: (typeof performance !== 'undefined' && (performance as any).memory?.usedJSHeapSize) || 0
      });
    }

    this.animFrameId = requestAnimationFrame(this.boundLoop);
  }

  public dispose(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('visibilitychange', this.boundVisibilityChange);

    if (this.networkManager) this.networkManager.dispose();
    if (this.hudOverlay) this.hudOverlay.dispose();
    if (this.lightingControls) this.lightingControls.dispose();
    if (this.cameraTuner) this.cameraTuner.dispose();
    if (this.inputController) this.inputController.dispose();
    if (this.player) this.player.dispose();
    if (this.massif) this.massif.dispose();
    if (this.renderer) this.renderer.dispose();
    if (this.physics) this.physics.dispose();

    if ((window as any).game === this) {
      (window as any).game = null;
    }
  }
}
