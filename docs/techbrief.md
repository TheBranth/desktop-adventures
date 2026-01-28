Game Design Document & Technical Brief

Project Title: Salaryman's Dungeon (Working Title)
Genre: Turn-Based Procedural Puzzle RPG (Desktop Adventure)
Reference: Yoda Stories Loop + Hades Polish + Slack/Notion Aesthetics
Platform: Web Browser (Desktop/Mobile) with future Android Wrapper

1. Executive Summary

A modern procedural dungeon crawler disguised as a productivity app. The player navigates office floors to find items and escape.

Core Philosophy: "Hidden in Plain Sight."
The game UI mimics a modern, dark-mode project management tool (e.g., Linear, Jira, VS Code). It blends seamlessly into a 2026 developer/designer workflow.

2. Technical Stack

Core Engine

Phaser 3 (JavaScript/TypeScript)

Why: Robust 2D handling, WebGL support for modern lighting shaders.

Resolution: High-DPI canvas. Game world is pixel art, but UI is vector/DOM-based (HTML overlay).

Data & Persistence

State Management:

Auto-save to localStorage after every input.

Data Structure: Single JSON object (Seed + Player State + Board).

Input Handling

Mouse/Touch: Click/Tap to move.

Keyboard: Arrow keys/WASD.

The "Boss Key" (Panic Mode):

Pressing SPACE overlays a realistic, interactive dummy screen of a Trello Board or VS Code Editor.

3. Core Mechanics: "Time Moves When You Move"

The Turn System

Wait State: Idle animations play.

Player Action: Move or Attack.

Process World: Enemies move, hazards tick.

Save State.

Combat & Resources

Melee: Bump to attack.

Ranged (Stapler): Requires ammo (Staples). Strategic usage.

Damage: HP - (Attack - Defense).

4. The "Successor" Twists (New Mechanics)

A. The Burnout Meter (Risk/Reward)

Logic: Special Moves add +10 Burnout.

Stages:

0-49 (Flow State): Normal.

50-99 (Crunch Time): 2x Damage Dealt, 2x Damage Taken.

100 (Burnout): Stunned for 2 turns.

Reduction: Standing still or drinking water.

B. "Corporate Politics" (Friendly Fire)

Strategy: Bait enemies into attacking each other.

Interaction: Friendly fire switches enemy aggro.

C. The "Reply All" Combo

Trigger: Hit 3 different enemies in 3 consecutive turns.

Effect: Shockwave knockback + Stun.

D. Environmental Interactions

Containers (Rummage): Risk/Reward looting (Plants, Cabinets).

Global Switches: Changing the "Floor State" (e.g., turning on HVAC melts ice biomes).

5. UI & UX Design (The "Modern SaaS" Look)

Aesthetic: "Dark Mode Productivity."

Colors: Deep charcoal backgrounds (#1E1E1E), soft grey borders, vibrant accent colors (Blurple, Mint Green) for buttons.

Typography: Clean Sans-Serif (Inter, Roboto, Segoe UI). No pixel fonts in the UI.

Layout Ratio (80/20)

Game View (The "Canvas"): The 11x11 grid sits in the center, framed like a "Design Preview" or "Graph View."

Sidebar (The "Properties Panel"):

User Profile: Round avatar, "Online" status dot (Health), "Sprint Progress" bar (Burnout).

Minimap: Styled like a vector wireframe or node graph.

Inventory: Grid of rounded squares, looking like an "Asset Library."

Log: Looks like a Slack thread or Git commit history.

The Boss Key Visual

Content: A convincing mock-up of a Kanban Board (Todo/In Progress/Done) or a Code Editor with syntax highlighting.

6. Map Generation Logic

Phase 1: The Graph (The Mindmap)

Grid: 10x10 Rooms.

Anchor: Random Elevator location.

Reach Check: Valid rooms > 3 Manhattan Distance.

Placement: Goal, Key, Lock.

Validation: Flood Fill check for valid path.

Phase 2: Rasterization

Assign Biomes (Office, Server, Freezer) and Layouts.

7. Data Structures (The "Room" Object)

{
  "room_id": "3_4",
  "biome": "modern_open_plan",
  "collision_map": [[1, 0, 0], [1, 0, 1]], // ...
  "obstacles": [
    { "x": 0, "y": 0, "sprite_key": "glass_wall_corner" },
    { "x": 2, "y": 5, "sprite_key": "standing_desk" }
  ],
  "enemies": [
    { "id": "e1", "type": "drone_printer", "x": 5, "y": 5 }
  ],
  "objects": [
    {
      "id": "key_card",
      "type": "pickup",
      "effect": "add_inventory"
    },
    {
      "id": "espresso_machine",
      "type": "container",
      "interact_cost": 1,
      "loot_table": [{ "item": "double_shot", "chance": 0.5 }]
    }
  ]
}


8. Mobile & Android Strategy

Wrapper: Capacitor.

UI: Bottom sheet navigation for Sidebar.

Haptics: Subtle "taptic" feedback for UI interactions.

9. Asset Requirements (Modern Hi-Bit)

Style: "Hi-Bit" Pixel Art. High detail, vibrant colors, clean shading.

Reference: Eastward, Owlboy, Sea of Stars.

Tileset: 32x32px but "clean."

Floors: Sleek concrete, polished wood, or clean commercial carpet.

Walls: Glass partitions, modern whiteboards, standing desks.

Sprites:

Protagonist: Modern dress code (hoodie/jeans or smart casual), smoother animation.

Enemies: Robot vacuums, holographic assistants, server drones.