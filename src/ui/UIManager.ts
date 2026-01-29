import { EventManager, GameEvents } from '../systems/EventManager';
import { InventoryItem } from '../types/World';

export class UIManager {
    private static instance: UIManager;

    // Cache DOM elements
    private hpBar: HTMLElement | null;
    private burnoutBar: HTMLElement | null;
    private messageLog: HTMLElement | null;
    private minimapGrid: HTMLElement | null;
    private headerStats: HTMLElement | null;
    private creditsValue: HTMLElement | null;
    private hpValue: HTMLElement | null;
    private burnoutValue: HTMLElement | null;
    // Mobile stats
    private mobileHp: HTMLElement | null;
    private mobileBurnout: HTMLElement | null;
    private mobileCredits: HTMLElement | null;

    private constructor() {
        this.hpBar = document.getElementById('hp-bar');
        this.burnoutBar = document.getElementById('burnout-bar');
        this.messageLog = document.getElementById('message-log');
        this.minimapGrid = document.getElementById('minimap-grid');
        this.headerStats = document.getElementById('header-stats');
        this.creditsValue = document.getElementById('credits-value');
        this.hpValue = document.getElementById('hp-value');
        this.burnoutValue = document.getElementById('burnout-value');

        // Mobile Header elements
        this.mobileHp = document.getElementById('m-hp');
        this.mobileBurnout = document.getElementById('m-burnout');
        this.mobileCredits = document.getElementById('m-credits');

        // this.initMinimap(9,9); // Defer to GameScene init
        this.setupEventListeners();
    }

    public static getInstance(): UIManager {
        if (!UIManager.instance) {
            UIManager.instance = new UIManager();
        }
        return UIManager.instance;
    }

    private setupEventListeners() {
        const em = EventManager.getInstance();
        em.on(GameEvents.STATS_CHANGE, (data: any) => {
            this.updateStats(data.hp, data.maxHp, data.burnout, data.credits);
        });
        em.on(GameEvents.LOG_MESSAGE, (data: any) => {
            // data can be string or object { msg: string }
            const msg = typeof data === 'string' ? data : data.msg;
            this.log(msg);
        });
        em.on(GameEvents.INVENTORY_UPDATE, (data: any) => {
            this.updateInventory(data.inventory);
        });
        em.on(GameEvents.MINIMAP_UPDATE, (data: any) => {
            this.updateMinimap(data.visited, data.current);
        });
    }

    private minimapWidth: number = 10;
    private minimapHeight: number = 10;

