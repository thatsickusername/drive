import RAPIER from '@dimforge/rapier3d-compat';

export class PhysicsEngine {
  public rapier: typeof RAPIER = RAPIER;
  public world!: RAPIER.World;
  public fixedTimeStep: number = 1 / 60;
  private accumulator: number = 0;
  private readonly maxSubSteps: number = 5;

  public async init(): Promise<void> {
    await RAPIER.init();
    const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
    this.world = new RAPIER.World(gravity);
  }

  public step(deltaSeconds: number, onFixedStep?: (dt: number) => void): void {
    const clampedDelta = Math.min(deltaSeconds, 0.1);
    this.accumulator += clampedDelta;

    let subSteps = 0;
    while (this.accumulator >= this.fixedTimeStep && subSteps < this.maxSubSteps) {
      if (onFixedStep) {
        onFixedStep(this.fixedTimeStep);
      }
      this.world.step();
      this.accumulator -= this.fixedTimeStep;
      subSteps++;
    }

    if (this.accumulator >= this.fixedTimeStep) {
      // Discard remaining backlog to prevent spiral of death after tab-switching or stall
      this.accumulator = 0;
    }
  }

  public resetAccumulator(): void {
    this.accumulator = 0;
  }

  public getInterpolationAlpha(): number {
    return Math.max(0, Math.min(1, this.accumulator / this.fixedTimeStep));
  }

  public dispose(): void {
    if (this.world) {
      this.world.free();
    }
  }
}
