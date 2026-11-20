export interface InputState {
  steerX: number; // -1.0 to +1.0
  steerY: number; // -1.0 to +1.0
  trickSpinX: number;
  trickFlipY: number;
  trickRoll: number;
  jump: boolean;
  sharpTurn: boolean;
  slideTurn: boolean;
  brake: boolean;
  slapTackle: boolean;
  stakePole: boolean;
  reverseTurnEnabled: boolean;
}

export interface ProcessedControls {
  steer: number;
  sharp: boolean;
  slide: boolean;
  jump: boolean;
  brake: boolean;
  stake: boolean;
  slapTackle: boolean;
}

export class ControlsProcessor {
  public reverseTurn: boolean = false;
  private lastStakeTapTime: number = 0.0;

  constructor() {}

  public processInputs(
    dt: number,
    rawInput: InputState,
    isRidingSwitch: boolean
  ): ProcessedControls {
    // 1. Steering with deadzone & quadratic response curve
    const rawSteer = Math.max(-1.0, Math.min(1.0, rawInput.steerX));
    const DEADZONE = 0.08;
    let outSteer = 0.0;

    if (Math.abs(rawSteer) >= DEADZONE) {
      const sign = rawSteer > 0 ? 1.0 : -1.0;
      const normalized = (Math.abs(rawSteer) - DEADZONE) / (1.0 - DEADZONE);
      // Quadratic response curve recovered from GMA controls
      outSteer = sign * (normalized * normalized);
    }

    // 2. Reverse turn handling (switch riding)
    if (isRidingSwitch && (this.reverseTurn || rawInput.reverseTurnEnabled)) {
      outSteer = -outSteer;
    }

    // 3. Modifiers & Triggers
    const outSharp = rawInput.sharpTurn;
    const outSlide = rawInput.slideTurn;
    const outJump = rawInput.jump;
    const outBrake = rawInput.brake;
    const outTackle = rawInput.slapTackle;

    // 4. Staking gesture (double-tap or explicit stake button)
    let outStake = rawInput.stakePole;
    this.lastStakeTapTime += dt;

    if (rawInput.stakePole) {
      if (this.lastStakeTapTime < 0.35) {
        outStake = true;
      }
      this.lastStakeTapTime = 0.0;
    }

    return {
      steer: outSteer,
      sharp: outSharp,
      slide: outSlide,
      jump: outJump,
      brake: outBrake,
      stake: outStake,
      slapTackle: outTackle
    };
  }
}
