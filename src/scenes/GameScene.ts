import Phaser from 'phaser';
import { GameState } from '../types/World';
import { MapGenerator } from '../systems/MapGenerator';
import { UIManager } from '../ui/UIManager';
import { EnemyAI } from '../systems/EnemyAI';
import { InteractionSystem } from '../systems/InteractionSystem';
import { EventManager, GameEvents } from '../systems/EventManager';
import { AudioManager } from '../systems/AudioManager';
import { DamageText } from '../ui/DamageText';
import { SaveManager } from '../systems/SaveManager';

export class GameScene extends Phaser.Scene {
    private gameState!: GameState;
    private tileSize: number = 32;
    private worldWidth: number = 9; // Number of Rooms Wide
    private worldHeight: number = 9;
    private readonly ROOM_SIZE: number = 11; // Tiles per Room
    private mapGroup!: Phaser.GameObjects.Group;
    private player!: Phaser.GameObjects.Sprite;
    private uiManager!: UIManager;
    private audioManager!: AudioManager;
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
        // Initialize Audio
        this.audioManager = AudioManager.getInstance();
        // this.audioManager.play('bgm');

        // Initialize UI
        this.uiManager = UIManager.getInstance();
        this.uiManager.onItemClick = this.handleItemUse.bind(this);
        const macguffin = this.registry.get('macguffin') || 'Golden Stapler';
        EventManager.emit(GameEvents.LOG_MESSAGE, `Game Started on Floor 1. Objective: Find the ${macguffin}.`);

        // Event Listeners
        EventManager.on(GameEvents.DAMAGE_DEALT, (data: any) => {
            // Convert grid to world
            const wx = data.x * this.tileSize + this.tileSize / 2; // Center
            const wy = data.y * this.tileSize;

            new DamageText(this, wx, wy, data.damage, data.isPlayer ? '#ff0000' : '#ffffff');

            this.audioManager.play('hit');
            this.cameras.main.shake(100, 0.005); // Subtle shake
        });

        // Initialize Map
        const shouldLoad = this.registry.get('loadGame');

        if (shouldLoad) {
            const loadedState = SaveManager.loadGame();
            if (loadedState) {
                this.gameState = loadedState;
                EventManager.emit(GameEvents.LOG_MESSAGE, "Game Loaded. Welcome back.");
            } else {
                // Fallback if load fails
                this.generateNewFloor(1);
            }
        } else {
            this.generateNewFloor(1);
        }

        // Apply Logic for Grid Size based on active gameState
        // If we loaded, we need to deduce size from worldMap (or store it in GameState? Deduced is fine for now)
        // Or better: Re-calculate based on floor logic.

        // Wait, if we load, we might be mid-run.
        // Let's ensure mapWidth/Height are set correctly.
        this.setMapDimensions(this.gameState.floor || 1);

        // Init Minimap UI -- This uses WORLD dimensions
        this.uiManager.initMinimap(this.worldWidth, this.worldHeight);

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

    private setMapDimensions(floor: number) {
        if (floor === 1) {
            this.worldWidth = 5;
            this.worldHeight = 5;
        } else if (floor === 2) {
            this.worldWidth = 7;
            this.worldHeight = 7;
        } else {
            this.worldWidth = 9;
            this.worldHeight = 9;
        }
        // Safety clamp?
        this.worldWidth = Math.max(5, Math.min(15, this.worldWidth));
        this.worldHeight = Math.max(5, Math.min(15, this.worldHeight));
    }

    private generateNewFloor(floor: number) {
        this.setMapDimensions(floor);
        const generator = new MapGenerator(this.worldWidth, this.worldHeight);
        this.gameState = generator.generateWorld();
        this.gameState.floor = floor; // Ensure floor is tracked
    }

    private resize(gameSize: Phaser.Structs.Size) {
        this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
        this.updateCamera();
    }

