import * as THREE from 'three';
import { Renderer } from './renderer';
import { PhysicsEngine } from './physics';
import { GameMap } from './map';
import { Car } from './car';
import { NetworkManager } from './network/network-manager';
import { RemoteCar } from './remote-car';
import { PlayerSlotInfo } from './network/protocol';
import { DynamicCameraDirector } from './camera';
import { UnifiedInputController } from './input';
import { TerrainManager } from './world/managers/TerrainManager';
import { DEFAULT_TERRAIN_CONFIG } from './world/config/terrainConfig';
import { createSeededNoise2D } from './world/math/prng';
import { getMainTrailCenterZ } from './world/math/splineCarver';

class Game {
  private renderer!: Renderer;
  private physics!: PhysicsEngine;
  public map: GameMap | null = null;
  public terrainManager: TerrainManager | null = null;
  public currentMapType: 'TRAINING' | 'PROCEDURAL' = 'TRAINING';
  public currentSeed: string = DEFAULT_TERRAIN_CONFIG.seed;
  public isLoadingMap: boolean = false;
  public car!: Car;

  // Camera & Input Systems
  private cameraDirector!: DynamicCameraDirector;
  private inputController!: UnifiedInputController;

  // Multiplayer Subsystems
  private network!: NetworkManager;
  private remoteCars = new Map<string, RemoteCar>();
  private slotToRemote = new Map<number, RemoteCar>();
  private selfSlot: PlayerSlotInfo | null = null;
  private roomCode: string = 'TRAIL-1';
  private netStatus: string = 'Connecting...';
  private pingMs: number = 0;
  private lastNetworkSendTime: number = 0;
  private networkHudElement!: HTMLElement;

  private lastTime: number = 0;
  private lastHudUpdateTime: number = 0;
  private hudElement!: HTMLElement;
  private mapPickerElement!: HTMLElement;
  private carLinvel = new THREE.Vector3();

  public async start(): Promise<void> {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element #game-canvas not found');
    }

    // 1. Initialize Renderer (with PBR ACES Tone Mapping)
    this.renderer = new Renderer(canvas);

    // 2. Initialize Rapier Physics Engine
    this.physics = new PhysicsEngine();
    await this.physics.init();

    // 3. Initialize Car first (before map so it is available for map placement)
    this.car = new Car(this.renderer.scene, this.physics.rapier, this.physics.world);

    // 4. Initialize Camera Director
    this.cameraDirector = new DynamicCameraDirector(this.renderer.camera);
    this.cameraDirector.initPosition(this.car.mesh.position, this.car.mesh.quaternion);

    // 5. Initialize Controller & Telemetry UI
    this.inputController = new UnifiedInputController();
    this.inputController.onResetRequested = () => this.resetVehicle();

    this.setupHUD();
    this.setupMapPickerUI();
    this.setupMultiplayer();

    // 6. Check URL query params for initial map & seed
    const urlParams = new URLSearchParams(window.location.search);
    const initialMap = urlParams.get('map')?.toUpperCase() === 'PROCEDURAL' ? 'PROCEDURAL' : 'TRAINING';
    const initialSeed = urlParams.get('seed') || DEFAULT_TERRAIN_CONFIG.seed;
    this.currentSeed = initialSeed;

    if (initialMap === 'PROCEDURAL') {
      await this.switchMap('PROCEDURAL', initialSeed);
    } else {
      this.map = new GameMap(this.renderer.scene, this.physics.rapier, this.physics.world);
      this.renderMapPickerUI();
    }

    // 7. Start Engine Loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  private resetVehicle(): void {
    if (this.currentMapType === 'PROCEDURAL' && this.terrainManager) {
      const noise = createSeededNoise2D(this.currentSeed);
      const trailZ = getMainTrailCenterZ(0, noise);
      const groundY = this.terrainManager.getTerrainHeightAt(0, trailZ);
      this.car.reset(0, groundY + 0.85, trailZ, 0);
      this.car.body.setLinvel(new this.physics.rapier.Vector3(0, 0, 0), true);
      this.car.body.setAngvel(new this.physics.rapier.Vector3(0, 0, 0), true);
      this.car.body.wakeUp();
      this.cameraDirector.initPosition(this.car.mesh.position, this.car.mesh.quaternion);
      if (this.network) {
        this.network.sendRespawn([0, groundY + 0.85, trailZ], 0);
      }
      return;
    }

