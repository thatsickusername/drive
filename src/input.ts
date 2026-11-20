import { BoarderInput } from './boarder';

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
  public onFlyCamToggleRequested?: () => void;
  public onToggleSportRequested?: () => void;
  public onToggleTwintipsRequested?: () => void;
  public onToggleReverseTurnRequested?: () => void;

  private keyState: { [code: string]: boolean } = {};
  private prevButtonLB: boolean = false;
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  private isPointerActive: boolean = false;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    window.addEventListener('mousedown', () => { this.isPointerActive = true; });
    window.addEventListener('mouseup', () => { this.isPointerActive = false; });
    window.addEventListener('mousemove', (e) => {
      if (this.isPointerActive || e.buttons > 0 || document.pointerLockElement) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      }
    });
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keyState[e.code] = true;

    if (e.code === 'KeyL') {
      this.inputs.lowRange = !this.inputs.lowRange;
    } else if (e.code === 'KeyR') {
      if (this.onResetRequested) this.onResetRequested();
    } else if (e.code === 'KeyC') {
      if (this.onFlyCamToggleRequested) this.onFlyCamToggleRequested();
    } else if (e.code === 'KeyG') {
      if (this.onToggleSportRequested) this.onToggleSportRequested();
    } else if (e.code === 'KeyT') {
      if (this.onToggleTwintipsRequested) this.onToggleTwintipsRequested();
    } else if (e.code === 'KeyZ') {
      if (this.onToggleReverseTurnRequested) this.onToggleReverseTurnRequested();
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

  public getBoarderInputs(): BoarderInput {
    const kS = !!(this.keyState['KeyS'] || this.keyState['ArrowDown']);
    const kA = !!(this.keyState['KeyA'] || this.keyState['ArrowLeft']);
    const kD = !!(this.keyState['KeyD'] || this.keyState['ArrowRight']);
    const kJump = !!this.keyState['Space'];
    const kGrab = !!(this.keyState['KeyJ']);
    const kSharp = !!(this.keyState['KeyQ'] || this.keyState['ShiftLeft'] || this.keyState['ShiftRight']);
    const kSlide = !!this.keyState['KeyE'];
    const kTackle = !!this.keyState['KeyF'];

    let forward = false; // Pure Grand Mountain Adventure: no forward driving throttle
    let brake = kS;
    let left = kA;
    let right = kD;
    let jump = kJump;
    let grab = kGrab;
    let sharpTurn = kSharp;
    let slideTurn = kSlide;
    let tackle = kTackle;
    let steerX: number | undefined = undefined;
    let trickSpinX: number | undefined = undefined;
    let trickFlipY: number | undefined = undefined;
    let trickRoll: number | undefined = undefined;

    if (left && !right) steerX = -1.0;
    else if (right && !left) steerX = 1.0;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (!gp || !gp.connected) continue;

      const stickX = gp.axes[0] ?? 0;
      if (Math.abs(stickX) > 0.05) {
        steerX = stickX;
      }
      if (stickX < -0.15) left = true;
      if (stickX > 0.15) right = true;

      const stickY = gp.axes[1] ?? 0;
      const triggerR = (gp.buttons[7]?.value ?? 0) > 0.2;
      const triggerL = (gp.buttons[6]?.value ?? 0) > 0.2;

      if (triggerR) slideTurn = true; // Right trigger for slide turn drift
      if (triggerL || (gp.buttons[1]?.pressed ?? false) || stickY > 0.3) brake = true; // Left trigger / down for snowplow brake
      if (gp.buttons[0]?.pressed) jump = true;
      if (gp.buttons[1]?.pressed) slideTurn = true; // B button: Slide turn
      if (gp.buttons[2]?.pressed) sharpTurn = true; // X button: Sharp turn
      if (gp.buttons[3]?.pressed) tackle = true;    // Y button: Shoulder tackle / Pole slap
      if (gp.buttons[4]?.pressed || gp.buttons[5]?.pressed) grab = true;

      const rStickX = gp.axes[2] ?? 0;
      const rStickY = gp.axes[3] ?? 0;
      if (Math.abs(rStickX) > 0.1) trickSpinX = rStickX;
      if (Math.abs(rStickY) > 0.1) trickFlipY = -rStickY;
      break;
    }

    return {
      forward,
      brake,
      left,
      right,
      jump,
      grab,
      sharpTurn,
      slideTurn,
      tackle,
      steerX,
      trickSpinX,
      trickFlipY,
      trickRoll
    };
  }

  public getCameraLookInputs(dt: number): { yawDelta: number; pitchDelta: number } {
    let yawDelta = 0;
    let pitchDelta = 0;

    // Mouse drag / pointer movement
    if (this.mouseDeltaX !== 0 || this.mouseDeltaY !== 0) {
      yawDelta -= this.mouseDeltaX * 0.0035;
      pitchDelta += this.mouseDeltaY * 0.0035;
      this.mouseDeltaX = 0;
      this.mouseDeltaY = 0;
    }

    // Controller Right Stick (axes[2] = yaw, axes[3] = pitch)
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (!gp || !gp.connected) continue;

      const rightX = gp.axes[2] ?? 0;
      const rightY = gp.axes[3] ?? 0;

      if (Math.abs(rightX) > 0.12) {
        yawDelta -= rightX * 2.8 * dt;
      }
      if (Math.abs(rightY) > 0.12) {
        pitchDelta += rightY * 2.2 * dt;
      }
      break;
    }

    return { yawDelta, pitchDelta };
  }

  public getFlyCamInputs(): {
    moveForward: number;
    moveRight: number;
    moveUp: number;
    yawDelta: number;
    pitchDelta: number;
  } {
    const kW = !!this.keyState['KeyW'];
    const kS = !!this.keyState['KeyS'];
    const kA = !!this.keyState['KeyA'];
    const kD = !!this.keyState['KeyD'];
    const kUp = !!this.keyState['Space'];
    const kDown = !!(this.keyState['ShiftLeft'] || this.keyState['ShiftRight']);

    const kArrLeft = !!this.keyState['ArrowLeft'];
    const kArrRight = !!this.keyState['ArrowRight'];
    const kArrUp = !!this.keyState['ArrowUp'];
    const kArrDown = !!this.keyState['ArrowDown'];

    let moveForward = 0;
    if (kW) moveForward += 1.0;
    if (kS) moveForward -= 1.0;

    let moveRight = 0;
    if (kD) moveRight += 1.0;
    if (kA) moveRight -= 1.0;

    let moveUp = 0;
    if (kUp) moveUp += 1.0;
    if (kDown) moveUp -= 1.0;

    let yawDelta = 0;
    if (kArrRight) yawDelta -= 1.0;
    if (kArrLeft) yawDelta += 1.0;

    let pitchDelta = 0;
    if (kArrDown) pitchDelta += 1.0;
    if (kArrUp) pitchDelta -= 1.0;

    // Mouse drag contribution
    yawDelta -= this.mouseDeltaX * 0.05;
    pitchDelta -= this.mouseDeltaY * 0.05;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    return {
      moveForward,
      moveRight,
      moveUp,
      yawDelta,
      pitchDelta
    };
  }
}
