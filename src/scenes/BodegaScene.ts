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
    }

    create() {
        this.cameras.main.setBackgroundColor('#2d2d2d');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const centerX = width / 2;
        const isMobile = width < 600;

        // Dynamic Sizing
        const itemWidth = Math.min(500, width * 0.92); // 92% width on mobile
        const itemHeight = isMobile ? 80 : 60; // Taller on mobile for text wrapping

        // --- Header (Scrolls) ---
        let currentY = 40;
        this.add.text(centerX, currentY, "THE BODEGA", { fontFamily: 'JetBrains Mono', fontSize: isMobile ? '24px' : '32px', color: '#ffffff' }).setOrigin(0.5);
        currentY += 30;
        this.add.text(centerX, currentY, "Invest in yourself. Or just buy snacks.", { fontFamily: 'Inter', fontSize: isMobile ? '12px' : '14px', color: '#aaaaaa' }).setOrigin(0.5);
        currentY += 50;

        // --- Stats (Scrolls) ---
        const metaState = MetaSaveManager.loadMeta();

        const txtMeta = this.add.text(centerX, currentY, `STOCK OPTIONS: ${metaState.currency}`, { fontFamily: 'JetBrains Mono', fontSize: '20px', color: '#FFD700' }).setOrigin(0.5);
        currentY += 30;
        const txtCredits = this.add.text(centerX, currentY, `CREDITS: ${this.gameState.credits} ¥`, { fontFamily: 'JetBrains Mono', fontSize: '20px', color: '#00ff00' }).setOrigin(0.5);
        currentY += 50; // Gap before items

        // --- Shop Layout ---
        const startY = currentY;
        const gapY = isMobile ? 10 : 10; // Spacing between items

        // Helper to track buy position
        let listY = startY;

        // 1. Stairs vs Elevators (Max HP +10)
        this.createUpgradeItem(centerX, listY, itemWidth, itemHeight,
            "Stairs vs Elevators",
            "Take the hard way. +10 Max HP.",
            50,
            'stairs_course',
            metaState, txtMeta,
            () => {
                this.gameState.maxHp += 10;
                this.gameState.hp += 10;
            }
        );
        listY += itemHeight + gapY;

        // 2. Mindfulness Training
        this.createUpgradeItem(centerX, listY, itemWidth, itemHeight,
            "Mindfulness Training",
            isMobile ? "+20 Max Burnout." : "Expand your mental capacity. +20 Max Burnout.",
            50,
            'mindfulness',
            metaState, txtMeta,
            () => {
                (this.gameState as any).maxBurnout = ((this.gameState as any).maxBurnout || 100) + 20;
            }
        );
        listY += itemHeight + gapY;

        // 3. Consumables
        this.createConsumableItem(centerX, listY, itemWidth, itemHeight, "Premium Coffee", "Heals 10 HP. Fixes Burnout.", 50, 'coffee', txtCredits);
        listY += itemHeight + gapY;

        this.createConsumableItem(centerX, listY, itemWidth, itemHeight, "Granola Bar", "It's acceptable. Heals 5 HP.", 20, 'granola_bar', txtCredits);
        listY += itemHeight + gapY;

        // --- Footer (Pinned) ---
        // We use a Container fixed to camera, OR just setScrollFactor(0) on elements.
        const footerHeight = 60;

        // Background for footer to hide scrolled content behind it
        this.add.rectangle(centerX, height - footerHeight / 2, width, footerHeight, 0x2d2d2d)
            .setScrollFactor(0)
            .setDepth(10);

        const nextBtn = this.add.rectangle(centerX, height - footerHeight / 2, isMobile ? width * 0.8 : 200, 40, 0x444444)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(11); // Above footer bg

        this.add.text(centerX, height - footerHeight / 2, "NEXT FLOOR >", { fontFamily: 'Inter', fontSize: '20px', color: '#ffffff' })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(12);

        nextBtn.on('pointerover', () => nextBtn.setFillStyle(0x666666));
        nextBtn.on('pointerout', () => nextBtn.setFillStyle(0x444444));
        nextBtn.on('pointerdown', () => this.goToNextFloor());

        // --- Scrolling Logic ---
        const contentHeight = listY + footerHeight + 20;
        if (contentHeight > height) {
            this.cameras.main.setBounds(0, 0, width, contentHeight);

            // Allow drag
            let isDragging = false;
            let startY = 0;
            let startScrollY = 0;

            this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                isDragging = true;
                startY = pointer.y;
                startScrollY = this.cameras.main.scrollY;
            });

            this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
                if (isDragging) {
                    const dragY = pointer.y - startY;
                    this.cameras.main.scrollY = startScrollY - dragY;
                }
            });

            this.input.on('pointerup', () => {
                isDragging = false;
            });

            // Wheel scroll
            this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
                this.cameras.main.scrollY += deltaY;
            });
        }
    }

    private createUpgradeItem(x: number, y: number, w: number, h: number, name: string, desc: string, cost: number, id: string, meta: any, txtMeta: Phaser.GameObjects.Text, onBuy: () => void) {
        const isOwned = meta.unlocks.includes(id);
        const canAfford = meta.currency >= cost;

        const bg = this.add.rectangle(x, y, w, h, isOwned ? 0x224422 : 0x222222).setInteractive();
        const color = isOwned ? '#88ff88' : (canAfford ? '#ffffff' : '#555555');

        // Layout relative to item center (x, y)

        const paddingX = 15;
        const leftX = x - w / 2 + paddingX;
        const rightX = x + w / 2 - paddingX;

        // Name (Top Left)
        this.add.text(leftX, y - 10, name, { fontSize: '18px', color: color, fontStyle: 'bold' }).setOrigin(0, 0.5);

        // Desc (Bottom Left)
        this.add.text(leftX, y + 15, desc, { fontSize: '12px', color: '#aaaaaa', wordWrap: { width: w * 0.6 } }).setOrigin(0, 0.5);

        // Cost (Right Center)
        const btnText = isOwned ? "OWNED" : `${cost} Stocks`;
        this.add.text(rightX, y, btnText, { fontSize: '16px', color: color }).setOrigin(1, 0.5);

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

    private createConsumableItem(x: number, y: number, w: number, h: number, name: string, desc: string, cost: number, type: string, txtCredits: Phaser.GameObjects.Text) {
        const canAfford = this.gameState.credits >= cost;
        const bg = this.add.rectangle(x, y, w, h, 0x222222).setInteractive();
        const color = canAfford ? '#ffffff' : '#555555';

        const paddingX = 15;
        const leftX = x - w / 2 + paddingX;
        const rightX = x + w / 2 - paddingX;

        // Name
        this.add.text(leftX, y - 10, name, { fontSize: '18px', color: color, fontStyle: 'bold' }).setOrigin(0, 0.5);
        // Desc
        this.add.text(leftX, y + 15, desc, { fontSize: '12px', color: '#aaaaaa', wordWrap: { width: w * 0.6 } }).setOrigin(0, 0.5);
        // Cost
        this.add.text(rightX, y, `${cost} ¥`, { fontSize: '16px', color: color }).setOrigin(1, 0.5);

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
                        sprite_key: type, // Ensure UIManager finds the SVG
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
        const currentFloor = this.gameState.floor !== undefined ? this.gameState.floor : 1;
        this.scene.start('GameScene', {
            floor: currentFloor + 1,
            // Pass the state back. GameScene logic needs to handle generation based on this.
            // Actually, GameScene usually expects to Generate or Load.
            // If we pass an object to GameScene.init, we need GameScene to handle it.
            existingState: this.gameState
        });
    }
}
