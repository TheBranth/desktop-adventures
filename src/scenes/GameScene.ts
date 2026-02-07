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
import { QuestManager } from '../systems/QuestManager';

export class GameScene extends Phaser.Scene {
    private gameState!: GameState;
    private tileSize: number = 32;
    private worldWidth: number = 9; // Number of Rooms Wide
    private worldHeight: number = 9;
    private readonly ROOM_SIZE: number = 11; // Tiles per Room
    private mapGroup!: Phaser.GameObjects.Group;
    private player!: Phaser.GameObjects.Sprite;
    // private cursors!: Phaser.Types.Input.Keyboard.CursorKeys; // Unused for now

    // Constants
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

    init(data: { floor?: number, existingState?: GameState, newFloor?: boolean }) {
        // If coming from Bodega, we might have existing state
        if (data.existingState) {
            this.gameState = data.existingState;

            if (data.newFloor) {
                // Generate Next Floor
                const generator = new MapGenerator(5, 5, this.gameState.tower_level);
                const newState = generator.generateWorld();

                this.gameState.worldMap = newState.worldMap;
                this.gameState.currentRoomId = newState.currentRoomId;
                this.gameState.playerX = 2;
                this.gameState.playerY = 2;
                this.gameState.objectiveComplete = false;
                this.gameState.visited_rooms = [newState.currentRoomId];

                // Auto-Heal a bit
                this.gameState.hp = Math.min(this.gameState.maxHp, this.gameState.hp + 20);
            }
        }
    }

    create() {
        // Initialize Audio
        this.audioManager = AudioManager.getInstance();
        // this.audioManager.play('bgm');

        // Initialize UI (Singleton)
        this.uiManager = UIManager.getInstance();
        this.uiManager.onItemClick = this.handleItemUse.bind(this);

        // Initialize Quest Manager
        QuestManager.getInstance().init(this.gameState);

        const macguffin = this.registry.get('macguffin') || 'Golden Stapler';
        EventManager.emit(GameEvents.LOG_MESSAGE, `Game Started/Resumed. Objective: Find the ${macguffin}.`);

        // Event Listeners
        EventManager.on(GameEvents.DAMAGE_DEALT, (data: any) => {
            const wx = data.x * this.tileSize + this.tileSize / 2;
            const wy = data.y * this.tileSize;
            new DamageText(this, wx, wy, data.damage, data.isPlayer ? '#ff0000' : '#ffffff');
            this.audioManager.play('hit');
            this.cameras.main.shake(100, 0.005);
        });

        // Initialize Map
        const shouldLoad = this.registry.get('loadGame');

        // Priority: 
        // 1. Passed State (from Bodega) - implicitly handled by init() assignment to this.gameState?
        //    But create() runs AFTER init(). so this.gameState might be set.
        // 2. Load Game (if requested)
        // 3. New Game

        if (this.gameState) {
            // We have state passed from Bodega.
            // But does it have a map?
            // If we just incremented floor, the map is likely old or empty.
            if (!this.gameState.worldMap || Object.keys(this.gameState.worldMap).length === 0 || this.gameState.floor !== 1) { // Hacky check
                // If we have state but need a NEW map for this floor:
                // We need to regenerate the map PART of the state.
                this.regenerateMapKeepStats(this.gameState.floor || 1);
            }
        } else if (shouldLoad) {
            const loadedState = SaveManager.loadGame();
            if (loadedState) {
                this.gameState = loadedState;
                EventManager.emit(GameEvents.LOG_MESSAGE, "Game Loaded. Welcome back.");
            } else {
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
                a: Phaser.Input.Keyboard.KeyCodes.A,
                s: Phaser.Input.Keyboard.KeyCodes.S,
                d: Phaser.Input.Keyboard.KeyCodes.D,
                space: Phaser.Input.Keyboard.KeyCodes.SPACE
            });

            this.input.keyboard.on('keydown', this.handleInput, this);
        }

        // Mouse Input (Targeting)
        this.input.on('pointerdown', this.handlePointerDown, this);

        // Mouse Input
        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (this.turnLock || this.gameState.hp <= 0) return;

