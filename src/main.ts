import './style.css';
import Phaser from 'phaser'; // Import standard Phaser
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { StartScreen } from './scenes/StartScreen';
import { GameOverScene } from './scenes/GameOverScene';
import { BodegaScene } from './scenes/BodegaScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game-container',
        width: '100%',
        height: '100%',
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [BootScene, StartScreen, GameScene, GameOverScene, BodegaScene]
};

// Create the game instance
// Mobile Controls helper removed (D-Pad deprecated in Phase 9)

document.addEventListener('DOMContentLoaded', () => {
    // Phase 9: Mobile Dock Wiring

    const resetDockActive = () => {
        document.querySelectorAll('.dock-btn').forEach(btn => btn.classList.remove('active'));
    };

    // 0. Backdrop Click to Close (Shared)
    document.addEventListener('click', (e) => {
        const isInv = document.body.classList.contains('mobile-inventory-open');
        const isLog = document.body.classList.contains('mobile-logs-open');
        const isMap = document.body.classList.contains('mobile-map-open');

        if (isInv || isLog || isMap) {
            const sidebar = document.getElementById('sidebar');
            const btnInv = document.getElementById('btn-inv');
            const btnHome = document.getElementById('btn-dock-home'); // Log button
            const btnMap = document.getElementById('btn-dock-map');

            const target = e.target as Node;

            // If click is outside sidebar AND outside the active toggle buttons
            if (sidebar && !sidebar.contains(target) &&
                btnInv && !btnInv.contains(target) &&
                btnHome && !btnHome.contains(target) &&
                btnMap && !btnMap.contains(target)) {

                document.body.classList.remove('mobile-inventory-open');
                document.body.classList.remove('mobile-logs-open');
                document.body.classList.remove('mobile-map-open');

                // Reset Active
                resetDockActive();
                const btnMain = document.getElementById('btn-dock-main');
                if (btnMain) btnMain.classList.add('active');
            }
        }
    });

    // 1. Inventory Toggle
    const btnInv = document.getElementById('btn-inv');
    if (btnInv) {
        btnInv.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();

            // Close Logs if open
            document.body.classList.remove('mobile-logs-open');
            const isOpen = document.body.classList.toggle('mobile-inventory-open');

            resetDockActive();
            if (isOpen) {
                btnInv.classList.add('active');
            } else {
                document.getElementById('btn-dock-main')?.classList.add('active');
            }
        });
    }

    // 2. Log Toggle (btn-dock-home)
    const btnHome = document.getElementById('btn-dock-home');
    if (btnHome) {
        btnHome.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();

            // Close Inv if open
            document.body.classList.remove('mobile-inventory-open');
            const isOpen = document.body.classList.toggle('mobile-logs-open');

            resetDockActive();
            if (isOpen) {
                btnHome.classList.add('active');
            } else {
                document.getElementById('btn-dock-main')?.classList.add('active');
            }
        });
    }

    // 3. Settings / Menu (Top Right) -> Boss Key behavior?
    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            // Simulate Escape for Boss Menu
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
    }

    // 4. Dock Main (Center) -> Wait / Interact
    const btnMain = document.getElementById('btn-dock-main');
    if (btnMain) {
        btnMain.addEventListener('click', (e) => {
            e.preventDefault();

            // Close other menus
            document.body.classList.remove('mobile-inventory-open');
            document.body.classList.remove('mobile-logs-open');
            resetDockActive();
            btnMain.classList.add('active');

            // Trigger Wait
            if ((window as any).gameScene) {
                (window as any).gameScene.playerWait();
            }
        });
    }

    // 5. Map Toggle
    const btnMap = document.getElementById('btn-dock-map');
    if (btnMap) {
        btnMap.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();

            // Close others
            document.body.classList.remove('mobile-inventory-open');
            document.body.classList.remove('mobile-logs-open');

            const isOpen = document.body.classList.toggle('mobile-map-open');

            resetDockActive();
            if (isOpen) {
                btnMap.classList.add('active');
            } else {
                document.getElementById('btn-dock-main')?.classList.add('active');
            }
        });
    }

    // Update backdrop click to include map check
    // Note: The backdrop listener (0.) handles "Shared" clicks.
    // It checks 'mobile-inventory-open' OR 'mobile-logs-open'.
    // We need to update it to check map too, OR just update the class removal logic.
    // Actually, let's just make the backdrop listener more generic in a separate pass or rely on the user tapping the map button again.
    // Wait, the backdrop listener explicitly checks class names. I should update it.
});

const game = new Phaser.Game(config);

// Boss Key Event Listener
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const overlay = document.getElementById('boss-overlay');
        if (overlay) {
            const isVisible = overlay.style.display === 'block';
            overlay.style.display = isVisible ? 'none' : 'block';

            // Toggle Game Pause
            if (!isVisible) {
                game.loop.sleep();
            } else {
                game.loop.wake();
            }
        }
    }
});
