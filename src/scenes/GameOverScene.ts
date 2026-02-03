import { SaveManager, MetaSaveManager } from '../systems/SaveManager';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        SaveManager.clearSave();

        // Death Benefit: 5 Stock Options
        MetaSaveManager.addCurrency(5);
        const meta = MetaSaveManager.loadMeta();

        this.cameras.main.setBackgroundColor('#000000');

        const { width, height } = this.scale;

        // Paper Background
        const paper = this.add.rectangle(width / 2, height / 2, 400, 500, 0xffffff);
        paper.setOrigin(0.5);

        // Text
        const style = { fontFamily: '"Courier New", monospace', color: '#000000', fontSize: '16px' };

        this.add.text(width / 2, height / 2 - 200, 'NOTICE OF TERMINATION', { ...style, fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 150, 'To: Employee #427', style).setOrigin(0.5);
        this.add.text(width / 2, height / 2 - 120, 'From: Human Resources', style).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 50, 'Effective immediately, your employment', style).setOrigin(0.5);
        this.add.text(width / 2, height / 2 - 20, 'is terminated due to:', style).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 30, '"Lack of Vital Signs"', { ...style, color: '#ff0000', fontSize: '20px' }).setOrigin(0.5);

        // Payout Notification
        this.add.text(width / 2, height / 2 + 80, `Death Benefit Payout: 5 Stocks`, { ...style, fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(width / 2, height / 2 + 100, `Total Vested Options: ${meta.currency}`, { ...style, fontSize: '14px', color: '#555' }).setOrigin(0.5);


        this.add.text(width / 2, height / 2 + 150, 'Please return all company property.', style).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 200, '[CLICK TO REAPPLY]', { ...style, fontSize: '14px', color: '#555555' }).setOrigin(0.5);

        // Input
        this.input.on('pointerdown', () => {
            this.scene.start('StartScreen');
        });
    }
}
