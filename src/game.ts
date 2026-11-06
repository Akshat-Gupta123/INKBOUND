import Phaser from 'phaser';
import {levels,levelOrder,tutorialLevel,availableTools,type Tool,type Edit,type Rect} from './levels';
import {makeArt,scenery,hatch,ink} from './art';
import {Player} from './player';
import {TutorialGuide,tutorialSteps} from './tutorial';
import { LiveInk } from './liveInk';
import type { Point } from './inkGeometry';
import {sound} from './audio';
import {runRules,practiceRules} from './rules';
import {save,persist,complete} from './save';
import {ui,menu,selection,settings,modal,button,formatTime,leavePicker} from './ui';
type Drawing={def:Edit;body:Phaser.Physics.Arcade.Image;art:Phaser.GameObjects.Graphics;label:Phaser.GameObjects.Text;active:boolean;elapsed:number;sign:number;fromX:number;fromY:number;toX:number;toY:number};
type Saw = {def:{x:number;y:number;r:number;dx?:number;dy?:number;period:number;phase?:number};art:Phaser.GameObjects.Graphics;elapsed:number;disabled:number;x:number;y:number;frozen:boolean};
export class Book extends Phaser.Scene {
 tutorial?:TutorialGuide;resetCount=0;progressSaveElapsed=0;
 get audioDiagnostics(){return sound.diagnostics;}
 get isTutorial(){return this.index===-1;}
 get rules(){return this.isTutorial?practiceRules:runRules;}
 get level(){return this.isTutorial?tutorialLevel:levels[this.index];}
 liveInk?:LiveInk;sweepers:Saw[]=[];drawingGesture=false;runDeaths=0;runEdits=0;hudElapsed=0;respawnSafeUntil=0;

