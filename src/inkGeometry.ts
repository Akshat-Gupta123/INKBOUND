import type { Tool, Rect } from './levels';
import { runRules, type RunRules } from './rules';
export type Point = { x: number; y: number };
export type InkPlan = { tool: Tool; points: Point[]; center: Point; radius: number; velocity: Point; platforms: Rect[]; lifetime: number };
export const INK_COST = 1;
export function planInk(tool: Tool, raw: Point[], facing = 1, rules: RunRules = runRules): InkPlan | null {
  if (!raw.length || raw.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return null;
  const points: Point[] = [{ ...raw[0] }];
  let length = 0;
  for (const p of raw.slice(1)) {
    const a = points[points.length - 1], d = Math.hypot(p.x - a.x, p.y - a.y);
    if (d < 6) continue;
    const take = Math.min(d, rules.maxLength - length);
    points.push({ x: a.x + (p.x - a.x) * take / d, y: a.y + (p.y - a.y) * take / d });
    length += take;
    if (length >= rules.maxLength) break;
  }
  if (length < 20) {
    const p = points[0];
    if (tool === 'stroke') points.splice(0, points.length, { x: p.x - rules.clickWidth / 2, y: p.y }, { x: p.x + rules.clickWidth / 2, y: p.y });
    if (tool === 'arrow') points.push({ x: p.x + facing * 100, y: p.y - 55 });
  }
  const first = points[0], last = points[points.length - 1];
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const center = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
  const platforms: Rect[] = [];
  if (tool === 'stroke') {
    if (Math.max(...xs) - Math.min(...xs) < 40) return null;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 22));
      for (let j = 0; j < count; j++) {
        const x1 = a.x + (b.x - a.x) * j / count, x2 = a.x + (b.x - a.x) * (j + 1) / count;
        const y = a.y + (b.y - a.y) * (j + .5) / count;
        platforms.push({ x: Math.min(x1, x2) - 3, y, w: Math.max(10, Math.abs(x2 - x1) + 6), h: 8 });
      }
    }
  }
  const dx = last.x - first.x, dy = last.y - first.y, distance = Math.hypot(dx, dy) || 1;
  return { tool, points, center, platforms, radius: Math.min(115, Math.max(65, Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2)), velocity: { x: dx / distance * 1050, y: dy / distance * 1050 }, lifetime: tool === 'stroke' ? rules.strokeLifetime : tool === 'arrow' ? rules.arrowLifetime : rules.loopLifetime };
}
