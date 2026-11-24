export type CyclePhase = 'day' | 'sunset' | 'night' | 'sunrise';

export interface DayNightCycleConfig {
  dayDuration?: number;           // 4 min = 240s
  sunsetDuration?: number;        // 2 min = 120s
  sunsetDayToGolden?: number;     // 30s (Day -> Golden)
  sunsetGoldenToNight?: number;   // 1m 30s = 90s (Golden -> Night)
  nightDuration?: number;         // 4 min = 240s
  sunriseDuration?: number;       // 2 min = 120s
  sunriseNightToGolden?: number;  // 30s (Night -> Golden)
  sunriseGoldenToDay?: number;    // 1m 30s = 90s (Golden -> Day)
  initialTime?: number;
  timeScale?: number;
  autoPlay?: boolean;
}

export class DayNightCycle {
  public readonly dayDuration: number;
  public readonly sunsetDuration: number;
  public readonly sunsetDayToGolden: number;
  public readonly sunsetGoldenToNight: number;
  public readonly nightDuration: number;
  public readonly sunriseDuration: number;
  public readonly sunriseNightToGolden: number;
  public readonly sunriseGoldenToDay: number;
  public readonly totalDuration: number;

  public currentTime: number = 0.0;
  public timeScale: number = 1.0;
  public isPaused: boolean = false;

  private _currentPhase: CyclePhase = 'day';
  private _lightingFactor: number = 0.0;

  constructor(config: DayNightCycleConfig = {}) {
    this.dayDuration = config.dayDuration ?? 240.0;       // 4 minutes
    this.sunsetDuration = config.sunsetDuration ?? 120.0; // 2 minutes
    this.sunsetDayToGolden = config.sunsetDayToGolden ?? 30.0;    // 30s Day -> Golden
    this.sunsetGoldenToNight = config.sunsetGoldenToNight ?? 90.0; // 1m 30s Golden -> Night

    this.nightDuration = config.nightDuration ?? 240.0;   // 4 minutes
    this.sunriseDuration = config.sunriseDuration ?? 120.0; // 2 minutes
    this.sunriseNightToGolden = config.sunriseNightToGolden ?? 30.0;  // 30s Night -> Golden
    this.sunriseGoldenToDay = config.sunriseGoldenToDay ?? 90.0;     // 1m 30s Golden -> Day

    this.totalDuration = this.dayDuration + this.sunsetDuration + this.nightDuration + this.sunriseDuration; // 720s = 12 min

    this.currentTime = config.initialTime ?? 0.0;
    this.timeScale = config.timeScale ?? 1.0;
    this.isPaused = config.autoPlay === false;

    this.evaluate(this.currentTime);
  }

  public get currentPhase(): CyclePhase {
    return this._currentPhase;
  }

  public get lightingFactor(): number {
    return this._lightingFactor;
  }

  public get phaseRemainingSeconds(): number {
    const t = this.currentTime;
    const tDayEnd = this.dayDuration;
    const tSunsetEnd = tDayEnd + this.sunsetDuration;
    const tNightEnd = tSunsetEnd + this.nightDuration;

    if (t < tDayEnd) {
      return tDayEnd - t;
    } else if (t < tSunsetEnd) {
      return tSunsetEnd - t;
    } else if (t < tNightEnd) {
      return tNightEnd - t;
    } else {
      return this.totalDuration - t;
    }
  }

  public get phaseDuration(): number {
    switch (this._currentPhase) {
      case 'day': return this.dayDuration;
      case 'sunset': return this.sunsetDuration;
      case 'night': return this.nightDuration;
      case 'sunrise': return this.sunriseDuration;
    }
  }

