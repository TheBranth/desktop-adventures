Salaryman's Dungeon: Level 1 Content Bible

Biome: The Modern Open-Plan Office
Theme: "Onboarding Day"
Difficulty: Tutorial / Easy
Goal: Reach the Elevator to Floor 2.

1. The Enemy Roster (The "Coworkers")

These enemies populate the random rooms of Level 1.

A. The Intern (Basic Melee)

Sprite: Young, hoodie, holding a stack of papers.

Behavior (AI): SimpleChase. Moves directly toward the player if in line-of-sight.

Stats:

HP: 10 (2 hits to kill)

Dmg: 2 (Paper Cut)

Speed: 1 tile/turn

Drops: Coffee (Small Heal), 1 Staple.

B. The Roomba (Hazard/Patrol)

Sprite: Round robot vacuum, menacing red LED.

Behavior (AI): LinearPatrol. Moves in a straight line until it hits a wall, then turns 90 degrees clockwise. Ignores player unless bumped.

Stats:

HP: 999 (Invincible/Hazard)

Dmg: 5 (Runs over your foot)

Speed: 1 tile/turn

Special: Can be trapped behind chairs.

C. The Middle Manager (Ranged/Support)

Sprite: Blue suit, red face, holding a megaphone.

Behavior (AI): Kiting. Tries to maintain 3 tiles distance from player.

Attack: "The Shout" (Cone AOE). Hits 3 tiles in a V-shape.

Friendly Fire: If The Shout hits an Intern, the Intern takes damage and becomes "Stressed" (Double Speed).

Stats:

HP: 15

Dmg: 3

Speed: 1 tile/turn

D. The Printer Beast (Static Turret)

Sprite: Large photocopier with teeth.

Behavior (AI): Turret. Does not move. Rotates to face player.

Attack: "Toner Blast" (Projectile). Fires a black blob in a straight line every 2 turns.

Stats:

HP: 30 (Tank)

Dmg: 4

Weakness: Flanking. Cannot shoot behind itself.

2. Interactive Objects & Loot

Weapons (The "Tools")

Rolled-Up Newspaper (Starter):

Type: Melee.

Dmg: 5.

Range: 1 tile.

Red Swingline Stapler:

Type: Ranged.

Dmg: 3.

Range: 4 tiles.

Ammo: Uses "Staples".

Consumables (Buffs)

Espresso Shot:

Effect: +5 HP, -10 Burnout.

Water Cooler Jug:

Effect: Clears "Stun" status. Sets Burnout to 0.

Gluten-Free Donut:

Effect: +10 HP.

Quest Items (The "MacGuffins")

Blue Keycard: Unlocks basic glass doors.

Red Keycard: Unlocks the Server Room (Boss/Loot room).

Signed PTO Form: The exit condition (Level 1 Goal).

3. Environmental Interactions

Objects in the world that are not enemies or pickups.

A. The Vending Machine

Interaction: Bump/Click.

Cost: 5 Credits (Score).

Result: Drops a random Consumable.

Twist: 10% chance to jam (eats money, drops nothing). Kick it (Melee attack) to unjam or break it.

B. The Standing Desk

Interaction: Cover.

Effect: Blocks Ranged Attacks (Staples/Toner Blasts). Can be destroyed after 3 hits.

C. The Server Rack (Hazard)

Interaction: None (Passive).

Effect: Emits heat. Standing adjacent to it adds +5 Burnout per turn.

Destructible: If destroyed (explosive damage), it cools down the room but alerts all enemies.

D. The Whiteboard

Interaction: Read.

Effect: Displays a procedural gameplay hint or corporate nonsense.

Example: "Remember: The Printer is weak to flanking."

Example: "Synergy is key. Friendly fire is mandatory."

4. The Level 1 Map Structure

Global Logic

Grid: 9x9 Rooms (Smaller for tutorial).

Start: Bottom-Left [0,8].

Exit: Top-Right [8,0].

Key Encounters (Guaranteed Rooms)

The Reception (Start): Safe zone. Tutorial message on Whiteboard.

The Cubicle Maze (Mid): High density of Interns. Contains Blue Keycard.

The Break Room (Optional): Contains Vending Machine and Water Cooler. Guarded by Middle Manager.

The Server Closet (Locked): Requires Blue Keycard. Contains Red Stapler (Weapon Upgrade).

The Executive Antechamber (End): Guarded by 2 Printer Beasts. Contains PTO Form.

5. Future Proofing: The Roguelite "Tower"

Design stub for the meta-game.

The Run: You start at Floor 1. Each floor gets harder (more hazards, elite enemies).

The Score: "Performance Review".

calculated by: (Floors Cleared * 100) + (Credits Collected) - (Turns Taken).

The Leaderboard: "Employee of the Month".

Global ranking based on Score.

Permanent Upgrades (The "Skill Tree"):

Spend "Stock Options" (Meta-currency) to buy:

Better Dental: Start with +10 Max HP.

Gym Membership: Move Speed +1 (maybe too OP? Start with Dash ability?).

Union Rep: Shop prices -20%.