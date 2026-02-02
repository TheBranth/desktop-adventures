import { GameState } from '../types/World';

export class SaveManager {
    private static STORAGE_KEY = 'desktop_adventures_save_v1';

    public static saveGame(state: GameState): boolean {
        try {
            const data = JSON.stringify(state);
            localStorage.setItem(this.STORAGE_KEY, data);
            // console.log("Game Saved.");
            return true;
        } catch (e) {
            console.error("Failed to save game:", e);
            return false;
        }
    }

    public static loadGame(): GameState | null {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return null;
            return JSON.parse(data) as GameState;
        } catch (e) {
            console.error("Failed to load game:", e);
            return null;
        }
    }

    public static hasSave(): boolean {
        return !!localStorage.getItem(this.STORAGE_KEY);
    }

    public static clearSave() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}

export interface MetaState {
    currency: number; // Stock Options / Meta Currency
    unlocks: string[]; // IDs of permanent upgrades
    stats: {
        totalRuns: number;
        enemiesDefeated: number;
        highestFloor: number;
    }
}

export class MetaSaveManager {
    private static META_KEY = 'desktop_adventures_meta_v1';

    public static getInitialState(): MetaState {
        return {
            currency: 0,
            unlocks: [],
            stats: {
                totalRuns: 0,
                enemiesDefeated: 0,
                highestFloor: 0
            }
        };
    }

    public static saveMeta(state: MetaState): boolean {
        try {
            localStorage.setItem(this.META_KEY, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error("Failed to save meta:", e);
            return false;
        }
    }

    public static loadMeta(): MetaState {
        try {
            const data = localStorage.getItem(this.META_KEY);
            if (!data) return this.getInitialState();
            return { ...this.getInitialState(), ...JSON.parse(data) }; // Merge to ensure new fields exists
        } catch (e) {
            console.error("Failed to load meta:", e);
            return this.getInitialState();
        }
    }

    public static addCurrency(amount: number) {
        const state = this.loadMeta();
        state.currency += amount;
        this.saveMeta(state);
    }

    public static unlockItem(itemId: string): boolean {
        const state = this.loadMeta();
        if (state.unlocks.includes(itemId)) return false;
        state.unlocks.push(itemId);
        return this.saveMeta(state);
    }
}
