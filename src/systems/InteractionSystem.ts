import { GameState, InteractionObject } from '../types/World';

export class InteractionSystem {

    public static handleBump(gameState: GameState, x: number, y: number, log: (msg: string) => void): boolean {
        // Check for Objects
        const room = gameState.worldMap[gameState.currentRoomId];
        const objectIndex = room.objects.findIndex(obj => obj.x === x && obj.y === y);

        if (objectIndex !== -1) {
            const obj = room.objects[objectIndex];
            return this.interactWithObject(obj, objectIndex, gameState, room, log);
        }

        // Check for Enemies (Melee Attack)
        const enemy = room.enemies.find(e => e.x === x && e.y === y);
        if (enemy) {
            // Combat Logic
            // Simple damage for now. 
            // TODO: Implement Weapon Damage
            const damage = 5; // Default "Newspaper" damage
            enemy.hp -= damage;
            log(`You hit ${enemy.type} for ${damage} damage!`);

            if (enemy.hp <= 0) {
                log(`${enemy.type} is defeated!`);
                // Drop loot?
                // Remove enemy (handled by renderer usually, or separate cleanup)
            }
            return true; // Interaction occurred/Blocked movement
        }

        return false; // No interaction
    }

    private static interactWithObject(obj: InteractionObject, index: number, gameState: GameState, room: any, log: (msg: string) => void): boolean {
        switch (obj.type) {
            case 'pickup':
                if (obj.itemType) {
                    gameState.inventory.push(obj.itemType);
                    log(`Picked up ${obj.itemType}.`);
                    // Remove object
                    room.objects.splice(index, 1);
                }
                return false; // Walkable after pickup? usually yes. But here we remove it, so next move works. 
            // Return true to block this turn's movement, forcing a "pickup" action.
            // Let's return true to consume the turn.

            case 'vending':
                const cost = obj.cost || 5;
                if (gameState.credits >= cost) {
                    gameState.credits -= cost;

                    // Engine Room Spec: d100 Roll
                    const roll = Math.floor(Math.random() * 100); // 0-99

                    if (roll <= 10) {
                        // 0-10: Jam / Trap
                        log("Vending Machine Jammed! It ate your money.");
                        // Optional: Spawn spider or hazard?
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

                    // Mark as looted so it can't be farmed? 
                    // Engine room says "Mark object as looted".
                    // But vending machines usually re-usable if you have credits?
                    // Let's keep it reusable for now unless spec forces one-time.
                    // Spec: "Mark object as looted in RoomData so it cannot be farmed."
                    // OK, let's mark it.
                    // room.objects.splice(index, 1); // Removing it makes it disappear. 
                    // Better to change type to 'empty_vending' or just track ID.
                    // For visual simplicity, let's just say "Sold Out" next time?
                    // Implementation: We'll remove it or disable it.
                    // Let's remove it to follow "cannot be farmed" strictly and visually.
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
