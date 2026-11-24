export enum LandingQuality {
  Crash = 'Crash',
  Sketchy = 'Sketchy',
  Good = 'Good',
  Perfect = 'Perfect'
}

export interface TrickRecord {
  name: string;
  points: number;
  rotationOrLength: number;
}

export interface ScoreFinalization {
  totalScore: number;
  comboMultiplier: number;
  speedBoostMultiplier: number;
  forwardSpeedBoost: number;
  landing: LandingQuality;
  trickHistory: TrickRecord[];
}

export class TrickScoringSystem {
  // Recovered parameters from trick_score.yaml
  private readonly perfectMinFlyTime = 1.5;
  private readonly perfectMaxImpact = 0.5;
  private readonly perfectMaxLevel = 20.0;
  private readonly perfectMaxTheta = 20.0;

  private readonly goodMinFlyTime = 1.5;
  private readonly goodMaxImpact = 0.75;
  private readonly goodMaxLevel = 30.0;
  private readonly goodMaxTheta = 30.0;

  // Base and rates from trick_score.yaml
  private readonly railBase = 400;
  private readonly railRate = 16.0;      // pts / meter
  private readonly pressBase = 200;
  private readonly pressRate = 8.0;       // pts / meter

  public currentScore: number = 0;
  public totalGameScore: number = 0;
  public comboMultiplier: number = 1;
  public history: TrickRecord[] = [];
  public lastFinalizedTrickName: string = '';
  public lastFinalizedPoints: number = 0;
  public displayTimer: number = 0.0;

