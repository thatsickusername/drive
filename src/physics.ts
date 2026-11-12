import RAPIER from '@dimforge/rapier3d-compat';

export class PhysicsEngine {
  public rapier: typeof RAPIER = RAPIER;
  public world!: RAPIER.World;
  public fixedTimeStep: number = 1 / 60;
  private accumulator: number = 0;

  public async init(): Promise<void> {
    await RAPIER.init();
    const gravity = new RAPIER.Vector3(0.0, -15.81, 0.0);
    this.world = new RAPIER.World(gravity);
  }

  public step(deltaSeconds: number, onFixedStep?: (dt: number) => void): void {

    const clampedDelta = Math.min(deltaSeconds, 0.1);
    this.accumulator += clampedDelta;

    while (this.accumulator >= this.fixedTimeStep) {
      if (onFixedStep) {
        onFixedStep(this.fixedTimeStep);
      }
      this.world.step();
      this.accumulator -= this.fixedTimeStep;
    }
  }

  public getInterpolationAlpha(): number {
    return Math.max(0, Math.min(1, this.accumulator / this.fixedTimeStep));
  }
}
