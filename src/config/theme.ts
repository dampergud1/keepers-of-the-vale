/**
 * Visual palettes for procedural placeholder art.
 * Maps pick a theme by id; add a new palette here to re-skin terrain.
 */
export interface Theme {
  id: ThemeId;
  name: string;
  background: number;
  grass: number[];          // base terrain tile variants
  grassDetail: number[];    // tufts / flowers / snow sparkles
  road: number;
  roadDetail: number[];
  roadEdge: number;
  cliffLeft: number;
  cliffRight: number;
  leaf: number[];           // dark → light foliage
  trunk: number;
  snowCaps: boolean;
  rock: number[];
}

export type ThemeId = 'vale' | 'frostreach';

export const THEMES: Record<ThemeId, Theme> = {
  // Green, temperate human kingdom — grass, oaks, pines and a packed dirt road.
  vale: {
    id: 'vale',
    name: 'Highvale Meadows',
    background: 0x070806,
    grass: [0x4f7d2e, 0x55852f, 0x4a7629, 0x5a8a34],
    grassDetail: [0x6d9c3f, 0x3e6622, 0x7fae4a, 0xd9d26a, 0xc9c9e8],
    road: 0x8a6a42,
    roadDetail: [0x77593a, 0x9c7b50, 0x6b5136, 0xa88c63],
    roadEdge: 0x5f4a2e,
    cliffLeft: 0x5a4330,
    cliffRight: 0x3f2f22,
    leaf: [0x1f4a1c, 0x2d6326, 0x3f7d31],
    trunk: 0x5a3d22,
    snowCaps: false,
    rock: [0x6f6f6a, 0x8d8d86, 0x55554f],
  },
  // Snowy northern wastes variant, ready for a later map.
  frostreach: {
    id: 'frostreach',
    name: 'Frostreach Tundra',
    background: 0x05070b,
    grass: [0xdfe8ef, 0xd6e1ea, 0xe8eef3, 0xcfdbe5],
    grassDetail: [0xffffff, 0xb9c9d6, 0xa9bccb, 0xf4f8fb, 0x9fb4c6],
    road: 0x7d7a78,
    roadDetail: [0x6a6866, 0x908d8a, 0xb7c3cc, 0x5d5b59],
    roadEdge: 0x55524f,
    cliffLeft: 0x6c7f91,
    cliffRight: 0x4b5b6b,
    leaf: [0x1d3a33, 0x264b40, 0x335f50],
    trunk: 0x4a3a2c,
    snowCaps: true,
    rock: [0x7c8a96, 0x9aa8b3, 0x5e6b76],
  },
};
