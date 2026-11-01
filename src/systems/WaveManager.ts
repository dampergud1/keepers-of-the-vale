import type { WaveDef } from '../config/waves';
import type { MobId } from '../config/mobs';
import { MOBS } from '../config/mobs';

interface SpawnEvent { t: number; mob: MobId }

/** Turns wave definitions into timed spawn events. */
export class WaveManager {
  private queue: SpawnEvent[] = [];
  private t = 0;
  private current?: WaveDef;

  constructor(readonly waves: WaveDef[], private onSpawn: (mob: MobId, hpScale: number) => void) {}

  get total() { return this.waves.length; }
  get spawningDone() { return this.queue.length === 0; }
  get remainingToSpawn() { return this.queue.length; }

  start(index: number) {
    const w = this.waves[index];
    this.current = w;
    this.t = 0;
    this.queue = [];
    for (const g of w.groups) {
      for (let i = 0; i < g.count; i++) this.queue.push({ t: (g.delay ?? 0) + i * g.interval, mob: g.mob });
    }
    this.queue.sort((a, b) => a.t - b.t);
  }

  update(dt: number) {
    if (!this.current) return;
    this.t += dt;
    while (this.queue.length && this.queue[0].t <= this.t) {
      const e = this.queue.shift()!;
      this.onSpawn(e.mob, this.current.hpScale);
    }
  }

  /** Human-readable summary of a wave, e.g. "8× Grave Crawler, 8× Bonewing (air)". */
  describe(index: number): string {
    const w = this.waves[index];
    if (!w) return '';
    return w.groups
      .map((g) => {
        const m = MOBS[g.mob];
        const tag = m.boss ? ' (BOSS)' : m.flying ? ' (air)' : '';
        return `${g.count}× ${m.name}${tag}`;
      })
      .join(', ');
  }
}
