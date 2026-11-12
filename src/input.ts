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
  private prevButtonLB: boolean = false;

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

    // 2. HTML5 Gamepad API Poll (Xbox / PlayStation / Generic Standard Gamepads)
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (!gp || !gp.connected) continue;

      // Smooth Steering with Left Stick X (axes[0])
      const stickX = gp.axes[0] ?? 0;
      if (Math.abs(stickX) > 0.05) {
        // Deadzone compensation + progressive cubic curve for fine trail control
        const sign = Math.sign(stickX);
        const normX = (Math.abs(stickX) - 0.05) / 0.95;
        steer = sign * (0.65 * normX + 0.35 * Math.pow(normX, 2.5));
      }

      // RT is W (accelerate forward): buttons[7] analog trigger
      const rtValue = gp.buttons[7] ? gp.buttons[7].value : 0;
      if (rtValue > 0.05) {
        throttle = Math.max(throttle, rtValue);
      }

      // LT is S (service brake forward, reverse backward): buttons[6] analog trigger
      const ltValue = gp.buttons[6] ? gp.buttons[6].value : 0;
      if (ltValue > 0.05) {
        reverseOrServiceBrake = Math.max(reverseOrServiceBrake, ltValue);
      }

      // RB is Handbrake: Right Bumper (buttons[5])
      if (gp.buttons[5]?.pressed) {
        handbrake = true;
      }

      // LB is High/Low Range shift toggle: Left Bumper (buttons[4])
      const btnLB = !!gp.buttons[4]?.pressed;
      if (btnLB && !this.prevButtonLB) {
        this.inputs.lowRange = !this.inputs.lowRange;
      }
      this.prevButtonLB = btnLB;

      // Reset vehicle on Select / Back / View button (buttons[8])
      if (gp.buttons[8]?.pressed) {
        if (this.onResetRequested) this.onResetRequested();
      }

      // Explicitly no camera control on Right Stick (axes[2], axes[3] ignored)
      break;
    }

    this.inputs.forward = throttle > 0.05;
    this.inputs.backward = reverseOrServiceBrake > 0.05 && !this.inputs.forward;
    this.inputs.left = steer < -0.05;
    this.inputs.right = steer > 0.05;
    this.inputs.brake = handbrake;
    this.inputs.steerAnalog = steer;
    this.inputs.throttleAnalog = throttle;
    this.inputs.brakeAnalog = reverseOrServiceBrake;

    return this.inputs;
  }
}