  public get phaseFormattedTime(): string {
    const rem = Math.max(0, Math.ceil(this.phaseRemainingSeconds));
    const mins = Math.floor(rem / 60);
    const secs = rem % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  public setTime(seconds: number): void {
    this.currentTime = ((seconds % this.totalDuration) + this.totalDuration) % this.totalDuration;
    this.evaluate(this.currentTime);
  }

  public jumpToPhase(phase: CyclePhase, atPeak: boolean = true): void {
    const tDayEnd = this.dayDuration;
    const tSunsetEnd = tDayEnd + this.sunsetDuration;
    const tNightEnd = tSunsetEnd + this.nightDuration;

    switch (phase) {
      case 'day':
        this.setTime(0.0);
        break;
      case 'sunset':
        // atPeak: peak golden hour (after 30s Day -> Golden transition)
        this.setTime(atPeak ? tDayEnd + this.sunsetDayToGolden : tDayEnd);
        break;
      case 'night':
        this.setTime(tSunsetEnd);
        break;
      case 'sunrise':
        // atPeak: peak golden hour (after 30s Night -> Golden transition)
        this.setTime(atPeak ? tNightEnd + this.sunriseNightToGolden : tNightEnd);
        break;
    }
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public advanceToNextPhase(): CyclePhase {
    switch (this._currentPhase) {
      case 'day':
        this.jumpToPhase('sunset', true);
        break;
      case 'sunset':
        this.jumpToPhase('night', true);
        break;
      case 'night':
        this.jumpToPhase('sunrise', true);
        break;
      case 'sunrise':
        this.jumpToPhase('day', true);
        break;
    }
    return this._currentPhase;
  }

  public update(delta: number): number {
    if (!this.isPaused) {
      this.currentTime = (this.currentTime + delta * this.timeScale) % this.totalDuration;
      if (this.currentTime < 0) this.currentTime += this.totalDuration;
    }
    return this.evaluate(this.currentTime);
  }

  public evaluate(time: number): number {
    const t = ((time % this.totalDuration) + this.totalDuration) % this.totalDuration;
    this.currentTime = t;

    const tDayEnd = this.dayDuration;                                // 240
    const tSunsetEnd = tDayEnd + this.sunsetDuration;                // 300
    const tNightEnd = tSunsetEnd + this.nightDuration;              // 540

    if (t < tDayEnd) {
      // 1. Day Plateau (4 min)
      this._currentPhase = 'day';
      this._lightingFactor = 0.0;
    } else if (t < tSunsetEnd) {
      // 2. Sunset Transition (2 min total: 30s Day -> Golden, 1m 30s Golden -> Night)
      this._currentPhase = 'sunset';
      const dt = t - tDayEnd;
      if (dt < this.sunsetDayToGolden) {
        // Fast 30s progression from Day (0.0) to Golden (1.0)
        const u = dt / this.sunsetDayToGolden;
        const smoothU = u * u * (3.0 - 2.0 * u);
        this._lightingFactor = smoothU * 1.0;
      } else {
        // Longer 1m 30s progression from Golden (1.0) to Night (2.0)
        const u = (dt - this.sunsetDayToGolden) / this.sunsetGoldenToNight;
        const smoothU = u * u * (3.0 - 2.0 * u);
        this._lightingFactor = 1.0 + smoothU * 1.0;
      }
    } else if (t < tNightEnd) {
      // 3. Night Plateau (4 min)
      this._currentPhase = 'night';
      this._lightingFactor = 2.0;
    } else {
      // 4. Sunrise Transition (2 min total: 30s Night -> Golden, 1m 30s Golden -> Day)
      this._currentPhase = 'sunrise';
      const dt = t - tNightEnd;
      if (dt < this.sunriseNightToGolden) {
        // Fast 30s progression from Night (2.0) to Golden (1.0)
        const u = dt / this.sunriseNightToGolden;
        const smoothU = u * u * (3.0 - 2.0 * u);
        this._lightingFactor = 2.0 - smoothU * 1.0;
      } else {
        // Longer 1m 30s progression from Golden (1.0) to Day (0.0)
        const u = (dt - this.sunriseNightToGolden) / this.sunriseGoldenToDay;
        const smoothU = u * u * (3.0 - 2.0 * u);
        this._lightingFactor = 1.0 - smoothU * 1.0;
      }
    }

    return this._lightingFactor;
  }
}
