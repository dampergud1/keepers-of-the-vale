export type TowerId = 'arrow' | 'cannon' | 'frost' | 'arcane';
export type TargetMode = 'ground' | 'air' | 'both';

export interface TowerLevel {
  /** Gold to build (level 1) or to upgrade into this level. */
  cost: number;
  damage: number;
  /** Range in tiles. */
  range: number;
  /** Shots per second. */
  rate: number;
  /** Splash radius in tiles (0 = single target). */
  splash?: number;
  /** Speed multiplier applied on hit (e.g. 0.5 = half speed). */
  slow?: number;
  /** Slow duration in seconds. */
  slowDuration?: number;
}

export interface TowerDef {
  id: TowerId;
  name: string;
  hotkey: string;
  blurb: string;
  targets: TargetMode;
  projectile: TowerId;
  /** Projectile speed in screen px / second. */
  projectileSpeed: number;
  color: number;
  levels: [TowerLevel, TowerLevel, TowerLevel];
}

export const TOWERS: Record<TowerId, TowerDef> = {
  arrow: {
    id: 'arrow',
    name: 'Watch Tower',
    hotkey: '1',
    blurb: 'Fast single-target archers. Hits ground and air.',
    targets: 'both',
    projectile: 'arrow',
    projectileSpeed: 620,
    color: 0xc79a5b,
    levels: [
      { cost: 60, damage: 10, range: 3.4, rate: 1.8 },
      { cost: 70, damage: 18, range: 3.7, rate: 2.1 },
      { cost: 110, damage: 30, range: 4.0, rate: 2.5 },
    ],
  },
  cannon: {
    id: 'cannon',
    name: 'Bombard Tower',
    hotkey: '2',
    blurb: 'Slow siege cannon with splash damage. Ground only.',
    targets: 'ground',
    projectile: 'cannon',
    projectileSpeed: 380,
    color: 0x8a8f96,
    levels: [
      { cost: 90, damage: 20, range: 3.0, rate: 0.6, splash: 1.0 },
      { cost: 100, damage: 36, range: 3.2, rate: 0.7, splash: 1.2 },
      { cost: 150, damage: 60, range: 3.5, rate: 0.8, splash: 1.45 },
    ],
  },
  frost: {
    id: 'frost',
    name: 'Rimefrost Spire',
    hotkey: '3',
    blurb: 'Chilling bolts that slow enemies. Hits ground and air.',
    targets: 'both',
    projectile: 'frost',
    projectileSpeed: 480,
    color: 0x7fd6ff,
    levels: [
      { cost: 80, damage: 6, range: 2.8, rate: 1.0, slow: 0.55, slowDuration: 1.6 },
      { cost: 80, damage: 11, range: 3.0, rate: 1.1, slow: 0.45, slowDuration: 2.0, splash: 0.6 },
      { cost: 120, damage: 18, range: 3.3, rate: 1.25, slow: 0.35, slowDuration: 2.5, splash: 0.9 },
    ],
  },
  arcane: {
    id: 'arcane',
    name: 'Arcane Sanctum',
    hotkey: '4',
    blurb: 'Devastating arcane bolts, slow to recharge. Long range.',
    targets: 'both',
    projectile: 'arcane',
    projectileSpeed: 520,
    color: 0xb77cff,
    levels: [
      { cost: 120, damage: 65, range: 3.7, rate: 0.4 },
      { cost: 140, damage: 120, range: 4.1, rate: 0.45 },
      { cost: 200, damage: 210, range: 4.5, rate: 0.5 },
    ],
  },
};

export const TOWER_ORDER: TowerId[] = ['arrow', 'cannon', 'frost', 'arcane'];
