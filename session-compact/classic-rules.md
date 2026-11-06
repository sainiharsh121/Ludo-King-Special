# Ludo King: Classic Mode Rules & Mechanics

> **Document Location:** `session-compact/classic-rules.md`  
> **Game Mode:** Classic Pass & Play (Local Multiplayer)  
> **Workspace:** `E:\ludo_new`  
> **Status:** Production-Ready / Fully Implemented & Tested

---

## 1. Overview & Player Setup

- **Player Counts:** Supports **2 Players (2P)**, **3 Players (3P)**, or **4 Players (4P)**.
  - *Note:* 5P and 6P modes have been permanently removed to optimize board layout and mobile responsiveness.
- **Custom Player Colors:**
  - Each player selects a unique color from the **9-Color Master Palette**:
    1. **Gold:** `#ffd700` | `rgb(255, 215, 0)`
    2. **Silver:** `#777777`
    3. **Crimson Red:** `#b21919`
    4. **Royal Blue:** `#3a72db`
    5. **Pink:** `#ff69b4` | `rgb(255, 105, 180)` (replaces Lavender)
    6. **Yellow:** `#e6cc46`
    7. **Lime Green:** `#7dc929`
    8. **Purple:** `#af27d7`
    9. **Black:** `#3b3c36` | `rgb(59, 60, 54)`
  - **Color Selection Cards:** Display only the clean color name (raw hex codes removed from the UI).
  - **Random Dice Selection:** Clicking the 3D dice icon in the color selection section instantly randomizes unique colors for all active players.
- **Token Designs:** 5 selectable token styles:
  - `pin` (Teardrop Map Pin)
  - `disc` (Royal Star Disc)
  - `hammer` (Thunder Hammer)
  - `top` (Spinning Top)
  - `ninja` (Shadow Ninja)
  - *Enlarged Token Sizing:* Dimensions scaled up across board yard sockets, track paths, and setup selectors (`22px × 28px` to `25px × 32px`) to prevent eye strain.

---

## 2. Board Layout & Navigation

- **15x15 Coordinate Grid:**
  - 4 colored yard quadrants (Top-Left: Red/Slot 0, Top-Right: Green/Slot 1, Bottom-Right: Yellow/Slot 2, Bottom-Left: Blue/Slot 3).
  - Quadrant bases dynamically reflect the players' selected custom colors.
  - In 2-player games, empty inactive quadrants automatically assign distinct canonical colors to prevent visual confusion.
- **52-Cell Common Outer Track:**
  - Pawns circulate clockwise around the shared 52-step perimeter track.
  - Quadrant Starting Steps:
    - Red / Slot 0: Step `0`
    - Green / Slot 1: Step `13`
    - Yellow / Slot 2: Step `26`
    - Blue / Slot 3: Step `39`
- **Home Corridors & Center Triangle:**
  - Each player has a dedicated 5-cell private home column leading to the central Home Triangle (final step 57).

---

## 3. Dice Mechanics & Rolling Rules

- **Standard Dice:** Rolls integers from `1` to `6`.
- **Authentic Rolling Physics & Sound:**
  - Roll duration of **1350ms** with 3D keyframe tumbling animation and decelerating face cycle.
  - Realistic procedural audio mimicking authentic wooden/plastic dice tumbling and landing clatter with custom volume gain.
- **Anti-Chain Six Rule (Max 2 Consecutive Sixes):**
  - If a player rolls a `6`, they are granted a bonus roll.
  - If they roll a second `6` consecutively, they get another bonus roll.
  - **Third Roll Guard:** The system **strictly forbids rolling three consecutive sixes**. If two sixes have already been rolled in the current turn, the 3rd roll is forced to land between `1` and `5` (a 3rd six will never appear).
- **Home Column Overshoot Turn Passing Rule:**
  - When a player has only their last remaining token left, and that token is inside the 5-cell home column:
  - If the token needs $N$ steps to reach the final home destination (e.g. needs `5`), and the player rolls a number greater than $N$ (e.g. rolled `6`):
    - The roll cannot be used (move is invalid/overshoot).
    - **No bonus roll is granted**, and turn control immediately passes to the next player.

---

## 4. Movement, Unlocking & Safe Zones

- **Yard Exit (Pawn Unlock):**
  - Standard rule: A roll of `6` is required to move a pawn from its home yard socket onto its track entry square.
  - Optional toggle: `"Open on 1 & 6"` allows pawns to exit on either a `1` or a `6`.
  - **One Token Out Option:** In setup, players can enable "One Token Out", where each player starts the match with Token 0 already placed on their starting track cell.
- **Safe Star Zones (8 Standard Stars):**
  - Permanent safe stars located at global track indices:
    - `0`, `8`, `13`, `21`, `26`, `34`, `39`, `47`.
  - Pawns on safe stars can never be captured by opponents. Multiple pawns (friend or foe) coexist safely on these tiles.
- **Mandatory Capture Requirement (`mustCaptureToEnterHome`):**
  - A player must have captured at least 1 opponent pawn during the match to unlock entry into their private home corridor.
  - If a player has 0 captures, their pawns will bypass their home entrance turn and continue circulating the outer track until a capture is secured.

---

## 5. Board Hazards & Power-ups (Dynamic Spawning)

- **4 Freeze Stars (❄️):**
  - Exactly 4 Freeze Stars appear on random non-safe track cells.
  - **Freeze Effect:** Landing on a Freeze Star freezes that pawn for **1 turn** (cannot move during the player's next turn).
  - **Freeze Vulnerability (Kill Rule):** If an opponent token lands on an already frozen pawn, **the frozen pawn is captured and sent back to its yard base**! Freeze stars do not grant immunity against enemy attacks.
- **4 Jump Icons (⚡ / 🚀):**
  - Exactly 4 Jump Icons appear on random non-safe track cells.
  - **Jump Effect:** Landing on a Jump Icon awards an immediate forward boost of **1 to 5 random bonus steps** along the track.
- **Dynamic Relocation Cycle:**
  - Freeze Stars and Jump Icons relocate dynamically to new random positions every **2 to 3 minutes** (120,000ms – 180,000ms randomized interval), ensuring fresh board hazards throughout the match.

---

## 6. Capture & Bonus Turns

- **Capturing Opponents:**
  - Landing on a non-safe cell occupied by an opponent's pawn captures it.
  - The captured pawn is sent back to its home yard base.
  - The capturing player is awarded **1 Bonus Dice Roll**.
- **Bonus Roll Conditions:**
  1. Rolling a `6` (up to 2 consecutive times).
  2. Capturing an opponent pawn.
  3. Successfully moving a pawn into the central Home Triangle.

---

## 7. Victory Conditions & Celebration

- **Finishing Ranks:**
  - The first player to bring all 4 of their tokens into the central Home Triangle is declared **1st Place Winner** (👑 Gold Crown).
  - Play continues for remaining players to determine **2nd** and **3rd** places.
- **Celebration Effects:**
  - Grand victory modal displays winner standings, podium avatar presentation, and celebratory confetti shower.
  - **Rematch Cleanup:** Triggering a rematch completely stops and clears all celebration confetti and animations, resetting the board cleanly for the new game.
