import * as THREE from 'three';
import { Renderer } from './renderer';
import { PhysicsEngine } from './physics';
import { GameMap } from './map';
import { Car, VehicleInputs } from './car';
import { NetworkManager } from './network/network-manager';
import { RemoteCar } from './remote-car';
import { PlayerSlotInfo } from './network/protocol';

class Game {
  private renderer!: Renderer;
  private physics!: PhysicsEngine;
  public map!: GameMap;
  public car!: Car;

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

  private inputs: VehicleInputs = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    lowRange: false
  };

  private lastTime: number = 0;
  private cameraPos = new THREE.Vector3();
  private hudElement!: HTMLElement;

  public async start(): Promise<void> {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element #game-canvas not found');
    }

    // 1. Initialize Renderer
    this.renderer = new Renderer(canvas);

    // 2. Initialize Rapier Physics
    this.physics = new PhysicsEngine();
    await this.physics.init();

    // 3. Initialize Map & Trimesh colliders
    this.map = new GameMap(this.renderer.scene, this.physics.rapier, this.physics.world);

    // 4. Initialize Car
    this.car = new Car(this.renderer.scene, this.physics.rapier, this.physics.world);

    // 5. Setup Telemetry UI, Multiplayer & Input Handlers
    this.setupHUD();
    this.setupMultiplayer();
    this.setupInputs();

    // 6. Start Loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  private setupMultiplayer(): void {
    // Read room code from URL: ?room=XYZ or #XYZ
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

        // Spawn any existing peers
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

    // Multiplayer Room Header (Top-Right)
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

  private setupInputs(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.inputs.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.inputs.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.inputs.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputs.right = true;
          break;
        case 'Space':
          this.inputs.brake = true;
          break;
        case 'KeyL': // Toggle 4WD Low / High range
          this.inputs.lowRange = !this.inputs.lowRange;
          break;
        case 'KeyR':
          this.inputs.brake = false;
          const sx = this.selfSlot ? this.selfSlot.spawnPos[0] : 0;
          const sy = this.selfSlot ? this.selfSlot.spawnPos[1] : 1.02;
          const sz = this.selfSlot ? this.selfSlot.spawnPos[2] : 0;
          const syaw = this.selfSlot ? this.selfSlot.spawnYaw : 0;
          this.car.reset(sx, sy, sz, syaw);
          if (this.network) {
            this.network.sendRespawn([sx, sy, sz], syaw);
          }
          break;
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.inputs.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.inputs.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.inputs.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputs.right = false;
          break;
        case 'Space':
          this.inputs.brake = false;
          break;
      }
    });
  }

  private loop(currentTime: number): void {
    const delta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Fixed-step physics updates
    this.physics.step(delta, (dt: number) => {
      this.car.updateFixed(this.inputs, dt);
    });

    // Sync visuals with physics
    this.car.syncRender();

    // Sync and interpolate remote player vehicles (Kinematic Rapier step + visual sync)
    for (const remoteCar of this.remoteCars.values()) {
      remoteCar.update(currentTime);
    }

    // High-Frequency Binary Transform Broadcast (60Hz active / 16ms, 12Hz idle / 80ms)
    if (this.network && this.selfSlot) {
      const linvel = this.car.body.linvel();
      const isMoving =
        this.inputs.forward ||
        this.inputs.backward ||
        this.inputs.left ||
        this.inputs.right ||
        Math.hypot(linvel.x, linvel.z) > 0.04;
      const targetInterval = isMoving ? 16 : 80;

      if (currentTime - this.lastNetworkSendTime >= targetInterval) {
        this.lastNetworkSendTime = currentTime;
        this.network.sendState(this.selfSlot.slotIndex, this.car.getTransformState(currentTime));
      }
    }

    // Camera follow update
    this.updateCamera(delta);

    // Update Inclinometer & Off-road Telemetry
    this.updateHUD();

    // Render Three.js scene
    this.renderer.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  private updateHUD(): void {
    if (!this.hudElement || !this.car) return;

    const rot = this.car.body.rotation();
    const euler = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w),
      'YXZ'
    );

    const pitchDeg = THREE.MathUtils.radToDeg(euler.x).toFixed(1);
    const rollDeg = THREE.MathUtils.radToDeg(euler.z).toFixed(1);

    const tele = this.car.getDrivetrainTelemetry();

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
      ? '<span style="color:#f39c12;font-weight:bold;">4L (DEFENDER/J70 CRAWL 45.8:1)</span>'
      : '<span style="color:#2ecc71;font-weight:bold;">4H (HIGH RANGE 14.8:1)</span>';

    // Status badges
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

    // Visual RPM meter
    const rpmFraction = Math.min(1.0, Math.max(0, (tele.rpm - 850) / (5400 - 850)));
    const barSegments = 16;
    const filledSegments = Math.round(rpmFraction * barSegments);
    const rpmBar = '█'.repeat(filledSegments) + '░'.repeat(barSegments - filledSegments);
    const rpmColor = tele.rpm > 4800 ? '#e74c3c' : (tele.rpm > 3500 ? '#f1c40f' : '#2ecc71');

    // Handling status badge
    let handlingBadge = '<span style="color:#2ecc71;">NEUTRAL</span>';
    if (tele.handlingState === 'OVERSTEER') {
      handlingBadge = '<span style="background:#e74c3c;color:#fff;padding:1px 6px;border-radius:3px;font-weight:bold;">OVERSTEER // DRIFT</span>';
    } else if (tele.handlingState === 'UNDERSTEER') {
      handlingBadge = '<span style="background:#f39c12;color:#fff;padding:1px 6px;border-radius:3px;font-weight:bold;">UNDERSTEER // PUSH</span>';
    }

    const gradePercent = Math.round(Math.tan((tele.inclineDeg * Math.PI) / 180) * 100);

    this.hudElement.innerHTML = `
      <div style="font-weight:bold;margin-bottom:6px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:3px;">
        OVER THE HILL // OFF-ROAD TRIAL DYNAMICS
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
      <div style="margin-top:6px;color:#888;font-size:11px;">[W/S] Throttle/Brake | [Space] Handbrake / Drift (Hold) | [L] 4H/4L | [R] Reset</div>
    `;
  }

  private updateCamera(delta: number): void {
    const carPos = this.car.mesh.position;
    const carRot = this.car.mesh.quaternion;

    // Follow camera positioned behind and elevated for trail clearance
    const offset = new THREE.Vector3(0, 3.8, -8.0).applyQuaternion(carRot);
    const desiredPos = carPos.clone().add(offset);

    const lerpFactor = Math.min(1.0, delta * 5.5);
    this.cameraPos.lerp(desiredPos, lerpFactor);
    this.renderer.camera.position.copy(this.cameraPos);

    // Look at chassis front hood / horizon
    const lookAhead = new THREE.Vector3(0, 0.6, 2.5).applyQuaternion(carRot);
    this.renderer.camera.lookAt(carPos.clone().add(lookAhead));
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
