import Phaser from 'phaser';

export enum GameEvents {
    PLAYER_MOVED = 'PLAYER_MOVED',
    STATS_CHANGE = 'STATS_CHANGE',
    LOG_MESSAGE = 'LOG_MESSAGE',
    INVENTORY_UPDATE = 'INVENTORY_UPDATE',
    MINIMAP_UPDATE = 'MINIMAP_UPDATE',
    ROOM_ENTER = 'ROOM_ENTER',
    DAMAGE_DEALT = 'DAMAGE_DEALT'
}

type EventCallback = (data: any) => void;

export class EventManager {
    private static instance: EventManager;
    private emitter: Phaser.Events.EventEmitter;

    private constructor() {
        this.emitter = new Phaser.Events.EventEmitter();
    }

    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    public on(event: GameEvents | string, callback: EventCallback, context?: any) {
        this.emitter.on(event, callback, context);
    }

    public off(event: GameEvents | string, callback: EventCallback, context?: any) {
        this.emitter.off(event, callback, context);
    }

    public emit(event: GameEvents | string, data?: any) {
        this.emitter.emit(event, data);
    }

    public static emit(event: GameEvents | string, data?: any) {
        EventManager.getInstance().emit(event, data);
    }

    public static on(event: GameEvents | string, callback: EventCallback, context?: any) {
        EventManager.getInstance().on(event, callback, context);
    }

    public static off(event: GameEvents | string, callback: EventCallback, context?: any) {
        EventManager.getInstance().off(event, callback, context);
    }
}
