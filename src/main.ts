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
    brake: false
  };

  private lastTime: number = 0;
  private cameraTarget = new THREE.Vector3();
  private cameraPos = new THREE.Vector3();

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

    // 5. Setup Input Handlers
    this.setupInputs();

    // 6. Start Loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
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
        case 'KeyR':
          this.car.reset(0, 2.0, 0);
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

    // Render Three.js scene
    this.renderer.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  private updateCamera(delta: number): void {
    const carPos = this.car.mesh.position;
    const carRot = this.car.mesh.quaternion;

    // Offset camera behind and above car
    const offset = new THREE.Vector3(0, 4.5, -9.5).applyQuaternion(carRot);
    const desiredPos = carPos.clone().add(offset);

    // Smoothly interpolate camera position
    const lerpFactor = Math.min(1.0, delta * 7.5);
    this.cameraPos.lerp(desiredPos, lerpFactor);
    this.renderer.camera.position.copy(this.cameraPos);

    // Camera look target slightly ahead of car
    const lookAheadOffset = new THREE.Vector3(0, 1.2, 5.0).applyQuaternion(carRot);
    const targetPoint = carPos.clone().add(lookAheadOffset);
    this.cameraTarget.lerp(targetPoint, lerpFactor);
    this.renderer.camera.lookAt(this.cameraTarget);

    // Keep directional light focused near the car for shadows
    this.renderer.dirLight.position.set(carPos.x + 45, carPos.y + 60, carPos.z - 30);
    this.renderer.dirLight.target.position.copy(carPos);
    this.renderer.dirLight.target.updateMatrixWorld();
  }
}

const game = new Game();
(window as unknown as { __GAME__: Game }).__GAME__ = game;
game.start().catch((err) => {
  console.error('Failed to initialize 3D driving game:', err);
});

