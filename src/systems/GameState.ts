import { RULES } from '../config/layout';
import type { TowerId } from '../config/towers';
import type { Tower } from '../entities/Tower';

export type Phase = 'build' | 'wave' | 'won' | 'lost';

/** Shared, UI-readable game state (economy, lives, wave progress, selection). */
export class GameState {
  gold: number = RULES.startGold;
  lives: number = RULES.startLives;
  /** Number of the most recently started wave (0 = none yet). */
  wave = 0;
  phase: Phase = 'build';
  countdown: number = RULES.firstWaveDelay;
  speed = 1;
  paused = false;
  buildType: TowerId | null = null;
  selected: Tower | null = null;
  kills = 0;
  mobsAlive = 0;
  /** Short message shown in the HUD (e.g. "Not enough gold"). */
  toast = '';
  toastUntil = 0;

  canAfford(cost: number) { return this.gold >= cost; }
  spend(cost: number) { if (this.gold < cost) return false; this.gold -= cost; return true; }
  earn(amount: number) { this.gold += amount; }
}
