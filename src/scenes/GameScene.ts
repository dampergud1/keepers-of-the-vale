import Phaser from 'phaser';
import { LAYOUT, RULES } from '../config/layout';
import { DEFAULT_MAP, MAPS, type MapDef } from '../config/map';
import { THEMES } from '../config/theme';
import { TOWERS, TOWER_ORDER, type TowerId } from '../config/towers';
import { MOBS, type MobId } from '../config/mobs';
import { WAVES } from '../config/waves';
import { IsoGrid, RANGE_RX, RANGE_RY, TILE_H, TILE_W, type Pt } from '../systems/IsoGrid';
import { GameState } from '../systems/GameState';
import { WaveManager } from '../systems/WaveManager';
import { Effects } from '../systems/Effects';
import { Mob } from '../entities/Mob';
import { Tower } from '../entities/Tower';
import { Projectile } from '../entities/Projectile';
import { objOriginY, TOWER_TEX_H } from '../art/TextureFactory';

type TileKind = 'grass' | 'road' | 'decor';

/** The battlefield: map, mobs, towers, projectiles, input on the map, camera. */
export class GameScene extends Phaser.Scene {
  state!: GameState;
  waves!: WaveManager;
  map!: MapDef;
  grid!: IsoGrid;

  private tiles: TileKind[][] = [];
  private pathGrid: Pt[] = [];
  private towers = new Map<string, Tower>();
  private mobs: Mob[] = [];
  private projectiles: Projectile[] = [];
  private fx!: Effects;
  private simTime = 0;

  private hpBars!: Phaser.GameObjects.Graphics;
  private rangeGfx!: Phaser.GameObjects.Graphics;
  private hoverTile!: Phaser.GameObjects.Image;
  private placeTile!: Phaser.GameObjects.Image;
  private ghost!: Phaser.GameObjects.Image;
  private hovered: { c: number; r: number } | null = null;
  private dragStart: { x: number; y: number; sx: number; sy: number } | null = null;
  private dragged = false;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() { super('Game'); }

  create() {
    this.map = MAPS[DEFAULT_MAP];
    const theme = THEMES[this.map.theme];
    this.cameras.main.setBackgroundColor(theme.background);
    this.state = new GameState();
    this.simTime = 0;
    this.towers.clear();
    this.mobs = [];
    this.projectiles = [];
    this.fx = new Effects(this);

    const n = this.map.size;
    this.grid = new IsoGrid(n, 0, 0); // map's top corner at world (0,0)
    this.buildTerrain();

    this.hpBars = this.add.graphics().setDepth(100000);
    this.rangeGfx = this.add.graphics().setDepth(2);
    this.hoverTile = this.add.image(0, 0, 'tile-hover').setOrigin(0.5, 0).setDepth(3).setVisible(false);
    this.placeTile = this.add.image(0, 0, 'tile-ok').setOrigin(0.5, 0).setDepth(3).setVisible(false);
    this.ghost = this.add.image(0, 0, 'tower-arrow-1').setOrigin(0.5, objOriginY(TOWER_TEX_H)).setAlpha(0.6).setVisible(false);

    this.waves = new WaveManager(WAVES, (id, hpScale) => this.spawnMob(id, hpScale));

    this.setupCamera();
    this.setupInput();
  }

