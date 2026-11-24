import * as THREE from 'three';
import { Renderer } from './renderer';
import { PhysicsEngine } from './physics';
import { DynamicCameraDirector } from './camera';
import { CameraTunerOverlay } from './cameraOverlay';
import { UnifiedInputController } from './input';
import { SnowBoarder } from './boarder';
import { AlpineMassif } from './world/AlpineMassif';

class Game {
  private renderer!: Renderer;
  private physics!: PhysicsEngine;
  private player!: SnowBoarder;
  public massif!: AlpineMassif;
  private cameraDirector!: DynamicCameraDirector;
  private cameraTuner!: CameraTunerOverlay;
  private inputController!: UnifiedInputController;

  private hudElement!: HTMLElement;
  private trickBannerElement!: HTMLElement;
  private lightingToggleElement!: HTMLElement;
  private lastTime: number = 0;
  private lastHudUpdateTime: number = 0;

  // Preset mountain locations (2.4km x 2.4km Grand Mountain Adventure Resort)
  private readonly locations = {
    summit: { name: 'Main Summit Peak (Glacier Chute)', x: -300, z: -750, heading: 3.26 },
    west: { name: 'West Peak (Powder Highway)', x: -610, z: -665, heading: 2.39 },
    east: { name: 'East Park Ridge (Slopestyle Run)', x: 695, z: -410, heading: 3.43 },
    canyon: { name: 'Central Canyon Rim (Gorge Shoulder)', x: -190, z: -245, heading: 3.19 },
    mid: { name: 'Mid-Mountain Hub (Alpine Flow Cruiser)', x: 140, z: 55, heading: 2.09 },
    halfpipe: { name: 'Glacial Halfpipe Gully (Super-G Finish)', x: 360, z: 50, heading: 3.64 }
  };

  private currentSpawn = { ...this.locations.summit };

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

    // 3. Build 1.5km x 1.5km Fixed 4-Layer Alpine Massif
    this.massif = new AlpineMassif(
      this.renderer.scene,
      this.physics.rapier,
      this.physics.world
    );

    // 4. Sample exact ground altitude at Summit Peak
    const initialGround = this.massif.heightfield.sampleTerrain(this.currentSpawn.x, this.currentSpawn.z);
    const spawnY = initialGround.height;

    // 5. Initialize Grand Mountain Adventure SnowBoarder
    const spawnPos = new THREE.Vector3(this.currentSpawn.x, spawnY, this.currentSpawn.z);
    this.player = new SnowBoarder(
      this.physics.world,
      this.renderer.scene,
      spawnPos
    );
    this.player.heading = this.currentSpawn.heading;
    this.player.setTerrainSampler((x: number, z: number) => {
      return this.massif.heightfield.sampleTerrain(x, z).height;
    });

    // 6. Initialize Camera Director & Dynamic Terrain Elevation Sampler
    this.cameraDirector = new DynamicCameraDirector(this.renderer.camera);
    this.cameraDirector.setTerrainSampler((x: number, z: number) => {
      return this.massif.heightfield.sampleTerrain(x, z).height;
    });
    this.cameraDirector.initSnowboard(this.player.mesh.position, this.player.heading);

