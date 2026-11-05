import { describe, it, expect } from 'vitest';
import { tracks, musicStep, midiFrequency } from '../src/music';

describe('original sixteen-bar music arrangements', () => {
  it('has four distinct full arrangements with melody, bass, chords and drums', () => {
    expect(tracks).toHaveLength(4);
    const arrangements = tracks.map((_, track) => Array.from({length:256}, (_, step) => musicStep(track, step)));
    expect(new Set(arrangements.map(a => JSON.stringify(a))).size).toBe(4);
    for (const arrangement of arrangements) {
      const events = arrangement.flat();
      expect(new Set(events.map(e => e.instrument))).toEqual(new Set(['pad','bass','lead','kick','snare','hat']));
      expect(new Set(events.filter(e=>e.instrument==='lead').map(e=>e.midi)).size).toBeGreaterThan(8);
      for(const event of events){expect(event.beats).toBeGreaterThan(0);expect(event.gain).toBeLessThanOrEqual(.3);if(event.midi!==undefined){expect(midiFrequency(event.midi)).toBeGreaterThan(40);expect(midiFrequency(event.midi)).toBeLessThan(2400);}}
    }
  });
  it('repeats exactly after sixteen bars and changes arrangement in the breakdown', () => {
    for(let track=0;track<4;track++){
      expect(musicStep(track,256)).toEqual(musicStep(track,0));
      expect(musicStep(track,4*16).some(n=>n.instrument==='kick')).toBe(true);
      expect(musicStep(track,8*16).some(n=>n.instrument==='kick')).toBe(false);
      expect(musicStep(track,15*16+15).some(n=>n.instrument==='snare')).toBe(true);
    }
  });
  it('keeps the level picker melodic and lighter than gameplay', () => {
    const notes=Array.from({length:256},(_,n)=>musicStep(0,n,true)).flat();
    expect(notes.some(n=>n.instrument==='lead')).toBe(true);expect(notes.some(n=>n.instrument==='pad')).toBe(true);
    expect(notes.some(n=>n.instrument==='snare'||n.instrument==='hat')).toBe(false);
  });
});
