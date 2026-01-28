import { GameState, Room, Enemy, EnemyType, ItemType } from '../types/World';

export class MapGenerator {
    private width: number;
    private height: number;
    private towerLevel: number;
    private rng: () => number;

    constructor(width: number = 10, height: number = 10, towerLevel: number = 1) {
        this.width = width;
        this.height = height;
        this.towerLevel = towerLevel;
        this.rng = Math.random; // Could be seeded
    }

    public generateWorld(): GameState {
        // Step 1: The Anchor
        // Select Start Node (Edge)
        let startX = 0;
        let startY = 0;
        const edge = Math.floor(this.rng() * 4);
        if (edge === 0) { startX = Math.floor(this.rng() * this.width); startY = 0; } // Top
        else if (edge === 1) { startX = Math.floor(this.rng() * this.width); startY = this.height - 1; } // Bottom
        else if (edge === 2) { startX = 0; startY = Math.floor(this.rng() * this.height); } // Left
        else { startX = this.width - 1; startY = Math.floor(this.rng() * this.height); } // Right

        const startNode = { x: startX, y: startY };

        // Step 2: Critical Path Generation
        // Place Goal (Manhattan > 4)
        let goalNode = this.getRandomNode();
        while (this.getManhattanDist(startNode, goalNode) <= 4) {
            goalNode = this.getRandomNode();
        }

        // Place Key (Manhattan > 2 from Start)
        let keyNode = this.getRandomNode();
        while (this.getManhattanDist(startNode, keyNode) <= 2 ||
            (keyNode.x === goalNode.x && keyNode.y === goalNode.y)) {
            keyNode = this.getRandomNode();
        }

        // We will generate the grid first.
        const rooms: { [key: string]: Room } = {};
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                rooms[`${x}_${y}`] = this.createRoom(`${x}_${y}`, 'office', x, y);
            }
        }

        // Populate Content

        // Start Room
        this.populateReception(rooms[`${startNode.x}_${startNode.y}`]);

        // Key Room (Blue)
        this.populateKeyRoom(rooms[`${keyNode.x}_${keyNode.y}`], 'key_blue');

        // MacGuffin Room (Furthest from Start besides Key/Goal?)
        let mgNode = this.getRandomNode();
        while (this.getManhattanDist(startNode, mgNode) <= 3 ||
            (mgNode.x === keyNode.x && mgNode.y === keyNode.y) ||
            (mgNode.x === goalNode.x && mgNode.y === goalNode.y)) {
            mgNode = this.getRandomNode();
        }
        this.populateMacGuffinRoom(rooms[`${mgNode.x}_${mgNode.y}`], 'The Objective');

        // Red Key Room (Another random node)
        let redKeyNode = this.getRandomNode();
        while (this.getManhattanDist(startNode, redKeyNode) <= 3 ||
            (redKeyNode.x === keyNode.x && redKeyNode.y === keyNode.y) ||
            (redKeyNode.x === goalNode.x && redKeyNode.y === goalNode.y) ||
            (redKeyNode.x === mgNode.x && redKeyNode.y === mgNode.y)) {
            redKeyNode = this.getRandomNode();
        }
        this.populateRedKeyRoom(rooms[`${redKeyNode.x}_${redKeyNode.y}`]);


        // Goal Room
        this.populateGoalRoom(rooms[`${goalNode.x}_${goalNode.y}`]);

        // Remaining Rooms (Flood Fill logic simplified: just populate all valid coords)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const id = `${x}_${y}`;
                // Skip if Start, Key, or Goal (already populated)
                if ((x === startNode.x && y === startNode.y) ||
                    (x === keyNode.x && y === keyNode.y) ||
                    (x === goalNode.x && y === goalNode.y) ||
                    (x === mgNode.x && y === mgNode.y) ||
                    (x === redKeyNode.x && y === redKeyNode.y)) continue;

                this.populateRandomRoom(rooms[id]);
            }
        }

        console.log(`Map Generated. Start: [${startNode.x},${startNode.y}], Key: [${keyNode.x},${keyNode.y}], Goal: [${goalNode.x},${goalNode.y}]`);

        return {
            currentRoomId: `${startNode.x}_${startNode.y}`,
            playerX: 5,
            playerY: 5,
            hp: 20, // Spec: 20
            maxHp: 20,
            burnout: 0,
            inventory: [],
            credits: 0,
            worldMap: rooms,
            tower_level: this.towerLevel,
            global_flags: {},
            visited_rooms: [`${startNode.x}_${startNode.y}`]
        };
    }

    private getRandomNode() {
        return {
            x: Math.floor(this.rng() * this.width),
            y: Math.floor(this.rng() * this.height)
        };
    }

    private getManhattanDist(a: { x: number, y: number }, b: { x: number, y: number }) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    private createRoom(id: string, biome: string, gridX: number, gridY: number): Room {
        // Create 11x11 Grid
        const map: number[][] = [];
        for (let r = 0; r < 11; r++) {
            const row: number[] = [];
            for (let c = 0; c < 11; c++) {
                // Default Walls on borders
                if (r === 0 || r === 10 || c === 0 || c === 10) row.push(1);
                else row.push(0);
            }
            map.push(row);
        }

        // Open Doors (Default: All sides)
        // Check Global Edges to close them or decorate

        // North (Top)
        if (gridY === 0) {
            // Edge of world. User Request: "Row of Windows"
            for (let c = 1; c < 10; c++) map[0][c] = 2; // 2 = Window
        } else {
            map[0][5] = 0; // Open Door
        }

        // South (Bottom)
        if (gridY === this.height - 1) {
            for (let c = 1; c < 10; c++) map[10][c] = 2; // Window
        } else {
            map[10][5] = 0; // Open Door
        }

        // West (Left)
        if (gridX === 0) {
            for (let r = 1; r < 10; r++) map[r][0] = 2; // Window
        } else {
            map[5][0] = 0; // Open Door
        }

        // East (Right)
        if (gridX === this.width - 1) {
            for (let r = 1; r < 10; r++) map[r][10] = 2; // Window
        } else {
            map[5][10] = 0; // Open Door
        }

        return {
            room_id: id,
            biome: biome,
            collision_map: map,
            obstacles: [],
            enemies: [],
            objects: []
        };
    }

    private populateReception(room: Room) {
        room.objects.push({ x: 5, y: 2, id: 'wb_start', type: 'readable', sprite_key: 'wall', text: 'Floor 1. Find the Blue Keycard to access the Elevator.' });
    }

    private populateKeyRoom(room: Room, keyType: ItemType) {
        room.enemies.push(this.createEnemy('manager', 5, 5));
        room.objects.push({ x: 5, y: 8, id: 'key', type: 'pickup', sprite_key: 'key_blue', itemType: keyType }); // Barrier Key
    }

    private populateRedKeyRoom(room: Room) {
        room.enemies.push(this.createEnemy('printer', 5, 5));
        room.objects.push({ x: 5, y: 5, id: 'key_red', type: 'pickup', sprite_key: 'key_red', itemType: 'key_red' }); // Elevator Key
    }

    private populateGoalRoom(room: Room) {
        room.enemies.push(this.createEnemy('printer', 3, 3));
        room.enemies.push(this.createEnemy('printer', 7, 3));

        // Barrier blocking the elevator
        room.objects.push({ x: 5, y: 6, id: 'barrier', type: 'barrier', sprite_key: 'wall', text: 'Security Barrier' }); // Sprite? Wall for now.

        // Elevator
        room.objects.push({ x: 5, y: 4, id: 'elevator', type: 'elevator', sprite_key: 'door', text: '[ELEVATOR] Needs MacGuffin & Red Key.' });
    }

    private populateMacGuffinRoom(room: Room, name: string) {
        room.enemies.push(this.createEnemy('roomba', 4, 4));
        // Check if name contains 'Stapler' etc for sprite?
        let sprite = 'consumable';
        if (name.includes('Stapler')) sprite = 'weapon'; // Reuse weapon icon

        room.objects.push({ x: 5, y: 5, id: 'macguffin', type: 'pickup', sprite_key: sprite, itemType: name });
    }

    private populateRandomRoom(room: Room) {
        // Special Room Chance: Meeting Room (10%)
        if (this.rng() < 0.1) {
            this.populateMeetingRoom(room);
            return;
        }

        // Difficulty Logic: Count = MIN(12, MAX(2, FLOOR(TowerLevel * 0.4) + 2))
        const count = Math.min(12, Math.max(2, Math.floor(this.towerLevel * 0.4) + 2));

        let spawned = 0;
        let attempts = 0;
        while (spawned < count && attempts < 20) {
            const tx = Math.floor(this.rng() * 9) + 1; // 1-9
            const ty = Math.floor(this.rng() * 9) + 1;

            // Basic overlap check (very simple)
            if (room.enemies.some(e => e.x === tx && e.y === ty)) {
                attempts++;
                continue;
            }

            // Type Selection
            // Min Tier: FLOOR(Tower / 5) + 1. Max Tier: Tower + 1.
            // Simplified: Just pick random for now.
            const types: EnemyType[] = ['intern', 'roomba', 'manager', 'printer'];
            const type = types[Math.floor(this.rng() * types.length)];

            room.enemies.push(this.createEnemy(type, tx, ty));
            spawned++;
        }

        // Vending
        if (this.rng() < 0.2) {
            room.objects.push({ x: 1, y: 1, id: `vending_${room.room_id}`, type: 'vending', sprite_key: 'vending', cost: 5 });
        }
        // Decoration: Plants (Coverage 10%)
        let decorAttempts = 0;
        while (decorAttempts < 5) {
            const rx = Math.floor(this.rng() * 9) + 1;
            const ry = Math.floor(this.rng() * 9) + 1;

            // Allow only if empty AND not blocking a door
            // Door Positions: (5,0), (5,10), (0,5), (10,5)
            // Critical Path Buffer: (5,1), (5,9), (1,5), (9,5)
            const isBlockingDoor = (rx === 5 && (ry <= 1 || ry >= 9)) ||
                (ry === 5 && (rx <= 1 || rx >= 9));

            if (!room.objects.some(o => o.x === rx && o.y === ry) &&
                !room.enemies.some(e => e.x === rx && e.y === ry) &&
                !isBlockingDoor) {

                // Add Plant or Desk or Water Cooler
                if (this.rng() < 0.3) {
                    const roll = this.rng();
                    let key = 'obstacle_plant';
                    let type = 'desk'; // Default blocking

                    if (roll < 0.4) {
                        key = 'desk';
                        type = 'desk';
                    }
                    else if (roll < 0.5) {
                        key = 'water_cooler';
                        type = 'water_cooler';
                    }

                    room.objects.push({ x: rx, y: ry, id: `obst_${rx}_${ry}`, type: type, sprite_key: key }); // Type desk for blocking?
                    // Update collision map? Decoration is blocking?
                    // Currently GameScene renderRoom doesn't update collision map dynamically based on objects unless we do it here.
                    // But InteractionSystem.handleBump checks objects.
                    // A plant should be blocking. 'desk' type blocks.
                }
            }
            decorAttempts++;
        }
    }


    private populateMeetingRoom(room: Room) {
        room.objects.push({
            x: 4, y: 4,
            width: 3, height: 2,
            id: `meeting_table_${room.room_id}`,
            type: 'desk',
            sprite_key: 'obstacle_meeting_table'
        });

        room.enemies.push(this.createEnemy('manager', 7, 4));
        room.enemies.push(this.createEnemy('intern', 4, 3));
        room.enemies.push(this.createEnemy('intern', 4, 6));

        room.objects.push({ x: 2, y: 0, width: 2, height: 1, id: `wb_${room.room_id}`, type: 'readable', sprite_key: 'whiteboard', text: 'Q3 Synergies: DOWN. Coffee Budget: UP.' });
    }

    private createEnemy(type: EnemyType, x: number, y: number): Enemy {
        const stats = {
            'intern': { hp: 10, maxHp: 10, damage: 2 },
            'roomba': { hp: 25, maxHp: 25, damage: 5 },
            'manager': { hp: 15, maxHp: 15, damage: 3 },
            'printer': { hp: 30, maxHp: 30, damage: 4 }
        };
        const s = stats[type];
        return {
            id: `enemy_${Math.random()}`,
            type: type,
            x: x,
            y: y,
            hp: s.hp,
            maxHp: s.maxHp,
            damage: s.damage,
            aiState: 'idle'
        };
    }
}
