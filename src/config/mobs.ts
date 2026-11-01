export type MobId = 'crawler' | 'bonewing' | 'brute' | 'colossus';

export interface MobDef {
  id: MobId;
  name: string;
  /** Base HP before the wave's hpScale is applied. */
  hp: number;
  /** Tiles per second. */
  speed: number;
  bounty: number;
  /** Lives lost if it reaches the keep. */
  livesCost: number;
  flying: boolean;
  boss?: boolean;
  /** Width of its HP bar in px. */
  barWidth: number;
}

export const MOBS: Record<MobId, MobDef> = {
  crawler: {
    id: 'crawler', name: 'Grave Crawler',
    hp: 36, speed: 1.6, bounty: 3, livesCost: 1, flying: false, barWidth: 26,
  },
  bonewing: {
    id: 'bonewing', name: 'Bonewing',
    hp: 26, speed: 2.6, bounty: 3, livesCost: 1, flying: true, barWidth: 24,
  },
  brute: {
    id: 'brute', name: 'Ironhide Brute',
    hp: 130, speed: 1.0, bounty: 7, livesCost: 2, flying: false, barWidth: 34,
  },
  colossus: {
    id: 'colossus', name: 'Plaguebound Colossus',
    hp: 1500, speed: 0.65, bounty: 120, livesCost: 10, flying: false, boss: true, barWidth: 70,
  },
};
