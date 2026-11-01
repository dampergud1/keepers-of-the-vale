import Phaser from 'phaser';
import type { Theme } from '../config/theme';
import type { TowerId } from '../config/towers';

/**
 * Procedural placeholder art. Every texture is drawn with Phaser Graphics so the
 * game needs no external assets. Swap any key for a real sprite sheet later —
 * entity code only references texture keys.
 *
 * Object textures share a convention: the ground contact point is at
 * (width/2, height - GROUND_PAD); use objOrigin() to anchor sprites on it.
 */
export const GROUND_PAD = 12;
export const objOriginY = (h: number) => (h - GROUND_PAD) / h;
export const TOWER_TEX_H = 150;

type G = Phaser.GameObjects.Graphics;

const shade = (c: number, f: number) => {
  const col = Phaser.Display.Color.IntegerToColor(c);
  const k = (v: number) => Phaser.Math.Clamp(Math.round(v * f), 0, 255);
  return Phaser.Display.Color.GetColor(k(col.red), k(col.green), k(col.blue));
};

/** Iso box with footprint half-width hw, standing on ground center (cx, by), height h. Returns top-face center y. */
function isoBox(g: G, cx: number, by: number, hw: number, h: number, color: number, alpha = 1): number {
  const hh = hw / 2;
  g.fillStyle(shade(color, 0.78), alpha); // left face
  g.fillPoints([{ x: cx - hw, y: by }, { x: cx, y: by + hh }, { x: cx, y: by + hh - h }, { x: cx - hw, y: by - h }], true);
  g.fillStyle(shade(color, 0.58), alpha); // right face
  g.fillPoints([{ x: cx, y: by + hh }, { x: cx + hw, y: by }, { x: cx + hw, y: by - h }, { x: cx, y: by + hh - h }], true);
  g.fillStyle(color, alpha); // top
  g.fillPoints([{ x: cx - hw, y: by - h }, { x: cx, y: by - hh - h }, { x: cx + hw, y: by - h }, { x: cx, y: by + hh - h }], true);
  g.lineStyle(1, shade(color, 0.4), 0.6);
  g.strokePoints([{ x: cx - hw, y: by - h }, { x: cx, y: by - hh - h }, { x: cx + hw, y: by - h }, { x: cx, y: by + hh - h }], true);
  return by - h;
}

/** Four-sided pyramid roof over a footprint. */
function isoRoof(g: G, cx: number, by: number, hw: number, h: number, color: number) {
  const hh = hw / 2;
  const apex = { x: cx, y: by - h };
  g.fillStyle(shade(color, 0.85));
  g.fillTriangle(cx - hw, by, cx, by - hh, apex.x, apex.y);
  g.fillStyle(shade(color, 1.1));
  g.fillTriangle(cx, by - hh, cx + hw, by, apex.x, apex.y);
  g.fillStyle(shade(color, 0.75));
  g.fillTriangle(cx - hw, by, cx, by + hh, apex.x, apex.y);
  g.fillStyle(shade(color, 0.55));
  g.fillTriangle(cx, by + hh, cx + hw, by, apex.x, apex.y);
}

