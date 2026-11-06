import { test, expect, type Page } from '@playwright/test';
import { levels, difficulties, levelOrder } from '../../src/levels';
async function scene(page:Page,fn:string,arg?:unknown){return page.evaluate(({fn,arg})=>new Function('s','arg',fn)((window as any).inkbound.scene.getScene('Book'),arg),{fn,arg});}
async function start(page:Page,index=0){await page.goto('./');await page.locator(`.level-button[data-level-index="${index}"]`).click();await page.locator('#play-level').click();await expect(page.locator('.hud h3')).toHaveText(levels[index].name);}
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
 await expect.poll(()=>scene(page,'return s.sweepers[0].disabled'),{intervals:[10]}).toBeGreaterThan(1400);await page.keyboard.up('Shift');
 await page.keyboard.press('r');expect(await scene(page,'return s.liveInk.drawings.length')).toBe(0);
});

test('all 104 courses finish and unlock the final poem only after the last clear',async({page})=>{
 test.setTimeout(90000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 // Exit integration coverage deliberately positions the player; this is not an unassisted run.
 for(let i=0;i<levels.length;i++){
  await scene(page,'s.start(arg.i);s.player.teleport(arg.x,arg.y);',{i,x:levels[i].exit.x,y:levels[i].exit.y+10});
  await expect.poll(()=>scene(page,'return s.finished')).toBe(true);
  if(i===levels.length-1)await expect(page.locator('.epilogue')).toBeVisible();
  else {await expect(page.getByText('LEVEL COMPLETE',{exact:true})).toBeVisible();await expect(page.locator('.epilogue')).toHaveCount(0);}
  expect(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--level-color'))).toBe('#'+levels[i].color.toString(16).padStart(6,'0'));
 }
 await page.locator('#epilogue-return').click();await expect(page.locator('.picker-screen')).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('inkbound-v1')!).completed.length)).toBe(levels.length);await page.reload();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('inkbound-v1')!).completed.length)).toBe(levels.length);expect(errors).toEqual([]);
});

