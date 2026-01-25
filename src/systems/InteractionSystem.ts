import { GameState, InteractionObject } from '../types/World';
import { UIManager } from '../ui/UIManager';

export class InteractionSystem {

    public static handleBump(gameState: GameState, x: number, y: number, log: (msg: string) => void, onDamage?: (id: string) => void, onWin?: () => void): boolean {
        // Check for Objects
        const room = gameState.worldMap[gameState.currentRoomId];
        const objectIndex = room.objects.findIndex(obj => obj.x === x && obj.y === y);

        if (objectIndex !== -1) {
            const obj = room.objects[objectIndex];
            return this.interactWithObject(obj, objectIndex, gameState, room, log, onWin);
        }

        // Check for Enemies (Melee Attack)
        const enemy = room.enemies.find(e => e.x === x && e.y === y);
        if (enemy) {
            // Combat Logic
            // Simple damage for now. 
            const damage = 5; // Default "Newspaper" damage
            enemy.hp -= damage;
            log(`You hit ${enemy.type} for ${damage} damage!`);

            if (onDamage) onDamage(enemy.id);

            if (enemy.hp <= 0) {
                InteractionSystem.handleDefeat(gameState, enemy, log, room);
            }
            return true; // Interaction occurred/Blocked movement
        }

        return false; // No interaction
    }

    public static handleDefeat(gameState: GameState, enemy: any, log: (msg: string) => void, room: any) {
        log(`${enemy.type} is defeated!`);

        // Guaranteed Credits
        let coins = 0;
        switch (enemy.type) {
            case 'intern': coins = Math.floor(Math.random() * 3) + 1; break; // 1-3
            case 'roomba': coins = Math.floor(Math.random() * 4) + 2; break; // 2-5
            case 'printer': coins = Math.floor(Math.random() * 4) + 5; break; // 5-8
            case 'manager': coins = Math.floor(Math.random() * 6) + 10; break; // 10-15
            default: coins = 1; break; // Fallback
        }
        gameState.credits = (gameState.credits || 0) + coins;
        log(`Gained ¥${coins} credits. (Total: ¥${gameState.credits})`);

        // Loot Logic
        // 50% chance to drop something?
        if (Math.random() < 0.5) {
            let lootItem = 'consumable'; // Default coffee
            if (enemy.type === 'manager') lootItem = 'id_card'; // Better loot
            if (enemy.type === 'printer') lootItem = 'stapler';
            if (Math.random() < 0.1) lootItem = 'weapon'; // Critical Drop

            // Drop it at enemy location
            room.objects.push({ x: enemy.x, y: enemy.y, id: `loot_${Math.random()}`, type: 'pickup', sprite_key: lootItem, itemType: lootItem });
            log(`Dropped ${lootItem}!`);
        }

        // Remove enemy from room
        const enemyIndex = room.enemies.indexOf(enemy);
        if (enemyIndex > -1) {
            room.enemies.splice(enemyIndex, 1);
        }
    }

    private static interactWithObject(obj: InteractionObject, index: number, gameState: GameState, room: any, log: (msg: string) => void, onWin?: () => void): boolean {
        switch (obj.type) {
            case 'pickup':
                if (obj.itemType) {
                    gameState.inventory.push(obj.itemType);
                    log(`Picked up ${obj.itemType}.`);

                    // Update UI
                    UIManager.getInstance().updateInventory(gameState.inventory);

                    // Remove object
                    room.objects.splice(index, 1);
                }
                return false; // Walkable after pickup. Moves player onto tile. 
            // Return true to consume the turn.

            case 'barrier':
                // Check for key
                if (gameState.inventory.includes('key_blue')) {
                    log("Barrier Access Granted. Removed Barrier.");
                    room.objects.splice(index, 1);
                    return true;
                } else {
                    log("Access Denied. Requires Blue Keycard.");
                    return true;
                }

            case 'elevator':
                // Check conditions
                const hasMacguffin = gameState.inventory.some(i => i.toLowerCase().includes('macguffin') || i === 'Golden Stapler' || i === 'TPS Report' || i === 'The Coffee of Life' || i === 'Server Password' || i === 'Quantum Toner Cartridge');

                if (hasMacguffin) {
                    log("Elevator Unlocked. Initiating Ascent...");
                    if (onWin) onWin();
                } else {
                    log("Cannot leave without the Objective!");
                }
                return true;

            case 'vending':
                const cost = obj.cost || 5;
                if (gameState.credits >= cost) {
                    gameState.credits -= cost;

                    // Engine Room Spec: d100 Roll
                    const roll = Math.floor(Math.random() * 100); // 0-99

                    if (roll <= 10) {
                        // 0-10: Jam / Trap
                        log("Vending Machine Jammed! It ate your money.");
                    } else if (roll <= 50) {
                        // 11-50: Nothing
                        log("Vending Machine whirrs... but nothing falls out.");
                    } else if (roll <= 90) {
                        // 51-90: Common Item
                        log("Dispensed Coffee. (+HP)");
                        gameState.inventory.push('consumable');
                        gameState.hp = Math.min(100, gameState.hp + 5);
                    } else {
                        // 91-99: Rare Item
                        log("JACKPOT! Rare Item dispensed.");
                        gameState.inventory.push('weapon'); // Upgrade?
                    }

                    UIManager.getInstance().updateInventory(gameState.inventory);
                    room.objects.splice(index, 1);
                    log("The machine shuts down.");

                } else {
                    log(`Need ${cost} Credits.`);
                }
                return true; // Block movement

            case 'desk':
                log("It's a standing desk. Good cover.");
                return true; // Block movement

            case 'readable':
                if (obj.text) log(`Read: "${obj.text}"`);
                return true;

            default:
                return true; // Blocked generic
        }
    }
}
