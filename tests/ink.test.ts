import { describe, expect, it } from 'vitest';
import { planInk } from '../src/inkGeometry';
import { practiceRules } from '../src/rules';
describe('freehand live ink', () => {
  it('gives practice time to learn while regular tools demand immediate use', () => {
    for(const [tool,lifetime,practice] of [['stroke',1100,3600],['arrow',1000,4300],['loop',700,3000]] as const){
      expect(planInk(tool,[{x:200,y:400}])!.lifetime).toBe(lifetime);
      expect(planInk(tool,[{x:200,y:400}],1,practiceRules)!.lifetime).toBe(practice);
    }
  });
  it('turns a drawn slope into connected physical steps', () => {
    const plan = planInk('stroke', [{x:100,y:500},{x:300,y:410}])!;
    expect(plan.platforms.length).toBeGreaterThan(8);
    expect(plan.platforms[0].y).toBeGreaterThan(plan.platforms.at(-1)!.y);
    for(let i=1;i<plan.platforms.length;i++)expect(plan.platforms[i].x).toBeLessThanOrEqual(plan.platforms[i-1].x+plan.platforms[i-1].w);
    expect(plan.lifetime).toBe(1100);
  });
  it('caps sketch reach and rejects invalid geometry', () => {
    const p=planInk('stroke',[{x:0,y:500},{x:3000,y:500}])!;
    expect(p.points.at(-1)!.x).toBe(260);
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
