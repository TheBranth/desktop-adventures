import { SaveManager } from '../systems/SaveManager';

export class StartScreen extends Phaser.Scene {
    private titles = ['CEO', 'Dynamic VP', 'Head of Syrup Distribution', 'Manager of Managers', 'CFO', 'Director of Vibes'];
    private macguffins = ['Golden Stapler', 'Quantum Toner Cartridge', 'The Coffee of Life', 'TPS Report', 'Server Password'];

    constructor() {
        super('StartScreen');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Colors (Slack-ish)
        // Colors (Slack-ish)
        const sidebarColor = 0x3F0E40; // Aubergine
        const chatBgColor = 0xFFFFFF;

        // 1. Sidebar
        this.add.rectangle(0, 0, 220, height, sidebarColor).setOrigin(0);

        // Workspace Name
        this.add.text(20, 20, 'Desktop Adventures', {
            fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
        });

        // Channels Header
        this.add.text(20, 60, '▼ Channels', {
            fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#aaaaaa'
        });

        const hasSave = SaveManager.hasSave();

        // Channel Logic
        const channels = [
            { id: 'new', name: '# general', action: () => this.startNewGame(hasSave) },
            { id: 'continue', name: '# daily-standup', action: hasSave ? () => this.continueGame() : null, disabled: !hasSave },
            { id: 'random', name: '# random', action: null, disabled: true }
        ];

        let yPos = 90;
        channels.forEach(channel => {
            const color = channel.disabled ? '#666666' : '#cccccc';
            const suffix = channel.id === 'continue' && hasSave ? ' (Active Run)' : '';

            const txt = this.add.text(30, yPos, `${channel.name}${suffix}`, {
                fontFamily: 'Arial, sans-serif', fontSize: '16px', color: color
            });

            if (!channel.disabled) {
                txt.setInteractive({ useHandCursor: true });
                txt.on('pointerover', () => txt.setColor('#ffffff'));
                txt.on('pointerout', () => txt.setColor(color));
                txt.on('pointerdown', () => {
                    if (channel.action) channel.action();
                });
            }
            yPos += 30;
        });


        // 2. Chat Area
        // Background
        this.add.rectangle(220, 0, width - 220, height, chatBgColor).setOrigin(0);

        // Randomized Content
        const floor = 1;
        const boss = Phaser.Math.RND.pick(this.titles);
        const item = Phaser.Math.RND.pick(this.macguffins);
        this.registry.set('macguffin', item);

        // Header
        this.add.rectangle(220, 0, width - 220, 60, 0xffffff).setOrigin(0);
        this.add.line(0, 0, 220, 60, width, 60, 0xdddddd).setOrigin(0); // Border bottom

        this.add.text(240, 20, `@${boss.replace(/ /g, '_').toLowerCase()}`, {
            fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#000000', fontStyle: 'bold'
        });
        this.add.text(240, 42, '🟢 Active now', {
            fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#007a5a'
        });

        // Chat Message
        const date = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Avatar Placeholder (Rectangle)
        this.add.rectangle(240, 100, 40, 40, 0xcccccc).setOrigin(0);

        // Sender Name & Time
        this.add.text(290, 100, `${boss}  `, {
            fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#000000', fontStyle: 'bold'
        });
        this.add.text(290 + (boss.length * 9), 102, date, {
            fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#666666'
        });

        // Message Body
        const storyText = `Hey intern, welcome to Floor ${floor}.\nI need you to grab the *${item}* ASAP.\n\nDon't let me down.`;

        this.add.text(290, 125, storyText, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            color: '#1d1c1d',
            wordWrap: { width: width - 350 }
        });

        // Call to Action (Input Box style)
        const inputY = height - 80;
        const box = this.add.rectangle(240, inputY, width - 260, 50, 0xffffff).setOrigin(0);
        box.setStrokeStyle(1, 0x888888);

        const ctaText = hasSave ? "Resume your work? (Click #daily-standup)" : "Accept the assignment? (Click here)";

        this.add.text(255, inputY + 15, ctaText, {
            fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#888888'
        });

        if (!hasSave) {
            box.setInteractive({ useHandCursor: true });
            box.on('pointerdown', () => this.startNewGame(false));
        }

    }

    private startNewGame(hasSave: boolean) {
        if (hasSave) {
            SaveManager.clearSave();
        }
        this.registry.set('loadGame', false);
        this.scene.start('GameScene');
    }

    private continueGame() {
        this.registry.set('loadGame', true);
        this.scene.start('GameScene');
    }
}
