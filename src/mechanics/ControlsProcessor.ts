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

  // Staking double-tap state
  private lastStakeTapTime: number = 999.0;
  private wasStakePressed: boolean = false;

  // Dual tap timing for jump
  private lastLeftPressTime: number = 999.0;
  private lastRightPressTime: number = 999.0;
  private wasLeftPressed: boolean = false;
  private wasRightPressed: boolean = false;

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

    // 3. GMA Gesture Recognizer (Pure Left/Right emergent mechanics)
    const absSteer = Math.abs(outSteer);

    this.lastStakeTapTime += dt;
    this.lastLeftPressTime += dt;
    this.lastRightPressTime += dt;

    const isLeftPressed = rawSteer < -0.05;
    const isRightPressed = rawSteer > 0.05;
    const leftEdge = isLeftPressed && !this.wasLeftPressed;
    const rightEdge = isRightPressed && !this.wasRightPressed;

    if (leftEdge) this.lastLeftPressTime = 0.0;
    if (rightEdge) this.lastRightPressTime = 0.0;

    // A. Emergent Jump from Simultaneous Left + Right Tap (within 0.08s)
    let emergentJump = false;
    if ((leftEdge && this.lastRightPressTime < 0.08) || (rightEdge && this.lastLeftPressTime < 0.08)) {
      emergentJump = true;
    }

    // B. Actions & Modifiers matching GMA Controls.cpp
    const brakeWhileTurning = rawInput.brake && absSteer > 0.20;

    // C. Emergent Staking (Double-tap Left or Right on flats)
    let emergentStake = false;
    if (leftEdge || rightEdge || (rawInput.stakePole && !this.wasStakePressed)) {
      if (this.lastStakeTapTime < 0.35) { // gap_time ~ 0.3s
        emergentStake = true;
      }
      this.lastStakeTapTime = 0.0;
    }

    this.wasStakePressed = rawInput.stakePole;
    this.wasLeftPressed = isLeftPressed;
    this.wasRightPressed = isRightPressed;

    // 4. Consolidate Actions
    const outSharp = rawInput.sharpTurn;
    const outSlide = rawInput.slideTurn || brakeWhileTurning;
    const outBrake = rawInput.brake && !brakeWhileTurning;
    const outJump = rawInput.jump || emergentJump;
    // Explicit edge-triggered pole plant on turn initiation (A or D press) or double-tap
    const outStake = rawInput.stakePole || emergentStake || leftEdge || rightEdge;
    const outTackle = rawInput.slapTackle;

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