  // Continuous accumulation buffers (substep accumulation without history spam)
  public maxAirSpinDeg: number = 0;
  public maxAirFlipDeg: number = 0;
  public maxAirRollDeg: number = 0;
  public isFrontFlip: boolean = false;
  public isGrabbing: boolean = false;
  public grabName: string = '';

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.currentScore = 0;
    this.comboMultiplier = 1;
    this.history = [];
    this.maxAirSpinDeg = 0;
    this.maxAirFlipDeg = 0;
    this.maxAirRollDeg = 0;
    this.isFrontFlip = false;
    this.isGrabbing = false;
    this.grabName = '';
  }

  public setGrab(grabbing: boolean, name: string = 'METHOD'): void {
    this.isGrabbing = grabbing;
    if (grabbing) this.grabName = name;
  }

  public addSpin(degrees: number): void {
    if (degrees > this.maxAirSpinDeg) {
      this.maxAirSpinDeg = degrees;
    }
  }

  public addFlip(degrees: number, isFront: boolean = false): void {
    if (degrees > this.maxAirFlipDeg) {
      this.maxAirFlipDeg = degrees;
      if (degrees > 90.0) {
        this.isFrontFlip = isFront;
      }
    }
  }

  public addRoll(degrees: number): void {
    if (degrees > this.maxAirRollDeg) {
      this.maxAirRollDeg = degrees;
    }
  }

  public addRodeoMisty(degrees: number): void {
    if (degrees > this.maxAirRollDeg) {
      this.maxAirRollDeg = degrees;
    }
  }

  public addRailGrind(distanceMeters: number): void {
    if (distanceMeters < 0.5) return;
    const pts = this.railBase + Math.floor(distanceMeters * this.railRate);
    this.currentScore += pts;
    this.history.push({ name: `Rail Grind ${distanceMeters.toFixed(1)}m`, points: pts, rotationOrLength: distanceMeters });
  }

  public addTailNosePress(distanceMeters: number): void {
    if (distanceMeters < 0.5) return;
    const pts = this.pressBase + Math.floor(distanceMeters * this.pressRate);
    this.currentScore += pts;
    this.history.push({ name: `Tail/Nose Press ${distanceMeters.toFixed(1)}m`, points: pts, rotationOrLength: distanceMeters });
  }

  public evaluateLanding(
    flyTimeSeconds: number,
    impactForce01: number,
    tiltAngleDegrees: number,
    headingDeviationDegrees: number
  ): LandingQuality {
    // 1. Crash conditions
    if (tiltAngleDegrees > 60.0 || headingDeviationDegrees > 60.0 || impactForce01 > 0.95) {
      return LandingQuality.Crash;
    }

    // 2. Perfect landing
    if (
      flyTimeSeconds >= this.perfectMinFlyTime &&
      impactForce01 <= this.perfectMaxImpact &&
      tiltAngleDegrees <= this.perfectMaxLevel &&
      headingDeviationDegrees <= this.perfectMaxTheta
    ) {
      return LandingQuality.Perfect;
    }

    // 3. Good landing
    if (
      flyTimeSeconds >= this.goodMinFlyTime &&
      impactForce01 <= this.goodMaxImpact &&
      tiltAngleDegrees <= this.goodMaxLevel &&
      headingDeviationDegrees <= this.goodMaxTheta
    ) {
      return LandingQuality.Good;
    }

    return LandingQuality.Sketchy;
  }

  /**
   * Evaluates discrete trick name from cumulative aerial rotations.
   */
  private determineTrickName(): { title: string; baseScore: number; comboElements: number } {
    const spinCount = Math.floor((this.maxAirSpinDeg + 45.0) / 180.0);
    const spinDegrees = spinCount * 180;
    const flipCount = Math.floor((this.maxAirFlipDeg + 60.0) / 360.0);
    const rollCount = Math.floor((this.maxAirRollDeg + 60.0) / 360.0);

    let title = '';
    let baseScore = 0;
    let comboElements = 1;

    // Off-axis cork / rodeo / misty
    if (flipCount >= 1 && spinDegrees >= 180) {
      comboElements = 2;
      if (this.isFrontFlip) {
        title = spinDegrees >= 540 ? `MISTY ${spinDegrees}` : 'MISTY FLIP';
      } else {
        title = spinDegrees >= 720 ? `CORK ${spinDegrees}` : (spinDegrees >= 540 ? `RODEO ${spinDegrees}` : 'CORK 360');
      }
      baseScore = 650 + (spinDegrees / 180) * 150 + flipCount * 300;
    } else if (flipCount >= 1) {
      comboElements = 1;
      const flipWord = this.isFrontFlip ? 'FRONTFLIP' : 'BACKFLIP';
      title = flipCount > 1 ? `DOUBLE ${flipWord}` : flipWord;
      baseScore = 400 * flipCount;
    } else if (rollCount >= 1) {
      comboElements = 1;
      title = rollCount > 1 ? 'DOUBLE LINCOLN LOOP' : 'LINCOLN LOOP';
      baseScore = 380 * rollCount;
    } else if (spinDegrees >= 180) {
      comboElements = 1;
      title = `SPIN ${spinDegrees}`;
      baseScore = (spinDegrees / 180) * 220;
    } else if (this.maxAirSpinDeg >= 90.0) {
      title = 'SHIFTY 90';
      baseScore = 120;
    }

    if (this.isGrabbing) {
      const grabLabel = this.grabName ? this.grabName.toUpperCase() : 'METHOD';
      title = title ? `${grabLabel} ${title}` : `${grabLabel} AIR`;
      baseScore += 200;
      comboElements += 1;
    }

    if (!title && (this.currentScore > 0 || this.maxAirSpinDeg > 45)) {
      title = 'BIG AIR';
      baseScore = 100;
    }

    return { title, baseScore, comboElements };
  }

  public finalizeScore(landing: LandingQuality, entrySpeed: number = 0): ScoreFinalization {
    if (landing === LandingQuality.Crash) {
      const result: ScoreFinalization = {
        totalScore: 0,
        comboMultiplier: 1,
        speedBoostMultiplier: 1.0,
        forwardSpeedBoost: 0.0,
        landing: LandingQuality.Crash,
        trickHistory: []
      };
      this.lastFinalizedTrickName = 'CRASH / WIPEOUT';
      this.lastFinalizedPoints = 0;
      this.displayTimer = 2.5;
      this.reset();
      return result;
    }

    const { title, baseScore, comboElements } = this.determineTrickName();

    let landingMultiplier = 1.0;
    let forwardSpeedBoost = 0.0;

    if (landing === LandingQuality.Perfect) {
      landingMultiplier = 1.5;
      // Controlled boost: base boost + 12% entry momentum scaling for fluid speed retention
      forwardSpeedBoost = title ? Math.max(2.2, 1.2 + entrySpeed * 0.12) : 1.0;
    } else if (landing === LandingQuality.Good) {
      landingMultiplier = 1.2;
      forwardSpeedBoost = title ? Math.max(1.4, 0.8 + entrySpeed * 0.08) : 0.6;
    } else if (landing === LandingQuality.Sketchy) {
      landingMultiplier = 0.7;
      forwardSpeedBoost = title ? 0.5 : 0.0;
    }

    const totalScore = Math.floor((baseScore + this.currentScore) * landingMultiplier * comboElements);

    let landingBadge = '';
    if (landing === LandingQuality.Perfect) landingBadge = ' [PERFECT]';
    else if (landing === LandingQuality.Good) landingBadge = ' [GOOD]';
    else if (landing === LandingQuality.Sketchy) landingBadge = ' [SKETCHY]';

    this.lastFinalizedTrickName = title ? `${title}${landingBadge}` : (totalScore > 0 ? `BIG AIR${landingBadge}` : '');
    this.lastFinalizedPoints = totalScore;
    this.displayTimer = 3.0;
    this.totalGameScore += totalScore;
    this.comboMultiplier = comboElements;

    const result: ScoreFinalization = {
      totalScore,
      comboMultiplier: this.comboMultiplier,
      speedBoostMultiplier: 1.0,
      forwardSpeedBoost,
      landing,
      trickHistory: title ? [{ name: title, points: totalScore, rotationOrLength: this.maxAirSpinDeg }] : []
    };

    this.reset();
    return result;
  }

  public updateDisplay(dt: number): void {
    if (this.displayTimer > 0) {
      this.displayTimer -= dt;
    }
  }
}