    public initMinimap(width: number, height: number) {
        if (!this.minimapGrid) return;

        this.minimapWidth = width;
        this.minimapHeight = height;

        this.minimapGrid.innerHTML = '';
        // Adjust grid template columns based on size to fit? 
        // Or assume CSS handles it? The CSS likely has repeat(10, ...).
        this.minimapGrid.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        this.minimapGrid.style.gridTemplateRows = `repeat(${height}, 1fr)`;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = document.createElement('div');
                cell.className = 'map-cell unknown';
                cell.id = `map-${x}_${y}`;
                this.minimapGrid.appendChild(cell);
            }
        }
    }

    public updateStats(hp: number, maxHp: number, burnout: number, credits: number) {
        if (this.hpBar) {
            const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
            this.hpBar.style.width = `${hpPercent}%`;
        }

        if (this.hpValue) {
            this.hpValue.textContent = `${hp}/${maxHp}`;
        }

        if (this.burnoutBar) {
            const b = Math.max(0, Math.min(100, burnout));
            this.burnoutBar.style.width = `${b}%`;
            if (burnout >= 50) this.burnoutBar.style.backgroundColor = '#9b59b6'; // amethyst
            else this.burnoutBar.style.backgroundColor = '#3498db'; // blue
        }

        if (this.burnoutValue) {
            this.burnoutValue.textContent = `${burnout}%`;
            this.burnoutValue.style.color = burnout >= 80 ? '#e74c3c' : '#CCCCCC';
        }

        if (this.creditsValue) {
            this.creditsValue.textContent = `¥${credits}`;
        }

        if (this.headerStats) {
            this.headerStats.textContent = `HP: ${hp}/${maxHp} | Burnout: ${burnout}%`;
            this.headerStats.style.fontSize = '12px';
            this.headerStats.style.color = '#7f8c8d';
            this.headerStats.style.marginTop = '4px';
        }

        // Update Mobile
        if (this.mobileHp) this.mobileHp.innerText = `${hp}`;
        if (this.mobileBurnout) this.mobileBurnout.innerText = `${burnout}%`;
        if (this.mobileCredits) this.mobileCredits.innerText = `${credits}`;
    }

    public updateMinimap(visited: string[], currentRoomId: string) {
        if (!this.minimapGrid) return;

        for (let y = 0; y < this.minimapHeight; y++) {
            for (let x = 0; x < this.minimapWidth; x++) {
                const id = `${x}_${y}`;
                const cell = document.getElementById(`map-${id}`);
                if (!cell) continue;

                // Reset base class
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
        const basePath = 'assets/items/';
        switch (id) {
            case 'coffee': case 'consumable': return `${basePath}coffee.svg`;
            case 'id_card': return `${basePath}pto_form.svg`; // Reusing PTO form as ID card visual for now? Or generic
            case 'stapler': return `${basePath}red_stapler.svg`;
            case 'weapon': return `${basePath}newspaper.svg`;
            case 'key_blue': return `${basePath}keycard_blue.svg`;
            case 'key_red': return `${basePath}keycard_red.svg`;
            case 'granola_bar': return `${basePath}granola_bar.svg`;
            case 'mint': return `${basePath}mint.svg`;
            case 'vitamin_pill': return `${basePath}vitamin_pill.svg`; // missing asset?
            case 'macguffin': return `${basePath}floppy.svg`;
            default: return ''; // No icon
        }
    }

    public updateInventory(inventory: InventoryItem[]) {
        const grid = document.getElementById('inventory-grid');
        if (!grid) return;

        // Clear existing slots
        grid.innerHTML = '';

        inventory.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.style.position = 'relative'; // For badges
            slot.style.width = '100%';
            slot.style.aspectRatio = '1';
            slot.style.background = '#2A2A2A';
            slot.style.border = '1px solid var(--border-color)';
            slot.style.borderRadius = '8px';
            slot.style.display = 'flex';
            slot.style.alignItems = 'center';
            slot.style.justifyContent = 'center';
            slot.style.cursor = 'pointer';
            slot.title = `${item.name}${item.uses ? ` (${item.uses} uses)` : ''}`;

            // Hover effect
            slot.onmouseenter = () => slot.style.borderColor = 'var(--accent-color)';
            slot.onmouseleave = () => slot.style.borderColor = 'var(--border-color)';

            const iconPath = this.getItemIconPath(item.type);
            if (iconPath) {
                const img = document.createElement('img');
                img.src = iconPath;
                img.style.width = '70%';
                img.style.height = '70%';
                img.style.objectFit = 'contain';
                slot.appendChild(img);
            } else {
                const div = document.createElement('div');
                div.textContent = '📦';
                div.style.fontSize = '20px';
                slot.appendChild(div);
            }

            // Ammo/Uses Overlay
            if (item.uses !== undefined) {
                const badge = document.createElement('span');
                badge.textContent = item.uses.toString();
                badge.style.position = 'absolute';
                badge.style.bottom = '2px';
                badge.style.right = '4px';
                badge.style.fontSize = '10px';
                badge.style.color = 'white';
                badge.style.fontFamily = 'monospace';
                badge.style.backgroundColor = 'rgba(0,0,0,0.6)';
                badge.style.padding = '1px 3px';
                badge.style.borderRadius = '4px';
                slot.appendChild(badge);
            }

            slot.onclick = () => {
                if (this.onItemClick) this.onItemClick(item.type, index);
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

