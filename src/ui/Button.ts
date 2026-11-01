import Phaser from 'phaser';

export interface ButtonOpts {
  width: number;
  height: number;
  label: string;
  fontSize?: number;
  onClick: () => void;
}

/** Stone-and-gold framed button. */
export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  readonly text: Phaser.GameObjects.Text;
  private hover = false;
  private enabled = true;
  private active_ = false;

  constructor(scene: Phaser.Scene, x: number, y: number, private opts: ButtonOpts) {
    super(scene, x, y);
    this.bg = scene.add.graphics();
    this.text = scene.add.text(opts.width / 2, opts.height / 2, opts.label, {
      fontFamily: 'Georgia, serif', fontSize: `${opts.fontSize ?? 15}px`, color: '#f3e3b5', align: 'center',
    }).setOrigin(0.5);
    this.add([this.bg, this.text]);
    this.setSize(opts.width, opts.height);
    this.setInteractive(new Phaser.Geom.Rectangle(opts.width / 2, opts.height / 2, opts.width, opts.height), Phaser.Geom.Rectangle.Contains);
    this.on('pointerover', () => { this.hover = true; this.redraw(); });
    this.on('pointerout', () => { this.hover = false; this.redraw(); });
    this.on('pointerdown', (p: Phaser.Input.Pointer) => { if (this.enabled && p.leftButtonDown()) opts.onClick(); });
    scene.add.existing(this);
    this.redraw();
  }

  setLabel(s: string) { this.text.setText(s); return this; }
  setEnabled(v: boolean) { if (v !== this.enabled) { this.enabled = v; this.redraw(); } return this; }
  setActiveState(v: boolean) { if (v !== this.active_) { this.active_ = v; this.redraw(); } return this; }

  private redraw() {
    const { width: w, height: h } = this.opts;
    const g = this.bg;
    g.clear();
    const fill = !this.enabled ? 0x2a2622 : this.active_ ? 0x5a4520 : this.hover ? 0x4a3d2c : 0x362d22;
    g.fillStyle(fill, 0.96); g.fillRoundedRect(0, 0, w, h, 4);
    g.lineStyle(2, this.active_ ? 0xffd84a : this.enabled ? 0xa8854a : 0x5a4b36, 1); g.strokeRoundedRect(0, 0, w, h, 4);
    g.lineStyle(1, 0x000000, 0.5); g.strokeRoundedRect(3, 3, w - 6, h - 6, 3);
    this.text.setAlpha(this.enabled ? 1 : 0.45);
  }
}