test('the collection supports volume and difficulty filters, search and keyboard browsing',async({page})=>{
 await page.goto('./');await expect(page.locator('#level-card')).toHaveAttribute('data-level-index','-1');await expect(page.locator('.level-button')).toHaveCount(levels.length);
 await expect(page.locator('.picker-screen')).not.toContainText(/inspired by|original layout|restored in full/i);
 await page.keyboard.press('ArrowRight');await expect(page.locator('#level-card')).toHaveAttribute('data-level-index','0');
 await expect(page.locator('.difficulty-badge')).toHaveText('HARD');
 const color=await page.locator('#level-card').evaluate(el=>(el as HTMLElement).style.getPropertyValue('--card-color'));
 await page.getByRole('button',{name:'Next level',exact:true}).click();expect(await page.locator('#level-card').evaluate(el=>(el as HTMLElement).style.getPropertyValue('--card-color'))).not.toBe(color);
 for(const difficulty of difficulties){
  await page.getByRole('button',{name:difficulty,exact:true}).click();await expect(page.locator('.level-button')).toHaveCount(levels.filter(l=>l.difficulty===difficulty).length);
  await expect(page.locator('.difficulty-badge')).toHaveText(difficulty.toUpperCase());
 }
 await page.getByRole('button',{name:'All',exact:true}).click();
 for(const [name,from,to] of [['First Ink',0,24],['Velocity',24,44],['Undertow',44,64],['Parallax',64,84],['Afterlight',84,104]] as const){
  await page.getByRole('button',{name,exact:true}).click();await expect(page.locator('.level-button')).toHaveCount(to-from);
  const ids=await page.locator('.level-button').evaluateAll(elements=>elements.map(el=>Number((el as HTMLElement).dataset.levelIndex)));
  expect(ids.every(id=>id>=from&&id<to)).toBe(true);
 }
 await page.getByRole('button',{name:'All volumes',exact:true}).click();
 await page.getByRole('searchbox',{name:'Search courses'}).fill('The Final Line');await expect(page.locator('.level-button')).toHaveCount(1);await expect(page.locator('#level-card')).toHaveAttribute('data-level-index','103');
 await page.getByRole('searchbox',{name:'Search courses'}).fill('no such course');await expect(page.locator('.empty-state')).toBeVisible();await expect(page.locator('#play-level')).toHaveCount(0);
 await page.locator('#clear-filters').click();await expect(page.locator('.level-button')).toHaveCount(levels.length);
 await page.getByRole('button',{name:'First Ink',exact:true}).click();await page.getByRole('button',{name:'Normal',exact:true}).click();await expect(page.locator('.empty-state')).toBeVisible();
 await page.getByRole('button',{name:'Tutorial',exact:true}).click();await expect(page.locator('#level-card')).toHaveAttribute('data-level-index','-1');await expect(page.locator('.level-button')).toHaveCount(levels.length);
 await page.locator('.level-button[data-level-index="12"]').click();await page.locator('#play-level').click();await expect(page.locator('.hud h3')).toHaveText(levels[12].name);
 expect(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--level-color'))).toBe('#'+levels[12].color.toString(16).padStart(6,'0'));
});

test('Overdrive checkpoint retries preserve the timer and refill six ink charges',async({page})=>{
 await start(page,12);
 await scene(page,'s.player.teleport(s.level.checkpoint.x,s.level.checkpoint.y-10);');
 await expect.poll(()=>scene(page,'return s.checkpointLit')).toBe(true);
 await scene(page,'s.activate(s.drawings[0]);s.drawFree("stroke",[{x:s.player.sprite.x,y:400}]);');
 const elapsed=await scene(page,'return s.elapsed');
 await page.keyboard.press('r');
 expect(await scene(page,'return s.player.sprite.x')).toBe(levels[12].checkpoint.x);
 expect(await scene(page,'return s.drawings.some(d=>d.active)')).toBe(false);expect(await scene(page,'return s.liveInk.drawings.length')).toBe(0);
 expect(await scene(page,'return s.elapsed')).toBeGreaterThanOrEqual(elapsed);expect(await scene(page,'return s.ink')).toBe(6);
 await page.waitForTimeout(480);
 await scene(page,'const z=s.sweepers[0];s.player.teleport(z.x,z.y);');await expect.poll(()=>scene(page,'return s.runDeaths')).toBe(1);
 expect(await scene(page,'return s.player.sprite.x')).toBe(levels[12].checkpoint.x);expect(await scene(page,'return s.ink')).toBe(6);
 expect(await scene(page,'return s.elapsed')).toBeGreaterThan(elapsed);
 // All three live tools use the original durations; six charges can sustain five sketches.
 const limits=await scene(page,'const x=s.player.sprite.x;s.drawFree("stroke",[{x,y:350}]);s.drawFree("arrow",[{x,y:300}]);s.drawFree("loop",[{x,y:220}]);const life=s.liveInk.drawings.map(d=>d.plan.lifetime);const more=[s.drawFree("stroke",[{x:x+20,y:350}]),s.drawFree("stroke",[{x:x+40,y:350}]),s.drawFree("stroke",[{x:x+60,y:350}])];return {life,more,count:s.liveInk.drawings.length,seventh:s.drawFree("stroke",[{x:x+80,y:350}])};');
 expect(limits).toEqual({life:[3600,4300,3000],more:[true,true,true],count:5,seventh:false});
});

test('hands-on tutorial requires every mechanic and persists its completion',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./');await page.locator('#play-level').click();
 const next=async()=>{await expect(page.locator('#next-lesson')).toBeEnabled();await page.locator('#next-lesson').click();};
 await expect(page.locator('#tutorial-panel')).toContainText('Move + jump');await expect(page.locator('#next-lesson')).toBeDisabled();
 await page.keyboard.down('d');await expect.poll(()=>scene(page,'return s.player.sprite.x')).toBeGreaterThan(300);await page.keyboard.down('Space');await expect.poll(()=>scene(page,'return s.tutorial.passed'),{intervals:[20]}).toBe(true);await page.keyboard.up('Space');await page.keyboard.up('d');await next();
 await page.keyboard.down('Space');await expect.poll(()=>scene(page,'return s.player.sprite.body.velocity.y'),{intervals:[20]}).toBeLessThan(-400);await page.keyboard.down('Shift');await expect.poll(()=>scene(page,'return s.tutorial.passed'),{intervals:[10]}).toBe(true);await page.keyboard.up('Shift');await page.keyboard.up('Space');await next();
 await draw(page,[{x:300,y:480},{x:520,y:480}]);await scene(page,'s.player.teleport(400,350)');await next();
 await draw(page,[{x:145,y:565},{x:350,y:430}]);await next();
 const saw=await scene(page,'return {x:s.sweepers[0].x,y:s.sweepers[0].y}');await draw(page,[saw]);await next();
 await scene(page,'const z=s.sweepers[0];s.player.teleport(z.x-85,550)');await page.keyboard.down('d');await page.keyboard.down('Shift');await expect.poll(()=>scene(page,'return s.tutorial.passed'),{intervals:[15]}).toBe(true);await page.keyboard.up('Shift');await page.keyboard.up('d');await next();
 await page.keyboard.press('e');for(let i=0;i<3;i++){await page.keyboard.press(String(i+1));const d=await scene(page,'return {x:s.drawings[arg].body.x,y:s.drawings[arg].body.y}',i);await draw(page,[d]);}await next();
 await scene(page,'s.player.teleport(360,550)');await expect.poll(()=>scene(page,'return s.found.size')).toBeGreaterThan(0);await scene(page,'s.player.teleport(730,550)');await expect.poll(()=>scene(page,'return s.checkpointLit')).toBe(true);await page.keyboard.press('r');await next();
 await page.keyboard.down('d');await expect(page.getByText('READY TO RUN',{exact:true})).toBeVisible({timeout:6000});await page.keyboard.up('d');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('inkbound-v1')!).tutorialComplete)).toBe(true);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('inkbound-v1')!).completed)).toEqual([]);
 await page.getByRole('button',{name:'Choose a level →'}).click();await expect(page.locator('#level-card')).toHaveAttribute('data-level-index',String(levelOrder[0]));await page.reload();await expect(page.locator('#level-card')).toHaveAttribute('data-level-index',String(levelOrder[0]));expect(errors).toEqual([]);
});

