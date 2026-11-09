# Ludo King: Version 1.2 — Milestone Architecture & Status Report

> **Document Location:** `session-compact/version1.2.md`  
> **Release Version:** 1.2.x (latest git tag `v1.2.7`; `package.json` still reads `1.2.5` - bump it on the next release)  
> **Git Repository:** `https://github.com/sainiharsh121/Ludo-King-Special.git`  
> **Date:** November 2026 (last updated 2026-11-09)  
> **Workspace:** `E:\ludo_new`  
> **Target Platform:** Mobile-First Web Application (Android Chrome / iOS Safari / Responsive Desktop) & Native Android APK (Capacitor)  
> **Status:** Production-Ready / 100% Automated Test Suites Passing (2,521 assertions via `npm test`) / Zero Build Errors / 60 FPS Mobile Performance

---

## 1. Executive Summary & Key Milestones in Version 1.2

Version 1.2 delivers major gameplay dynamics, visual refinements, competitive fairness rules, and authentic audio synthesizers matching recorded real-world gameplay:

1. **Board Hazards & Power-ups (4 Freeze Stars + 4 Jump Icons):**
   - Increased hazard count to **4 Freeze Stars** and **4 Jump Icons**.
   - Added randomized dynamic relocation timer: hazards cycle every **2 to 3 minutes** (120,000ms – 180,000ms).
   - **Freeze Capture Vulnerability Rule:** Opponent landing on an already frozen token captures it and returns it to base yard.
2. **Competitive Dice Mechanics:**
   - **Anti-Chain Six Rule:** Strictly capped at maximum 2 consecutive sixes. The 3rd roll is guaranteed between `1` and `5`.
   - **Home Column Overshoot Rule:** When a player's last active token is in the home column and overshoots the required steps to home, the turn immediately passes to the next player with no bonus roll.
3. **Team Up (2v2) Partner Dice Sharing & Roll Transfer:**
   - When a player brings all 4 tokens to the home finish, individual victory is deferred.
   - The finished player's rolled dice values are automatically transferred to their active partner, who moves their own tokens with the roll.
   - Final victory is declared only when all 8 tokens of both partners reach home.
4. **Visual & Color Palette Modernization:**
   - **Gold:** Updated to `#ffd700` (`rgb(255, 215, 0)`).
   - **Black:** Updated to `#3b3c36` (`rgb(59, 60, 54)`).
   - **Pink:** Updated to `#ff69b4` (`rgb(255, 105, 180)`), cleanly replacing Lavender.
   - **Raw Hex Codes Removed:** Color selection cards display clean names only ("Gold", "Pink", "Black").
   - **Random Dice Button:** Instant 3D dice button to randomize unique colors for all active players.
   - **Enlarged Token Sizing:** Token dimensions scaled (`22px × 28px` to `25px × 32px`) across yard sockets, track paths, and HUD badges to eliminate eye strain.
   - **Clean Teammate UI:** Removed `{i kill}` badge text from teammate tokens on the board.
5. **Authentic Procedural Audio Synthesis:**
   - Dice tumbling and token hopping Web Audio synthesizers matched to recorded gameplay clatter, high-gain punch, and realistic impact acoustics.
6. **Celebration Rematch Reset:**
   - Confetti particle animations from `GameOverModal` are cleanly stopped and cleared from memory upon rematch trigger.

---

## 2. Version 1.2.4 — Brand Identity & Custom App Logo

- **Brand Rebranding:** App title updated from "Ludo King" / "Ludo Classic" to simply **"Ludo"**.
- **In-Game Header:** Match arena header updated to feature the new official Ludo vector logo with clean "LUDO" typography.
- **New SVG Logo Assets:** Extracted and bundled 3 official logo variations:
  - `logo_dice_plate.svg` / `favicon.svg`: Dice-O Plate (Primary official app icon & web favicon).
  - `logo_night_diamond.svg`: Night Diamond (Midnight board diamond variant).
  - `logo_gold_pin.svg`: Gold Pin (Four-color header token pin on navy board watermark).
- **Capacitor & Android Config:** Synchronized `capacitor.config.json` and `strings.xml` with `appName` set to **"Ludo"**.
- **Classic Mode Home Corridor Entry Correction:** Fixed `mustCaptureToEnterHome` to `false` for Classic Mode (`PassNPlayClassicSetupScreen`, `PassNPlayTeamUpSetupScreen`, `App.tsx`, and `SetupModal`). Tokens in Classic can now enter their colored home column directly without needing a prior kill/capture (mandatory kill restriction now correctly restricted only to Quick Game mode).
- **Primary Color Palette Refinement:**
  - **Red:** Updated to pure `#ff0000` (`rgb(255,0,0)`).
  - **Yellow:** Updated to pure `#ffff00` (`rgb(255,255,0)`).
  - **Green:** Updated to pure `#008000` (`rgb(0,128,0)`).
- **Token Alignment & Cell Geometry Bounds:**
  - Token size scaled to `18px × 23px` (`sm: 21px × 26px`) on board tracks. Pin teardrop body and needle tip remain strictly within the 1x1 grid cell boundary with clean padding, completely eliminating border overflow.
- **Android APK Launcher Icons Generated:**
  - Generated all native Android launcher icons (`ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`) across all mipmap densities (`mipmap-mdpi`, `mipmap-hdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi`) from the official Ludo vector logo, ensuring APK builds show the custom logo on phone home screens.

---

