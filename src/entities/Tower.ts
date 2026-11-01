import Phaser from 'phaser';
import { TOWERS, type TowerDef, type TowerId, type TowerLevel } from '../config/towers';
import type { IsoGrid } from '../systems/IsoGrid';
import type { Mob } from './Mob';
import { objOriginY, TOWER_TEX_H } from '../art/TextureFactory';

export class Tower {
  readonly def: TowerDef;
  level = 1;
  invested: number;
  readonly sprite: Phaser.GameObjects.Image;
  private cooldown = 0;

  constructor(scene: Phaser.Scene, private grid: IsoGrid, readonly type: TowerId, readonly c: number, readonly r: number) {
    this.def = TOWERS[type];
    this.invested = this.def.levels[0].cost;
    const p = grid.tileCenter(c, r);
    this.sprite = scene.add.image(p.x, p.y, this.textureKey()).setOrigin(0.5, objOriginY(TOWER_TEX_H)).setDepth(p.y);
  }

  get stats(): TowerLevel { return this.def.levels[this.level - 1]; }
  get nextLevel(): TowerLevel | undefined { return this.def.levels[this.level]; }
  get gx() { return this.c + 0.5; }
  get gy() { return this.r + 0.5; }
  /** Screen point projectiles leave from (top of tower). */
  muzzle() {
    const p = this.grid.tileCenter(this.c, this.r);
    return { x: p.x, y: p.y - 40 - this.level * 9 };
  }

  textureKey() { return `tower-${this.type}-${this.level}`; }

  canHit(m: Mob) {
    if (this.def.targets === 'ground') return !m.flying;
    if (this.def.targets === 'air') return m.flying;
    return true;
  }

  inRange(m: Mob, range = this.stats.range) {
    return Math.hypot(m.gx - this.gx, m.gy - this.gy) <= range;
  }

  /** Ticks cooldown; returns a target to fire at when ready. Targets the mob furthest along the road. */
  update(dt: number, mobs: Mob[]): Mob | null {
    this.cooldown -= dt;
    if (this.cooldown > 0) return null;
    // Keep leftover time so fire rate stays exact at high game speeds.
    let best: Mob | null = null;
    for (const m of mobs) {
      if (!m.alive || !this.canHit(m) || !this.inRange(m)) continue;
      if (!best || m.progress > best.progress) best = m;
    }
    if (best) this.cooldown += 1 / this.stats.rate;
    else this.cooldown = 0;
    return best;
  }

  upgrade(): boolean {
    const next = this.nextLevel;
    if (!next) return false;
    this.level++;
    this.invested += next.cost;
    this.sprite.setTexture(this.textureKey());
    return true;
  }

  destroy() { this.sprite.destroy(); }
}
