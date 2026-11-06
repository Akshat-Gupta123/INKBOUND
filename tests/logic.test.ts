import { describe, it, expect } from 'vitest';
import { levels, originalCount, levelOrder, tutorialLevel, difficulties, availableTools, gestureValid } from '../src/levels';
import originals from './fixtures/overdrive-originals.json';

describe('the original Overdrive courses and their remixes', () => {
  it('has the full difficulty range, unique themes and valid finish platforms', () => {
    expect(levels).toHaveLength(104);
    const counts = {Normal:16,Hard:32,Insane:32,Extreme:24};
    for (const difficulty of difficulties) expect(levels.filter(l => l.difficulty === difficulty)).toHaveLength(counts[difficulty]);
    expect(new Set(levels.map(l => l.color)).size).toBe(104);
    expect(new Set(levels.map(l => l.name)).size).toBe(104);
    expect(new Set(levels.map(l => JSON.stringify(l.platforms))).size).toBe(104);
    for (const level of levels) {
      expect(level.fragments).toHaveLength(3);
      expect(level.color).toBeGreaterThan(0);
      expect(level.color).toBeLessThanOrEqual(0xffffff);
      expect(level.music).toBeGreaterThanOrEqual(0);
      expect(level.music).toBeLessThan(4);
      expect(level.gate).toBeUndefined();
      expect(level.plate).toBeUndefined();
      expect(level.par).toBeGreaterThan(level.width / 540);
      expect(level.par).toBeLessThanOrEqual(40);
      expect(level.exit.x).toBeLessThan(level.width);
      expect(level.platforms.some(p => level.exit.x >= p.x && level.exit.x <= p.x + p.w && Math.abs(p.y - level.exit.y - 70) < 30), level.name).toBe(true);
    }
  });

  it('provides a separate safe practice arena without changing ranked indices', () => {
    expect(levels).not.toContain(tutorialLevel);
    expect(tutorialLevel.name).toBe('Mechanics Lab');
    expect(tutorialLevel.hazards).toHaveLength(0);
    expect(tutorialLevel.platforms[0]).toMatchObject({x:0,w:1600,y:610});
    expect(new Set(tutorialLevel.edits.map(d => d.tool)).size).toBe(3);
    expect(tutorialLevel.sweepers[0]).toMatchObject({x:850,y:490,dx:160,period:4000});
    expect(tutorialLevel.checkpoint.x).toBe(730);
  });

  it('preserves all twelve original layouts exactly, under new names', () => {
    expect(originalCount).toBe(12);
    expect(originals.commit).toBe('d6756a3');
    expect(originals.levels).toHaveLength(originalCount);
    for (const [index, original] of originals.levels.entries()) {
      const {name, ...geometry} = original;
      const restored = levels[index];
      expect(restored.name).not.toBe(name);
      expect(restored.source).toBeUndefined();
      const actual = Object.fromEntries(Object.keys(geometry).map(key => [key, restored[key as keyof typeof restored]]));
      expect(JSON.parse(JSON.stringify(actual)), restored.name + ' authentic layout').toEqual(geometry);
    }
    expect(levelOrder).toEqual(Array.from({length:104}, (_,i) => i));
  });

  it('gives every original a distinct, closely related remix with more hazard pressure', () => {
    const remixes = levels.slice(originalCount, 24);
    expect(remixes).toHaveLength(12);
    expect(remixes.map(l => l.source)).toEqual(Array.from({length:12}, (_,i) => i));
    for(const level of remixes) {
      const source = levels[level.source!];
      expect(level.difficulty).toBe(source.difficulty);
      expect(level.platforms).not.toEqual(source.platforms);
      expect(level.platforms.length).toBe(source.platforms.length);
      expect(level.edits.map(d => d.tool)).toEqual(source.edits.map(d => d.tool));
      expect(level.sweepers.length).toBeGreaterThan(source.sweepers.length);
      expect(level.hazards.length).toBeGreaterThanOrEqual(source.hazards.length);
      expect(level.width).toBeGreaterThan(source.width);
      expect(level.width).toBeLessThanOrEqual(source.width + 400);
      expect(level.platforms[0].w).toBeLessThanOrEqual(source.platforms[0].w);
      expect(new Set(level.platforms.map(p => p.y)).size).toBeGreaterThanOrEqual(3);
    }
  });

  it('unlocks the full sketch kit immediately and gives every moving edit a valid rail', () => {
    levels.forEach((level, index) => {
      expect(availableTools(index)).toEqual(['stroke', 'arrow', 'loop']);
      expect(new Set(level.edits.map(d => d.id)).size).toBe(level.edits.length);
      for (const drawing of level.edits) {
        if (drawing.tool !== 'stroke') expect(Math.abs(drawing.dx ?? 0) + Math.abs(drawing.dy ?? 0)).toBeGreaterThan(0);
        expect(drawing.x).toBeGreaterThanOrEqual(0);
        expect(drawing.x + drawing.w + (drawing.dx ?? 0)).toBeLessThanOrEqual(level.width);
        if (drawing.duration) expect(drawing.duration).toBeGreaterThanOrEqual(2500);
      }
      expect(level.edits.length).toBeLessThanOrEqual(6);
    });
  });

  it('places moving threats on every stage and keeps spawn/checkpoint positions out of their swept paths', () => {
    for (const level of levels) {
      expect(level.sweepers.length).toBeGreaterThanOrEqual(2);
      for (const saw of level.sweepers) {
        expect(saw.period).toBeGreaterThanOrEqual(1200);
        expect(saw.r).toBeGreaterThanOrEqual(20);
        const dx = saw.dx ?? 0, dy = saw.dy ?? 0;
        expect(Math.hypot(dx, dy)).toBeGreaterThan(0);
        expect(saw.x + dx + saw.r).toBeLessThan(level.width);
        for (const safe of [{ x: 130, y: 550 }, level.checkpoint]) {
          const t = Math.max(0, Math.min(1, ((safe.x - saw.x) * dx + (safe.y - saw.y) * dy) / (dx * dx + dy * dy)));
          const distance = Math.hypot(safe.x - saw.x - dx * t, safe.y - saw.y - dy * t);
          expect(distance, level.name + ' safe spawn').toBeGreaterThan(saw.r + 45);
        }
      }
      for (const safe of [{ x: 130, y: 550 }, level.checkpoint]) {
        expect(level.platforms.some(p => safe.x - 17 >= p.x && safe.x + 17 <= p.x + p.w && p.y >= safe.y + 29 && p.y - safe.y <= 70), level.name + ' stable respawn floor').toBe(true);
        for (const h of level.hazards) {
          expect(safe.x + 17 < h.x || safe.x - 17 > h.x + h.w || safe.y + 29 < h.y || safe.y - 19 > h.y + h.h, level.name + ' respawn hazard').toBe(true);
        }
      }
    }
  });

  it('accepts quick clicks, directional drags and rough circles without requiring exact tracing', () => {
    for (const tool of ['stroke', 'arrow', 'loop'] as const) expect(gestureValid(tool, [{ x: 1, y: 1 }])).toBe(true);
    expect(gestureValid('arrow', Array.from({ length: 10 }, (_, x) => ({ x: x * 10, y: 0 })))).toBe(true);
    const circle = Array.from({ length: 32 }, (_, n) => ({ x: Math.cos(n / 31 * Math.PI * 2) * 60, y: Math.sin(n / 31 * Math.PI * 2) * 60 }));
    expect(gestureValid('loop', circle)).toBe(true);
    expect(gestureValid('loop', Array.from({ length: 10 }, (_, x) => ({ x: x * 10, y: 0 })))).toBe(false);
  });
});

