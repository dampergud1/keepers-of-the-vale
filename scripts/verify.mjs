// Headless smoke test: load game, build towers, start a wave, upgrade, screenshot.
import { chromium } from 'playwright-core';

const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = process.env.OUT ?? 'screenshot.png';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('GL Driver')) errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));

await page.goto(URL);
await page.waitForFunction(() => window.__game?.scene?.getScene('Game')?.state, null, { timeout: 15000 });
const g = (fn, arg) => page.evaluate(fn, arg);
const info = () => g(() => window.__game.scene.getScene('Game').debugInfo());
const tileXY = (c, r) => g(([c, r]) => window.__game.scene.getScene('Game').tileToCanvas(c, r), [c, r]);
// Canvas is FIT-scaled; map canvas coords to page coords.
const toPage = async (p) => {
  const box = await page.locator('canvas').boundingBox();
  return { x: box.x + (p.x * box.width) / 1280, y: box.y + (p.y * box.height) / 800 };
};
const clickTile = async (c, r) => { const p = await toPage(await tileXY(c, r)); await page.mouse.click(p.x, p.y); };

console.log('start', await info());
// Build via real input: press hotkey, click tile.
const builds = [['1', 4, 5], ['2', 3, 10], ['3', 8, 12], ['1', 12, 6]];
for (const [key, c, r] of builds) { await page.keyboard.press(key); await clickTile(c, r); }
// try building on the road -> must be refused
await page.keyboard.press('1'); await clickTile(3, 2); await page.keyboard.press('Escape');
const afterBuild = await info();
console.log('after build', afterBuild);
if (afterBuild.towers.length < 3 || afterBuild.towers.some((t) => t.c === 3 && t.r === 2)) throw new Error('build check failed');

// Start wave 1 via the HUD hotkey, run at 2x
await page.keyboard.press('n');
await page.keyboard.press('f');
await page.waitForTimeout(9000);
const mid = await info();
console.log('mid wave', mid);
if (mid.wave !== 1 || mid.kills === 0) throw new Error('wave/combat check failed');
await page.waitForTimeout(9000);
console.log('later', await info());
// Sell the frost spire (X), then select the watch tower and upgrade it (U)
await clickTile(8, 12); await page.keyboard.press('x');
await clickTile(4, 5); await page.keyboard.press('u');
const up = await info();
console.log('after sell + upgrade', up);
if (up.towers.length !== 2 || up.towers[0].level !== 2) throw new Error('sell/upgrade check failed');
await page.waitForTimeout(2500);
await page.mouse.move(10, 400);
await page.screenshot({ path: OUT });
await page.evaluate(() => window.__game.scene.getScene('UI').restart());
await page.waitForTimeout(1000);
console.log('after restart', await info());
console.log('console errors/warnings:', errors.length ? errors : 'none');
await browser.close();
if (errors.some((e) => e.includes('error'))) process.exit(1);
