import Phaser from 'phaser';
import { sound } from './audio';
import { save } from './save';

const RUN_SPEED = 540;
const DASH_SPEED = 1000;
const DASH_DURATION = 140;
const DASH_COOLDOWN = 650;

/** A fixed physics body with independently animated ink artwork. */
export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  visual: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  keys: Record<string, Phaser.Input.Keyboard.Key>;
  lastGround = -999;
  lastJump = -999;
  wasGround = false;
  landed = false;
  clock = 0;
  isDashing = false;
  dashCooldown = 0;
  dashCount = 0;
  launchCount = 0;
  private dashRemaining = 0;
  private dashVector = new Phaser.Math.Vector2(1, 0);
  private facing = 1;
  private trailElapsed = 0;
  private launchRemaining = 0;

  get dashReady() { return this.dashCooldown <= 0 && !this.isDashing; }

  constructor(public scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, 'pip').setVisible(false);
    this.visual = scene.add.image(x, y, 'pip').setDepth(10);
    this.shadow = scene.add.ellipse(x, y + 29, 32, 6, 0x10141a, .22).setDepth(2);
    this.sprite.body!.setSize(32, 48).setOffset(17, 13);
    this.sprite.setMaxVelocity(RUN_SPEED, 1200).setDragX(6200).setCollideWorldBounds(false);
    this.keys = scene.input.keyboard!.addKeys({
      left: 'A', right: 'D', left2: 'LEFT', right2: 'RIGHT',
      up: 'W', down: 'S', up2: 'UP', down2: 'DOWN',
      jump: 'SPACE', dash: 'SHIFT', dash2: 'X',
    }) as typeof this.keys;
  }

  update(dt: number, disabled = false, drawing = false) {
    this.clock += dt;
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;
    this.landed = grounded && !this.wasGround;
    if (grounded && !this.isDashing) this.lastGround = this.clock;

    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.jump);
    const jumpReleased = Phaser.Input.Keyboard.JustUp(this.keys.jump);
    const shiftPressed = Phaser.Input.Keyboard.JustDown(this.keys.dash);
    const xPressed = Phaser.Input.Keyboard.JustDown(this.keys.dash2);
    if (jumpPressed && !disabled) this.lastJump = this.clock;

    const horizontal = disabled ? 0 : Number(this.keys.right.isDown || this.keys.right2.isDown)
      - Number(this.keys.left.isDown || this.keys.left2.isDown);
    const vertical = disabled ? 0 : Number(this.keys.down.isDown || this.keys.down2.isDown)
      - Number(this.keys.up.isDown || this.keys.up2.isDown);
    if (horizontal) this.facing = horizontal;

    if (!disabled && (shiftPressed || xPressed) && this.dashReady) {
      this.dashVector.set(horizontal || (vertical ? 0 : this.facing), vertical).normalize();
      this.dashRemaining = DASH_DURATION;
      this.dashCooldown = DASH_COOLDOWN;
      this.isDashing = true;
      this.launchRemaining = 0;
      this.lastJump = -999;
      this.lastGround = -999;
      this.dashCount++;
      sound.play('dash');
      this.scene.events.emit('player-dash', this.dashVector.x, this.dashVector.y);
    }

    if (this.isDashing) {
      body.setAllowGravity(false);
      this.sprite.setMaxVelocity(DASH_SPEED, DASH_SPEED).setAcceleration(0, 0).setDragX(0);
      this.sprite.setVelocity(this.dashVector.x * DASH_SPEED, this.dashVector.y * DASH_SPEED);
      this.dashRemaining -= dt;
      if (this.dashRemaining <= 0 || disabled) {
        this.isDashing = false;
        body.setAllowGravity(true);
        this.sprite.setMaxVelocity(RUN_SPEED, 1200).setDragX(6200);
        this.sprite.setVelocityX(this.dashVector.x * RUN_SPEED);
        // Preserve a little vertical momentum without turning a dash into flight.
        if (this.dashVector.y) this.sprite.setVelocityY(this.dashVector.y * 340);
      }
    } else if (this.launchRemaining > 0 && !disabled) {
      this.launchRemaining = Math.max(0, this.launchRemaining - dt);
      body.setAllowGravity(true);
      this.sprite.setMaxVelocity(1200, 1200).setAccelerationX(horizontal * 900).setDragX(0);
    } else {
      body.setAllowGravity(true);
      this.sprite.setMaxVelocity(RUN_SPEED, 1200).setDragX(6200).setAccelerationX(horizontal * 5600);
      if (!horizontal && Math.abs(body.velocity.x) < 20) this.sprite.setVelocityX(0);
      if (!disabled && this.clock - this.lastJump < 130 && this.clock - this.lastGround < 95) {
        this.sprite.setVelocityY(-800);
        this.lastJump = -999;
        this.lastGround = -999;
        sound.play('jump');
      }
      if (jumpReleased && body.velocity.y < -270) this.sprite.setVelocityY(-270);
    }

    const running = grounded && Math.abs(body.velocity.x) > 40;
    const speed = Math.abs(body.velocity.x);
    this.visual.setFlipX(this.facing < 0).setPosition(this.sprite.x, this.sprite.y);
    this.visual.setScale(1, 1).setRotation(0);
    if (!save.reduced) {
      if (this.isDashing) {
        this.visual.setScale(1.2, .78).setRotation(this.facing * .15);
      } else if (running) {
        const step = Math.sin(this.clock * .045);
        this.visual.setScale(1 + step * .035, 1 - step * .035).setRotation(this.facing * .11);
      } else if (!grounded) {
        this.visual.setScale(.96, 1.04).setRotation(this.facing * .06);
      }
      if (drawing) this.visual.rotation += this.facing * .035;
      if (this.landed) this.visual.setScale(1.1, .88);
    }
    if (this.landed && body.velocity.y >= 0) sound.play('land');
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 29).setVisible(grounded);
    this.trailElapsed += dt;
    if (!save.reduced && (this.isDashing || speed > 450) && this.trailElapsed >= (this.isDashing ? 22 : 65)) {
      this.trailElapsed = 0;
      const trail = this.scene.add.image(this.sprite.x, this.sprite.y, 'pip')
        .setDepth(8).setFlipX(this.facing < 0).setScale(this.visual.scaleX, this.visual.scaleY)
        .setRotation(this.visual.rotation).setTint(this.isDashing ? 0xefe55b : 0x72979c)
        .setAlpha(this.isDashing ? .34 : .13);
      this.scene.tweens.add({ targets: trail, alpha: 0, duration: 140, onComplete: () => trail.destroy() });
    }
    this.wasGround = grounded;
  }

  /** Called by a drawn Arrow to preserve its impulse through movement updates. */
  launch(vx: number, vy: number, duration = 180) {
    this.launchCount++;
    this.isDashing = false;
    this.dashRemaining = 0;
    this.launchRemaining = Math.max(0, duration);
    this.lastGround = -999;
    this.lastJump = -999;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    this.sprite.setMaxVelocity(1200, 1200).setAcceleration(0, 0).setDragX(0).setVelocity(vx, vy);
    if (vx) this.facing = Math.sign(vx);
  }

  teleport(x: number, y: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.reset(x, y);
    body.setAllowGravity(true);
    this.sprite.setMaxVelocity(RUN_SPEED, 1200).setVelocity(0, 0).setAcceleration(0, 0).setDragX(6200);
    this.visual.setPosition(x, y).setScale(1).setRotation(0);
    this.shadow.setPosition(x, y + 29).setVisible(false);
    this.lastGround = -999;
    this.lastJump = -999;
    this.wasGround = false;
    this.landed = false;
    this.isDashing = false;
    this.dashRemaining = 0;
    this.dashCooldown = 0;
    this.launchRemaining = 0;
    this.trailElapsed = 0;
    // Consume queued actions while retaining held movement for immediate retries.
    for (const key of [this.keys.jump, this.keys.dash, this.keys.dash2]) {
      Phaser.Input.Keyboard.JustDown(key);
      Phaser.Input.Keyboard.JustUp(key);
    }
  }
}
