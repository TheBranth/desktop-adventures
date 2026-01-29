import './style.css';
import Phaser from 'phaser'; // Import standard Phaser
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { StartScreen } from './scenes/StartScreen';
import { GameOverScene } from './scenes/GameOverScene';

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
    scene: [BootScene, StartScreen, GameScene, GameOverScene]
};

// Create the game instance
// Mobile Controls
const bindControl = (id: string, key: string) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    const triggerKey = (type: 'keydown' | 'keyup') => {
        window.dispatchEvent(new KeyboardEvent(type, {
            code: key,
            key: key,
            bubbles: true
        }));
    };

    btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling/zoom
        triggerKey('keydown');
    });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        triggerKey('keyup');
    });

    // Mouse fallback for testing on desktop
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        triggerKey('keydown');
    });
    btn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        triggerKey('keyup');
    });
};

document.addEventListener('DOMContentLoaded', () => {
    bindControl('btn-up', 'ArrowUp');
    bindControl('btn-down', 'ArrowDown');
    bindControl('btn-left', 'ArrowLeft');
    bindControl('btn-right', 'ArrowRight');
    bindControl('btn-right', 'ArrowRight');
    bindControl('btn-action', 'Space');

    // Backpack Toggle (Mobile)
    const btnInv = document.getElementById('btn-inv');
    if (btnInv) {
        const toggleInv = (e: Event) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent game input
            document.body.classList.toggle('mobile-inventory-open');
        };
        btnInv.addEventListener('touchstart', toggleInv);
        btnInv.addEventListener('mousedown', toggleInv);
    }
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
