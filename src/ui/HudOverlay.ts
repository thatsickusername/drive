import { SkierController } from '../player/SkierController';
import { DynamicCameraDirector } from '../camera/CameraDirector';
import { TurnType } from '../mechanics/GmaConfig';

export class HudOverlay {
  private hudElement!: HTMLElement;
  private trickBannerElement!: HTMLElement;
  private isVisible: boolean = true;
  private player: SkierController;
  private cameraDirector: DynamicCameraDirector;

  // Cached DOM sub-elements
  private flyViewEl!: HTMLElement;
  private flyPosEl!: HTMLElement;
  private normalViewEl!: HTMLElement;
  private zoneSportEl!: HTMLElement;
  private stateBadgeEl!: HTMLElement;
  private speedValEl!: HTMLElement;
  private speedMpsEl!: HTMLElement;
  private altValEl!: HTMLElement;
  private carveLabelEl!: HTMLElement;
  private carveBarFillEl!: HTMLElement;
  private carvePctEl!: HTMLElement;
  private scoreValEl!: HTMLElement;
  private comboBadgeEl!: HTMLElement;
  private camModeEl!: HTMLElement;

  private trickTitleEl!: HTMLElement;
  private trickPtsEl!: HTMLElement;
  private trickAirEl!: HTMLElement;

  // Dirty check caches
  private lastIsFly: boolean | null = null;
  private lastFlyPosStr = '';
  private lastZoneSportHtml = '';
  private lastStateBadgeHtml = '';
  private lastSpeedStr = '';
  private lastMpsStr = '';
  private lastAltStr = '';
  private lastCarveLabelHtml = '';
  private lastChargeRound = -1;
  private lastChargeColor = '';
  private lastScoreStr = '';
  private lastComboHtml = '';
  private lastCamModeHtml = '';

  private lastTrickDisplay = false;
  private lastTrickOpacity = '';
  private lastTrickTitle = '';
  private lastTrickPtsHtml = '';
  private lastTrickAirHtml = '';
  private lastAirActive = false;

  private numericThrottle = 0;

  constructor(player: SkierController, cameraDirector: DynamicCameraDirector) {
    this.player = player;
    this.cameraDirector = cameraDirector;
    this.createUI();
  }

