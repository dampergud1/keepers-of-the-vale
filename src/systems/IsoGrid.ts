/** Isometric (2:1 diamond) projection helpers. Grid coords are floats: tile (c,r) spans [c,c+1)x[r,r+1). */
export const TILE_W = 64;
export const TILE_H = 32;
/** Screen half-axes of a 1-tile-radius circle in grid space (for range ellipses). */
export const RANGE_RX = (TILE_W / 2) * Math.SQRT2;
export const RANGE_RY = (TILE_H / 2) * Math.SQRT2;

export interface Pt { x: number; y: number }

export class IsoGrid {
  constructor(public readonly size: number, public readonly ox: number, public readonly oy: number) {}

  /** Grid (col,row) → screen/world point. */
  toScreen(gx: number, gy: number): Pt {
    return { x: this.ox + ((gx - gy) * TILE_W) / 2, y: this.oy + ((gx + gy) * TILE_H) / 2 };
  }

  toGrid(x: number, y: number): { gx: number; gy: number } {
    const dx = (x - this.ox) / (TILE_W / 2);
    const dy = (y - this.oy) / (TILE_H / 2);
    return { gx: (dx + dy) / 2, gy: (dy - dx) / 2 };
  }

  tileAt(x: number, y: number): { c: number; r: number } | null {
    const g = this.toGrid(x, y);
    const c = Math.floor(g.gx);
    const r = Math.floor(g.gy);
    return this.inBounds(c, r) ? { c, r } : null;
  }

  tileCenter(c: number, r: number): Pt {
    return this.toScreen(c + 0.5, r + 0.5);
  }

  inBounds(c: number, r: number): boolean {
    return c >= 0 && r >= 0 && c < this.size && r < this.size;
  }
}
