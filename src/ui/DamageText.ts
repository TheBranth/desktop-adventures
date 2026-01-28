export class DamageText {
    constructor(scene: Phaser.Scene, x: number, y: number, amount: number | string, color: string = '#ff0000') {
        const text = scene.add.text(x, y, amount.toString(), {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '16px',
            color: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Tween: Float Up and Fade Out
        scene.tweens.add({
            targets: text,
            y: y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power1',
            onComplete: () => {
                text.destroy();
            }
        });
    }
}
