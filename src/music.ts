/** Original arrangements. Sixteenth-note events repeat after sixteen bars. */
export type Instrument = 'lead' | 'bass' | 'pad' | 'kick' | 'snare' | 'hat';
export type MusicEvent = { instrument: Instrument; midi?: number; beats: number; gain: number };
export const tracks = [
  { name: 'Vector Bloom', bpm: 124, root: 48, wave: 'triangle' as OscillatorType, cutoff: 3400, melody: [0, 2, 1, 3, 2, 4, 3, 1] },
  { name: 'Chrome Circuit', bpm: 142, root: 45, wave: 'sawtooth' as OscillatorType, cutoff: 2100, melody: [0, 0, 2, 1, 3, 2, 4, 2] },
  { name: 'Prism Run', bpm: 158, root: 50, wave: 'triangle' as OscillatorType, cutoff: 4200, melody: [3, 2, 4, 1, 2, 0, 3, 4] },
  { name: 'Terminal Velocity', bpm: 174, root: 47, wave: 'square' as OscillatorType, cutoff: 1850, melody: [0, 2, 3, 1, 4, 3, 2, 4] },
];
export const midiFrequency = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export function musicStep(trackIndex: number, absoluteStep: number, menu = false): MusicEvent[] {
  const index = ((trackIndex % tracks.length) + tracks.length) % tracks.length;
  const track = tracks[index], step = ((absoluteStep % 256) + 256) % 256;
  const bar = Math.floor(step / 16), beat = step % 16;
  const chordIndex = Math.floor(bar / 2) % 4;
  const root = track.root + [0, 8, 3, 10][chordIndex];
  const third = chordIndex === 0 ? 3 : 4;
  const chord = [0, third, 7, 12, third + 12, 19];
  const intro = bar < 4, breakdown = bar >= 8 && bar < 12, build = bar >= 12;
  const notes: MusicEvent[] = [];
  if (beat === 0) for (const interval of chord.slice(0, 3)) notes.push({ instrument: 'pad', midi: root + interval, beats: 3.8, gain: .025 });
  if (beat % 4 === 0 || (!intro && !breakdown && beat % 4 === 2)) {
    const octave = beat === 14 || (index === 1 && beat === 6) ? 0 : -12;
    notes.push({ instrument: 'bass', midi: root + octave + (beat === 10 ? 7 : 0), beats: .4, gain: .13 });
  }
  if (beat % 2 === 0 && (!intro || beat % 4 === 0)) {
    const motif = track.melody[(Math.floor(beat / 2) + (bar % 2 ? 2 : 0)) % 8];
    const interval = chord[motif];
    if (!(breakdown && beat > 8)) notes.push({ instrument: 'lead', midi: root + 12 + interval, beats: breakdown ? .7 : .32, gain: menu ? .055 : .085 });
  }
  if (build && (beat === 13 || beat === 15)) notes.push({ instrument: 'lead', midi: root + 24 + third, beats: .15, gain: .045 });
  if (!menu) {
    if (!breakdown && (beat === 0 || beat === 8 || (index >= 1 && beat === 10))) notes.push({ instrument: 'kick', beats: .35, gain: .3 });
    if (!intro && !breakdown && (beat === 4 || beat === 12)) notes.push({ instrument: 'snare', beats: .24, gain: .13 });
    if ((!intro || bar % 2 === 1) && beat % (breakdown ? 4 : 2) === 0) notes.push({ instrument: 'hat', beats: .08, gain: beat % 4 === 2 ? .035 : .022 });
    if (build && bar % 4 === 3 && beat >= 12) notes.push({ instrument: 'snare', beats: .12, gain: .04 + (beat - 12) * .018 });
  } else if (beat === 0 || beat === 8) notes.push({ instrument: 'kick', beats: .2, gain: .06 });
  return notes;
}
