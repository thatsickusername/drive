import { BoarderInput } from './boarder';

export class UnifiedInputController {
  public onResetRequested?: () => void;
  public onFlyCamToggleRequested?: () => void;
  public onToggleSportRequested?: () => void;
  public onToggleTwintipsRequested?: () => void;
  public onToggleReverseTurnRequested?: () => void;

  private keyState: { [code: string]: boolean } = {};
  private prevStakeKey: boolean = false;
  private prevLeftKey: boolean = false;
  private prevRightKey: boolean = false;
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  private isPointerActive: boolean = false;
  private keyboardSteer: number = 0;
  private lastInputTime: number = performance.now();

  constructor() {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    window.addEventListener('mousedown', (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest('#camera-tuner-panel') || (e.target as HTMLElement)?.closest('#camera-tuner-toggle-btn')) {
        return;
      }
      this.isPointerActive = true;
    });
    window.addEventListener('mouseup', () => { this.isPointerActive = false; });
    window.addEventListener('mousemove', (e) => {
      if ((e.target as HTMLElement)?.closest('#camera-tuner-panel') || (e.target as HTMLElement)?.closest('#camera-tuner-toggle-btn')) {
        return;
      }
      if (this.isPointerActive || e.buttons > 0 || document.pointerLockElement) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      }
    });
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keyState[e.code] = true;

    if (e.code === 'KeyR') {
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

  public update(): void {
    // Called once per frame in main loop to sample frame inputs
  }

  public getBoarderInputs(): BoarderInput {
    const kW = !!(this.keyState['KeyW'] || this.keyState['ArrowUp']);
    const kS = !!(this.keyState['KeyS'] || this.keyState['ArrowDown']);
    const kA = !!(this.keyState['KeyA'] || this.keyState['ArrowLeft']);
    const kD = !!(this.keyState['KeyD'] || this.keyState['ArrowRight']);
    const kSpace = !!this.keyState['Space'];
    const kShift = !!(this.keyState['ShiftLeft'] || this.keyState['ShiftRight']);
    const kCtrl = !!(this.keyState['ControlLeft'] || this.keyState['ControlRight']);
    const kTackle = !!this.keyState['KeyF'];

    // Authentic GMA dual-control emergent behaviors (Left + Right):
    // 1. Both Left and Right held simultaneously -> Snowplow Brake!
    const bothPressed = kA && kD;
    let brake = kS || bothPressed;
    let left = kA && !bothPressed;
    let right = kD && !bothPressed;

    // Space is held continuously: takeoff pop is edge-triggered by GmaPlayerPhysics,
    // while holding Space in the air enables glide fall (reduced air drag & lift).
    let jump = kSpace;

    // Turn initiation edges (pressing A or D)
    const leftEdge = left && !this.prevLeftKey;
    const rightEdge = right && !this.prevRightKey;
    this.prevLeftKey = left;
    this.prevRightKey = right;

    // Forward pole push: triggered by W / Up or automatically on pressing A or D to turn
    let forward = (kW && !this.prevStakeKey) || leftEdge || rightEdge;
    this.prevStakeKey = kW;

    // Q and E eliminated:
    // Slide Turn (drift) is triggered by Shift + A or Shift + D
    // Sharp Turn is triggered by Ctrl + A or Ctrl + D
    let sharpTurn = kCtrl && (left || right);
    let slideTurn = kShift && (left || right);
    let tackle = kTackle;
    let grab = false;
    let steerX: number | undefined = undefined;
    let trickSpinX: number | undefined = undefined;
    let trickFlipY: number | undefined = undefined;
    let trickRoll: number | undefined = undefined;

    // Smooth keyboard digital-to-analog filter:
    // Regular A/D key presses target 0.55 deflection (gentle carve), holding Ctrl targets 1.0 (sharp carve).
    // Ramps at 5.0/s on press, releases at 8.0/s on release.
    const now = performance.now();
    const inputDt = Math.min((now - this.lastInputTime) / 1000.0, 0.1);
    this.lastInputTime = now;

    const targetKeySteer = (left && !right) ? (sharpTurn ? -1.0 : -0.55)
                         : (right && !left) ? (sharpTurn ? 1.0 : 0.55)
                         : 0.0;
    const rampRate = targetKeySteer !== 0 ? 5.0 : 8.0;

    if (this.keyboardSteer < targetKeySteer) {
      this.keyboardSteer = Math.min(targetKeySteer, this.keyboardSteer + rampRate * inputDt);
    } else if (this.keyboardSteer > targetKeySteer) {
      this.keyboardSteer = Math.max(targetKeySteer, this.keyboardSteer - rampRate * inputDt);
    }

    if (Math.abs(this.keyboardSteer) > 0.01) {
      steerX = this.keyboardSteer;
      trickSpinX = Math.sign(this.keyboardSteer);
    } else if (bothPressed) {
      steerX = 0.0;
      this.keyboardSteer = 0.0;
    }

    if (kW) {
      trickFlipY = 1.0; // Frontflip
    } else if (kS && !bothPressed) {
      trickFlipY = -1.0; // Backflip
    }

    // HTML5 Gamepad API Poll (Xbox / DualShock / Switch Pro)
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

      // GMA controller triggers & buttons:
      // RT = Sharp carve / drift trigger
      // LT = Snowplow brake
      if (triggerR) slideTurn = true;
      if (triggerL || (gp.buttons[1]?.pressed ?? false) || stickY > 0.35) brake = true;
      if (gp.buttons[0]?.pressed) jump = true;       // A button
      if (gp.buttons[1]?.pressed) slideTurn = true;  // B button
      if (gp.buttons[2]?.pressed) sharpTurn = true;  // X button
      if (gp.buttons[3]?.pressed) tackle = true;     // Y button
      if (gp.buttons[4]?.pressed || gp.buttons[5]?.pressed) grab = true; // LB / RB

      // Right Stick (Tricks in Air)
      const rStickX = gp.axes[2] ?? 0;
      const rStickY = gp.axes[3] ?? 0;
      if (Math.abs(rStickX) > 0.1) trickSpinX = rStickX;
      if (Math.abs(rStickY) > 0.1) trickFlipY = -rStickY;

      // Quick hotkeys on D-pad:
      // D-Pad Up: Toggle Sport (Skis <-> Snowboard)
      if (gp.buttons[12]?.pressed && this.onToggleSportRequested) {
        this.onToggleSportRequested();
      }
      // D-Pad Down: Reset/Respawn
      if (gp.buttons[13]?.pressed && this.onResetRequested) {
        this.onResetRequested();
      }
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

    // Controller Right Stick Look when grounded
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
