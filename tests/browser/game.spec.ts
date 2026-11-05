import { test, expect, type Page } from '@playwright/test';
import { levels } from '../../src/levels';
async function scene(page:Page,fn:string,arg?:unknown){return page.evaluate(({fn,arg})=>new Function('s','arg',fn)((window as any).inkbound.scene.getScene('Book'),arg),{fn,arg});}
async function start(page:Page,index=0){await page.goto('/');await page.getByRole('button',{name:'Select stage',exact:true}).click();await page.locator('.level-button').nth(index).click();await expect(page.locator('.hud h3')).toHaveText(levels[index].name);}
async function worldPoint(page:Page,x:number,y:number){return page.evaluate(({x,y})=>{const c=(window as any).inkbound.scene.getScene('Book').cameras.main,r=document.querySelector('canvas')!.getBoundingClientRect();return {x:r.x+(x-c.scrollX)*r.width/1280,y:r.y+(y-c.scrollY)*r.height/720};},{x,y});}
async function draw(page:Page,points:{x:number;y:number}[]){const a=await worldPoint(page,points[0].x,points[0].y);await page.mouse.move(a.x,a.y);await page.mouse.down();for(const point of points.slice(1)){const p=await worldPoint(page,point.x,point.y);await page.mouse.move(p.x,p.y,{steps:5});}await page.mouse.up();}

test('fast keyboard movement, air dash, pause, and all tools available immediately',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 await expect(page.locator('.tool:disabled')).toHaveCount(0);await expect.poll(()=>scene(page,'return s.player.sprite.body.blocked.down')).toBe(true);
 await page.keyboard.down('d');await expect.poll(()=>scene(page,'return s.player.sprite.body.velocity.x'),{intervals:[20]}).toBeGreaterThan(500);
 await page.keyboard.down('Space');await expect.poll(()=>scene(page,'return s.player.sprite.body.velocity.y'),{intervals:[20]}).toBeLessThan(-500);await page.keyboard.up('Space');
 await page.keyboard.down('Shift');await expect.poll(()=>scene(page,'return s.player.isDashing'),{intervals:[10]}).toBe(true);expect(await scene(page,'return s.player.sprite.body.velocity.x')).toBeGreaterThan(900);await page.keyboard.up('Shift');await page.keyboard.up('d');
 await page.keyboard.press('Escape');await expect(page.getByText('RUN PAUSED',{exact:true})).toBeVisible();const x=await scene(page,'return s.player.sprite.x');await page.waitForTimeout(120);expect(await scene(page,'return s.player.sprite.x')).toBe(x);await page.getByRole('button',{name:'Resume run'}).click();await page.keyboard.press('e');expect(await scene(page,'return s.physics.world.timeScale')).toBe(1);expect(errors).toEqual([]);
});

test('mouse-drawn slope has real collision, expires, and ink regenerates',async({page})=>{
 await start(page);await draw(page,[{x:350,y:400},{x:540,y:400}]);
 expect(await scene(page,'return s.liveInk.drawings.length')).toBe(1);
 expect(await scene(page,'return s.liveInk.drawings[0].bodies.length')).toBeGreaterThan(2);
 await scene(page,'s.player.teleport(440,300)');await expect.poll(()=>scene(page,'return Math.round(s.player.sprite.body.bottom)'),{intervals:[30]}).toBe(400);
 expect(await scene(page,'return s.player.sprite.body.blocked.down')).toBe(true);
 await expect.poll(()=>scene(page,'return s.liveInk.drawings.length'),{timeout:5000}).toBe(0);
 await expect.poll(()=>scene(page,'return s.ink')).toBe(6);
});

test('a free Arrow launches the player and a Loop actually freezes moving threats',async({page})=>{
 await start(page);await page.keyboard.press('2');await expect.poll(()=>scene(page,'return s.player.sprite.body.blocked.down')).toBe(true);
 await draw(page,[{x:130,y:580},{x:330,y:440}]);await expect.poll(()=>scene(page,'return s.player.sprite.body.velocity.x'),{intervals:[15]}).toBeGreaterThan(700);
 await scene(page,'s.player.teleport(130,550);s.liveInk.clear();const z=s.sweepers[0];s.player.teleport(z.x-160,z.y);s.drawFree("loop",[{x:z.x,y:z.y}]);');
 await expect.poll(()=>scene(page,'return s.sweepers[0].frozen')).toBe(true);
 const t=await scene(page,'return s.sweepers[0].elapsed');await page.waitForTimeout(180);expect(await scene(page,'return s.sweepers[0].elapsed')).toBe(t);
 await scene(page,'s.liveInk.clear()');await expect.poll(()=>scene(page,'return s.sweepers[0].elapsed')).toBeGreaterThan(t);
});

test('saws punish contact, fast respawns refill ink, dash breaks a saw',async({page})=>{
 await start(page);await scene(page,'const z=s.sweepers[0];s.player.teleport(z.x,z.y);');await expect.poll(()=>scene(page,'return s.runDeaths')).toBe(1);
 expect(await scene(page,'return s.player.sprite.x')).toBeLessThan(200);expect(await scene(page,'return s.ink')).toBe(6);
 await page.waitForTimeout(480);await scene(page,'const z=s.sweepers[0];s.player.teleport(z.x,z.y);');await page.keyboard.down('Shift');
 await expect.poll(()=>scene(page,'return s.sweepers[0].disabled'),{intervals:[10]}).toBeGreaterThan(1000);await page.keyboard.up('Shift');
 await page.keyboard.press('r');expect(await scene(page,'return s.liveInk.drawings.length')).toBe(0);
});

test('every stage has hazards, its exit works, completion and settings persist',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 // Integration coverage of exit/save/ending; positioning is deliberate, not a full playthrough.
 for(let i=0;i<12;i++){await scene(page,'s.start(arg.i);s.player.teleport(arg.x,arg.y);',{i,x:levels[i].exit.x,y:levels[i].exit.y+10});await expect.poll(()=>scene(page,'return s.finished')).toBe(true);expect(await scene(page,'return s.sweepers.length')).toBeGreaterThan(0);}
 await expect(page.getByText('ERASER OFFLINE',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Continue →',exact:true}).click();await expect(page.getByText('RUN COMPLETE',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Credits →'}).click();await expect(page.locator('.sheet')).toContainText('INKBOUND');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('inkbound-v1')!).completed.length)).toBe(12);await page.reload();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('inkbound-v1')!).completed.length)).toBe(12);expect(errors).toEqual([]);
});
