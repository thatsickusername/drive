export interface TrickReport {
  name: string;
  points: number;
  multiplier: number;
  totalScore: number;
}

export class TrickEngine {
  public currentAirTime: number = 0;
  public totalScore: number = 0;
  public currentMultiplier: number = 1;
  public accumulatedYaw: number = 0;   // In degrees
  public accumulatedPitch: number = 0; // In degrees
  public isGrabbing: boolean = false;
  public grabTime: number = 0;
  public lastTrickName: string = '';
  public lastTrickPoints: number = 0;
  public displayTimer: number = 0;

  public startAir(): void {
    this.currentAirTime = 0;
    this.accumulatedYaw = 0;
    this.accumulatedPitch = 0;
    this.isGrabbing = false;
    this.grabTime = 0;
    this.currentMultiplier = 1;
  }

  public updateAir(dt: number, deltaYawDeg: number, deltaPitchDeg: number, grabbing: boolean): void {
    this.currentAirTime += dt;
    this.accumulatedYaw += deltaYawDeg;
    this.accumulatedPitch += deltaPitchDeg;

    if (grabbing) {
      this.isGrabbing = true;
      this.grabTime += dt;
      this.currentMultiplier = Math.min(4.0, 1.0 + Math.floor(this.grabTime * 2) * 0.5);
    }
  }

  public crash(): void {
    if (this.currentAirTime >= 0.25) {
      this.lastTrickName = 'CRASH / WIPEOUT';
      this.lastTrickPoints = 0;
      this.displayTimer = 2.5;
    }
    this.currentAirTime = 0;
    this.accumulatedYaw = 0;
    this.accumulatedPitch = 0;
    this.isGrabbing = false;
    this.grabTime = 0;
  }

  public land(landingState: boolean | 'STOMPED' | 'SKETCHY' | 'CRASH'): TrickReport | null {
    if (landingState === 'CRASH') {
      this.crash();
      return null;
    }

    if (this.currentAirTime < 0.25) {
      return null;
    }

    const absYaw = Math.abs(this.accumulatedYaw);
    const absPitch = Math.abs(this.accumulatedPitch);

    const spinCount = Math.floor((absYaw + 45) / 180);
    const spinDegrees = spinCount * 180;

    const flipCount = Math.floor((absPitch + 60) / 360);

    const trickParts: string[] = [];
    let basePoints = 0;

    if (this.isGrabbing) {
      trickParts.push('Method Grab');
      basePoints += 150 * Math.max(1, Math.floor(this.grabTime * 3));
    }

    if (flipCount > 0) {
      const flipName = this.accumulatedPitch > 0 ? 'Frontflip' : 'Backflip';
      trickParts.push(flipCount > 1 ? `Double ${flipName}` : flipName);
      basePoints += 500 * flipCount;
    }

    if (spinDegrees >= 180) {
      trickParts.push(`${spinDegrees}°`);
      basePoints += (spinDegrees / 180) * 200;
    }

    if (trickParts.length === 0 && this.currentAirTime > 0.8) {
      trickParts.push('Big Air');
      basePoints += 100;
    }

    if (trickParts.length === 0) {
      return null;
    }

    const isClean = landingState === true || landingState === 'STOMPED';
    if (!isClean) {
      basePoints = Math.floor(basePoints * 0.35);
      trickParts.push('(Sketchy)');
    } else if (trickParts.length > 0) {
      basePoints = Math.floor(basePoints * 1.15); // Stomped landing bonus
    }

    const name = trickParts.join(' + ');
    const points = Math.round(basePoints * this.currentMultiplier);
    this.totalScore += points;

    this.lastTrickName = name;
    this.lastTrickPoints = points;
    this.displayTimer = 3.0;

    return {
      name,
      points,
      multiplier: this.currentMultiplier,
      totalScore: this.totalScore
    };
  }

  public updateDisplayTimer(dt: number): void {
    if (this.displayTimer > 0) {
      this.displayTimer -= dt;
    }
  }
}
