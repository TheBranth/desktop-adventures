export class UIManager {
    private static instance: UIManager;

    // Cache DOM elements
    private hpBar: HTMLElement | null;
    private burnoutBar: HTMLElement | null;
    private messageLog: HTMLElement | null;
    private minimapGrid: HTMLElement | null;

    private constructor() {
        this.hpBar = document.getElementById('hp-bar');
        this.burnoutBar = document.getElementById('burnout-bar');
        this.messageLog = document.getElementById('message-log');
        this.minimapGrid = document.getElementById('minimap-grid');
        this.initMinimap();
    }

    private initMinimap() {
        if (!this.minimapGrid) return;
        this.minimapGrid.innerHTML = '';
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const cell = document.createElement('div');
                cell.className = 'map-cell unknown';
                cell.id = `map-${x}_${y}`;
                this.minimapGrid.appendChild(cell);
            }
        }
    }

    public static getInstance(): UIManager {
        if (!UIManager.instance) {
            UIManager.instance = new UIManager();
        }
        return UIManager.instance;
    }

    public updateStats(hp: number, maxHp: number, burnout: number, credits: number) {
        if (this.hpBar) {
            const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
            this.hpBar.style.width = `${hpPercent}%`;
        }

        const hpVal = document.getElementById('hp-value');
        if (hpVal) {
            hpVal.textContent = `${hp}/${maxHp}`;
        }

        if (this.burnoutBar) {
            this.burnoutBar.style.width = `${Math.max(0, Math.min(100, burnout))}%`;
            if (burnout >= 50) this.burnoutBar.style.backgroundColor = 'purple';
            else this.burnoutBar.style.backgroundColor = 'blue';
        }

        const burnVal = document.getElementById('burnout-value');
        if (burnVal) {
            burnVal.textContent = `${burnout}%`;
            burnVal.style.color = burnout >= 80 ? '#FF5555' : '#CCCCCC';
        }

        const credVal = document.getElementById('credits-value');
        if (credVal) {
            credVal.textContent = `¥${credits}`;
        }

        const headerStats = document.getElementById('header-stats');
        if (headerStats) {
            headerStats.textContent = `HP: ${hp}/${maxHp} | Burnout: ${burnout}%`;
            headerStats.style.fontSize = '12px';
            headerStats.style.color = '#aaa';
            headerStats.style.marginTop = '4px';
        }
    }

    public updateMinimap(visited: string[], currentRoomId: string) {
        if (!this.minimapGrid) return;

        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const id = `${x}_${y}`;
                const cell = document.getElementById(`map-${id}`);
                if (!cell) continue;

                cell.className = 'map-cell';

                if (id === currentRoomId) {
                    cell.classList.add('current');
                } else if (visited.includes(id)) {
                    cell.classList.add('visited');
                } else {
                    cell.classList.add('unknown');
                }
            }
        }
    }

    public onItemClick: ((itemId: string, index: number) => void) | null = null;

    private getItemIconPath(id: string): string {
        // Map Item IDs to SVG Paths
        // Note: These paths are relative to web root (public) or handled by Vite?
        // Since we imported them in BootScene as 'src/assets/...', we can reference them directly if they are in public or built.
        // Vite handles 'src/assets' imports. 
        // For DOM IMG tags, we should use the URL. 
        // In dev: /src/assets/items/...
        const basePath = '/src/assets/items/';

        switch (id) {
            case 'coffee': case 'consumable': return `${basePath}coffee.svg`;
            case 'id_card': return `${basePath}pto_form.svg`;
            case 'stapler': return `${basePath}red_stapler.svg`;
            case 'weapon': return `${basePath}newspaper.svg`;
            case 'key_blue': return `${basePath}keycard_blue.svg`;
            case 'key_red': return `${basePath}keycard_red.svg`;
            case 'granola_bar': return `${basePath}granola_bar.svg`;
            case 'mint': return `${basePath}mint.svg`;
            case 'vitamin_pill': return `${basePath}vitamin_pill.svg`;
            case 'macguffin': return `${basePath}floppy.svg`;
            default: return ''; // No icon
        }
    }

    public updateInventory(inventory: string[]) {
        const grid = document.getElementById('inventory-grid');
        if (!grid) return;

        // Clear existing slots
        grid.innerHTML = '';

        // Generate slots for items
        inventory.forEach((itemId, index) => {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.style.width = '100%';
            slot.style.aspectRatio = '1';
            slot.style.background = '#2A2A2A';
            slot.style.border = '1px solid var(--border-color)';
            slot.style.borderRadius = '8px';
            slot.style.display = 'flex';
            slot.style.alignItems = 'center';
            slot.style.justifyContent = 'center';
            slot.style.cursor = 'pointer';
            slot.title = itemId;

            const iconPath = this.getItemIconPath(itemId);
            if (iconPath) {
                const img = document.createElement('img');
                img.src = iconPath;
                img.style.width = '80%';
                img.style.height = '80%';
                img.style.objectFit = 'contain';
                slot.appendChild(img);
            } else {
                // Fallback to text/emoji if path missing?
                const div = document.createElement('div');
                div.textContent = '📦';
                div.style.fontSize = '24px';
                slot.appendChild(div);
            }

            slot.onclick = () => {
                if (this.onItemClick) this.onItemClick(itemId, index);
            };

            grid.appendChild(slot);
        });
    }

    public log(message: string) {
        if (this.messageLog) {
            const p = document.createElement('p');
            p.className = 'log-entry';
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            p.innerHTML = `<span style="color:#666; font-size:10px; margin-right:5px;">${time}</span>${message}`;
            this.messageLog.appendChild(p);
            this.messageLog.scrollTop = this.messageLog.scrollHeight;
        }
    }
}
