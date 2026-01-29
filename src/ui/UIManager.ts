import { EventManager, GameEvents } from '../systems/EventManager';


export class UIManager {
    private static instance: UIManager;

    // Cache DOM elements
    private hpBar: HTMLElement | null;
    private burnoutBar: HTMLElement | null;
    private minimapGrid: HTMLElement | null;
    private logContainer: HTMLElement | null;
    private inventoryGrid: HTMLElement | null;
    private mHp: HTMLElement | null;
    private mBurnout: HTMLElement | null;

    private creditsVal: HTMLElement | null;

    private constructor() {
        this.hpBar = document.getElementById('hp-bar');
        this.burnoutBar = document.getElementById('burnout-bar');
        this.minimapGrid = document.getElementById('minimap-grid');
        this.logContainer = document.getElementById('message-log');
        this.inventoryGrid = document.getElementById('inventory-grid');
        this.creditsVal = document.getElementById('credits-val');

        // Mobile Header Elements
        this.mHp = document.getElementById('m-hp');
        this.mBurnout = document.getElementById('m-burnout');


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

        if (this.burnoutBar) {
            const b = Math.max(0, Math.min(100, burnout));
            this.burnoutBar.style.width = `${b}%`;
            if (burnout >= 50) this.burnoutBar.style.backgroundColor = '#9b59b6';
            else this.burnoutBar.style.backgroundColor = '#3498db';
        }

        if (this.creditsVal) {
            this.creditsVal.textContent = `¥${credits}`;
        }

        // Mobile Updates
        if (this.mHp) this.mHp.style.width = `${(hp / maxHp) * 100}%`;
        if (this.mBurnout) this.mBurnout.style.width = `${Math.min(100, burnout)}%`;
        // if (this.mCredits) this.mCredits.innerText = `${credits}`; // Removed from HTML for now
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

    private getItemIcon(id: string): string {
        switch (id) {
            case 'stapler': return 'assets/ui/icon_stapler.svg';
            case 'coffee': return 'assets/environment/water_cooler.svg';
            // TODO: Ensure these assets exist or use generic fallback
            default: return '';
        }
    }

    public updateInventory(inventory: any[]) {
        if (!this.inventoryGrid) return;
        this.inventoryGrid.innerHTML = '';

        inventory.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.className = 'inv-item';
            slot.title = item.name;

            // Hover effect handled by CSS .inv-item:hover

            const iconPath = this.getItemIcon(item.id); // Use item.id not item.type if that's the property
            // Check type definition, usually it's `type` or `id`.
            // In GameScene logic: `itemType === 'stapler'`. Item structure has `.type`?
            // Let's assume `.type` based on previous code usage `this.getItemIconPath(item.type)`.
            // Wait, standard structure in `ItemSystem` usually puts ID in `type` or `id`.
            // Using `item.id` to be safe, or fallback to name?
            // Actually `GameState.inventory` is `InventoryItem[]`. `InventoryItem` has `id`, `name`, `type`?
            // Let's just try to get a path.

            const img = document.createElement('img');
            img.style.width = '60%';
            img.style.height = '60%';
            img.style.objectFit = 'contain';

            if (iconPath) {
                img.src = iconPath;
            } else {
                // Fallback Logic
                if (item.id === 'stapler') img.src = 'assets/items/red_stapler.svg';
                else if (item.id === 'coffee') img.src = 'assets/items/coffee.svg';
                else img.src = 'assets/items/newspaper.svg'; // Generic
            }

            img.onerror = () => {
                img.style.display = 'none';
                slot.innerText = '📦';
            };
            slot.appendChild(img);

            // Count/Uses
            if (item.count > 1 || item.uses) {
                const badge = document.createElement('div');
                badge.className = 'badge-count';
                badge.innerText = item.count > 1 ? item.count.toString() : (item.uses?.toString() || '');
                slot.appendChild(badge);
            }

            slot.onclick = () => {
                if (this.onItemClick) this.onItemClick(item.id, index);

                // Active highlighting
                Array.from(this.inventoryGrid!.children).forEach(c => c.classList.remove('active'));
                slot.classList.add('active');
            };

            this.inventoryGrid!.appendChild(slot);
        });

        // Empty Slots
        for (let i = 0; i < (6 - inventory.length); i++) {
            const el = document.createElement('div');
            el.className = 'inv-item';
            el.style.opacity = '0.1';
            this.inventoryGrid.appendChild(el);
        }
    }

    public log(message: string) {
        // 1. Add to Log Container (Sidebar / Logs Tab)
        if (this.logContainer) {
            const div = document.createElement('div');
            div.className = 'log-entry';

            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            div.innerHTML = `<span class="ts">${time}</span><span class="msg">${message}</span>`;

            this.logContainer.appendChild(div);
            this.logContainer.scrollTop = this.logContainer.scrollHeight;
        }

        // 2. Trigger Flash Toast
        this.showToast(message);
    }

    private toastTimeout: any = null;

    private showToast(message: string) {
        const toast = document.getElementById('toast-message');
        if (!toast) return;

        toast.textContent = message;
        toast.style.display = 'block';

        // Force reflow to allow transition if re-triggering?
        // Actually just toggle class.

        // Remove 'show' first to reset if spamming?
        toast.classList.remove('show');
        void toast.offsetWidth; // trigger reflow
        toast.classList.add('show');

        // Clear existing timeout
        if (this.toastTimeout) clearTimeout(this.toastTimeout);

        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
            // Wait for fade out to hide
            setTimeout(() => {
                if (!toast.classList.contains('show')) toast.style.display = 'none';
            }, 300);
        }, 3000); // 3 seconds visible
    }
}
