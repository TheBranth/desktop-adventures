import { GameState, Enemy, Room } from '../types/World';

export class EnemyAI {

    public static processTurn(gameState: GameState, log: (msg: string) => void) {
        const room = gameState.worldMap[gameState.currentRoomId];
        if (!room || !room.enemies) return;

        room.enemies.forEach(enemy => {
            if (enemy.hp <= 0) return; // Dead enemies don't move
            if (enemy.aiState === 'stunned') {
                enemy.aiState = 'idle'; // Recover from stun
                log(`${enemy.type} is recovering from stun.`);
                return;
            }

            this.moveEnemy(enemy, gameState, room, log);
        });
    }

    private static moveEnemy(enemy: Enemy, gameState: GameState, room: Room, log: (msg: string) => void) {
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

            case 'manager':
                // Kiting: Maintain distance 3
                const dist = Math.abs(gameState.playerX - enemy.x) + Math.abs(gameState.playerY - enemy.y);
                if (dist < 3) {
                    // Too close, run away
                    if (gameState.playerX > enemy.x) dx = -1;
                    else if (gameState.playerX < enemy.x) dx = 1;
                    else if (gameState.playerY > enemy.y) dy = -1;
                    else if (gameState.playerY < enemy.y) dy = 1;
                }
                // If optimal distance, maybe attack? (Attacks handled separately)
                break;

            case 'printer':
                // Turret: Does not move
                return;
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

        // Walls
        if (room.collision_map[y][x] === 1) return false;

        // Player (blocked for movement, but we handled interaction above)
        if (x === gameState.playerX && y === gameState.playerY) return false;

        // Other Enemies
        if (room.enemies.some(e => e.x === x && e.y === y && e.hp > 0)) return false;

        return true;
    }
}
