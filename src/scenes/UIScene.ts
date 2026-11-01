import Phaser from 'phaser';
import { LAYOUT, RULES } from '../config/layout';
import { TOWERS, TOWER_ORDER, type TowerDef, type TowerLevel } from '../config/towers';
import { Button } from '../ui/Button';
import { objOriginY, TOWER_TEX_H } from '../art/TextureFactory';
import type { GameScene } from './GameScene';

const FONT = 'Georgia, serif';
const GOLD = '#f2c53d';
const PARCH = '#f3e3b5';

/** HUD overlay: top resource bar, bottom command console, end screens. */
export class UIScene extends Phaser.Scene {
  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private nextText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private callBtn!: Button;
  private pauseBtn!: Button;
  private speedBtn!: Button;
  private buildBtns: Button[] = [];
  private infoTitle!: Phaser.GameObjects.Text;
  private infoBody!: Phaser.GameObjects.Text;
  private upgradeBtn!: Button;
  private sellBtn!: Button;
  private hoverDef: TowerDef | null = null;
  private overlay?: Phaser.GameObjects.Container;
  private pausedText!: Phaser.GameObjects.Text;

  constructor() { super('UI'); }

  private get game_(): GameScene { return this.scene.get('Game') as GameScene; }

  create() {
    this.overlay = undefined;
    this.hoverDef = null;
    this.buildBtns = [];
    const W = LAYOUT.width, H = LAYOUT.height, TB = LAYOUT.topBar, BB = LAYOUT.bottomBar;

    // ---------- top bar ----------
    const top = this.add.graphics();
    top.fillStyle(0x1c1712, 0.94); top.fillRect(0, 0, W, TB);
    top.lineStyle(3, 0xa8854a); top.lineBetween(0, TB - 1, W, TB - 1);
    top.lineStyle(1, 0x000000, 0.6); top.lineBetween(0, TB - 4, W, TB - 4);
    const stat = (x: number, icon: string) => {
      this.add.image(x, 18, icon);
      return this.add.text(x + 16, 18, '', { fontFamily: FONT, fontSize: '19px', color: PARCH }).setOrigin(0, 0.5);
    };
    this.goldText = stat(22, 'icon-gold').setColor(GOLD);
    this.livesText = stat(150, 'icon-lives');
    this.waveText = stat(260, 'icon-wave');
    this.statusText = this.add.text(420, 18, '', { fontFamily: FONT, fontSize: '17px', color: PARCH }).setOrigin(0, 0.5);
    this.nextText = this.add.text(22, 42, '', { fontFamily: FONT, fontSize: '13px', color: '#c8b88a' }).setOrigin(0, 0.5);

    this.callBtn = new Button(this, W - 430, 8, { width: 170, height: 34, label: 'Start Wave (N)', onClick: () => this.game_.callNextWave() });
    this.pauseBtn = new Button(this, W - 252, 8, { width: 120, height: 34, label: 'Pause (P)', onClick: () => this.game_.togglePause() });
    this.speedBtn = new Button(this, W - 124, 8, { width: 110, height: 34, label: 'Speed 1x (F)', fontSize: 14, onClick: () => this.game_.toggleSpeed() });

    this.toastText = this.add.text(W / 2, TB + 26, '', {
      fontFamily: FONT, fontSize: '18px', color: '#ffe9a0', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);
    this.pausedText = this.add.text(W / 2, (TB + H - BB) / 2, 'PAUSED', {
      fontFamily: FONT, fontSize: '54px', color: PARCH, stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setVisible(false);

    // ---------- bottom console ----------
    const by = H - BB;
    const con = this.add.graphics();
    con.fillStyle(0x1c1712, 0.96); con.fillRect(0, by, W, BB);
    con.lineStyle(3, 0xa8854a); con.lineBetween(0, by + 1, W, by + 1);
    con.fillStyle(0x0f0c09, 0.9); con.fillRoundedRect(560, by + 12, 500, BB - 24, 6);
    con.lineStyle(1, 0x6b5636); con.strokeRoundedRect(560, by + 12, 500, BB - 24, 6);
    this.add.text(16, by + 10, 'Build', { fontFamily: FONT, fontSize: '13px', color: '#c8b88a' });

    TOWER_ORDER.forEach((id, i) => {
      const def = TOWERS[id];
      const x = 16 + i * 132, y = by + 28;
      const b = new Button(this, x, y, { width: 124, height: 112, label: '', onClick: () => this.game_.beginBuild(id) });
      const icon = this.add.image(62, 70, `tower-${id}-1`).setOrigin(0.5, objOriginY(TOWER_TEX_H)).setScale(0.5);
      const name = this.add.text(62, 80, def.name, { fontFamily: FONT, fontSize: '12px', color: PARCH }).setOrigin(0.5);
      const cost = this.add.text(62, 97, `${def.levels[0].cost} gold`, { fontFamily: FONT, fontSize: '12px', color: GOLD }).setOrigin(0.5);
      const hk = this.add.text(8, 6, def.hotkey, { fontFamily: FONT, fontSize: '12px', color: '#c8b88a' });
      b.add([icon, name, cost, hk]);
      b.on('pointerover', () => (this.hoverDef = def));
      b.on('pointerout', () => (this.hoverDef = null));
      this.buildBtns.push(b);
    });

    this.infoTitle = this.add.text(576, by + 22, '', { fontFamily: FONT, fontSize: '18px', color: GOLD });
    this.infoBody = this.add.text(576, by + 50, '', { fontFamily: FONT, fontSize: '13px', color: PARCH, lineSpacing: 3, wordWrap: { width: 470 } });

    this.upgradeBtn = new Button(this, 1076, by + 18, { width: 190, height: 52, label: 'Upgrade (U)', fontSize: 14, onClick: () => this.game_.upgradeSelected() });
    this.sellBtn = new Button(this, 1076, by + 80, { width: 190, height: 52, label: 'Sell (X)', fontSize: 14, onClick: () => this.game_.sellSelected() });
  }

  private statLines(def: TowerDef, lv: TowerLevel, next?: TowerLevel) {
    const arrow = (a: number, b: number | undefined, fmt = (v: number) => `${v}`) =>
      b !== undefined && b !== a ? `${fmt(a)} → ${fmt(b)}` : fmt(a);
    const lines = [
      `Damage ${arrow(lv.damage, next?.damage)}   Range ${arrow(lv.range, next?.range)}   Speed ${arrow(lv.rate, next?.rate, (v) => `${v}/s`)}`,
    ];
    const extra: string[] = [];
    if (lv.splash || next?.splash) extra.push(`Splash ${arrow(lv.splash ?? 0, next?.splash)} tiles`);
    if (lv.slow) extra.push(`Slow ${arrow(Math.round((1 - lv.slow) * 100), next?.slow !== undefined ? Math.round((1 - next.slow) * 100) : undefined, (v) => `${v}%`)} for ${lv.slowDuration}s`);
    extra.push(def.targets === 'ground' ? 'Targets: ground only' : 'Targets: ground & air');
    lines.push(extra.join('   '));
    return lines;
  }

  update() {
    const g = this.game_;
    const s = g.state;
    if (!s) return;
    const W = LAYOUT.width, H = LAYOUT.height;

    this.goldText.setText(`${s.gold}`);
    this.livesText.setText(`${s.lives}`);
    this.waveText.setText(`Wave ${s.wave}/${g.waves.total}`);
    if (s.phase === 'build') {
      this.statusText.setText(s.wave === 0 ? `Prepare your defenses — first wave in ${Math.ceil(s.countdown)}s` : `Next wave in ${Math.ceil(s.countdown)}s`);
      this.nextText.setText(`Next — Wave ${s.wave + 1}: ${g.waves.describe(s.wave)}`);
    } else if (s.phase === 'wave') {
      this.statusText.setText(`Wave ${s.wave} — ${s.mobsAlive + g.waves.remainingToSpawn} enemies remaining`);
      this.nextText.setText(s.wave < g.waves.total ? `Then — Wave ${s.wave + 1}: ${g.waves.describe(s.wave)}` : 'Final wave! Hold the keep!');
    }
    else if (s.phase === 'won') { this.statusText.setText('Victory!'); this.nextText.setText(''); }
    else if (s.phase === 'lost') { this.statusText.setText('Defeat'); this.nextText.setText(''); }
    const early = s.wave > 0 ? Math.floor(s.countdown * RULES.earlyCallGoldPerSecond) : 0;
    this.callBtn.setEnabled(s.phase === 'build').setLabel(s.phase !== 'build' ? 'Wave in progress' : s.wave === 0 ? 'Start Wave (N)' : `Call Early +${early}g (N)`);
    this.pauseBtn.setLabel(s.paused ? 'Resume (P)' : 'Pause (P)').setActiveState(s.paused);
    this.speedBtn.setLabel(`Speed ${s.speed}x (F)`).setActiveState(s.speed === 2);
    this.pausedText.setVisible(s.paused);
    this.toastText.setText(this.time.now < s.toastUntil ? s.toast : '');

    TOWER_ORDER.forEach((id, i) => {
      this.buildBtns[i].setActiveState(s.buildType === id).setEnabled(s.canAfford(TOWERS[id].levels[0].cost) || s.buildType === id);
    });

    // Info panel: hovered build button > build mode > selected tower > help.
    const sel = s.selected;
    const showDef = this.hoverDef ?? (s.buildType ? TOWERS[s.buildType] : null);
    if (showDef) {
      this.infoTitle.setText(`${showDef.name} — ${showDef.levels[0].cost} gold`);
      this.infoBody.setText([showDef.blurb, ...this.statLines(showDef, showDef.levels[0]), s.buildType ? 'Click a grass tile to build. Shift+click to keep building. Right-click / Esc to cancel.' : ''].join('\n'));
    } else if (sel) {
      const next = sel.nextLevel;
      this.infoTitle.setText(`${sel.def.name}  ${'★'.repeat(sel.level)}${'☆'.repeat(3 - sel.level)}`);
      this.infoBody.setText([`Level ${sel.level}/3 — ${sel.def.blurb}`, ...this.statLines(sel.def, sel.stats, next), `Invested ${sel.invested} gold`].join('\n'));
    } else {
      this.infoTitle.setText('Defend the Keep');
      this.infoBody.setText([
        'Build towers on grass beside the road. Each kill earns gold; clearing a wave pays a bonus.',
        'Click a tower to inspect, upgrade or sell it. Enemies that reach the keep cost lives.',
        'Keys: 1-4 build · U upgrade · X sell · N next wave · P/Space pause · F speed · Arrows/right-drag pan · Wheel zoom',
      ].join('\n'));
    }
    const next = sel?.nextLevel;
    this.upgradeBtn.setVisible(!!sel && !showDef).setEnabled(!!next && s.canAfford(next.cost))
      .setLabel(next ? `Upgrade (U)\n${next.cost} gold` : 'Max level');
    this.sellBtn.setVisible(!!sel && !showDef).setLabel(sel ? `Sell (X)\n+${Math.floor(sel.invested * RULES.sellRefund)} gold` : 'Sell');

    // End screens
    if ((s.phase === 'won' || s.phase === 'lost') && !this.overlay) this.showEnd(s.phase === 'won', W, H);
  }

  private showEnd(won: boolean, W: number, H: number) {
    const g = this.game_;
    const s = g.state;
    const c = this.add.container(0, 0).setDepth(1000);
    const dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0x1c1712, 0.97); panel.fillRoundedRect(W / 2 - 280, H / 2 - 150, 560, 300, 10);
    panel.lineStyle(3, won ? 0xd4af37 : 0x8e2b22); panel.strokeRoundedRect(W / 2 - 280, H / 2 - 150, 560, 300, 10);
    const title = this.add.text(W / 2, H / 2 - 95, won ? 'VICTORY' : 'DEFEAT', {
      fontFamily: FONT, fontSize: '52px', color: won ? GOLD : '#e0412f', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);
    const sub = this.add.text(W / 2, H / 2 - 30, won
      ? 'The horde is broken. The realm endures.'
      : `The keep has fallen on wave ${s.wave}.`, { fontFamily: FONT, fontSize: '20px', color: PARCH }).setOrigin(0.5);
    const stats = this.add.text(W / 2, H / 2 + 10, `Enemies slain: ${s.kills}    Lives left: ${s.lives}    Gold: ${s.gold}`, {
      fontFamily: FONT, fontSize: '15px', color: '#c8b88a',
    }).setOrigin(0.5);
    const again = new Button(this, W / 2 - 100, H / 2 + 60, { width: 200, height: 48, label: 'Play Again', fontSize: 20, onClick: () => this.restart() });
    c.add([dim, panel, title, sub, stats, again]);
    this.overlay = c;
  }

  restart() {
    const g = this.game_;
    g.tweens.timeScale = 1;
    g.scene.restart();
    this.scene.restart();
  }
}
