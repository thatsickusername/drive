import { DynamicCameraDirector } from './camera';
import { CameraSettings, defaultCameraSettings } from './config/gmaCameraConfig';

export class CameraTunerOverlay {
  private director: DynamicCameraDirector;
  private settings: CameraSettings;
  private panelElement!: HTMLElement;
  private toggleBtnElement!: HTMLElement;
  private isVisible: boolean = true;

  constructor(director: DynamicCameraDirector) {
    this.director = director;
    this.settings = director.getSettings();
    this.createUI();
    this.bindEvents();
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    this.panelElement.style.display = this.isVisible ? 'block' : 'none';
    this.toggleBtnElement.style.display = this.isVisible ? 'none' : 'block';
  }

  private createUI(): void {
    // 1. Minimized floating pill button (visible when collapsed)
    this.toggleBtnElement = document.createElement('button');
    this.toggleBtnElement.id = 'camera-tuner-toggle-btn';
    this.toggleBtnElement.innerHTML = '⚙ Camera Tuner <span style="opacity:0.6;font-size:11px;">[O]</span>';
    this.toggleBtnElement.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #38bdf8;
      font-family: 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 20px;
      cursor: pointer;
      z-index: 200;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      display: none;
      transition: all 0.15s ease;
    `;
    this.toggleBtnElement.addEventListener('mouseenter', () => {
      this.toggleBtnElement.style.background = 'rgba(30, 41, 59, 0.95)';
      this.toggleBtnElement.style.transform = 'scale(1.04)';
    });
    this.toggleBtnElement.addEventListener('mouseleave', () => {
      this.toggleBtnElement.style.background = 'rgba(15, 23, 42, 0.85)';
      this.toggleBtnElement.style.transform = 'scale(1.0)';
    });
    document.body.appendChild(this.toggleBtnElement);

    // 2. Full Tuning Studio Panel
    this.panelElement = document.createElement('div');
    this.panelElement.id = 'camera-tuner-panel';
    this.panelElement.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      width: 320px;
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 10px;
      padding: 14px 16px;
      color: #f1f5f9;
      font-family: 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      z-index: 200;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      user-select: none;
    `;

    this.panelElement.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:8px;margin-bottom:12px;">
        <div>
          <span style="font-weight:800;font-size:14px;color:#38bdf8;letter-spacing:0.5px;">CAMERA TUNING STUDIO</span>
          <span style="color:#94a3b8;font-size:11px;margin-left:6px;">[O]</span>
        </div>
        <button id="cam-close-btn" style="background:transparent;border:none;color:#94a3b8;font-size:16px;cursor:pointer;padding:2px 6px;border-radius:4px;">✕</button>
      </div>

      <!-- Mode Selector -->
      <div style="margin-bottom:12px;">
        <label style="font-weight:600;color:#cbd5e1;display:block;margin-bottom:6px;">PERSPECTIVE MODE:</label>
        <div style="display:flex;gap:6px;">
          <button id="mode-btn-behind" style="flex:1;padding:6px;border-radius:6px;border:1px solid #38bdf8;background:${this.settings.mode === 'BEHIND' ? '#0284c7' : 'rgba(255,255,255,0.06)'};color:#fff;font-weight:600;font-size:11px;cursor:pointer;">CHASE (BEHIND)</button>
          <button id="mode-btn-topdown" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:${this.settings.mode === 'TOPDOWN' ? '#0284c7' : 'rgba(255,255,255,0.06)'};color:#fff;font-weight:600;font-size:11px;cursor:pointer;">GMA ISOMETRIC</button>
        </div>
      </div>

      <!-- CHASE (BEHIND) SETTINGS -->
      <div id="section-behind" style="border:1px solid rgba(56,189,248,0.25);border-radius:8px;padding:10px;margin-bottom:12px;background:rgba(56,189,248,0.04);">
        <div style="font-weight:700;color:#38bdf8;margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Chase Camera Parameters</div>
        
        <div class="cam-row" style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span>Zoom / Distance:</span>
            <strong id="val-behindDistance" style="color:#38bdf8;">${this.settings.behindDistance.toFixed(1)}m</strong>
          </div>
          <input type="range" id="sl-behindDistance" min="10" max="60" step="0.5" value="${this.settings.behindDistance}" style="width:100%;">
        </div>

        <div class="cam-row" style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span>Resting Pitch Angle:</span>
            <strong id="val-behindPitch" style="color:#38bdf8;">${this.settings.behindPitch.toFixed(1)}°</strong>
          </div>
          <input type="range" id="sl-behindPitch" min="8" max="50" step="0.5" value="${this.settings.behindPitch}" style="width:100%;">
        </div>

        <div class="cam-row" style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span>Lower Pitch Limit (Min):</span>
            <strong id="val-behindMinPitch" style="color:#38bdf8;">${this.settings.behindMinPitch.toFixed(1)}°</strong>
          </div>
          <input type="range" id="sl-behindMinPitch" min="4" max="30" step="0.5" value="${this.settings.behindMinPitch}" style="width:100%;">
        </div>

        <div class="cam-row" style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span>Upper Pitch Limit (Max):</span>
            <strong id="val-behindMaxPitch" style="color:#38bdf8;">${this.settings.behindMaxPitch.toFixed(1)}°</strong>
          </div>
          <input type="range" id="sl-behindMaxPitch" min="25" max="75" step="0.5" value="${this.settings.behindMaxPitch}" style="width:100%;">
        </div>

        <div class="cam-row" style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span>Look-Ahead Distance:</span>
            <strong id="val-behindLookAheadDist" style="color:#38bdf8;">${this.settings.behindLookAheadDist.toFixed(1)}m</strong>
          </div>
          <input type="range" id="sl-behindLookAheadDist" min="0" max="25" step="0.5" value="${this.settings.behindLookAheadDist}" style="width:100%;">
        </div>

        <div class="cam-row" style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span>Look-Ahead Height:</span>
            <strong id="val-behindLookAheadHeight" style="color:#38bdf8;">${this.settings.behindLookAheadHeight.toFixed(1)}m</strong>
          </div>
          <input type="range" id="sl-behindLookAheadHeight" min="0.2" max="4.0" step="0.1" value="${this.settings.behindLookAheadHeight}" style="width:100%;">
        </div>

        <div class="cam-row">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span>Follow Smoothing Speed:</span>
            <strong id="val-behindFollowSpeed" style="color:#38bdf8;">${this.settings.behindFollowSpeed.toFixed(1)}</strong>
          </div>
          <input type="range" id="sl-behindFollowSpeed" min="1.0" max="12.0" step="0.5" value="${this.settings.behindFollowSpeed}" style="width:100%;">
        </div>
      </div>

      <!-- TOP-DOWN ISOMETRIC SETTINGS -->
      <div id="section-topdown" style="border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px;margin-bottom:12px;background:rgba(255,255,255,0.02);">
        <div style="font-weight:700;color:#94a3b8;margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">GMA Top-Down Parameters</div>

        <div class="cam-row" style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span>Top-Down Distance:</span>
            <strong id="val-topdownDistance" style="color:#a78bfa;">${this.settings.topdownDistance.toFixed(1)}m</strong>
          </div>
          <input type="range" id="sl-topdownDistance" min="15" max="75" step="1" value="${this.settings.topdownDistance}" style="width:100%;">
        </div>

        <div class="cam-row">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span>Top-Down Pitch Angle:</span>
            <strong id="val-topdownPitch" style="color:#a78bfa;">${this.settings.topdownPitch.toFixed(1)}°</strong>
          </div>
          <input type="range" id="sl-topdownPitch" min="30" max="75" step="1" value="${this.settings.topdownPitch}" style="width:100%;">
        </div>
      </div>

      <!-- GLOBAL OPTICS -->
      <div style="border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px;margin-bottom:12px;background:rgba(255,255,255,0.02);">
        <div style="font-weight:700;color:#94a3b8;margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Optics & Controls</div>

        <div class="cam-row" style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span>Camera FOV:</span>
            <strong id="val-fov" style="color:#4ade80;">${this.settings.fov.toFixed(0)}°</strong>
          </div>
          <input type="range" id="sl-fov" min="40" max="90" step="1" value="${this.settings.fov}" style="width:100%;">
        </div>

        <div class="cam-row">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span>Stick / Mouse Sens:</span>
            <strong id="val-mouseSensitivity" style="color:#4ade80;">${this.settings.mouseSensitivity.toFixed(2)}x</strong>
          </div>
          <input type="range" id="sl-mouseSensitivity" min="0.2" max="2.5" step="0.05" value="${this.settings.mouseSensitivity}" style="width:100%;">
        </div>
      </div>

      <!-- ACTIONS -->
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button id="cam-copy-btn" style="background:#0284c7;color:#fff;border:none;padding:10px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 2px 8px rgba(2,132,199,0.4);transition:all 0.15s ease;">
          📋 COPY SETTINGS TO CLIPBOARD
        </button>
        <button id="cam-reset-btn" style="background:rgba(255,255,255,0.08);color:#cbd5e1;border:1px solid rgba(255,255,255,0.15);padding:7px;border-radius:6px;font-weight:600;font-size:11px;cursor:pointer;">
          ↺ Reset to Defaults
        </button>
      </div>
    `;

    document.body.appendChild(this.panelElement);
  }

  private bindEvents(): void {
    // Prevent mouse events inside tuner from driving game camera
    const isolateEvents = ['mousedown', 'mouseup', 'mousemove', 'pointerdown', 'pointerup', 'click', 'dblclick'];
    isolateEvents.forEach((evt) => {
      this.panelElement.addEventListener(evt, (e) => e.stopPropagation());
      this.toggleBtnElement.addEventListener(evt, (e) => e.stopPropagation());
    });

    // Close button
    const closeBtn = document.getElementById('cam-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.toggle());

    // Toggle button
    this.toggleBtnElement.addEventListener('click', () => this.toggle());

    // Mode buttons
    const btnBehind = document.getElementById('mode-btn-behind') as HTMLButtonElement;
    const btnTopdown = document.getElementById('mode-btn-topdown') as HTMLButtonElement;

    const updateModeStyles = () => {
      if (this.settings.mode === 'BEHIND') {
        btnBehind.style.background = '#0284c7';
        btnBehind.style.borderColor = '#38bdf8';
        btnTopdown.style.background = 'rgba(255,255,255,0.06)';
        btnTopdown.style.borderColor = 'rgba(255,255,255,0.2)';
      } else {
        btnTopdown.style.background = '#0284c7';
        btnTopdown.style.borderColor = '#38bdf8';
        btnBehind.style.background = 'rgba(255,255,255,0.06)';
        btnBehind.style.borderColor = 'rgba(255,255,255,0.2)';
      }
    };

    if (btnBehind) {
      btnBehind.addEventListener('click', () => {
        this.settings.mode = 'BEHIND';
        this.director.setMode('BEHIND');
        updateModeStyles();
      });
    }

    if (btnTopdown) {
      btnTopdown.addEventListener('click', () => {
        this.settings.mode = 'TOPDOWN';
        this.director.setMode('TOPDOWN');
        updateModeStyles();
      });
    }

    // Sliders binding
    this.bindSlider('behindDistance', (val) => `${val.toFixed(1)}m`);
    this.bindSlider('behindPitch', (val) => `${val.toFixed(1)}°`);
    this.bindSlider('behindMinPitch', (val) => `${val.toFixed(1)}°`);
    this.bindSlider('behindMaxPitch', (val) => `${val.toFixed(1)}°`);
    this.bindSlider('behindLookAheadDist', (val) => `${val.toFixed(1)}m`);
    this.bindSlider('behindLookAheadHeight', (val) => `${val.toFixed(1)}m`);
    this.bindSlider('behindFollowSpeed', (val) => `${val.toFixed(1)}`);
    this.bindSlider('topdownDistance', (val) => `${val.toFixed(1)}m`);
    this.bindSlider('topdownPitch', (val) => `${val.toFixed(1)}°`);
    this.bindSlider('fov', (val) => `${val.toFixed(0)}°`);
    this.bindSlider('mouseSensitivity', (val) => `${val.toFixed(2)}x`);

    // Copy button
    const copyBtn = document.getElementById('cam-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const snippet = this.generateCodeSnippet();
        navigator.clipboard.writeText(snippet).then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = '✓ COPIED TO CLIPBOARD!';
          copyBtn.style.background = '#10b981';
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '#0284c7';
          }, 2000);
        }).catch((err) => {
          console.error('Failed to copy to clipboard:', err);
        });
      });
    }

    // Reset button
    const resetBtn = document.getElementById('cam-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.assign(this.settings, defaultCameraSettings);
        this.director.applySettings(this.settings);
        this.refreshUI();
        updateModeStyles();
      });
    }
  }

  private bindSlider(key: keyof CameraSettings, formatFn: (val: number) => string): void {
    const slider = document.getElementById(`sl-${key}`) as HTMLInputElement;
    const label = document.getElementById(`val-${key}`);
    if (!slider || !label) return;

    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      (this.settings as any)[key] = val;
      label.textContent = formatFn(val);
      this.director.applySettings(this.settings);
    });
  }

  private refreshUI(): void {
    const keys: (keyof CameraSettings)[] = [
      'behindDistance',
      'behindPitch',
      'behindMinPitch',
      'behindMaxPitch',
      'behindLookAheadDist',
      'behindLookAheadHeight',
      'behindFollowSpeed',
      'topdownDistance',
      'topdownPitch',
      'fov',
      'mouseSensitivity',
    ];

    keys.forEach((key) => {
      const slider = document.getElementById(`sl-${key}`) as HTMLInputElement;
      const label = document.getElementById(`val-${key}`);
      const val = this.settings[key] as number;
      if (slider && label) {
        slider.value = `${val}`;
        if (key.includes('Pitch') || key === 'fov') {
          label.textContent = `${val.toFixed(1)}°`;
        } else if (key.includes('Dist') || key.includes('Height') || key.includes('Distance')) {
          label.textContent = `${val.toFixed(1)}m`;
        } else if (key.includes('Sensitivity')) {
          label.textContent = `${val.toFixed(2)}x`;
        } else {
          label.textContent = `${val.toFixed(1)}`;
        }
      }
    });
  }

  private generateCodeSnippet(): string {
    return `// Custom Camera Settings
export const userCameraSettings = {
  mode: '${this.settings.mode}',
  behindDistance: ${this.settings.behindDistance.toFixed(1)}, // Zoom distance
  behindPitch: ${this.settings.behindPitch.toFixed(1)}, // Resting angle (deg)
  behindMinPitch: ${this.settings.behindMinPitch.toFixed(1)}, // Lower angle limit (deg)
  behindMaxPitch: ${this.settings.behindMaxPitch.toFixed(1)}, // Upper angle limit (deg)
  behindLookAheadDist: ${this.settings.behindLookAheadDist.toFixed(1)}, // Look-ahead lead (m)
  behindLookAheadHeight: ${this.settings.behindLookAheadHeight.toFixed(1)}, // Look-ahead height (m)
  behindFollowSpeed: ${this.settings.behindFollowSpeed.toFixed(1)}, // Heading smoothing speed
  topdownDistance: ${this.settings.topdownDistance.toFixed(1)}, // Topdown zoom
  topdownPitch: ${this.settings.topdownPitch.toFixed(1)}, // Topdown pitch (deg)
  fov: ${this.settings.fov.toFixed(0)}, // Field of view
  mouseSensitivity: ${this.settings.mouseSensitivity.toFixed(2)},
};`;
  }
}
