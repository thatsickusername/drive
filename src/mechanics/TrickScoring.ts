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
  landing: LandingQuality;
  trickHistory: TrickRecord[];
}

export class TrickScoringSystem {
  // Recovered from trick_score.yaml
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
  private readonly pressRate = 8.0;      // pts / meter
  private readonly spinBase = 100;
  private readonly spinRate = 1.6;       // pts / degree
  private readonly flipBase = 200;
  private readonly flipRate = 2.0;       // pts / degree
  private readonly rollBase = 150;
  private readonly rollRate = 2.0;       // pts / degree
  private readonly rodeoBase = 150;
  private readonly rodeoRate = 2.0;

  public currentScore: number = 0;
  public totalGameScore: number = 0;
  public comboMultiplier: number = 1;
  public history: TrickRecord[] = [];
  public lastFinalizedTrickName: string = '';
  public lastFinalizedPoints: number = 0;
  public displayTimer: number = 0.0;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.currentScore = 0;
    this.comboMultiplier = 1;
    this.history = [];
  }

  public addSpin(degrees: number): void {
    if (degrees < 90.0) return;
    const pts = this.spinBase + Math.floor(degrees * this.spinRate);
    this.currentScore += pts;
    this.history.push({ name: `Spin ${Math.round(degrees)}°`, points: pts, rotationOrLength: degrees });
    this.comboMultiplier++;
  }

  public addFlip(degrees: number, isFront: boolean = false): void {
    if (degrees < 180.0) return;
    const pts = this.flipBase + Math.floor(degrees * this.flipRate);
    this.currentScore += pts;
    const flipName = isFront ? 'Frontflip' : 'Backflip';
    this.history.push({ name: `${flipName} ${Math.round(degrees)}°`, points: pts, rotationOrLength: degrees });
    this.comboMultiplier++;
  }

  public addRoll(degrees: number): void {
    if (degrees < 180.0) return;
    const pts = this.rollBase + Math.floor(degrees * this.rollRate);
    this.currentScore += pts;
    this.history.push({ name: `Roll ${Math.round(degrees)}°`, points: pts, rotationOrLength: degrees });
    this.comboMultiplier++;
  }

  public addRodeoMisty(degrees: number): void {
    if (degrees < 180.0) return;
    const pts = this.rodeoBase + Math.floor(degrees * this.rodeoRate);
    this.currentScore += pts;
    this.history.push({ name: `Rodeo/Misty ${Math.round(degrees)}°`, points: pts, rotationOrLength: degrees });
    this.comboMultiplier++;
  }

  public addRailGrind(distanceMeters: number): void {
    if (distanceMeters < 0.5) return;
    const pts = this.railBase + Math.floor(distanceMeters * this.railRate);
    this.currentScore += pts;
    this.history.push({ name: `Rail Grind ${distanceMeters.toFixed(1)}m`, points: pts, rotationOrLength: distanceMeters });
    this.comboMultiplier++;
  }

  public addTailNosePress(distanceMeters: number): void {
    if (distanceMeters < 0.5) return;
    const pts = this.pressBase + Math.floor(distanceMeters * this.pressRate);
    this.currentScore += pts;
    this.history.push({ name: `Tail/Nose Press ${distanceMeters.toFixed(1)}m`, points: pts, rotationOrLength: distanceMeters });
    this.comboMultiplier++;
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

  public finalizeScore(landing: LandingQuality): ScoreFinalization {
    let speedBoostMultiplier = 1.0;

    if (landing === LandingQuality.Crash) {
      const result: ScoreFinalization = {
        totalScore: 0,
        comboMultiplier: 1,
        speedBoostMultiplier: 1.0,
        landing: LandingQuality.Crash,
        trickHistory: [...this.history]
      };
      this.lastFinalizedTrickName = 'CRASH / WIPEOUT';
      this.lastFinalizedPoints = 0;
      this.displayTimer = 2.5;
      this.reset();
      return result;
    }

    let landingMultiplier = 1.0;
    if (landing === LandingQuality.Perfect) {
      landingMultiplier = 1.5;
    } else if (landing === LandingQuality.Good) {
      landingMultiplier = 1.2;
    } else if (landing === LandingQuality.Sketchy) {
      landingMultiplier = 0.7;
    }

    const totalScore = Math.floor(this.currentScore * landingMultiplier * this.comboMultiplier);

    // Speed boost milestones from player.yaml:
    // trick_points: 800 1600 3000 -> trick_boosts: 1.7 3.2 6.0
    if (totalScore >= 3000) {
      speedBoostMultiplier = 6.0;
    } else if (totalScore >= 1600) {
      speedBoostMultiplier = 3.2;
    } else if (totalScore >= 800) {
      speedBoostMultiplier = 1.7;
    }

    const historySnapshot = [...this.history];
    const trickSummary = historySnapshot.map(h => h.name).join(' + ') + (landing === LandingQuality.Perfect ? ' [PERFECT]' : landing === LandingQuality.Good ? ' [GOOD]' : ' [SKETCHY]');

    this.lastFinalizedTrickName = trickSummary.length > 0 ? trickSummary : (totalScore > 0 ? 'Big Air' : '');
    this.lastFinalizedPoints = totalScore;
    this.displayTimer = 3.0;
    this.totalGameScore += totalScore;

    const result: ScoreFinalization = {
      totalScore,
      comboMultiplier: this.comboMultiplier,
      speedBoostMultiplier,
      landing,
      trickHistory: historySnapshot
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
