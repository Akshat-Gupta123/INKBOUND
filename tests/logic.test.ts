import {describe,it,expect} from 'vitest';
import {levels,availableTools,gestureValid} from '../src/levels';
describe('the twelve-page campaign',()=>{
 it('has three named pages in each chapter and valid exits',()=>{expect(levels).toHaveLength(12);for(let c=0;c<4;c++)expect(levels.filter(l=>l.chapter===c)).toHaveLength(3);for(const l of levels){expect(l.fragments).toHaveLength(3);expect(l.exit.x).toBeLessThan(l.width);expect(l.platforms.some(p=>l.exit.x>=p.x&&l.exit.x<=p.x+p.w&&Math.abs(p.y-(l.exit.y+70))<90)).toBe(true);}});
 it('introduces tools before requiring them and gives every edit a reachable rail',()=>{levels.forEach((l,i)=>{for(const d of l.edits){expect(availableTools(i)).toContain(d.tool);if(d.tool!=='stroke')expect(Math.abs(d.dx??0)+Math.abs(d.dy??0)).toBeGreaterThan(0);if(d.plate)expect(l.plate).toBeDefined();}expect(l.edits.length).toBeLessThanOrEqual(6);});});
 it('accepts a click for every tool, detects directional drags and rough circles',()=>{for(const tool of ['stroke','arrow','loop'] as const)expect(gestureValid(tool,[{x:1,y:1}])).toBe(true);expect(gestureValid('arrow',Array.from({length:10},(_,x)=>({x:x*10,y:0})))).toBe(true);const circle=Array.from({length:32},(_,n)=>({x:Math.cos(n/31*Math.PI*2)*60,y:Math.sin(n/31*Math.PI*2)*60}));expect(gestureValid('loop',circle)).toBe(true);expect(gestureValid('loop',Array.from({length:10},(_,x)=>({x:x*10,y:0})))).toBe(false);});
});
// A geometry guard for authored routes, independent of the scene implementation.
// It checks reachability at full jump height and speed, including both rail endpoints.
describe('authored traversal envelope',()=>{
 it('connects the spawn to every exit and optional fragment',()=>{
  for(const l of levels){
   const nodes=l.platforms.map(p=>({...p,rail:''}));for(const d of l.edits){nodes.push({...d,rail:d.tool==='stroke'?'':d.id});if(d.tool!=='stroke')nodes.push({...d,x:d.x+(d.dx??0),y:d.y+(d.dy??0),rail:d.id});}
   const reached=new Set([0]);let changed=true;while(changed){changed=false;for(const i of [...reached])for(let j=0;j<nodes.length;j++){if(reached.has(j))continue;const a=nodes[i],b=nodes[j],dy=b.y-a.y,disc=730**2+2*1650*dy,gap=Math.max(0,b.x-a.x-a.w,a.x-b.x-b.w);if((a.rail&&a.rail===b.rail)||(disc>=0&&gap<330*(730+Math.sqrt(disc))/1650+12)){reached.add(j);changed=true;}}}
   expect([...reached].some(i=>{const n=nodes[i];return l.exit.x>=n.x&&l.exit.x<=n.x+n.w&&Math.abs(n.y-l.exit.y-70)<90;}),l.name+' exit').toBe(true);
   for(const f of l.fragments)expect([...reached].some(i=>{const n=nodes[i];return Math.max(n.x-f.x,f.x-n.x-n.w,0)<150&&n.y-29-f.y<200;}),l.name+' fragment '+f.x).toBe(true);
  }
 });
});