  private createUI(): void {
    const existingHud = document.getElementById('hud');
    if (existingHud) existingHud.remove();

    this.hudElement = document.createElement('div');
    this.hudElement.id = 'hud';
    this.hudElement.style.cssText = `
      position: absolute;
      top: 16px;
      left: 16px;
      color: #f1f5f9;
      font-family: 'Segoe UI', Roboto, monospace;
      font-size: 13px;
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 8px;
      padding: 12px 18px;
      pointer-events: none;
      line-height: 1.6;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
      z-index: 100;
      max-width: 380px;
    `;

    this.hudElement.innerHTML = `
      <div id="hud-fly-view" style="display:none;">
        <div style="font-weight:bold;font-size:14px;color:#f59e0b;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:4px;margin-bottom:6px;display:flex;justify-content:space-between;">
          <span>DEBUG FLY-CAM ACTIVE</span>
          <span style="color:#4ade80;">[C] DROP RIDER</span>
        </div>
        <div>Cam Pos: <strong id="hud-fly-pos">X: 0, Y: 0m, Z: 0</strong></div>
        <div style="margin-top:6px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:4px;font-size:11px;color:#cbd5e1;">
          <strong>FLY-CAM CONTROLS:</strong><br />
          • <strong>WASD</strong>: Fly Forward / Strafe<br />
          • <strong>Space / Shift</strong>: Ascend / Descend<br />
          • <strong>Mouse Drag / Arrows</strong>: Look Around<br />
          • <strong>1-6</strong>: Teleport to Peaks / Lodge<br />
          • <strong>C</strong>: Exit Fly-Cam & Shred Here
        </div>
      </div>
      <div id="hud-normal-view">
        <div style="font-weight:bold;font-size:14px;color:#38bdf8;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:4px;margin-bottom:6px;display:flex;justify-content:space-between;gap:12px;">
          <span id="hud-zone-sport"></span>
          <span id="hud-state-badge"></span>
        </div>
        <div>Speed: <strong id="hud-speed-val" style="color:#fff;font-size:16px;">0.0</strong> km/h (<span id="hud-speed-mps">0.0</span> m/s) | Alt: <strong id="hud-alt-val">0.0m</strong></div>
        <div style="margin-top:4px;display:flex;align-items:center;gap:6px;font-size:11px;">
          <span id="hud-carve-label" style="color:#cbd5e1;font-weight:600;">GMA CARVE & DRIFT:</span>
          <div style="flex:1;background:rgba(255,255,255,0.18);height:6px;border-radius:3px;overflow:hidden;position:relative;">
            <div id="hud-carve-bar-fill" style="width:100%;height:100%;background:#38bdf8;transform:scaleX(0);transform-origin:left;transition:transform 0.05s ease;"></div>
          </div>
          <span id="hud-carve-pct" style="font-weight:bold;color:#38bdf8;width:32px;text-align:right;">0%</span>
        </div>
        <div>Score: <strong id="hud-score-val" style="color:#4ade80;">0 pts</strong> <span id="hud-combo-badge"></span> | Cam: <strong id="hud-cam-mode" style="color:#a78bfa;"></strong> <span style="color:#94a3b8;">[V]</span> <strong style="color:#38bdf8;margin-left:6px;">[O] TUNER</strong></div>
        <div style="margin-top:6px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:4px;font-size:11px;color:#cbd5e1;">
          <strong>GRAND MOUNTAIN ADVENTURE CONTROLS:</strong><br />
          • <strong>A / D (Left / Right)</strong>: Carve &amp; Auto Pole-Plant on flats/turns<br />
          • <strong>Shift + A / D</strong>: <strong>Slide Turn (Drift)</strong> | <strong>Ctrl + A / D</strong>: <strong>Sharp Turn</strong><br />
          • <strong>Hold A + D (or S)</strong>: <strong>Snowplow Brake</strong> (or <strong>Hockey Drift Stop</strong> when cornering)<br />
          • <strong>Space / Gamepad A</strong>: <strong>Jump Pop</strong> (Hold Space for <strong>Glide Fall</strong>) | <strong>In Air</strong>: <strong>A / D</strong> Spins, <strong>W / S</strong> Flips<br />
          • <strong>V</strong>: Camera Mode | <strong>O</strong>: Camera Studio | <strong>C</strong>: Fly-Cam | <strong>1-6</strong>: Peaks
        </div>
      </div>
    `;
    document.body.appendChild(this.hudElement);

    this.flyViewEl = this.hudElement.querySelector('#hud-fly-view') as HTMLElement;
    this.flyPosEl = this.hudElement.querySelector('#hud-fly-pos') as HTMLElement;
    this.normalViewEl = this.hudElement.querySelector('#hud-normal-view') as HTMLElement;
    this.zoneSportEl = this.hudElement.querySelector('#hud-zone-sport') as HTMLElement;
    this.stateBadgeEl = this.hudElement.querySelector('#hud-state-badge') as HTMLElement;
    this.speedValEl = this.hudElement.querySelector('#hud-speed-val') as HTMLElement;
    this.speedMpsEl = this.hudElement.querySelector('#hud-speed-mps') as HTMLElement;
    this.altValEl = this.hudElement.querySelector('#hud-alt-val') as HTMLElement;
    this.carveLabelEl = this.hudElement.querySelector('#hud-carve-label') as HTMLElement;
    this.carveBarFillEl = this.hudElement.querySelector('#hud-carve-bar-fill') as HTMLElement;
    this.carvePctEl = this.hudElement.querySelector('#hud-carve-pct') as HTMLElement;
    this.scoreValEl = this.hudElement.querySelector('#hud-score-val') as HTMLElement;
    this.comboBadgeEl = this.hudElement.querySelector('#hud-combo-badge') as HTMLElement;
    this.camModeEl = this.hudElement.querySelector('#hud-cam-mode') as HTMLElement;

    const existingTrick = document.getElementById('trick-banner');
    if (existingTrick) existingTrick.remove();

    this.trickBannerElement = document.createElement('div');
    this.trickBannerElement.id = 'trick-banner';
    this.trickBannerElement.style.cssText = `
      position: absolute;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      pointer-events: none;
      z-index: 101;
      display: none;
    `;
    this.trickBannerElement.innerHTML = `
      <div id="hud-trick-title" style="font-size:24px;font-weight:900;color:#facc15;text-shadow:0 2px 10px rgba(0,0,0,0.8);letter-spacing:1px;text-transform:uppercase;"></div>
      <div id="hud-trick-pts" style="font-size:16px;font-weight:bold;color:#4ade80;text-shadow:0 1px 6px rgba(0,0,0,0.8);"></div>
      <div id="hud-trick-air" style="font-size:18px;font-weight:bold;color:#f59e0b;text-shadow:0 2px 8px rgba(0,0,0,0.8);display:none;"></div>
    `;
    document.body.appendChild(this.trickBannerElement);

    this.trickTitleEl = this.trickBannerElement.querySelector('#hud-trick-title') as HTMLElement;
    this.trickPtsEl = this.trickBannerElement.querySelector('#hud-trick-pts') as HTMLElement;
    this.trickAirEl = this.trickBannerElement.querySelector('#hud-trick-air') as HTMLElement;
  }

