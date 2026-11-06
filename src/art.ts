import Phaser from 'phaser';
import { save } from './save';

export const ink = 0xeeeadd;
export const paper = 0x15191c;
const red = 0xff604d;

export function makeArt(s: Phaser.Scene) {
  const g = s.make.graphics({ x: 0, y: 0 });
  g.fillStyle(paper).fillRect(0, 0, 128, 128);
  for (let i = 0; i < 420; i++) {
    g.fillStyle(i % 2 ? 0x9ba28b : 0x000000, .035);
    g.fillRect((i * 71.41) % 128, (i * 37.13) % 128, 1, 1);
  }
  g.lineStyle(1, 0x6c816e, .045).lineBetween(0, 63, 128, 63).lineBetween(63, 0, 63, 128);
  g.generateTexture('paper', 128, 128);
  g.clear();

  // Each drawing shares a 68×64 canvas. Animation never changes the physics frame.
  drawCourier(g, 'idle', 0); g.generateTexture('pip', 68, 64);
  drawCourier(g, 'idle', 1); g.generateTexture('pip-idle', 68, 64);
  for (let frame = 0; frame < 8; frame++) {
    drawCourier(g, 'run', frame / 8 * Math.PI * 2);
    g.generateTexture(`pip-run-${frame}`, 68, 64);
  }
  for (const pose of ['jump', 'fall', 'dash'] as const) {
    drawCourier(g, pose, 0); g.generateTexture(`pip-${pose}`, 68, 64);
  }
  g.clear().fillStyle(ink).fillCircle(4, 4, 4);
  g.generateTexture('dot', 8, 8);
  g.destroy();
}

type CourierPose = 'idle' | 'run' | 'jump' | 'fall' | 'dash';
type Joint = [number, number];

