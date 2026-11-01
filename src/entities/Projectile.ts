import Phaser from 'phaser';
import type { TowerLevel, TowerId } from '../config/towers';
import type { Mob } from './Mob';
import type { IsoGrid } from '../systems/IsoGrid';

/** Homing projectile. Carries a snapshot of the firing tower's stats. */
export class Projectile {
  readonly sprite: Phaser.GameObjects.Image;
  private tx: number;
  private ty: number;
  /** Last known grid position of the target (for splash if it dies mid-flight). */
  gx: number;
  gy: number;
  done = false;

  constructor(
    scene: Phaser.Scene,
    private grid: IsoGrid,
    readonly kind: TowerId,
    x: number, y: number,
    readonly target: Mob,
    readonly stats: TowerLevel,
    readonly hitsAir: boolean,
    private speed: number,
  ) {
    this.sprite = scene.add.image(x, y, `proj-${kind}`).setDepth(50000);
    const hp = target.hitPoint();
    this.tx = hp.x; this.ty = hp.y;
    this.gx = target.gx; this.gy = target.gy;
  }

  /** Moves toward the target; returns true on impact. */
  update(dt: number): boolean {
    if (this.target.alive) {
      const hp = this.target.hitPoint();
      this.tx = hp.x; this.ty = hp.y; this.gx = this.target.gx; this.gy = this.target.gy;
    }
    const dx = this.tx - this.sprite.x, dy = this.ty - this.sprite.y;
    const d = Math.hypot(dx, dy);
    const step = this.speed * dt;
    this.sprite.rotation = Math.atan2(dy, dx);
    if (d <= Math.max(step, 6)) {
      this.sprite.setPosition(this.tx, this.ty);
      return true;
    }
    this.sprite.x += (dx / d) * step;
    this.sprite.y += (dy / d) * step;
    return false;
  }

  impactScreen() { return this.grid.toScreen(this.gx, this.gy); }

  destroy() { this.sprite.destroy(); this.done = true; }
}
