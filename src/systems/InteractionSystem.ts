import { GameState, InteractionObject } from '../types/World';
import { EventManager, GameEvents } from './EventManager';

export class InteractionSystem {

    public static handleBump(gameState: GameState, x: number, y: number, log: (msg: string) => void, onDamage?: (id: string) => void, onWin?: () => void): boolean {
        // Check for Objects
        const room = gameState.worldMap[gameState.currentRoomId];
        const objectIndex = room.objects.findIndex(obj => {
            const w = obj.width || 1;
            const h = obj.height || 1;
            return x >= obj.x && x < obj.x + w &&
                y >= obj.y && y < obj.y + h;
        });

        if (objectIndex !== -1) {
            const obj = room.objects[objectIndex];
            return this.interactWithObject(obj, objectIndex, gameState, room, log, onWin);
        }

        // Check for Enemies (Melee)
        const enemy = room.enemies.find(e => e.x === x && e.y === y);
        if (enemy) {
            const damage = 5;
            enemy.hp -= damage;
            log(`You hit ${enemy.type} for ${damage} damage!`);

            EventManager.emit(GameEvents.DAMAGE_DEALT, { x: enemy.x, y: enemy.y, damage: damage, isPlayer: true });

            if (onDamage) onDamage(enemy.id);

            if (enemy.hp <= 0) {
                InteractionSystem.handleDefeat(gameState, enemy, log, room);
            }
            return true;
        }

        return false;
    }

    public static handleDefeat(gameState: GameState, enemy: any, log: (msg: string) => void, room: any) {
        log(`${enemy.type} is defeated!`);

        let coins = 0;
        switch (enemy.type) {
            case 'intern': coins = Math.floor(Math.random() * 3) + 1; break;
            case 'roomba': coins = Math.floor(Math.random() * 4) + 2; break;
            case 'printer': coins = Math.floor(Math.random() * 4) + 5; break;
            case 'manager': coins = Math.floor(Math.random() * 6) + 10; break;
            default: coins = 1; break;
        }
        gameState.credits = (gameState.credits || 0) + coins;
        log(`Gained ¥${coins} credits. (Total: ¥${gameState.credits})`);

        // Emit Stats Update
        EventManager.emit(GameEvents.STATS_CHANGE, {
            hp: gameState.hp,
            maxHp: gameState.maxHp,
            burnout: gameState.burnout,
            credits: gameState.credits
        });

        if (Math.random() < 0.5) {
            let lootItem = 'consumable';
            if (enemy.type === 'manager') lootItem = 'id_card';
            if (enemy.type === 'printer') lootItem = 'stapler';
            if (Math.random() < 0.1) lootItem = 'weapon';

            room.objects.push({ x: enemy.x, y: enemy.y, id: `loot_${Math.random()}`, type: 'pickup', sprite_key: lootItem, itemType: lootItem });
            log(`Dropped ${lootItem}!`);
        }

        const enemyIndex = room.enemies.indexOf(enemy);
        if (enemyIndex > -1) {
            room.enemies.splice(enemyIndex, 1);
        }
    }

    public static handleRangedAttack(
        gameState: GameState,
        targetX: number,
        targetY: number,
        weaponType: string,
        log: (msg: string) => void,
        flashEffect: (id: string) => void
    ): { success: boolean } {
        const room = gameState.worldMap[gameState.currentRoomId];

        // Find weapon in inventory to check ammo
        const weaponItem = gameState.inventory.find(i => i.type === weaponType);
        if (!weaponItem) {
            log("You don't have that weapon!");
            return { success: false };
        }

        if (weaponItem.uses !== undefined) {
            if (weaponItem.uses <= 0) {
                log("Click! Empty.");
                return { success: false };
            }
        }

        // 1. Find Target
        const enemy = room.enemies.find(e => e.x === targetX && e.y === targetY && e.hp > 0);

        if (!enemy) {
            log("You missed! Nothing there.");
            // Decrement ammo on miss? Yes.
            if (weaponItem.uses !== undefined) weaponItem.uses--;
            EventManager.emit(GameEvents.INVENTORY_UPDATE, { inventory: gameState.inventory });
            return { success: true };
        }

        // 2. Check Range
        const dist = Math.abs(gameState.playerX - targetX) + Math.abs(gameState.playerY - targetY);
        let maxRange = 1;
        let damage = 2;

        if (weaponType === 'stapler') { maxRange = 4; damage = 4; }
        else if (weaponType === 'weapon') { maxRange = 1; damage = 5; }

        if (dist > maxRange) {
            log("Target out of range!");
            return { success: false };
        }

        // 3. Deal Damage
        // Decrement Ammo
        if (weaponItem.uses !== undefined) weaponItem.uses--;
        EventManager.emit(GameEvents.INVENTORY_UPDATE, { inventory: gameState.inventory });

        enemy.hp -= damage;
        flashEffect(enemy.id);
        log(`Sniped the ${enemy.type} for ${damage} dmg!`);

        EventManager.emit(GameEvents.DAMAGE_DEALT, { x: enemy.x, y: enemy.y, damage: damage, isPlayer: true });

        if (enemy.hp <= 0) {
            this.handleDefeat(gameState, enemy, log, room);
        }

        return { success: true };
    }

