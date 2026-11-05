import { describe, it, expect } from 'vitest';
import { levels, tutorialLevel, difficulties, availableTools, gestureValid } from '../src/levels';

describe('the twenty-level arcade catalogue', () => {
  it('has four levels per difficulty, unique themes and valid finish platforms', () => {
    expect(levels).toHaveLength(20);
    for (const difficulty of difficulties) expect(levels.filter(l => l.difficulty === difficulty)).toHaveLength(4);
    expect(new Set(levels.map(l => l.color)).size).toBe(20);
    expect(new Set(levels.map(l => l.name)).size).toBe(20);
    expect(new Set(levels.map(l => JSON.stringify(l.platforms))).size).toBe(20);
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

  it('gives Easy stages wider margins and slower, fewer moving threats', () => {
    for(const level of levels.filter(l => l.difficulty === 'Easy')) {
      expect(level.sweepers.length).toBeLessThanOrEqual(1);
      expect(level.sweepers.every(s => s.period >= 3000)).toBe(true);
      expect(level.hazards.length).toBeLessThanOrEqual(1);
      expect(level.hazards.every(h => h.w <= 65)).toBe(true);
      expect(level.platforms.filter(p => p.y === 610).every(p => p.w >= 500)).toBe(true);
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
      expect(level.sweepers.length).toBeGreaterThan(0);
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
      for (const h of level.hazards) {
        const checkpoint = level.checkpoint;
        expect(checkpoint.x + 17 < h.x || checkpoint.x - 17 > h.x + h.w || checkpoint.y + 29 < h.y || checkpoint.y - 19 > h.y + h.h, level.name + ' checkpoint hazard').toBe(true);
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
