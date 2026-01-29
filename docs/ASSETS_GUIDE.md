# Salaryman's Dungeon - Asset Guide

This document catalogs the SVG assets created for the game, including their dimensions and usage guidelines.

## 1. Technical Specifications
- **Base Grid Size**: 32x32 pixels.
- **Format**: SVG (Vector).
- **Style**: "Hi-Bit" Pixel Art (Geometric vector shapes).

## 2. Characters & Enemies
All character assets are centered within their frames to align with the grid.

| Asset Name | Filename | Dimensions | Grid Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Protagonist** | `protagonist_sheet.svg` | **128x32 px** | 1x1 | **Sprite Sheet** (4 Frames)<br>1. Idle<br>2. Walk L<br>3. Walk R<br>4. Attack |
| **Protagonist (Legacy)**| `protagonist.svg` | 32x32 px | 1x1 | Single static sprite (Idle). |
| **The Intern** | `enemy_intern.svg` | 32x32 px | 1x1 | Enemy. Young, green hoodie, papers. |
| **Middle Manager** | `enemy_manager.svg`| 32x32 px | 1x1 | Enemy. Blue suit, red face. |
| **IT Ninja** | `enemy_ninja.svg` | 32x32 px | 1x1 | Enemy. Black hoodie, cable weapons. |
| **Printer Beast**| `enemy_printer.svg`| 32x32 px | 1x1 | Enemy. Large beige box, barely fits 1x1. |
| **Roomba** | `enemy_roomba.svg` | 32x32 px | 1x1 | Enemy/Hazard. Round, low profile. |

## 3. Environment & Obstacles
Floor tiles are designed to be seamless when placed adjacently. Obstacles occupy specific grid footprints.

| Type | Asset Name | Filename | Dimensions | Grid Footprint | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tile** | Office Floor | `floor_office.svg` | 32x32 px | 1x1 | Grey loop carpet with border. |
| **Tile** | Server Floor | `floor_server.svg` | 32x32 px | 1x1 | Metal grate over lava with border. |
| **Tile** | Frozen Floor | `floor_frozen.svg` | 32x32 px | 1x1 | Icy blue carpet with border. |
| **Wall** | Office Wall | `wall_office.svg` | 32x32 px | 1x1 | Beige cubicle partition. |
| **Wall** | Server Wall | `wall_server.svg` | 32x32 px | 1x1 | Black server rack with LEDs. |
| **Wall** | Frozen Wall | `wall_frozen.svg` | 32x32 px | 1x1 | Iced-over filing cabinet. |
| **Wall** | Office Window | `window_office.svg` | 32x32 px | 1x1 | Window with blinds. |
| **Obstacle**| Vending Machine | `vending.svg` | 32x32 px | 1x1 | Glass front, keypad. |
| **Obstacle**| Office Desk | `obstacle_desk.svg` | 32x32 px | 1x1 | PC, Keyboard, Mug. |
| **Obstacle**| Water Cooler | `obstacle_water_cooler.svg` | 32x32 px | 1x1 | Blue jug, tap. |
| **Obstacle**| Whiteboard | `obstacle_whiteboard.svg` | 32x32 px | 1x1 | Stand, scribbles. |
| **Obstacle**| Server Rack | `obstacle_server_rack.svg` | 32x64 px | **1x2** | Tall black cabinet. |
| **Obstacle**| Potted Plant | `obstacle_plant.svg`| 32x32 px | **1x1** | Potted Ficus. |
| **Obstacle**| Meeting Table| `obstacle_meeting_table.svg`| 96x64 px | **3x2** | large table with chairs. |

## 4. Items (Inventory)
Items are represented as 32x32 icons.

| Category | Item | Filename |
| :--- | :--- | :--- |
| **Weapon** | Newspaper | `items/newspaper.svg` |
| **Weapon** | Red Stapler | `items/red_stapler.svg` |
| **Consumable** | Coffee | `items/coffee.svg` |
| **Consumable** | Water | `items/water.svg` |
| **Consumable** | Granola Bar | `items/granola_bar.svg` |
| **Consumable** | Mint | `items/mint.svg` |
| **Consumable** | Vitamin Pill | `items/vitamin_pill.svg` |
| **Consumable** | Donut | `items/donut.svg` |
| **Quest** | Blue Keycard | `items/keycard_blue.svg` |
| **Quest** | Red Keycard | `items/keycard_red.svg` |
| **Quest** | PTO Form | `items/pto_form.svg` |
| **Quest** | Floppy Disk | `items/floppy.svg` |
| **Prop** | Paper Ball | `items/paper_ball.svg` |

## 5. UI Elements

| **Asset** | Filename | Dimensions | Description |
| :--- | :--- | :--- | :--- |
| **Main Frame** | `ui_frame.svg` | 800x600 px | "Windows 95" Spreadsheet styling. Transparent center for game view. |
| **Icon** | `ui/ui_icon_heart.svg` | 32x32 px | Red Heart (HP). |
| **Icon** | `ui/ui_icon_fire.svg` | 32x32 px | Orange Flame (Burnout). |
| **Icon** | `ui/ui_icon_coin.svg` | 32x32 px | Gold Coin (Credits). |

