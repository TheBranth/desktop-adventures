import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        assetsDir: 'assets',
        sourcemap: false, // Save memory by not generating sourcemaps
        assetsInlineLimit: 0, // Reduce JS heap by loading assets as files
        target: 'esnext',
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser'], // Split phaser into a separate chunk
                },
            },
        },
    },
});
