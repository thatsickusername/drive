import * as THREE from 'three';
import { Renderer } from '../core/Renderer';

export class LightingControls {
  private container!: HTMLElement;
  private trackEl!: HTMLElement;
  private thumbEl!: HTMLElement;
  private labelEl!: HTMLElement;
  private renderer: Renderer;

  private lastThumbX = -1;
  private lastPhase = '';
  private lastTimeStr = '';
  private lastPaused: boolean | null = null;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.createUI();
  }

  private createUI(): void {
    const existing = document.getElementById('lighting-toggle-container');
    if (existing) existing.remove();

    this.container = document.createElement('div');
    this.container.id = 'lighting-toggle-container';
    this.container.className = 'hud-blur';
    this.container.style.cssText = `
      position: absolute;
      top: 18px;
      right: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(15, 23, 42, 0.82);
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 24px;
      padding: 6px 14px;
      cursor: pointer;
      user-select: none;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.40);
      transition: all 0.25s ease;
      font-family: 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #e2e8f0;
    `;

    this.container.innerHTML = `
      <div id="toggle-track" style="
        position: relative;
        width: 58px;
        height: 24px;
        background: #334155;
        border-radius: 12px;
        transition: background 0.3s ease;
      ">
        <div id="toggle-thumb" style="
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: #f8fafc;
          border-radius: 50%;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        "></div>
      </div>
      <span id="toggle-label" style="min-width: 125px; letter-spacing: 0.2px;">☀️ Day</span>
      <span style="font-size: 10px; opacity: 0.6; padding: 2px 6px; background: rgba(255,255,255,0.12); border-radius: 6px;">L</span>
    `;
    this.container.title = 'Click to advance phase | [L]/[N] Advance | [P] Pause/Resume';

    this.trackEl = this.container.querySelector('#toggle-track') as HTMLElement;
    this.thumbEl = this.container.querySelector('#toggle-thumb') as HTMLElement;
    this.labelEl = this.container.querySelector('#toggle-label') as HTMLElement;

    this.container.addEventListener('click', () => {
      this.toggle();
    });

    this.container.addEventListener('mouseenter', () => {
      this.container.style.borderColor = 'rgba(255, 255, 255, 0.45)';
      this.container.style.transform = 'translateY(-1px)';
    });

    this.container.addEventListener('mouseleave', () => {
      this.container.style.borderColor = 'rgba(255, 255, 255, 0.22)';
      this.container.style.transform = 'translateY(0)';
    });

    document.body.appendChild(this.container);
    this.update();
  }

  public toggle(): void {
    this.renderer.toggleLightingMode();
    this.update();
  }

  public setVisible(visible: boolean): void {
    if (this.container) {
      this.container.style.display = visible ? 'flex' : 'none';
    }
  }

  public update(): void {
    const cycle = this.renderer.cycle;
    const phase = cycle.currentPhase;
    const timeStr = cycle.phaseFormattedTime;
    const isPaused = cycle.isPaused;

    if (!this.trackEl || !this.thumbEl || !this.labelEl) return;

    const thumbX = Math.round(THREE.MathUtils.clamp((this.renderer.lightingFactor / 2.0) * 34, 0, 34) * 10) / 10;
    if (thumbX !== this.lastThumbX) {
      this.lastThumbX = thumbX;
      this.thumbEl.style.transform = `translateX(${thumbX.toFixed(1)}px)`;
    }

    if (phase !== this.lastPhase || timeStr !== this.lastTimeStr || isPaused !== this.lastPaused) {
      this.lastPhase = phase;
      this.lastTimeStr = timeStr;
      this.lastPaused = isPaused;

      const pauseIndicator = isPaused ? ' <span style="font-size:10px; opacity:0.8;">⏸</span>' : '';
      if (phase === 'night') {
        this.trackEl.style.background = '#2563eb';
        this.thumbEl.style.background = '#e0f2fe';
        this.labelEl.innerHTML = `🌙 Night <span style="opacity:0.75; font-size:11px; margin-left:3px;">${timeStr}</span>${pauseIndicator}`;
      } else if (phase === 'sunset') {
        this.trackEl.style.background = '#ea580c';
        this.thumbEl.style.background = '#fef08a';
        this.labelEl.innerHTML = `🌅 Sunset <span style="opacity:0.75; font-size:11px; margin-left:3px;">${timeStr}</span>${pauseIndicator}`;
      } else if (phase === 'sunrise') {
        this.trackEl.style.background = '#d97706';
        this.thumbEl.style.background = '#fef08a';
        this.labelEl.innerHTML = `🌅 Sunrise <span style="opacity:0.75; font-size:11px; margin-left:3px;">${timeStr}</span>${pauseIndicator}`;
      } else {
        this.trackEl.style.background = '#334155';
        this.thumbEl.style.background = '#f8fafc';
        this.labelEl.innerHTML = `☀️ Day <span style="opacity:0.75; font-size:11px; margin-left:3px;">${timeStr}</span>${pauseIndicator}`;
      }
    }
  }

  public dispose(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
