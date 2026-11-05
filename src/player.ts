import Phaser from 'phaser';
import {sound} from './audio';
export class Player {
 sprite:Phaser.Physics.Arcade.Sprite;visual:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Ellipse;keys:Record<string,Phaser.Input.Keyboard.Key>;lastGround=-999;lastJump=-999;wasGround=false;landed=false;clock=0;
 constructor(public scene:Phaser.Scene,x:number,y:number){this.sprite=scene.physics.add.sprite(x,y,'pip').setVisible(false);this.visual=scene.add.image(x,y,'pip').setDepth(10);this.shadow=scene.add.ellipse(x,y+28,32,6,0x303a38,.12).setDepth(2);this.sprite.body!.setSize(32,48).setOffset(17,13);this.sprite.setMaxVelocity(330,900).setDragX(2200).setCollideWorldBounds(false);this.keys=scene.input.keyboard!.addKeys({left:'A',right:'D',left2:'LEFT',right2:'RIGHT',jump:'SPACE'}) as typeof this.keys;}
 update(dt:number,disabled=false,drawing=false){this.clock+=dt;const b=this.sprite.body as Phaser.Physics.Arcade.Body;const ground=b.blocked.down||b.touching.down;this.landed=ground&&!this.wasGround;if(ground)this.lastGround=this.clock;
 if(Phaser.Input.Keyboard.JustDown(this.keys.jump)&&!disabled)this.lastJump=this.clock;
 const dir=disabled?0:Number(this.keys.right.isDown||this.keys.right2.isDown)-Number(this.keys.left.isDown||this.keys.left2.isDown);
 this.sprite.setAccelerationX(dir*2400);if(!dir&&Math.abs(b.velocity.x)<15)this.sprite.setVelocityX(0);
 if(!disabled&&this.clock-this.lastJump<140&&this.clock-this.lastGround<110){this.sprite.setVelocityY(-730);this.lastJump=-999;this.lastGround=-999;this.wasGround=false;sound.play('jump');}
 if(Phaser.Input.Keyboard.JustUp(this.keys.jump)&&b.velocity.y< -230)this.sprite.setVelocityY(-230);
 if(dir)this.visual.setFlipX(dir<0);
 const moving=ground&&Math.abs(b.velocity.x)>25;const bob=moving?Math.sin(this.clock*.025)*.06:Math.sin(this.clock*.004)*.018;
 this.visual.setScale(1+bob,1-bob);if(!ground)this.visual.setScale(b.velocity.y<0?.91:1.04,b.velocity.y<0?1.12:.98);
 this.visual.rotation=moving?Math.sin(this.clock*.025)*.07:0;
 if(this.landed){sound.play('land');this.visual.setScale(1.18,.8);}
 this.visual.setPosition(this.sprite.x,this.sprite.y);this.shadow.setPosition(this.sprite.x,this.sprite.y+29).setVisible(ground);if(drawing)this.visual.rotation=Math.sin(this.clock*.012)*.08;this.wasGround=ground;
 }
 teleport(x:number,y:number){this.sprite.setPosition(x,y);this.visual.setPosition(x,y);this.sprite.setVelocity(0,0);this.sprite.setAccelerationX(0);this.lastGround=-999;this.lastJump=-999;}
}
