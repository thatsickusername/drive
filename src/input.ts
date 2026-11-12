export interface VehicleInputs {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  handbrake?: boolean;
  lowRange?: boolean;
  steerAnalog?: number; // -1.0 (full left) to +1.0 (full right)
  throttleAnalog?: number; // 0.0 to 1.0
  brakeAnalog?: number; // 0.0 to 1.0
}

export class UnifiedInputController {
  public inputs: VehicleInputs = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    lowRange: false,
    steerAnalog: 0,
    throttleAnalog: 0,
    brakeAnalog: 0
  };

  public onResetRequested?: () => void;

  private keyState: { [code: string]: boolean } = {};
  private prevButtonL: boolean = false;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keyState[e.code] = true;

    if (e.code === 'KeyL') {
      this.inputs.lowRange = !this.inputs.lowRange;
    } else if (e.code === 'KeyR') {
      if (this.onResetRequested) this.onResetRequested();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keyState[e.code] = false;
  }

  public update(): VehicleInputs {
    // 1. Keyboard baseline: strictly isolate S/ArrowDown (reverse/service brake) from Space (handbrake/park)
    const kForward = !!(this.keyState['KeyW'] || this.keyState['ArrowUp']);
    const kBackward = !!(this.keyState['KeyS'] || this.keyState['ArrowDown']);
    const kLeft = !!(this.keyState['KeyA'] || this.keyState['ArrowLeft']);
    const kRight = !!(this.keyState['KeyD'] || this.keyState['ArrowRight']);
    const kHandbrake = !!this.keyState['Space'];

    let steer = 0;
    if (kLeft) steer -= 1.0;
    if (kRight) steer += 1.0;

    let throttle = kForward ? 1.0 : 0.0;
    let reverseOrServiceBrake = kBackward ? 1.0 : 0.0;
    let handbrake = kHandbrake;

    // 2. HTML5 Gamepad API Poll
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (!gp) continue;

      // Analog Left Stick X (-1.0 to 1.0)
      const stickX = gp.axes[0] ?? 0;
      if (Math.abs(stickX) > 0.08) {
        steer = Math.sign(stickX) * (0.35 * Math.abs(stickX) + 0.65 * Math.pow(Math.abs(stickX), 3));
      }

      // Triggers: RT (accelerate forward), LT (service brake / reverse)
      const rt = gp.buttons[7] ? gp.buttons[7].value : 0;
      const lt = gp.buttons[6] ? gp.buttons[6].value : 0;
      if (rt > 0.05) throttle = Math.max(throttle, rt);
      if (lt > 0.05) reverseOrServiceBrake = Math.max(reverseOrServiceBrake, lt);

      // Face buttons: Button A / Button X (index 0) is Handbrake / Park
      if (gp.buttons[0]?.pressed) handbrake = true;

      // Low Range toggle on Left Bumper (index 4)
      const btnL = !!gp.buttons[4]?.pressed;
      if (btnL && !this.prevButtonL) {
        this.inputs.lowRange = !this.inputs.lowRange;
      }
      this.prevButtonL = btnL;

      // Reset on Select / Back button (index 8)
      if (gp.buttons[8]?.pressed) {
        if (this.onResetRequested) this.onResetRequested();
      }

      break;
    }

    this.inputs.forward = throttle > 0.1;
    this.inputs.backward = reverseOrServiceBrake > 0.1 && !this.inputs.forward;
    this.inputs.left = steer < -0.1;
    this.inputs.right = steer > 0.1;
    this.inputs.brake = handbrake; // Only true when Space or Gamepad A is pressed!
    this.inputs.steerAnalog = steer;
    this.inputs.throttleAnalog = throttle;
    this.inputs.brakeAnalog = 0;

    return this.inputs;
  }
}
