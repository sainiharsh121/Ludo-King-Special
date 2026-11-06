# Ludo King: Team Up Internal Page Implementation

> **File Name:** `session-compact/teamup internal page implementation.md`  
> **Target Page:** Pass & Play Team Up Setup Screen (Page 5B — `PassNPlayTeamUpSetupScreen.tsx`)  
> **Workspace:** `E:\ludo_new`  
> **Status:** Production-Ready / 100% Automated Tests Passing (89/89) / Zero Build Errors / Dev Server Live at `http://localhost:5173/`

---

## 1. Executive Summary & User Objectives

The user requested specific architectural and UX modifications to the **Team Up (2v2) Internal Setup Page** (`PassNPlayTeamUpSetupScreen.tsx`):

1. **Remove "LOAD SAVED GAMES" button:** Eliminating the top pill button positioned above "CHOOSE COLOR AND NAME".
2. **Make the 4 tokens clickable & create boxes around them:** Enclose each of the 4 player tokens in a dedicated, interactive styled container box.
3. **Decrease the width of the player name input:** Reduce the width of the input boxes so player names don't excessively stretch across the team cards.
4. **4-Token Color Selection Rules:** Clicking any token box displays all unselected colors from the 9-color master palette ($9 - 4 = 5$ available colors), allowing players to pick any unselected color while strictly maintaining uniqueness among the 4 players.
5. **Crisp White Background on Token Containers (`bg-white`):** Provide a solid white background inside token boxes and preview tiles so dark tokens (such as the Ninja token with its charcoal body) and vibrant accents are rendered clearly with high contrast.
6. **Remove "Play - One Token Out -" button:** Eliminate the secondary game mode button, keeping a single primary "Play" button matching the Classic setup page pattern.

---

## 2. Visual Reference & Evolution

```mermaid
flowchart TD
    subgraph S1["1. Clean Top Header"]
        H1["CHOOSE COLOR AND NAME"]
        H2["(LOAD SAVED GAMES button removed)"]
    end

    subgraph S2["2. Team A (Blue & Green)"]
        TA1["Player 1: [White Box 🎨] [w-28 Name Input] [🎲 Roll]"]
        TA2["Player 3: [White Box 🎨] [w-28 Name Input] [🎲 Roll]"]
    end

    subgraph S3["3. Team B (Red & Yellow)"]
        TB1["Player 2: [White Box 🎨] [w-28 Name Input] [🎲 Roll]"]
        TB2["Player 4: [White Box 🎨] [w-28 Name Input] [🎲 Roll]"]
    end

    subgraph S4["4. Interactive Color Picker Modal"]
        M1["Click any Token Box"]
        M2["Displays 5 Available Unselected Colors"]
        M3["Instant Tap Assignment + Release Old Color"]
        M4["Direct Swap with Teammate/Opponent"]
    end

    subgraph S5["5. Single Play Action"]
        P1["[ Play ] Button (Gold Border)"]
        P2["(Play - One Token Out - removed)"]
    end

    S1 --> S2
    S2 --> S3
    S2 -.->|Click Token| S4
    S3 -.->|Click Token| S4
    S3 --> S5
```

---

## 3. Detailed Implementation Breakdown

### 3.1 Button Cleanup
- **Top "LOAD SAVED GAMES" Removed:** The floating top pill was removed from above the header, streamlining entry directly into player configuration.
- **Secondary "Play - One Token Out -" Removed:** Per the user screenshot and prompt, the secondary split-button was removed. Now only the single, prominent primary `Play` button is presented with yellow-gold neon border and hover animation.

### 3.2 Clickable Token Boxes with Crisp White Background (`bg-white`)
- **Container Sizing:** `w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-md flex items-center justify-center relative`.
- **Contrast Solution:** Dark tokens (e.g., Ninja token with `#2e2730` charcoal body) previously blended into the dark blue card background. Wrapping them in a **crisp white background (`bg-white`)** ensures that headbands, visors, and custom color accents are distinct and clear.
- **Team-Coded Borders:**
  - Team A tokens: `border-2 border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.35)]`
  - Team B tokens: `border-2 border-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.35)]`