    // 7. Initialize Controller & Hotkeys
    this.inputController = new UnifiedInputController();
    this.inputController.onResetRequested = () => this.respawnAtCurrent();
    this.inputController.onFlyCamToggleRequested = () => this.toggleFlyCam();
    this.inputController.onToggleSportRequested = () => {
      this.player.toggleSport();
    };
    this.inputController.onToggleTwintipsRequested = () => {
      this.player.toggleTwintips();
    };
    this.inputController.onToggleReverseTurnRequested = () => {
      this.player.toggleReverseTurn();
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Digit1') this.teleportTo(this.locations.summit);
      else if (e.code === 'Digit2') this.teleportTo(this.locations.west);
      else if (e.code === 'Digit3') this.teleportTo(this.locations.east);
      else if (e.code === 'Digit4') this.teleportTo(this.locations.canyon);
      else if (e.code === 'Digit5') this.teleportTo(this.locations.mid);
      else if (e.code === 'Digit6') this.teleportTo(this.locations.halfpipe);
      else if (e.code === 'KeyV') this.cameraDirector.togglePerspectiveMode();
      else if (e.code === 'KeyO') this.cameraTuner.toggle();
      else if (e.code === 'KeyH') this.toggleHUD();
      else if (e.code === 'KeyL' || e.code === 'KeyN') this.toggleLighting();
    });

    // 8. Setup HUD, Lighting Toggle Switch & Camera Tuner Overlay
    this.setupHUD();
    this.setupLightingToggle();
    if (window.location.search.includes('nohud')) {
      this.toggleHUD();
    }
    if (window.location.search.includes('golden') || window.location.search.includes('lighting=golden') || window.location.search.includes('lighting=goldenhour')) {
      this.renderer.setLightingMode('golden', true);
      this.updateLightingToggleUI();
    } else if (window.location.search.includes('night') || window.location.search.includes('lighting=night')) {
      this.renderer.setLightingMode('night', true);
      this.updateLightingToggleUI();
    }
    (window as any).game = this;
    this.cameraTuner = new CameraTunerOverlay(this.cameraDirector);

    // 9. Start Game Loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  private teleportTo(loc: { name: string; x: number; z: number; heading: number }): void {
    this.currentSpawn = { ...loc };
    const ground = this.massif.heightfield.sampleTerrain(loc.x, loc.z);
    this.player.reset(loc.x, ground.height, loc.z, loc.heading);

    if (this.cameraDirector.isFlyCam) {
      this.cameraDirector.toggleFlyCam(this.player.mesh.position);
    }
    this.cameraDirector.initSnowboard(this.player.mesh.position, this.player.heading);
  }

  private respawnAtCurrent(): void {
    const ground = this.massif.heightfield.sampleTerrain(this.currentSpawn.x, this.currentSpawn.z);
    this.player.reset(this.currentSpawn.x, ground.height, this.currentSpawn.z, this.currentSpawn.heading);
    this.cameraDirector.initSnowboard(this.player.mesh.position, this.player.heading);
  }

  private toggleFlyCam(): void {
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

  private setupHUD(): void {
    const existingHud = document.getElementById('hud');
    if (existingHud) {
      existingHud.remove();
    }

    this.hudElement = document.createElement('div');
    this.hudElement.id = 'hud';
    this.hudElement.style.cssText = `
      position: absolute;
      top: 16px;
      left: 16px;
      color: #f1f5f9;
      font-family: 'Segoe UI', Roboto, monospace;
      font-size: 13px;
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 8px;
      padding: 12px 18px;
      pointer-events: none;
      line-height: 1.6;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
      z-index: 100;
      max-width: 380px;
    `;
    document.body.appendChild(this.hudElement);

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
      // Grand Mountain Adventure Snowboard Physics Update
      const boarderInputs = this.inputController.getBoarderInputs();

      this.physics.step(delta, (dt: number) => {
        const sample = this.massif.heightfield.sampleTerrain(
          this.player.root.position.x,
          this.player.root.position.z
        );
        this.player.fixedUpdate(dt, boarderInputs, sample);
      });
      this.player.renderUpdate(delta, boarderInputs);

      // Update Follow Camera with Mouse & Controller Right-Stick Look
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
    if (this.isHudVisible && currentTime - this.lastHudUpdateTime >= 33) {
      this.lastHudUpdateTime = currentTime;
      this.updateHUD();
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

    // 4. Render Scene
    this.renderer.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  private setupLightingToggle(): void {
    const existing = document.getElementById('lighting-toggle-container');
    if (existing) existing.remove();

    this.lightingToggleElement = document.createElement('div');
    this.lightingToggleElement.id = 'lighting-toggle-container';
    this.lightingToggleElement.style.cssText = `
      position: absolute;
      top: 18px;
      right: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 24px;
      padding: 6px 14px;
      cursor: pointer;
      user-select: none;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.40);
      transition: all 0.25s ease;
      font-family: 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #e2e8f0;
    `;

    this.lightingToggleElement.innerHTML = `
      <div id="toggle-track" style="
        position: relative;
        width: 58px;
        height: 24px;
        background: #334155;
        border-radius: 12px;
        transition: background 0.3s ease;
      ">
        <div id="toggle-thumb" style="
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: #f8fafc;
          border-radius: 50%;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        "></div>
      </div>
      <span id="toggle-label" style="min-width: 75px; letter-spacing: 0.2px;">☀️ Day</span>
      <span style="font-size: 10px; opacity: 0.6; padding: 2px 6px; background: rgba(255,255,255,0.12); border-radius: 6px;">L</span>
    `;

    this.lightingToggleElement.addEventListener('click', () => {
      this.toggleLighting();
    });

    this.lightingToggleElement.addEventListener('mouseenter', () => {
      this.lightingToggleElement.style.borderColor = 'rgba(255, 255, 255, 0.45)';
      this.lightingToggleElement.style.transform = 'translateY(-1px)';
    });

    this.lightingToggleElement.addEventListener('mouseleave', () => {
      this.lightingToggleElement.style.borderColor = 'rgba(255, 255, 255, 0.22)';
      this.lightingToggleElement.style.transform = 'translateY(0)';
    });

    document.body.appendChild(this.lightingToggleElement);
    this.updateLightingToggleUI();
  }

  public toggleLighting(): void {
    this.renderer.toggleLightingMode();
    this.updateLightingToggleUI();
  }

  public updateLightingToggleUI(): void {
    const mode = this.renderer.lightingMode;
    const track = document.getElementById('toggle-track');
    const thumb = document.getElementById('toggle-thumb');
    const label = document.getElementById('toggle-label');
    if (track && thumb && label) {
      if (mode === 'night') {
        track.style.background = '#2563eb';
        thumb.style.transform = 'translateX(34px)';
        thumb.style.background = '#e0f2fe';
        label.innerHTML = '🌙 Night';
      } else if (mode === 'golden') {
        track.style.background = '#ea580c';
        thumb.style.transform = 'translateX(17px)';
        thumb.style.background = '#fef08a';
        label.innerHTML = '🌅 Golden';
      } else {
        track.style.background = '#334155';
        thumb.style.transform = 'translateX(0px)';
        thumb.style.background = '#f8fafc';
        label.innerHTML = '☀️ Day';
      }
    }
  }

  private isHudVisible = true;
  private toggleHUD(): void {
    this.isHudVisible = !this.isHudVisible;
    if (this.hudElement) {
      this.hudElement.style.display = this.isHudVisible ? 'block' : 'none';
    }
    if (this.lightingToggleElement) {
      this.lightingToggleElement.style.display = this.isHudVisible ? 'flex' : 'none';
    }
  }

  private updateHUD(): void {
    const isFly = this.cameraDirector.isFlyCam;

    if (isFly) {
      const cam = this.cameraDirector.camera.position;
      this.hudElement.innerHTML = `
        <div style="font-weight:bold;font-size:14px;color:#f59e0b;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:4px;margin-bottom:6px;display:flex;justify-content:space-between;">
          <span>DEBUG FLY-CAM ACTIVE</span>
          <span style="color:#4ade80;">[C] DROP RIDER</span>
        </div>
        <div>Cam Pos: <strong>X: ${cam.x.toFixed(0)}, Y: ${cam.y.toFixed(0)}m, Z: ${cam.z.toFixed(0)}</strong></div>
        <div style="margin-top:6px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:4px;font-size:11px;color:#cbd5e1;">
          <strong>FLY-CAM CONTROLS:</strong><br />
          • <strong>WASD</strong>: Fly Forward / Strafe<br />
          • <strong>Space / Shift</strong>: Ascend / Descend<br />
          • <strong>Mouse Drag / Arrows</strong>: Look Around<br />
          • <strong>1-5</strong>: Teleport to Peaks / Lodge<br />
          • <strong>C</strong>: Exit Fly-Cam & Shred Here
        </div>
      `;
      this.trickBannerElement.style.display = 'none';
      return;
    }

    const pos = this.player.mesh.position;
    const speed = this.player.speedKmh.toFixed(1);
    const altitude = pos.y.toFixed(1);

    const isSnowboard = this.player.gmaPhysics.sport === 'Snowboard';
    const sportName = isSnowboard
      ? 'FREESTYLE SNOWBOARD (Twin-Tip Deck)'
      : `ALPINE SKIS (${this.player.gmaPhysics.hasTwintips ? 'Twin-Tip Freestyle' : 'Traditional Directional'})`;

    const isSwitch = this.player.gmaPhysics.isSwitchRiding();
    const switchBadge = isSwitch ? '<span style="color:#a855f7;font-weight:bold;margin-left:6px;">[SWITCH]</span>' : '';

    let stateBadge = '';
    if (this.player.movementState === 'Crashing') {
      stateBadge = '<span style="color:#ef4444;font-weight:bold;">☠ CRASH RAGDOLL (50Hz Verlet)</span>';
    } else if (!this.player.isGrounded) {
      stateBadge = `<span style="color:#f59e0b;font-weight:bold;">▲ AIRBORNE (${this.player.airTimer.toFixed(1)}s)</span>`;
    } else if (this.player.turnType === 'SlideTurn') {
      stateBadge = `<span style="color:#f97316;font-weight:bold;">≋ SLIDE TURN (+2m/s boost: ${(this.player.carveCharge * 100).toFixed(0)}%)</span>`;
    } else if (this.player.turnType === 'SharpTurn') {
      stateBadge = `<span style="color:#fbbf24;font-weight:bold;">✦ SHARP TURN (50° Cap)</span>`;
    } else if (this.player.turnType === 'OverTurn') {
      stateBadge = `<span style="color:#ec4899;font-weight:bold;">⚡ OVERTURN (10x Drag)</span>`;
    } else if (this.player.turnType === 'StandardTurn') {
      stateBadge = `<span style="color:#38bdf8;font-weight:bold;">● STANDARD CARVE (30° Cap)</span>`;
    } else if (this.player.gmaPhysics.isStaking) {
      stateBadge = `<span style="color:#10b981;font-weight:bold;">⚡ POLE STAKING (${this.player.gmaPhysics.isStakingDamped ? 'Damped Uphill 3m/s²' : 'Regular 15m/s²'})</span>`;
    } else {
      stateBadge = '<span style="color:#94a3b8;font-weight:bold;">● GLIDING</span>';
    }

    const trickEng = this.player.trickEngine;

    // Detect zone based on position
    let currentZone = 'Off-Piste Powder Bowl';
    if (pos.y > 450) currentZone = 'Main Summit (Glacier Chute)';
    else if (pos.x < -350 && pos.y > 220) currentZone = 'West Peak (Powder Highway)';
    else if (pos.x > 350 && pos.y > 200) currentZone = 'East Freestyle Slopestyle Park';
    else if (Math.hypot(pos.x, pos.z - 120) < 140) currentZone = 'Mid-Mountain Hub Plateau (190m)';
    else if (pos.z > 720) currentZone = 'Base Village Lodge Basin (20m)';

    const chargePct = (this.player.carveCharge * 100).toFixed(0);
    const chargeColor = this.player.carveCharge > 0.85 ? '#facc15' : '#38bdf8';
    const carveBar = `
      <div style="margin-top:4px;display:flex;align-items:center;gap:6px;font-size:11px;">
        <span style="color:#cbd5e1;font-weight:600;">GMA CARVE & DRIFT ${this.player.pumpChain > 0 ? `<span style="color:#38bdf8;">[Stage ${this.player.pumpChain} ${this.player.pumpFlow.toFixed(1)}x]</span>` : ''}:</span>
        <div style="flex:1;background:rgba(255,255,255,0.18);height:6px;border-radius:3px;overflow:hidden;">
          <div style="width:${chargePct}%;height:100%;background:${chargeColor};transition:width 0.05s ease;"></div>
        </div>
        <span style="font-weight:bold;color:${chargeColor};width:32px;text-align:right;">${chargePct}%</span>
      </div>
    `;

    this.hudElement.innerHTML = `
      <div style="font-weight:bold;font-size:14px;color:#38bdf8;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:4px;margin-bottom:6px;display:flex;justify-content:space-between;gap:12px;">
        <span>${currentZone} | <span style="color:#4ade80;">${sportName}</span>${switchBadge}</span>
        <span>${stateBadge}</span>
      </div>
      <div>Speed: <strong style="color:#fff;font-size:16px;">${speed}</strong> km/h (${(this.player.speedKmh / 3.6).toFixed(1)} m/s) | Alt: <strong>${altitude}m</strong></div>
      ${carveBar}
      <div>Score: <strong style="color:#4ade80;">${trickEng.totalScore} pts</strong> ${trickEng.currentMultiplier > 1 ? `<span style="color:#facc15;font-weight:bold;">[${trickEng.currentMultiplier}x Combo]</span>` : ''} | Cam: <strong style="color:#a78bfa;">${this.cameraDirector.mode === 'BEHIND' ? 'CHASE CAM (BEHIND)' : 'GMA ISOMETRIC TILT-SHIFT'}</strong> <span style="color:#94a3b8;">[V]</span> <strong style="color:#38bdf8;margin-left:6px;">[O] TUNER</strong></div>
      <div style="margin-top:6px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:4px;font-size:11px;color:#cbd5e1;">
        <strong>GRAND MOUNTAIN ADVENTURE CONTROLS:</strong><br />
        • <strong>A / D (Left / Right)</strong>: Carve &amp; Auto Pole-Plant on flats/turns<br />
        • <strong>Shift + A / D</strong>: <strong>Slide Turn (Drift)</strong> | <strong>Ctrl + A / D</strong>: <strong>Sharp Turn</strong><br />
        • <strong>Hold A + D (or S)</strong>: <strong>Snowplow Brake</strong> (or <strong>Hockey Drift Stop</strong> when cornering)<br />
        • <strong>Space / Gamepad A</strong>: <strong>Jump Pop</strong> | <strong>In Air</strong>: <strong>A / D</strong> Spins, <strong>W / S</strong> Flips<br />
        • <strong>V</strong>: Camera Mode | <strong>O</strong>: Camera Studio | <strong>C</strong>: Fly-Cam | <strong>1-6</strong>: Peaks
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