## 3. Automated Test Verification Matrix

All test suites pass with 100% success rate:
- ✅ **Base Yard Exit & Track Mechanics:** Safe stars, base unlocks, capture rules, home entry guards.
- ✅ **Hazard System:** 4 Freeze Stars, 4 Jump Icons, 2–3 min relocation, frozen capture vulnerability.
- ✅ **Dice Engine:** Max 2 sixes cap, home overshoot turn passing, fast dice roll (~260-285 ms, see classic_mode_rules.md).
- ✅ **Team Up Engine:** Partner roll transfer, 8-token team win condition, friendly kill toggle.
- ✅ **Visual & Accessibility:** 9-color palette, zero raw hex outside `:root`, WCAG AAA/AA contrast.


---

## 4. Version 1.2.5 - 1.2.7 (2026-11-06)

- **v1.2.5:** Classic Mode no longer needs a capture before entering the home column (`mustCaptureToEnterHome = false`); the capture-first rule is Quick Mode only.
- **v1.2.6:** Pin token inner colour circle enlarged; yard socket circles reduced so tokens sit on a ring pedestal.
- **v1.2.7:** Palette update (pure Red `#ff0000`, Yellow `#ffff00`, Green `#008000`), token/cell alignment fixes, Android launcher icons for every mipmap density.

## 5. Post-1.2.7 Changes (2026-11-06 to 2026-11-07)

- **Token animation speed** iterated 80 -> 120 -> 180 -> **210 ms per cell** (final). `pawnSpeedMs: 210` is set in `App.tsx`, `SetupModal`, `PassNPlayClassicSetupScreen`, `PassNPlayTeamUpSetupScreen`. *(Note: `src/engine/config.ts` - unused by the UI - still says 180 ms.)*
- **Dice:** borderless 3D dice, curved corners, HUD dice slot shading matched; settle delay removed (dice result is committed ~260 ms after the tap).
- **Dynamic six-boost:** fresh rolls get +5% / +12% / +18% extra six probability (see `classic_mode_rules.md` section 3.1).
- **Dual-direction Jump Icons:** the first two jump icons can push a token **backward** 1-5 cells (50%).
- **Yard fix:** a yard token unlocks directly onto its start square (no bounce); finished players are skipped in Classic turn order.
- **UI cleanup:** turn dots replaced by a glassmorphic mode badge; pulsing amber dot and redundant header badge removed; clean mode-selection top bar.
- **Quick Mode:** home column locked until first capture, with a lock/unlock animation; tokens circle the outer track meanwhile; **step-51 wrap-around** and corridor-vs-track distinction fixed; volume button repositioned.

## 6. 2026-11-09 Update

- **Bug fix - three consecutive sixes could appear.** When only one token was movable, the auto-move used a stale `players` snapshot and reverted `consecutiveSixes`, defeating the "max 2 sixes" guard. `animateAndApplyMove` now receives the fresh count and re-applies it before saving state. New regression test `tests/three_sixes_rule.test.ts` (added to `npm test`).
- **Larger tokens (all 5 skins: pin, disc, hammer, top, ninja):**
  - Track: `24x28 -> 27x31 px` (>= `sm`: `28x32 -> 31x36 px`)
  - Yard: `23x26 -> 26x30 px` (>= `sm`: `26x30 -> 29x34 px`)
  - Applies to static tokens and the animating (hopping/rewinding) token in `LudoBoard.tsx`.
- **Bug fix - Jump Icon at the home-column entrance.** In Quick Mode (column locked), a token landing on a Jump Icon beside its home column was wrapped `(step + jump) % 52` back around the track. A forward jump that crosses the entrance now carries the token into the column (or home). Tokens already inside the column are exempt from the lock. New test `tests/jump_into_home_column.test.ts`.
- **Pin token ring animation:** the brown pedestal ring under the Pin token now has small gaps (8 segments) and rotates while it is the owner's turn (every token of the active player, plus the active player's HUD pin). Test: `tests/pin_ring_spin.test.ts`.
- **Palette update:** Green is now `#78f62f`, Silver `#c0c0c0`, and the Black option became **Cyan `#00ffff`** (`NINE_TOKEN_COLORS`). `normalizeTokenHex()` translates colours saved by older versions (`#777777ff`, `#e4e4e4`, `#008000`, `#3b3c36`) so existing saved selections keep working. Board default `--seat-green` stays `#008000`. Team Up default P3 colour is now `#78f62f`.
- **Fresh game on every app launch.** The app no longer resumes an unfinished match or last screen after a restart: `resetSessionOnLaunch()` clears the stored active match, screen and URL hash at startup (manual saved games, splash-seen flag and preferences are kept). Test: `tests/fresh_start_on_launch.test.ts`.
- **Token sizes are shared by all modes** (Classic, Team Up, Quick use the same `LudoBoard`).
- **Docs:** new `classic_mode_rules.md` (rules as implemented, previously unwritten); the old `classic-rules.md` was removed in favour of it; stale values corrected in `teamup-rules.md`, `08-...md`, `version1.1.md`, `01-setup.md`.

## 7. Known Architecture Notes

- The playable game runs on `src/utils/gameRulesEngine.ts` + `src/App.tsx`. `src/engine/` (seeded 0..57 event engine from `README.md`) and its tests (`engine_acceptance`, `simulate_10000`) are **not used by the UI**.
- Randomness in the live game (`Math.random`, unseeded PRNG) is not replayable.