- **Interactive Badges:** A golden mini palette badge (`🎨`) is pinned to the top-right corner (`-top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full`) indicating that the token is customizable.
- **Active Focus Ring:** Clicking a token applies an active pulse ring (`ring-2 ring-amber-300 ring-offset-1`).

### 3.3 Decreased Player Name Input Width
- **Old Style:** `flex-1` stretching uncontrollably across the full horizontal width of the card.
- **New Style:** `w-28 sm:w-36 text-center text-xs sm:text-sm font-semibold tracking-wide bg-white/95 text-slate-800 rounded-lg px-2 py-1 border border-dashed border-red-400/80 focus:border-solid focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300 shadow-inner`.
- **Layout Balance:** Perfectly centers the player name between the token avatar box on the left and the dice preview button on the right.

---

## 4. 4-Token Color Selection Rules Engine

### 4.1 Master 9-Color Palette
The complete 9-color selection palette available in the engine:
```typescript
export const NINE_TOKEN_COLORS = [
  { id: 'gold',     name: 'Gold',        hex: '#ffd700' }, // rgb(255,215,0)
  { id: 'silver',   name: 'Silver',      hex: '#777777' },
  { id: 'red',      name: 'Crimson Red', hex: '#b21919' },
  { id: 'blue',     name: 'Royal Blue',  hex: '#3a72db' },
  { id: 'pink',     name: 'Pink',        hex: '#ff69b4' }, // rgb(255,105,180) (Replaces Lavender)
  { id: 'yellow',   name: 'Yellow',      hex: '#e6cc46' },
  { id: 'green',    name: 'Lime Green',  hex: '#7dc929' },
  { id: 'purple',   name: 'Purple',      hex: '#af27d7' },
  { id: 'black',    name: 'Black',       hex: '#3b3c36' }, // rgb(59,60,54) (Replaces Dark)
];
```

### 4.1.1 Random Color Dice Selector
- A 3D dice icon is positioned beside player color selection.
- Clicking the dice randomly selects 4 unique colors out of the 9-color palette for all 4 players at once.

### 4.1.2 Teammate Friendly Kill Badge Removal
- Teammate kill indicator `{i kill}` was previously displayed on teammate tokens when Friendly Kill was toggled.
- This text has been completely removed to provide a clean, distraction-free board appearance.

### 4.1.3 Enlarged Token Sizing
- Tokens on board sockets, track tiles, and setup containers have been enlarged (`22px × 28px` to `25px × 32px`) to eliminate eye strain.

### 4.2 State Architecture & Defaults
```typescript
// Default colors: 4 strictly unique colors across the 4 players
const defaultColors: Record<PlayerSlot, string> = {
  p1: '#3a72db', // Royal Blue  (Team A, Player 1)
  p3: '#7dc929', // Lime Green  (Team A, Player 3)
  p2: '#b21919', // Crimson Red (Team B, Player 2)
  p4: '#e6cc46', // Yellow      (Team B, Player 4)
};
```

### 4.3 Unselected Pool Calculation
At any time, the unselected color pool consists of the 5 colors not currently held by any of the 4 players:
```typescript
const selectedHexes = Object.values(playerColors);
const unselectedColors = NINE_TOKEN_COLORS.filter(c => !selectedHexes.includes(c.hex));
// Exactly 9 - 4 = 5 unselected colors available
```

### 4.4 Rules & Selection Mechanics
1. **Strict 4-Color Mutual Exclusivity:** No two players can hold the same color simultaneously.
2. **Dynamic Replacement & Pool Turnover:** When Player 1 selects an unselected color (e.g., Lavender `#c36ede`):
   - Player 1's color updates to Lavender (`#c36ede`).
   - Player 1's old color (Royal Blue `#3a72db`) is freed and immediately enters the unselected pool.
   - The unselected pool remains exactly 5 distinct colors.
3. **Safe Direct Swapping:** If a player taps a color currently held by another player (marked with a `⇄ Swap` badge in the modal):
   - The two players cleanly swap their token colors.
   - Mutual exclusivity is preserved with zero duplicates.
4. **Persistent State:** Player color choices are stored in `localStorage` under `ludo_pnp_teamup_colors` and reloaded automatically upon page re-entry.

---

## 5. In-Game Board & Match Engine Synchronization

