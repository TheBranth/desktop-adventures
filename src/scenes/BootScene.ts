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
        const gfx = this.make.graphics({ x: 0, y: 0 });

        // Wall
        gfx.fillStyle(0x444444); gfx.fillRect(0, 0, 32, 32); gfx.generateTexture('wall', 32, 32); gfx.clear();

        // Floor (Modern Carpet)
        gfx.fillStyle(0x222222); gfx.fillRect(0, 0, 32, 32);
        gfx.lineStyle(1, 0x333333); gfx.strokeRect(0, 0, 32, 32);
        gfx.generateTexture('floor', 32, 32); gfx.clear();

        // Player
        gfx.fillStyle(0xffffff); gfx.fillRect(4, 4, 24, 24); gfx.generateTexture('player', 32, 32); gfx.clear();

        // Enemies
        // Intern (Green Hoodie)
        gfx.fillStyle(0x00ff00); gfx.fillRect(4, 4, 24, 24); gfx.generateTexture('intern', 32, 32); gfx.clear();
        // Roomba (Red Circle)
        gfx.fillStyle(0xff0000); gfx.fillCircle(16, 16, 12); gfx.generateTexture('roomba', 32, 32); gfx.clear();
        // Manager (Blue Suit)
        gfx.fillStyle(0x0000ff); gfx.fillRect(4, 4, 24, 24); gfx.generateTexture('manager', 32, 32); gfx.clear();
        // Printer (Grey Box)
        gfx.fillStyle(0x888888); gfx.fillRect(2, 2, 28, 28); gfx.generateTexture('printer', 32, 32); gfx.clear();

        // Items
        // Blue Key
        gfx.fillStyle(0x0000ff); gfx.fillRect(10, 8, 12, 16); gfx.generateTexture('key_blue', 32, 32); gfx.clear();
        // Red Key
        gfx.fillStyle(0xff0000); gfx.fillRect(10, 8, 12, 16); gfx.generateTexture('key_red', 32, 32); gfx.clear();
        // Newspaper
        gfx.fillStyle(0xdddddd); gfx.fillRect(8, 12, 16, 8); gfx.generateTexture('weapon', 32, 32); gfx.clear();
        // Coffee
        gfx.fillStyle(0x6f4e37); gfx.fillCircle(16, 16, 8); gfx.generateTexture('consumable', 32, 32); gfx.clear();

        // Environment
        // Desk
        gfx.fillStyle(0x8b4513); gfx.fillRect(0, 10, 32, 12); gfx.generateTexture('desk', 32, 32); gfx.clear();
        // Vending
        gfx.fillStyle(0x333333); gfx.fillRect(4, 0, 24, 32); gfx.fillStyle(0x00ffff); gfx.fillRect(6, 4, 20, 10); gfx.generateTexture('vending', 32, 32); gfx.clear();

        console.log('BootScene created. Starting GameScene...');
        this.scene.start('GameScene');
    }
}