  // ---------------------------------------------------------------- map
  private buildTerrain() {
    const n = this.map.size;
    this.tiles = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => {
        const ch = (this.map.decor[r] ?? '')[c] ?? '.';
        return ch === '.' || ch === ' ' ? 'grass' : 'decor';
      }) as TileKind[],
    );
    // Road tiles from waypoints.
    const wp = this.map.waypoints;
    for (let i = 0; i < wp.length - 1; i++) {
      const [c0, r0] = wp[i], [c1, r1] = wp[i + 1];
      const dc = Math.sign(c1 - c0), dr = Math.sign(r1 - r0);
      for (let c = c0, r = r0; ; c += dc, r += dr) {
        this.tiles[r][c] = 'road';
        if (c === c1 && r === r1) break;
      }
    }
    this.pathGrid = wp.map(([c, r]) => ({ x: c + 0.5, y: r + 0.5 }));

    const rnd = new Phaser.Math.RandomDataGenerator([this.map.id]);
    const theme = THEMES[this.map.theme];
    // Cliff skirt along the two front edges for a raised-plateau look.
    const cliff = this.add.graphics().setDepth(-2);
    const D = 26;
    for (let i = 0; i < n; i++) {
      const a = this.grid.toScreen(0, n), b = this.grid.toScreen(n, n), c = this.grid.toScreen(n, 0);
      if (i === 0) {
        cliff.fillStyle(theme.cliffLeft); cliff.fillPoints([a, b, { x: b.x, y: b.y + D }, { x: a.x, y: a.y + D }], true);
        cliff.fillStyle(theme.cliffRight); cliff.fillPoints([b, c, { x: c.x, y: c.y + D }, { x: b.x, y: b.y + D }], true);
      }
      // strata lines
      const p = this.grid.toScreen(i, n), q = this.grid.toScreen(n, i);
      cliff.lineStyle(1, 0x000000, 0.15);
      cliff.lineBetween(p.x, p.y + 6 + (i % 3) * 5, p.x + 32, p.y + 22 + (i % 3) * 5);
      cliff.lineBetween(q.x, q.y + 8 + (i % 2) * 6, q.x - 32, q.y + 24 + (i % 2) * 6);
    }

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const top = this.grid.toScreen(c, r);
        const kind = this.tiles[r][c];
        const key = kind === 'road' ? `tile-road-${rnd.between(0, 2)}` : `tile-grass-${rnd.between(0, theme.grass.length - 1)}`;
        this.add.image(top.x, top.y, key).setOrigin(0.5, 0).setDepth(-1);
        if (kind === 'decor') {
          const ch = this.map.decor[r][c];
          const dkey = ch === 'P' ? 'decor-pine' : ch === 'R' ? 'decor-rock' : 'decor-oak';
          const h = this.textures.get(dkey).getSourceImage().height;
          const p = this.grid.tileCenter(c, r);
          this.add.image(p.x + rnd.between(-4, 4), p.y + rnd.between(-2, 2), dkey)
            .setOrigin(0.5, objOriginY(h)).setDepth(p.y).setScale(rnd.realInRange(0.9, 1.1));
        }
      }
    }

    // Spawn crypt just outside the first waypoint, keep at the last.
    const s = this.pathGrid[0], s2 = this.pathGrid[1];
    const sp = this.grid.toScreen(s.x - Math.sign(s2.x - s.x) * 0.9, s.y - Math.sign(s2.y - s.y) * 0.9);
    this.add.image(sp.x, sp.y, 'spawn-crypt').setOrigin(0.5, objOriginY(110)).setDepth(sp.y - 20);
    const e = this.pathGrid[this.pathGrid.length - 1];
    const kp = this.grid.toScreen(e.x + 0.6, e.y + 0.2);
    this.add.image(kp.x, kp.y, 'base-keep').setOrigin(0.5, objOriginY(150)).setDepth(kp.y + 10);
  }

  isBuildable(c: number, r: number) {
    return this.grid.inBounds(c, r) && this.tiles[r][c] === 'grass' && !this.towers.has(`${c},${r}`);
  }

  // ---------------------------------------------------------------- camera & input
  private setupCamera() {
    const cam = this.cameras.main;
    cam.setZoom(LAYOUT.mapZoom);
    const center = this.grid.toScreen(this.map.size / 2, this.map.size / 2);
    // Visible map area sits between top bar and bottom console.
    const viewMidY = (LAYOUT.topBar + (LAYOUT.height - LAYOUT.bottomBar)) / 2;
    cam.centerOn(center.x, center.y + (LAYOUT.height / 2 - viewMidY) / LAYOUT.mapZoom + 14);
    const n = this.map.size;
    cam.setBounds(-n * TILE_W / 2 - 400, -500, n * TILE_W + 800, n * TILE_H + 1000);
  }

  private inMapView(y: number) { return y > LAYOUT.topBar && y < LAYOUT.height - LAYOUT.bottomBar; }

  private setupInput() {
    this.input.mouse?.disableContextMenu();
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('UP,DOWN,LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
    TOWER_ORDER.forEach((id) => kb.on(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR'][TOWER_ORDER.indexOf(id)]}`, () => this.beginBuild(id)));
    kb.on('keydown-ESC', () => this.cancel());
    kb.on('keydown-U', () => this.upgradeSelected());
    kb.on('keydown-X', () => this.sellSelected());
    kb.on('keydown-DELETE', () => this.sellSelected());
    kb.on('keydown-SPACE', () => this.togglePause());
    kb.on('keydown-P', () => this.togglePause());
    kb.on('keydown-F', () => this.toggleSpeed());
    kb.on('keydown-N', () => this.callNextWave());

    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      const cam = this.cameras.main;
      cam.setZoom(Phaser.Math.Clamp(cam.zoom * (dy > 0 ? 0.9 : 1.1), 0.5, 1.6));
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragStart && (p.rightButtonDown() || p.middleButtonDown())) {
        const cam = this.cameras.main;
        if (Math.hypot(p.x - this.dragStart.x, p.y - this.dragStart.y) > 4) this.dragged = true;
        cam.setScroll(this.dragStart.sx - (p.x - this.dragStart.x) / cam.zoom, this.dragStart.sy - (p.y - this.dragStart.y) / cam.zoom);
      }
      this.updateHover(p);
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown() || p.middleButtonDown()) {
        this.dragStart = { x: p.x, y: p.y, sx: this.cameras.main.scrollX, sy: this.cameras.main.scrollY };
        this.dragged = false;
        return;
      }
      if (!this.inMapView(p.y) || this.isOver()) return;
      const w = p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      const t = this.grid.tileAt(w.x, w.y);
      this.handleClick(t, p.event instanceof MouseEvent && p.event.shiftKey);
    });

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.dragStart && !this.dragged && p.button === 2) this.cancel();
      this.dragStart = null;
    });
  }

  private isOver() { return this.state.phase === 'won' || this.state.phase === 'lost'; }

  private updateHover(p: Phaser.Input.Pointer) {
    if (!this.inMapView(p.y)) { this.hovered = null; return; }
    const w = p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    this.hovered = this.grid.tileAt(w.x, w.y);
  }

  private handleClick(t: { c: number; r: number } | null, keepBuilding: boolean) {
    const s = this.state;
    if (!t) { s.selected = null; return; }
    if (s.buildType) {
      this.tryBuild(s.buildType, t.c, t.r);
      if (!keepBuilding) s.buildType = null;
      return;
    }
    s.selected = this.towers.get(`${t.c},${t.r}`) ?? null;
  }

  // ---------------------------------------------------------------- public actions (used by UI + hotkeys)
  beginBuild(type: TowerId) {
    if (this.isOver()) return;
    this.state.selected = null;
    this.state.buildType = this.state.buildType === type ? null : type;
    if (this.state.buildType && !this.state.canAfford(TOWERS[type].levels[0].cost)) this.toast('Not enough gold');
  }

  cancel() { this.state.buildType = null; this.state.selected = null; }

  tryBuild(type: TowerId, c: number, r: number): boolean {
    const cost = TOWERS[type].levels[0].cost;
    if (!this.isBuildable(c, r)) { this.toast(this.tiles[r]?.[c] === 'road' ? "Can't build on the road" : "Can't build there"); return false; }
    if (!this.state.spend(cost)) { this.toast('Not enough gold'); return false; }
    const tower = new Tower(this, this.grid, type, c, r);
    this.towers.set(`${c},${r}`, tower);
    const p = this.grid.tileCenter(c, r);
    this.fx.puff(p.x, p.y, 0xc9b28a, 1.4);
    this.state.selected = tower;
    return true;
  }

  upgradeSelected() {
    const t = this.state.selected;
    if (!t || this.isOver()) return;
    const next = t.nextLevel;
    if (!next) { this.toast('Already at max level'); return; }
    if (!this.state.spend(next.cost)) { this.toast('Not enough gold'); return; }
    t.upgrade();
    const p = this.grid.tileCenter(t.c, t.r);
    this.fx.ring(p.x, p.y, 40, 20, 0xffd84a);
    this.fx.floatText(p.x, p.y - 70, `Level ${t.level}!`, '#ffe9a0');
  }

  sellSelected() {
    const t = this.state.selected;
    if (!t || this.isOver()) return;
    const refund = Math.floor(t.invested * RULES.sellRefund);
    this.state.earn(refund);
    this.towers.delete(`${t.c},${t.r}`);
    const p = this.grid.tileCenter(t.c, t.r);
    this.fx.puff(p.x, p.y - 20, 0xbbbbbb, 1.6);
    this.fx.floatText(p.x, p.y - 40, `+${refund}`);
    t.destroy();
    this.state.selected = null;
  }

  togglePause() {
    if (this.isOver()) return;
    this.state.paused = !this.state.paused;
    if (this.state.paused) this.tweens.pauseAll(); else this.tweens.resumeAll();
  }

  toggleSpeed() {
    this.state.speed = this.state.speed === 1 ? 2 : 1;
    this.tweens.timeScale = this.state.speed;
  }

  callNextWave() {
    const s = this.state;
    if (s.phase !== 'build' || s.paused) return;
    const bonus = Math.floor(s.countdown * RULES.earlyCallGoldPerSecond);
    if (bonus > 0 && s.wave > 0) {
      s.earn(bonus);
      this.toast(`Called early: +${bonus} gold`);
    }
    this.startWave();
  }

  toast(msg: string) { this.state.toast = msg; this.state.toastUntil = this.time.now + 1800; }

  // ---------------------------------------------------------------- waves & mobs
  private startWave() {
    const s = this.state;
    s.wave++;
    s.phase = 'wave';
    this.waves.start(s.wave - 1);
    const first = this.grid.toScreen(this.pathGrid[0].x, this.pathGrid[0].y);
    this.fx.ring(first.x, first.y, 60, 30, 0x7dff6a);
  }

  private spawnMob(id: MobId, hpScale: number) {
    this.mobs.push(new Mob(this, this.grid, this.pathGrid, MOBS[id], hpScale));
  }

  private killMob(m: Mob) {
    const s = this.state;
    s.earn(m.def.bounty);
    s.kills++;
    const p = m.screen();
    this.fx.floatText(p.x, m.topY(), `+${m.def.bounty}`);
    this.fx.puff(p.x, p.y - 10, m.def.boss ? 0x7dff6a : 0x8a8f7a, m.def.boss ? 3 : 1);
    this.fx.deathFade(m.sprite, () => m.destroy());
  }

  // ---------------------------------------------------------------- main loop
  update(_time: number, deltaMs: number) {
    this.panCamera(deltaMs / 1000);
    this.drawOverlays();
    const s = this.state;
    if (s.paused || this.isOver()) return;

    const dt = (Math.min(deltaMs, 50) / 1000) * s.speed;
    this.simTime += dt;
    const now = this.simTime;

    if (s.phase === 'build') {
      s.countdown -= dt;
      if (s.countdown <= 0) this.startWave();
    }
    this.waves.update(dt);

    // Mobs
    for (const m of this.mobs) {
      if (!m.alive) continue;
      m.update(dt, now);
      if (m.leaked) {
        m.alive = false;
        s.lives = Math.max(0, s.lives - m.def.livesCost);
        const p = m.screen();
        this.fx.floatText(p.x, p.y - 50, `-${m.def.livesCost} ♥`, '#ff6a5a');
        this.cameras.main.shake(120, 0.003);
        m.destroy();
      }
    }

    // Towers fire
    for (const t of this.towers.values()) {
      const target = t.update(dt, this.mobs);
      if (target) {
        const mz = t.muzzle();
        this.projectiles.push(new Projectile(this, this.grid, t.def.projectile, mz.x, mz.y, target, { ...t.stats }, t.def.targets !== 'ground', t.def.projectileSpeed));
      }
    }

    // Projectiles
    for (const pr of this.projectiles) {
      if (pr.update(dt)) { this.impact(pr, now); pr.destroy(); }
    }
    this.projectiles = this.projectiles.filter((p) => !p.done);
    this.mobs = this.mobs.filter((m) => m.alive);
    s.mobsAlive = this.mobs.length;

    if (s.lives <= 0) { this.endGame('lost'); return; }

    if (s.phase === 'wave' && this.waves.spawningDone && this.mobs.length === 0) {
      const w = WAVES[s.wave - 1];
      if (s.wave >= WAVES.length) { this.endGame('won'); return; }
      s.earn(w.clearBonus);
      this.toast(`Wave ${s.wave} cleared! +${w.clearBonus} gold`);
      s.phase = 'build';
      s.countdown = RULES.betweenWaves;
    }
  }

  private impact(pr: Projectile, now: number) {
    const st = pr.stats;
    const hit = (m: Mob, dmg: number) => {
      if (!m.alive) return;
      if (st.slow) m.applySlow(st.slow, st.slowDuration ?? 1.5, now);
      if (m.damage(dmg)) this.killMob(m);
    };
    const p = pr.impactScreen();
    if (st.splash && st.splash > 0) {
      for (const m of this.mobs) {
        if (!m.alive || (m.flying && !pr.hitsAir)) continue;
        const d = Math.hypot(m.gx - pr.gx, m.gy - pr.gy);
        if (d <= st.splash) hit(m, m === pr.target ? st.damage : st.damage * 0.75);
      }
      const tint = pr.kind === 'frost' ? 0x9fe6ff : 0xffa040;
      this.fx.ring(p.x, p.y, st.splash * RANGE_RX, st.splash * RANGE_RY, tint);
      if (pr.kind === 'cannon') this.fx.puff(p.x, p.y - 8, 0x6a6a6a, 1.2);
    } else {
      hit(pr.target, st.damage);
      if (pr.kind === 'arcane') this.fx.puff(pr.sprite.x, pr.sprite.y, 0xd9a8ff, 1.2);
    }
  }

  private endGame(result: 'won' | 'lost') {
    const s = this.state;
    s.phase = result;
    s.buildType = null;
    s.selected = null;
    this.hpBars.clear();
  }

  private panCamera(dt: number) {
    const cam = this.cameras.main;
    const v = 600 * dt / cam.zoom;
    if (this.keys.LEFT.isDown) cam.scrollX -= v;
    if (this.keys.RIGHT.isDown) cam.scrollX += v;
    if (this.keys.UP.isDown) cam.scrollY -= v;
    if (this.keys.DOWN.isDown) cam.scrollY += v;
  }

  // ---------------------------------------------------------------- overlays: hp bars, hover, range, build ghost
  private drawOverlays() {
    const s = this.state;
    const g = this.hpBars;
    g.clear();
    for (const m of this.mobs) {
      if (!m.alive) continue;
      const w = m.def.barWidth, x = m.sprite.x - w / 2, y = m.topY();
      const f = m.hp / m.maxHp;
      g.fillStyle(0x000000, 0.75); g.fillRect(x - 1, y - 1, w + 2, 6);
      g.fillStyle(f > 0.5 ? 0x3ad13a : f > 0.25 ? 0xe5c53a : 0xe0412f); g.fillRect(x, y, w * f, 4);
    }

    const rg = this.rangeGfx;
    rg.clear();
    this.hoverTile.setVisible(false);
    this.placeTile.setVisible(false);
    this.ghost.setVisible(false);
    const drawRange = (c: number, r: number, range: number, color: number) => {
      const p = this.grid.tileCenter(c, r);
      rg.fillStyle(color, 0.12); rg.fillEllipse(p.x, p.y, range * RANGE_RX * 2, range * RANGE_RY * 2);
      rg.lineStyle(2, color, 0.7); rg.strokeEllipse(p.x, p.y, range * RANGE_RX * 2, range * RANGE_RY * 2);
    };

    if (s.selected) drawRange(s.selected.c, s.selected.r, s.selected.stats.range, 0xffe28a);

    const h = this.hovered;
    if (!h || this.isOver()) return;
    const top = this.grid.toScreen(h.c, h.r);
    if (s.buildType) {
      const ok = this.isBuildable(h.c, h.r) && s.canAfford(TOWERS[s.buildType].levels[0].cost);
      this.placeTile.setTexture(ok ? 'tile-ok' : 'tile-bad').setPosition(top.x, top.y).setVisible(true);
      const p = this.grid.tileCenter(h.c, h.r);
      this.ghost.setTexture(`tower-${s.buildType}-1`).setPosition(p.x, p.y).setDepth(p.y).setVisible(true).setTint(ok ? 0xffffff : 0xff8080);
      drawRange(h.c, h.r, TOWERS[s.buildType].levels[0].range, ok ? 0x8aff8a : 0xff8a8a);
    } else {
      this.hoverTile.setPosition(top.x, top.y).setVisible(true);
      const t = this.towers.get(`${h.c},${h.r}`);
      if (t && t !== s.selected) drawRange(t.c, t.r, t.stats.range, 0xffffff);
    }
  }

  // ---------------------------------------------------------------- testing helpers
  /** Exposed for automated smoke tests. */
  debugInfo() {
    return {
      gold: this.state.gold, lives: this.state.lives, wave: this.state.wave, phase: this.state.phase,
      towers: [...this.towers.values()].map((t) => ({ type: t.type, level: t.level, c: t.c, r: t.r })),
      mobs: this.mobs.length, projectiles: this.projectiles.length, kills: this.state.kills,
    };
  }

  /** Screen (canvas-space) point of a tile center, for tests and tutorials. */
  tileToCanvas(c: number, r: number) {
    const p = this.grid.tileCenter(c, r);
    const cam = this.cameras.main;
    return { x: (p.x - cam.worldView.x) * cam.zoom, y: (p.y - cam.worldView.y) * cam.zoom };
  }
}
