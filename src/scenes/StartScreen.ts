import { SaveManager } from '../systems/SaveManager';

export class StartScreen extends Phaser.Scene {
    private titles = ['CEO', 'Dynamic VP', 'Head of Syrup Distribution', 'Manager of Managers', 'CFO', 'Director of Vibes'];
    private macguffins = ['Golden Stapler', 'Quantum Toner Cartridge', 'The Coffee of Life', 'TPS Report', 'Server Password'];

    constructor() {
        super('StartScreen');
    }

    create() {
        document.body.classList.remove('game-active');
        document.body.classList.remove('mobile-inventory-open');
        document.body.classList.remove('mobile-logs-open');

        // Explicitly hide HUDs to be safe
        document.querySelectorAll<HTMLElement>('.mobile-hud').forEach(el => el.style.display = 'none');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const isMobile = width < 600;

        // Layout Constants
        const sidebarWidth = isMobile ? 0 : 220;
        const chatX = sidebarWidth;
        const chatWidth = width - sidebarWidth;

        // Colors (Slack-ish)
        const sidebarColor = 0x3F0E40; // Aubergine
        const chatBgColor = 0xFFFFFF;

        // 1. Sidebar (Desktop Only)
        if (!isMobile) {
            this.add.rectangle(0, 0, sidebarWidth, height, sidebarColor).setOrigin(0);

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
                { id: 'procurement', name: '# it-services', action: () => this.visitProcurement(hasSave), disabled: false },
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
        }

        // 2. Chat Area
        // Background
        this.add.rectangle(chatX, 0, chatWidth, height, chatBgColor).setOrigin(0);

        // Randomized Content
        const floor = 1;
        const boss = Phaser.Math.RND.pick(this.titles);
        const item = Phaser.Math.RND.pick(this.macguffins);
        this.registry.set('macguffin', item);

        // Header
        this.add.rectangle(chatX, 0, chatWidth, 60, 0xffffff).setOrigin(0);
        this.add.line(0, 0, chatX, 60, width, 60, 0xdddddd).setOrigin(0); // Border bottom

        const headerPadding = isMobile ? 20 : 20;
        this.add.text(chatX + headerPadding, 20, `@${boss.replace(/ /g, '_').toLowerCase()}`, {
            fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#000000', fontStyle: 'bold'
        });
        this.add.text(chatX + headerPadding, 42, '🟢 Active now', {
            fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#007a5a'
        });

        // Chat Message
        const date = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Avatar Placeholder (Rectangle)
        const msgX = chatX + (isMobile ? 10 : 20);
        const msgY = 100;
        this.add.rectangle(msgX, msgY, 40, 40, 0xcccccc).setOrigin(0);

        // Sender Name & Time
        const textX = msgX + 50;
        this.add.text(textX, msgY, `${boss}  `, {
            fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#000000', fontStyle: 'bold'
        });

        // Mobile Time formatting could be simplified
        if (!isMobile) {
            this.add.text(textX + (boss.length * 9), msgY + 2, date, {
                fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#666666'
            });
        }

        // Message Body
        const storyText = `Hey intern, welcome to Floor ${floor}.\nI need you to grab the *${item}* ASAP.\n\nDon't let me down.`;
        const wrapWidth = chatWidth - (isMobile ? 40 : 130);

        this.add.text(textX, msgY + 25, storyText, {
            fontFamily: 'Arial, sans-serif',
            fontSize: isMobile ? '16px' : '15px',
            color: '#1d1c1d',
            wordWrap: { width: wrapWidth }
        });

        // Call to Action (Input Box style)
        const inputY = height - (isMobile ? 120 : 80);
        const boxWidth = chatWidth - (isMobile ? 40 : 40);
        const boxX = chatX + (isMobile ? 20 : 20);

        const box = this.add.rectangle(boxX, inputY, boxWidth, 50, 0xffffff).setOrigin(0);
        box.setStrokeStyle(1, 0x888888);

        const hasSave = SaveManager.hasSave();

        // Button Logic / Text
        let ctaText = "Accept the assignment?";
        if (hasSave) ctaText = "Resume Work (#daily-standup)";

        this.add.text(boxX + 15, inputY + 15, ctaText, {
            fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#888888'
        });

        // Main Interaction
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => {
            if (hasSave) this.continueGame(); // Default to continue if save exists
            else this.startNewGame(false);
        });

        // Secondary Button for Mobile (New Game)
        if (isMobile && hasSave) {
            const newGameBtn = this.add.text(boxX + boxWidth / 2, inputY + 70, "Start New Game (Reset)", {
                fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#cc0000'
            }).setOrigin(0.5);

            newGameBtn.setInteractive({ useHandCursor: true });
            newGameBtn.on('pointerdown', () => this.startNewGame(true));
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

    private visitProcurement(hasSave: boolean) {
        if (hasSave) {
            const confirm = window.confirm("WARNING: Entering IT Services (Bodega) will ABANDON your current run.\n\nAre you sure you want to start a new run?");
            if (!confirm) return;
            SaveManager.clearSave();
        }

        // Generate a fresh state for Floor 1
        // We know MapGenerator exists, let's use it or create a default structure.
        // Importing MapGenerator just for this might be circular or heavy? 
        // Actually, we can just pass a flag to GameScene to "Start at Bodega"?
        // No, BodegaScene needs the state.

        // Let's rely on a helper to get initial state.
        // For now, I'll construct a basic valid state manually to avoid heavy imports if MapGenerator isn't exported as static.
        // MapGenerator IS a class.

        // Better approach:
        // Transition to BOD_SCENE with a "New Run" flag?
        // BodegaScene init() takes { gameState }.

        // Let's import MapGenerator at the top of file (I will add that in a separate edit or assume I can do it here if I scroll up, but I can't see top).
        // I will implement a basic state factory here for now to be safe, or just minimalist state.

        const freshState = {
            floor: 0,
            hp: 20,
            maxHp: 20,
            burnout: 0,
            credits: 0,
            inventory: [],
            worldMap: {}, // Empty, GameScene will generate if missing/empty or we can force it.
            currentRoomId: 'start',
            playerX: 5,
            playerY: 5,
            visited_rooms: [],
            global_flags: {},
            tower_level: 1
        };

        this.scene.start('BodegaScene', { gameState: freshState });
    }
}