function shadowEllipse(g: G, cx: number, by: number, w: number, h: number, a = 0.3) {
  g.fillStyle(0x000000, a);
  g.fillEllipse(cx, by, w, h);
}

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void) {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function diamond(g: G, color: number, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillPoints([{ x: 32, y: 0 }, { x: 64, y: 16 }, { x: 32, y: 32 }, { x: 0, y: 16 }], true);
}

const inDiamond = (x: number, y: number, k = 0.85) => Math.abs(x - 32) / 32 + Math.abs(y - 16) / 16 <= k;

export function generateTextures(scene: Phaser.Scene, theme: Theme) {
  const rnd = new Phaser.Math.RandomDataGenerator([theme.id]);

  // ---------- terrain tiles (64x32 diamonds) ----------
  theme.grass.forEach((base, i) => {
    bake(scene, `tile-grass-${i}`, 64, 32, (g) => {
      diamond(g, base);
      for (let n = 0; n < 22; n++) {
        const x = rnd.between(4, 60), y = rnd.between(2, 30);
        if (!inDiamond(x, y)) continue;
        const col = rnd.pick(theme.grassDetail.slice(0, 3));
        g.fillStyle(col, 0.9);
        g.fillRect(x, y, 2, 1);
        g.fillRect(x + 1, y - 1, 1, 1);
      }
      if (rnd.frac() < 0.5) { // a few flowers / sparkles
        for (let n = 0; n < 3; n++) {
          const x = rnd.between(10, 54), y = rnd.between(6, 26);
          if (!inDiamond(x, y, 0.7)) continue;
          g.fillStyle(rnd.pick(theme.grassDetail.slice(3)), 1);
          g.fillRect(x, y, 2, 2);
        }
      }
      g.lineStyle(1, 0x000000, 0.06);
      g.strokePoints([{ x: 32, y: 0 }, { x: 64, y: 16 }, { x: 32, y: 32 }, { x: 0, y: 16 }], true);
    });
  });

  for (let i = 0; i < 3; i++) {
    bake(scene, `tile-road-${i}`, 64, 32, (g) => {
      diamond(g, theme.road);
      for (let n = 0; n < 30; n++) {
        const x = rnd.between(3, 61), y = rnd.between(2, 30);
        if (!inDiamond(x, y, 0.92)) continue;
        g.fillStyle(rnd.pick(theme.roadDetail), 0.9);
        const s = rnd.between(1, 3);
        g.fillRect(x, y, s, Math.max(1, s - 1));
      }
      // wheel ruts
      g.lineStyle(1, theme.roadEdge, 0.35);
      g.lineBetween(14, 16 - 3, 40, 3 + 6);
      g.lineBetween(24, 29 - 6, 50, 19 - 3);
    });
  }

  bake(scene, 'tile-hover', 64, 32, (g) => {
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokePoints([{ x: 32, y: 1 }, { x: 63, y: 16 }, { x: 32, y: 31 }, { x: 1, y: 16 }], true);
  });
  bake(scene, 'tile-ok', 64, 32, (g) => diamond(g, 0x5cff6a, 0.35));
  bake(scene, 'tile-bad', 64, 32, (g) => diamond(g, 0xff4a3a, 0.4));

  // ---------- decor ----------
  bake(scene, 'decor-oak', 64, 84, (g) => {
    const cx = 32, by = 84 - GROUND_PAD;
    shadowEllipse(g, cx + 4, by, 40, 14);
    g.fillStyle(theme.trunk); g.fillRect(cx - 3, by - 24, 6, 24);
    g.fillStyle(theme.leaf[0]); g.fillCircle(cx, by - 38, 19); g.fillCircle(cx - 13, by - 30, 12); g.fillCircle(cx + 13, by - 30, 12);
    g.fillStyle(theme.leaf[1]); g.fillCircle(cx - 4, by - 42, 14); g.fillCircle(cx + 8, by - 34, 10);
    g.fillStyle(theme.leaf[2]); g.fillCircle(cx - 8, by - 48, 7); g.fillCircle(cx + 3, by - 46, 5);
    if (theme.snowCaps) { g.fillStyle(0xffffff, 0.9); g.fillEllipse(cx - 4, by - 54, 22, 8); }
  });
  bake(scene, 'decor-pine', 48, 92, (g) => {
    const cx = 24, by = 92 - GROUND_PAD;
    shadowEllipse(g, cx + 3, by, 30, 11);
    g.fillStyle(theme.trunk); g.fillRect(cx - 3, by - 14, 6, 14);
    const tiers = [[by - 10, 18, 26], [by - 28, 14, 24], [by - 44, 10, 22]];
    tiers.forEach(([y, hw, h], i) => {
      g.fillStyle(theme.leaf[0]); g.fillTriangle(cx - hw, y, cx + hw, y, cx, y - h);
      g.fillStyle(theme.leaf[1]); g.fillTriangle(cx - hw, y, cx, y, cx, y - h);
      if (theme.snowCaps) { g.fillStyle(0xffffff, 0.95); g.fillTriangle(cx - hw * 0.45, y - h * 0.55, cx + hw * 0.45, y - h * 0.55, cx, y - h); }
      else if (i === 2) { g.fillStyle(theme.leaf[2]); g.fillTriangle(cx - 3, y - h + 8, cx, y - h + 8, cx, y - h); }
    });
  });
  bake(scene, 'decor-rock', 48, 40, (g) => {
    const cx = 24, by = 40 - GROUND_PAD;
    shadowEllipse(g, cx + 2, by + 1, 34, 10);
    g.fillStyle(theme.rock[2]); g.fillPoints([{ x: cx - 15, y: by }, { x: cx - 10, y: by - 13 }, { x: cx + 2, y: by - 17 }, { x: cx + 14, y: by - 8 }, { x: cx + 12, y: by + 2 }], true);
    g.fillStyle(theme.rock[0]); g.fillPoints([{ x: cx - 12, y: by - 2 }, { x: cx - 9, y: by - 12 }, { x: cx + 1, y: by - 15 }, { x: cx + 4, y: by - 4 }], true);
    g.fillStyle(theme.rock[1]); g.fillPoints([{ x: cx - 8, y: by - 11 }, { x: cx + 1, y: by - 15 }, { x: cx - 2, y: by - 8 }], true);
    if (theme.snowCaps) { g.fillStyle(0xffffff); g.fillEllipse(cx - 3, by - 13, 16, 5); }
  });

  // ---------- spawn crypt & keep ----------
  bake(scene, 'spawn-crypt', 96, 110, (g) => {
    const cx = 48, by = 110 - GROUND_PAD;
    shadowEllipse(g, cx, by + 2, 80, 30, 0.35);
    isoBox(g, cx, by, 34, 10, 0x3d3a42);
    const top = isoBox(g, cx, by - 10, 26, 30, 0x4b4652);
    isoRoof(g, cx, top, 28, 26, 0x2e2b33);
    // glowing doorway on the left face
    g.fillStyle(0x0b0f0b); g.fillPoints([{ x: cx - 18, y: by - 12 }, { x: cx - 8, y: by - 7 }, { x: cx - 8, y: by - 28 }, { x: cx - 18, y: by - 33 }], true);
    g.fillStyle(0x7dff6a, 0.55); g.fillPoints([{ x: cx - 16, y: by - 13 }, { x: cx - 10, y: by - 10 }, { x: cx - 10, y: by - 26 }, { x: cx - 16, y: by - 29 }], true);
    g.fillStyle(0x7dff6a, 0.9); g.fillCircle(cx, top - 30, 3);
    // bone pillars
    g.fillStyle(0xd8d2bf); g.fillRect(cx - 36, by - 22, 4, 18); g.fillRect(cx + 32, by - 22, 4, 18);
    g.fillCircle(cx - 34, by - 24, 4); g.fillCircle(cx + 34, by - 24, 4);
  });
  bake(scene, 'base-keep', 120, 150, (g) => {
    const cx = 60, by = 150 - GROUND_PAD;
    shadowEllipse(g, cx, by + 2, 104, 36, 0.35);
    const top1 = isoBox(g, cx, by, 40, 38, 0x9a9488);
    // crenellations
    [[-30, 0], [30, 0], [0, -15], [0, 15]].forEach(([dx, dy]) => isoBox(g, cx + dx, top1 + dy, 6, 6, 0xaaa496));
    const top2 = isoBox(g, cx, top1, 18, 30, 0x8a8478);
    isoRoof(g, cx, top2, 22, 30, 0x2f4f9a);
    // gate
    g.fillStyle(0x3a2a1a); g.fillPoints([{ x: cx + 8, y: by + 16 }, { x: cx + 22, y: by + 9 }, { x: cx + 22, y: by - 12 }, { x: cx + 8, y: by - 5 }], true);
    // banner
    g.lineStyle(2, 0x3a2a1a); g.lineBetween(cx, top2 - 30, cx, top2 - 52);
    g.fillStyle(0xd4af37); g.fillTriangle(cx, top2 - 52, cx + 16, top2 - 47, cx, top2 - 42);
  });

  // ---------- towers (3 levels each) ----------
  const towerDraw: Record<TowerId, (g: G, lvl: number, cx: number, by: number) => void> = {
    arrow: (g, lvl, cx, by) => {
      const wood = [0x8b5a2b, 0x80522a, 0x6e4a2c][lvl - 1];
      const roof = [0x8f7740, 0x8e2b22, 0x2b4f8e][lvl - 1];
      const b = isoBox(g, cx, by, 20, 8 + lvl * 2, 0x7a776f);
      const shaft = isoBox(g, cx, b, 14, 30 + lvl * 8, wood);
      // cross braces
      g.lineStyle(1, shade(wood, 0.5), 0.9);
      g.lineBetween(cx - 14, b, cx, shaft + 7); g.lineBetween(cx, b + 7, cx + 14, shaft);
      const plat = isoBox(g, cx, shaft, 20, 6, shade(wood, 1.15));
      // posts and roof
      g.fillStyle(shade(wood, 0.7));
      g.fillRect(cx - 18, plat - 14, 2, 14); g.fillRect(cx + 16, plat - 14, 2, 14); g.fillRect(cx - 1, plat - 4, 2, 14);
      isoRoof(g, cx, plat - 14, 24, 20 + lvl * 2, roof);
      if (lvl >= 2) { g.fillStyle(0xd4af37); g.fillRect(cx - 20, plat - 1, 40, 2); }
      if (lvl === 3) {
        g.lineStyle(2, 0x3a2a1a); g.lineBetween(cx, plat - 34 - lvl * 2, cx, plat - 52);
        g.fillStyle(0xd4af37); g.fillTriangle(cx, plat - 52, cx + 14, plat - 48, cx, plat - 44);
      }
    },
    cannon: (g, lvl, cx, by) => {
      const stone = [0x8a8f96, 0x7d838c, 0x6f7682][lvl - 1];
      const t = isoBox(g, cx, by, 24, 22 + lvl * 7, stone);
      // stone courses
      g.lineStyle(1, shade(stone, 0.45), 0.5);
      for (let y = by - 8; y > t + 4; y -= 8) { g.lineBetween(cx - 24, y, cx, y + 12); g.lineBetween(cx, y + 12, cx + 24, y); }
      [[-18, 0], [18, 0], [0, -9], [0, 9]].forEach(([dx, dy]) => isoBox(g, cx + dx, t + dy, 5, 6, shade(stone, 1.1)));
      const band = lvl === 3 ? 0xd4af37 : 0x3a3a3a;
      const barrel = (ox: number, oy: number) => {
        g.lineStyle(9, 0x2a2a2e); g.lineBetween(cx + ox, t - 6 + oy, cx + ox - 20, t + 4 + oy);
        g.fillStyle(0x111114); g.fillCircle(cx + ox - 20, t + 4 + oy, 4.5);
        if (lvl >= 2) { g.lineStyle(2, band); g.lineBetween(cx + ox - 6, t - 4 + oy, cx + ox - 9, t + 3 + oy); }
      };
      if (lvl === 3) { barrel(6, -3); barrel(-4, 3); } else barrel(0, 0);
      g.fillStyle(0x3a3a3e); g.fillCircle(cx, t - 6, 7);
    },
    frost: (g, lvl, cx, by) => {
      const b = isoBox(g, cx, by, 18, 10, 0x6f8294);
      const h = 34 + lvl * 12;
      const crystal = (x: number, y: number, w: number, hh: number) => {
        g.fillStyle(0x3a8fc4); g.fillPoints([{ x: x - w, y }, { x, y: y - hh }, { x, y: y + w * 0.5 }], true);
        g.fillStyle(0x7fd6ff); g.fillPoints([{ x, y: y + w * 0.5 }, { x, y: y - hh }, { x: x + w, y }], true);
        g.fillStyle(0xd8f6ff, 0.85); g.fillTriangle(x - 2, y - hh * 0.4, x, y - hh, x + 1, y - hh * 0.5);
      };
      if (lvl >= 3) { g.fillStyle(0x9fe6ff, 0.18); g.fillCircle(cx, b - h * 0.6, 26); }
      if (lvl >= 2) { crystal(cx - 11, b + 2, 5, h * 0.5); crystal(cx + 11, b + 2, 5, h * 0.55); }
      crystal(cx, b, 10, h);
      if (lvl >= 3) { crystal(cx - 5, b + 6, 4, h * 0.35); g.fillStyle(0xffffff); g.fillCircle(cx, b - h - 4, 2.5); }
    },
    arcane: (g, lvl, cx, by) => {
      const b = isoBox(g, cx, by, 20, 10, 0x3d3550);
      const ob = isoBox(g, cx, b, 10, 28 + lvl * 9, 0x5b3a8a);
      isoRoof(g, cx, ob, 10, 10, 0x6d48a3);
      if (lvl >= 2) {
        g.lineStyle(1, 0xd4af37, 0.9);
        for (let i = 0; i < lvl + 1; i++) { const y = b - 8 - i * 9; g.lineBetween(cx - 7, y, cx - 3, y + 2); g.lineBetween(cx + 3, y + 2, cx + 7, y); }
      }
      const orbY = ob - 22 - lvl * 2, orbR = 5 + lvl * 1.5;
      g.fillStyle(0xb77cff, 0.25); g.fillCircle(cx, orbY, orbR + 7);
      g.fillStyle(0xd9a8ff); g.fillCircle(cx, orbY, orbR);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(cx - 2, orbY - 2, orbR * 0.35);
      if (lvl === 3) { g.lineStyle(1.5, 0xe8c8ff, 0.8); g.strokeEllipse(cx, orbY, orbR * 4.4, orbR * 1.4); }
    },
  };
  (Object.keys(towerDraw) as TowerId[]).forEach((id) => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      bake(scene, `tower-${id}-${lvl}`, 64, TOWER_TEX_H, (g) => {
        const cx = 32, by = TOWER_TEX_H - GROUND_PAD;
        shadowEllipse(g, cx + 3, by + 2, 54, 22, 0.32);
        towerDraw[id](g, lvl, cx, by);
      });
    }
  });

  // ---------- mobs ----------
  bake(scene, 'mob-crawler', 48, 52, (g) => {
    const cx = 24, by = 52 - GROUND_PAD;
    // hunched undead crawler: grey-green flesh, spine ridges, glowing eyes
    g.fillStyle(0x4f5a45); g.fillRect(cx - 9, by - 8, 3, 8); g.fillRect(cx + 5, by - 8, 3, 8);
    g.fillStyle(0x7b8f6a); g.fillEllipse(cx - 2, by - 14, 26, 16);
    g.fillStyle(0x9aab86); g.fillEllipse(cx - 4, by - 17, 14, 7);
    g.fillStyle(0x5d6b50); [-10, -5, 0].forEach((d) => g.fillTriangle(cx + d - 3, by - 20, cx + d + 3, by - 20, cx + d, by - 26));
    g.fillStyle(0x8a9c76); g.fillCircle(cx + 10, by - 18, 7);
    g.fillStyle(0xff3b2f); g.fillRect(cx + 11, by - 20, 2, 2); g.fillRect(cx + 14, by - 20, 2, 2);
    g.lineStyle(2, 0xd8d2bf); g.lineBetween(cx + 12, by - 10, cx + 17, by - 4); g.lineBetween(cx + 15, by - 11, cx + 20, by - 6);
  });
  bake(scene, 'mob-brute', 60, 66, (g) => {
    const cx = 30, by = 66 - GROUND_PAD;
    // hulking armored brute: dark green-brown hide, iron plates, tusks
    g.fillStyle(0x3b2e22); g.fillRect(cx - 10, by - 12, 7, 12); g.fillRect(cx + 4, by - 12, 7, 12);
    g.fillStyle(0x5e6b3a); g.fillEllipse(cx, by - 24, 34, 28);
    g.fillStyle(0x6f7a85); g.fillRoundedRect(cx - 12, by - 32, 24, 16, 3);
    g.lineStyle(1, 0x3f444a); g.strokeRoundedRect(cx - 12, by - 32, 24, 16, 3);
    g.fillStyle(0x8a929c); g.fillCircle(cx - 15, by - 33, 6); g.fillCircle(cx + 15, by - 33, 6);
    g.fillStyle(0x6b7a44); g.fillCircle(cx + 4, by - 40, 8);
    g.fillStyle(0xf2ead2); g.fillTriangle(cx + 4, by - 36, cx + 7, by - 36, cx + 6, by - 42); g.fillTriangle(cx + 9, by - 36, cx + 12, by - 36, cx + 11, by - 42);
    g.fillStyle(0xffd23a); g.fillRect(cx + 5, by - 43, 2, 2); g.fillRect(cx + 9, by - 43, 2, 2);
    g.lineStyle(3, 0x4a3520); g.lineBetween(cx + 17, by - 26, cx + 24, by - 44);
    g.fillStyle(0x9aa3ad); g.fillTriangle(cx + 20, by - 46, cx + 30, by - 50, cx + 26, by - 38);
  });
  bake(scene, 'mob-bonewing', 56, 44, (g) => {
    const cx = 28, by = 44 - GROUND_PAD;
    // stone-skinned winged fiend
    g.fillStyle(0x6c7079);
    g.fillTriangle(cx - 4, by - 16, cx - 26, by - 26, cx - 18, by - 8);
    g.fillTriangle(cx + 4, by - 16, cx + 26, by - 26, cx + 18, by - 8);
    g.fillStyle(0x8a8f99);
    g.fillTriangle(cx - 4, by - 16, cx - 24, by - 24, cx - 12, by - 14);
    g.fillTriangle(cx + 4, by - 16, cx + 24, by - 24, cx + 12, by - 14);
    g.fillStyle(0x7d828c); g.fillEllipse(cx, by - 14, 12, 16);
    g.fillStyle(0x9aa0aa); g.fillCircle(cx, by - 23, 5);
    g.fillTriangle(cx - 4, by - 26, cx - 2, by - 26, cx - 5, by - 32); g.fillTriangle(cx + 2, by - 26, cx + 4, by - 26, cx + 5, by - 32);
    g.fillStyle(0xff3b2f); g.fillRect(cx - 3, by - 24, 2, 2); g.fillRect(cx + 1, by - 24, 2, 2);
  });
  bake(scene, 'mob-colossus', 104, 110, (g) => {
    const cx = 52, by = 110 - GROUND_PAD;
    // bloated stitched plague colossus
    g.fillStyle(0x6f7d5e); g.fillRect(cx - 18, by - 16, 12, 16); g.fillRect(cx + 7, by - 16, 12, 16);
    g.fillStyle(0x9fb88a); g.fillEllipse(cx, by - 40, 66, 56);
    g.fillStyle(0xb7cca2); g.fillEllipse(cx - 6, by - 48, 34, 24);
    g.fillStyle(0x7d9a5a, 0.8); g.fillCircle(cx + 14, by - 30, 6); g.fillCircle(cx - 16, by - 26, 4); g.fillCircle(cx + 2, by - 22, 3);
    g.lineStyle(2, 0x3d2a2a);
    g.lineBetween(cx - 20, by - 56, cx + 4, by - 20);
    for (let i = 0; i < 6; i++) { const t = i / 5; const x = cx - 20 + 24 * t, y = by - 56 + 36 * t; g.lineBetween(x - 4, y + 2, x + 4, y - 2); }
    g.fillStyle(0x8ea67a); g.fillCircle(cx + 6, by - 70, 10);
    g.fillStyle(0x7dff6a); g.fillRect(cx + 5, by - 72, 3, 2); g.fillRect(cx + 10, by - 72, 3, 2);
    // arm + cleaver and hook
    g.fillStyle(0x8ea67a); g.fillEllipse(cx + 32, by - 44, 14, 26); g.fillEllipse(cx - 32, by - 44, 14, 26);
    g.fillStyle(0x9aa3ad); g.fillRect(cx + 34, by - 66, 14, 26);
    g.fillStyle(0x5a3d22); g.fillRect(cx + 36, by - 40, 4, 10);
    g.lineStyle(3, 0x6f7682); g.beginPath(); g.arc(cx - 38, by - 30, 7, 0, Math.PI * 1.3); g.strokePath();
  });
  bake(scene, 'shadow', 40, 14, (g) => { g.fillStyle(0x000000, 0.35); g.fillEllipse(20, 7, 36, 12); });

  // ---------- projectiles & fx ----------
  bake(scene, 'proj-arrow', 18, 4, (g) => {
    g.fillStyle(0x6b4a2a); g.fillRect(0, 1, 14, 2);
    g.fillStyle(0xd8d8d8); g.fillTriangle(13, 0, 18, 2, 13, 4);
    g.fillStyle(0xeeeeee); g.fillRect(0, 0, 3, 1); g.fillRect(0, 3, 3, 1);
  });
  bake(scene, 'proj-cannon', 12, 12, (g) => { g.fillStyle(0x1a1a1c); g.fillCircle(6, 6, 5); g.fillStyle(0x555555); g.fillCircle(4, 4, 1.5); });
  bake(scene, 'proj-frost', 16, 16, (g) => { g.fillStyle(0x9fe6ff, 0.35); g.fillCircle(8, 8, 8); g.fillStyle(0xd8f6ff); g.fillCircle(8, 8, 4); });
  bake(scene, 'proj-arcane', 20, 20, (g) => { g.fillStyle(0xb77cff, 0.35); g.fillCircle(10, 10, 10); g.fillStyle(0xe8c8ff); g.fillCircle(10, 10, 5); g.fillStyle(0xffffff); g.fillCircle(9, 9, 2); });
  bake(scene, 'fx-ring', 64, 64, (g) => { g.lineStyle(4, 0xffffff, 1); g.strokeCircle(32, 32, 28); });
  bake(scene, 'fx-puff', 32, 32, (g) => { g.fillStyle(0xffffff, 0.8); g.fillCircle(16, 16, 14); });

  // ---------- ui icons ----------
  bake(scene, 'icon-gold', 20, 20, (g) => { g.fillStyle(0x8a6a10); g.fillCircle(10, 11, 8); g.fillStyle(0xf2c53d); g.fillCircle(10, 10, 8); g.fillStyle(0xffe58a); g.fillCircle(8, 8, 3); });
  bake(scene, 'icon-lives', 20, 20, (g) => {
    g.fillStyle(0x2f4f9a); g.fillPoints([{ x: 3, y: 3 }, { x: 17, y: 3 }, { x: 17, y: 10 }, { x: 10, y: 18 }, { x: 3, y: 10 }], true);
    g.fillStyle(0xd4af37); g.fillRect(9, 5, 2, 10); g.fillRect(6, 8, 8, 2);
  });
  bake(scene, 'icon-wave', 20, 20, (g) => { g.fillStyle(0xd8d2bf); g.fillCircle(10, 8, 6); g.fillStyle(0x1a1a1a); g.fillRect(7, 7, 2, 2); g.fillRect(11, 7, 2, 2); g.fillStyle(0xd8d2bf); g.fillRect(7, 12, 6, 5); });
}