    const sx = this.selfSlot ? this.selfSlot.spawnPos[0] : 0;
    const sy = this.selfSlot ? this.selfSlot.spawnPos[1] : 1.02;
    const sz = this.selfSlot ? this.selfSlot.spawnPos[2] : 0;
    const syaw = this.selfSlot ? this.selfSlot.spawnYaw : 0;
    this.car.reset(sx, sy, sz, syaw);
    this.cameraDirector.initPosition(this.car.mesh.position, this.car.mesh.quaternion);
    if (this.network) {
      this.network.sendRespawn([sx, sy, sz], syaw);
    }
  }

  private setupMapPickerUI(): void {
    this.mapPickerElement = document.createElement('div');
    this.mapPickerElement.style.position = 'fixed';
    this.mapPickerElement.style.bottom = '16px';
    this.mapPickerElement.style.left = '16px';
    this.mapPickerElement.style.backgroundColor = 'rgba(16, 20, 24, 0.88)';
    this.mapPickerElement.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    this.mapPickerElement.style.borderRadius = '6px';
    this.mapPickerElement.style.padding = '10px 14px';
    this.mapPickerElement.style.fontFamily = 'monospace';
    this.mapPickerElement.style.fontSize = '12px';
    this.mapPickerElement.style.color = '#e0e0e0';
    this.mapPickerElement.style.zIndex = '999';
    this.mapPickerElement.style.display = 'flex';
    this.mapPickerElement.style.flexDirection = 'column';
    this.mapPickerElement.style.gap = '8px';
    this.mapPickerElement.style.maxWidth = '380px';
    document.body.appendChild(this.mapPickerElement);

    this.renderMapPickerUI();
  }

  private renderMapPickerUI(): void {
    if (!this.mapPickerElement) return;

    const isProcedural = this.currentMapType === 'PROCEDURAL';

    this.mapPickerElement.innerHTML = `
      <div style="font-weight:bold;color:#4ade80;display:flex;justify-content:space-between;align-items:center;">
        <span>🗺️ WORLD MAP & SEED PICKER</span>
        <span style="font-size:10px;color:${this.isLoadingMap ? '#f59e0b' : '#10b981'};">${this.isLoadingMap ? 'GENERATING CHUNKS...' : 'ACTIVE'}</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <label style="font-size:11px;color:#aaa;">Map:</label>
        <select id="map-select" style="background:#222a35;color:#fff;border:1px solid #444;border-radius:4px;padding:3px 6px;font-family:monospace;font-size:11px;flex:1;">
          <option value="TRAINING" ${!isProcedural ? 'selected' : ''}>Proving Ground (Physics Test Map)</option>
          <option value="PROCEDURAL" ${isProcedural ? 'selected' : ''}>Procedural Wasteland (Rapier Heightfield)</option>
        </select>
      </div>
      <div id="seed-row" style="display:${isProcedural ? 'flex' : 'none'};gap:6px;align-items:center;">
        <label style="font-size:11px;color:#aaa;">Seed:</label>
        <input id="seed-input" type="text" value="${this.currentSeed}" style="background:#222a35;color:#4ade80;border:1px solid #444;border-radius:4px;padding:3px 6px;font-family:monospace;font-size:11px;flex:1;" />
        <button id="rand-seed-btn" title="Randomize Seed" style="background:#374151;color:#fff;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;font-family:monospace;font-size:11px;">🎲</button>
      </div>
      <div style="display:flex;gap:8px;">
        <button id="apply-map-btn" style="background:#2563eb;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-weight:bold;font-family:monospace;font-size:11px;flex:1;" ${this.isLoadingMap ? 'disabled' : ''}>
          ${this.isLoadingMap ? 'Loading...' : 'Apply / Switch Map'}
        </button>
      </div>
    `;

    const mapSelect = document.getElementById('map-select') as HTMLSelectElement;
    const seedRow = document.getElementById('seed-row');
    const seedInput = document.getElementById('seed-input') as HTMLInputElement;
    const randBtn = document.getElementById('rand-seed-btn');
    const applyBtn = document.getElementById('apply-map-btn');

    if (mapSelect && seedRow) {
      mapSelect.onchange = () => {
        seedRow.style.display = mapSelect.value === 'PROCEDURAL' ? 'flex' : 'none';
      };
    }

    if (randBtn && seedInput) {
      randBtn.onclick = () => {
        const words = ['OVER_THE_HILL', 'WASTELAND', 'CRAWL_CANYON', 'MUD_RUN', 'RIDGE_PASS', 'BOULDER_VALLEY', 'OUTPOST_42'];
        const randomSeed = `${words[Math.floor(Math.random() * words.length)]}_${Math.floor(Math.random() * 900 + 100)}`;
        seedInput.value = randomSeed;
      };
    }

    if (applyBtn && mapSelect) {
      applyBtn.onclick = () => {
        const targetMap = mapSelect.value as 'TRAINING' | 'PROCEDURAL';
        const targetSeed = seedInput ? seedInput.value.trim() : this.currentSeed;
        this.switchMap(targetMap, targetSeed);
      };
    }
  }

  public async switchMap(mapType: 'TRAINING' | 'PROCEDURAL', seed?: string): Promise<void> {
    if (this.isLoadingMap) return;
    this.isLoadingMap = true;
    this.currentMapType = mapType;
    if (seed) this.currentSeed = seed;
    this.renderMapPickerUI();

    // Spawn Safety Lock: Freeze vehicle RigidBody during chunk generation
    this.car.body.setBodyType(this.physics.rapier.RigidBodyType.KinematicPositionBased, true);
    this.car.body.setLinvel(new this.physics.rapier.Vector3(0, 0, 0), true);
    this.car.body.setAngvel(new this.physics.rapier.Vector3(0, 0, 0), true);

    if (mapType === 'TRAINING') {
      if (this.terrainManager) {
        this.terrainManager.dispose();
        this.terrainManager = null;
      }
      if (!this.map) {
        this.map = new GameMap(this.renderer.scene, this.physics.rapier, this.physics.world);
      }
      this.car.body.setBodyType(this.physics.rapier.RigidBodyType.Dynamic, true);
      this.car.reset(0, 1.02, 0, 0);
      this.cameraDirector.initPosition(this.car.mesh.position, this.car.mesh.quaternion);
    } else {
      if (this.map) {
        this.map.dispose(this.renderer.scene, this.physics.world);
        this.map = null;
      }
      if (this.terrainManager) {
        this.terrainManager.dispose();
        this.terrainManager = null;
      }

      this.terrainManager = new TerrainManager(
        this.renderer.scene,
        this.physics.rapier,
        this.physics.world,
        { seed: this.currentSeed }
      );

      const noise = createSeededNoise2D(this.currentSeed);
      const trailZ = getMainTrailCenterZ(0, noise);
      const spawnX = 0;
      const spawnZ = trailZ;

      const chunkSize = this.terrainManager.config.chunkSize;
      const spawnCx = Math.floor((spawnX + chunkSize * 0.5) / chunkSize);
      const spawnCz = Math.floor((spawnZ + chunkSize * 0.5) / chunkSize);

      // Queue initial chunks centered on player spawn position
      this.terrainManager.update(spawnX, spawnZ);

      // Await the exact chunk containing the vehicle spawn point
      await this.terrainManager.waitForChunk(spawnCx, spawnCz);

      // Also ensure chunk (0, 0) is ready
      if (spawnCx !== 0 || spawnCz !== 0) {
        await this.terrainManager.waitForChunk(0, 0);
      }

      // Step physics once to rebuild Rapier broadphase BVH acceleration structure
      this.physics.world.step();

      const groundY = this.terrainManager.getTerrainHeightAt(spawnX, spawnZ);
      this.car.reset(spawnX, groundY + 0.85, spawnZ, 0);
      this.car.body.setBodyType(this.physics.rapier.RigidBodyType.Dynamic, true);
      this.car.body.setLinvel(new this.physics.rapier.Vector3(0, 0, 0), true);
      this.car.body.setAngvel(new this.physics.rapier.Vector3(0, 0, 0), true);
      this.car.body.wakeUp();
      this.cameraDirector.initPosition(this.car.mesh.position, this.car.mesh.quaternion);
    }

    this.isLoadingMap = false;
    this.renderMapPickerUI();

    // Update URL query params without reloading
    const url = new URL(window.location.href);
    url.searchParams.set('map', mapType.toLowerCase());
    if (mapType === 'PROCEDURAL') {
      url.searchParams.set('seed', this.currentSeed);
    } else {
      url.searchParams.delete('seed');
    }
    window.history.replaceState(null, '', url.toString());
  }

  private setupMultiplayer(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room') || window.location.hash.replace('#', '').trim();
    if (roomParam) {
      this.roomCode = roomParam.toUpperCase().slice(0, 16);
    } else {
      this.roomCode = 'TRAIL-1';
      const newUrl = `${window.location.pathname}?room=${this.roomCode}`;
      window.history.replaceState(null, '', newUrl);
    }

    this.network = new NetworkManager(this.roomCode, {
      onInit: (self, peers, room) => {
        this.selfSlot = self;
        this.roomCode = room;
        this.car.setLiveryColor(self.colorHex);
        this.car.reset(self.spawnPos[0], self.spawnPos[1], self.spawnPos[2], self.spawnYaw);
        this.cameraDirector.initPosition(this.car.mesh.position, this.car.mesh.quaternion);

        for (const peer of peers) {
          if (!this.remoteCars.has(peer.id)) {
            const remote = new RemoteCar(this.renderer.scene, this.physics.rapier, this.physics.world, peer);
            this.remoteCars.set(peer.id, remote);
            this.slotToRemote.set(peer.slotIndex, remote);
          }
        }
        this.updateNetworkHUD();
      },
      onPeerJoined: (peer) => {
        if (!this.remoteCars.has(peer.id)) {
          const remote = new RemoteCar(this.renderer.scene, this.physics.rapier, this.physics.world, peer);
          this.remoteCars.set(peer.id, remote);
          this.slotToRemote.set(peer.slotIndex, remote);
        }
        this.updateNetworkHUD();
      },
      onPeerBinaryState: (slotIndex, state) => {
        const remote = this.slotToRemote.get(slotIndex);
        if (remote) {
          remote.interpolator.push(state);
        }
      },
      onPeerState: (peerId, state) => {
        const remote = this.remoteCars.get(peerId);
        if (remote) {
          remote.interpolator.push(state);
        }
      },
      onPeerRespawn: (peerId, pos, yaw) => {
        const remote = this.remoteCars.get(peerId);
        if (remote) {
          remote.onRespawn(pos, yaw);
        }
      },
      onPeerLeft: (peerId) => {
        const remote = this.remoteCars.get(peerId);
        if (remote) {
          this.slotToRemote.delete(remote.slotInfo.slotIndex);
          remote.destroy();
          this.remoteCars.delete(peerId);
        }
        this.updateNetworkHUD();
      },
      onStatusChange: (status, pingMs) => {
        this.netStatus = status;
        this.pingMs = pingMs;
        this.updateNetworkHUD();
      }
    });

    this.network.connect();
  }

  private setupHUD(): void {
    this.hudElement = document.createElement('div');
    this.hudElement.style.position = 'fixed';
    this.hudElement.style.top = '16px';
    this.hudElement.style.left = '16px';
    this.hudElement.style.color = '#e0e0e0';
    this.hudElement.style.fontFamily = 'monospace';
    this.hudElement.style.fontSize = '13px';
    this.hudElement.style.lineHeight = '1.5';
    this.hudElement.style.backgroundColor = 'rgba(16, 20, 24, 0.75)';
    this.hudElement.style.padding = '12px 16px';
    this.hudElement.style.borderRadius = '6px';
    this.hudElement.style.border = '1px solid rgba(255,255,255,0.15)';
    this.hudElement.style.userSelect = 'none';
    this.hudElement.style.pointerEvents = 'none';
    document.body.appendChild(this.hudElement);

    this.networkHudElement = document.createElement('div');
    this.networkHudElement.style.position = 'fixed';
    this.networkHudElement.style.top = '16px';
    this.networkHudElement.style.right = '16px';
    this.networkHudElement.style.color = '#e0e0e0';
    this.networkHudElement.style.fontFamily = 'monospace';
    this.networkHudElement.style.fontSize = '13px';
    this.networkHudElement.style.backgroundColor = 'rgba(16, 20, 24, 0.85)';
    this.networkHudElement.style.padding = '12px 16px';
    this.networkHudElement.style.borderRadius = '6px';
    this.networkHudElement.style.border = '1px solid rgba(255,255,255,0.2)';
    this.networkHudElement.style.userSelect = 'none';
    this.networkHudElement.style.zIndex = '999';
    document.body.appendChild(this.networkHudElement);
    this.updateNetworkHUD();
  }

  private updateNetworkHUD(): void {
    if (!this.networkHudElement) return;

    const isConnected = this.netStatus === 'connected';
    const statusDot = isConnected ? '🟢' : this.netStatus === 'connecting' ? '🟡' : '🔴';
    const selfLabel = this.selfSlot
      ? `<span style="color:#${this.selfSlot.colorHex.toString(16).padStart(6, '0')};font-weight:bold;">Driver ${this.selfSlot.slotIndex + 1} (${this.selfSlot.colorName})</span>`
      : 'Assigning Slot...';

    const peerCount = this.remoteCars.size;
    const peerList = [...this.remoteCars.values()]
      .map(
        (rc) =>
          `<div style="color:#${rc.slotInfo.colorHex.toString(16).padStart(6, '0')};">● Driver ${rc.slotInfo.slotIndex + 1} (${rc.slotInfo.colorName})</div>`
      )
      .join('');

    this.networkHudElement.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px;">
        <span style="font-weight:bold;color:#4ade80;">ROOM: ${this.roomCode}</span>
        <button id="copy-room-btn" style="background:#2563eb;color:#fff;border:none;border-radius:4px;padding:3px 8px;font-family:monospace;font-size:11px;cursor:pointer;">Copy Invite Link</button>
      </div>
      <div>Status: ${statusDot} ${this.netStatus.toUpperCase()} ${isConnected ? `(${this.pingMs}ms)` : ''}</div>
      <div>You: ${selfLabel}</div>
      <div style="margin-top:6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;">
        <div style="font-size:11px;color:#aaa;">CO-OP TEAMMATES (${peerCount}):</div>
        ${peerCount > 0 ? peerList : '<div style="color:#666;font-size:11px;">Waiting for teammate to join...</div>'}
      </div>
    `;

    const copyBtn = document.getElementById('copy-room-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const fullUrl = `${window.location.origin}${window.location.pathname}?room=${this.roomCode}`;
        navigator.clipboard.writeText(fullUrl).then(() => {
          copyBtn.innerText = 'Copied!';
          setTimeout(() => {
            copyBtn.innerText = 'Copy Invite Link';
          }, 2000);
        });
      };
    }
  }

  private loop(currentTime: number): void {
    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // 1. Poll Unified Input (Keyboard + Gamepad analog)
    const inputs = this.inputController.update();

    if (!this.isLoadingMap) {
      // 2. Fixed-step physics updates (60Hz)
      this.physics.step(delta, (dt: number) => {
        this.car.updateFixed(inputs, dt);
      });

      // 3. Sub-tick render state interpolation (stutter-free on 120Hz/144Hz/240Hz monitors)
      const alpha = this.physics.getInterpolationAlpha();
      this.car.syncRender(alpha);

      // Stream procedural chunks around vehicle position
      if (this.terrainManager) {
        this.terrainManager.update(this.car.mesh.position.x, this.car.mesh.position.z);
      }
    }

    // 4. Remote car kinematic step & interpolation
    for (const remoteCar of this.remoteCars.values()) {
      remoteCar.update(currentTime);
    }

    // 5. Cache rigid body velocity for camera tracking
    const lv = this.car.body.linvel();
    this.carLinvel.set(lv.x, lv.y, lv.z);

    // 6. High-Frequency Binary Transform Broadcast (60Hz active / 16ms, 12Hz idle / 80ms)
    if (this.network && this.selfSlot) {
      const isMoving =
        inputs.forward ||
        inputs.backward ||
        inputs.left ||
        inputs.right ||
        Math.hypot(lv.x, lv.z) > 0.04;
      const targetInterval = isMoving ? 16 : 80;

      if (currentTime - this.lastNetworkSendTime >= targetInterval) {
        this.lastNetworkSendTime = currentTime;
        this.network.sendState(this.selfSlot.slotIndex, this.car.getTransformState(currentTime));
      }
    }

    // 8. Close Off-Road Follow Camera Director (Tight tracking with gentle speed-lag)
    this.cameraDirector.update(delta, this.car.mesh.position, this.car.mesh.quaternion, this.carLinvel);

    // 9. Throttled Telemetry HUD Update (15Hz: eliminates DOM layout thrashing in 120Hz render loop)
    if (currentTime - this.lastHudUpdateTime >= 66) {
      this.lastHudUpdateTime = currentTime;
      const tele = this.car.getDrivetrainTelemetry();
      this.updateHUD(tele);
    }

    // 10. Render Three.js scene (PBR + Tone Mapping)
    this.renderer.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  private updateHUD(tele: ReturnType<Car['getDrivetrainTelemetry']>): void {
    if (!this.hudElement || !this.car) return;

    const rot = this.car.body.rotation();
    const euler = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w),
      'YXZ'
    );

    const pitchDeg = THREE.MathUtils.radToDeg(euler.x).toFixed(1);
    const rollDeg = THREE.MathUtils.radToDeg(euler.z).toFixed(1);

    const w = this.car.wheels;
    const suspFL = (w[0]?.compression * 100).toFixed(0);
    const suspFR = (w[1]?.compression * 100).toFixed(0);
    const suspRL = (w[2]?.compression * 100).toFixed(0);
    const suspRR = (w[3]?.compression * 100).toFixed(0);

    const slipFL = (w[0]?.slipRatio ?? 0).toFixed(2);
    const slipFR = (w[1]?.slipRatio ?? 0).toFixed(2);
    const slipRL = (w[2]?.slipRatio ?? 0).toFixed(2);
    const slipRR = (w[3]?.slipRatio ?? 0).toFixed(2);

    const tcaseLabel = tele.transferCaseMode === '4L'
      ? '<span style="color:#f39c12;font-weight:bold;">4L (DEFENDER/J70 CRAWL 49.5:1)</span>'
      : '<span style="color:#2ecc71;font-weight:bold;">4H (HIGH RANGE 14.8:1)</span>';

    let brakeBadge = '';
    if (tele.isHandbrake) {
      brakeBadge += ' <span style="background:#e74c3c;color:#fff;padding:1px 6px;border-radius:3px;font-weight:bold;font-size:11px;">[P] PARK</span>';
    }
    if (tele.isFootBraking) {
      brakeBadge += ' <span style="background:#e67e22;color:#fff;padding:1px 6px;border-radius:3px;font-weight:bold;font-size:11px;">FOOT BRAKE</span>';
    }

    let surfaceBadge = '<span style="color:#95a5a6;">ASPHALT</span>';
    if (tele.surfaceName === 'MUD') {
      surfaceBadge = '<span style="color:#e67e22;font-weight:bold;">MUD BOG (SLIP HAZARD)</span>';
    } else if (tele.surfaceName === 'ROCK') {
      surfaceBadge = '<span style="color:#9b59b6;font-weight:bold;">ROCK CRAWL (HIGH GRIP)</span>';
    } else if (tele.surfaceName === 'OBSTACLE') {
      surfaceBadge = '<span style="color:#3498db;font-weight:bold;">ARTICULATION COURSE</span>';
    }

    const rpmFraction = Math.min(1.0, Math.max(0, (tele.rpm - 850) / (5400 - 850)));
    const barSegments = 16;
    const filledSegments = Math.round(rpmFraction * barSegments);
    const rpmBar = '█'.repeat(filledSegments) + '░'.repeat(barSegments - filledSegments);
    const rpmColor = tele.rpm > 4800 ? '#e74c3c' : (tele.rpm > 3500 ? '#f1c40f' : '#2ecc71');

    let handlingBadge = '<span style="color:#2ecc71;">NEUTRAL</span>';
    if (tele.handlingState === 'OVERSTEER') {
      handlingBadge = '<span style="background:#e74c3c;color:#fff;padding:1px 6px;border-radius:3px;font-weight:bold;">OVERSTEER // DRIFT</span>';
    } else if (tele.handlingState === 'UNDERSTEER') {
      handlingBadge = '<span style="background:#f39c12;color:#fff;padding:1px 6px;border-radius:3px;font-weight:bold;">UNDERSTEER // PUSH</span>';
    }

    const gradePercent = Math.round(Math.tan((tele.inclineDeg * Math.PI) / 180) * 100);

    const mapBadge = this.currentMapType === 'PROCEDURAL'
      ? `<span style="color:#4ade80;font-weight:bold;">PROCEDURAL [${this.currentSeed}]</span>`
      : `<span style="color:#60a5fa;font-weight:bold;">PROVING GROUND (TESTING MAP)</span>`;

    this.hudElement.innerHTML = `
      <div style="font-weight:bold;margin-bottom:6px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:3px;display:flex;justify-content:space-between;">
        <span>OVER THE HILL // OFF-ROAD DYNAMICS</span>
        <span>${mapBadge}</span>
      </div>
      <div>Gear: <strong style="color:#3498db;font-size:14px;">[${tele.gearName}]</strong> | Transfer Case: ${tcaseLabel} [L] ${brakeBadge}</div>
      <div style="margin-top:2px;">
        RPM: <span style="color:${rpmColor};font-weight:bold;">${tele.rpm}</span>
        <span style="font-size:10px;color:${rpmColor};font-family:monospace;letter-spacing:1px;margin-left:6px;">[${rpmBar}]</span>
      </div>
      <div style="margin-top:2px;">Terrain: ${surfaceBadge} | Speed: <strong>${tele.speedKmh} km/h</strong></div>
      <div style="margin-top:2px;">Incline: <strong>${tele.inclineDeg > 0 ? '+' : ''}${tele.inclineDeg}&deg;</strong> (${gradePercent}% Grade) | State: <span style="color:#f39c12;font-weight:bold;">${tele.crawlState}</span></div>
      <div style="margin-top:2px;">Dynamics: ${handlingBadge} | Steer: <strong>${tele.steerAngleDeg}&deg;</strong> (F: ${tele.frontSlipAngleDeg}&deg; | R: ${tele.rearSlipAngleDeg}&deg;)</div>
      <div>Pitch: ${pitchDeg}&deg; | Roll: ${rollDeg}&deg;</div>
      <div style="margin-top:6px;font-weight:bold;color:#bbb;">Suspension Articulation:</div>
      <div>FL: ${suspFL}% | FR: ${suspFR}% || RL: ${suspRL}% | RR: ${suspRR}%</div>
      <div style="margin-top:4px;font-weight:bold;color:#bbb;">Wheel Slip Ratios (Combined Friction Ellipse):</div>
      <div>FL: ${slipFL} | FR: ${slipFR} || RL: ${slipRL} | RR: ${slipRR}</div>
      <div style="margin-top:6px;color:#aaa;font-size:11px;">[W/S | RT/LT] Throttle/Reverse | [Space/RB] Handbrake | [L/LB] 4H/4L | [Left Stick] Steer | [R/Back] Reset</div>
    `;
  }
}

function initGame(): void {
  const game = new Game();
  game.start().catch((err) => {
    console.error('Failed to start off-road engine:', err);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
