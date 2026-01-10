import { Room, GameState } from '../types/World';

export class MapGenerator {
    // private width: number;
    // private height: number;

    constructor(_width: number, _height: number) {
        // this.width = width;
        // this.height = height;
    }

    public generateWorld(): GameState {
        // Phase 1: Mindmap (Graph)
        // const elevatorNode = this.pickStartNode();
        // Since we need simplified logic for the prototype, we'll implement a basic DFS path generator
        // instead of the complex connectivity logic first, to get something on screen.

        const rooms: { [key: string]: Room } = {};

        // Generate a 5x5 grid of rooms for the prototype (subset of 10x10)
        // We'll just activate a few random ones connected to the start for now.

        // Simple mock generation:
        // Create a horizontal hallway of 3 rooms for testing: (4,4) -> (5,4) -> (6,4)

        const startX = 4;
        const startY = 4;

        this.createTestRoom(rooms, startX, startY, 'Elevator');
        this.createTestRoom(rooms, startX + 1, startY, 'Hallway');
        this.createTestRoom(rooms, startX + 2, startY, 'MacGuffin');

        return {
            currentRoomId: `${startX}_${startY}`,
            playerX: 5, // Center of 11x11 grid
            playerY: 5,
            inventory: [],
            hp: 100,
            burnout: 0,
            worldMap: rooms
        };
    }

    // private _pickStartNode(): RoomNode {
    //     return { x: 4, y: 4, type: 'start', connections: [] };
    // }

    private createTestRoom(rooms: { [key: string]: Room }, x: number, y: number, label: string) {
        const id = `${x}_${y}`;

        // precise 11x11 grid
        // 0=Walkable, 1=Wall
        const collisionMap = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Top Wall
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Row 5 (Center Y)
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Bottom Wall
        ];

        // Add doors based on adjacency (Hardcoded for this test hallway)
        // If (4,4), Door Right
        // If (5,4), Door Left + Right
        // If (6,4), Door Left

        // Door Left: Row 5, Col 0 -> 0
        // Door Right: Row 5, Col 10 -> 0

        if (x === 4 && y === 4) { // Start
            collisionMap[5][10] = 0; // East Door
        } else if (x === 5 && y === 4) { // Hallway
            collisionMap[5][0] = 0; // West Door
            collisionMap[5][10] = 0; // East Door
        } else if (x === 6 && y === 4) { // End
            collisionMap[5][0] = 0; // West Door
        }

        rooms[id] = {
            room_id: id,
            biome: 'office',
            collision_map: collisionMap,
            obstacles: [], // TODO: Add decoration
            enemies: [], // TODO: Add generic enemy
            objects: []
        };

        if (label === 'MacGuffin') {
            rooms[id].objects.push({
                id: 'macguffin',
                name: 'Q4 Budget',
                sprite_key: 'item_paper',
                x: 5,
                y: 5,
                type: 'pickup',
                usable: true
            });
        }
    }
}
