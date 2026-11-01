# Keepers of the Vale — isometric tower defense prototype

Phaser 3 + TypeScript + Vite. All art is procedural placeholder (no external assets).

## Run
    npm install
    npm run dev        # dev server with hot reload (http://localhost:5173)
    npm run build      # type-check + production build into dist/
    npm run preview    # serve dist/ on http://localhost:4173
    npm run verify     # headless smoke test (needs preview running), writes screenshot.png
    node scripts/autoplay.mjs   # bot plays all 10 waves (balance check)

dist/ is fully static (relative paths) — open it from any static host (GitHub Pages, Netlify, itch.io, `python3 -m http.server`).

## Controls
- 1–4 or click a build card → ghost tower + range; click a grass tile to build (Shift+click keeps building; right-click/Esc cancels)
- Click a tower → stats + range; U upgrade (3 levels), X/Delete sell (70% refund)
- N start / call next wave early (+1 gold per second left on the timer)
- P or Space pause · F toggle 1x/2x · Arrow keys or right/middle-drag pan · mouse wheel zoom

## Layout
    src/config/   layout.ts (rules: gold, lives, timers), towers.ts, mobs.ts, waves.ts, map.ts, theme.ts
    src/art/      TextureFactory.ts — procedural textures (swap keys for real sprites later)
    src/entities/ Mob, Tower, Projectile
    src/systems/  IsoGrid (projection), GameState, WaveManager, Effects
    src/scenes/   BootScene (textures) → GameScene (battlefield) + UIScene (HUD)
    src/ui/       Button
