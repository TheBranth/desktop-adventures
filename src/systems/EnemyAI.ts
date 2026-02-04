import { GameState, Enemy, Room } from '../types/World';

export class EnemyAI {

    public static processTurn(gameState: GameState, log: (msg: string) => void, onFX?: (type: string, x: number, y: number, tx: number, ty: number) => void) {
        const room = gameState.worldMap[gameState.currentRoomId];
        if (!room || !room.enemies) return;

        room.enemies.forEach(enemy => {
            if (enemy.hp <= 0) return; // Dead enemies don't move
            if (enemy.aiState === 'stunned') {
                enemy.aiState = 'idle'; // Recover from stun
                log(`${enemy.type} is recovering from stun.`);
                return;
            }

            this.moveEnemy(enemy, gameState, room, log, onFX);
        });
    }

    private static moveEnemy(enemy: Enemy, gameState: GameState, room: Room, log: (msg: string) => void, onFX?: (type: string, x: number, y: number, tx: number, ty: number) => void) {
        let dx = 0;
        let dy = 0;

        switch (enemy.type) {
            case 'intern':
                // Simple Chase: Move towards player
                if (gameState.playerX > enemy.x) dx = 1;
                else if (gameState.playerX < enemy.x) dx = -1;
                else if (gameState.playerY > enemy.y) dy = 1;
                else if (gameState.playerY < enemy.y) dy = -1;
                break;

            case 'roomba':
                // Linear Patrol: Move in patrolDir, turn 90deg on collision
                if (!enemy.patrolDir) enemy.patrolDir = { x: 1, y: 0 };
                dx = enemy.patrolDir.x;
                dy = enemy.patrolDir.y;
                break;

            case 'printer':
                // Turret: Line of Sight check
                const distP = Math.abs(gameState.playerX - enemy.x) + Math.abs(gameState.playerY - enemy.y);
                if (distP > 4) return; // Range Limit (Nerf)

                // Same Row
                if (enemy.y === gameState.playerY) {
                    // Check for walls between
                    if (this.hasLineOfSight(enemy.x, enemy.y, gameState.playerX, gameState.playerY, room, false)) {
                        log("Printer blasts you with toner! (Ranged)");
                        if (onFX) onFX('projectile', enemy.x, enemy.y, gameState.playerX, gameState.playerY); // FX
                        gameState.hp = Math.max(0, gameState.hp - 2);
                        gameState.burnout += 2;
                        return; // Attacked, so don't move (it doesn't move anyway)
                    }
                }
                // Same Column
                else if (enemy.x === gameState.playerX) {
                    if (this.hasLineOfSight(enemy.x, enemy.y, gameState.playerX, gameState.playerY, room, true)) {
                        log("Printer blasts you with toner! (Ranged)");
                        if (onFX) onFX('projectile', enemy.x, enemy.y, gameState.playerX, gameState.playerY); // FX
                        gameState.hp = Math.max(0, gameState.hp - 2);
                        gameState.burnout += 2;
                        return;
                    }
                }
                return; // Stationary

            case 'manager':
                // Cooldown Check (e.g., using a property on enemy, or just simple logic)
                // Since we don't have a rigid cooldown prop yet, let's use a custom property if we can,
                // or just rely on RNG with a lower chance + LOGIC.

                // Let's add a `cooldown` field to the Enemy type later, but for now, 
                // we can treat 'stunned' as a cooldown? No, that stops movement.
                // Let's just drastically reduce the shout chance and range.

                const distM = Math.abs(gameState.playerX - enemy.x) + Math.abs(gameState.playerY - enemy.y);

                // Attack logic:
                // Only shout if NOT adjacent (adjacent is melee)
                // Chance 20% (approx every 5 turns)
                if (distM >= 2 && distM <= 4 && Math.random() < 0.2) {
                    log("Manager yells about TPS reports! +5 Burnout.");
                    gameState.burnout = Math.min(100, gameState.burnout + 5); // Nerfed from 10
                    // Trigger "Action Taken" visual?
                    if (onFX) onFX('shout', enemy.x, enemy.y, gameState.playerX, gameState.playerY);
                    return;
                }

                // Movement Logic (Maintain Dist 2-3, Don't rush in to melee unless necessary)
                if (distM < 2) {
                    // Too close, Step back to shout range
                    if (gameState.playerX > enemy.x) dx = -1;
                    else if (gameState.playerX < enemy.x) dx = 1;
                    else if (gameState.playerY > enemy.y) dy = -1;
                    else if (gameState.playerY < enemy.y) dy = 1;
                } else if (distM > 3) {
                    // Close in slightly
                    if (gameState.playerX > enemy.x) dx = 1;
                    else if (gameState.playerX < enemy.x) dx = -1;
                    else if (gameState.playerY > enemy.y) dy = 1;
                    else if (gameState.playerY < enemy.y) dy = -1;
                }
                // If dist is 2 or 3, stay put (Ideal shouting range)
                break;
        }

        // Try move
        const targetX = enemy.x + dx;
        const targetY = enemy.y + dy;

        // Collision Check (Walls & Player & Other Enemies)
        if (this.isWalkable(targetX, targetY, room, gameState)) {
            enemy.x = targetX;
            enemy.y = targetY;
        } else {
            // Collision handling specific to AI
            if (enemy.type === 'roomba') {
                // Roomba turns clockwise on collision
                if (enemy.patrolDir?.x === 1) enemy.patrolDir = { x: 0, y: 1 };
                else if (enemy.patrolDir?.x === -1) enemy.patrolDir = { x: 0, y: -1 };
                else if (enemy.patrolDir?.y === 1) enemy.patrolDir = { x: -1, y: 0 };
                else if (enemy.patrolDir?.y === -1) enemy.patrolDir = { x: 1, y: 0 };
            }

            // Attack Player if bumping into them
            if (targetX === gameState.playerX && targetY === gameState.playerY) {
                // Burnout Multiplier Logic
                const multiplier = gameState.burnout >= 50 ? 2.0 : 1.0;
                const damage = Math.ceil(enemy.damage * multiplier);

                log(`${enemy.type} attacked you for ${damage} damage! ${multiplier > 1 ? '(Burnout x2)' : ''}`);
                gameState.hp = Math.max(0, gameState.hp - damage);
                gameState.burnout += 5; // Stress from damage
            }

            // Friendly Fire / Stacking Interaction
            // If hits another enemy?
            const otherEnemy = room.enemies.find(e => e.x === targetX && e.y === targetY && e.id !== enemy.id);
            if (otherEnemy) {
                // Friendly Fire Logic (optional: only if "attacking")
                // For now, just blocking. But 'Manager' Shout could hurt.
            }
        }
    }

