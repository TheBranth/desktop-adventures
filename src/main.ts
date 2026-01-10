import './style.css';
import Phaser from 'phaser'; // Import standard Phaser
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [BootScene, GameScene]
};

// Create the game instance
const game = new Phaser.Game(config);

// Boss Key Event Listener
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.code === 'Space') {
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
