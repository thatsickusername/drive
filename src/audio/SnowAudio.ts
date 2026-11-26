import * as THREE from 'three';

export class SnowAudio {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;

  // Pre-allocated land thump sub-graph
  private thumpFilter: BiquadFilterNode | null = null;
  private thumpGain: GainNode | null = null;

  // Pre-allocated pole plant sub-graph and pre-baked transient buffer
  private polePlantBuffer: AudioBuffer | null = null;
  private clickFilter: BiquadFilterNode | null = null;
  private clickGain: GainNode | null = null;
  private tapGain: GainNode | null = null;

  private initialized = false;
  private lastPolePlantTime = 0;

  // Audio param modulation cache for zero-redundancy updates
  private currentGain = 0;
  private currentFreq = 950;
  private currentQ = 1.3;

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

      // Pre-allocate land thump sub-graph
      this.thumpFilter = this.ctx.createBiquadFilter();
      this.thumpFilter.type = 'lowpass';
      this.thumpFilter.frequency.value = 150;

      this.thumpGain = this.ctx.createGain();
      this.thumpGain.gain.value = 0.0;

      this.thumpFilter.connect(this.thumpGain);
      this.thumpGain.connect(this.ctx.destination);

      // Pre-bake pole plant transient buffer
      const sampleCount = Math.floor(this.ctx.sampleRate * 0.035);
      this.polePlantBuffer = this.ctx.createBuffer(1, sampleCount, this.ctx.sampleRate);
      const pData = this.polePlantBuffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i++) {
        const decay = Math.exp(-i / (this.ctx.sampleRate * 0.005));
        pData[i] = (Math.random() * 2 - 1) * decay;
      }

      this.clickFilter = this.ctx.createBiquadFilter();
      this.clickFilter.type = 'bandpass';
      this.clickFilter.frequency.value = 3400;
      this.clickFilter.Q.value = 3.6;

      this.clickGain = this.ctx.createGain();
      this.clickGain.gain.value = 0.0;

      this.tapGain = this.ctx.createGain();
      this.tapGain.gain.value = 0.0;

      this.clickFilter.connect(this.clickGain);
      this.clickGain.connect(this.ctx.destination);
      this.tapGain.connect(this.ctx.destination);

      this.initialized = true;
    } catch {
      // Audio autoplay restrictions or headless environment
    }
  }

  public playLandThump(isClean: boolean): void {
    if (!this.initialized || !this.ctx || !this.thumpFilter || !this.thumpGain) return;
    try {
      const now = this.ctx.currentTime;
      this.thumpFilter.frequency.setValueAtTime(isClean ? 180 : 120, now);

      const osc = this.ctx.createOscillator();
      osc.type = isClean ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(isClean ? 90 : 65, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.14);

      this.thumpGain.gain.setValueAtTime(isClean ? 0.35 : 0.50, now);
      this.thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(this.thumpFilter);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Headless / restricted
    }
  }

  public playPolePlant(): void {
    if (!this.initialized || !this.ctx || !this.polePlantBuffer || !this.clickFilter || !this.clickGain || !this.tapGain) return;
    try {
      const now = this.ctx.currentTime;
      if (now - this.lastPolePlantTime < 0.22) return;
      this.lastPolePlantTime = now;

      // Re-use pre-baked click transient buffer
      const clickSrc = this.ctx.createBufferSource();
      clickSrc.buffer = this.polePlantBuffer;

      this.clickFilter.frequency.setValueAtTime(3200 + Math.random() * 400, now);
      this.clickGain.gain.setValueAtTime(0.26, now);
      this.clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      // Low resonant tap of pole basket striking crust
      const tapOsc = this.ctx.createOscillator();
      tapOsc.type = 'triangle';
      tapOsc.frequency.setValueAtTime(240, now);
      tapOsc.frequency.exponentialRampToValueAtTime(60, now + 0.045);

      this.tapGain.gain.setValueAtTime(0.16, now);
      this.tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      clickSrc.connect(this.clickFilter);
      tapOsc.connect(this.tapGain);

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
    const now = this.ctx.currentTime;
    if (!isGrounded || speed < 0.5) {
      if (this.currentGain > 0.001) {
        this.gain.gain.setTargetAtTime(0, now, 0.08);
        this.currentGain = 0;
      }
      return;
    }
    const absLat = Math.abs(vLateral);
    let targetGain = 0;
    let targetFreq = 950;
    let targetQ = 1.3;

    if (isDrifting) {
      // Skid / Drift / Snowplow: deep hollow rushing white noise plowing sound (380 Hz – 1030 Hz)
      const latT = Math.min(1.0, absLat / 7.0);
      const speedT = Math.min(1.0, speed / 30.0);
      targetGain = Math.min(0.35, 0.09 + speedT * 0.14 + latT * 0.18);
      targetFreq = 380 + Math.min(650, speedT * 420 + latT * 230); // 380 Hz to 1030 Hz
      targetQ = 1.1;
    } else {
      // Clean Carve: high-frequency bandpass slicing sound (950 Hz – 3150 Hz) proportional to edge bite and speed
      const biteT = THREE.MathUtils.clamp(gripUtilization, 0, 1);
      const speedT = THREE.MathUtils.clamp(speed / 35.0, 0, 1);
      const factor = THREE.MathUtils.clamp(0.40 * speedT + 0.60 * biteT, 0, 1);
      targetFreq = 950 + 2200 * factor; // 950 Hz to 3150 Hz
      targetGain = Math.min(0.24, (0.04 + 0.16 * speedT) * (0.6 + 0.4 * biteT));
      targetQ = 1.6;

      // Edge-Bite Limit Audio Cue: subtle high-frequency board chatter between 80% and 100% grip limit
      if (gripUtilization > 0.80) {
        const chatterT = THREE.MathUtils.clamp((gripUtilization - 0.80) / 0.20, 0, 1);
        targetFreq = THREE.MathUtils.lerp(targetFreq, 3150, chatterT * 0.5);
        targetGain += chatterT * 0.06;
      }
    }

    // Dirty-check parameters before dispatching AudioParam automations to avoid audio thread churn
    if (Math.abs(targetGain - this.currentGain) > 0.005) {
      this.gain.gain.setTargetAtTime(targetGain, now, isDrifting ? 0.03 : 0.04);
      this.currentGain = targetGain;
    }
    if (Math.abs(targetFreq - this.currentFreq) > 8.0) {
      this.filter.frequency.setTargetAtTime(targetFreq, now, isDrifting ? 0.03 : 0.04);
      this.currentFreq = targetFreq;
    }
    if (Math.abs(targetQ - this.currentQ) > 0.05) {
      this.filter.Q.setTargetAtTime(targetQ, now, 0.04);
      this.currentQ = targetQ;
    }
  }
}
