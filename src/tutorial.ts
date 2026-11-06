export const tutorialSteps = [
  {title:'Move + jump',copy:'Move with A / D or ← / →. Press Space to jump. Hold it longer for more height.',tip:'Move past the first marker and make a jump.',tool:'stroke'},
  {title:'Directional dash',copy:'Jump, then press Shift or X in the air. Hold WASD or arrow keys to aim your dash.',tip:'Try an air dash. The dash meter refills in less than a second.',tool:'stroke'},
  {title:'Stroke: make a landing',copy:'Press 1. Drag across the glowing guide to draw a platform, then jump onto your drawing.',tip:'A quick click makes a short platform. Ink regenerates; drawings expire.',tool:'stroke'},
  {title:'Arrow: launch yourself',copy:'Press 2. Drag from your runner toward the upper right. Touch the arrow to launch along it.',tip:'Draw a direction, then enter the arrow. A click makes a default launch.',tool:'arrow'},
  {title:'Loop: freeze a threat',copy:'Press 3. Draw a loop around the moving saw, or click it to place a stasis field.',tip:'Frozen saws turn blue and are safe until the field expires.',tool:'loop'},
  {title:'Dash through a saw',copy:'Moving red saws are dangerous. Dash into this one with Shift or X to break it temporarily.',tip:'This is safe practice. In real levels, red ground spikes still kill during a dash.',tool:'stroke'},
  {title:'Edit the machinery',copy:'Press E for guides. Use 1, 2, then 3 and click each matching outlined machine.',tip:'Stroke restores it. Arrow moves it. Loop makes it repeat. All three must be active.',tool:'stroke'},
  {title:'Caches, checkpoints + reset',copy:'Grab a diamond, touch the inkwell, then press R to reset at that checkpoint.',tip:'R refills ink and clears sketches. Collected caches stay saved in regular levels.',tool:'stroke'},
  {title:'Ready to run',copy:'Reach the exit on the right. Then choose any level and difficulty from the picker.',tip:'Esc pauses. M mutes. Music and effect volumes are separate in Settings.',tool:'stroke'},
] as const;

import Phaser from 'phaser';
import type { Book } from './game';
import { ui, button, menu } from './ui';
import { sound } from './audio';

