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
            visited_rooms: [`${startNode.x}_${startNode.y}`],
            floor: 1 // Default start floor
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
        // Create 11x11 Grid or dynamic? 
        // The spec implies Rooms are still 11x11 internally, but the Minimap/World Grid size changes?
        // "Level 1 (Onboarding): 5x5 Grid (25 Rooms)."
        // This implies the world map is 5x5 rooms. Each room is likely still 11x11 tiles.
        // If the rooms scale too, that would be weird for sprites.
        // Assuming Room Size is constant (11x11 tiles), but World Map Size is dynamic (width x height).

        // Wait, the user said "5x5 Grid (25 Rooms)".
        // My MapGenerator constructor takes width/height which are ROOM counts.
        // `createRoom` generates the TILE map for a single room.
        // So `createRoom` stays 11x11 (unless we want massive rooms, but 11x11 is fine).
        // Let's verify the Door Logic uses 10/11 which is Room Size.
        // Yes, createRoom uses 11x11.

        // However, I need to check the "Edge" logic.
        // `if (gridY === 0)` -> Top of World.
        // `if (gridY === this.height - 1)` -> Bottom of World.
        // This relies on `this.height` which IS the world size (e.g. 5).
        // So `createRoom` is already mostly correct IF it uses `this.width` / `this.height` for boundary checks.

        // Let's re-read the code I'm replacing.
        // It checks `gridX === this.width - 1`.
        // So as long as `this.width` is 5 (for level 1), it correctly identifying the rightmost room as an edge.
        // The internal room size (11x11) seems constant.

        // CONFIRMATION:
        // `map[r][10]` where 10 is the index (11th tile).
        // This is safe if Rooms are always 11x11.
        // I will keep Room Size 11x11 constant for now.

        const ROOM_SIZE = 11;
        const CENTER = Math.floor(ROOM_SIZE / 2); // 5

        const map: number[][] = [];
        for (let r = 0; r < ROOM_SIZE; r++) {
            const row: number[] = [];
            for (let c = 0; c < ROOM_SIZE; c++) {
                // Default Walls on borders
                if (r === 0 || r === ROOM_SIZE - 1 || c === 0 || c === ROOM_SIZE - 1) row.push(1);
                else row.push(0);
            }
            map.push(row);
        }

        // Open Doors (Default: All sides)
        // Check Global Edges to close them or decorate

        // North (Top)
        if (gridY === 0) {
            // Edge of world. User Request: "Row of Windows"
            for (let c = 1; c < ROOM_SIZE - 1; c++) map[0][c] = 2; // 2 = Window
        } else {
            map[0][CENTER] = 0; // Open Door
        }

        // South (Bottom)
        if (gridY === this.height - 1) {
            for (let c = 1; c < ROOM_SIZE - 1; c++) map[ROOM_SIZE - 1][c] = 2; // Window
        } else {
            map[ROOM_SIZE - 1][CENTER] = 0; // Open Door
        }

        // West (Left)
        if (gridX === 0) {
            for (let r = 1; r < ROOM_SIZE - 1; r++) map[r][0] = 2; // Window
        } else {
            map[CENTER][0] = 0; // Open Door
        }

        // East (Right)
        if (gridX === this.width - 1) {
            for (let r = 1; r < ROOM_SIZE - 1; r++) map[r][ROOM_SIZE - 1] = 2; // Window
        } else {
            map[CENTER][ROOM_SIZE - 1] = 0; // Open Door
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
        // Centered Whiteboard (1 tile wide).
        room.objects.push({ x: 5, y: 2, width: 1, height: 1, id: 'wb_start', type: 'readable', sprite_key: 'whiteboard', text: 'Floor 1. Find the Blue Keycard to access the Elevator.' });
    }

    private populateKeyRoom(room: Room, keyType: ItemType) {
        room.enemies.push(this.createEnemy('manager', 5, 5));
        room.objects.push({ x: 5, y: 8, id: 'key', type: 'pickup', sprite_key: 'keycard_blue', itemType: keyType }); // Barrier Key
    }

    private populateRedKeyRoom(room: Room) {
        room.enemies.push(this.createEnemy('printer', 5, 5));
        room.objects.push({ x: 5, y: 5, id: 'key_red', type: 'pickup', sprite_key: 'keycard_red', itemType: 'key_red' }); // Elevator Key
    }

    private populateGoalRoom(room: Room) {
        room.enemies.push(this.createEnemy('printer', 3, 3));
        room.enemies.push(this.createEnemy('printer', 7, 3));

        // Barrier blocking the elevator
        room.objects.push({ x: 5, y: 6, id: 'barrier', type: 'barrier', sprite_key: 'barrier', text: 'Security Barrier' });

        // Elevator
        room.objects.push({ x: 5, y: 4, id: 'elevator', type: 'elevator', sprite_key: 'elevator', text: '[ELEVATOR] Needs MacGuffin & Red Key.' });
    }

    private populateMacGuffinRoom(room: Room, name: string) {
        room.enemies.push(this.createEnemy('roomba', 4, 4));

        // Locked Door guarding the prize (assuming entry is usually from a hallway)
        // Hard to know exact entry without more context, but let's place it near the center or guarding the item.
        // Let's place it at (5,4) directly in front of the item at (5,5)
        room.objects.push({ x: 5, y: 4, id: 'door_secure', type: 'door_secure', sprite_key: 'door_secure', text: 'Secure Door' });

        // Check if name contains 'Stapler' etc for sprite?
        let sprite = 'pto_form'; // Default MacGuffin icon
        if (name.includes('Stapler')) sprite = 'red_stapler';

        room.objects.push({ x: 5, y: 5, id: 'macguffin', type: 'pickup', sprite_key: sprite, itemType: name });
    }

    private populateRandomRoom(room: Room) {
        // Special Room Chance: Meeting Room (10%)
        if (this.rng() < 0.1) {
            this.populateMeetingRoom(room);
            return;
        }

        // Validation Constants
        const MAX_RETRIES = 3;
        let validLayout = false;
        let macroLimit = 2; // Initial macro elements max

        // Element Tables
        const smallElements = [
            { type: 'desk', key: 'desk', w: 1, h: 1 },
            { type: 'water_cooler', key: 'water_cooler', w: 1, h: 1 },
            { type: 'plant', key: 'obstacle_plant', w: 1, h: 1 } // Plant acts as obstacle
        ];

        const bigElements: { type: string, key: string, w: number, h: number, isPlaceholder?: boolean }[] = [
            { type: 'desk', key: 'obstacle_meeting_table', w: 3, h: 2 },
            // Server Rack (1x2)
            { type: 'server', key: 'wall_server', w: 1, h: 2 }
        ];

        // Retry Loop
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            // clear previous failed attempts (but enemies persist? No, clear all specialized objects)
            // Note: We don't want to clear enemies if they were added by default, but here we populate enemies too.
            // Let's reset room.objects for this generated content.
            // CAUTION: If we had guaranteed objects (like key), they might be wiped? 
            // `populateRandomRoom` is called for "empty" rooms, so it's safe to start fresh relative to this method.
            // But we must preserve existing inputs if any? No, this method is the primary populater.
            room.objects = [];
            room.enemies = [];

            // 1. Enemies (Simple Random placement, soft constraint)
            // Difficulty Logic: Count = MIN(12, MAX(2, FLOOR(TowerLevel * 0.4) + 2))
            const enemyCount = Math.min(12, Math.max(2, Math.floor(this.towerLevel * 0.4) + 2));
            for (let i = 0; i < enemyCount; i++) {
                const ex = Math.floor(this.rng() * 9) + 1;
                const ey = Math.floor(this.rng() * 9) + 1;

                // Explicit Map Check
                if (this.isBlockedByMap(ex, ey, 1, 1, room.collision_map)) continue;

                // Avoid door 'immediate' zones for fairness (5,5 is safe? No, 5,0 etc)
                // Simple Overlap check with other enemies
                if (!room.enemies.some(e => e.x === ex && e.y === ey)) {
                    const types: EnemyType[] = ['intern', 'roomba', 'manager', 'printer'];
                    const type = types[Math.floor(this.rng() * types.length)];
                    room.enemies.push(this.createEnemy(type, ex, ey));
                }
            }

            // 2. Macro Elements
            const bigCount = Math.floor(this.rng() * (macroLimit + 1));
            for (let i = 0; i < bigCount; i++) {
                const el = bigElements[Math.floor(this.rng() * bigElements.length)];
                if (el.isPlaceholder && Math.random() > 0.3) continue; // Rare placeholder

                // Try placement
                for (let t = 0; t < 10; t++) {
                    const rx = Math.floor(this.rng() * 9) + 1;
                    const ry = Math.floor(this.rng() * 9) + 1;

                    // Bounds Check (11x11, 0-10)
                    if (rx + el.w > 10 || ry + el.h > 10) continue;

                    // Collision Check (Walls/Windows)
                    if (this.isBlockedByMap(rx, ry, el.w, el.h, room.collision_map)) continue;

                    // Overlap Check (Objects)
                    const rect = { x: rx, y: ry, w: el.w, h: el.h };
                    let overlaps = false;

                    // Check existing objects
                    for (const obj of room.objects) {
                        const ow = obj.width || 1;
                        const oh = obj.height || 1;
                        if (this.rectIntersect(rect, { x: obj.x, y: obj.y, w: ow, h: oh })) {
                            overlaps = true;
                            break;
                        }
                    }

                    // Check existing Enemies
                    if (!overlaps) {
                        for (const enemy of room.enemies) {
                            // Enemy is 1x1
                            if (this.rectIntersect(rect, { x: enemy.x, y: enemy.y, w: 1, h: 1 })) {
                                overlaps = true;
                                break;
                            }
                        }
                    }

                    // Check Door Buffers (Critical: Don't spawn ON door buffer)
                    const doorZones = [
                        { x: 5, y: 0, w: 1, h: 2 }, { x: 5, y: 9, w: 1, h: 2 }, // Vertical Doors
                        { x: 0, y: 5, w: 2, h: 1 }, { x: 9, y: 5, w: 2, h: 1 }  // Horizontal Doors
                    ];
                    for (const dz of doorZones) {
                        if (this.rectIntersect(rect, dz)) { overlaps = true; break; }
                    }

                    if (!overlaps) {
                        room.objects.push({
                            x: rx, y: ry, width: el.w, height: el.h,
                            id: `macro_${i}_${room.room_id}`, type: el.type, sprite_key: el.key
                        });
                        break; // Placed
                    }
                }
            }

            // 3. Micro Elements
            const smallCount = 4 + Math.floor(this.rng() * 6);
            for (let i = 0; i < smallCount; i++) {
                const el = smallElements[Math.floor(this.rng() * smallElements.length)];
                for (let t = 0; t < 10; t++) {
                    const rx = Math.floor(this.rng() * 9) + 1;
                    const ry = Math.floor(this.rng() * 9) + 1;

                    const rect = { x: rx, y: ry, w: 1, h: 1 };

                    if (this.isBlockedByMap(rx, ry, 1, 1, room.collision_map)) continue;

                    let overlaps = false;

                    // Obj Overlap
                    for (const obj of room.objects) {
                        const ow = obj.width || 1;
                        const oh = obj.height || 1;
                        if (this.rectIntersect(rect, { x: obj.x, y: obj.y, w: ow, h: oh })) {
                            overlaps = true;
                            break;
                        }
                    }

                    // Enemy Overlap
                    if (!overlaps) {
                        for (const enemy of room.enemies) {
                            if (this.rectIntersect(rect, { x: enemy.x, y: enemy.y, w: 1, h: 1 })) {
                                overlaps = true;
                                break;
                            }
                        }
                    }

                    // Door Zone Overlap
                    const doorZones = [
                        { x: 5, y: 0, w: 1, h: 2 }, { x: 5, y: 9, w: 1, h: 2 },
                        { x: 0, y: 5, w: 2, h: 1 }, { x: 9, y: 5, w: 2, h: 1 }
                    ];
                    for (const dz of doorZones) {
                        if (this.rectIntersect(rect, dz)) { overlaps = true; break; }
                    }

                    if (!overlaps) {
                        room.objects.push({ x: rx, y: ry, id: `micro_${i}_${room.room_id}`, type: el.type, sprite_key: el.key });
                        break;
                    }
                }
            }
            // Vending (Random)
            if (this.rng() < 0.2) {
                // Try place vending
                for (let t = 0; t < 10; t++) {
                    const rx = Math.floor(this.rng() * 9) + 1;
                    const ry = Math.floor(this.rng() * 9) + 1;
                    const rect = { x: rx, y: ry, w: 1, h: 1 };

                    if (this.isBlockedByMap(rx, ry, 1, 1, room.collision_map)) continue;

                    let overlaps = false;
                    for (const obj of room.objects) {
                        const ow = obj.width || 1;
                        const oh = obj.height || 1;
                        if (this.rectIntersect(rect, { x: obj.x, y: obj.y, w: ow, h: oh })) {
                            overlaps = true; break;
                        }
                    }
                    if (!overlaps) {
                        room.objects.push({ x: rx, y: ry, id: `vending_${room.room_id}`, type: 'vending', sprite_key: 'vending', cost: 5 });
                        // placed = true;
                        break;
                    }
                }
            }

            // 4. Validate
            if (this.isLayoutValid(room, room.objects)) {
                validLayout = true;
                break; // Challenge Complete!
            } else {
                console.warn(`Room ${room.room_id} generation failed validation (Attempt ${attempt}). Retrying...`);
                macroLimit = Math.max(0, macroLimit - 1); // Reduce complexity on failure
            }
        }

        if (!validLayout) {
            console.error(`Room ${room.room_id} failed to generate valid layout after retries. Clearing objects.`);
            room.objects = []; // Fallback to empty safe room
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

    // --- Procedural Generation Helpers ---

    private isBlockedByMap(x: number, y: number, w: number, h: number, map: number[][]): boolean {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                const cx = x + dx;
                const cy = y + dy;
                // Bounds check just in case
                if (cy < 0 || cy >= map.length || cx < 0 || cx >= map[0].length) return true;

                const cell = map[cy][cx];
                if (cell === 1 || cell === 2) return true;
            }
        }
        return false;
    }

    private rectIntersect(r1: { x: number, y: number, w: number, h: number }, r2: { x: number, y: number, w: number, h: number }): boolean {
        return (r1.x < r2.x + r2.w &&
            r1.x + r1.w > r2.x &&
            r1.y < r2.y + r2.h &&
            r1.y + r1.h > r2.y);
    }

    private getRoomDoors(room: Room): { x: number, y: number }[] {
        const doors: { x: number, y: number }[] = [];
        // Check standard door positions based on the collision map
        // Top (5,0)
        if (room.collision_map[0][5] === 0) doors.push({ x: 5, y: 0 });
        // Bottom (5,10)
        if (room.collision_map[10][5] === 0) doors.push({ x: 5, y: 10 });
        // Left (0,5)
        if (room.collision_map[5][0] === 0) doors.push({ x: 0, y: 5 });
        // Right (10,5)
        if (room.collision_map[5][10] === 0) doors.push({ x: 10, y: 5 });
        return doors;
    }

    private isLayoutValid(room: Room, proposedObjects: any[]): boolean {
        const doors = this.getRoomDoors(room);
        if (doors.length === 0) return true; // Should ideally check center reachability if no doors, but rooms usually have 1.

        const startNode = doors[0];
        const queue: { x: number, y: number }[] = [startNode];
        const visited = new Set<string>();
        visited.add(`${startNode.x},${startNode.y}`);

        const reachableDoors = new Set<string>();
        // Mark start door as reachable
        if (doors.some(d => d.x === startNode.x && d.y === startNode.y)) {
            reachableDoors.add(`${startNode.x},${startNode.y}`);
        }

        while (queue.length > 0) {
            const curr = queue.shift()!;

            // Check neighbors
            const neighbors = [
                { x: curr.x + 1, y: curr.y },
                { x: curr.x - 1, y: curr.y },
                { x: curr.x, y: curr.y + 1 },
                { x: curr.x, y: curr.y - 1 }
            ];

            for (const n of neighbors) {
                // Bounds
                if (n.x < 0 || n.x > 10 || n.y < 0 || n.y > 10) continue;

                const key = `${n.x},${n.y}`;
                if (visited.has(key)) continue;

                // Collision Check (Walls + Proposed Objects)

                // 1. Static Map
                if (room.collision_map[n.y][n.x] === 1 || room.collision_map[n.y][n.x] === 2) continue; // Wall or Window

                // 2. Proposed Objects
                // Treat objects as blocking rectangles
                let blocked = false;
                for (const obj of proposedObjects) {
                    const w = obj.width || 1;
                    const h = obj.height || 1;
                    // Check if node 'n' is inside object rect
                    if (n.x >= obj.x && n.x < obj.x + w &&
                        n.y >= obj.y && n.y < obj.y + h) {
                        blocked = true;
                        break;
                    }
                }
                if (blocked) continue;

                // 3. Enemies (Optional: Treat enemies as blockers? Usually soft blockers, but for layout we care about static geometry)
                // Let's assume enemies move, so they don't block layout validity permanently.

                visited.add(key);
                queue.push(n);

                // If this is a door, mark it
                if (doors.some(d => d.x === n.x && d.y === n.y)) {
                    reachableDoors.add(key);
                }
            }
        }

        // Validate all doors are reachable
        return doors.every(d => reachableDoors.has(`${d.x},${d.y}`));
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
