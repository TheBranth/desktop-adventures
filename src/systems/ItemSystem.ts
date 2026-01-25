import { GameState } from '../types/World';
import { UIManager } from '../ui/UIManager';

export interface ItemDef {
    id: string;
    name: string;
    description: string;
    icon_color: string; // Placeholder for now, later use sprites
    type: 'consumable' | 'key' | 'weapon';
    effect?: (state: GameState, ui: UIManager) => void;
}

export const ITEM_DATABASE: Record<string, ItemDef> = {
    'coffee': {
        id: 'coffee',
        name: 'Stale Coffee',
        description: 'Lukewarm caffeine. Heals 20 HP, -20 Burnout.',
        icon_color: '#6f4e37',
        type: 'consumable',
        effect: (state, ui) => {
            state.hp = Math.min(state.maxHp, state.hp + 20);
            state.burnout = Math.max(0, state.burnout - 20);
            ui.log("Slurped some coffee. Feeling jittery but alive.");
        }
    },
    'consumable': { // Mapping for generic 'consumable' from map gen
        id: 'consumable',
        name: 'Stale Coffee',
        description: 'Lukewarm caffeine. Heals 20 HP, -20 Burnout.',
        icon_color: '#6f4e37',
        type: 'consumable', // Recursive type mapping?
        effect: (state, ui) => {
            state.hp = Math.min(state.maxHp, state.hp + 20);
            state.burnout = Math.max(0, state.burnout - 20);
            ui.log("Slurped some coffee.");
        }
    },
    'id_card': {
        id: 'id_card',
        name: 'Access Card',
        description: 'Standard issue. Opens generic doors.',
        icon_color: '#ffffff',
        type: 'key'
    },
    'key_blue': {
        id: 'key_blue',
        name: 'Blue Keycard',
        description: 'Opens Level 1 Security Doors.',
        icon_color: '#0000ff',
        type: 'key'
    },
    'stapler': {
        id: 'stapler',
        name: 'Red Stapler',
        description: 'Good for throwing. +5 Attack.',
        icon_color: '#ff0000',
        type: 'weapon'
    },
    'weapon': {
        id: 'weapon',
        name: 'Red Stapler',
        description: 'Good for throwing. +5 Attack.',
        icon_color: '#ff0000',
        type: 'weapon'
    }
};

export class ItemSystem {
    static useItem(itemId: string, state: GameState, ui: UIManager): boolean {
        const item = ITEM_DATABASE[itemId];
        if (!item) return false;

        if (item.type === 'consumable' && item.effect) {
            item.effect(state, ui);
            // Remove from inventory
            const idx = state.inventory.indexOf(itemId);
            if (idx > -1) state.inventory.splice(idx, 1);
            return true;
        }

        ui.log(`Can't use ${item.name} right now.`);
        return false;
    }
}
