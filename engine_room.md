Salaryman's Dungeon: Core Game Mechanics & Logic

Purpose: This document defines the exact algorithms for procedural generation, turn execution, and entity interactions.
Target Audience: Engineering / Development.

1. The Coordinate Systems

The game uses two distinct coordinate systems that must be mapped to each other.

A. Global Map (The "Floor")

Grid Size: 10x10 Rooms ([0,0] to [9,9]).

Data: A 2D array storing RoomID and connection data (North, South, East, West).

B. Local Room (The "Screen")

Grid Size: 11x11 Tiles ([0,0] to [10,10]).

Center: [5,5] (Player default spawn for new levels).

Exits:

North: [5, 0]

South: [5, 10]

West: [0, 5]

East: [10, 5]

2. Procedural Map Generation (The "Mindmap")

Executed at LevelStart. Generates the graph of room connections before generating tile content.

Step 1: The Anchor

Initialize a 10x10 array GlobalMap with null.

Select random StartNode (Elevator) at [rX, rY]. Mark as Visited.

Step 2: Critical Path Generation

We need a valid path: Start -> Key -> Lock -> Goal.

Place Goal:

Select a random coordinate [gX, gY].

Constraint: ManhattanDistance(Start, Goal) > 4.

Place Lock Room:

Select a coordinate [lX, lY] adjacent to the Goal or on the path to the Goal.

Mark connection to Goal as LOCKED_DOOR.

Place Key Room:

Select random coordinate [kX, kY].

Constraint: ManhattanDistance(Start, Key) > 2 AND ManhattanDistance(Key, Lock) > 2.

Step 3: Flood Fill & Validation

Run A* (A-Star) from Start to Key. If no path, Regenerate.

Run A* from Key to Lock. If no path, Regenerate.

If valid, populate remaining null nodes with CombatRoom, PuzzleRoom, or EmptyRoom based on density settings (e.g., 60% Combat, 20% Empty).

3. Spawn Logic (The Tower Algorithm)

Executed when populating a CombatRoom.

A. Difficulty Calculation

TowerLevel = Current Floor Number (1-indexed).

B. Enemy Density (Count)

How many entities to spawn in the 11x11 grid?

Formula: Count = MIN(12, MAX(2, FLOOR(TowerLevel * 0.4) + 2))

Result: Floor 1 = 2 enemies. Floor 10 = 6 enemies. Cap = 12.

C. Enemy Tier Selection (Pool)

Which enemies are eligible?

Min Tier: FLOOR(TowerLevel / 5) + 1

Max Tier: TowerLevel + 1

Selection:

Fetch array of AvailableEnemies where Tier >= MinTier AND Tier <= MaxTier.

Randomly sample Count enemies from this pool.

D. Placement Logic

Create list of ValidTiles (Walkable, No Hazard, No Object).

Filter ValidTiles: Must be > 3 tiles away from Player Entrance.

Shuffle ValidTiles and pop coordinates for each enemy.

4. The Turn Execution Cycle (The Loop)

The game state advances only on valid Player Input.

Phase 1: Input Validation

Event: Player presses ArrowKey or Click(x,y).

Check: Is Target Tile within bounds? Is it blocked?

If Blocked by Wall: Play "Bump" sound, return.

If Blocked by Enemy: Trigger Combat(Player, Enemy).

If Empty: Trigger Move(Player, Target).

Phase 2: Player Execution

Update Player X/Y.

Burnout Check: If input was Sprint (Shift+Move), Burnout += 10.

Trigger Tile: Check if new tile has Item (Pickup) or Hazard (Damage).

Phase 3: World Execution (The "Tick")

Iterate through ActiveEnemies array:

Status Check: If Stunned, StunDuration--, continue.

AI Decision:

Melee: Pathfind to adjacent tile of Player.

Ranged: Raycast to Player. If clear line && range < MaxRange, FireProjectile. Else, move to line of sight.

Resolve Movement:

Check collision with other enemies (Anti-stacking).

Update Enemy X/Y.

Resolve Attacks:

If Attack hits Player -> PlayerHP -= (Dmg * BurnoutMultiplier).

Phase 4: Clean Up & Persist

Remove dead enemies (HP <= 0). Drop Loot.

SaveGame: Serialize current RoomState and PlayerStats to localStorage.

Unlock Input.

5. Combat & Interaction Mechanics

A. Damage Formula

FinalDamage = BaseDamage * BurnoutMultiplier

BurnoutMultiplier:

Burnout < 50: 1.0

Burnout >= 50: 2.0 (Glass Cannon Mode)

B. Friendly Fire Logic

Projectile Collision:

When an Enemy fires a projectile, it travels linearly.

Check collision at every step.

If it hits any actor (Player OR Another Enemy), apply damage.

Aggro Switch:

If Enemy A hits Enemy B, Enemy B changes Target from Player to Enemy A.

C. Container Interaction (RNG Loot)

When Player bumps a Container (e.g., Vending Machine):

Cost Check: Does Player have required Item/Currency?

Roll d100:

0-10: Jam/Trap (Spawn Spider or Lose Currency).

11-50: Nothing.

51-90: Common Item (Coffee).

91-100: Rare Item (Stapler Upgrade).

Update State: Mark object as looted in RoomData so it cannot be farmed.

6. Data Structures (JSON Schema)

Global State (save_file.json)

{
  "seed": 123456789,
  "tower_level": 1,
  "player": {
    "hp": 20,
    "max_hp": 20,
    "burnout": 0,
    "inventory": ["id_card", "newspaper"],
    "equipped_weapon": "newspaper",
    "position": { "room_x": 4, "room_y": 4, "tile_x": 5, "tile_y": 5 }
  },
  "global_flags": {
    "HVAC_REPAIRED": false,
    "BOSS_DEFEATED": false
  },
  "visited_rooms": ["4_4", "4_5"]
}


Room Definition (room_x_y.json)

Generated procedurally, then cached.

{
  "id": "4_5",
  "biome": "cubicle",
  "layout_type": "maze",
  "tiles": [ ... ], // 11x11 int array
  "entities": [
    { "uid": 1, "type": "intern", "x": 3, "y": 3, "hp": 10, "state": "idle" }
  ],
  "loot": [
    { "uid": 101, "item_id": "coffee", "x": 8, "y": 8, "looted": false }
  ]
}