// This guards authored geometry, not obstacle timing or complete playthroughs.
// Rails connect both endpoints; regular jump arcs use the actual action movement envelope.
describe('authored traversal envelope', () => {
  it('connects the starting floor to every exit and optional fragment without requiring freeform platforms', () => {
    for (const level of levels) {
      const nodes = level.platforms.map(p => ({ ...p, rail: '' }));
      for (const d of level.edits) {
        nodes.push({ ...d, rail: d.tool === 'stroke' ? '' : d.id });
        if (d.tool !== 'stroke') nodes.push({ ...d, x: d.x + (d.dx ?? 0), y: d.y + (d.dy ?? 0), rail: d.id });
      }
      const reached = new Set([0]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const i of [...reached]) for (let j = 0; j < nodes.length; j++) {
          if (reached.has(j)) continue;
          const a = nodes[i], b = nodes[j], dy = b.y - a.y;
          const discriminant = 800 ** 2 + 2 * 1650 * dy;
          const gap = Math.max(0, b.x - a.x - a.w, a.x - b.x - b.w);
          if ((a.rail && a.rail === b.rail) || (discriminant >= 0 && gap < 540 * (800 + Math.sqrt(discriminant)) / 1650 + 12)) {
            reached.add(j); changed = true;
          }
        }
      }
      expect([...reached].some(i => { const n = nodes[i]; return level.exit.x >= n.x && level.exit.x <= n.x + n.w && Math.abs(n.y - level.exit.y - 70) < 30; }), level.name + ' exit').toBe(true);
      for (const f of level.fragments) expect([...reached].some(i => { const n = nodes[i]; return Math.max(n.x - f.x, f.x - n.x - n.w, 0) < 150 && n.y - 29 - f.y < 220; }), level.name + ' fragment ' + f.x).toBe(true);
    }
  });
});
