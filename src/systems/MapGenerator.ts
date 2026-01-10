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

        // Place Lock (Adjacent to Goal for simplicity, or on path)
        // Let's pick a neighbor of Goal that is reachable
        // For simple topology, we mark the connection entering Goal as locked. 
        // We will designate a "Lock Room" that connects to the Goal.
        // Ideally, Lock Room is just the Goal's neighbor on the path.
        // For now, let's just mark the Goal Room as needing a key to ENTER.
        // Or strictly follow spec: "Select a coordinate [lX, lY] adjacent to the Goal... Mark connection to Goal as LOCKED_DOOR."

        // We will generate the grid first.
        const rooms: { [key: string]: Room } = {};
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                rooms[`${x}_${y}`] = this.createRoom(`${x}_${y}`, 'office');
            }
        }

        // Populate Content

        // Start Room
        this.populateReception(rooms[`${startNode.x}_${startNode.y}`]);

        // Key Room
        this.populateKeyRoom(rooms[`${keyNode.x}_${keyNode.y}`], 'key_blue');

        // Goal Room
        this.populateGoalRoom(rooms[`${goalNode.x}_${goalNode.y}`]);

        // Remaining Rooms (Flood Fill logic simplified: just populate all valid coords)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const id = `${x}_${y}`;
                // Skip if Start, Key, or Goal (already populated)
                if ((x === startNode.x && y === startNode.y) ||
                    (x === keyNode.x && y === keyNode.y) ||
                    (x === goalNode.x && y === goalNode.y)) continue;

                this.populateRandomRoom(rooms[id]);
            }
        }

        console.log(`Map Generated. Start: [${startNode.x},${startNode.y}], Key: [${keyNode.x},${keyNode.y}], Goal: [${goalNode.x},${goalNode.y}]`);

        return {
            currentRoomId: `${startNode.x}_${startNode.y}`,
            playerX: 5,
            playerY: 5,
            hp: 20, // Spec: 20
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

    private createRoom(id: string, biome: string): Room {
        // Create 11x11 Grid
        const map: number[][] = [];
        for (let r = 0; r < 11; r++) {
            const row: number[] = [];
            for (let c = 0; c < 11; c++) {
                if (r === 0 || r === 10 || c === 0 || c === 10) row.push(1);
                else row.push(0);
            }
            map.push(row);
        }

        // Open Doors (All sides for open map)
        map[0][5] = 0; map[10][5] = 0; map[5][0] = 0; map[5][10] = 0;

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
        room.objects.push({ x: 5, y: 8, id: 'key', type: 'pickup', sprite_key: 'key_blue', itemType: keyType });
    }

    private populateGoalRoom(room: Room) {
        room.enemies.push(this.createEnemy('printer', 3, 3));
        room.enemies.push(this.createEnemy('printer', 7, 3));
        room.objects.push({ x: 5, y: 5, id: 'elevator', type: 'readable', sprite_key: 'door', text: '[ELEVATOR] Needs Blue Keycard.' });
        // Logic for win condition will be in InteractionSystem
    }

    private populateRandomRoom(room: Room) {
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
    }

    private createEnemy(type: EnemyType, x: number, y: number): Enemy {
        const stats = {
            'intern': { hp: 10, maxHp: 10, damage: 2 },
            'roomba': { hp: 999, maxHp: 999, damage: 5 },
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
