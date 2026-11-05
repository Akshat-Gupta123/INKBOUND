import {save, persist} from './save';

class Sound {
  ctx: AudioContext | undefined;
  ambient: ReturnType<typeof setInterval> | undefined;
  private master: GainNode | undefined;
  private noiseBuffer: AudioBuffer | undefined;
  private beat = 0;
  private readonly voices = new Set<AudioScheduledSourceNode>();

  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) void this.ctx.suspend().catch(() => {});
        else void this.ctx.resume().catch(() => {});
      });
    }
    if (!document.hidden) void this.ctx.resume().catch(() => {});
    this.updateVolume();
    if (!this.ambient) {
      // A restrained 115 BPM pulse, present only during active gameplay.
      // Menus and pause screens stay quiet; this is texture, not a melody loop.
      this.ambient = setInterval(() => {
        this.updateVolume();
        if (document.hidden || save.muted || !document.querySelector('.hud') || this.ctx?.state !== 'running') return;
        const step = this.beat++ % 8;
        if (step === 0 || step === 4) {
          this.tone(76, .13, 'sine', .045, 42);
          this.tone(step === 0 ? 73.42 : 65.41, .17, 'triangle', .012);
        }
        if (step === 2 || step === 6) this.noise(.028, .009, 3500);
      }, 260);
    }
  }

  private updateVolume() {
    if (!this.ctx || !this.master) return;
    const volume = save.muted || document.hidden ? 0 : Math.max(0, Math.min(1, save.volume));
    this.master.gain.setTargetAtTime(volume, this.ctx.currentTime, .012);
  }

  tone(freq: number, duration = .12, type: OscillatorType = 'sine', gain = .15, end?: number, delay = 0) {
    if (save.muted || !this.ctx || !this.master || document.hidden) return;
    const c = this.ctx;
    this.updateVolume();
    const oscillator = c.createOscillator();
    const envelope = c.createGain();
    const at = c.currentTime + delay;
    const length = Math.max(.025, duration);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, freq), at);
    if (end) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), at + length);
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.linearRampToValueAtTime(Math.max(.001, gain), at + .004);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + length);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    this.voices.add(oscillator);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      this.voices.delete(oscillator);
    };
    oscillator.start(at);
    oscillator.stop(at + length + .01);
  }

  private noise(duration: number, gain: number, cutoff = 900) {
    if (save.muted || !this.ctx || !this.master || document.hidden) return;
    const c = this.ctx;
    this.updateVolume();
    if (!this.noiseBuffer) {
      this.noiseBuffer = c.createBuffer(1, Math.ceil(c.sampleRate * .3), c.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = c.createBufferSource();
    const filter = c.createBiquadFilter();
    const envelope = c.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.value = cutoff;
    envelope.gain.setValueAtTime(gain, c.currentTime);
    envelope.gain.exponentialRampToValueAtTime(.0001, c.currentTime + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.master);
    this.voices.add(source);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
      this.voices.delete(source);
    };
    source.start();
    source.stop(c.currentTime + duration);
  }

  play(kind: string) {
    switch (kind) {
      case 'jump': this.tone(180, .11, 'triangle', .12, 360); break;
      case 'land': this.tone(82, .065, 'sine', .15, 38); this.noise(.035, .035, 450); break;
      case 'dash': this.noise(.12, .11, 1500); this.tone(180, .12, 'sawtooth', .035, 65); break;
      case 'launch': this.tone(100, .16, 'triangle', .15, 520); this.noise(.09, .055, 1900); break;
      case 'death': this.noise(.13, .15, 500); this.tone(120, .18, 'sawtooth', .07, 25); break;
      case 'draw': this.noise(.085, .065, 2100); this.tone(410, .055, 'triangle', .045, 220); break;
      case 'collect': this.tone(880, .07, 'triangle', .075); this.tone(1320, .08, 'sine', .05, undefined, .055); break;
      case 'complete': this.tone(110, .24, 'triangle', .12, 55); this.tone(440, .2, 'triangle', .065, undefined, .04); this.tone(660, .25, 'sine', .06, undefined, .1); break;
      case 'checkpoint': this.tone(220, .09, 'triangle', .09); this.tone(440, .12, 'triangle', .06, undefined, .06); break;
      case 'page': this.noise(.13, .06, 1700); this.tone(100, .09, 'sine', .09, 50); break;
      case 'error': this.tone(75, .075, 'square', .04, 50); break;
      case 'click': this.tone(300, .028, 'triangle', .07, 180); break;
      default: this.tone(220, .06, 'triangle', .06);
    }
  }

  mute() {
    save.muted = !save.muted;
    this.updateVolume();
    persist();
  }
}

export const sound = new Sound();
