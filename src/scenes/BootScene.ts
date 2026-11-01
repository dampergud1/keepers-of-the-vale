import Phaser from 'phaser';
import { generateTextures } from '../art/TextureFactory';
import { DEFAULT_MAP, MAPS } from '../config/map';
import { THEMES } from '../config/theme';

/** Generates all procedural textures, then starts the battlefield and HUD. */
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    generateTextures(this, THEMES[MAPS[DEFAULT_MAP].theme]);
    this.scene.launch('Game');
    this.scene.launch('UI');
    this.scene.stop();
  }
}
