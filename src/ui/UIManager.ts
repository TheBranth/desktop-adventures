export class UIManager {
    private static instance: UIManager;

    // Cache DOM elements
    private hpBar: HTMLElement | null;
    private burnoutBar: HTMLElement | null;
    private messageLog: HTMLElement | null;

    private constructor() {
        this.hpBar = document.getElementById('hp-bar');
        this.burnoutBar = document.getElementById('burnout-bar');
        this.messageLog = document.getElementById('message-log');
    }

    public static getInstance(): UIManager {
        if (!UIManager.instance) {
            UIManager.instance = new UIManager();
        }
        return UIManager.instance;
    }

    public updateStats(hp: number, maxHp: number, burnout: number) {
        if (this.hpBar) {
            const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
            this.hpBar.style.width = `${hpPercent}%`;
        }
        if (this.burnoutBar) {
            this.burnoutBar.style.width = `${Math.max(0, Math.min(100, burnout))}%`;
            // Change color based on stage?
            if (burnout >= 50) this.burnoutBar.style.backgroundColor = 'purple';
            else this.burnoutBar.style.backgroundColor = 'blue';
        }
    }

    public log(message: string) {
        if (this.messageLog) {
            const p = document.createElement('p');
            p.className = 'log-entry';
            // Simple timestamp mock
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            p.innerHTML = `<span style="color:#666; font-size:10px; margin-right:5px;">${time}</span>${message}`;
            this.messageLog.appendChild(p);
            // Auto scroll
            this.messageLog.scrollTop = this.messageLog.scrollHeight;
        }
    }
}