test('music schedules notes, pauses correctly, and independent volume settings persist',async({page})=>{
 await start(page,12);await expect.poll(()=>scene(page,'return s.audioDiagnostics.musicSteps')).toBeGreaterThan(3);expect(await scene(page,'return s.audioDiagnostics.playing')).toBe(true);
 await page.keyboard.press('Escape');expect(await scene(page,'return s.audioDiagnostics.context')).toBe('paused');const step=await scene(page,'return s.audioDiagnostics.musicSteps');await page.waitForTimeout(250);expect(await scene(page,'return s.audioDiagnostics.musicSteps')).toBe(step);
 await page.getByRole('button',{name:'Settings & controls'}).click();const music=page.getByRole('slider',{name:'Music volume',exact:true});await music.focus();await music.press('Home');for(let i=0;i<4;i++)await music.press('ArrowRight');const effects=page.getByRole('slider',{name:'Sound effects volume',exact:true});await effects.focus();await effects.press('Home');for(let i=0;i<16;i++)await effects.press('ArrowRight');await page.getByRole('button',{name:'Done',exact:true}).click();await page.getByRole('button',{name:'Resume run'}).click();expect(await scene(page,'return s.audioDiagnostics.context')).toBe('game');
 await page.keyboard.press('m');expect(await scene(page,'return s.audioDiagnostics.playing')).toBe(false);await page.reload();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('inkbound-v1')!));expect(saved.musicVolume).toBe(.2);expect(saved.sfxVolume).toBe(.8);expect(saved.muted).toBe(true);
});


test('the final page unlocks for the last missing course in any order and remains available',async({page})=>{
 await start(page,103);
 await scene(page,'s.player.teleport(s.level.exit.x,s.level.exit.y+10)');
 await expect(page.getByText('LEVEL COMPLETE',{exact:true})).toBeVisible();await expect(page.locator('.epilogue')).toHaveCount(0);
 await page.evaluate(()=>{
  const saved=JSON.parse(localStorage.getItem('inkbound-v1')!);
  saved.completed=Array.from({length:104},(_,i)=>i).filter(i=>i!==37);saved.current=37;saved.tutorialComplete=true;
  localStorage.setItem('inkbound-v1',JSON.stringify(saved));
 });
 await start(page,37);
 await scene(page,'s.player.teleport(s.level.exit.x,s.level.exit.y+10)');
 await expect(page.locator('.epilogue')).toBeVisible();await expect(page.locator('.epilogue-count')).toHaveText('104 / 104 COURSES CLEARED');
 await expect(page.locator('.epilogue-poem')).toContainText('The next line is yours.');
 await page.locator('#epilogue-return').click();await page.reload();
 await page.getByRole('button',{name:'Final page',exact:true}).click();await expect(page.locator('.epilogue')).toBeVisible();
 await page.locator('#epilogue-return').click();await expect(page.locator('.picker-screen')).toBeVisible();
});
