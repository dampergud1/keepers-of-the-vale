/** Screen layout (virtual resolution; Phaser scales it to fit the window). */
export const LAYOUT = {
  width: 1280,
  height: 800,
  topBar: 56,
  bottomBar: 150,
  /** Initial camera zoom for the map view. */
  mapZoom: 0.82,
} as const;

/** Global game rules — tune here. */
export const RULES = {
  startGold: 250,
  startLives: 20,
  /** Countdown before wave 1 (seconds). */
  firstWaveDelay: 30,
  /** Countdown between waves (seconds). */
  betweenWaves: 15,
  /** Gold per remaining countdown second when calling a wave early. */
  earlyCallGoldPerSecond: 1,
  /** Fraction of total invested gold returned on sell. */
  sellRefund: 0.7,
} as const;
