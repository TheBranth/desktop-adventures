Salaryman's Dungeon: AI Asset Generation Guide

Target Aesthetic: 16-bit "Hi-Bit" Pixel Art.
Reference Style: Yoda Stories, Zelda: A Link to the Past, Earthbound.
Perspective: Top-down Orthographic (slight 3/4 tilt for characters so we see faces).
Technical Requirement: All character assets must be generated on a solid, high-contrast background (e.g., bright magenta #FF00FF or white) for easy removal.

1. The Protagonist: "Temp" (The Salaryman)

We need a character distinct enough to be iconic, but generic enough to be replaceable.

Visual Specs:

Head: Oversized (Bobblehead/Chibi). Balding on top, hair on sides. Thick black-rimmed glasses.

Body: White dress shirt (untucked/messy), brown slacks, cheap black shoes.

Build: Portly/Doughy. Slouches.

Prompt for Gemini / Imagen:

Prompt:
A pixel art sprite sheet of a video game character: a middle-aged Japanese salaryman.
Style: 16-bit SNES RPG style, vivid colors, sharp pixel edges, no anti-aliasing.
View: Top-down 3/4 orthographic view.
Details: The character has a large head (chibi proportions), is balding with side hair, wears thick glasses, a white dress shirt that is slightly too tight, and brown pants. He looks tired.
Layout: Grid layout showing the character in 3 states:

Idle (standing still, shoulders slumped).

Walking (animated legs).

Attacking (shoving forward with a rolled-up newspaper).
Background: Isolated on a solid white background.

2. The Environments (Tilesets)

These need to be "seamless textures" for the floor and "block objects" for walls.

A. The Standard Office (Floor 1-3)

Vibe: Soul-crushing beige and grey.

Floor: Grey carpet loops.

Walls: Beige cubicle partitions.

Prompt (Floor):
A seamless texture of office carpet tiles. 16-bit pixel art style. The carpet is dull grey with a slight noise pattern. Top-down view. Flat lighting. No furniture, just the floor texture.

Prompt (Walls/Obstacles):
Pixel art game assets of office cubicle walls and desks. Top-down 3/4 view. Beige fabric partitions, grey metal desks, a water cooler with blue water, and a potted ficus plant. 16-bit style, sharp edges. Isolated on white background.

B. The Server Room (Fire Level)

Vibe: Overheating, red warning lights, black server racks.

Floor: Metal grating over lava/fire.

Prompt (Floor):
A seamless texture of a metal server room floor grate, glowing red from underneath. 16-bit pixel art style. The metal is dark grey, the glow is intense orange.

Prompt (Walls/Obstacles):
Pixel art game assets of server racks. Top-down 3/4 view. Tall black cabinets with blinking green and red LED lights. Some cabinets are smoking or on fire. 16-bit style. Isolated on white background.

C. The Frozen Archives (Ice Level)

Vibe: The AC is broken. Blue tint, icicles.

Floor: Blue-tinted carpet with ice patches (slip hazard).

Prompt (Floor):
A seamless texture of frozen office carpet. 16-bit pixel art style. The carpet is pale blue/grey with patches of white ice and frost.

Prompt (Walls/Obstacles):
Pixel art game assets of frozen office filing cabinets. Top-down 3/4 view. Grey metal cabinets covered in blue icicles and snow. A frozen desk fan. 16-bit style. Isolated on white background.

3. The Enemies (Sprite Sheets)

A. The Printer Beast

Concept: A large photocopier with paper trays acting like a mouth.

Prompt:

Pixel art sprite of a monster made of an office printer. Top-down RPG view. The printer is beige and bulky. It has a mouth full of jagged paper sheets. It is spewing black toner/ink. 16-bit style, sharp edges. Isolated on white background.

B. The Middle Manager

Concept: Angry man in a blue suit, red face, shouting.

Prompt:

Pixel art sprite of an angry corporate manager. Top-down RPG view, chibi style. He wears a blue suit and red tie. His face is bright red with anger. He is holding a coffee mug aggressively. 16-bit style. Isolated on white background.

C. The IT Ninja

Concept: Stereotypical hacker in a black hoodie, face hidden, holding cables like nunchucks.

Prompt:

Pixel art sprite of a hacker ninja. Top-down RPG view, chibi style. Wearing a black hoodie and jeans. Face is obscured by shadow/monitor glow. He is holding glowing ethernet cables like weapons. 16-bit style. Isolated on white background.

4. UI & Items (The "HUD")

The UI needs to look like software icons (16x16 or 32x32).

Item Icons (Inventory)

Prompt:
A set of pixel art icons for a video game inventory. 16-bit style.
Items included:

A Red Stapler.

A White ID Card with a lanyard.

A steaming cup of coffee in a white styrofoam cup.

A blue floppy disk.

A crumpled paper ball.
Laid out in a grid. Isolated on white background.

The "Spreadsheet" Overlay Frame

Prompt:
A UI frame design resembling Windows 95 software. Grey bevelled edges, dark blue title bar at the top, scroll bars on the right and bottom. Pixel art style. The center is transparent.

5. Developer Instructions: Processing the Assets

Step 1: Background Removal

Use Photoshop or a script (Python rembg) to remove the solid white/magenta backgrounds.

Note: Do not use "Anti-aliasing" during selection, or you will get fuzzy edges. Keep it "Hard Edge" (Nearest Neighbor).

Step 2: Slicing

Characters: Slice into 32x32 blocks.

Tiles: Slice into 32x32 blocks.

Items: Slice into 16x16 or 24x24 icons.

Step 3: Animation Setup (Phaser)

Walk Cycle: 2 frames (Left Foot, Right Foot) is sufficient for this "stuttery" desktop style.

Idle: 1 frame.

Damage: Flash the sprite White (#FFFFFF) in code; no separate sprite needed.