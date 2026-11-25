import * as THREE from 'three';
import { Renderer } from '../core/Renderer';

export class LightingControls {
  private container!: HTMLElement;
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.createUI();
  }

  private createUI(): void {
    const existing = document.getElementById('lighting-toggle-container');
    if (existing) existing.remove();

    this.container = document.createElement('div');
    this.container.id = 'lighting-toggle-container';
    this.container.style.cssText = `
      position: absolute;
      top: 18px;
      right: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(12px);
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
    const track = document.getElementById('toggle-track');
    const thumb = document.getElementById('toggle-thumb');
    const label = document.getElementById('toggle-label');
    if (track && thumb && label) {
      const thumbX = THREE.MathUtils.clamp((this.renderer.lightingFactor / 2.0) * 34, 0, 34);
      thumb.style.transform = `translateX(${thumbX.toFixed(1)}px)`;

      const pauseIndicator = cycle.isPaused ? ' <span style="font-size:10px; opacity:0.8;">⏸</span>' : '';
      if (phase === 'night') {
        track.style.background = '#2563eb';
        thumb.style.background = '#e0f2fe';
        label.innerHTML = `🌙 Night <span style="opacity:0.75; font-size:11px; margin-left:3px;">${timeStr}</span>${pauseIndicator}`;
      } else if (phase === 'sunset') {
        track.style.background = '#ea580c';
        thumb.style.background = '#fef08a';
        label.innerHTML = `🌅 Sunset <span style="opacity:0.75; font-size:11px; margin-left:3px;">${timeStr}</span>${pauseIndicator}`;
      } else if (phase === 'sunrise') {
        track.style.background = '#d97706';
        thumb.style.background = '#fef08a';
        label.innerHTML = `🌅 Sunrise <span style="opacity:0.75; font-size:11px; margin-left:3px;">${timeStr}</span>${pauseIndicator}`;
      } else {
        track.style.background = '#334155';
        thumb.style.background = '#f8fafc';
        label.innerHTML = `☀️ Day <span style="opacity:0.75; font-size:11px; margin-left:3px;">${timeStr}</span>${pauseIndicator}`;
      }
    }
  }
}
