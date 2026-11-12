import * as THREE from 'three';
import { Renderer } from './renderer';
import { PhysicsEngine } from './physics';
import { GameMap } from './map';
import { Car, VehicleInputs } from './car';

class Game {
  private renderer!: Renderer;
  private physics!: PhysicsEngine;
  public map!: GameMap;
  public car!: Car;

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

    // 5. Setup Telemetry UI & Input Handlers
    this.setupHUD();
    this.setupInputs();

    // 6. Start Loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
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
          if (!e.repeat) {
            this.inputs.brake = !this.inputs.brake;
          }
          break;
        case 'KeyL': // Toggle 4WD Low / High range
          this.inputs.lowRange = !this.inputs.lowRange;
          break;
        case 'KeyR':
          this.inputs.brake = false;
          this.car.reset(0, 1.02, 0);
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
      ? '<span style="color:#f39c12;font-weight:bold;">4L (LOW CRAWL 2.72:1)</span>'
      : '<span style="color:#2ecc71;font-weight:bold;">4H (HIGH RANGE 1.0:1)</span>';

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
      <div>Pitch: ${pitchDeg}&deg; | Roll: ${rollDeg}&deg;</div>
      <div style="margin-top:6px;font-weight:bold;color:#bbb;">Suspension Articulation:</div>
      <div>FL: ${suspFL}% | FR: ${suspFR}% || RL: ${suspRL}% | RR: ${suspRR}%</div>
      <div style="margin-top:4px;font-weight:bold;color:#bbb;">Wheel Slip Ratios (Combined Friction Ellipse):</div>
      <div>FL: ${slipFL} | FR: ${slipFR} || RL: ${slipRL} | RR: ${slipRR}</div>
      <div style="margin-top:6px;color:#888;font-size:11px;">[W/S] Throttle/Brake | [Space] Park Brake (Toggle) | [L] 4H/4L | [R] Reset</div>
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

const game = new Game();
game.start().catch((err) => {
  console.error('Failed to start off-road engine:', err);
});
