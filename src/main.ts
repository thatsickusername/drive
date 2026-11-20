import * as THREE from 'three';
import { Renderer } from './renderer';
import { PhysicsEngine } from './physics';
import { DynamicCameraDirector } from './camera';
import { UnifiedInputController } from './input';
import { SnowboardController } from './player/SnowboardController';
import { Phase1TestSlope } from './world/Phase1TestSlope';

class Game {
  private renderer!: Renderer;
  private physics!: PhysicsEngine;
  private player!: SnowboardController;
  public testSlope!: Phase1TestSlope;
  private cameraDirector!: DynamicCameraDirector;
  private inputController!: UnifiedInputController;

  private hudElement!: HTMLElement;
  private trickBannerElement!: HTMLElement;
  private lastTime: number = 0;
  private lastHudUpdateTime: number = 0;

  private readonly spawnPos = new THREE.Vector3(0, 82.5, 40);
  private readonly spawnHeading = 0; // Pointing downhill along -Z

  public async start(): Promise<void> {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element #game-canvas not found');
    }

    // 1. Initialize PBR ACES Renderer
    this.renderer = new Renderer(canvas);

    // 2. Initialize Rapier 3D WASM Physics Engine
    this.physics = new PhysicsEngine();
    await this.physics.init();

    // 3. Build Phase 1 Test Slope & Kicker Ramps
    this.testSlope = new Phase1TestSlope(
      this.renderer.scene,
      this.physics.rapier,
      this.physics.world
    );

    // 4. Initialize Snowboard Rider Controller
    this.player = new SnowboardController(
      this.renderer.scene,
      this.physics.rapier,
      this.physics.world,
      this.spawnPos.x,
      this.spawnPos.y,
      this.spawnPos.z
    );

    // 5. Initialize Camera Director
    this.cameraDirector = new DynamicCameraDirector(this.renderer.camera);
    this.cameraDirector.initSnowboard(this.player.mesh.position, this.player.heading);

    // 6. Initialize Controller & Reset Listener
    this.inputController = new UnifiedInputController();
    this.inputController.onResetRequested = () => this.resetPlayer();

    // 7. Setup HUD & UI
    this.setupHUD();

    // 8. Start Game Loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  private resetPlayer(): void {
    this.player.reset(this.spawnPos.x, this.spawnPos.y, this.spawnPos.z, this.spawnHeading);
    this.cameraDirector.initSnowboard(this.player.mesh.position, this.player.heading);
  }

  private setupHUD(): void {
    const existingHud = document.getElementById('hud');
    if (existingHud) {
      existingHud.remove();
    }

    // Telemetry & State HUD (Top-Left)
    this.hudElement = document.createElement('div');
    this.hudElement.id = 'hud';
    this.hudElement.style.cssText = `
      position: absolute;
      top: 16px;
      left: 16px;
      color: #f1f5f9;
      font-family: 'Segoe UI', Roboto, monospace;
      font-size: 13px;
      background: rgba(15, 23, 42, 0.78);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 12px 18px;
      pointer-events: none;
      line-height: 1.6;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
      z-index: 100;
    `;
    document.body.appendChild(this.hudElement);

    // Dynamic Trick Score & Notification Banner (Top-Center)
    this.trickBannerElement = document.createElement('div');
    this.trickBannerElement.id = 'trick-banner';
    this.trickBannerElement.style.cssText = `
      position: absolute;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      pointer-events: none;
      z-index: 101;
      display: none;
    `;
    document.body.appendChild(this.trickBannerElement);
  }

  private loop(currentTime: number): void {
    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // 1. Gather Unified Inputs
    this.inputController.update();
    const snowboardInputs = this.inputController.getSnowboardInputs();

    // 2. Fixed Timestep Physics Stepping
    this.physics.step(delta, (dt: number) => {
      this.player.update(dt, snowboardInputs);
    });

    // 3. Update Camera Director
    this.cameraDirector.updateSnowboard(
      delta,
      this.player.mesh.position,
      this.player.heading,
      this.player.speedKmh
    );

    // 4. Update HUD (at 30Hz to prevent DOM thrashing)
    if (currentTime - this.lastHudUpdateTime >= 33) {
      this.lastHudUpdateTime = currentTime;
      this.updateHUD();
    }

    // 5. Render Scene
    this.renderer.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  private updateHUD(): void {
    const pos = this.player.mesh.position;
    const speed = this.player.speedKmh.toFixed(1);
    const altitude = pos.y.toFixed(1);
    const stateBadge = this.player.isGrounded
      ? '<span style="color:#38bdf8;font-weight:bold;">● CARVING</span>'
      : '<span style="color:#f59e0b;font-weight:bold;">▲ AIRBORNE</span>';

    const trickEng = this.player.trickEngine;

    this.hudElement.innerHTML = `
      <div style="font-weight:bold;font-size:14px;color:#38bdf8;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:4px;margin-bottom:6px;display:flex;justify-content:space-between;gap:20px;">
        <span>ALPINE FREERIDE // PHASE 1</span>
        <span>${stateBadge}</span>
      </div>
      <div>Speed: <strong style="color:#fff;font-size:16px;">${speed}</strong> km/h | Alt: <strong>${altitude}m</strong></div>
      <div>Score: <strong style="color:#4ade80;">${trickEng.totalScore} pts</strong></div>
      <div style="margin-top:6px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:4px;font-size:11px;color:#94a3b8;">
        <strong>CONTROLS:</strong><br />
        • <strong>A / D</strong>: Carve Left / Right (Yaw Spin in air)<br />
        • <strong>W</strong>: Tuck / Speed Pump (Frontflip in air)<br />
        • <strong>S</strong>: Brake / Power Slide (Backflip in air)<br />
        • <strong>Space</strong>: Pop Ollie / Jump<br />
        • <strong>Shift / J</strong>: Grab Board (+Multiplier)<br />
        • <strong>R</strong>: Respawn at Top
      </div>
    `;

    // Update Trick Banner
    if (trickEng.displayTimer > 0 && trickEng.lastTrickName) {
      this.trickBannerElement.style.display = 'block';
      const opacity = Math.min(1.0, trickEng.displayTimer);
      this.trickBannerElement.style.opacity = `${opacity}`;
      this.trickBannerElement.innerHTML = `
        <div style="font-size:24px;font-weight:900;color:#facc15;text-shadow:0 2px 10px rgba(0,0,0,0.8);letter-spacing:1px;text-transform:uppercase;">
          ${trickEng.lastTrickName}
        </div>
        <div style="font-size:16px;font-weight:bold;color:#4ade80;text-shadow:0 1px 6px rgba(0,0,0,0.8);">
          +${trickEng.lastTrickPoints} PTS
        </div>
      `;
    } else if (!this.player.isGrounded && trickEng.currentAirTime > 0.3) {
      this.trickBannerElement.style.display = 'block';
      this.trickBannerElement.style.opacity = '1.0';
      const mult = trickEng.currentMultiplier.toFixed(1);
      const isGrab = trickEng.isGrabbing ? '<span style="color:#38bdf8;">[METHOD GRAB]</span> ' : '';
      this.trickBannerElement.innerHTML = `
        <div style="font-size:18px;font-weight:bold;color:#f59e0b;text-shadow:0 2px 8px rgba(0,0,0,0.8);">
          ${isGrab}AIR: ${trickEng.currentAirTime.toFixed(2)}s (${mult}x)
        </div>
      `;
    } else {
      this.trickBannerElement.style.display = 'none';
    }
  }
}

function initGame(): void {
  const game = new Game();
  game.start().catch((err) => {
    console.error('Failed to start alpine freeride engine:', err);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
