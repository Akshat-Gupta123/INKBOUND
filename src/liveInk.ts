import Phaser from 'phaser';
import { planInk, type Point, type InkPlan } from './inkGeometry';
import type { Tool } from './levels';
import type { Player } from './player';
import { sound } from './audio';
import { save } from './save';
export type LiveDrawing = { plan: InkPlan; art: Phaser.GameObjects.Graphics; bodies: Phaser.Physics.Arcade.Image[]; colliders: Phaser.Physics.Arcade.Collider[]; age: number; launchCooldown: number };
const colors = { stroke: 0xd8ed62, arrow: 0xff7055, loop: 0x6cdbea };
export class LiveInk {
  drawings: LiveDrawing[] = [];
  constructor(private scene: Phaser.Scene, private player: Player) {}
  create(tool: Tool, points: Point[]) {
    const plan = planInk(tool, points, this.player.visual.flipX ? -1 : 1);
    if (!plan) return false;
    const drawing: LiveDrawing = { plan, art: this.scene.add.graphics().setDepth(7), bodies: [], colliders: [], age: 0, launchCooldown: 0 };
    for (const p of plan.platforms) {
      const body = this.scene.physics.add.staticImage(p.x + p.w / 2, p.y + p.h / 2, 'dot').setVisible(false).setDisplaySize(p.w, p.h).refreshBody();
      drawing.bodies.push(body);
      drawing.colliders.push(this.scene.physics.add.collider(this.player.sprite, body, undefined, () => {
        const b = this.player.sprite.body as Phaser.Physics.Arcade.Body;
        return b.velocity.y >= 0 && b.prev.y + b.height <= p.y + 12;
      }));
    }
    this.drawings.push(drawing);
    if (this.drawings.length > 5) this.remove(this.drawings[0]);
    sound.play('draw');
    return true;
  }
  containsStasis(x: number, y: number) { return this.drawings.some(d => d.plan.tool === 'loop' && Math.hypot(x - d.plan.center.x, y - d.plan.center.y) < d.plan.radius); }
  update(dt: number) {
    for (const d of [...this.drawings]) {
      d.age += dt; d.launchCooldown -= dt;
      if (d.age >= d.plan.lifetime) { this.remove(d); continue; }
      const { plan: p, art: g } = d, life = 1 - d.age / p.lifetime;
      g.clear();
      const pulse = !save.reduced && life < .25 ? .45 + Math.sin(d.age * .025) * .25 : 1;
      g.setAlpha(pulse);
      if (p.tool === 'stroke') {
        g.lineStyle(10, colors.stroke, .12).strokePoints(p.points);
        g.lineStyle(3, colors.stroke).strokePoints(p.points);
        for (let i = 0; i < p.points.length - 1; i++) {
          const a = p.points[i], b = p.points[i + 1];
          g.lineStyle(1, 0xffffff, .45).lineBetween(a.x, a.y - 3, b.x, b.y - 3);
        }
      } else if (p.tool === 'arrow') {
        const a = p.points[0], b = p.points[p.points.length - 1], angle = Math.atan2(b.y - a.y, b.x - a.x);
        g.lineStyle(18, colors.arrow, .12).lineBetween(a.x, a.y, b.x, b.y);
        g.lineStyle(3, colors.arrow).lineBetween(a.x, a.y, b.x, b.y);
        for (let i = 0; i < 4; i++) {
          const t = ((d.age / 450 + i / 4) % 1), x = Phaser.Math.Linear(a.x, b.x, t), y = Phaser.Math.Linear(a.y, b.y, t);
          g.lineBetween(x, y, x - Math.cos(angle - .65) * 12, y - Math.sin(angle - .65) * 12);
          g.lineBetween(x, y, x - Math.cos(angle + .65) * 12, y - Math.sin(angle + .65) * 12);
        }
        const pos = this.player.sprite, vx = b.x - a.x, vy = b.y - a.y;
        const t = Phaser.Math.Clamp(((pos.x - a.x) * vx + (pos.y - a.y) * vy) / (vx * vx + vy * vy), 0, 1);
        if (d.launchCooldown <= 0 && Math.hypot(pos.x - a.x - vx * t, pos.y - a.y - vy * t) < 48) {
          this.player.launch(p.velocity.x, p.velocity.y, 220); d.launchCooldown = 650; sound.play('launch');
        }
      } else {
        g.fillStyle(colors.loop, .075).fillCircle(p.center.x, p.center.y, p.radius);
        g.lineStyle(2, colors.loop, .9).strokeCircle(p.center.x, p.center.y, p.radius);
        g.lineStyle(1, colors.loop, .35).strokeCircle(p.center.x, p.center.y, p.radius * (.55 + Math.sin(d.age * .008) * .08));
        for (let n = 0; n < 3; n++) {
          const a = d.age * .002 + n * Math.PI * 2 / 3;
          g.fillStyle(colors.loop).fillCircle(p.center.x + Math.cos(a) * p.radius, p.center.y + Math.sin(a) * p.radius, 3);
        }
      }
      g.lineStyle(2, colors[p.tool], .5).lineBetween(p.center.x - 25, p.center.y + 20, p.center.x - 25 + 50 * life, p.center.y + 20);
    }
  }
  remove(d: LiveDrawing) { d.colliders.forEach(c => c.destroy()); d.bodies.forEach(b => b.destroy()); d.art.destroy(); this.drawings = this.drawings.filter(x => x !== d); }
  clear() { for (const d of [...this.drawings]) this.remove(d); }
}