    private updateCamera() {
        // Center the grid (Room Size, not World Size)
        const roomPx = this.ROOM_SIZE * this.tileSize;

        // Zoom to fit? Or just center?
        this.cameras.main.centerOn(roomPx / 2, roomPx / 2);

        // Calculate zoom to fit nicely
        const zoomX = this.cameras.main.width / (roomPx + 100);
        const zoomY = this.cameras.main.height / (roomPx + 100);
        const zoom = Math.min(zoomX, zoomY, 2); // Max zoom 2x

        this.cameras.main.setZoom(Math.max(1, zoom));
    }

    private updateUI() {
        EventManager.emit(GameEvents.STATS_CHANGE, {
            hp: this.gameState.hp,
            maxHp: this.gameState.maxHp,
            burnout: this.gameState.burnout,
            credits: this.gameState.credits
        });
        EventManager.emit(GameEvents.MINIMAP_UPDATE, {
            visited: this.gameState.visited_rooms,
            current: this.gameState.currentRoomId
        });
        EventManager.emit(GameEvents.INVENTORY_UPDATE, {
            inventory: this.gameState.inventory
        });
    }

    private tryRoomTransition(dx: number, dy: number) {
        const [currX, currY] = this.gameState.currentRoomId.split('_').map(Number);
        const newRoomId = `${currX + dx}_${currY + dy}`;

        if (this.gameState.worldMap[newRoomId]) {
            this.gameState.currentRoomId = newRoomId;
            EventManager.emit(GameEvents.LOG_MESSAGE, `Floor Transition -> ${newRoomId}`);

            // Update Visited List
            if (!this.gameState.visited_rooms.includes(newRoomId)) {
                this.gameState.visited_rooms.push(newRoomId);
            }

            if (dx === 1) this.gameState.playerX = 0;
            if (dx === -1) this.gameState.playerX = this.ROOM_SIZE - 1;
            if (dy === 1) this.gameState.playerY = 0;
            if (dy === -1) this.gameState.playerY = this.ROOM_SIZE - 1;

            this.renderRoom();
            this.updatePlayerSprite(); // Ensure sprite moves to new entry point
            this.updateUI();
        } else {
            EventManager.emit(GameEvents.LOG_MESSAGE, "Restricted Area.");
        }
    }

