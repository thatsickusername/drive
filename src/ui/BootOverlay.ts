export class BootOverlay {
  private root: HTMLDivElement;
  private statusEl: HTMLDivElement;
  private barFillEl: HTMLDivElement;

  constructor() {
    const existing = document.getElementById('boot-overlay');
    if (existing) existing.remove();

    this.root = document.createElement('div');
    this.root.id = 'boot-overlay';
    this.root.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      background: radial-gradient(circle at 50% 35%, #1e293b 0%, #0f172a 75%);
      color: #f8fafc;
      font-family: 'Segoe UI', Roboto, sans-serif;
      z-index: 2000;
      transition: opacity 0.2s ease;
    `;

    this.root.innerHTML = `
      <div style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #f8fafc;">
        ALPINE FREERIDE
      </div>
      <div id="boot-status" style="font-size: 13px; color: #94a3b8; letter-spacing: 0.4px;">
        Initializing simulation...
      </div>
      <div style="width: 240px; height: 6px; background: rgba(255,255,255,0.12); border-radius: 999px; overflow: hidden;">
        <div id="boot-bar-fill" style="width: 10%; height: 100%; background: linear-gradient(90deg, #38bdf8, #818cf8); border-radius: 999px; transition: width 0.15s ease;"></div>
      </div>
    `;

    this.statusEl = this.root.querySelector('#boot-status') as HTMLDivElement;
    this.barFillEl = this.root.querySelector('#boot-bar-fill') as HTMLDivElement;
    document.body.appendChild(this.root);
  }

  public setProgress(label: string, progress01: number): void {
    const pct = Math.max(0, Math.min(100, Math.round(progress01 * 100)));
    this.statusEl.textContent = label;
    this.barFillEl.style.width = `${pct}%`;
  }

  public dispose(): void {
    if (this.root && this.root.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
  }
}
