import Phaser from 'phaser';

/** Small fire-and-forget visual effects (tween based, respect scene tween timeScale). */
export class Effects {
  constructor(private scene: Phaser.Scene) {}

  floatText(x: number, y: number, text: string, color = '#ffd84a') {
    const t = this.scene.add
      .text(x, y, text, { fontFamily: 'Georgia, serif', fontSize: '14px', color, stroke: '#000', strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(90000);
    this.scene.tweens.add({ targets: t, y: y - 28, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  ring(x: number, y: number, radiusX: number, radiusY: number, tint: number) {
    const r = this.scene.add.image(x, y, 'fx-ring').setTint(tint).setDepth(y + 5).setScale(0.1, 0.05).setAlpha(0.9);
    this.scene.tweens.add({
      targets: r, scaleX: (radiusX * 2) / 64, scaleY: (radiusY * 2) / 64, alpha: 0, duration: 320,
      ease: 'Cubic.easeOut', onComplete: () => r.destroy(),
    });
  }

  puff(x: number, y: number, tint: number, scale = 1) {
    const p = this.scene.add.image(x, y, 'fx-puff').setTint(tint).setDepth(y + 5).setScale(0.3 * scale).setAlpha(0.8);
    this.scene.tweens.add({ targets: p, scale: 1.1 * scale, alpha: 0, duration: 350, onComplete: () => p.destroy() });
  }

  deathFade(sprite: Phaser.GameObjects.Image, onDone: () => void) {
    this.scene.tweens.add({ targets: sprite, alpha: 0, scaleY: 0.3, duration: 260, onComplete: onDone });
  }
}
