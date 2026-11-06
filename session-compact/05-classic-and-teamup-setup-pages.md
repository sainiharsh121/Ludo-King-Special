# Ludo King: Page 5A (Classic Setup) & Page 5B (Team Up Setup) — Architecture & Implementation

> **Document Location:** `session-compact/05-classic-and-teamup-setup-pages.md`  
> **Session Phase:** 9-Color Frontend Token Palette, Strict Play Button Quota Guard, Team Up 4-Token Selection Rules & Clickable Boxes, Board Custom Token Rendering & Refresh Persistence  
> **Target Platform:** Mobile-First Web Application (Android Chrome / iOS Safari / Responsive Desktop)  
> **Workspace:** `E:\ludo_new`  
> **Status:** Production-Ready / 100% Automated Tests Passing (89/89) / Zero Build Errors / Dev Server Live at `http://localhost:5173/`

---

## 1. Executive Summary & Objectives

### 1.1 Page 5A — 9-Color Token Selection Palette on the Frontend
- **Visible 9-Color Selection Palette (3x3 Grid):**
  1. `#ffd700`: **Gold** (`rgb(255,215,0)`)
  2. `#777777`: **Silver**
  3. `#b21919`: **Red**
  4. `#3a72db`: **Blue**
  5. `#ff69b4`: **Pink** (`rgb(255,105,180)`) (Replaced Lavender)
  6. `#e6cc46`: **Yellow**
  7. `#7dc929`: **Green**
  8. `#af27d7`: **Purple**
  9. `#3b3c36`: **Black** (`rgb(59,60,54)`) (Replaced Dark #2e2730)
- **Hex Code Removal from UI:**
  - Removed raw hex codes (e.g. `#3A72DB`, `#FF69B4`) from the color selection cards; now displaying only clean, elegant color names (e.g. "Gold", "Pink", "Black").
- **Random Color Selection Dice:**
  - Added a dedicated 3D dice button adjacent to the player color selection. Tapping this dice automatically randomizes distinct colors for all active players.
- **Enlarged Token Preview & Dimensions:**
  - Enlarged token preview icons in setup and board yard sockets (`22px × 28px` to `25px × 32px`) to eliminate eye strain.
- **Strict Play Button Quota Guard:**
  - **2 Players (2P):** Users can select any 2 colors from the 9 colors. If fewer than 2 colors are selected (e.g. 0 or 1), the `Play` button is **STRICTLY DISABLED** (`disabled`, `opacity-50`, `cursor-not-allowed`). Once exactly 2 colors are selected, the Play button is activated!
  - **3 Players (3P):** Users can select any 3 colors from the 9 colors. If fewer than 3 colors are selected, the Play button is disabled.
  - **4 Players (4P):** Users can select any 4 colors from the 9 colors. If fewer than 4 colors are selected, the Play button is disabled.
  - Removed secondary `Play - One Token Out -` button per user request.
- **Toggling & Deselecting:**
  - Tapping a selected color deselects it, dropping the count and disabling the Play button with a clear warning alert: `"Select X more color to Play"`.
  - Tapping an unselected color adds it (or replaces active focused slot if quota is already reached).
- **Player Limit:** Strictly maximum 4 players (only `2P`, `3P`, `4P`; `5P` and `6P` permanently removed).

### 1.2 Page 5B — Team Up 4-Token Color Rules & Clickable Token Boxes
- **Removal of "Load Saved Games" & Secondary "Play - One Token Out -" Buttons:**
  - The top "Load Saved Games" button pill above "CHOOSE COLOR AND NAME" has been permanently removed per user request.
  - The secondary `Play - One Token Out -` button has been removed from Team Up setup, leaving a single, prominent, gold-bordered `Play` button.
- **Clickable Token Boxes with Crisp White Background:**
  - Each of the 4 player tokens (`p1`, `p3` in Team A; `p2`, `p4` in Team B) is now enclosed in a dedicated clickable box (`w-8 h-8 sm:w-9 sm:h-9 rounded-xl`).
  - Set with a **crisp white background (`bg-white`)** ensuring maximum visual contrast so that dark ninja bodies, visor reflections, and token color headbands/collars pop vividly.
  - Features team-colored borders (`border-sky-400` for Team A, `border-rose-400` for Team B), a mini palette `🎨` indicator, and active ring feedback.
- **Decreased Player Name Input Width:**
  - Replaced expansive `flex-1` width with a compact, centered `w-28 sm:w-36` input with dashed borders, balancing the row layout.
- **Rules for Selection Colors of the 4 Tokens:**
  1. **Strict 4-Color Uniqueness Rule:** No two players can ever share the same token color.
  2. **Unselected Colors Pool:** Out of the 9 palette colors, 4 are assigned to the 4 players, leaving **exactly 5 unselected colors**.
  3. **Revealing Unselected Colors:** Clicking a token box displays a dedicated color picker modal showcasing all 5 unselected colors with their names and token design previews.
  4. **Instant Assignment & Pool Release:** Selecting any unselected color instantly assigns it to that player, frees their old color back into the unselected pool, and persists to `localStorage` (`ludo_pnp_teamup_colors`).
  5. **Direct Swap Support:** Players can also tap an occupied color to safely swap colors between teammates or opponents without duplicating colors.

### 1.3 Board & Player HUD Integration
- `Player.tokenColorHex` persists the chosen color for each player.
- **`LudoBoard.tsx`**: Pawns and hopping animation render with `player.tokenColorHex` radial gradients.
- **`PlayerHUD.tsx`**: Player avatars feature a token color indicator dot and custom radial glow corresponding to their chosen color.

---

## 2. Automated Test Verification (89/89 Passing)

The test suite in `test_game_logic.ts` executes **89 automated unit & integration tests** with 100% pass rate:

```
--- TEST SUITE: Page 5B Team Up 4-Token Color Rules & Selection ---
✅ PASS: Team Up has exactly 4 player token colors
✅ PASS: All 4 default Team Up token colors are strictly unique
✅ PASS: Exactly 5 colors are unselected initially (9 - 4 = 5)
✅ PASS: Lavender (#c36ede) is initially unselected
✅ PASS: Royal Blue (#3a72db) is initially selected (not in unselected pool)
✅ PASS: Player 1 successfully updated to Lavender (#c36ede)
✅ PASS: After picking unselected color, all 4 tokens remain strictly unique
✅ PASS: Unselected pool remains exactly 5 colors
✅ PASS: Royal Blue (#3a72db) was released back to unselected pool
✅ PASS: Lavender (#c36ede) is now occupied and removed from unselected pool
✅ PASS: Selecting an occupied color directly is strictly prevented to avoid duplicate tokens
✅ PASS: Player 2 received Player 4 yellow color
✅ PASS: Player 4 received Player 2 red color
✅ PASS: Swapping maintains 4 distinct colors
✅ PASS: Team A Player 1 match pawn has tokenColorHex Lavender (#c36ede)
✅ PASS: Team B Player 2 match pawn has tokenColorHex Red (#b21919)
✅ PASS: Team A Player 3 match pawn has tokenColorHex Green (#7dc929)
✅ PASS: Team B Player 4 match pawn has tokenColorHex Yellow (#e6cc46)
✅ PASS: Player 1 belongs to TEAM_A
✅ PASS: Player 2 belongs to TEAM_B
✅ PASS: Reloaded Player 1 color from localStorage is Lavender (#c36ede)
✅ PASS: Reloaded Player 3 color from localStorage is Green (#7dc929)

🎉 ALL 89 UNIT & INTEGRATION TESTS PASSED CLEANLY!
```

---

## 3. Summary of Files Created & Modified

| File | Status | Description |
|---|---|---|
| [`src/components/PassNPlayTeamUpSetupScreen.tsx`](file:///e:/ludo_new/src/components/PassNPlayTeamUpSetupScreen.tsx) | Modified | Removed "Load Saved Games" button; made tokens clickable inside dedicated styled boxes; decreased player name input width; added 4-token color selection rules with modal revealing all unselected colors. |
| [`src/components/PassNPlayClassicSetupScreen.tsx`](file:///e:/ludo_new/src/components/PassNPlayClassicSetupScreen.tsx) | Maintained | Page 5A: Displays full 9-color token selection palette on the frontend, interactive toggling/deselecting, strict play button disable guard when quota is unmet. |
| [`src/components/TokenPreviewSVG.tsx`](file:///e:/ludo_new/src/components/TokenPreviewSVG.tsx) | Maintained | Supports `customHex` rendering for any token design (`pin`, `disc`, `hammer`, `top`, `ninja`) across all 9 hex colors. |
| [`src/types/ludo.ts`](file:///e:/ludo_new/src/types/ludo.ts) | Maintained | Contains `tokenColorHex?: string` in `Player` interface. |
| [`src/components/LudoBoard.tsx`](file:///e:/ludo_new/src/components/LudoBoard.tsx) | Maintained | Renders pawns and in-flight animations using `player.tokenColorHex`. |
| [`src/components/PlayerHUD.tsx`](file:///e:/ludo_new/src/components/PlayerHUD.tsx) | Maintained | Added custom token color indicator dot and radial glow to player HUD. |
| [`test_game_logic.ts`](file:///e:/ludo_new/test_game_logic.ts) | Extended | Extended from 74 to 89 automated tests covering Team Up 4-token selection rules, unselected pool calculation, and refresh persistence. |
| [`session-compact/05-classic-and-teamup-setup-pages.md`](file:///e:/ludo_new/session-compact/05-classic-and-teamup-setup-pages.md) | **Updated** | Full architecture and test documentation. |