When the user taps `Play`:
1. The 4 chosen hex colors (`p1`, `p3`, `p2`, `p4`) are passed into `createPassNPlayTeamUpMatch`.
2. Each player entity receives `player.tokenColorHex = playerColors[slot]`.
3. **Board Pawns (`LudoBoard.tsx`):**
   - Pawns render radial gradients using the player's chosen `tokenColorHex`.
   - In-flight hopping animations and home column track highlights adopt the custom color.
4. **Player HUD (`PlayerHUD.tsx`):**
   - Active turn cards and player avatars feature custom glowing rings matching their assigned token color.

---

## 6. Automated Test Suite (89/89 Passing)

The test suite in [`test_game_logic.ts`](file:///e:/ludo_new/test_game_logic.ts) includes 15 automated unit & integration tests specifically verifying the Team Up 4-Token Color Rules:

```
--- TEST SUITE: Page 5B Team Up 4-Token Color Rules & Selection ---
[PASS] Team Up has exactly 4 player token colors
[PASS] All 4 default Team Up token colors are strictly unique
[PASS] Exactly 5 colors are unselected initially (9 - 4 = 5)
[PASS] Lavender (#c36ede) is initially unselected
[PASS] Royal Blue (#3a72db) is initially selected (not in unselected pool)
[PASS] Player 1 successfully updated to Lavender (#c36ede)
[PASS] After picking unselected color, all 4 tokens remain strictly unique
[PASS] Unselected pool remains exactly 5 colors
[PASS] Royal Blue (#3a72db) was released back to unselected pool
[PASS] Lavender (#c36ede) is now occupied and removed from unselected pool
[PASS] Selecting an occupied color directly is strictly prevented to avoid duplicate tokens
[PASS] Player 2 received Player 4 yellow color
[PASS] Player 4 received Player 2 red color
[PASS] Swapping maintains 4 distinct colors
[PASS] Team A Player 1 match pawn has tokenColorHex Lavender (#c36ede)
[PASS] Team B Player 2 match pawn has tokenColorHex Red (#b21919)
[PASS] Team A Player 3 match pawn has tokenColorHex Green (#7dc929)
[PASS] Team B Player 4 match pawn has tokenColorHex Yellow (#e6cc46)
[PASS] Player 1 belongs to TEAM_A
[PASS] Player 2 belongs to TEAM_B
[PASS] Reloaded Player 1 color from localStorage is Lavender (#c36ede)
[PASS] Reloaded Player 3 color from localStorage is Green (#7dc929)

🎉 ALL 89 UNIT & INTEGRATION TESTS PASSED CLEANLY!
```

---

## 7. Modified Files Reference

| File | Status | Description |
|---|---|---|
| [`src/components/PassNPlayTeamUpSetupScreen.tsx`](file:///e:/ludo_new/src/components/PassNPlayTeamUpSetupScreen.tsx) | Modified | Removed "LOAD SAVED GAMES" button; decreased player name width to `w-28 sm:w-36`; wrapped tokens in clickable white boxes (`bg-white`); integrated 4-token selection modal and dynamic unselected pool turnover. |
| [`src/components/PassNPlayClassicSetupScreen.tsx`](file:///e:/ludo_new/src/components/PassNPlayClassicSetupScreen.tsx) | Maintained | Page 5A setup screen with 9-color selection palette and strict Play button quota guard. |
| [`src/components/TokenPreviewSVG.tsx`](file:///e:/ludo_new/src/components/TokenPreviewSVG.tsx) | Maintained | Token rendering engine supporting `customHex` across all designs (`ninja`, `pin`, `disc`, `hammer`, `top`). |
| [`src/types/ludo.ts`](file:///e:/ludo_new/src/types/ludo.ts) | Maintained | Master player interface including `tokenColorHex?: string`. |
| [`src/components/LudoBoard.tsx`](file:///e:/ludo_new/src/components/LudoBoard.tsx) | Maintained | Board pawn rendering with radial gradient using `player.tokenColorHex`. |
| [`test_game_logic.ts`](file:///e:/ludo_new/test_game_logic.ts) | Modified | 89 automated tests covering rules, selection, uniqueness, and match creation. |

