import * as THREE from 'three';

export class SnowAudio {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;
  private initialized = false;
  private lastPolePlantTime = 0;

  public init(): void {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.22;
      }
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'bandpass';
      this.filter.frequency.value = 950;
      this.filter.Q.value = 1.3;

      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0.0;

      this.noiseNode.connect(this.filter);
      this.filter.connect(this.gain);
      this.gain.connect(this.ctx.destination);
      this.noiseNode.start(0);
      this.initialized = true;
    } catch {
      // Audio autoplay restrictions or headless environment
    }
  }

  public playLandThump(isClean: boolean): void {
    if (!this.initialized || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      const thumpFilter = this.ctx.createBiquadFilter();

      thumpFilter.type = 'lowpass';
      thumpFilter.frequency.value = isClean ? 180 : 120;

      osc.type = isClean ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(isClean ? 90 : 65, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.14);

      thumpGain.gain.setValueAtTime(isClean ? 0.35 : 0.50, this.ctx.currentTime);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

      osc.connect(thumpFilter);
      thumpFilter.connect(thumpGain);
      thumpGain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {
      // Headless / restricted
    }
  }

  public playPolePlant(): void {
    if (!this.initialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (now - this.lastPolePlantTime < 0.22) return;
      this.lastPolePlantTime = now;
      // Procedural hardpack snow pole jab click: short crisp transient noise click
      const sampleCount = Math.floor(this.ctx.sampleRate * 0.035);
      const buffer = this.ctx.createBuffer(1, sampleCount, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i++) {
        const decay = Math.exp(-i / (this.ctx.sampleRate * 0.005));
        data[i] = (Math.random() * 2 - 1) * decay;
      }
      const clickSrc = this.ctx.createBufferSource();
      clickSrc.buffer = buffer;

      const clickFilter = this.ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(3200 + Math.random() * 400, now);
      clickFilter.Q.setValueAtTime(3.6, now);

      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.26, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      // Low resonant tap of pole basket striking crust
      const tapOsc = this.ctx.createOscillator();
      tapOsc.type = 'triangle';
      tapOsc.frequency.setValueAtTime(240, now);
      tapOsc.frequency.exponentialRampToValueAtTime(60, now + 0.045);

      const tapGain = this.ctx.createGain();
      tapGain.gain.setValueAtTime(0.16, now);
      tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      clickSrc.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(this.ctx.destination);

      tapOsc.connect(tapGain);
      tapGain.connect(this.ctx.destination);

      clickSrc.start(now);
      tapOsc.start(now);
      clickSrc.stop(now + 0.04);
      tapOsc.stop(now + 0.05);
    } catch {
      // Audio restricted
    }
  }

  public update(speed: number, vLateral: number, isGrounded: boolean, isDrifting: boolean = false, gripUtilization: number = 0): void {
    if (!this.initialized || !this.ctx || !this.gain || !this.filter) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!isGrounded || speed < 0.5) {
      this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      return;
    }
    const absLat = Math.abs(vLateral);
    if (isDrifting) {
      // Skid / Drift / Snowplow: deep hollow rushing white noise plowing sound (380 Hz – 1030 Hz)
      const latT = Math.min(1.0, absLat / 7.0);
      const speedT = Math.min(1.0, speed / 30.0);
      const targetGain = Math.min(0.35, 0.09 + speedT * 0.14 + latT * 0.18);
      const targetFreq = 380 + Math.min(650, speedT * 420 + latT * 230); // 380 Hz to 1030 Hz
      this.filter.Q.setTargetAtTime(1.1, this.ctx.currentTime, 0.04);
      this.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.03);
      this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.03);
    } else {
      // Clean Carve: high-frequency bandpass slicing sound (950 Hz – 3150 Hz) proportional to edge bite and speed
      const biteT = THREE.MathUtils.clamp(gripUtilization, 0, 1);
      const speedT = THREE.MathUtils.clamp(speed / 35.0, 0, 1);
      const factor = THREE.MathUtils.clamp(0.40 * speedT + 0.60 * biteT, 0, 1);
      let targetFreq = 950 + 2200 * factor; // 950 Hz to 3150 Hz
      let targetGain = Math.min(0.24, (0.04 + 0.16 * speedT) * (0.6 + 0.4 * biteT));

      // Edge-Bite Limit Audio Cue: subtle high-frequency board chatter between 80% and 100% grip limit
      if (gripUtilization > 0.80) {
        const chatterT = THREE.MathUtils.clamp((gripUtilization - 0.80) / 0.20, 0, 1);
        targetFreq = THREE.MathUtils.lerp(targetFreq, 3150, chatterT * 0.5);
        targetGain += chatterT * 0.06;
      }

      this.filter.Q.setTargetAtTime(1.6, this.ctx.currentTime, 0.04);
      this.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.04);
      this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.04);
    }
  }
}
