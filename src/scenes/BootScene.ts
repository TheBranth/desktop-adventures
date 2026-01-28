import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load assets
        this.load.image('chars', 'assets/sprites_character_2.png');

        // Load SVGs
        // Enemies
        this.load.svg('intern', 'assets/enemy_intern.svg', { width: 32, height: 32 });
        this.load.svg('manager', 'assets/enemy_manager.svg', { width: 32, height: 32 });
        this.load.svg('printer', 'assets/enemy_printer.svg', { width: 32, height: 32 });
        this.load.svg('roomba', 'assets/enemy_roomba.svg', { width: 32, height: 32 });

        // Hero
        this.load.svg('protagonist', 'assets/protagonist_sheet.svg', { width: 96, height: 32 }); // 3 frames x 32


        // Environment
        this.load.svg('floor', 'assets/environment/floor_office.svg', { width: 32, height: 32 });
        this.load.svg('wall', 'assets/environment/wall_office.svg', { width: 32, height: 32 });
        this.load.svg('window', 'assets/environment/window_office.svg', { width: 32, height: 32 }); // Edge decoration
        this.load.svg('obstacle_plant', 'assets/environment/obstacle_plant.svg', { width: 32, height: 32 });
        this.load.svg('floor_server', 'assets/environment/floor_server.svg', { width: 32, height: 32 });
        this.load.svg('wall_server', 'assets/environment/wall_server.svg', { width: 32, height: 32 });
        this.load.svg('vending', 'assets/environment/vending.svg', { width: 32, height: 32 });
        this.load.svg('obstacle_meeting_table', 'assets/environment/obstacle_meeting_table.svg', { width: 96, height: 64 });
        this.load.svg('water_cooler', 'assets/environment/obstacle_water_cooler.svg', { width: 32, height: 32 });
        this.load.svg('desk', 'assets/environment/obstacle_desk.svg', { width: 32, height: 32 });

        // UI Icons
        this.load.svg('icon_heart', 'assets/ui/ui_icon_heart.svg', { width: 32, height: 32 });
        this.load.svg('icon_fire', 'assets/ui/ui_icon_fire.svg', { width: 32, height: 32 });
        this.load.svg('icon_coin', 'assets/ui/ui_icon_coin.svg', { width: 32, height: 32 });

        // Items
        this.load.svg('coffee', 'assets/items/coffee.svg', { width: 32, height: 32 });
        this.load.svg('consumable', 'assets/items/coffee.svg', { width: 32, height: 32 }); // Alias
        this.load.svg('key_blue', 'assets/items/keycard_blue.svg', { width: 32, height: 32 });
        this.load.svg('key_red', 'assets/items/keycard_red.svg', { width: 32, height: 32 });
        this.load.svg('stapler', 'assets/items/red_stapler.svg', { width: 32, height: 32 });
        this.load.svg('weapon', 'assets/items/newspaper.svg', { width: 32, height: 32 }); // Newspaper as weapon
        this.load.svg('macguffin', 'assets/items/floppy.svg', { width: 32, height: 32 });
        this.load.svg('id_card', 'assets/items/pto_form.svg', { width: 32, height: 32 }); // PTO Form as ID? Close enough.

        // New Consumables Mapping
        this.load.svg('granola_bar', 'assets/items/granola_bar.svg', { width: 32, height: 32 });
        this.load.svg('mint', 'assets/items/mint.svg', { width: 32, height: 32 });
        this.load.svg('vitamin_pill', 'assets/items/vitamin_pill.svg', { width: 32, height: 32 });
    }

    create() {
        // Create Textures from the "Master Sheet" for legacy if needed, or define frames for SVG sheet
        if (this.textures.exists('protagonist')) {
            const tex = this.textures.get('protagonist');
            // Frame 0: Idle
            tex.add('idle', 0, 0, 0, 32, 32);
            // Frame 1: Walk L
            tex.add('move_0', 0, 32, 0, 32, 32);
            // Frame 2: Walk R
            tex.add('move_1', 0, 64, 0, 32, 32);

            console.log('Protagonist SVG frames added.');
        } else if (this.textures.exists('chars')) {
            // ... Legacy (PNG) ...
            const tex = this.textures.get('chars');
            tex.add('idle_0', 0, 585, 45, 225, 455);
            tex.add('idle_1', 0, 1020, 45, 300, 455);
            tex.add('move_0', 0, 1185, 560, 280, 440);
            tex.add('move_1', 0, 1485, 560, 270, 440);
            tex.add('attack_0', 0, 505, 1075, 425, 415);
        }

        // Generate Placeholder Patterns (Fallback for Environment)
        const gfx = this.make.graphics({ x: 0, y: 0 });

        // Helper to generate if missing
        const createPlaceholder = (key: string, color: number, shape: 'rect' | 'circle' = 'rect') => {
            if (!this.textures.exists(key)) {
                gfx.fillStyle(color);
                if (shape === 'rect') gfx.fillRect(4, 4, 24, 24);
                else gfx.fillCircle(16, 16, 12);
                gfx.generateTexture(key, 32, 32);
                gfx.clear();
            }
        };

        // Environment
        createPlaceholder('wall', 0x444444);
        createPlaceholder('vending', 0x00ffff);
        // Desks & Coolers now have assets!

        // Items
        createPlaceholder('key_blue', 0x0000ff);
        createPlaceholder('key_red', 0xff0000);
        createPlaceholder('weapon', 0xdddddd);
        createPlaceholder('consumable', 0x6f4e37, 'circle');
        createPlaceholder('macguffin', 0xffff00); // New

        // Enemies
        createPlaceholder('intern', 0x00ff00);
        createPlaceholder('roomba', 0xff0000, 'circle');
        createPlaceholder('manager', 0x0000ff);
        createPlaceholder('printer', 0x888888);

        console.log('BootScene created. Starting StartScreen...');
        this.scene.start('StartScreen');
    }
}
