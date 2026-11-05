import Phaser from 'phaser';
export const ink=0x303a38,paper=0xf4efdf;
export function makeArt(s:Phaser.Scene){
 const g=s.make.graphics({x:0,y:0});
 g.fillStyle(paper);g.fillRect(0,0,128,128);for(let i=0;i<600;i++){const x=(i*71.41)%128,y=(i*37.13)%128;g.fillStyle(i%2?0x827761:0xffffff,.06);g.fillRect(x,y,1,1);}g.generateTexture('paper',128,128);g.clear();
 // The doodle is drawn at double resolution for a crisp, imperfect ink edge.
 g.lineStyle(3,ink);g.fillStyle(0xfffcf0);g.fillEllipse(32,27,40,40);g.strokeEllipse(32,27,40,40);g.lineStyle(1,ink,.5);g.strokeEllipse(33,26,39,41);g.fillStyle(ink);g.fillEllipse(26,26,4,7);g.fillEllipse(39,26,4,7);g.lineStyle(2,ink);g.beginPath();g.arc(33,29,8,.3,2.7);g.strokePath();g.fillStyle(0xe5ad82,.6);g.fillCircle(20,33,4);g.fillCircle(44,33,4);g.lineStyle(4,ink);g.lineBetween(23,45,18,58);g.lineBetween(40,45,45,58);g.lineBetween(15,58,23,58);g.lineBetween(41,58,49,58);g.lineStyle(3,ink);g.lineBetween(13,33,5,43);g.lineBetween(51,33,58,25);g.lineStyle(4,0xc49c4d);g.lineBetween(56,29,61,9);g.fillStyle(ink);g.fillTriangle(59,10,64,11,63,3);g.generateTexture('pip',68,64);g.clear();
 g.fillStyle(ink);g.fillCircle(4,4,4);g.generateTexture('dot',8,8);g.destroy();
}
export function hatch(g:Phaser.GameObjects.Graphics,x:number,y:number,w:number,h:number,color=ink){g.fillStyle(paper);g.fillRect(x,y,w,h);g.lineStyle(2,color);g.strokeRect(x,y,w,h);g.lineStyle(1,color,.35);for(let i=7;i<w;i+=13)g.lineBetween(x+i,y+h-2,x+Math.min(w-2,i+12),y+3);g.lineStyle(1,color,.4);g.lineBetween(x+2,y-2,x+w-3,y-1);}
export function scenery(s:Phaser.Scene,width:number,color:number,chapter:number){
 s.add.tileSprite(0,0,width,760,'paper').setOrigin(0);
 const back=s.add.graphics().setScrollFactor(.35,1);back.lineStyle(1,0x91a9a5,.16);for(let y=45;y<720;y+=32)back.lineBetween(0,y,width,y);back.lineStyle(2,0xc87869,.25);back.lineBetween(90,0,90,760);
 for(let x=220;x<width;x+=330){const y=420+Math.sin(x)*35;back.fillStyle(color,.07);back.fillEllipse(x,y,270,220);back.lineStyle(2,ink,.12);
 if(chapter===0){back.lineBetween(x,y+120,x,y-20);for(let j=0;j<4;j++)back.strokeEllipse(x+(j%2?25:-25),y+j*24,60,25);}
 if(chapter===1){back.strokeRect(x-65,y-80,130,200);for(let j=0;j<3;j++)back.strokeRect(x-50+j*40,y-55,20,25);back.lineBetween(x-80,y-80,x,y-140);back.lineBetween(x,y-140,x+80,y-80);}
 if(chapter===2){back.strokeCircle(x,y,85);for(let a=0;a<12;a++){const r=a*Math.PI/6;back.lineBetween(x+Math.cos(r)*70,y+Math.sin(r)*70,x+Math.cos(r)*82,y+Math.sin(r)*82);}back.lineBetween(x,y,x+40,y-25);back.lineBetween(x,y,x,y-60);}
 if(chapter===3){back.beginPath();back.moveTo(x-80,y+80);back.lineTo(x,y-100);back.lineTo(x+100,y+80);back.closePath();back.strokePath();back.strokeCircle(x,y-20,25);}
 }
 const edge=s.add.graphics();edge.lineStyle(2,ink,.2);for(let x=0;x<width;x+=14)edge.lineBetween(x,690+Math.sin(x)*4,x+14,690+Math.sin(x+14)*4);
}
