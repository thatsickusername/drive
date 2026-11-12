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
    // 1. Keyboard baseline
    const kForward = !!(this.keyState['KeyW'] || this.keyState['ArrowUp']);
    const kBackward = !!(this.keyState['KeyS'] || this.keyState['ArrowDown']);
    const kLeft = !!(this.keyState['KeyA'] || this.keyState['ArrowLeft']);
    const kRight = !!(this.keyState['KeyD'] || this.keyState['ArrowRight']);
    const kBrake = !!this.keyState['Space'];

    let steer = 0;
    if (kLeft) steer -= 1.0;
    if (kRight) steer += 1.0;

    let throttle = kForward ? 1.0 : 0.0;
    let brake = (kBackward || kBrake) ? 1.0 : 0.0;

    // 2. HTML5 Gamepad API Poll
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (!gp) continue;

      // Analog Left Stick X (-1.0 to 1.0)
      const stickX = gp.axes[0] ?? 0;
      if (Math.abs(stickX) > 0.08) {
        // Non-linear cubic response curve for precision rock crawling vs fast turns
        steer = Math.sign(stickX) * (0.35 * Math.abs(stickX) + 0.65 * Math.pow(Math.abs(stickX), 3));
      }

      // Triggers: RT (accelerate), LT (brake)
      const rt = gp.buttons[7] ? gp.buttons[7].value : 0;
      const lt = gp.buttons[6] ? gp.buttons[6].value : 0;
      if (rt > 0.05) throttle = Math.max(throttle, rt);
      if (lt > 0.05) brake = Math.max(brake, lt);

      // Face buttons: X / A for Handbrake, Y / Triangle for 4L toggle, B for Reset
      if (gp.buttons[0]?.pressed) brake = 1.0; // Button A

      // Low Range toggle on Button X / Left Bumper (index 4)
      const btnL = !!gp.buttons[4]?.pressed;
      if (btnL && !this.prevButtonL) {
        this.inputs.lowRange = !this.inputs.lowRange;
      }
      this.prevButtonL = btnL;

      // Reset on Select / Back button (index 8)
      if (gp.buttons[8]?.pressed) {
        if (this.onResetRequested) this.onResetRequested();
      }

      break; // Primary gamepad processed
    }

    this.inputs.forward = throttle > 0.1;
    this.inputs.backward = kBackward && !kForward;
    this.inputs.left = steer < -0.1;
    this.inputs.right = steer > 0.1;
    this.inputs.brake = kBrake || brake > 0.5;
    this.inputs.steerAnalog = steer;
    this.inputs.throttleAnalog = throttle;
    this.inputs.brakeAnalog = brake;

    return this.inputs;
  }
}
