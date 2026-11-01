import type { MobId } from './mobs';

export interface SpawnGroup {
  mob: MobId;
  count: number;
  /** Seconds between spawns in this group. */
  interval: number;
  /** Seconds after wave start before the group begins. */
  delay?: number;
}

export interface WaveDef {
  /** Multiplier on every mob's base HP this wave. */
  hpScale: number;
  /** Gold bonus for clearing the wave. */
  clearBonus: number;
  groups: SpawnGroup[];
}

export const WAVES: WaveDef[] = [
  { hpScale: 1.0, clearBonus: 25, groups: [{ mob: 'crawler', count: 10, interval: 1.1 }] },
  { hpScale: 1.1, clearBonus: 30, groups: [{ mob: 'crawler', count: 14, interval: 0.85 }] },
  { hpScale: 1.2, clearBonus: 35, groups: [
    { mob: 'crawler', count: 8, interval: 1.0 },
    { mob: 'bonewing', count: 8, interval: 0.7, delay: 5 },
  ] },
  { hpScale: 1.35, clearBonus: 40, groups: [
    { mob: 'brute', count: 6, interval: 2.0 },
    { mob: 'crawler', count: 8, interval: 0.9, delay: 3 },
  ] },
  { hpScale: 1.5, clearBonus: 45, groups: [{ mob: 'bonewing', count: 18, interval: 0.5 }] },
  { hpScale: 1.7, clearBonus: 50, groups: [
    { mob: 'brute', count: 10, interval: 1.6 },
    { mob: 'crawler', count: 12, interval: 0.7, delay: 4 },
  ] },
  { hpScale: 1.9, clearBonus: 55, groups: [
    { mob: 'crawler', count: 12, interval: 0.6 },
    { mob: 'bonewing', count: 12, interval: 0.55, delay: 3 },
    { mob: 'brute', count: 5, interval: 1.6, delay: 8 },
  ] },
  { hpScale: 2.15, clearBonus: 60, groups: [{ mob: 'brute', count: 16, interval: 1.2 }] },
  { hpScale: 2.4, clearBonus: 70, groups: [
    { mob: 'crawler', count: 20, interval: 0.45 },
    { mob: 'bonewing', count: 15, interval: 0.5, delay: 4 },
    { mob: 'brute', count: 10, interval: 1.1, delay: 8 },
  ] },
  { hpScale: 2.5, clearBonus: 0, groups: [
    { mob: 'brute', count: 8, interval: 1.4 },
    { mob: 'colossus', count: 1, interval: 1, delay: 7 },
    { mob: 'bonewing', count: 10, interval: 0.6, delay: 12 },
  ] },
];
