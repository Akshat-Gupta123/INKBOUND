import Phaser from 'phaser';
import { save } from './save';

export const ink = 0xeeeadd;
export const paper = 0x15191c;
const acid = 0xd8ed62;
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

  // Faceted runner, cut in white ink. Keep its silhouette inside the fixed 68×64 frame.
  g.fillStyle(red);
  g.fillPoints([{ x: 34, y: 29 }, { x: 5, y: 23 }, { x: 10, y: 33 }, { x: 2, y: 38 }, { x: 37, y: 36 }], true);
  g.fillStyle(ink);
  g.fillPoints([{ x: 23, y: 4 }, { x: 46, y: 3 }, { x: 56, y: 17 }, { x: 49, y: 36 }, { x: 24, y: 34 }, { x: 16, y: 18 }], true);
  g.lineStyle(1, 0xffffff, .35).lineBetween(24, 1, 47, 0).lineBetween(57, 16, 51, 36);
  g.fillStyle(paper);
  g.fillPoints([{ x: 29, y: 17 }, { x: 51, y: 14 }, { x: 49, y: 22 }, { x: 31, y: 24 }], true);
  g.fillStyle(acid).fillRect(40, 17, 8, 2);
  g.fillStyle(ink).fillPoints([{ x: 27, y: 34 }, { x: 46, y: 34 }, { x: 41, y: 48 }, { x: 26, y: 47 }], true);
  g.lineStyle(6, ink).lineBetween(30, 46, 22, 59).lineBetween(39, 47, 48, 58);
  g.lineStyle(4, ink).lineBetween(18, 60, 28, 60).lineBetween(45, 60, 54, 60);
  g.lineStyle(4, ink).lineBetween(44, 36, 53, 40).lineBetween(28, 38, 17, 43);
  g.lineStyle(4, acid).lineBetween(55, 39, 62, 22);
  g.fillStyle(ink).fillTriangle(60, 23, 64, 25, 65, 17);
  g.generateTexture('pip', 68, 64);
  g.clear().fillStyle(ink).fillCircle(4, 4, 4);
  g.generateTexture('dot', 8, 8);
  g.destroy();
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
