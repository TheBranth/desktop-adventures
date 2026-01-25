export type EnemyType = 'intern' | 'roomba' | 'manager' | 'printer';
export type ItemType = 'weapon' | 'consumable' | 'key_blue' | 'key_red' | 'pto_form';
export type AIState = 'idle' | 'chase' | 'patrol' | 'alert' | 'stunned';

export interface Enemy {
    id: string;
    type: EnemyType;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    damage: number;
    aiState: AIState;
    // For patrol logic
    patrolDir?: { x: number, y: number };
}

export interface InteractionObject {
    id: string;
    type: string; // 'pickup', 'vending', 'desk', 'whiteboard', 'server'
    x: number;
    y: number;
    width?: number; // For multi-tile objects
    height?: number;
    sprite_key: string;
    // Item properties
    itemType?: string;
    effect?: string; // 'heal', 'damage', 'unlock'
    value?: number; // HP heal amount, or Damage amount
    range?: number; // Weapon range
    // Container properties
    cost?: number; // Vending machine cost
    loot_table?: { item: ItemType, chance: number }[];
    // Text properties
    text?: string; // Whiteboard text
}

export interface Room {
    room_id: string; // "X_Y"
    biome: string;
    collision_map: number[][]; // 11x11 grid. 0=Walkable, 1=Wall, 2=Hazard
    obstacles: { x: number; y: number; sprite_key: string }[];
    enemies: Enemy[];
    objects: InteractionObject[];
}

export interface GameState {
    currentRoomId: string;
    playerX: number;
    playerY: number;
    hp: number;
    maxHp: number;
    burnout: number; // 0-100
    inventory: string[];
    credits: number; // Score/Currency
    worldMap: { [key: string]: Room }; // Map room_id to Room data
    // Engine Room Specs
    tower_level: number;
    global_flags: { [key: string]: boolean };
    visited_rooms: string[];
}
