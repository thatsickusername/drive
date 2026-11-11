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
    lowRange: false,
    diffLock: true
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
          this.inputs.brake = true;
          break;
        case 'KeyL': // Toggle 4WD Low / High range
          this.inputs.lowRange = !this.inputs.lowRange;
          break;
        case 'KeyR':
          this.car.reset(0, 3.5, 0);
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

    const linvel = this.car.body.linvel();
    const speedKmh = (Math.hypot(linvel.x, linvel.z) * 3.6).toFixed(1);

    const w = this.car.wheels;
    const suspFL = (w[0]?.compression * 100).toFixed(0);
    const suspFR = (w[1]?.compression * 100).toFixed(0);
    const suspRL = (w[2]?.compression * 100).toFixed(0);
    const suspRR = (w[3]?.compression * 100).toFixed(0);

    const gearMode = this.inputs.lowRange ? '<span style="color:#f39c12">4L (CRAWL)</span>' : '<span style="color:#2ecc71">4H (HIGH)</span>';

    this.hudElement.innerHTML = `
      <div style="font-weight:bold;margin-bottom:4px;color:#fff;">OFF-ROAD TRIAL DYNAMICS</div>
      <div>Transfer Case: ${gearMode} [Press L to toggle]</div>
      <div>Speed: ${speedKmh} km/h</div>
      <div>Pitch / Roll: ${pitchDeg}&deg; / ${rollDeg}&deg;</div>
      <div style="margin-top:6px;font-weight:bold;">Suspension Compression:</div>
      <div>FL: ${suspFL}% | FR: ${suspFR}%</div>
      <div>RL: ${suspRL}% | RR: ${suspRR}%</div>
      <div style="margin-top:4px;color:#888;font-size:11px;">[WASD] Drive | [Space] Brake | [R] Reset</div>
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
