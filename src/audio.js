class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.droneGain = null;
    this.droneOsc = null;
    this.filter = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.startAmbientDrone();
  }

  toggle() {
    if (!this.ctx) {
      this.init();
      this.enabled = true;
      return true;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
      this.enabled = true;
      return true;
    }
    this.enabled = !this.enabled;
    if (this.droneGain) {
      this.droneGain.gain.setTargetAtTime(this.enabled ? 0.04 : 0.0001, this.ctx.currentTime, 0.2);
    }
    return this.enabled;
  }

  startAmbientDrone() {
    if (!this.ctx) return;
    try {
      this.droneOsc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      this.filter = this.ctx.createBiquadFilter();
      this.droneGain = this.ctx.createGain();

      this.droneOsc.type = 'sine';
      this.droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A1

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110, this.ctx.currentTime);

      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(180, this.ctx.currentTime);

      this.droneGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.droneOsc.connect(this.filter);
      osc2.connect(this.filter);
      this.filter.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);

      this.droneOsc.start();
      osc2.start();
    } catch (e) {
      console.warn('Audio drone failed:', e);
    }
  }

  playHover() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {}
  }

  playSelect() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch (e) {}
  }

  playHeartbeat() {
    if (!this.enabled || !this.ctx) return;
    try {
      // Lub-dub double impulse
      const t = this.ctx.currentTime;
      [0, 0.14].forEach((offset, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(idx === 0 ? 65 : 55, t + offset);
        osc.frequency.exponentialRampToValueAtTime(35, t + offset + 0.10);

        gain.gain.setValueAtTime(0.08, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + 0.14);
      });
    } catch (e) {}
  }

  playSuccess() {
    if (!this.enabled || !this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
      const t = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.07);

        gain.gain.setValueAtTime(0.05, t + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.07 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.07);
        osc.stop(t + idx * 0.07 + 0.3);
      });
    } catch (e) {}
  }

  playError() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.24);
    } catch (e) {}
  }
}

export const sound = new SoundManager();
