import type { ThemeId } from './theme';

/**
 * Map definition.
 *  - waypoints: grid corners of the road, from spawn to the keep. Straight
 *    (horizontal/vertical) segments only; road tiles are derived from these.
 *  - decor: one string per row. '.' open grass, 'T' oak, 'P' pine, 'R' rock.
 *    Decor on road tiles is ignored. Decor tiles are not buildable.
 */
export interface MapDef {
  id: string;
  name: string;
  theme: ThemeId;
  size: number;
  waypoints: [col: number, row: number][];
  decor: string[];
}

export const MAPS: Record<string, MapDef> = {
  kingsroad: {
    id: 'kingsroad',
    name: "The King's Road",
    theme: 'vale',
    size: 20,
    waypoints: [
      [0, 2], [6, 2], [6, 8], [2, 8], [2, 14], [10, 14], [10, 4],
      [16, 4], [16, 12], [13, 12], [13, 17], [19, 17],
    ],
    decor: [
      'PPTT......R...PTTPPT',
      'PT.................P',
      '..........T........T',
      'R...........T......P',
      '...................T',
      'T..........R.......P',
      'P.................TT',
      'T...............R..T',
      '...................P',
      'T....T.............T',
      'PT.........R.......P',
      'T..................T',
      'P......T...........P',
      'T.................RT',
      '...................T',
      'PT.................P',
      'T...R.......T......T',
      'P...................',
      'TT.....T.......R..PT',
      'PPTTPP..TTPPT...TTPP',
    ],
  },
};

export const DEFAULT_MAP = 'kingsroad';
