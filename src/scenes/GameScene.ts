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

    // Animation State
    private playerState: 'IDLE' | 'MOVE' | 'ATTACK' = 'IDLE';
    private stateTimer: number = 0;
    private moveToggle: boolean = false; // For L/R foot

    constructor() {
        super('GameScene');
        // Expose for debugging
        (window as any).gameScene = this;
    }

    create() {
        // Initialize UI
        this.uiManager = UIManager.getInstance();
        this.uiManager.onItemClick = this.handleItemUse.bind(this);
        const macguffin = this.registry.get('macguffin') || 'Golden Stapler';
        this.uiManager.log(`Game Started on Floor 1. Objective: Find the ${macguffin}.`);

        // Initialize Map
        const generator = new MapGenerator(9, 9); // Updated to 9x9
        this.gameState = generator.generateWorld();

        // Sync initial stats
        this.updateUI();

        // Setup Groups
        this.mapGroup = this.add.group();

        // Create Player
        this.player = this.add.sprite(0, 0, 'protagonist').setOrigin(0);
        this.player.setDepth(100);
        this.updatePlayerSprite(); // Snap to grid immediately

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

        // Mouse Input
        this.input.on('pointerdown', this.handlePointerDown, this);

        this.cameras.main.setBackgroundColor('#111');

        // Initial Camera Setup
        this.updateCamera();

        // Handle Resize
        this.scale.on('resize', this.resize, this);
    }

    private resize(gameSize: Phaser.Structs.Size) {
        this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
        this.updateCamera();
    }

    private updateCamera() {
        // Center the 11x11 grid (352x352 px)
        const mapWidth = 11 * this.tileSize;
        const mapHeight = 11 * this.tileSize;

        // Zoom to fit? Or just center?
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);

        // Calculate zoom to fit nicely
        const zoomX = this.cameras.main.width / (mapWidth + 100);
        const zoomY = this.cameras.main.height / (mapHeight + 100);
        const zoom = Math.min(zoomX, zoomY, 2); // Max zoom 2x

        this.cameras.main.setZoom(Math.max(1, zoom));
    }

    private updateUI() {
        this.uiManager.updateStats(this.gameState.hp, this.gameState.maxHp, this.gameState.burnout, this.gameState.credits); // Fixed maxHp arg
        this.uiManager.updateMinimap(this.gameState.visited_rooms, this.gameState.currentRoomId);
        this.uiManager.updateInventory(this.gameState.inventory);
    }

    private tryRoomTransition(dx: number, dy: number) {
        const [currX, currY] = this.gameState.currentRoomId.split('_').map(Number);
        const newRoomId = `${currX + dx}_${currY + dy}`;

        if (this.gameState.worldMap[newRoomId]) {
            this.gameState.currentRoomId = newRoomId;
            this.uiManager.log(`Floor Transition -> ${newRoomId}`);

            // Update Visited List
            if (!this.gameState.visited_rooms.includes(newRoomId)) {
                this.gameState.visited_rooms.push(newRoomId);
            }

            if (dx === 1) this.gameState.playerX = 0;
            if (dx === -1) this.gameState.playerX = 10;
            if (dy === 1) this.gameState.playerY = 0;
            if (dy === -1) this.gameState.playerY = 10;

            this.renderRoom();
            this.updatePlayerSprite(); // Ensure sprite moves to new entry point
            this.updateUI();
        } else {
            this.uiManager.log("Restricted Area.");
        }
    }

    private renderRoom() {
        this.mapGroup.clear(true, true);

        const room = this.gameState.worldMap[this.gameState.currentRoomId];
        if (!room) return;

        // Render Tiles
        for (let y = 0; y < 11; y++) {
            for (let x = 0; x < 11; x++) {
                const cell = room.collision_map[y][x];
                let texture = 'floor';
                if (cell === 1) texture = 'wall';
                else if (cell === 2) texture = 'window';

                const tile = this.mapGroup.create(x * this.tileSize, y * this.tileSize, texture).setOrigin(0);

                // Dim walls/windows slightly for atmosphere?
                if (cell === 1 || cell === 2) tile.setTint(0xCCCCCC);
            }
        }

        // Render Objects
        room.objects.forEach(obj => {
            const emoji = this.getEmoji(obj.sprite_key);
            if (emoji) {
                const text = this.add.text(obj.x * this.tileSize + 16, obj.y * this.tileSize + 16, emoji, { fontSize: '24px' }).setOrigin(0.5);
                this.mapGroup.add(text);
            } else {
                this.mapGroup.create(obj.x * this.tileSize, obj.y * this.tileSize, obj.sprite_key).setOrigin(0);
            }
        });

        // Render Enemies
        room.enemies.forEach(enemy => {
            if (enemy.hp > 0) {
                const emoji = this.getEmoji(enemy.type);
                if (emoji) {
                    const text = this.add.text(enemy.x * this.tileSize + 16, enemy.y * this.tileSize + 16, emoji, { fontSize: '24px' }).setOrigin(0.5);
                    text.name = enemy.id;
                    this.mapGroup.add(text);
                } else {
                    const sprite = this.mapGroup.create(enemy.x * this.tileSize, enemy.y * this.tileSize, enemy.type).setOrigin(0);
                    sprite.name = enemy.id;
                }
            }
        });

        // Player logic continues...
        // ...
    }

    // ... (re-find Player Code block if needed, but the chunk above ends before it ideally) ...
    // Wait, replacing lines 134-167 to include window logic.

    private getEmoji(key: string): string | null {
        switch (key) {
            case 'elevator': return '🛗';
            default: return null;
        }
    }

    private updatePlayerSprite() {
        if (!this.player) return;

        // Align sprite to grid
        if (this.player.texture.key === 'chars') {
            this.player.setPosition(
                (this.gameState.playerX * this.tileSize) + 16,
                (this.gameState.playerY * this.tileSize) + 32
            );
        } else {
            // SVG / Fallback (Origin 0,0)
            this.player.setPosition(
                this.gameState.playerX * this.tileSize,
                this.gameState.playerY * this.tileSize
            );
        }

        // Ensure Player is always on top
        this.player.setDepth(100);
        this.player.setVisible(true); // Redundant but safe
        console.log(`Debug Player: [${this.gameState.playerX},${this.gameState.playerY}] -> (${this.player.x},${this.player.y})`);
    }

    update(time: number, delta: number) {
        if (!this.player) return;

        // Reset to IDLE if timer expires
        if (this.stateTimer > 0) {
            this.stateTimer -= delta;
            if (this.stateTimer <= 0) {
                this.playerState = 'IDLE';
            }
        }

        // SVG Animation Logic
        if (this.player.texture.key === 'protagonist') {
            if (this.playerState === 'IDLE') {
                this.player.setFrame('idle');
            }
            return;
        }

        // Legacy Animation Logic
        if (this.playerState === 'IDLE' && this.player.texture.key === 'chars') {
            const frame = Math.floor(time / 500) % 2 === 0 ? 'idle_0' : 'idle_1';
            this.player.setFrame(frame);
        }
    }

    // ...

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
        // Wall/Window Check
        const cell = room.collision_map[targetY][targetX];
        if (cell === 1 || cell === 2) {
            this.uiManager.log(cell === 2 ? "A nice view of the void." : "Bonk! That's a wall.");
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
        const blocked = InteractionSystem.handleBump(
            this.gameState,
            targetX,
            targetY,
            (msg) => this.uiManager.log(msg),
            (id) => this.flashEnemyDamage(id),
            () => this.handleWin()
        );
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

        // Animation Triggers
        if (dx < 0) this.player.setFlipX(true);
        if (dx > 0) this.player.setFlipX(false);

        this.playerState = 'MOVE';
        this.stateTimer = 250; // Hold move frame for 250ms
        this.moveToggle = !this.moveToggle;
        this.player.setFrame(this.moveToggle ? 'move_0' : 'move_1');

        this.updatePlayerSprite();

        // Trigger Tile Enters? (Traps etc)

        this.executePhase3_World();
    }

    private executeCombat(enemy: any) {
        // Player Attacking Enemy

        // Animation
        this.playerState = 'ATTACK';
        this.stateTimer = 300;
        this.player.setFrame('attack_0');

        // Visual Shake
        this.cameras.main.shake(100, 0.005);

        const damage = 5; // Base weapon damage
        enemy.hp -= damage;
        this.uiManager.log(`You hit the ${enemy.type} for ${damage} dmg.`);
        if (enemy.hp <= 0) {
            const room = this.gameState.worldMap[this.gameState.currentRoomId];
            InteractionSystem.handleDefeat(this.gameState, enemy, (msg) => this.uiManager.log(msg), room);
        }
        // Animation bump?
        this.renderRoom();
    }



    // Phase 3: World Execution (The Tick)
    private executePhase3_World() {
        this.turnLock = true;

        // Enemy Moves
        EnemyAI.processTurn(this.gameState, (msg) => this.uiManager.log(msg), (type, x, y, tx, ty) => {
            this.handleEnemyFX(type, x, y, tx, ty);
        });

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

    private flashEnemyDamage(enemyId: string) {
        // Find sprite
        // Hacky: brute force find in group children
        this.mapGroup.getChildren().forEach((child: any) => {
            // We need to associate sprite with enemy ID. 
            // In renderRoom, we didn't name them. 
            // Better: Re-implement renderRoom to name sprites or store in a map.
            // For now, let's just check texture and position? No, id is safer.
            // Let's rely on checking `type` and approximate position?
            // Wait, we can set `.name = enemy.id` in renderRoom!
            if (child.name === enemyId) {
                this.tweens.add({
                    targets: child,
                    tint: 0xff0000,
                    duration: 100,
                    yoyo: true,
                    repeat: 1
                });
            }
        });
    }


    private handleEnemyFX(type: string, x: number, y: number, tx: number, ty: number) {
        if (type === 'projectile') {
            // Toner Blast
            const startX = (x * this.tileSize) + 16;
            const startY = (y * this.tileSize) + 16;
            const endX = (tx * this.tileSize) + 16;
            const endY = (ty * this.tileSize) + 16;

            const blob = this.add.circle(startX, startY, 6, 0x000000); // Black Toner
            blob.setDepth(200);

            this.tweens.add({
                targets: blob,
                x: endX,
                y: endY,
                duration: 200,
                onComplete: () => {
                    blob.destroy();
                    // Splash effect?
                    const splash = this.add.circle(endX, endY, 12, 0x000000);
                    splash.setDepth(199);
                    this.tweens.add({
                        targets: splash,
                        alpha: 0,
                        scale: 2,
                        duration: 300,
                        onComplete: () => splash.destroy()
                    });
                }
            });
        }
    }

    // Targeting State
    private targetingItem: string | null = null;

    // ... handleInput ...

    private handlePointerDown(pointer: Phaser.Input.Pointer) {
        if (this.turnLock || !this.targetingItem) return;

        // Convert to Grid Coords
        const x = Math.floor(pointer.worldX / this.tileSize);
        const y = Math.floor(pointer.worldY / this.tileSize);

        if (x < 0 || x > 10 || y < 0 || y > 10) return;

        // Check Range (Stapler Ranged Attack)
        if (this.targetingItem === 'stapler' || this.targetingItem === 'weapon') {
            const output = InteractionSystem.handleRangedAttack(
                this.gameState,
                x,
                y,
                this.targetingItem,
                (msg) => this.uiManager.log(msg),
                (id) => this.flashEnemyDamage(id)
            );

            if (output.success) {
                // Consume turn?
                this.targetingItem = null;
                this.uiManager.log("Targeting Disengaged.");
                this.executePhase3_World();
            }
        }
    }

    private handleItemUse(itemId: string, index: number) {
        if (this.turnLock || this.gameState.hp <= 0) return;

        // Toggle Targeting
        if (itemId === 'stapler' || itemId === 'weapon') {
            if (this.targetingItem === itemId) {
                this.targetingItem = null;
                this.uiManager.log("Targeting Cancelled.");
            } else {
                this.targetingItem = itemId;
                this.uiManager.log(`Aiming ${itemId}... Click a target!`);
            }
            return;
        }

        let used = false;
        if (itemId === 'consumable' || itemId === 'coffee') {
            this.gameState.hp = Math.min(this.gameState.maxHp, this.gameState.hp + 5);
            this.gameState.burnout = Math.max(0, this.gameState.burnout - 5);
            this.uiManager.log("Drank Coffee. HP +5, Burnout -5.");
            used = true;
        } else if (itemId === 'granola_bar') {
            this.gameState.hp = Math.min(this.gameState.maxHp, this.gameState.hp + 2);
            this.gameState.burnout = Math.max(0, this.gameState.burnout - 2);
            this.uiManager.log("Ate Granola. It's dry. HP +2, Burnout -2.");
            used = true;
        } else if (itemId === 'mint') {
            this.gameState.burnout = Math.max(0, this.gameState.burnout - 10);
            this.uiManager.log("Fresh Mint! Burnout -10.");
            used = true;
        } else if (itemId === 'vitamin_pill') {
            this.gameState.hp = Math.min(this.gameState.maxHp, this.gameState.hp + 10);
            this.uiManager.log("Vitamin C Boost! HP +10.");
            used = true;
        } else if (itemId === 'id_card') {
            this.uiManager.log("Access Card. Use on Barriers automatically.");
        } else {
            this.uiManager.log(`You examine the ${itemId}. It seems corporate.`);
        }

        if (used) {
            // Remove 1 instance
            this.gameState.inventory.splice(index, 1);
            this.updateUI();
            this.executePhase3_World();
        }
    }

    private handleWin() {
        this.uiManager.log("MISSION ACCOMPLISHED! PROMOTION SECURED!");
        this.cameras.main.fade(2000, 255, 255, 255, false, (_camera: any, progress: number) => {
            if (progress === 1) {
                this.scene.start('StartScreen');
            }
        });
        this.turnLock = true;
    }
}