    private static interactWithObject(obj: InteractionObject, index: number, gameState: GameState, room: any, log: (msg: string) => void, onWin?: () => void): boolean {
        switch (obj.type) {
            case 'pickup':
                if (obj.itemType) {
                    // Create InventoryItem
                    const newItem = {
                        id: `item_${Date.now()}_${Math.random()}`,
                        type: obj.itemType,
                        name: obj.itemType,
                        uses: undefined as number | undefined,
                        maxUses: undefined as number | undefined
                    };

                    // Special Logic for specific items
                    if (obj.itemType === 'stapler') {
                        newItem.name = 'Red Stapler';
                        newItem.uses = 10;
                        newItem.maxUses = 10;
                    } else if (obj.itemType === 'coffee') {
                        newItem.name = 'Coffee';
                    } else if (obj.itemType === 'weapon') {
                        newItem.name = 'Newspaper';
                    }

                    // Stackable check? For now just push.
                    gameState.inventory.push(newItem);
                    log(`Picked up ${newItem.name}.`);

                    EventManager.emit(GameEvents.INVENTORY_UPDATE, { inventory: gameState.inventory });

                    // Remove object
                    room.objects.splice(index, 1);
                }
                return false;

            case 'barrier':
                if (gameState.inventory.some(i => i.type === 'key_blue')) {
                    log("Barrier Access Granted. Removed Barrier.");
                    room.objects.splice(index, 1);
                    return true;
                } else {
                    log("Access Denied. Requires Blue Keycard.");
                    return true;
                }

            case 'elevator':
                // Check conditions
                // Needs: Red Keycard AND (MacGuffin OR Specific Objective Item)
                const hasRedKey = gameState.inventory.some(i => i.type === 'key_red');
                const hasMacguffin = gameState.inventory.some(i =>
                    i.type.toLowerCase().includes('macguffin') ||
                    i.type === 'Golden Stapler' ||
                    i.type === 'TPS Report' ||
                    i.type === 'The Objective'
                );

                if (hasRedKey && hasMacguffin) {
                    log("Elevator Unlocked. Initiating Ascent...");
                    if (onWin) onWin();
                } else {
                    if (!hasRedKey) log("Access Denied. Elevator requires Red Admin Key.");
                    if (!hasMacguffin) log("Cannot leave without the Objective!");
                }
                return true;

            case 'vending':
                const cost = obj.cost || 5;
                if (gameState.credits >= cost) {
                    gameState.credits -= cost;
                    const roll = Math.floor(Math.random() * 100);

                    if (roll <= 10) {
                        log("Vending Machine Jammed! It ate your money.");
                    } else if (roll <= 50) {
                        log("Vending Machine whirrs... but nothing falls out.");
                    } else if (roll <= 90) {
                        log("Dispensed Coffee. (+HP)");
                        gameState.inventory.push({ id: `vend_${Date.now()}`, type: 'consumable', name: 'Coffee' });
                        gameState.hp = Math.min(100, gameState.hp + 5);
                    } else {
                        log("JACKPOT! Rare Item dispensed.");
                        gameState.inventory.push({ id: `vend_rare_${Date.now()}`, type: 'weapon', name: 'Newspaper' });
                    }

                    EventManager.emit(GameEvents.INVENTORY_UPDATE, { inventory: gameState.inventory });
                    EventManager.emit(GameEvents.STATS_CHANGE, {
                        hp: gameState.hp,
                        maxHp: gameState.maxHp,
                        burnout: gameState.burnout,
                        credits: gameState.credits
                    });

                    room.objects.splice(index, 1);
                    log("The machine shuts down.");
                } else {
                    log(`Need ${cost} Credits.`);
                }
                return true;

            case 'water_cooler':
                if (obj.uses === undefined) obj.uses = 3; // Default 3 uses
                if (obj.uses > 0) {
                    log(`Hydration is key. (+2 HP, -5% Burnout). Uses left: ${obj.uses - 1}`);
                    gameState.hp = Math.min(gameState.maxHp, gameState.hp + 2);
                    gameState.burnout = Math.max(0, gameState.burnout - 5);
                    obj.uses--;

                    if (obj.uses <= 0) {
                        obj.sprite_key = 'water_cooler_empty';
                        log("You drain the last drop.");
                    }

                    EventManager.emit(GameEvents.STATS_CHANGE, {
                        hp: gameState.hp,
                        maxHp: gameState.maxHp,
                        burnout: gameState.burnout,
                        credits: gameState.credits
                    });
                } else {
                    log("The Water Cooler is empty.");
                }
                return true;

            case 'desk':
                log("It's a standing desk. Good cover.");
                return true;

            case 'plant':
                log("It's a plastic plant. Dust gathers on the leaves.");
                return true;

            case 'server':
                log("Server Rack. Blinking lights hypnotize you. (+1 Burnout)");
                gameState.burnout = Math.min(100, gameState.burnout + 1);
                EventManager.emit(GameEvents.STATS_CHANGE, {
                    hp: gameState.hp,
                    maxHp: gameState.maxHp,
                    burnout: gameState.burnout,
                    credits: gameState.credits
                });
                return true;

            case 'readable':
                if (obj.text) log(`Read: "${obj.text}"`);
                return true;

            default:
                return true;
        }
    }
}