    private static isWalkable(x: number, y: number, room: Room, gameState: GameState): boolean {
        // Bounds
        if (x < 0 || x > 10 || y < 0 || y > 10) return false;

        // Walls (1) or Windows (2)
        const cell = room.collision_map[y][x];
        if (cell === 1 || cell === 2) return false;

        // Player (blocked for movement, but we handled interaction above)
        if (x === gameState.playerX && y === gameState.playerY) return false;

        // Other Enemies
        if (room.enemies.some(e => e.x === x && e.y === y && e.hp > 0)) return false;

        // Objects (Obstacles)
        // Multi-Tile Check
        const object = room.objects.find(o => {
            const w = o.width || 1;
            const h = o.height || 1;
            return x >= o.x && x < o.x + w &&
                y >= o.y && y < o.y + h;
        });

        if (object) {
            // Pickups are walkable
            if (object.type === 'pickup') return true;
            // Everything else (desk, vending, barrier, elevator) is blocking
            return false;
        }

        return true;
    }

    private static hasLineOfSight(x1: number, y1: number, x2: number, y2: number, room: Room, vertical: boolean): boolean {
        if (vertical) {
            // x is constant
            const start = Math.min(y1, y2);
            const end = Math.max(y1, y2);
            for (let y = start + 1; y < end; y++) {
                if (room.collision_map[y][x1] === 1) return false; // Wall hit

                // Object Hit Check
                const blockingObj = room.objects.find(o =>
                    o.type !== 'pickup' &&
                    x1 >= o.x && x1 < o.x + (o.width || 1) &&
                    y >= o.y && y < o.y + (o.height || 1)
                );
                if (blockingObj) return false;
            }
        } else {
            // y is constant
            const start = Math.min(x1, x2);
            const end = Math.max(x1, x2);
            for (let x = start + 1; x < end; x++) {
                if (room.collision_map[y1][x] === 1) return false; // Wall hit

                // Object Hit Check
                const blockingObj = room.objects.find(o =>
                    o.type !== 'pickup' &&
                    x >= o.x && x < o.x + (o.width || 1) &&
                    y1 >= o.y && y1 < o.y + (o.height || 1)
                );
                if (blockingObj) return false;
            }
        }
        return true;
    }

    public static isThreatening(enemy: Enemy, gameState: GameState, room: Room): boolean {
        // Check if enemy implies immediate danger to player at current positions
        switch (enemy.type) {
            case 'intern':
            case 'roomba': // Roomba only bumps, but efficient to warn
            case 'manager': // Melee range check
                const dist = Math.abs(gameState.playerX - enemy.x) + Math.abs(gameState.playerY - enemy.y);
                return dist === 1;

            case 'printer':
                // Ranged LOS check
                // Same Row
                if (enemy.y === gameState.playerY) {
                    return this.hasLineOfSight(enemy.x, enemy.y, gameState.playerX, gameState.playerY, room, false);
                }
                // Same Column
                else if (enemy.x === gameState.playerX) {
                    return this.hasLineOfSight(enemy.x, enemy.y, gameState.playerX, gameState.playerY, room, true);
                }
                return false;

            default:
                return false;
        }
    }
}
