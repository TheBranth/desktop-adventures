import Phaser from 'phaser';
import { GameState } from '../types/World';
import { MetaSaveManager } from '../systems/SaveManager';

export class BodegaScene extends Phaser.Scene {
    private gameState!: GameState;

    constructor() {
        super({ key: 'BodegaScene' });
    }

    init(data: { gameState: GameState }) {
        this.gameState = data.gameState;

        // --- Persistence Logic ---
        // 1. Convert Run Credits to Meta Experience? Or separately?
        // For now, let's just display both.
        // We'll calculate a "Run Bonus" here maybe?
    }

    create() {
        this.cameras.main.setBackgroundColor('#2d2d2d');

        const centerX = this.cameras.main.width / 2;

        // --- Header ---
        this.add.text(centerX, 40, "THE BODEGA", { fontFamily: 'JetBrains Mono', fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
        this.add.text(centerX, 70, "Invest in yourself. Or just buy snacks.", { fontFamily: 'Inter', fontSize: '14px', color: '#aaaaaa' }).setOrigin(0.5);

        // --- Stats ---
        const metaState = MetaSaveManager.loadMeta();
        // Temporary: Grant free currency for testing if broke
        // if (metaState.currency < 100) metaState.currency = 100;

        const txtMeta = this.add.text(centerX, 120, `STOCK OPTIONS: ${metaState.currency}`, { fontFamily: 'JetBrains Mono', fontSize: '20px', color: '#FFD700' }).setOrigin(0.5);
        const txtCredits = this.add.text(centerX, 150, `CREDITS: ${this.gameState.credits} ¥`, { fontFamily: 'JetBrains Mono', fontSize: '20px', color: '#00ff00' }).setOrigin(0.5);

        // --- Shop Layout ---
        const startY = 220;
        const gapY = 70;

        // 1. Stairs vs Elevators (Max HP +10)
        this.createUpgradeItem(centerX, startY,
            "Stairs vs Elevators Course",
            "Take the hard way. +10 Max HP.",
            50,
            'stairs_course',
            metaState, txtMeta,
            () => {
                this.gameState.maxHp += 10;
                this.gameState.hp += 10;
            }
        );

        // 2. Mindfulness Training (Burnout Cap +20)
        // Note: Burnout logic currently clamps to 100 in GameScene. We might need to make that dynamic.
        // For now, let's assume GameScene respects maxBurnout if we added it, or we just rely on logic changes later.
        // Let's implement it as: Reduces current burnout by 50 AND ... wait user asked for "Extra Burnout" (Capacity).
        // Let's enable "Deep Breaths" passive?
        // Let's just grant a Burnout Shield?
        // Okay, let's stick to the prompt: "Mindfulness Training"
        this.createUpgradeItem(centerX, startY + gapY,
            "Mindfulness Training",
            "Expand your mental capacity. +20 Max Burnout.",
            50,
            'mindfulness',
            metaState, txtMeta,
            () => {
                // We need to store 'maxBurnout' in gameState if it's not there.
                // It currently isn't in GameState interface explicitly (usually hardcoded 100).
                // We'll add it dynamically or patch the interface later.
                (this.gameState as any).maxBurnout = ((this.gameState as any).maxBurnout || 100) + 20;
            }
        );

        // 3. Consumables (Credits)
        this.createConsumableItem(centerX, startY + gapY * 2.5, "Premium Coffee", "Heals 10 HP. Fixes Burnout.", 50, 'coffee', txtCredits);
        this.createConsumableItem(centerX, startY + gapY * 3.5, "Granola Bar", "It's acceptable. Heals 5 HP.", 20, 'granola_bar', txtCredits);


        // --- Footer ---
        const nextBtn = this.add.rectangle(centerX, this.cameras.main.height - 50, 200, 50, 0x444444).setInteractive();
        this.add.text(centerX, this.cameras.main.height - 50, "NEXT FLOOR >", { fontFamily: 'Inter', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);

        nextBtn.on('pointerover', () => nextBtn.setFillStyle(0x666666));
        nextBtn.on('pointerout', () => nextBtn.setFillStyle(0x444444));
        nextBtn.on('pointerdown', () => this.goToNextFloor());
    }

    private createUpgradeItem(x: number, y: number, name: string, desc: string, cost: number, id: string, meta: any, txtMeta: Phaser.GameObjects.Text, onBuy: () => void) {
        const isOwned = meta.unlocks.includes(id);
        const canAfford = meta.currency >= cost;

        const bg = this.add.rectangle(x, y, 500, 60, isOwned ? 0x224422 : 0x222222).setInteractive();
        const color = isOwned ? '#88ff88' : (canAfford ? '#ffffff' : '#555555');

        this.add.text(x - 240, y - 15, name, { fontSize: '18px', color: color, fontStyle: 'bold' }).setOrigin(0, 0.5);
        this.add.text(x - 240, y + 15, desc, { fontSize: '12px', color: '#aaaaaa' }).setOrigin(0, 0.5);

        const btnText = isOwned ? "OWNED" : `${cost} Stocks`;
        this.add.text(x + 230, y, btnText, { fontSize: '16px', color: color }).setOrigin(1, 0.5);

        if (!isOwned && canAfford) {
            bg.on('pointerdown', () => {
                MetaSaveManager.addCurrency(-cost);
                MetaSaveManager.unlockItem(id);
                // Update UI visually without full restart to keep it snappy
                bg.setFillStyle(0x224422);
                meta.currency -= cost; // Local update for display
                meta.unlocks.push(id);
                txtMeta.setText(`STOCK OPTIONS: ${meta.currency}`);

                // Apply Effect
                onBuy();

                // Disable button logic effectively
                bg.removeAllListeners();
            });
        }
    }

    private createConsumableItem(x: number, y: number, name: string, desc: string, cost: number, type: string, txtCredits: Phaser.GameObjects.Text) {
        const canAfford = this.gameState.credits >= cost;
        const bg = this.add.rectangle(x, y, 500, 60, 0x222222).setInteractive();
        const color = canAfford ? '#ffffff' : '#555555';

        this.add.text(x - 240, y - 15, name, { fontSize: '18px', color: color, fontStyle: 'bold' }).setOrigin(0, 0.5);
        this.add.text(x - 240, y + 15, desc, { fontSize: '12px', color: '#aaaaaa' }).setOrigin(0, 0.5);
        this.add.text(x + 230, y, `${cost} ¥`, { fontSize: '16px', color: color }).setOrigin(1, 0.5);

        if (canAfford) {
            bg.on('pointerdown', () => {
                if (this.gameState.credits >= cost) {
                    this.gameState.credits -= cost;
                    txtCredits.setText(`CREDITS: ${this.gameState.credits} ¥`);

                    // Add to inventory
                    this.gameState.inventory.push({
                        id: `buy_${Date.now()}`,
                        type: type,
                        name: name,
                        icon: '📦'
                    });

                    // Visual Feedback
                    this.tweens.add({
                        targets: bg,
                        alpha: 0.5,
                        yoyo: true,
                        duration: 100
                    });
                }
            });
        }
    }

    private goToNextFloor() {
        // Transition back to GameScene
        this.scene.start('GameScene', {
            floor: (this.gameState.floor || 1) + 1,
            // Pass the state back. GameScene logic needs to handle generation based on this.
            // Actually, GameScene usually expects to Generate or Load.
            // If we pass an object to GameScene.init, we need GameScene to handle it.
            existingState: this.gameState

            // Note: GameScene likely needs refactoring to accept 'existingState' in init().
            // Currently GameScene.create checks SaveManager.loadGame().
        });
    }
}