            // Get Player Center relative to world
            const pX = this.player.x + (this.tileSize / 2);
            const pY = this.player.y + (this.tileSize / 2);

            // Pointer World Coords
            const tX = pointer.worldX;
            const tY = pointer.worldY;

            const dist = Phaser.Math.Distance.Between(pX, pY, tX, tY);

            // If tap is very close to player (e.g. on the player within 0.8 tile), Wait/Interact
            if (dist < this.tileSize * 0.8) {
                this.executePhase3_World(); // Wait
                return;
            }

            // Directional Logic
            const dx = tX - pX;
            const dy = tY - pY;

            // Determine primary axis
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal
                this.processMovement(Math.sign(dx), 0, false);
            } else {
                // Vertical
                this.processMovement(0, Math.sign(dy), false);
            }
        });

        document.body.classList.add('game-active');
        document.querySelectorAll<HTMLElement>('.mobile-hud').forEach(el => el.style.display = ''); // Reset inline style

        this.cameras.main.setBackgroundColor('#000000');

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

    private regenerateMapKeepStats(floor: number) {
        this.setMapDimensions(floor);
        const generator = new MapGenerator(this.worldWidth, this.worldHeight);

        // Generate FRESH state
        const newState = generator.generateWorld();

        // MERGE existing stats into new state
        // We keep: HP, MaxHP, Inventory, Credits, Burnout
        newState.hp = this.gameState.hp;
        newState.maxHp = this.gameState.maxHp;
        newState.inventory = this.gameState.inventory;
        newState.credits = this.gameState.credits;
        newState.burnout = this.gameState.burnout;
        newState.floor = floor;
        newState.visited_rooms = []; // Reset visited

        this.gameState = newState;
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
                else if (cell === 2) {
                    // Deterministic Random Window to avoid flickering on re-render
                    // Use simple hash of coordinates
                    const seed = (x * 7 + y * 13);
                    const variant = (seed % 3) + 1;
                    texture = `window_${variant}`;
                }

                const tile = this.mapGroup.create(x * this.tileSize, y * this.tileSize, texture).setOrigin(0);

                // Dim walls/windows slightly for atmosphere?
                if (cell === 1 || cell === 2) tile.setTint(0xCCCCCC);
            }
        }

        // Render Objects
        room.objects.forEach(obj => {
            this.mapGroup.create(obj.x * this.tileSize, obj.y * this.tileSize, obj.sprite_key).setOrigin(0);
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
    }

    // Player is rendered separately in updatePlayerSprite

    private getEmoji(key: string): string | null {
        switch (key) {
            case 'elevator': return '🛗';
            case 'door_secure': return '🔒';
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
            this.player.setOrigin(0, 0); // Reset origin
            this.player.setPosition(
                this.gameState.playerX * this.tileSize,
                this.gameState.playerY * this.tileSize
            );
        }

        // Ensure Player is always on top
        this.player.setDepth(100);
        this.player.setVisible(true);
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
        // ... (Cleaned up: remove redundant checks if processMovement handles them)
        if (this.turnLock || this.gameState.hp <= 0) return;

        let dx = 0;
        let dy = 0;
        const isSprint = event.shiftKey;

        switch (event.code) {
            case 'ArrowUp': case 'KeyW': dy = -1; break;
            case 'ArrowDown': case 'KeyS': dy = 1; break;
            case 'ArrowLeft': case 'KeyA': dx = -1; break;
            case 'ArrowRight': case 'KeyD': dx = 1; break;
            case 'Space':
                // Panic Mode / Wait
                this.executePhase3_World();
                return;
            default: return;
        }

        this.processMovement(dx, dy, isSprint);
    }

    private processMovement(dx: number, dy: number, isSprint: boolean) {
        if (this.gameState.hp <= 0) return;

        const targetX = this.gameState.playerX + dx;
        const targetY = this.gameState.playerY + dy;

        // Check Bump Interaction (Enemies / Objects)
        const bumped = InteractionSystem.handleBump(this.gameState, targetX, targetY, (msg) => {
            EventManager.emit(GameEvents.LOG_MESSAGE, msg);
        }, (id) => this.flashEnemyDamage(id), () => {
            // ON WIN (Elevator)
            EventManager.emit(GameEvents.LOG_MESSAGE, "Objective Complete. Going Up...");
            this.cameras.main.fadeOut(1000, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('BodegaScene', { gameState: this.gameState });
            });
        });

        if (bumped) {
            // Interaction happened, turn passes
            this.executePhase3_World();
            return;
        }

        // Room Transition Check
        const isDoorTile = (
            (targetX === 0 && targetY === 5) ||
            (targetX === 10 && targetY === 5) ||
            (targetX === 5 && targetY === 0) ||
            (targetX === 5 && targetY === 10)
        );

        if (isDoorTile || targetX < 0 || targetX >= this.ROOM_SIZE || targetY < 0 || targetY >= this.ROOM_SIZE) {
            this.tryRoomTransition(dx, dy);
            return;
        }

        // Wall/Window Check
        const room = this.gameState.worldMap[this.gameState.currentRoomId];
        // Ensure room exists (it should)
        if (room && room.collision_map && room.collision_map[targetY] && room.collision_map[targetY][targetX] !== undefined) {
            const cell = room.collision_map[targetY][targetX];
            if (cell === 1 || cell === 2) {
                EventManager.emit(GameEvents.LOG_MESSAGE, cell === 2 ? "A nice view of the void." : "Bonk! That's a wall.");
                return;
            }
        }

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




    // Public method for UI/Mobile Controls
    public playerWait() {
        if (this.turnLock || this.gameState.hp <= 0) return;
        EventManager.emit(GameEvents.LOG_MESSAGE, "Waiting...");
        this.executePhase3_World();
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
    private rangeOverlay: Phaser.GameObjects.Group | null = null;

    private renderRangeOverlay(range: number) {
        if (!this.rangeOverlay) {
            this.rangeOverlay = this.add.group();
        }
        this.rangeOverlay.clear(true, true);

        const px = this.gameState.playerX;
        const py = this.gameState.playerY;

        // Determine Range Type based on item
        const isNewspaper = this.targetingItem === 'weapon';

        for (let y = 0; y < this.ROOM_SIZE; y++) {
            for (let x = 0; x < this.ROOM_SIZE; x++) {
                let inRange = false;

                if (isNewspaper) {
                    // Chebyshev <= 1 (Adjacent + Diagonal)
                    const dx = Math.abs(x - px);
                    const dy = Math.abs(y - py);
                    if (dx <= 1 && dy <= 1 && (dx + dy > 0)) inRange = true;
                } else {
                    // Manhattan (Stapler)
                    const dist = Math.abs(x - px) + Math.abs(y - py);
                    if (dist > 0 && dist <= range) inRange = true;
                }

                if (inRange) {
                    const rect = this.add.rectangle(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize,
                        0xffff00,
                        0.2
                    ).setOrigin(0);
                    this.rangeOverlay.add(rect);
                }
            }
        }
    }

    private clearRangeOverlay() {
        if (this.rangeOverlay) {
            this.rangeOverlay.clear(true, true);
        }
    }

    // ... handleInput ...

    private handlePointerDown(pointer: Phaser.Input.Pointer) {
        if (this.turnLock || this.gameState.hp <= 0) return;

        // Convert Click to Grid Coords
        const x = Math.floor(pointer.worldX / this.tileSize);
        const y = Math.floor(pointer.worldY / this.tileSize);

        // Validation
        if (x < 0 || x >= this.ROOM_SIZE || y < 0 || y >= this.ROOM_SIZE) return;

        // Interaction Mode: Targeting (Stapler etc.)
        if (this.targetingItem) {
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
                    // Check if ammo remains
                    const weapon = this.gameState.inventory.find(i => i.type === this.targetingItem);
                    if (!weapon || (weapon.uses !== undefined && weapon.uses <= 0)) {
                        this.targetingItem = null;
                        this.input.setDefaultCursor('default');
                        this.clearRangeOverlay(); // Use the method
                        EventManager.emit(GameEvents.LOG_MESSAGE, "Targeting Disengaged.");
                    } else {
                        // Persist selection - Do nothing, keep cursor and overlay
                    }
                    this.executePhase3_World(); // Always advance turn after a successful attack
                } else {
                    // Invalid target or Miss? Keep selection or Clear?
                    // User probably wants to try again if missed, so keep it.
                }
            }
            return;
        }

        // Tap-to-Move Logic
        const dx = x - this.gameState.playerX;
        const dy = y - this.gameState.playerY;

        if (dx === 0 && dy === 0) {
            // Wait / Skip Turn
            this.executePhase3_World();
            return;
        }

        // Determine primary direction if not adjacent
        let moveX = 0;
        let moveY = 0;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal preference
            moveX = dx > 0 ? 1 : -1;
        } else {
            // Vertical preference
            moveY = dy > 0 ? 1 : -1;
        }

        // Check if adjacent (Orthogonal)
        // If adjacent, use exact dx/dy (which are -1, 0, or 1)
        if (Math.abs(dx) + Math.abs(dy) === 1) {
            this.processMovement(dx, dy, pointer.event.shiftKey);
        } else {
            // Distant tap -> Move in that direction
            this.processMovement(moveX, moveY, pointer.event.shiftKey);
        }
    }


    private handleItemUse(_itemId: string, index: number) {
        if (this.turnLock || this.gameState.hp <= 0) return;

        const item = this.gameState.inventory[index];
        if (!item) return;

        const typeToUse = item.type; // e.g. 'stapler'

        // Toggle Targeting
        if (typeToUse === 'stapler' || typeToUse === 'weapon') {
            if (this.targetingItem === typeToUse) {
                this.targetingItem = null;
                this.clearRangeOverlay();
                this.input.setDefaultCursor('default');
                EventManager.emit(GameEvents.LOG_MESSAGE, "Targeting Cancelled.");
            } else {
                this.targetingItem = typeToUse;
                this.renderRangeOverlay(3);
                this.input.setDefaultCursor('crosshair');
                EventManager.emit(GameEvents.LOG_MESSAGE, `Aiming ${typeToUse}... Click a target!`);
            }
            return;
        }

        let used = false;
        let consumed = false;



        if (typeToUse === 'consumable' || typeToUse === 'coffee') {
            this.gameState.hp = Math.min(this.gameState.maxHp, this.gameState.hp + 10);
            this.gameState.burnout = Math.max(0, this.gameState.burnout - 5);
            EventManager.emit(GameEvents.LOG_MESSAGE, "Drank Coffee. HP +10, Burnout -5.");
            used = true;
            consumed = true;
        } else if (typeToUse === 'granola_bar') {
            this.gameState.hp = Math.min(this.gameState.maxHp, this.gameState.hp + 5);
            this.gameState.burnout = Math.max(0, this.gameState.burnout - 2);
            EventManager.emit(GameEvents.LOG_MESSAGE, "Ate Granola. It's dry. HP +5, Burnout -2.");
            used = true;
            consumed = true;
        } else if (typeToUse === 'mint') {
            this.gameState.burnout = Math.max(0, this.gameState.burnout - 10);
            EventManager.emit(GameEvents.LOG_MESSAGE, "Fresh Mint! Burnout -10.");
            used = true;
            consumed = true;
        } else if (typeToUse === 'vitamin_pill') {
            this.gameState.hp = Math.min(this.gameState.maxHp, this.gameState.hp + 10);
            EventManager.emit(GameEvents.LOG_MESSAGE, "Vitamin C Boost! HP +10.");
            used = true;
            consumed = true;
        } else if (typeToUse === 'id_card' || typeToUse === 'security_pass') {
            EventManager.emit(GameEvents.LOG_MESSAGE, "Security Pass. Auto-unlocks doors.");
        } else if (typeToUse === 'consumable') {
            // Generic Fallback for old save data or generic loot
            this.gameState.hp = Math.min(this.gameState.maxHp, this.gameState.hp + 5);
            EventManager.emit(GameEvents.LOG_MESSAGE, "You eat the snack. HP +5.");
            used = true;
            consumed = true;
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

}
