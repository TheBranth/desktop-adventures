import Phaser from 'phaser';

export class StartScreen extends Phaser.Scene {
    private titles = ['CEO', 'Dynamic VP', 'Head of Syrup Distribution', 'Manager of Managers', 'CFO', 'Director of Vibes'];
    private macguffins = ['Golden Stapler', 'Quantum Toner Cartridge', 'The Coffee of Life', 'TPS Report', 'Server Password'];

    constructor() {
        super('StartScreen');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#111111');

        // Randomized Logic
        const floor = 1;
        const boss = Phaser.Math.RND.pick(this.titles);
        const item = Phaser.Math.RND.pick(this.macguffins);

        // Store in Registry for GameScene to access? Or just flavor text here.
        // Let's pass it to GameScene via data or registry.
        this.registry.set('macguffin', item);

        const storyText = `Welcome to Floor ${floor}, intern.\n\nThe ${boss} tasked you to retrieve the\n"${item}".\n\nAnd be fast about it! He needs it before\nthe next meeting!`;

        // Title
        this.add.text(width / 2, 80, 'SALARYMAN\'S DUNGEON', {
            fontFamily: 'monospace',
            fontSize: '32px',
            color: '#00ff00'
        }).setOrigin(0.5);

        // Story
        this.add.text(width / 2, height / 2, storyText, {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#eeeeee',
            align: 'center',
            wordWrap: { width: 400 }
        }).setOrigin(0.5);

        // Instruction
        this.add.text(width / 2, height - 100, '[ PRESS SPACE TO CLOCK IN ]', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5).setAlpha(0.8);

        // Input
        if (this.input.keyboard) {
            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.start('GameScene');
            });
        }
    }
}