  public toggle(): boolean {
    this.isVisible = !this.isVisible;
    this.setVisible(this.isVisible);
    return this.isVisible;
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    if (this.hudElement) {
      this.hudElement.style.display = this.isVisible ? 'block' : 'none';
    }
    if (!this.isVisible && this.trickBannerElement) {
      this.trickBannerElement.style.display = 'none';
      this.lastTrickDisplay = false;
    }
  }

  public get visible(): boolean {
    return this.isVisible;
  }

  public update(): void {
    if (!this.isVisible) return;

    const isFly = this.cameraDirector.isFlyCam;

    if (isFly !== this.lastIsFly) {
      this.lastIsFly = isFly;
      this.flyViewEl.style.display = isFly ? 'block' : 'none';
      this.normalViewEl.style.display = isFly ? 'none' : 'block';
      if (isFly && this.lastTrickDisplay) {
        this.trickBannerElement.style.display = 'none';
        this.lastTrickDisplay = false;
      }
    }

    if (isFly) {
      const cam = this.cameraDirector.camera.position;
      const flyStr = `X: ${cam.x.toFixed(0)}, Y: ${cam.y.toFixed(0)}m, Z: ${cam.z.toFixed(0)}`;
      if (flyStr !== this.lastFlyPosStr) {
        this.lastFlyPosStr = flyStr;
        this.flyPosEl.textContent = flyStr;
      }
      return;
    }

    // Carve meter update (GPU composited transform: scaleX, 60fps smooth)
    const charge = this.player.carveCharge;
    const chargePctInt = Math.round(charge * 100);
    if (chargePctInt !== this.lastChargeRound) {
      this.lastChargeRound = chargePctInt;
      this.carveBarFillEl.style.transform = `scaleX(${charge.toFixed(3)})`;
      this.carvePctEl.textContent = `${chargePctInt}%`;

      const chargeColor = charge > 0.85 ? '#facc15' : '#38bdf8';
      if (chargeColor !== this.lastChargeColor) {
        this.lastChargeColor = chargeColor;
        this.carveBarFillEl.style.background = chargeColor;
        this.carvePctEl.style.color = chargeColor;
      }
    }

    // State badge update
    let stateBadge = '';
    if (this.player.gmaPhysics.state === 'Crashing') {
      stateBadge = '<span style="color:#ef4444;font-weight:bold;">💥 CRASH / WIPEOUT</span>';
    } else if (!this.player.isGrounded) {
      stateBadge = '<span style="color:#38bdf8;font-weight:bold;">✈ AIRBORNE</span>';
    } else if (this.player.isDrifting) {
      stateBadge = '<span style="color:#f59e0b;font-weight:bold;">💨 SLIDE DRIFT</span>';
    } else if (this.player.gmaPhysics.currentTurnType === TurnType.SharpTurn) {
      stateBadge = '<span style="color:#ec4899;font-weight:bold;">⚡ SHARP CARVE</span>';
    } else if (charge > 0.15) {
      stateBadge = '<span style="color:#60a5fa;font-weight:bold;">⚡ HARD CARVE</span>';
    } else if (this.player.gmaPhysics.isStaking) {
      stateBadge = `<span style="color:#10b981;font-weight:bold;">⚡ POLE STAKING (${this.player.gmaPhysics.isStakingDamped ? 'Damped Uphill 3m/s²' : 'Regular 15m/s²'})</span>`;
    } else {
      stateBadge = '<span style="color:#94a3b8;font-weight:bold;">● GLIDING</span>';
    }
    if (stateBadge !== this.lastStateBadgeHtml) {
      this.lastStateBadgeHtml = stateBadge;
      this.stateBadgeEl.innerHTML = stateBadge;
    }

    // Throttle non-essential numeric and text HUD updates to ~20 Hz
    this.numericThrottle++;
    if (this.numericThrottle >= 3) {
      this.numericThrottle = 0;

      const pos = this.player.root.position;
      const speedStr = this.player.speedKmh.toFixed(1);
      const mpsStr = (this.player.speedKmh / 3.6).toFixed(1);
      const altStr = `${pos.y.toFixed(1)}m`;

      if (speedStr !== this.lastSpeedStr) {
        this.lastSpeedStr = speedStr;
        this.speedValEl.textContent = speedStr;
      }
      if (mpsStr !== this.lastMpsStr) {
        this.lastMpsStr = mpsStr;
        this.speedMpsEl.textContent = mpsStr;
      }
      if (altStr !== this.lastAltStr) {
        this.lastAltStr = altStr;
        this.altValEl.textContent = altStr;
      }

      const isSnowboard = this.player.gmaPhysics.sport === 'Snowboard';
      const sportName = isSnowboard ? 'SNOWBOARD' : (this.player.gmaPhysics.hasTwintips ? 'TWINTIP SKIS' : 'ALPINE CARVING SKIS');
      const switchBadge = this.player.gmaPhysics.isSwitchRiding() ? ' <span style="color:#f59e0b;font-weight:bold;">[SWITCH]</span>' : '';

      let currentZone = 'Off-Piste Powder Bowl';
      if (pos.y > 450) currentZone = 'Main Summit (Glacier Chute)';
      else if (pos.x < -350 && pos.y > 220) currentZone = 'West Peak (Powder Highway)';
      else if (pos.x > 350 && pos.y > 200) currentZone = 'East Freestyle Slopestyle Park';
      else if (Math.hypot(pos.x, pos.z - 120) < 140) currentZone = 'Mid-Mountain Hub Plateau (190m)';
      else if (pos.z > 720) currentZone = 'Base Village Lodge Basin (20m)';

      const zoneSportHtml = `${currentZone} | <span style="color:#4ade80;">${sportName}</span>${switchBadge}`;
      if (zoneSportHtml !== this.lastZoneSportHtml) {
        this.lastZoneSportHtml = zoneSportHtml;
        this.zoneSportEl.innerHTML = zoneSportHtml;
      }

      const carveLabelHtml = `GMA CARVE & DRIFT ${this.player.pumpChain > 0 ? `<span style="color:#38bdf8;">[Stage ${this.player.pumpChain} ${this.player.pumpFlow.toFixed(1)}x]</span>` : ''}:`;
      if (carveLabelHtml !== this.lastCarveLabelHtml) {
        this.lastCarveLabelHtml = carveLabelHtml;
        this.carveLabelEl.innerHTML = carveLabelHtml;
      }

      const scoring = this.player.trickScoring;
      const scoreStr = `${scoring.totalGameScore} pts`;
      if (scoreStr !== this.lastScoreStr) {
        this.lastScoreStr = scoreStr;
        this.scoreValEl.textContent = scoreStr;
      }

      const comboHtml = scoring.comboMultiplier > 1 ? `<span style="color:#facc15;font-weight:bold;">[${scoring.comboMultiplier}x Combo]</span>` : '';
      if (comboHtml !== this.lastComboHtml) {
        this.lastComboHtml = comboHtml;
        this.comboBadgeEl.innerHTML = comboHtml;
      }

      const camModeHtml = this.cameraDirector.mode === 'BEHIND' ? 'CHASE CAM (BEHIND)' : 'GMA ISOMETRIC TILT-SHIFT';
      if (camModeHtml !== this.lastCamModeHtml) {
        this.lastCamModeHtml = camModeHtml;
        this.camModeEl.textContent = camModeHtml;
      }
    }

    // Update Trick Banner
    const scoring = this.player.trickScoring;
    if (scoring.displayTimer > 0 && scoring.lastFinalizedTrickName) {
      if (!this.lastTrickDisplay) {
        this.trickBannerElement.style.display = 'block';
        this.lastTrickDisplay = true;
      }
      if (this.lastAirActive) {
        this.trickAirEl.style.display = 'none';
        this.trickTitleEl.style.display = 'block';
        this.trickPtsEl.style.display = 'block';
        this.lastAirActive = false;
      }
      const opacity = Math.min(1.0, scoring.displayTimer).toFixed(2);
      if (opacity !== this.lastTrickOpacity) {
        this.lastTrickOpacity = opacity;
        this.trickBannerElement.style.opacity = opacity;
      }
      if (scoring.lastFinalizedTrickName !== this.lastTrickTitle) {
        this.lastTrickTitle = scoring.lastFinalizedTrickName;
        this.trickTitleEl.textContent = scoring.lastFinalizedTrickName;
      }
      const ptsHtml = scoring.lastFinalizedPoints > 0 ? `+${scoring.lastFinalizedPoints} PTS` : '';
      if (ptsHtml !== this.lastTrickPtsHtml) {
        this.lastTrickPtsHtml = ptsHtml;
        this.trickPtsEl.textContent = ptsHtml;
      }
    } else if (!this.player.isGrounded && this.player.airTimer > 0.3) {
      if (!this.lastTrickDisplay) {
        this.trickBannerElement.style.display = 'block';
        this.trickBannerElement.style.opacity = '1.0';
        this.lastTrickDisplay = true;
      }
      if (!this.lastAirActive) {
        this.trickTitleEl.style.display = 'none';
        this.trickPtsEl.style.display = 'none';
        this.trickAirEl.style.display = 'block';
        this.lastAirActive = true;
      }
      const mult = scoring.comboMultiplier.toFixed(1);
      const varMap: Record<string, string> = {
        grab: '<span style="color:#38bdf8;">[SAFETY GRAB]</span> ',
        shifty: '<span style="color:#a78bfa;">[SHIFTY]</span> ',
        daffy: '<span style="color:#34d399;">[DAFFY]</span> ',
        mutegrab: '<span style="color:#f43f5e;">[MUTE GRAB]</span> ',
        jump: '<span style="color:#facc15;">[SPREAD EAGLE]</span> '
      };
      const trickBadge = varMap[this.player.animator.activeJumpVariation] || (scoring.isGrabbing ? '<span style="color:#38bdf8;">[SAFETY GRAB]</span> ' : '');
      const airHtml = `${trickBadge}AIR: ${this.player.airTimer.toFixed(2)}s (${mult}x)`;
      if (airHtml !== this.lastTrickAirHtml) {
        this.lastTrickAirHtml = airHtml;
        this.trickAirEl.innerHTML = airHtml;
      }
    } else if (this.lastTrickDisplay) {
      this.trickBannerElement.style.display = 'none';
      this.lastTrickDisplay = false;
      this.lastAirActive = false;
    }
  }
}