/** A porcelain mask, a split travelling coat, and a single vermilion ribbon. */
function drawCourier(g: Phaser.GameObjects.Graphics, pose: CourierPose, phase: number) {
  g.clear();
  const outline = 0x101c25, coat = 0x354952, seam = 0x94aeb4;
  const porcelain = 0xf3eee1, shade = 0xc4c7be, ribbon = 0xf36d50;
  const running = pose === 'run', airborne = pose === 'jump' || pose === 'fall', dash = pose === 'dash';
  const swing = running ? Math.sin(phase) : 0;
  const lean = dash ? 7 : running ? 3 : airborne ? 1 : 0;
  const bob = running ? Math.abs(Math.cos(phase)) * 1.4 : 0;
  const polygon = (points: Joint[], color: number, edge = false) => {
    const vertices = points.map(([x,y]) => ({x,y}));
    g.fillStyle(color).fillPoints(vertices, true);
    if (edge) g.lineStyle(1.2, outline).strokePoints(vertices, true);
  };
  const limb = (points: Joint[], color: number, width: number) => {
    const vertices = points.map(([x,y]) => ({x,y}));
    g.lineStyle(width + 2, outline).strokePoints(vertices);
    g.lineStyle(width, color).strokePoints(vertices);
  };
  const foot = ([x,y]: Joint, color: number) => {
    polygon([[x-3,y-3],[x+3,y-3],[x+7,y],[x+6,y+2],[x-4,y+2]],color,true);
    g.lineStyle(1,porcelain,.7).lineBetween(x-2,y+1,x+5,y+1);
  };
  const backHip: Joint = [31+lean*.3,42-bob], frontHip: Joint = [39+lean*.3,42-bob];
  let backKnee: Joint = [29,50], backFoot: Joint = [27,60];
  let frontKnee: Joint = [40,51], frontFoot: Joint = [42,60];
  if (running) {
    backKnee=[30-swing*8,48-bob]; backFoot=[32-swing*17,58-Math.max(0,swing)*10];
    frontKnee=[39+swing*8,48-bob]; frontFoot=[38+swing*17,58-Math.max(0,-swing)*10];
  } else if (pose === 'jump') {
    backKnee=[25,47]; backFoot=[18,44]; frontKnee=[44,47]; frontFoot=[39,56];
  } else if (pose === 'fall') {
    backKnee=[27,48]; backFoot=[23,58]; frontKnee=[44,49]; frontFoot=[49,56];
  } else if (dash) {
    backKnee=[25,46]; backFoot=[13,49]; frontKnee=[35,49]; frontFoot=[24,56];
  }
  // Rear limbs are a darker value, keeping the stride readable at full speed.
  limb([backHip,backKnee,backFoot],0x73868b,5); foot(backFoot,shade);
  const shoulderY=29-bob;
  const rearElbow: Joint = dash ? [25,34] : [25-swing*5,37-bob];
  const rearHand: Joint = dash ? [17,31] : [21-swing*8,39-Math.abs(swing)*5-bob];
  limb([[30+lean,shoulderY],rearElbow,rearHand],coat,4.5);
  g.fillStyle(shade).fillCircle(rearHand[0],rearHand[1],2.6);
  // The ribbon changes silhouette with the gait; it trails horizontally during a dash.
  const wave=running?Math.cos(phase)*2:phase;
  const tailY=dash?22:26+wave;
  polygon([[34+lean,22-bob],[22,20-bob],[11,tailY-4],[3,tailY-2],[9,tailY+2],[6,tailY+6],[20,tailY+3],[34+lean,28-bob]],0xa2463a,true);
  polygon([[34+lean,22-bob],[21,21-bob],[11,tailY-3],[4,tailY-2],[13,tailY+1],[24,24-bob],[34+lean,26-bob]],ribbon);
  g.lineStyle(1,0xffb08a,.65).lineBetween(12,tailY-2,23,22-bob);
  // Split coat and pale front panel make a narrow, recognisable silhouette.
  polygon([[29+lean,24-bob],[42+lean,24-bob],[45+lean*.5,40-bob],[49,49-bob],[37,45-bob],[28,49-bob],[27+lean*.3,37-bob]],coat,true);
  polygon([[32+lean,26-bob],[42+lean,25-bob],[41+lean*.6,37-bob],[34+lean*.3,41-bob],[31+lean*.3,35-bob]],porcelain);
  polygon([[28+lean*.3,37-bob],[33+lean*.3,40-bob],[29,46-bob]],seam);
  polygon([[38+lean*.3,39-bob],[43+lean*.5,37-bob],[46,46-bob]],0x6c838b);
  g.lineStyle(1,seam,.7).lineBetween(29+lean,28-bob,28+lean*.3,38-bob);
  g.lineStyle(2,outline).lineBetween(31+lean*.3,39-bob,43+lean*.3,37-bob);
  g.fillStyle(ribbon).fillRect(37+lean*.3,37-bob,3,3);
  limb([frontHip,frontKnee,frontFoot],porcelain,5.2); foot(frontFoot,porcelain);
  // Head stays compact; the mask is a blade of warm white inside a dark hood.
  const hx=lean, hy=-bob;
  polygon([[27+hx,9+hy],[32+hx,4+hy],[43+hx,5+hy],[49+hx,12+hy],[48+hx,21+hy],[41+hx,27+hy],[29+hx,23+hy],[25+hx,16+hy]],coat,true);
  polygon([[29+hx,9+hy],[34+hx,6+hy],[44+hx,8+hy],[47+hx,12+hy],[34+hx,12+hy],[30+hx,18+hy]],seam);
  polygon([[34+hx,12+hy],[49+hx,12+hy],[48+hx,19+hy],[42+hx,24+hy],[34+hx,21+hy],[31+hx,17+hy]],porcelain,true);
  polygon([[39+hx,21+hy],[47+hx,18+hy],[42+hx,24+hy]],shade);
  g.lineStyle(2.5,outline).lineBetween(37+hx,15+hy,47+hx,15+hy);
  g.lineStyle(1,0x8ee4d4).lineBetween(42+hx,15+hy,46+hx,15+hy);
  g.lineStyle(1,porcelain,.8).lineBetween(32+hx,6+hy,40+hx,6+hy);
  polygon([[29+hx,23+hy],[43+hx,24+hy],[42+hx,28+hy],[29+hx,27+hy]],ribbon,true);
  // A nib-shaped instrument is held ahead of the body, visually linking runner and ink.
  const frontElbow: Joint = dash ? [50,32] : [47+lean*.3+swing*2,34-bob];
  const hand: Joint = dash ? [57,29] : [50+swing*3,39-bob-Math.max(0,swing)*5];
  limb([[42+lean,29-bob],frontElbow,hand],coat,4.5);
  g.fillStyle(porcelain).fillCircle(hand[0],hand[1],2.8);
  const nibX=dash?64:hand[0]+7, nibY=dash?19:hand[1]-13;
  g.lineStyle(3,outline).lineBetween(hand[0]-1,hand[1]+4,nibX,nibY);
  g.lineStyle(1.6,0x9ce3d5).lineBetween(hand[0]-1,hand[1]+4,nibX,nibY);
  polygon([[nibX-2,nibY+2],[nibX+2,nibY+3],[nibX+2,nibY-5]],porcelain);
}

export function hatch(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color = ink) {
  g.fillStyle(0x222c2b).fillRect(x, y, w, h);
  g.lineStyle(1, color, .55).strokeRect(x, y, w, h);
  g.lineStyle(1, color, .13);
  for (let i = 8; i < w; i += 15) g.lineBetween(x + i, y + h - 2, x + Math.min(w - 2, i + h), y + 3);
  g.lineStyle(3, color, .9).lineBetween(x, y, x + w, y);
  g.lineStyle(1, color, .24).lineBetween(x + 4, y + 4, x + w - 3, y + 3);
  if (w > 90) {
    g.fillStyle(color, .4);
    g.fillRect(x + 5, y + h - 5, 14, 2);
    g.fillRect(x + w - 19, y + h - 5, 14, 2);
  }
}

