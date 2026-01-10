import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load assets here later
        // this.load.image('logo', 'assets/logo.png');
    }

    create() {
        // Generate Placeholder Patterns
        // Wall (Grey)
        const wall = this.make.graphics({ x: 0, y: 0 });
        wall.fillStyle(0x555555);
        wall.fillRect(0, 0, 32, 32);
        wall.generateTexture('wall', 32, 32);

        // Floor (Beige/Dark Grey)
        const floor = this.make.graphics({ x: 0, y: 0 });
        floor.fillStyle(0x222222);
        floor.fillRect(0, 0, 32, 32);
        floor.lineStyle(2, 0x333333);
        floor.strokeRect(0, 0, 32, 32);
        floor.generateTexture('floor', 32, 32);

        // Player (White Face)
        const player = this.make.graphics({ x: 0, y: 0 });
        player.fillStyle(0xffffff);
        player.fillRect(4, 4, 24, 24);
        player.generateTexture('player', 32, 32);

        // MacGuffin (Gold)
        const item = this.make.graphics({ x: 0, y: 0 });
        item.fillStyle(0xffd700);
        item.fillCircle(16, 16, 10);
        item.generateTexture('item_paper', 32, 32);

        console.log('BootScene created. Starting GameScene...');
        this.scene.start('GameScene');
    }
}
