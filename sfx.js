// Procedural sound effects engine using Web Audio API — no external files needed.
// Shares the AudioContext with the music manager for efficiency.

import { music } from './music';

class SfxManager {
  constructor() {
    this.volume = 0.35;
    this.gainNode = null;
  }

  init() {
    if (this.gainNode) return;
    music.init();
    if (!music.ctx) return;
    this.gainNode = music.ctx.createGain();
    this.gainNode.gain.value = this.volume;
    this.gainNode.connect(music.ctx.destination);
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, (vol / 100) * 0.7));
    this.init();
    if (music.ctx && music.ctx.state === 'suspended') music.ctx.resume();
    if (this.gainNode && music.ctx) {
      this.gainNode.gain.setTargetAtTime(this.volume, music.ctx.currentTime, 0.05);
    }
  }

  _now() { return music.ctx ? music.ctx.currentTime : 0; }

  _noise(duration, startTime, gainVal, filterFreq, filterType = 'highpass') {
    if (!music.ctx || !this.gainNode) return;
    const buffer = music.ctx.createBuffer(1, Math.floor(music.ctx.sampleRate * duration), music.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    const src = music.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = music.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    const gain = music.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    src.connect(filter); filter.connect(gain); gain.connect(this.gainNode);
    src.start(startTime); src.stop(startTime + duration);
  }

  _tone(freq, startTime, duration, type = 'sine', gainVal = 0.2, freqEnd = null) {
    if (!music.ctx || !this.gainNode) return;
    const osc = music.ctx.createOscillator();
    const gain = music.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (freqEnd != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), startTime + duration);
    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain); gain.connect(this.gainNode);
    osc.start(startTime); osc.stop(startTime + duration + 0.02);
  }

  hit() {
    this.init();
    const t = this._now();
    this._noise(0.05, t, 0.12, 2500, 'bandpass');
    this._tone(180, t, 0.04, 'square', 0.1, 80);
  }

  heavyHit() {
    this.init();
    const t = this._now();
    this._noise(0.1, t, 0.22, 700, 'lowpass');
    this._tone(120, t, 0.08, 'square', 0.18, 50);
    this._tone(60, t, 0.12, 'sine', 0.14, 30);
  }

  superActivate() {
    this.init();
    const t = this._now();
    this._tone(200, t, 0.5, 'sawtooth', 0.18, 1200);
    this._tone(300, t, 0.5, 'square', 0.08, 800);
    this._noise(0.3, t + 0.4, 0.25, 200, 'lowpass');
    this._tone(80, t + 0.4, 0.3, 'sine', 0.22, 40);
  }

  superImpact() {
    this.init();
    const t = this._now();
    this._noise(0.25, t, 0.3, 400, 'lowpass');
    this._tone(100, t, 0.2, 'square', 0.22, 40);
    this._tone(150, t, 0.3, 'sawtooth', 0.12, 50);
    this._noise(0.4, t + 0.02, 0.12, 6000, 'highpass');
  }

  jump() {
    this.init();
    const t = this._now();
    this._tone(300, t, 0.07, 'square', 0.08, 600);
  }

  power() {
    this.init();
    const t = this._now();
    this._tone(400, t, 0.12, 'triangle', 0.12, 800);
    this._tone(600, t + 0.04, 0.08, 'sine', 0.08, 1000);
  }

  ko() {
    this.init();
    const t = this._now();
    this._tone(400, t, 0.4, 'sawtooth', 0.22, 80);
    this._noise(0.3, t, 0.18, 500, 'lowpass');
    this._tone(200, t + 0.1, 0.3, 'square', 0.12, 50);
  }

  coin() {
    this.init();
    const t = this._now();
    this._tone(800, t, 0.04, 'square', 0.08);
    this._tone(1200, t + 0.03, 0.06, 'square', 0.08);
  }

  // ── UI / menu sound effects ──
  hover() {
    this.init();
    const t = this._now();
    this._tone(900, t, 0.03, 'sine', 0.04, 1100);
  }
  click() {
    this.init();
    const t = this._now();
    this._tone(600, t, 0.04, 'square', 0.06, 400);
  }
  purchaseSuccess() {
    this.init();
    const t = this._now();
    this._tone(523, t, 0.1, 'triangle', 0.1);
    this._tone(659, t + 0.08, 0.1, 'triangle', 0.1);
    this._tone(784, t + 0.16, 0.15, 'triangle', 0.12);
    this._tone(1047, t + 0.24, 0.2, 'sine', 0.1);
  }
  purchaseFailed() {
    this.init();
    const t = this._now();
    this._tone(300, t, 0.15, 'sawtooth', 0.12, 150);
    this._tone(200, t + 0.1, 0.2, 'square', 0.1, 100);
  }
  characterSelect() {
    this.init();
    const t = this._now();
    this._tone(440, t, 0.08, 'triangle', 0.08);
    this._tone(554, t + 0.05, 0.08, 'triangle', 0.08);
    this._tone(659, t + 0.1, 0.12, 'triangle', 0.1);
  }
  locked() {
    this.init();
    const t = this._now();
    this._tone(150, t, 0.08, 'square', 0.1, 80);
    this._noise(0.04, t, 0.06, 800, 'lowpass');
  }
  menuOpen() {
    this.init();
    const t = this._now();
    this._tone(400, t, 0.12, 'sine', 0.08, 900);
    this._noise(0.08, t, 0.04, 3000, 'highpass');
  }
  menuClose() {
    this.init();
    const t = this._now();
    this._tone(700, t, 0.1, 'sine', 0.06, 300);
    this._noise(0.06, t, 0.03, 2000, 'highpass');
  }
  battlePassReward() {
    this.init();
    const t = this._now();
    this._tone(659, t, 0.1, 'triangle', 0.08);
    this._tone(880, t + 0.08, 0.1, 'triangle', 0.08);
    this._tone(1175, t + 0.16, 0.2, 'sine', 0.1);
  }
  xpGain() {
    this.init();
    const t = this._now();
    this._tone(700, t, 0.05, 'triangle', 0.05, 1000);
  }
  notification() {
    this.init();
    const t = this._now();
    this._tone(880, t, 0.08, 'sine', 0.06);
    this._tone(1100, t + 0.06, 0.1, 'sine', 0.06);
  }
  warning() {
    this.init();
    const t = this._now();
    this._tone(440, t, 0.1, 'square', 0.08, 440);
    this._tone(440, t + 0.12, 0.1, 'square', 0.08, 440);
  }
  countdown() {
    this.init();
    const t = this._now();
    this._tone(600, t, 0.06, 'square', 0.07);
  }
  matchFound() {
    this.init();
    const t = this._now();
    this._tone(523, t, 0.1, 'triangle', 0.08);
    this._tone(659, t + 0.1, 0.1, 'triangle', 0.08);
    this._tone(784, t + 0.2, 0.25, 'triangle', 0.1);
  }
  matchVictory() {
    this.init();
    const t = this._now();
    this._tone(523, t, 0.12, 'triangle', 0.1);
    this._tone(659, t + 0.1, 0.12, 'triangle', 0.1);
    this._tone(784, t + 0.2, 0.12, 'triangle', 0.1);
    this._tone(1047, t + 0.3, 0.3, 'triangle', 0.12);
  }
  matchDefeat() {
    this.init();
    const t = this._now();
    this._tone(440, t, 0.2, 'sawtooth', 0.1, 330);
    this._tone(330, t + 0.15, 0.2, 'sawtooth', 0.1, 220);
    this._tone(220, t + 0.3, 0.4, 'sine', 0.1, 110);
  }

  cheer() {
    this.init();
    if (!music.ctx || !this.gainNode) return;
    // Lazy-load the crowd cheering audio clip (shared across all cheers)
    if (!this._cheerAudio) {
      this._cheerAudio = new Audio('/audio/cheer.mp3');
      this._cheerAudio.crossOrigin = 'anonymous';
      this._cheerAudio.preload = 'auto';
      try {
        this._cheerGain = music.ctx.createGain();
        this._cheerGain.gain.value = 0;
        this._cheerSource = music.ctx.createMediaElementSource(this._cheerAudio);
        this._cheerSource.connect(this._cheerGain);
        this._cheerGain.connect(this.gainNode);
      } catch (e) {}
    }
    const audio = this._cheerAudio;
    const gain = this._cheerGain;
    if (!audio || !gain) return;
    // Restart from second 3 each time — plays 5s (clip 3s→8s), fades out at the end
    clearTimeout(this._cheerStopTimer);
    try { audio.currentTime = 3; } catch (e) {}
    const now = music.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(1.3, now + 0.3);
    gain.gain.setValueAtTime(1.3, now + 3.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);
    audio.play().catch(() => {});
    this._cheerStopTimer = setTimeout(() => { audio.pause(); }, 5100);
  }

  // ── Split City Parkour sound effects ──
  land() {
    this.init();
    const t = this._now();
    this._noise(0.04, t, 0.08, 1800, 'lowpass');
    this._tone(160, t, 0.05, 'sine', 0.06, 90);
  }
  wallJump() {
    this.init();
    const t = this._now();
    this._tone(420, t, 0.09, 'square', 0.1, 760);
    this._noise(0.05, t, 0.06, 3000, 'highpass');
  }
  wallClimb() {
    this.init();
    const t = this._now();
    this._tone(260, t, 0.04, 'triangle', 0.04, 320);
  }
  platformWhoosh() {
    this.init();
    const t = this._now();
    this._noise(0.12, t, 0.05, 1200, 'bandpass');
  }
  collapse() {
    this.init();
    const t = this._now();
    this._noise(0.22, t, 0.14, 500, 'lowpass');
    this._tone(110, t, 0.18, 'square', 0.08, 50);
  }
  personalBest() {
    this.init();
    const t = this._now();
    this._tone(659, t, 0.1, 'triangle', 0.1);
    this._tone(880, t + 0.09, 0.1, 'triangle', 0.1);
    this._tone(1175, t + 0.18, 0.14, 'triangle', 0.12);
    this._tone(1568, t + 0.28, 0.22, 'sine', 0.12);
  }
  gameOverRun() {
    this.init();
    const t = this._now();
    this._tone(440, t, 0.18, 'sawtooth', 0.12, 330);
    this._tone(330, t + 0.16, 0.2, 'sawtooth', 0.12, 220);
    this._tone(220, t + 0.34, 0.45, 'sine', 0.12, 90);
    this._noise(0.3, t, 0.1, 600, 'lowpass');
  }

  // ── Rock Climbing sound effects ──
  grab() {
    this.init();
    const t = this._now();
    this._noise(0.03, t, 0.05, 2000, 'bandpass');
    this._tone(220, t, 0.04, 'triangle', 0.05, 280);
  }
  pullUp() {
    this.init();
    const t = this._now();
    this._tone(200, t, 0.06, 'triangle', 0.05, 260);
    this._noise(0.03, t, 0.04, 1500, 'bandpass');
  }
  ledgeGrab() {
    this.init();
    const t = this._now();
    this._tone(300, t, 0.08, 'sine', 0.08, 500);
    this._noise(0.05, t, 0.05, 1800, 'bandpass');
  }
  rockBreak() {
    this.init();
    const t = this._now();
    this._noise(0.25, t, 0.18, 600, 'lowpass');
    this._tone(90, t, 0.2, 'square', 0.1, 40);
    this._noise(0.3, t + 0.05, 0.1, 1200, 'bandpass');
  }
  wind() {
    this.init();
    const t = this._now();
    this._noise(0.6, t, 0.06, 800, 'bandpass');
  }
  checkpoint() {
    this.init();
    const t = this._now();
    this._tone(523, t, 0.1, 'triangle', 0.1);
    this._tone(784, t + 0.1, 0.15, 'triangle', 0.1);
    this._tone(1047, t + 0.22, 0.2, 'sine', 0.1);
  }
  summit() {
    this.init();
    const t = this._now();
    this._tone(523, t, 0.15, 'triangle', 0.12);
    this._tone(659, t + 0.12, 0.15, 'triangle', 0.12);
    this._tone(784, t + 0.24, 0.15, 'triangle', 0.12);
    this._tone(1047, t + 0.36, 0.3, 'sine', 0.14);
    this._tone(1568, t + 0.5, 0.4, 'sine', 0.12);
  }
}

export const sfx = new SfxManager();