function gear(s: Phaser.Scene, x: number, y: number, radius: number, color: number, duration: number) {
  const g = s.add.graphics({ x, y }).setScrollFactor(.38, 1);
  g.lineStyle(2, color, .13).strokeCircle(0, 0, radius);
  g.lineStyle(1, color, .14).strokeCircle(0, 0, radius * .7);
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    g.lineBetween(Math.cos(a) * radius * .88, Math.sin(a) * radius * .88, Math.cos(a) * radius * 1.12, Math.sin(a) * radius * 1.12);
  }
  g.lineStyle(2, color, .15).lineBetween(-radius, 0, radius, 0).lineBetween(0, -radius, 0, radius);
  if (!save.reduced) s.tweens.add({ targets: g, rotation: Math.PI * 2, duration, repeat: -1 });
}

export function scenery(s: Phaser.Scene, width: number, color: number, chapter: number) {
  s.add.tileSprite(0, 0, width, 760, 'paper').setOrigin(0);
  s.add.rectangle(0, 0, width, 760, color, .16).setOrigin(0);
  s.add.ellipse(width * .3, 340, 1500, 900, color, .045).setScrollFactor(.4, 1);
  const back = s.add.graphics().setScrollFactor(.28, 1);
  back.lineStyle(1, color, .035);
  for (let y = 110; y < 720; y += 50) back.lineBetween(0, y, width, y);
  for (let x = 30; x < width; x += 160) back.lineBetween(x, 110, x, 720);
  // Under-drawn technical structures: marks that keep being reworked, not a pastoral backdrop.
  for (let x = 100; x < width; x += 390) {
    const y = 250 + Math.sin(x * .007) * 70;
    back.fillStyle(color, .025).fillTriangle(x - 120, y + 250, x + 120, y - 100, x + 370, y + 250);
    back.lineStyle(1, color, .105);
    if (chapter === 0) {
      back.strokeTriangle(x - 80, y + 200, x + 60, y - 20, x + 200, y + 200);
      back.lineBetween(x - 100, y + 190, x + 180, y - 75);
      back.lineBetween(x + 160, y - 60, x + 180, y - 75).lineBetween(x + 180, y - 75, x + 175, y - 49);
      back.strokeRect(x + 10, y + 70, 75, 75);
    } else if (chapter === 1) {
      back.strokeRect(x - 30, y - 20, 145, 260);
      back.strokeRect(x - 60, y + 20, 205, 180);
      for (let k = 0; k < 6; k++) back.lineBetween(x - 20, y + k * 34, x + 100, y + k * 34);
      back.lineBetween(x - 90, y - 50, x - 90, y + 250);
      back.lineBetween(x + 175, y - 30, x + 175, y + 220);
    } else if (chapter === 2) {
      gear(s, x + 80, y + 90, 85, color, 18000);
      gear(s, x + 200, y + 190, 50, color, 12000);
      back.lineBetween(x - 90, y - 20, x + 70, y + 90).lineBetween(x + 80, y + 90, x + 250, y + 250);
    } else {
      back.strokeRect(x, y, 150, 180);
      back.lineBetween(x - 20, y + 10, x + 180, y + 170);
      back.lineBetween(x - 20, y + 170, x + 180, y + 10);
      back.strokeCircle(x + 80, y + 85, 85);
      back.lineStyle(2, red, .07).lineBetween(x - 70, y + 240, x + 170, y - 80);
    }
    back.lineStyle(1, color, .16).lineBetween(x, y - 50, x + 8, y - 50).lineBetween(x + 4, y - 54, x + 4, y - 46);
  }
  const scars = s.add.graphics().setScrollFactor(.65, 1);
  scars.lineStyle(1, ink, .035);
  for (let x = 0; x < width; x += 190) {
    const y = 120 + ((x * 37) % 430);
    scars.lineBetween(x, y, x + 65, y - 9);
    scars.lineBetween(x + 12, y + 6, x + 47, y + 1);
  }
  const bottom = s.add.graphics();
  bottom.fillStyle(0x0c1115, .45).fillRect(0, 700, width, 60);
  bottom.lineStyle(1, red, .2);
  for (let x = 0; x < width; x += 32) bottom.lineBetween(x, 710, x + 10, 700);
  // Sparse breathing marks make the sketchbook feel alive without hiding collision edges.
  if (!save.reduced) {
    for (let i = 0; i < 8; i++) {
      const x = (i * 347 + 160) % width, y = 150 + (i * 71) % 340;
      const mote = s.add.rectangle(x, y, i % 2 ? 2 : 12, 1, color, .12).setScrollFactor(.5, 1);
      s.tweens.add({ targets: mote, x: x - 90, y: y - 20, alpha: 0, duration: 2200 + i * 250, repeat: -1, yoyo: true, delay: i * 160 });
    }
  }
}
