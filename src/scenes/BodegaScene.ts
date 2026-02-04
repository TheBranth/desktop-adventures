import Phaser from 'phaser';

export class BodegaScene extends Phaser.Scene {
    private gameState: any; // Using any to avoid importing full type if not needed, but we should probably use GameState

    constructor() {
        super({ key: 'BodegaScene' });
    }

    init(data: { gameState: any }) {
        this.gameState = data.gameState;
    }

    create() {
        const { width, height } = this.scale;

        // Background (Cozy Bodega Color)
        this.add.rectangle(0, 0, width, height, 0x5D4037).setOrigin(0);

        // Header
        this.add.text(width / 2, 50, 'THE BODEGA', {
            fontSize: '32px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 90, `Floor ${this.gameState.floor} Complete. Take a break.`, {
            fontSize: '18px',
            color: '#D7CCC8'
        }).setOrigin(0.5);

        // Stats Display
        this.add.text(width / 2, 130, `Credits: ¥${this.gameState.credits} | HP: ${this.gameState.hp}/${this.gameState.maxHp}`, {
            fontSize: '20px',
            color: '#FFD54F'
        }).setOrigin(0.5);

        // Shop Items
        const items = [
            { name: 'Coffee (Heal 10)', cost: 5, action: () => this.buyHeal(10, 5) },
            { name: 'Donut (Heal 25)', cost: 10, action: () => this.buyHeal(25, 10) },
            { name: 'Espresso Shot (Burnout -10)', cost: 8, action: () => this.buyRelief(10, 8) }
        ];

        let y = 180;
        items.forEach((item) => {
            const btn = this.add.container(width / 2, y);

            const bg = this.add.rectangle(0, 0, 300, 40, 0x8D6E63).setInteractive({ useHandCursor: true });
            const text = this.add.text(0, 0, `${item.name} - ¥${item.cost}`, { fontSize: '18px', color: '#fff' }).setOrigin(0.5);

            btn.add([bg, text]);

            bg.on('pointerdown', () => {
                this.tweens.add({ targets: btn, scaleX: 0.95, scaleY: 0.95, yoyo: true, duration: 50 });
                item.action();
                this.scene.restart({ gameState: this.gameState }); // Refresh UI
            });

            bg.on('pointerover', () => bg.setFillStyle(0xA1887F));
            bg.on('pointerout', () => bg.setFillStyle(0x8D6E63));

            y += 50;
        });

        // Next Floor Button
        const nextBtn = this.add.container(width / 2, height - 80);
        const nextBg = this.add.rectangle(0, 0, 200, 50, 0x2E7D32).setInteractive({ useHandCursor: true });
        const nextText = this.add.text(0, 0, 'NEXT FLOOR >', { fontSize: '24px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
        nextBtn.add([nextBg, nextText]);

        nextBg.on('pointerdown', () => {
            // Increment Floor
            this.gameState.floor++;
            this.gameState.currentRoomId = '0_0'; // Reset room? Or allow map generator to handle entry
            // Actually, map generator handles entry, but we need to reset room ID if we generate a new map.
            // But GameScene handles generation.

            this.scene.start('GameScene', { gameState: this.gameState, newFloor: true });
        });

        nextBg.on('pointerover', () => nextBg.setFillStyle(0x388E3C));
        nextBg.on('pointerout', () => nextBg.setFillStyle(0x2E7D32));
    }

    private buyHeal(amount: number, cost: number) {
        if (this.gameState.credits >= cost) {
            this.gameState.credits -= cost;
            this.gameState.hp = Math.min(this.gameState.maxHp, this.gameState.hp + amount);
        }
    }

    private buyRelief(amount: number, cost: number) {
        if (this.gameState.credits >= cost) {
            this.gameState.credits -= cost;
            this.gameState.burnout = Math.max(0, this.gameState.burnout - amount);
        }
    }
}
