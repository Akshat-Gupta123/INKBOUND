import { describe, expect, it } from 'vitest';
import { planInk } from '../src/inkGeometry';
describe('freehand live ink', () => {
  it('turns a drawn slope into connected physical steps', () => {
    const plan = planInk('stroke', [{x:100,y:500},{x:300,y:410}])!;
    expect(plan.platforms.length).toBeGreaterThan(8);
    expect(plan.platforms[0].y).toBeGreaterThan(plan.platforms.at(-1)!.y);
    for(let i=1;i<plan.platforms.length;i++)expect(plan.platforms[i].x).toBeLessThanOrEqual(plan.platforms[i-1].x+plan.platforms[i-1].w);
    expect(plan.lifetime).toBe(3600);
  });
  it('caps sketch reach and rejects invalid geometry', () => {
    const p=planInk('stroke',[{x:0,y:500},{x:3000,y:500}])!;
    expect(p.points.at(-1)!.x).toBe(420);
    expect(planInk('stroke',[{x:100,y:500},{x:100,y:100}])).toBeNull();
    expect(planInk('stroke',[{x:NaN,y:500}])).toBeNull();
  });
  it('preserves Arrow direction and supports fast click shortcuts', () => {
    const p=planInk('arrow',[{x:100,y:500},{x:0,y:400}])!;
    expect(p.velocity.x).toBeLessThan(-700);expect(p.velocity.y).toBeLessThan(-700);
    expect(planInk('stroke',[{x:200,y:400}])!.platforms.length).toBeGreaterThan(1);
    expect(planInk('loop',[{x:200,y:400}])!.radius).toBe(65);
  });
});
