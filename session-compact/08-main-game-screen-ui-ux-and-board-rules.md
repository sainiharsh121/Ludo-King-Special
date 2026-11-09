# Ludo King: Main Game Screen UI/UX & Board Rules — Architecture & Implementation

> **Document Location:** `session-compact/08-main-game-screen-ui-ux-and-board-rules.md`  
> **Session Phase:** Main Game Arena UI/UX Redesign & Board Rules Engine (Custom Player Colors & Slower Dice Scrolling)  
> **Target Platform:** Mobile-First Web Application (Android Chrome / iOS Safari / Responsive Desktop)  
> **Workspace:** `E:\ludo_new`  
> **Status:** Historical snapshot (119/119 tests at the time). Current suite: 2,521 assertions passing via `npm test` (2026-11-09).  
> **Update notes:** rolling duration is now fast (~260-285 ms, not 1350 ms); bottom page dots were removed; Lavender was replaced by Pink; tokens enlarged to track `27x31 px` / yard `26x30 px`; token hop is 210 ms. Current rules: `classic_mode_rules.md`.

---

## 1. Executive Summary & User Objectives

Per the user's specification and provided visual reference:
1. **Dynamic Board Quadrant Colors from Selected Player Colors:**
   - In previous versions, board quadrants and home paths used hardcoded Tailwind colors (`bg-rose-600`, `bg-emerald-600`, etc.).
   - Now, each quadrant's yard base, starting tile, home corridor, center home triangle, and token pips dynamically use the **player's chosen custom color (`tokenColorHex`)** selected during Classic or Team-Up setup (e.g. from the 9-Color Palette: Lavender `#c36ede`, Lime Green `#7dc929`, Lemon Yellow `#e6cc46`, Royal Blue `#3a72db`, etc.).
2. **Authentic Reference Image Board UI/UX:**
   - **Player Names on Board Bases:** Rendered directly in bold white text at the top of the Red/Green yards (`daniel`, `sandy`) and at the bottom of the Blue/Yellow yards (`soumya`, `john`).
   - **Yard White Inner Squares & Sockets:** Inside each colored base sits a crisp white square containing 4 solid colored circular sockets. When tokens leave the base, the sockets remain clearly visible as empty colored circular spots on the white surface.
   - **Teardrop Map-Pin Tokens:** Rendered matching the reference image's map-pin shape (white/silver outer rim, colored center gem, glossy highlight, drop shadow).
   - **Directional Arrows & Stars:**
     - Directional colored arrows for each quadrant: Red `→` (left arm), Green `↓` (top arm), Yellow `←` (right arm), Blue `↑` (bottom arm).
     - Clean outlined 5-pointed stars on the 4 safe squares: row 8 col 2 (left), row 2 col 6 (top), row 6 col 12 (right), row 12 col 8 (bottom).
     - 4 Center home triangles meeting cleanly at the center point in each player's selected color.
3. **Player Turn Controllers (HUD) & Golden Pointer Arrow:**
   - Symmetrical 2x2 player HUD controllers with champagne/golden border and rich royal blue gradient background.
   - Left players (Red & Blue): Token Pin Badge on outer LEFT, Dice socket on inner RIGHT.
   - Right players (Green & Yellow): Dice socket on inner LEFT, Token Pin Badge on outer RIGHT.
   - Active player displays a blocky **Golden Pointer Arrow** (yellow-to-orange gradient with dark bronze border) pointing directly at their dice (`◀` for left controllers, `▶` for right controllers) with animated bounce.
4. **Slower Dice Scrolling & Rolling Speed:**
   - Extended rolling duration from 600ms to **1350ms** (1.35s).
   - Added `dice-tumbling-slow` 3D keyframe tumbling animation (1.35s duration) with smooth deceleration.
   - Face scrolling effect: cycles through dice faces every 110ms while rolling, smoothly settling on the final rolled value with audio land punch.
5. **Authentic Wallpaper & Responsive Layout:**
   - Integrated `.ludo-king-match-bg` with deep blue radial gradient, 45° diamond tile wallpaper, and subtle corner vignette.
   - Bottom page status dots (`• • • • • •`) matching the reference image.

