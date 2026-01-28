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
