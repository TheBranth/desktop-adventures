import Phaser from 'phaser';
import { GameState } from '../types/World';
import { MapGenerator } from '../systems/MapGenerator';
import { UIManager } from '../ui/UIManager';

export class GameScene extends Phaser.Scene {
    private gameState!: GameState;
    private tileSize: number = 32;
    private mapGroup!: Phaser.GameObjects.Group;
    private player!: Phaser.GameObjects.Sprite;
    private uiManager!: UIManager;
    // private inputKeys!: any;

    constructor() {
        super('GameScene');
    }

    create() {
        // Initialize UI
        this.uiManager = UIManager.getInstance();
        this.uiManager.log('Game Started on Floor 1.');

        // Initialize Map
        const generator = new MapGenerator(10, 10);
        this.gameState = generator.generateWorld();

        // Sync initial stats
        this.updateUI();

        // Setup Groups
        this.mapGroup = this.add.group();

        // Render Initial Room
        this.renderRoom();

        // Setup Input
        if (this.input && this.input.keyboard) {
            this.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.UP,
                down: Phaser.Input.Keyboard.KeyCodes.DOWN,
                left: Phaser.Input.Keyboard.KeyCodes.LEFT,
                right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
                w: Phaser.Input.Keyboard.KeyCodes.W,
                s: Phaser.Input.Keyboard.KeyCodes.S,
                a: Phaser.Input.Keyboard.KeyCodes.A,
                d: Phaser.Input.Keyboard.KeyCodes.D
            });

            // Grid-based movement listeners
            this.input.keyboard.on('keydown', this.handleInput, this);
        }

        // Camera Setup
        this.cameras.main.setBackgroundColor('#111');

        // Center the 11x11 grid (32px * 11 = 352px)
        // Screen is 800x600. Center is 400, 300.
        // Top-left of grid should be: 400 - (352/2) = 224, 300 - (352/2) = 124
        this.cameras.main.setScroll(-224, -124);
    }

    private updateUI() {
        this.uiManager.updateStats(this.gameState.hp, 100, this.gameState.burnout); // MaxHP hardcoded to 100 for now
    }

    private renderRoom() {
        this.mapGroup.clear(true, true);

        const room = this.gameState.worldMap[this.gameState.currentRoomId];
        if (!room) {
            console.error('Room not found:', this.gameState.currentRoomId);
            return;
        }

        // Render Tiles
        for (let y = 0; y < 11; y++) {
            for (let x = 0; x < 11; x++) {
                const cell = room.collision_map[y][x];
                const texture = cell === 1 ? 'wall' : 'floor';
                this.mapGroup.create(x * this.tileSize, y * this.tileSize, texture).setOrigin(0);
            }
        }

        // Render Objects
        room.objects.forEach(obj => {
            this.mapGroup.create(obj.x * this.tileSize, obj.y * this.tileSize, obj.sprite_key).setOrigin(0);
        });

        // Initialize Player Sprite if not exists
        if (!this.player) {
            this.player = this.add.sprite(
                this.gameState.playerX * this.tileSize,
                this.gameState.playerY * this.tileSize,
                'player'
            ).setOrigin(0);
            this.player.setDepth(10); // Above tiles
        } else {
            // Just update position on room transition
            this.player.setPosition(
                this.gameState.playerX * this.tileSize,
                this.gameState.playerY * this.tileSize
            );
        }
    }

    private handleInput(event: KeyboardEvent) {
        if (this.scene.isPaused('GameScene')) return;

        let dx = 0;
        let dy = 0;

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                dy = -1;
                break;
            case 'ArrowDown':
            case 'KeyS':
                dy = 1;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                dx = -1;
                break;
            case 'ArrowRight':
            case 'KeyD':
                dx = 1;
                break;
            default:
                return; // Ignore other keys
        }

        this.movePlayer(dx, dy);
    }

    private movePlayer(dx: number, dy: number) {
        const targetX = this.gameState.playerX + dx;
        const targetY = this.gameState.playerY + dy;

        // Check Room Bounds & Transitions
        if (targetX < 0 || targetX > 10 || targetY < 0 || targetY > 10) {
            this.tryRoomTransition(dx, dy);
            return;
        }

        // Check Collision
        const room = this.gameState.worldMap[this.gameState.currentRoomId];
        if (room.collision_map[targetY][targetX] === 1) {
            this.uiManager.log("Bonk! That's a wall.");
            return;
        }

        // Move
        this.gameState.playerX = targetX;
        this.gameState.playerY = targetY;
        this.player.setPosition(targetX * this.tileSize, targetY * this.tileSize);

        // Update Burnout (Mock)
        this.gameState.burnout = Math.min(100, this.gameState.burnout + 1);
        this.updateUI();

        // TODO: Interaction Check
        // TODO: Trigger Turn Logic (Enemy Moves)
    }

    private tryRoomTransition(dx: number, dy: number) {
        const [currX, currY] = this.gameState.currentRoomId.split('_').map(Number);
        const newRoomId = `${currX + dx}_${currY + dy}`;

        if (this.gameState.worldMap[newRoomId]) {
            // Valid Transition
            this.gameState.currentRoomId = newRoomId;
            this.uiManager.log(`Moved to Room ${newRoomId}`);

            // Teleport Player to opposite side
            if (dx === 1) this.gameState.playerX = 0;
            if (dx === -1) this.gameState.playerX = 10;
            if (dy === 1) this.gameState.playerY = 0;
            if (dy === -1) this.gameState.playerY = 10;

            this.renderRoom();
            this.updateUI();
        } else {
            this.uiManager.log("There is no door there.");
        }
    }
}
