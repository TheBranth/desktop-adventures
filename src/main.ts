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
