// Balance check: a simple bot builds/upgrades towers and plays all waves at high speed.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(process.env.URL ?? 'http://localhost:4173/');
await page.waitForFunction(() => window.__game?.scene?.getScene('Game')?.state);
const SPEED = Number(process.env.SPEED ?? 6);
const plan = JSON.parse(process.env.PLAN ?? '[["arrow",7,4],["arrow",3,10],["cannon",4,12],["frost",9,9],["arrow",11,10],["cannon",12,5],["arcane",8,6],["frost",15,10],["arcane",3,4],["cannon",14,15],["arrow",12,16],["arcane",17,8]]');
let last = '';
for (;;) {
  const r = await page.evaluate(([plan, SPEED]) => {
    const g = window.__game.scene.getScene('Game'); const s = g.state;
    s.speed = SPEED;
    if (s.phase === 'won' || s.phase === 'lost') return { done: true, ...g.debugInfo() };
    // build next planned tower, else upgrade cheapest
    const built = g.debugInfo().towers.length;
    if (built < plan.length) { const [t, c, rr] = plan[built]; if (s.gold >= ({arrow:60,cannon:90,frost:80,arcane:120})[t]) { if (!g.tryBuild(t, c, rr)) plan.splice(built, 1); } }
    else for (const t of g['towers'].values()) { if (t.nextLevel && s.gold >= t.nextLevel.cost) { s.selected = t; g.upgradeSelected(); break; } }
    if (false && s.phase === 'build' && s.countdown < 10) g.callNextWave();
    return g.debugInfo();
  }, [plan, SPEED]);
  const line = `wave ${r.wave} ${r.phase} lives ${r.lives} gold ${r.gold} towers ${r.towers.length} lv ${r.towers.reduce((a, t) => a + t.level, 0)}`;
  if (line.split(' gold')[0] !== last.split(' gold')[0]) console.log(line);
  last = line;
  if (r.done) break;
  await page.waitForTimeout(250);
}
await page.screenshot({ path: process.env.OUT ?? '/tmp/end.png' });
console.log('pageerrors', errs);
await browser.close();
