import Phaser from 'phaser';
import type { MobDef } from '../config/mobs';
import type { IsoGrid, Pt } from '../systems/IsoGrid';
import { objOriginY } from '../art/TextureFactory';

const FLY_HEIGHT = 30;

/** An enemy walking (or flying) along the road's waypoints in grid space. */
export class Mob {
  hp: number;
  readonly maxHp: number;
  gx: number;
  gy: number;
  /** Distance travelled along the path (tiles) — used for "first" targeting. */
  progress = 0;
  alive = true;
  leaked = false;
  private seg = 1;
  private slowFactor = 1;
  private slowUntil = 0;
  private bobPhase = Math.random() * Math.PI * 2;
  readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, private grid: IsoGrid, private path: Pt[], readonly def: MobDef, hpScale: number) {
    this.maxHp = this.hp = Math.round(def.hp * hpScale);
    this.gx = path[0].x;
    this.gy = path[0].y;
    const key = `mob-${def.id}`;
    const tex = scene.textures.get(key).getSourceImage();
    this.sprite = scene.add.image(0, 0, key).setOrigin(0.5, objOriginY(tex.height));
    if (def.flying) this.shadow = scene.add.image(0, 0, 'shadow').setScale(0.8);
    this.sync(0);
  }

  get flying() { return this.def.flying; }
  get speedNow() { return this.def.speed * this.slowFactor; }

  update(dt: number, now: number) {
    if (now >= this.slowUntil && this.slowFactor !== 1) {
      this.slowFactor = 1;
      this.sprite.clearTint();
    }
    let remaining = this.speedNow * dt;
    const prevX = this.screen().x;
    while (remaining > 0 && this.seg < this.path.length) {
      const t = this.path[this.seg];
      const dx = t.x - this.gx, dy = t.y - this.gy;
      const d = Math.hypot(dx, dy);
      if (d <= remaining) {
        this.gx = t.x; this.gy = t.y; this.progress += d; remaining -= d; this.seg++;
      } else {
        this.gx += (dx / d) * remaining; this.gy += (dy / d) * remaining; this.progress += remaining; remaining = 0;
      }
    }
    if (this.seg >= this.path.length) this.leaked = true;
    const nx = this.screen().x;
    if (Math.abs(nx - prevX) > 0.01) this.sprite.setFlipX(nx < prevX);
    this.sync(now);
  }

  screen(): Pt { return this.grid.toScreen(this.gx, this.gy); }

  /** Where projectiles should aim (roughly the body center). */
  hitPoint(): Pt {
    const s = this.screen();
    const h = this.sprite.displayHeight * 0.4;
    return { x: s.x, y: s.y - h - (this.flying ? FLY_HEIGHT : 0) };
  }

  /** Top of the sprite, for the HP bar. */
  topY(): number { return this.sprite.y - this.sprite.displayHeight * this.sprite.originY - 4; }

  private sync(now: number) {
    const s = this.screen();
    const bob = this.flying ? Math.sin(now * 5 + this.bobPhase) * 3 : Math.abs(Math.sin(now * 8 + this.bobPhase)) * -1.5;
    this.sprite.setPosition(s.x, s.y - (this.flying ? FLY_HEIGHT : 0) + bob);
    // Depth sort by ground y; flyers render above ground units around them.
    this.sprite.setDepth(s.y + (this.flying ? 80 : 0));
    this.shadow?.setPosition(s.x, s.y).setDepth(s.y - 1);
  }

  /** Returns true if this hit killed it. */
  damage(amount: number): boolean {
    if (!this.alive) return false;
    this.hp -= amount;
    if (this.hp <= 0) { this.hp = 0; this.alive = false; return true; }
    return false;
  }

  applySlow(factor: number, duration: number, now: number) {
    // Boss is partially resistant.
    const f = this.def.boss ? 1 - (1 - factor) * 0.5 : factor;
    this.slowFactor = now >= this.slowUntil ? f : Math.min(this.slowFactor, f);
    this.slowUntil = Math.max(this.slowUntil, now + duration);
    this.sprite.setTint(0x9fdcff);
  }

  destroy() {
    this.sprite.destroy();
    this.shadow?.destroy();
  }
}
