export interface InteractionObject {
    id: string;
    name: string;
    sprite_key: string;
    x: number;
    y: number;
    type: 'pickup' | 'readable' | 'switch';
    effect?: string;
    usable: boolean;
}

export interface Enemy {
    id: string;
    type: string;
    start_x: number;
    start_y: number;
    hp: number;
    state: 'idle' | 'alert' | 'stunned';
}

export interface Room {
    room_id: string; // "X_Y"
    biome: string;
    collision_map: number[][]; // 11x11 grid. 0=Walkable, 1=Wall, 2=Hazard
    obstacles: { x: number; y: number; sprite_key: string }[];
    enemies: Enemy[];
    objects: InteractionObject[];
}

export interface RoomNode {
    x: number;
    y: number;
    type: 'start' | 'end' | 'key' | 'lock' | 'normal';
    connections: RoomNode[]; // Adjacency list
}

export interface GameState {
    currentRoomId: string;
    playerX: number;
    playerY: number;
    inventory: string[];
    hp: number;
    burnout: number; // 0-100
    worldMap: { [key: string]: Room }; // Map room_id to Room data
}
