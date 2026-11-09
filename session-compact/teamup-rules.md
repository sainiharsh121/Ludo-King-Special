# Ludo King: Team Up (2v2) Mode Rules & Mechanics

> **Document Location:** `session-compact/teamup-rules.md`  
> **Game Mode:** Team Up 2v2 Pass & Play (Local Cooperative Multiplayer)  
> **Workspace:** `E:\ludo_new`  
> **Status:** Production-Ready / Fully Implemented & Tested

---

## 1. Overview & Team Structure

- **Format:** Dedicated **2 vs 2 (4 Players Total)** cooperative match.
- **Teams:**
  - **Team A:** Player 1 (Bottom-Left / Blue Base) & Player 3 (Top-Right / Green Base).
  - **Team B:** Player 2 (Top-Left / Red Base) & Player 4 (Bottom-Right / Yellow Base).
- **Custom Player Colors & Uniqueness Rules:**
  - Players pick 4 distinct colors from the 9-Color Master Palette:
    - **Gold:** `#ffd700` | `rgb(255, 215, 0)`
    - **Silver:** `#c0c0c0`
    - **Red:** `#ff0000`
    - **Royal Blue:** `#3a72db`
    - **Pink:** `#ff69b4` | `rgb(255, 105, 180)` (replaces Lavender)
    - **Yellow:** `#ffff00`
    - **Green:** `#78f62f`
    - **Purple:** `#af27d7`
    - **Cyan:** `#00ffff` | `rgb(0, 255, 255)` (replaced Black `#3b3c36`)
    - *(Colors saved on a device by older versions - Silver `#777777`/`#777777ff`/`#e4e4e4`, Green `#008000`, Black `#3b3c36` - are auto-translated by `normalizeTokenHex()` in `TokenPreviewSVG.tsx`.)*
  - **Clean Selection UI:** Color labels display clean color names only (no hex codes).
  - **Clickable White Token Boxes:** Each player's token is housed in a clean white container box with team color borders (`border-sky-400` for Team A, `border-rose-400` for Team B).
  - **Color Picker & Swapping:** Clicking a token box displays the 5 unselected colors in a modal, or allows instant clean color swapping with another player.
  - **Random Dice Selection:** Clicking the 3D dice button in setup instantly assigns 4 randomized unique colors to all 4 players.
- **Enlarged Token Sizing:** Tokens rendered at increased dimensions (`22px × 28px` to `25px × 32px`) across the board and setup screens for maximum visibility.

---

## 2. Friendly Kill Rule & Teammate Interaction

- **Friendly Kill Toggle:** Configured in the Team Up setup screen before match start.
  - **Friendly Kill OFF (Default):** Teammate tokens can share any track square safely. If Player 1 lands on Player 3's cell, they cluster together and neither token is captured.
  - **Friendly Kill ON:** Teammates can capture each other's tokens if they land on the exact same tile.
- **Clean Token UI:** The previous `{i kill}` label on teammate tokens has been removed for a clean, distraction-free board appearance.

---

## 3. Dice Mechanics & Special Rolling Rules

- **Standard Dice:** Rolls from `1` to `6` with a fast 3D tumble (result committed ~260 ms after tap) and realistic sound effects; six probability is dynamically boosted on fresh rolls (see `classic_mode_rules.md` section 3.1).
- **Anti-Chain Six Rule (Max 2 Consecutive Sixes):**
  - Rolling a `6` awards a bonus roll.
  - Rolling a second consecutive `6` awards a second bonus roll.
  - If two consecutive sixes have been rolled, the **third roll is strictly capped between 1 and 5** (a 3rd consecutive 6 is impossible). *(Fixed 2026-11-09: the counter is no longer reverted by the single-token auto-move.)*
- **Home Column Overshoot Rule:**
  - When a player's last active token is in the home column needing $N$ steps to reach home:
  - If a number greater than $N$ is rolled (e.g., needs `5`, rolled `6`), the move is rejected and the turn immediately passes to the next player without bonus rolls.

---

## 4. Board Hazards & Power-ups (Dynamic Spawning)

- **4 Freeze Stars (❄️):**
  - 4 Freeze Stars spawn at random non-safe track locations.
  - A token landing on a Freeze Star is frozen for **1 turn**.
  - **Freeze Capture Vulnerability:** If an opponent token lands on a frozen pawn, **the frozen pawn is captured and sent back to yard**! Being frozen provides no defense against enemy captures.
- **4 Jump Icons (⚡ / 🚀):**
  - 4 Jump Icons spawn at random non-safe track locations.
  - A token landing on a Jump Icon gets an immediate hop of **1 to 5 random steps** (the first two icons may push **backward** with 50% chance); the icon is consumed and respawns after 2-3 minutes.
- **Dynamic Relocation Cycle:**
  - Both Freeze Stars and Jump Icons automatically relocate to new random track squares every **2 to 3 minutes** (120,000ms – 180,000ms randomized interval).

---

## 5. Partner Dice Sharing & Roll Transfer (Crucial Team Up Mechanic)

- **No Premature Victory for Individual Players:**
  - In Team Up mode, when one player (e.g. Team A Player 1) brings all 4 of their tokens into the final home center, **they are NOT declared a winner individually**.
- **Roll Transfer to Teammate:**
  - Instead of skipping Player 1's subsequent turns, **Player 1 continues to roll the dice on their turn**.
  - Their rolled dice number is **transferred directly to their teammate** (Player 3).
  - Player 3 receives control and uses Player 1's rolled number to move their remaining active tokens toward home!
  - This allows the finished partner to actively assist their teammate in completing their tokens.

---

## 6. Unified Team Victory Condition

- **Full Team Completion Required:**
  - A match only concludes and a winner is declared when **ALL 8 tokens** of a team (4 tokens of Player 1 + 4 tokens of Player 3, OR 4 tokens of Player 2 + 4 tokens of Player 4) have reached the final Home Triangle.
- **Team Standings:**
  - The first team to complete all 8 tokens is crowned the **Winning Team** (🏆).
  - The opposing team is declared the **Losing Team**.
- **Celebration Effects & Rematch Cleanup:**
  - Full-screen celebration banner, sound effects, and confetti shower.
  - Clicking `Rematch` cleanly clears all celebration confetti and resets the game state.

---

## 7. Penalty Task Selection (Post-Match Punishment)

- **Setup Flow (Page 5C):**
  - After configuring teams on Page 5B, clicking `Play` opens **Page 5C (`TeamUpTaskSelectionScreen`)**.
  - A penalty task is chosen from the 3 hilarious losing punishments:
    1. **`Dance on Bhojpuri song`** (💃): *Haarne par poori team Bhojpuri gaane par dhamakedar dance karegi!*
    2. **`salute marna hai ladle`** (🫡): *Haarne wale sabhi ladlo ko jeetne walo ke samne salute marna hoga!*
    3. **`Dhumka marna hai`** (🕺): *Haarne wali team ko sabke samne mast zabardast dhumka lagana padega!*
- **Match Outcome Enforcement:**
  - When a team loses the match, the selected penalty task is presented prominently on the Game Over screen, holding the losing team accountable to perform the punishment!

---

## 8. Implementation Notes (updated 2026-11-09)

- Token hop speed is **210 ms** per cell; tokens were enlarged (track `27x31 px`, yard `26x30 px`).
- Shared mechanics (hazard timing, bonus-roll priority, bots, persistence) are specified in `classic_mode_rules.md`. Team Up differs only in: no individual ranks, finished players keep rolling for their partner (`getControllingPlayer`), friendly-kill toggle, and team win only when all 8 tokens are home.
