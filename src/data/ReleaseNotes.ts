export interface ReleaseNote {
    version: string;
    date: string;
    changes: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
    {
        version: 'v0.2.1',
        date: '2026-02-04',
        changes: [
            'Restored Desktop Minimap visibility',
            'Fixed Bodega Navigation: "START SHIFT" button now visible',
            'Mobile-Friendly Bodega Shop Layout'
        ]
    },
    {
        version: 'v0.2.0',
        date: '2026-02-03',
        changes: [
            'Added Mobile Start Screen & Sidebar',
            'Introduced 16-bit Coffee asset',
            'Added Mobile HUD and Touch Controls'
        ]
    },
    {
        version: 'v0.1.0',
        date: '2026-02-01',
        changes: [
            'Initial Pre-Alpha Release',
            'Basic Dungeon Generation',
            'Combat and Inventory Systems'
        ]
    }
];
