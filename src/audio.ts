import { save, persist } from './save';
import { tracks, musicStep, midiFrequency, type MusicEvent } from './music';

type AudioMode = 'menu' | 'game' | 'paused';
type Voice = { source: AudioScheduledSourceNode; envelope: GainNode; music: boolean };

class Sound {
  ctx: AudioContext | undefined;
  ambient: ReturnType<typeof setInterval> | undefined;
  private master: GainNode | undefined;
  private musicBus: GainNode | undefined;
  private sfxBus: GainNode | undefined;
  private noiseBuffer: AudioBuffer | undefined;
  private readonly voices = new Set<Voice>();
  private mode: AudioMode = 'menu';
  private track = 0;
  private step = 0;
  private nextNote = 0;
  private musicSteps = 0;
  private musicEvents = 0;

  get diagnostics() {
    return { context: this.mode, track: this.track, trackName: tracks[this.track].name,
      playing: !!this.ctx && this.ctx.state === 'running' && this.mode !== 'paused' && !save.muted && save.musicVolume > 0 && !document.hidden,
      musicSteps: this.musicSteps, musicEvents: this.musicEvents, activeVoices: this.voices.size };
  }

  unlock() {
    if (!this.ctx) {
      const c = this.ctx = new AudioContext();
      this.master = c.createGain(); this.musicBus = c.createGain(); this.sfxBus = c.createGain();
      // A gentle bus compressor prevents stacked notes and effects from clipping.
      const limiter = c.createDynamicsCompressor();
      limiter.threshold.value = -10; limiter.knee.value = 12; limiter.ratio.value = 5;
      limiter.attack.value = .003; limiter.release.value = .18;
      this.musicBus.connect(this.master); this.sfxBus.connect(this.master);
      this.master.connect(limiter); limiter.connect(c.destination);
      this.nextNote = c.currentTime + .045;
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        this.stopMusic();
        if (document.hidden) void this.ctx.suspend().catch(() => {});
        else { this.nextNote = this.ctx.currentTime + .04; void this.ctx.resume().catch(() => {}); }
        this.refreshSettings();
      });
    }
    if (!document.hidden) void this.ctx.resume().catch(() => {});
    this.refreshSettings();
    if (!this.ambient) this.ambient = setInterval(() => this.schedule(), 25);
  }

  setContext(context: AudioMode, track = this.track) {
    const nextTrack = Math.max(0, Math.min(tracks.length - 1, Math.floor(track) || 0));
    if (context === this.mode && nextTrack === this.track) return;
    const keepPosition = context === 'paused' || (this.mode === 'paused' && nextTrack === this.track);
    this.stopMusic();
    this.mode = context; this.track = nextTrack;
    if (!keepPosition) this.step = 0;
    if (this.ctx) this.nextNote = this.ctx.currentTime + .045;
    this.refreshSettings();
  }

  refreshSettings() {
    if (!this.ctx || !this.master || !this.musicBus || !this.sfxBus) return;
    const at = this.ctx.currentTime, bounded = (v: number, fallback: number) => Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;
    this.master.gain.setTargetAtTime(save.muted || document.hidden ? 0 : bounded(save.volume, .35), at, .015);
    this.musicBus.gain.setTargetAtTime(this.mode === 'paused' ? 0 : bounded(save.musicVolume, .45) * (this.mode === 'menu' ? .65 : 1), at, .025);
    this.sfxBus.gain.setTargetAtTime(bounded(save.sfxVolume, .7), at, .015);
  }

  private stopMusic() {
    if (!this.ctx) return;
    for (const voice of this.voices) if (voice.music) {
      voice.envelope.gain.cancelScheduledValues(this.ctx.currentTime);
      voice.envelope.gain.setTargetAtTime(.0001, this.ctx.currentTime, .01);
      try { voice.source.stop(this.ctx.currentTime + .03); } catch { /* Already ended. */ }
    }
  }

  private schedule() {
    const c = this.ctx;
    if (!c || c.state !== 'running' || document.hidden || this.mode === 'paused') return;
    if (save.muted || save.musicVolume === 0 || save.volume === 0) { this.nextNote = c.currentTime + .04; return; }
    if (this.nextNote < c.currentTime - .1) this.nextNote = c.currentTime + .025;
    const quarter = 60 / (tracks[this.track].bpm * (this.mode === 'menu' ? .85 : 1));
    while (this.nextNote < c.currentTime + .12) {
      const notes = musicStep(this.track, this.step, this.mode === 'menu');
      notes.forEach(note => this.musicVoice(note, this.nextNote, quarter));
      this.musicSteps++; this.musicEvents += notes.length;
      this.step = (this.step + 1) % 256;
      this.nextNote += quarter / 4;
    }
  }

  private retain(source: AudioScheduledSourceNode, envelope: GainNode, music: boolean, extra: AudioNode[] = []) {
    const voice = { source, envelope, music }; this.voices.add(voice);
    source.onended = () => {
      source.disconnect(); envelope.disconnect(); extra.forEach(node => node.disconnect()); this.voices.delete(voice);
    };
  }

  private oscillator(freq: number, duration: number, type: OscillatorType, gain: number, at: number, music: boolean, end?: number, cutoff?: number, pad = false) {
    const c = this.ctx, bus = music ? this.musicBus : this.sfxBus;
    if (!c || !bus) return;
    const oscillator = c.createOscillator(), envelope = c.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(Math.max(20, freq), at);
    if (end) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), at + duration);
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.linearRampToValueAtTime(Math.max(.001, gain), at + (pad ? .09 : .004));
    envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    const extra: AudioNode[] = [];
    if (cutoff) {
      const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = cutoff; filter.Q.value = .6;
      oscillator.connect(filter); filter.connect(envelope); extra.push(filter);
    } else oscillator.connect(envelope);
    envelope.connect(bus); this.retain(oscillator, envelope, music, extra);
    oscillator.start(at); oscillator.stop(at + duration + .012);
  }

  private noiseAt(duration: number, gain: number, cutoff: number, at: number, music: boolean) {
    const c = this.ctx, bus = music ? this.musicBus : this.sfxBus;
    if (!c || !bus) return;
    if (!this.noiseBuffer) {
      this.noiseBuffer = c.createBuffer(1, Math.ceil(c.sampleRate * .5), c.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = c.createBufferSource(), filter = c.createBiquadFilter(), envelope = c.createGain();
    source.buffer = this.noiseBuffer; filter.type = 'highpass'; filter.frequency.value = cutoff;
    envelope.gain.setValueAtTime(gain, at); envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    source.connect(filter); filter.connect(envelope); envelope.connect(bus);
    this.retain(source, envelope, music, [filter]); source.start(at); source.stop(at + duration);
  }

  private musicVoice(note: MusicEvent, at: number, quarter: number) {
    const duration = Math.max(.025, note.beats * quarter), track = tracks[this.track];
    if (note.instrument === 'kick') this.oscillator(145, duration, 'sine', note.gain, at, true, 39);
    else if (note.instrument === 'snare') {
      this.noiseAt(duration, note.gain, 1500, at, true);
      this.oscillator(185, duration * .7, 'triangle', note.gain * .4, at, true, 80);
    } else if (note.instrument === 'hat') this.noiseAt(duration, note.gain, 7200, at, true);
    else if (note.midi !== undefined) {
      this.oscillator(midiFrequency(note.midi), duration, note.instrument === 'lead' ? track.wave : note.instrument === 'bass' ? 'triangle' : 'sine', note.gain, at, true, undefined,
        note.instrument === 'lead' ? track.cutoff : note.instrument === 'bass' ? 700 : 1400, note.instrument === 'pad');
    }
  }

  tone(freq: number, duration = .12, type: OscillatorType = 'sine', gain = .15, end?: number, delay = 0) {
    if (save.muted || !this.ctx || document.hidden) return;
    this.refreshSettings(); this.oscillator(freq, Math.max(.025, duration), type, gain, this.ctx.currentTime + delay, false, end);
  }
  private noise(duration: number, gain: number, cutoff = 900) {
    if (save.muted || !this.ctx || document.hidden) return;
    this.refreshSettings(); this.noiseAt(duration, gain, cutoff, this.ctx.currentTime, false);
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

  mute() { save.muted = !save.muted; this.refreshSettings(); persist(); }
}

export const sound = new Sound();
