import Phaser from 'phaser';
import { GameState } from '../types/World';
import { MapGenerator } from '../systems/MapGenerator';
import { UIManager } from '../ui/UIManager';
import { EnemyAI } from '../systems/EnemyAI';
import { InteractionSystem } from '../systems/InteractionSystem';

export class GameScene extends Phaser.Scene {
    private gameState!: GameState;
    private tileSize: number = 32;
    private mapGroup!: Phaser.GameObjects.Group;
    private player!: Phaser.GameObjects.Sprite;
    private uiManager!: UIManager;
    private turnLock: boolean = false;

    constructor() {
        super('GameScene');
        // Expose for debugging
        (window as any).gameScene = this;
    }

    create() {
        // Initialize UI
        this.uiManager = UIManager.getInstance();
        this.uiManager.log('Game Started on Floor 1. Objective: Find the Elevator.');

        // Initialize Map
        const generator = new MapGenerator(9, 9); // Updated to 9x9
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
                d: Phaser.Input.Keyboard.KeyCodes.D,
                space: Phaser.Input.Keyboard.KeyCodes.SPACE
            });

            this.input.keyboard.on('keydown', this.handleInput, this);
        }

        this.cameras.main.setBackgroundColor('#111');
        this.cameras.main.setScroll(-224, -124);
    }

    private updateUI() {
        this.uiManager.updateStats(this.gameState.hp, 100, this.gameState.burnout);
    }

    private renderRoom() {
        this.mapGroup.clear(true, true);
        this.player = undefined as any;

        const room = this.gameState.worldMap[this.gameState.currentRoomId];
        if (!room) return;

        // Render Tiles
        for (let y = 0; y < 11; y++) {
            for (let x = 0; x < 11; x++) {
                const cell = room.collision_map[y][x];
                const texture = cell === 1 ? 'wall' : 'floor';
                const tile = this.mapGroup.create(x * this.tileSize, y * this.tileSize, texture).setOrigin(0);
                if (cell === 1) tile.setTint(0x888888);
            }
        }

        // Render Objects
        room.objects.forEach(obj => {
            this.mapGroup.create(obj.x * this.tileSize, obj.y * this.tileSize, obj.sprite_key).setOrigin(0);
        });

        // Render Enemies
        room.enemies.forEach(enemy => {
            if (enemy.hp > 0) {
                this.mapGroup.create(enemy.x * this.tileSize, enemy.y * this.tileSize, enemy.type).setOrigin(0);
            }
        });

        // Player
        if (!this.player || !this.player.active) {
            this.player = this.add.sprite(
                this.gameState.playerX * this.tileSize,
                this.gameState.playerY * this.tileSize,
                'player'
            ).setOrigin(0);
            this.player.setDepth(10);
        } else {
            this.player.setPosition(
                this.gameState.playerX * this.tileSize,
                this.gameState.playerY * this.tileSize
            );
        }
    }

    // Phase 1: Input Validation
    private handleInput(event: KeyboardEvent) {
        if (this.turnLock || this.gameState.hp <= 0) return;

        let dx = 0;
        let dy = 0;
        const isSprint = event.shiftKey; // Check for sprint

        switch (event.code) {
            case 'ArrowUp': case 'KeyW': dy = -1; break;
            case 'ArrowDown': case 'KeyS': dy = 1; break;
            case 'ArrowLeft': case 'KeyA': dx = -1; break;
            case 'ArrowRight': case 'KeyD': dx = 1; break;
            case 'Space':
                this.executePhase3_World();
                return;
            default: return;
        }

        const targetX = this.gameState.playerX + dx;
        const targetY = this.gameState.playerY + dy;

        // Transition Check
        if (targetX < 0 || targetX > 10 || targetY < 0 || targetY > 10) {
            this.tryRoomTransition(dx, dy);
            return;
        }

        const room = this.gameState.worldMap[this.gameState.currentRoomId];
        // Wall Check
        if (room.collision_map[targetY][targetX] === 1) {
            this.uiManager.log("Bonk! That's a wall.");
            // Bump logic (maybe small sound/shake)
            return;
        }

        // Enemy Collision (Combat)
        const enemy = room.enemies.find(e => e.x === targetX && e.y === targetY && e.hp > 0);
        if (enemy) {
            this.executeCombat(enemy);
            this.executePhase3_World();
            return;
        }

        // Object Bump (Interact or Move Block)
        const blocked = InteractionSystem.handleBump(this.gameState, targetX, targetY, (msg) => this.uiManager.log(msg));
        if (blocked) {
            this.renderRoom(); // Updates if item picked up
            this.executePhase3_World();
            return;
        }

        // If not blocked, proceed to Phase 2
        this.executePhase2_Player(dx, dy, isSprint);
    }

    // Phase 2: Player Execution
    private executePhase2_Player(dx: number, dy: number, isSprint: boolean) {
        this.gameState.playerX += dx;
        this.gameState.playerY += dy;

        // Burnout Logic (Sprint)
        if (isSprint) {
            this.gameState.burnout = Math.min(100, this.gameState.burnout + 10);
            this.uiManager.log("Sprinted! Burnout +10.");
        }

        this.updatePlayerSprite();

        // Trigger Tile Enters? (Traps etc)

        this.executePhase3_World();
    }

    private executeCombat(enemy: any) {
        // Player Attacking Enemy
        const damage = 5; // Base weapon damage
        enemy.hp -= damage;
        this.uiManager.log(`You hit the ${enemy.type} for ${damage} dmg.`);
        if (enemy.hp <= 0) {
            this.uiManager.log(`${enemy.type} defeated!`);
        }
        // Animation bump?
        this.renderRoom();
    }

    private updatePlayerSprite() {
        this.player.setPosition(this.gameState.playerX * this.tileSize, this.gameState.playerY * this.tileSize);
    }

    // Phase 3: World Execution (The Tick)
    private executePhase3_World() {
        this.turnLock = true;

        // Enemy Moves
        EnemyAI.processTurn(this.gameState, (msg) => this.uiManager.log(msg));

        // Re-render
        this.renderRoom();
        this.updateUI();

        this.executePhase4_Cleanup();
    }

    // Phase 4: Cleanup & Persist
    private executePhase4_Cleanup() {
        // Death Check
        if (this.gameState.hp <= 0) {
            this.uiManager.log("CRITICAL FAILURE. PERFORMANCE REVIEW: TERMINATED.");
            this.cameras.main.fade(1000, 0, 0, 0);
            return; // Game Over
        }

        // Persist (Mock)
        // localStorage.setItem('savegame', JSON.stringify(this.gameState));

        this.turnLock = false; // Unlock input
    }

    private tryRoomTransition(dx: number, dy: number) {
        const [currX, currY] = this.gameState.currentRoomId.split('_').map(Number);
        const newRoomId = `${currX + dx}_${currY + dy}`;

        if (this.gameState.worldMap[newRoomId]) {
            this.gameState.currentRoomId = newRoomId;
            this.uiManager.log(`Floor Transition -> ${newRoomId}`);

            if (dx === 1) this.gameState.playerX = 0;
            if (dx === -1) this.gameState.playerX = 10;
            if (dy === 1) this.gameState.playerY = 0;
            if (dy === -1) this.gameState.playerY = 10;

            this.renderRoom();
            this.updateUI();
        } else {
            this.uiManager.log("Restricted Area.");
        }
    }
}