/** A practice sequence that advances only after observed gameplay actions. */
export class TutorialGuide {
  step=0; passed=false; private moved=false; private jumped=false; private baselineLaunch=0; private baselineReset=0;
  private guide:Phaser.GameObjects.Graphics;
  constructor(private scene:Book){this.guide=scene.add.graphics().setDepth(6);this.prepare();}
  prepare(){
    const s=this.scene;this.passed=false;this.moved=false;this.jumped=false;
    s.liveInk?.clear();s.ink=s.maxInk;s.player.teleport(this.step===6?200:130,581);s.checkpoint={x:130,y:550};s.checkpointLit=false;s.renderWell(false);
    s.cameras.main.centerOn(130,360);s.tool=tutorialSteps[this.step].tool;s.sketch=false;
    this.baselineLaunch=s.player.launchCount;this.baselineReset=s.resetCount;
    for(const [i,d] of s.drawings.entries()){
      d.def={...d.def,x:300+i*280,y:500,w:170,h:24,dx:i===0?0:i===1?130:120,dy:0};d.fromX=d.def.x+85;d.fromY=512;d.toX=d.fromX+(d.def.dx??0);d.toY=d.fromY;d.active=false;d.elapsed=0;
      d.body.setDisplaySize(170,24);d.body.body!.reset(d.fromX,d.fromY);d.body.body!.enable=this.step===6&&d.def.tool!=='stroke';d.art.setVisible(this.step===6);d.label.setVisible(this.step===6);
    }
    const z=s.sweepers[0];if(z){z.def={...z.def,x:500,y:this.step===5?575:510,dx:100,dy:0,period:3500};z.x=500;z.y=z.def.y;z.elapsed=0;z.disabled=0;z.frozen=false;}
    s.found.clear();s.fragments.forEach(f=>f.setVisible(this.step===7).setAlpha(1));s.checkpointArt?.setVisible(this.step>=7);
    s.refreshDrawings();s.hud();this.render();
  }
  advance(){if(!this.passed||this.step>=tutorialSteps.length-1)return;this.step++;this.prepare();}
  render(){
    ui.querySelector('#tutorial-panel')?.remove();if(!this.scene.isTutorial||this.scene.paused||this.scene.finished)return;
    const lesson=tutorialSteps[this.step],panel=document.createElement('section');panel.id='tutorial-panel';panel.className='tutorial-panel';
    panel.innerHTML=`<div class="tutorial-step">MECHANICS LAB · ${this.step+1} / ${tutorialSteps.length}</div><h3>${lesson.title}</h3><p class="tutorial-copy">${lesson.copy}</p><p class="tutorial-tip">${lesson.tip}</p><div class="tutorial-progress" aria-label="Tutorial progress">${tutorialSteps.map((_,i)=>`<span class="${i<this.step?'done':i===this.step?'current':''}"></span>`).join('')}</div><div class="tutorial-actions"></div>`;
    const actions=panel.querySelector('.tutorial-actions')!;
    if(this.step<tutorialSteps.length-1){const next=button(this.passed?'Next lesson →':'Try the mechanic',()=>this.advance(),'primary');next.id='next-lesson';next.disabled=!this.passed;actions.append(next);}
    actions.append(button('Retry lesson',()=>this.prepare()),button('Exit tutorial',()=>{this.scene.paused=true;this.scene.physics.pause();menu(n=>this.scene.start(n));}));
    ui.append(panel);
  }
  update(){
    const s=this.scene,p=s.player.sprite,b=p.body as Phaser.Physics.Arcade.Body;
    if(this.step===0){if(p.x>290)this.moved=true;if(b.velocity.y< -400)this.jumped=true;}
    let passed=false;
    switch(this.step){
      case 0:passed=this.moved&&this.jumped;break;
      case 1:passed=s.player.isDashing&&!b.blocked.down&&!b.touching.down;break;
      case 2:passed=!!s.liveInk?.drawings.some(d=>d.plan.tool==='stroke'&&d.plan.platforms.some(r=>b.right>r.x&&b.left<r.x+r.w&&Math.abs(b.bottom-r.y)<3)&&(b.blocked.down||b.touching.down));break;
      case 3:passed=s.player.launchCount>this.baselineLaunch;break;
      case 4:passed=s.sweepers.some(z=>z.frozen);break;
      case 5:passed=s.sweepers.some(z=>z.disabled>500);break;
      case 6:passed=s.sketch&&s.drawings.every(d=>d.active);break;
      case 7:passed=s.checkpointLit&&s.found.size>0&&s.resetCount>this.baselineReset;break;
    }
    if(passed&&!this.passed){this.passed=true;sound.play('checkpoint');this.render();}
    const g=this.guide.clear();g.lineStyle(2,0x65e5c2,.55);
    if(this.step===0){g.lineBetween(300,525,300,603);g.lineBetween(285,540,300,525);g.lineBetween(315,540,300,525);}
    if(this.step===2)for(let x=300;x<520;x+=24)g.lineBetween(x,480,x+14,480);
    if(this.step===3){g.lineBetween(145,565,350,430);g.lineBetween(350,430,330,435);g.lineBetween(350,430,345,450);}
    if(this.step===4){const z=s.sweepers[0];if(z)g.strokeCircle(z.x,z.y,68);}
    if(this.step===5){const z=s.sweepers[0];if(z){g.lineBetween(z.x-145,z.y,z.x-45,z.y);g.lineBetween(z.x-45,z.y,z.x-62,z.y-12);}}
  }
  destroy(){this.guide.destroy();ui.querySelector('#tutorial-panel')?.remove();}
}
