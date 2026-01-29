
export class AudioManager {
    private static instance: AudioManager;
    private muted: boolean = false;

    private constructor() {
        // Preload standard sounds (using data URIs or paths later)
        // For now, we'll just log or use simple beeps if possible, 
        // but typically we'd load assets here.
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    public play(key: string) {
        if (this.muted) return;
        console.log(`[Audio] Playing: ${key}`);

        // Setup for real audio later:
        // if (this.sounds[key]) this.sounds[key].play();

        // Placeholder Bip for feedback?
        // simpleBeep();
    }

    public toggleMute() {
        this.muted = !this.muted;
    }
}
