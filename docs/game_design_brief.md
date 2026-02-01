# Games Design Brief: Salaryman's Dungeon

## 1. Executive Summary
**Salaryman's Dungeon** is a satirical 2D grid-based roguelite where you play as a burnt-out office worker fighting through a procedurally generated corporate hellscape.
Built with **Phaser 3 + TypeScript**, it combines turn-based combat, resource management (HP, Burnout, Credits), and dungeon crawling mechanics in a modern "SaaS" (Software as a Service) aesthetic.

## 2. Current State (Level 1: Onboarding Day)
### Core Mechanics
- **Turn-Based Grid System**: The world moves when you move. 4-Phase Game Loop (Input -> Player -> World -> Cleanup).
- **Procedural Generation**: "Randomize-Validate-Retry" algorithm generates 11x11 rooms with guaranteed pathing (BFS validation).
    - **Macro Elements**: Large obstacles like Meeting Tables (3x2).
    - **Micro Elements**: Desks, Plants, Water Coolers.
- **Resources**:
    - **HP (Health)**: Physical damage capacity.
    - **Burnout (Mana/Stamina)**: Mental stress. High Burnout (>50) makes you a "Glass Cannon" (Double Damage Taken).
    - **Credits (Score)**: Used for vending machines.

### The Office Bestiary
- **Intern**: Simple chaser. Drops coffee.
- **Roomba**: Hazards that patrol in lines and turn on walls. Indestructible-ish.
- **Middle Manager**: Kites the player and uses "Shout" (AOE Stress Damage).
- **Printer Beast**: Stationary turret. Fires "Toner Blasts" (projectiles) if you cross its line of sight.

### Interactive World
- **Locked Doors**: Secure areas requiring a **Security Pass** (dropped by Managers) or Keycard.
- **Vending Machines**: Buy consumables (Coffee, Granola) with Credits. 10% Chance to Jam.
- **Water Coolers**: Drink to restore HP and reduce Burnout.
- **Whiteboards**: Read for procedural tips or corporate gibberish.
- **Meeting Tables**: Large obstacles that provide cover or block paths.

### Technical Architecture
- **Controls**: Hybrid **Tap-to-Move** (Grid) and Mouse Interaction (Shooting/UI).
- **Tech Stack**: Vite, TypeScript, Phaser 3.
- **Asset Pipeline**: SVG-based workflow. Assets served from `public/` for reliable deployment.
- **Collision**: Custom Grid-Collision system supporting multi-tile objects and bounding boxes.

## 3. Future Roadmap

### Level 2: The Server Farm (Planned)
- **Biome**: Hot, noisy, dark aisles of blinking lights.
- **New Hazards**: 
    - **Heat Vents**: Temporary area denial.
    - **Cable Spaghetti**: Slows movement (Double movement cost).
- **New Enemies**:
    - **Sysadmin**: Teleports between server racks.
    - **Glitch**: An entity that messes with the UI/HUD.

### Level 3: The Boardroom (Planned)
- **Biome**: Plush carpet, mahogany tables, expensive art. 
- **Boss**: The CEO (Phase 1: Golf Club Melee. Phase 2: Golden Parachute Escape).

### Meta-Progression (The Roguelite Layer)
- **Stock Options**: Meta-currency earned per run.
- **The Skill Tree ("Professional Development")**:
    - *Better Dental*: Start runs with +10 Max HP.
    - *Gym Membership*: Dash ability.
    - *Union Rep*: Shop prices -20%.

### Outstanding Tech Debt / Refactoring
- **UI Decoupling**: Move more logic out of `GameScene` into strictly separated UI managers.
- **Event System**: Implement a global Event Bus for cleaner achievements/quest tracking.
- **Save System**: Persist "Stock Options" and unlocked skills between sessions (Local Storage).

## 4. Visual Identity
- **Style**: "Dark Mode Productivity Software".
- **Palette**: Dark Greys (#1E1E1E), Accent Blues (VS Code style), Warning Oranges.
- **UI**: Sidebar resembles a code editor or Slack channel. Logs are timestamped.