 index=0;player!:Player;ground!:Phaser.Physics.Arcade.StaticGroup;drawings:Drawing[]=[];sketch=false;tool:Tool='stroke';ink=6;maxInk=6;checkpoint={x:130,y:550};checkpointLit=false;found=new Set<number>();elapsed=0;paused=true;finished=false;gate?:Phaser.Physics.Arcade.Image;gateArt?:Phaser.GameObjects.Graphics;plateArt?:Phaser.GameObjects.Graphics;plateOn=false;checkpointArt?:Phaser.GameObjects.Graphics;particles:Phaser.GameObjects.Arc[]=[];fragments:Phaser.GameObjects.Container[]=[];selected?:Drawing;points:{x:number;y:number}[]=[];gesture!:Phaser.GameObjects.Graphics;statusUntil=0;status='';hazardBodies:Phaser.Physics.Arcade.StaticGroup|undefined;keyHandler!:(event:KeyboardEvent)=>void;pointerDown!:(pointer:Phaser.Input.Pointer)=>void;pointerUp!:(pointer:Phaser.Input.Pointer)=>void;pointerMove!:(pointer:Phaser.Input.Pointer)=>void;
 constructor(){super('Book');}
 create(){makeArt(this);this.cameras.main.setBackgroundColor('#15191c');menu(n=>this.start(n));this.physics.pause();
 this.keyHandler=e=>{if(e.repeat||e.target instanceof HTMLInputElement)return;if(e.code==='KeyM'){sound.unlock();sound.mute();if(!this.paused)this.hud();return;}if(!this.player||this.finished)return;
 if(e.code==='Escape'){if(this.paused&&ui.querySelector('.pause-sheet'))this.resume();else if(!this.paused)this.pause();return;}
 if(this.paused)return;
 if(e.code==='KeyE'){this.sketch=!this.sketch;this.selected=undefined;this.syncSketch();}
 if(e.code==='KeyR')this.reset();
 if(e.code==='Enter'&&this.tutorial?.passed)this.tutorial.advance();
 const i=['Digit1','Digit2','Digit3'].indexOf(e.code);if(i>=0){const t:Tool[]=['stroke','arrow','loop'];if(availableTools(this.index).includes(t[i])){this.tool=t[i];this.selected=undefined;this.hud();this.refreshDrawings();}}
 };
 window.addEventListener('keydown',this.keyHandler);this.events.once('shutdown',()=>window.removeEventListener('keydown',this.keyHandler));
 const focusIn=(event:FocusEvent)=>{if(event.target instanceof HTMLInputElement){this.input.keyboard?.disableGlobalCapture();if(this.input.keyboard)this.input.keyboard.enabled=false;}};const focusOut=()=>{this.input.keyboard?.enableGlobalCapture();if(this.input.keyboard)this.input.keyboard.enabled=true;};document.addEventListener('focusin',focusIn);document.addEventListener('focusout',focusOut);this.events.once('shutdown',()=>{document.removeEventListener('focusin',focusIn);document.removeEventListener('focusout',focusOut);});
 this.pointerDown=p=>{
   if(this.paused||this.finished||!this.player||p.rightButtonDown())return;
   sound.unlock();const world=p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
   if(Phaser.Math.Distance.Between(world.x,world.y,this.player.sprite.x,this.player.sprite.y)>800){this.message('Draw within reach.',1200);return;}
   this.points=[{x:world.x,y:world.y}];this.drawingGesture=true;
   this.selected=this.drawings.find(d=>d.art.visible&&d.def.tool===this.tool&&Math.abs(world.x-d.body.x)<d.def.w/2+18&&Math.abs(world.y-d.body.y)<d.def.h/2+22);
 };
 this.pointerMove=p=>{
   if(!p.isDown||!this.drawingGesture||this.paused)return;
   const v=p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
   if(this.points.length<120)this.points.push({x:v.x,y:v.y});
   this.gesture.clear().lineStyle(3,this.tool==='stroke'?0xd8ed62:this.tool==='arrow'?0xff7055:0x6cdbea,.9);
   this.gesture.strokePoints(this.points);
 };
 this.pointerUp=()=>{
   this.gesture?.clear();if(!this.drawingGesture||this.paused)return;this.drawingGesture=false;
   if(this.selected){this.activate(this.selected,this.points);this.selected=undefined;return;}
   this.drawFree(this.tool,this.points);
 };
 this.input.on('pointerdown',this.pointerDown);this.input.on('pointermove',this.pointerMove);this.input.on('pointerup',this.pointerUp);
 // Release movement when a tab loses focus, and pause instead of simulating a long frame.
 this.game.events.on(Phaser.Core.Events.BLUR,()=>{if(this.player&&!this.paused&&!this.finished)this.pause();});
 }
 start(index:number){
 if(index!==-1&&(!Number.isInteger(index)||index<0||index>=levels.length))return;
 leavePicker();this.tutorial?.destroy();this.tutorial=undefined;this.resetCount=0;this.progressSaveElapsed=0;
 this.liveInk?.clear();this.liveInk=undefined;this.tweens.killAll();this.ground?.destroy(true);this.hazardBodies?.destroy(true);this.children.removeAll(true);this.physics.world.colliders.destroy();this.drawings=[];this.fragments=[];this.particles=[];this.gate=undefined;this.gateArt=undefined;this.plateArt=undefined;this.checkpointArt=undefined;this.index=index;this.maxInk=this.rules.maxInk;this.elapsed=0;this.runDeaths=0;this.runEdits=0;this.sweepers=[];this.drawingGesture=false;this.respawnSafeUntil=0;this.finished=false;this.paused=false;this.sketch=false;this.selected=undefined;this.ink=this.maxInk;this.checkpoint={x:130,y:550};this.checkpointLit=false;this.plateOn=false;this.found=new Set(index===-1?[]:save.fragments[index]??[]);this.status='';this.statusUntil=0;if(!this.isTutorial){save.current=index;persist();}sound.setContext('game',this.level.music);sound.unlock();sound.play('page');
 const l=this.level,color=l.color;document.documentElement.style.setProperty('--level-color','#'+color.toString(16).padStart(6,'0'));this.physics.world.setBounds(0,-150,l.width,1050);this.physics.world.timeScale=1;this.physics.resume();scenery(this,l.width,color,l.chapter);
 this.ground=this.physics.add.staticGroup();for(const p of l.platforms){this.addSolid(p);const g=this.add.graphics();hatch(g,p.x,p.y,p.w,Math.min(p.h,52),color);if(p.h>30){g.fillStyle(color,.10);g.fillRect(p.x+2,p.y+4,p.w-4,35);}}
 this.hazardBodies=this.physics.add.staticGroup();for(const h of l.hazards){const b=this.physics.add.staticImage(h.x+h.w/2,h.y+h.h/2,'dot').setVisible(false).setDisplaySize(h.w,h.h).refreshBody();this.hazardBodies.add(b);const g=this.add.graphics().fillStyle(0xff604d,.15).fillRect(h.x,h.y,h.w,h.h);g.lineStyle(1,0xff604d,.7).strokeRect(h.x,h.y,h.w,h.h);g.fillStyle(0xff604d,.8);for(let x=h.x;x<h.x+h.w;x+=17){g.fillTriangle(x,h.y+h.h,x+8,h.y-6,x+16,h.y+h.h);g.lineStyle(1,0xff9370);g.strokeTriangle(x,h.y+h.h,x+8,h.y-6,x+16,h.y+h.h);}}
 this.player=new Player(this,130,540);this.physics.add.collider(this.player.sprite,this.ground);this.physics.add.overlap(this.player.sprite,this.hazardBodies,()=>this.respawn());
 this.liveInk=new LiveInk(this,this.player,this.rules);
 for(const def of l.sweepers??[]){this.sweepers.push({def:{...def},art:this.add.graphics().setDepth(9),elapsed:0,disabled:0,x:def.x,y:def.y,frozen:false});}

 for(const d of l.edits){const body=this.physics.add.image(d.x+d.w/2,d.y+d.h/2,'dot').setVisible(false).setDisplaySize(d.w,d.h);body.setImmovable(true);body.body!.setAllowGravity(false);body.body!.setSize(8,8);body.body!.enable=d.tool!=='stroke';body.setData('oneway',true);const drawing:Drawing={def:d,body,art:this.add.graphics().setDepth(3),label:this.add.text(d.x+d.w/2,d.y-25,'',{fontFamily:'Georgia',fontSize:'14px',color:'#ccd2c9'}).setOrigin(.5),active:false,elapsed:0,sign:1,fromX:body.x,fromY:body.y,toX:body.x+(d.dx??0),toY:body.y+(d.dy??0)};this.drawings.push(drawing);this.physics.add.collider(this.player.sprite,body);}
 if(l.gate){this.gate=this.physics.add.staticImage(l.gate.x+l.gate.w/2,l.gate.y+l.gate.h/2,'dot').setVisible(false).setDisplaySize(l.gate.w,l.gate.h).refreshBody();this.physics.add.collider(this.player.sprite,this.gate);this.gateArt=this.add.graphics();hatch(this.gateArt,l.gate.x,l.gate.y,l.gate.w,l.gate.h,0xb48641);this.add.text(l.gate.x-18,l.gate.y-35,'✦',{fontSize:'28px',color:'#a57f36'});}
 if(l.plate){this.plateArt=this.add.graphics();this.plateArt.fillStyle(0xb49251).fillRect(l.plate.x,l.plate.y,l.plate.w,l.plate.h);this.add.text(l.plate.x-10,l.plate.y-32,'PRESSURE PLATE',{fontFamily:'monospace',fontSize:'10px',color:'#887248'});}
 if(l.checkpoint){this.checkpointArt=this.add.graphics();this.renderWell(false);this.add.text(l.checkpoint.x-35,l.checkpoint.y+13,'CHECKPOINT',{fontFamily:'monospace',fontSize:'10px',color:'#ccd2c9'});}
 l.fragments.forEach((f,i)=>{const diamond=this.add.graphics();diamond.fillStyle(color).fillTriangle(0,-12,8,0,0,12).fillTriangle(0,-12,-8,0,0,12).lineStyle(1,ink).strokePoints([new Phaser.Math.Vector2(0,-12),new Phaser.Math.Vector2(8,0),new Phaser.Math.Vector2(0,12),new Phaser.Math.Vector2(-8,0)],true);const c=this.add.container(f.x,f.y,[diamond]).setDepth(5).setAlpha(this.found.has(i)?.22:1);this.fragments.push(c);});
 const door=this.add.graphics().setDepth(2);door.fillStyle(color,.2);door.fillRoundedRect(l.exit.x-27,l.exit.y-3,55,77,5);door.lineStyle(3,ink);door.strokeRoundedRect(l.exit.x-27,l.exit.y-3,55,77,5);door.lineStyle(1,ink);door.lineBetween(l.exit.x-25,l.exit.y,l.exit.x+10,l.exit.y+12);door.lineBetween(l.exit.x+10,l.exit.y+12,l.exit.x+10,l.exit.y+72);this.add.text(l.exit.x,l.exit.y-26,'FINISH →',{fontFamily:'monospace',fontSize:'11px',color:'#d8ed62'}).setOrigin(.5);
 // Optional high routes are marked as cache locations, with no dialogue interruption.
 const secret=l.fragments[1];this.add.text(secret.x-25,secret.y-70,'CACHE / 02',{fontFamily:'monospace',fontSize:'10px',color:'#72848d'});
 this.gesture=this.add.graphics().setDepth(30);this.cameras.main.setBounds(0,0,l.width,720).startFollow(this.player.sprite,true,.16,.12).setDeadzone(100,100);this.cameras.main.setZoom(1);if(!save.reduced)this.cameras.main.fadeIn(180,21,25,28);
 this.refreshDrawings();this.hud();if(this.isTutorial){this.tutorial=new TutorialGuide(this);}else this.message(l.note,3800);
 }
 addSolid(r:Rect){const b=this.physics.add.staticImage(r.x+r.w/2,r.y+r.h/2,'dot').setDisplaySize(r.w,r.h).setVisible(false).refreshBody();this.ground.add(b);}
 renderWell(lit:boolean){const p=this.level.checkpoint,g=this.checkpointArt;if(!p||!g)return;g.clear().fillStyle(lit?0x6f9a7a:0x323c3d);g.fillRoundedRect(p.x-14,p.y-5,28,27,4);g.lineStyle(2,ink);g.strokeRoundedRect(p.x-14,p.y-5,28,27,4);g.fillStyle(0xc5a45c).fillRect(p.x-9,p.y-12,18,8);}
 drawFree(tool:Tool,points:Point[]){
  if(this.ink<1){this.message('Ink recharging.',900);sound.play('error');return false;}
  if(!points.length||points.some(p=>p.y<95||p.y>690||p.x<0||p.x>this.level.width))return false;
  if(Math.hypot(points[0].x-this.player.sprite.x,points[0].y-this.player.sprite.y)>800)return false;
  if(!this.liveInk?.create(tool,points)){this.message('Draw a wider stroke.',1000);return false;}
  this.ink--;this.runEdits++;save.edits++;persist();this.updateMeters();return true;
 }
 activate(d:Drawing,points:Point[]=[]){
  if(this.ink<1){this.message('Ink recharging.',900);return;}
  if(d.active&&d.def.tool==='arrow'){
    const x=d.fromX,y=d.fromY;d.fromX=d.toX;d.fromY=d.toY;d.toX=x;d.toY=y;
  }
  d.active=true;d.elapsed=0;d.body.body!.enable=true;this.ink--;this.runEdits++;save.edits++;persist();
  sound.play('draw');this.burst(d.body.x,d.body.y,this.level.color);this.refreshDrawings();this.updateMeters();
 }
 refreshDrawings(){for(const d of this.drawings)this.renderDrawing(d);}
 renderDrawing(d:Drawing){const g=d.art,x=d.body.x-d.def.w/2,y=d.body.y-d.def.h/2,w=d.def.w,h=d.def.h,color=this.level.color;g.clear();
 if(d.def.tool==='stroke'&&!d.active){g.lineStyle(this.sketch?3:2,this.sketch?color:ink,this.sketch?.9:.4);for(let a=0;a<w;a+=17){g.lineBetween(x+a,y,x+Math.min(w,a+9),y);g.lineBetween(x+a,y+h,x+Math.min(w,a+9),y+h);}g.lineBetween(x,y,x,y+h);g.lineBetween(x+w,y,x+w,y+h);}
 else{hatch(g,x,y,w,h,d.active?color:ink);g.fillStyle(color,d.active?.28:.08).fillRect(x+2,y+3,w-4,h-5);}
 if(d.def.tool!=='stroke'){const cx=x+w/2;g.lineStyle(2,d.active?color:ink,.8);if(d.def.tool==='loop'){g.strokeCircle(cx,y+h/2,8);g.lineBetween(cx+7,y+h/2-5,cx+11,y+h/2-3);}else{g.lineBetween(cx-9,y+h/2,cx+9,y+h/2);g.lineBetween(cx+9,y+h/2,cx+3,y+h/2-5);g.lineBetween(cx+9,y+h/2,cx+3,y+h/2+5);}
 if(!d.active||this.sketch){g.lineStyle(1,color,.3);for(let a=0;a<1;a+=.05){const px=Phaser.Math.Linear(d.fromX,d.toX,a),py=Phaser.Math.Linear(d.fromY,d.toY,a);g.lineBetween(px,py,Phaser.Math.Linear(d.fromX,d.toX,a+.025),Phaser.Math.Linear(d.fromY,d.toY,a+.025));}g.strokeCircle(d.toX,d.toY,5);}}
 if(this.sketch&&!d.active){g.lineStyle(d.def.tool===this.tool?2:1,color,d.def.tool===this.tool?.8:.25);g.strokeRoundedRect(x-7,y-7,w+14,h+14,5);}
 d.label.setPosition(x+w/2,y-19).setText(d.active?(d.def.duration?`${Math.ceil((d.def.duration-d.elapsed)/1000)}s`:''):(this.sketch?`${d.def.tool.toUpperCase()} · 1 INK`:d.def.tool==='stroke'?'INK TARGET':d.def.tool==='arrow'?'→':'↻')).setAlpha(this.sketch?1:.6);
 }
 syncSketch(){this.physics.world.timeScale=1;this.selected=undefined;this.drawingGesture=false;this.gesture.clear();this.refreshDrawings();this.hud();}
 hud(){if(this.paused||this.finished)return;const l=this.level;ui.innerHTML=`<div class="hud"><div class="hud-top"><button class="back-book" aria-label="Pause">☰</button><div><span class="eyebrow">${this.isTutorial?'GUIDED PRACTICE':l.difficulty.toUpperCase()+' / LEVEL '+String(levelOrder.indexOf(this.index)+1).padStart(2,'0')}</span><h3>${l.name}</h3></div><div class="hud-right"><span class="fragments">✦ ${this.found.size}/3</span><span id="dash-meter">SHIFT · DASH</span><span id="death-meter">${this.runDeaths} FAILS</span><span id="run-progress">0%</span><span id="timer">${formatTime(this.elapsed)}</span><button id="mute" aria-label="Mute sound">${save.muted?'♪ OFF':'♪ ON'}</button></div></div><div class="page-objective"><span>↗ ${l.goal}</span></div><div class="hud-bottom"><div class="ink-counter"><small>INK / REGENERATING</small><div id="ink-cells">${Array.from({length:this.maxInk},(_,i)=>`<b class="${i<this.ink?'full':''}">♦</b>`).join('')}</div></div><div class="tools">${(['stroke','arrow','loop'] as Tool[]).map((t,i)=>`<button data-tool="${t}" class="tool ${this.tool===t?'selected':''}" ${!availableTools(this.index).includes(t)?'disabled':''}><kbd>${i+1}</kbd> ${t==='stroke'?'╱':t==='arrow'?'↗':'↻'} ${t.toUpperCase()}</button>`).join('')}</div><button id="sketch" class="${this.sketch?'active primary':''}"><kbd>E</kbd> ${this.sketch?'Hide guides':'Show guides'}</button><button id="reset" title="Instant restart at checkpoint">↶ <kbd>R</kbd></button></div><div class="tutorial">${l.note}</div><div class="toast" id="toast" role="status"></div></div>`;
 ui.querySelector('.back-book')!.addEventListener('click',()=>this.pause());ui.querySelector('#sketch')!.addEventListener('click',()=>{this.sketch=!this.sketch;this.syncSketch();});ui.querySelector('#reset')!.addEventListener('click',()=>this.reset());ui.querySelector('#mute')!.addEventListener('click',()=>{sound.mute();this.hud();});ui.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b=>b.onclick=()=>{this.tool=b.dataset.tool as Tool;this.refreshDrawings();this.hud();});this.updateToast();this.tutorial?.render();}
 message(text:string,duration=4000){this.status=text;this.statusUntil=this.time.now+duration;this.updateToast();}
 updateToast(){const t=ui.querySelector('#toast');if(t){t.textContent=this.status;t.classList.toggle('visible',this.time.now<this.statusUntil);}}
 burst(x:number,y:number,color=ink){if(save.reduced)return;for(let i=0;i<10;i++){const p=this.add.circle(x,y,2+i%3,color).setDepth(20);this.tweens.add({targets:p,x:x+Math.cos(i*2.4)*60,y:y-20+Math.sin(i*2.4)*50,alpha:0,scale:0,duration:500,onComplete:()=>p.destroy()});}}
 updateMeters(){
  const cells=ui.querySelector('#ink-cells');if(cells)cells.innerHTML=Array.from({length:this.maxInk},(_,i)=>`<b class="${i<Math.floor(this.ink)?'full':''}" style="opacity:${i===Math.floor(this.ink)?.25+(this.ink%1)*.75:1}">♦</b>`).join('');
  const dash=ui.querySelector('#dash-meter');if(dash){dash.textContent=this.player.dashReady?'SHIFT · DASH':`DASH ${(this.player.dashCooldown/1000).toFixed(1)}`;dash.classList.toggle('ready',this.player.dashReady);}
  const timer=ui.querySelector('#timer');if(timer)timer.textContent=(this.elapsed/1000).toFixed(2)+'s';
  const progress=ui.querySelector('#run-progress');if(progress)progress.textContent=this.isTutorial?'PRACTICE':Math.min(99,Math.max(0,Math.floor((this.player.sprite.x-130)/(this.level.exit.x-130)*100)))+'%';
  const deaths=ui.querySelector('#death-meter');if(deaths)deaths.textContent=this.runDeaths+' FAILS';
 }
 respawn(){
  if(this.finished||this.time.now<this.respawnSafeUntil)return;
  if(!this.isTutorial){this.runDeaths++;save.deaths++;persist();}sound.play('death');this.burst(this.player.sprite.x,this.player.sprite.y,0xff604d);
  if(!this.isTutorial){const reached=Math.min(99,Math.max(0,Math.floor((this.player.sprite.x-130)/(this.level.exit.x-130)*100)));save.progress[this.index]=Math.max(save.progress[this.index]??0,reached);persist();}
  this.liveInk?.clear();this.ink=this.maxInk;this.drawingGesture=false;this.gesture.clear();this.selected=undefined;
  this.player.teleport(this.checkpoint.x,this.checkpoint.y-10);this.respawnSafeUntil=this.time.now+450;
  if(!save.reduced)this.cameras.main.shake(90,.003);this.updateMeters();
 }
 reset(){
  this.resetCount++;
  this.ink=this.maxInk;this.plateOn=false;this.liveInk?.clear();this.drawingGesture=false;this.gesture.clear();
  for(const d of this.drawings){d.active=false;d.elapsed=0;d.fromX=d.def.x+d.def.w/2;d.fromY=d.def.y+d.def.h/2;d.toX=d.fromX+(d.def.dx??0);d.toY=d.fromY+(d.def.dy??0);d.body.body!.reset(d.fromX,d.fromY);d.body.body!.enable=d.art.visible&&d.def.tool!=='stroke';}
  if(this.gate){this.gate.body!.enable=true;this.gateArt?.setVisible(true);}
  this.selected=undefined;
  this.player.teleport(this.checkpoint.x,this.checkpoint.y-10);this.respawnSafeUntil=this.time.now+450;this.refreshDrawings();this.hud();
 }
 pause(){if(this.finished||this.paused)return;this.paused=true;this.physics.pause();sound.setContext('paused');this.player.sprite.setAccelerationX(0);const a=modal('RUN PAUSED',this.level.subtitle);ui.querySelector('.sheet')!.classList.add('pause-sheet');a.append(button('Resume run',()=>this.resume(),'primary'),button('Restart checkpoint',()=>{this.resume();this.reset();}),button('Settings & controls',()=>settings(()=>{this.paused=false;this.pause();})),button('Select stage',()=>{selection(n=>this.start(n));}),button('Main menu',()=>menu(n=>this.start(n))));}
 resume(){sound.setContext('game',this.level.music);this.paused=false;this.input.keyboard?.resetKeys();this.physics.resume();this.hud();}
 finish(){
  if(this.finished)return;
  if(this.isTutorial&&this.tutorial?.step!==tutorialSteps.length-1){this.message('Complete the current practice lesson first.',1400);return;}
  this.finished=true;this.paused=true;this.physics.pause();sound.setContext('paused');sound.play('complete');
  if(this.isTutorial){
    save.tutorialComplete=true;save.current=levelOrder[0];persist();
    const a=modal('READY TO RUN','All mechanics learned: movement, dash, live ink, machinery, checkpoints and resets.<br>Choose a level and set your own pace.');
    a.append(button('Choose a level →',()=>selection(n=>this.start(n),save.current),'primary'),button('Practice again',()=>this.start(-1)));return;
  }
  complete(this.index,this.elapsed,[...this.found]);
  const seconds=this.elapsed/1000,par=this.level.par,rank=seconds<=par&&this.runDeaths===0?'S':seconds<=par*1.4&&this.runDeaths<=2?'A':seconds<=par*2?'B':'C';
  const a=modal('LEVEL COMPLETE',`<span class="completion-seal">${rank}</span><br>${this.level.name} · ${this.level.difficulty}<br>${seconds.toFixed(2)}s / PAR ${par}s<br>${this.runDeaths} deaths · ${this.runEdits} sketches · ${this.found.size}/3 caches`);
  a.append(button('Level picker →',()=>selection(n=>this.start(n)),'primary'),button('Replay level',()=>this.start(this.index)));
 }
 updateSaws(dt:number){
  const p=this.player.sprite,b=p.body as Phaser.Physics.Arcade.Body;
  for(const s of this.sweepers){
   if(this.isTutorial&&this.tutorial?.step!==4&&this.tutorial?.step!==5){s.art.setVisible(false);continue;}s.art.setVisible(true);
   s.disabled=Math.max(0,s.disabled-dt);s.frozen=this.liveInk?.containsStasis(s.x,s.y)??false;
   if(!s.frozen)s.elapsed+=dt;
   const phase=s.elapsed/s.def.period+(s.def.phase??0),t=(1-Math.cos(phase*Math.PI*2))/2;
   s.x=s.def.x+(s.def.dx??0)*t;s.y=s.def.y+(s.def.dy??0)*t;
   const g=s.art.clear(),color=s.frozen?0x6cdbea:0xff604d,r=s.def.r;
   g.setAlpha(s.disabled>0?.12:1);g.lineStyle(1,color,.18).lineBetween(s.def.x,s.def.y,s.def.x+(s.def.dx??0),s.def.y+(s.def.dy??0));
   const points=[];for(let n=0;n<24;n++){const a=n*Math.PI/12+s.elapsed*.007,rr=n%2?r*.7:r;points.push(new Phaser.Math.Vector2(s.x+Math.cos(a)*rr,s.y+Math.sin(a)*rr));}
   g.fillStyle(color,.12).fillPoints(points,true);g.lineStyle(2,color,.95).strokePoints(points,true);g.lineStyle(2,color).strokeCircle(s.x,s.y,r*.35);
   if(s.disabled>0||s.frozen||this.time.now<this.respawnSafeUntil)continue;
   const nearX=Phaser.Math.Clamp(s.x,b.left,b.right),nearY=Phaser.Math.Clamp(s.y,b.top,b.bottom);
   if(Math.hypot(s.x-nearX,s.y-nearY)<r-3){if(this.player.isDashing){s.disabled=this.rules.sawBreakMs;this.burst(s.x,s.y,0xff604d);sound.play('draw');}else this.respawn();}
  }
 }
 update(_time:number,delta:number){if(!this.player||this.paused||this.finished)return;const dt=Math.min(delta,50),l=this.level;this.elapsed+=dt;this.ink=Math.min(this.maxInk,this.ink+dt/this.rules.regenMs);this.player.update(dt,false,this.sketch);const p=this.player.sprite,b=p.body as Phaser.Physics.Arcade.Body;
 // Kinematic platforms move in fixed rails. Carry grounded riders by the same delta,
 // rather than relying on immovable-body separation to guess platform motion.
 for(const d of this.drawings){const oldX=d.body.x,oldY=d.body.y;if(d.active){d.elapsed+=dt;if(d.def.tool!=='stroke'){const span=Math.hypot(d.toX-d.fromX,d.toY-d.fromY);let t=d.def.tool==='arrow'?Math.min(1,d.elapsed/(span/230*1000)):((d.elapsed/(span/230*1000))%2);if(t>1)t=2-t;d.body.setPosition(Phaser.Math.Linear(d.fromX,d.toX,t),Phaser.Math.Linear(d.fromY,d.toY,t));const onTop=p.x>oldX-d.def.w/2-12&&p.x<oldX+d.def.w/2+12&&Math.abs(b.bottom-(oldY-d.def.h/2))<12&&b.velocity.y>=0;d.body.body!.reset(d.body.x,d.body.y);if(onTop){const vx=b.velocity.x;p.x+=d.body.x-oldX;p.y=d.body.y-d.def.h/2-29;b.reset(p.x,p.y);b.setVelocity(vx,0);}}
 if(d.def.duration&&d.elapsed>=d.def.duration){d.active=false;d.body.body!.enable=false;}}
 this.renderDrawing(d);}
 if(l.plate){this.plateOn=this.drawings.some(d=>d.def.plate&&Math.abs(d.body.x-(l.plate!.x+l.plate!.w/2))<55);this.plateArt?.clear().fillStyle(this.plateOn?0x6b9575:0xb49251).fillRect(l.plate.x,l.plate.y,l.plate.w,l.plate.h);}
 const ready=l.plate?this.plateOn:this.drawings.every(d=>d.active);if(this.gate){this.gate.body!.enable=!ready;this.gateArt?.setVisible(!ready);}
 if(p.y>780||p.x< -35||p.x>l.width+35)this.respawn();
 if(l.checkpoint&&(!this.isTutorial||(this.tutorial?.step??0)>=7)&&!this.checkpointLit&&Phaser.Math.Distance.Between(p.x,p.y,l.checkpoint.x,l.checkpoint.y)<65){this.checkpointLit=true;this.checkpoint={...l.checkpoint};this.ink=this.maxInk;this.renderWell(true);sound.play('checkpoint');this.burst(p.x,p.y,0x6c9779);this.hud();this.message('CHECKPOINT // INK REFILLED',1000);}
 this.fragments.forEach((f,i)=>{if((!this.isTutorial||this.tutorial?.step===7)&&!this.found.has(i)){f.y=l.fragments[i].y+Math.sin(this.time.now*.003+i)*5;if(Phaser.Math.Distance.Between(p.x,p.y,f.x,f.y)<43){this.found.add(i);f.setAlpha(.2);if(!this.isTutorial){save.fragments[this.index]=[...new Set([...(save.fragments[this.index]??[]),i])];persist();}sound.play('collect');this.burst(f.x,f.y,l.color);this.hud();this.message(i===1?l.secret:'CACHE +1',1200);}}});
 if(p.x>l.exit.x-32&&Math.abs(p.y-(l.exit.y+30))<90){if(!l.gate||ready)this.finish();else this.message(l.plate?'The seal needs a crate on the brass plate.':'The seal needs every drawing on this page restored.',1500);}
 this.liveInk?.update(dt);this.updateSaws(dt);this.tutorial?.update();if(this.player.landed)this.burst(p.x,p.y+27,0xc5c9b4);this.player.visual.setAlpha(this.time.now<this.respawnSafeUntil?.45:1);this.updateToast();this.hudElapsed+=dt;if(this.hudElapsed>70){this.hudElapsed=0;this.updateMeters();}
 this.progressSaveElapsed+=dt;if(!this.isTutorial&&!this.finished&&this.progressSaveElapsed>=1000){this.progressSaveElapsed=0;const reached=Math.min(99,Math.max(0,Math.floor((p.x-130)/(l.exit.x-130)*100)));if(reached>(save.progress[this.index]??0)){save.progress[this.index]=reached;persist();}}
 }
}