    private renderRoom() {
        this.mapGroup.clear(true, true);

        const room = this.gameState.worldMap[this.gameState.currentRoomId];
        if (!room) return;

        // Render Tiles
        for (let y = 0; y < this.ROOM_SIZE; y++) {
            for (let x = 0; x < this.ROOM_SIZE; x++) {
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
                const spriteX = enemy.x * this.tileSize;
                const spriteY = enemy.y * this.tileSize;

                const emoji = this.getEmoji(enemy.type);
                if (emoji) {
                    const text = this.add.text(spriteX + 16, spriteY + 16, emoji, { fontSize: '24px' }).setOrigin(0.5);
                    text.name = enemy.id;
                    this.mapGroup.add(text);
                } else {
                    const sprite = this.mapGroup.create(spriteX, spriteY, enemy.type).setOrigin(0);
                    sprite.name = enemy.id;
                }

                // Telegraphing / Threat Indicator
                if (EnemyAI.isThreatening(enemy, this.gameState, room)) {
                    const warning = this.add.text(spriteX + 16, spriteY - 10, '!', {
                        fontSize: '20px',
                        color: '#ff0000',
                        fontStyle: 'bold',
                        stroke: '#ffffff',
                        strokeThickness: 3
                    }).setOrigin(0.5);

                    // Bobbing animation
                    this.tweens.add({
                        targets: warning,
                        y: spriteY - 14,
                        duration: 500,
                        yoyo: true,
                        repeat: -1
                    });

                    this.mapGroup.add(warning);
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
        if (targetX < 0 || targetX >= this.ROOM_SIZE || targetY < 0 || targetY >= this.ROOM_SIZE) {
            this.tryRoomTransition(dx, dy);
            return;
        }

        const room = this.gameState.worldMap[this.gameState.currentRoomId];
        // Wall/Window Check
        const cell = room.collision_map[targetY][targetX];
        if (cell === 1 || cell === 2) {
            EventManager.emit(GameEvents.LOG_MESSAGE, cell === 2 ? "A nice view of the void." : "Bonk! That's a wall.");
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
            (msg) => EventManager.emit(GameEvents.LOG_MESSAGE, msg),
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
            EventManager.emit(GameEvents.LOG_MESSAGE, "Sprinted! Burnout +10.");
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
        EventManager.emit(GameEvents.LOG_MESSAGE, `You hit the ${enemy.type} for ${damage} dmg.`);
        if (enemy.hp <= 0) {
            const room = this.gameState.worldMap[this.gameState.currentRoomId];
            InteractionSystem.handleDefeat(this.gameState, enemy, (msg) => EventManager.emit(GameEvents.LOG_MESSAGE, msg), room);
        }
        // Animation bump?
        this.renderRoom();
    }



    // Phase 3: World Execution (The Tick)
    private executePhase3_World() {
        this.turnLock = true;

        // Enemy Moves
        EnemyAI.processTurn(this.gameState, (msg) => EventManager.emit(GameEvents.LOG_MESSAGE, msg), (type, x, y, tx, ty) => {
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
            EventManager.emit(GameEvents.LOG_MESSAGE, "CRITICAL FAILURE. PERFORMANCE REVIEW: TERMINATED.");
            this.cameras.main.fadeOut(1000, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('GameOverScene');
            });
            return; // Game Over
        }

        // Persist
        SaveManager.saveGame(this.gameState);

        this.turnLock = false; // Unlock input
    }

    private flashEnemyDamage(enemyId: string) {
        this.mapGroup.getChildren().forEach((child: any) => {
            if (child.name === enemyId) {
                // Flash White
                child.setTintFill(0xffffff);
                this.time.delayedCall(100, () => {
                    child.clearTint();
                });

                // Shake?
                // Scale punch?
                this.tweens.add({
                    targets: child,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 50,
                    yoyo: true,
                    ease: 'Quad.easeInOut'
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

        if (x < 0 || x >= this.ROOM_SIZE || y < 0 || y >= this.ROOM_SIZE) return;

        // Check Range (Stapler Ranged Attack)
        if (this.targetingItem === 'stapler' || this.targetingItem === 'weapon') {
            const output = InteractionSystem.handleRangedAttack(
                this.gameState,
                x,
                y,
                this.targetingItem,
                (msg) => EventManager.emit(GameEvents.LOG_MESSAGE, msg),
                (id) => this.flashEnemyDamage(id)
            );

            if (output.success) {
                // Consume turn?
                this.targetingItem = null;
                EventManager.emit(GameEvents.LOG_MESSAGE, "Targeting Disengaged.");
                this.executePhase3_World();
            }
        }
    }

    private handleItemUse(itemType: string, index: number) {
        if (this.turnLock || this.gameState.hp <= 0) return;

        // Toggle Targeting
        if (itemType === 'stapler' || itemType === 'weapon') {
            if (this.targetingItem === itemType) {
                this.targetingItem = null;
                EventManager.emit(GameEvents.LOG_MESSAGE, "Targeting Cancelled.");
            } else {
                this.targetingItem = itemType;
                EventManager.emit(GameEvents.LOG_MESSAGE, `Aiming ${itemType}... Click a target!`);
            }
            return;
        }

        let used = false;
        let consumed = false;

        const item = this.gameState.inventory[index];
        if (!item) return;

        if (itemType === 'consumable' || itemType === 'coffee') {
            this.gameState.hp = Math.min(this.gameState.maxHp, this.gameState.hp + 5);
            this.gameState.burnout = Math.max(0, this.gameState.burnout - 5);
            EventManager.emit(GameEvents.LOG_MESSAGE, "Drank Coffee. HP +5, Burnout -5.");
            used = true;
            consumed = true;
        } else if (itemType === 'granola_bar') {
            this.gameState.hp = Math.min(this.gameState.maxHp, this.gameState.hp + 2);
            this.gameState.burnout = Math.max(0, this.gameState.burnout - 2);
            EventManager.emit(GameEvents.LOG_MESSAGE, "Ate Granola. It's dry. HP +2, Burnout -2.");
            used = true;
            consumed = true;
        } else if (itemType === 'mint') {
            this.gameState.burnout = Math.max(0, this.gameState.burnout - 10);
            EventManager.emit(GameEvents.LOG_MESSAGE, "Fresh Mint! Burnout -10.");
            used = true;
            consumed = true;
        } else if (itemType === 'vitamin_pill') {
            this.gameState.hp = Math.min(this.gameState.maxHp, this.gameState.hp + 10);
            EventManager.emit(GameEvents.LOG_MESSAGE, "Vitamin C Boost! HP +10.");
            used = true;
            consumed = true;
        } else if (itemType === 'id_card') {
            EventManager.emit(GameEvents.LOG_MESSAGE, "Access Card. Use on Barriers automatically.");
        } else {
            EventManager.emit(GameEvents.LOG_MESSAGE, `You examine the ${item.name}. It seems corporate.`);
        }

        if (used) {
            if (consumed) {
                // Remove 1 instance
                this.gameState.inventory.splice(index, 1);
            }
            this.updateUI();
            this.executePhase3_World();
        }
    }

    private handleWin() {
        const nextFloor = (this.gameState.floor || 1) + 1;

        EventManager.emit(GameEvents.LOG_MESSAGE, `PROMOTION SECURED! Assessing Floor ${nextFloor}...`);

        // Prevent movement
        this.turnLock = true;

        this.cameras.main.fade(2000, 255, 255, 255, false, (_camera: any, progress: number) => {
            if (progress === 1) {
                // Update State for Next Run
                this.gameState.floor = nextFloor;

                // Heal Player?
                this.gameState.hp = this.gameState.maxHp;

                // Keep Items? Yes.

                // Clear map to force regeneration
                // We're about to reload, so we need to save the "Transition State"
                // Actually, simplest way: Save the core stats, but NOT the map.
                // Or: Save everything, but set a flag 'generateNewMap' in registry?

                // Better: Just save the stats we want to keep, and let GameScene logic handle "New Floor" generation.
                // But SaveManager saves the WHOLE state.

                // Logic:
                // 1. Update gameState.floor
                // 2. Clear worldMap (empty object) or flag it?
                // 3. Save
                // 4. StartScene -> Continue -> GameScene Checks Floor -> Generates New Map.

                // Let's modify SaveManager or just hack it here.
                // Resetting worldMap here is bold.
                // But GameScene.create() checks `SaveManager.loadGame()`.
                // If we save with the old map, it will load the old map.
                // We need to signal "Generate New Map".

                // Hack: Set worldMap to empty?
                // The `loadGame` logic in `create` just restores state.
                // We need a specific check: "Is Current Room Valid?"
                // OR: Just clear the save and start fresh with carry-over stats?
                // Let's go with: Modify `gameState` to have a 'clean' map state, Save, then Reload.

                // Actually, `generateNewFloor` in `create` is only called if NO save exists (or new game).
                // If we load a save, we use that map.
                // So we MUST overwrite the map in the save file with a new one OR delete the map data.

                // Let's force a new generation right now, THEN save?
                // Yes. Generate Next Floor immediately.
                this.generateNewFloor(nextFloor);

                // Place player at Start (normally 5,5 or random edge)
                // MapGenerator returns a fresh state. 
                // We should merge it with our player stats (Inventory, HP).
                // const freshState = this.gameState; // Unused variable removed.

                // Restore carry-over stats
                // freshState.inventory = ... (Wait, generateNewFloor overwrites this.gameState entirely)
                // We need to preserve stats.

                const keptInventory = this.gameState.inventory;
                const keptCredits = this.gameState.credits;
                const keptMaxHp = this.gameState.maxHp; // Maybe +Upgrades?
                const keptHp = this.gameState.maxHp; // Full Heal

                // Re-run generation to be safe/clean
                this.generateNewFloor(nextFloor);

                // Re-apply carry-overs
                this.gameState.inventory = keptInventory;
                this.gameState.credits = keptCredits;
                this.gameState.maxHp = keptMaxHp;
                this.gameState.hp = keptHp;

                // Save this valid start-of-floor state
                SaveManager.saveGame(this.gameState);

                // Restart Scene to render it
                this.scene.restart();
            }
        });
    }
}