---

## 2. Test Verification Matrix (119/119 Tests Passing)

```
--- TEST SUITE: Main Game Screen UI/UX & Board Rules ---
✅ PASS: Dice roll duration is slowed down to at least 1200ms (1350ms)
✅ PASS: Dice roll duration is within smooth range (1350ms)
✅ PASS: Red yard uses selected player color #c36ede (Lavender)
✅ PASS: Green yard uses selected player color #7dc929 (Lime Green)
✅ PASS: Yellow yard uses selected player color #e6cc46 (Lemon Yellow)
✅ PASS: Blue yard uses selected player color #3a72db (Royal Blue)
✅ PASS: Red yard displays player name Daniel
✅ PASS: Green yard displays player name Sandy
✅ PASS: Yellow yard displays player name John
✅ PASS: Blue yard displays player name Soumya
✅ PASS: Initially 0 empty sockets (all 4 tokens in yard)
✅ PASS: Daniel has 1 empty socket on white square (token on track)
✅ PASS: Soumya has 2 empty sockets on white square (2 tokens on track)
✅ PASS: Global track index 0 is safe
✅ PASS: Global track index 8 is safe
✅ PASS: Global track index 13 is safe
✅ PASS: Global track index 21 is safe
✅ PASS: Global track index 26 is safe
✅ PASS: Global track index 34 is safe
✅ PASS: Global track index 39 is safe
✅ PASS: Global track index 47 is safe
✅ PASS: Global track index 1 is not safe
✅ PASS: Global track index 5 is not safe
✅ PASS: Inactive Green yard displays no player name
✅ PASS: Inactive Blue yard displays no player name

🎉 ALL 119 UNIT & INTEGRATION TESTS PASSED CLEANLY!
```

---

## 3. Advanced Rules, Hazards & Polish Updates (Version 1.2+)

### 3.1 Board Hazards & Power-ups
- **4 Freeze Stars (❄️):** 4 Freeze Stars spawn across non-safe track positions. Landing on one freezes that token for 1 turn.
- **Freeze Capture Vulnerability Rule:** If an opponent token lands on an already frozen token, the frozen token is captured and sent back to its yard! Freeze stars do not provide immunity against enemy attack.
- **4 Jump Icons (⚡ / 🚀):** 4 Jump Icons spawn across non-safe track positions. Landing on one awards 1 to 5 random bonus steps forward.
- **Dynamic Relocation Timer:** All 4 Freeze Stars and 4 Jump Icons relocate to new random positions every 2 to 3 minutes (120,000ms – 180,000ms randomized interval).

### 3.2 Anti-Chain Six Dice Rule
- Rolling a `6` grants a bonus roll.
- Rolling a second `6` consecutively grants another bonus roll.
- **Max 2 Consecutive Sixes:** If two consecutive sixes are rolled in the same turn, the 3rd roll is strictly clamped between `1` and `5` (a 3rd six cannot appear).

### 3.3 Home Column Overshoot Turn Passing Rule
- When a player has only 1 remaining token left, and that token is inside the 5-cell home column:
- If the token needs $N$ steps to reach home and the player rolls a number $> N$ (e.g. needs `5`, rolled `6`), the turn passes immediately to the next player without bonus rolls.

### 3.4 Team Up Partner Dice Sharing / Roll Transfer
- When a player in Team Up mode (e.g. Player 1) brings all 4 tokens home, they are not declared winner individually.
- Instead, their subsequent turns transfer their rolled dice number directly to their active teammate (Player 3) to move their tokens.
- Team victory is decided only when all 8 tokens of both teammates reach home.

### 3.5 Authentic Audio & Visual Enhancements
- **Acoustic Matching to Gameplay Recording:** Dice tumbling and token hopping audio procedural synthesizers updated to match real game clatter, high-gain punch, and loud bounce feedback.
- **Enlarged Token Sizing:** Token dimensions scaled several times; current sizes are track `27x31 px` (>= sm `31x36 px`) and yard `26x30 px` (>= sm `29x34 px`) for all 5 skins.
- **Celebration Rematch Reset:** Confetti animation from `GameOverModal` is cleanly stopped and disposed upon rematch.


