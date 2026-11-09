# Ludo — Pass & Play (Classic, Team Up & Quick)

A mobile-first Ludo game built with **React 19**, **TypeScript**, **Vite 8** and **Tailwind CSS 4**, packaged as a native Android app with **Capacitor 8**.
Play locally with friends or against bots on one device: **Classic** (every player for themselves), **Team Up** (2 v 2) and **Quick** (fast, capture-to-unlock variant), with board hazards (Freeze Stars & Jump Icons), five token skins, nine player colours, procedural Web Audio sound and 3D dice.

> App id `com.mycompany.ludo` · package version `1.2.5` · latest git tag `v1.2.7`

---

## 1. Quick start

```bash
npm install
npm run dev          # Vite dev server on http://localhost:5173 (also exposed on your LAN with --host)
npm test             # full automated test suite (~2,500 assertions)
npm run build        # type-check (tsc) + production bundle in dist/
npm run preview      # serve the production bundle locally
```

### Build the Android APK (no Android Studio required)

Requires a JDK (17+) and the Android SDK (`android/local.properties` → `sdk.dir`).

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug          # Windows PowerShell: .\gradlew.bat assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk` (debug-signed, installable directly or via `adb install -r`).
Bump `versionCode` in `android/app/build.gradle` before installing over an existing build. A Play Store release needs a signed release build (keystore) — not set up yet.

---

## 2. What is in the app

| Area | Details |
|---|---|
| **Modes** | Pass & Play → **Classic**, **Team Up (2v2)**, **Quick**. Online, Friends, Vs Computer, Tournament and the Dice Cup mini-game are visible on the home screen but **locked**. |
| **Players** | 2, 3 or 4 players; any seat can be a bot. |
| **Tokens** | 5 skins: `pin`, `disc`, `hammer`, `top`, `ninja`. The **pin** token has a pedestal ring made of 8 segments that **rotates on its owner's turn**. |
| **Colours** | 9-colour palette: Gold `#ffd700`, Silver `#c0c0c0`, Red `#ff0000`, Blue `#3a72db`, Pink `#ff69b4`, Yellow `#ffff00`, Green `#78f62f`, Purple `#af27d7`, Cyan `#00ffff`. Chosen colours recolour the player's yard, home column and tokens. |
| **Board themes** | Classic King, Rich Mahogany, Royal Sapphire, Neon. |
| **Hazards** | 4 **Freeze Stars** and 4 **Jump Icons** on ordinary track cells, relocating/respawning every 2–3 minutes. |
| **Audio / visuals** | Procedural Web Audio sound effects, 3D tumbling dice, confetti podium, parabolic token hops (210 ms per cell). |
| **Persistence** | Manual saved games, remembered preferences. **Every app launch starts a fresh game** (see §4). |

---

## 3. Rules as implemented (summary)

Full, code-verified specifications live in [`session-compact/`](session-compact):
[`classic_mode_rules.md`](session-compact/classic_mode_rules.md) (Classic, plus shared mechanics) · [`teamup-rules.md`](session-compact/teamup-rules.md) · [`version1.2.md`](session-compact/version1.2.md) (changelog / status).

- **Leaving the yard:** roll a `6` (Classic/Team Up). The token lands on its start square.
- **Dice:** fresh rolls are weighted towards sixes (≈ 22–35 % chance of a 6). **At most two sixes in a row** — after two, the third roll is forced to `1–5`.
- **Bonus roll** (one per move; priority capture > home > six): capturing an enemy, reaching home, or rolling a six. A roll with no legal move passes the turn (no bonus, even on a six).
- **Capture:** land on a non-safe cell holding an opponent. Safe cells: the 4 start squares and 4 star squares (`0, 8, 13, 21, 26, 34, 39, 47`). No blockades/stacks.
- **Home:** the exact roll is required to finish. Classic tokens may enter the home column freely; **Quick Mode** locks the column until the player's first capture (tokens circle the track meanwhile).
- **Freeze Star ❄️:** the token that lands on one is frozen for a turn and can be captured even on a safe square. **Jump Icon ⚡:** hops the token 1–5 cells (the first two icons may push backward); a forward jump that crosses the home-column entrance carries the token into its column.
- **Ranks:** players finish one by one; finished players are skipped. The match ends when one player remains.
- **Team Up:** Team A = seats 1 & 3, Team B = seats 2 & 4. A player who has finished keeps rolling and moves their partner's tokens; the team wins when all 8 tokens are home. A losing-team penalty task can be selected before the match.

---

## 4. Persistence & app launch behaviour

- Starting the app (or reloading the page) **always begins a new game**: the unfinished match, the remembered screen and any stale URL hash are discarded (`resetSessionOnLaunch()` in `src/App.tsx`).
- Backgrounding and resuming the app does **not** reload the page, so a running match continues.
- Kept across launches: manually **saved games** (Saved Games modal), the "splash seen" flag (the splash only shows on the very first launch) and preferences such as the token skin and last-used colours.

---

## 5. Project structure

```
src/
  App.tsx                    Match state, turn loop, bots, hazards timers, routing between screens
  components/
    LudoBoard.tsx            15×15 board, yards, home columns, tokens layer, hazards
    TokenPreviewSVG.tsx      5 token skins, 9-colour palette (NINE_TOKEN_COLORS), pin ring animation
    Dice3D.tsx, PlayerHUD.tsx, GameOverModal.tsx, SetupModal.tsx, ThemesModal.tsx, ...
    HomeScreen.tsx, SplashScreen.tsx, PassNPlay*SetupScreen.tsx, TeamUpTaskSelectionScreen.tsx
  utils/
    gameRulesEngine.ts       ← the rules the game actually runs on (legal moves, captures, bonuses, jumps)
    boardCoordinates.ts      52-cell track, home columns, hazard cells, step → grid coordinates
    soundEngine.ts, audioAssets.ts, savedGamesEngine.ts
  types/ludo.ts              Player, Pawn, GameRules, screens, modes
  engine/                    Standalone deterministic engine (see §7) — not wired into the UI
  index.css                  Design tokens in :root (colours), keyframes, board/HUD styling
android/                     Capacitor Android project
tests/, test_game_logic.ts   Test scripts (run with tsx)
session-compact/             Design notes, rule specs and version history
```

**Changing colours:** board and UI colours are CSS variables in `src/index.css` (`:root`); the nine player token colours are `NINE_TOKEN_COLORS` in `src/components/TokenPreviewSVG.tsx`. Colours saved by older versions are migrated by `normalizeTokenHex()`. Source files outside those two places must not contain raw hex codes (a test enforces this for the board, HUD and game-over modal).

### Step scale used by the live game

| `step` | Meaning |
|---|---|
| `-1` | In the yard |
| `0` | Own start square |
| `1 … 50` | Shared track |
| `51 … 55` | Private home column |
| `56` | Home (finished) |

---

## 6. Tests

`npm test` runs every suite below with `tsx` (no test framework); each prints `✅ PASS` lines and exits non-zero on failure.

| Suite | Covers |
|---|---|
| `test_game_logic.ts` | Setup flows, colour pickers, persistence, board maths, Team Up logic |
| `tests/dice_and_movement_rules.test.ts` | Dice, movement, home entry, hazards, Quick Mode |
| `tests/senior_rules_update.test.ts` | Two-six cap, overshoot rule, Team Up roll transfer, hazard timing |
| `tests/three_sixes_rule.test.ts` | Regression: a third consecutive six can never appear |
| `tests/jump_into_home_column.test.ts` | Jump Icon beside the home column |
| `tests/fresh_start_on_launch.test.ts` | Fresh game on every launch |
| `tests/pin_ring_spin.test.ts` | Pin token ring gaps and rotation |
| `tests/token_skins_and_freeze_capture.test.ts`, `two_player_colors.test.ts` | Skins, palette, frozen-token capture, empty-quadrant colours |
| `tests/contrast_acceptance.test.ts` | WCAG contrast, no raw hex in components |
| `tests/celebration_and_rank_board.test.ts`, `dice_and_token_sound.test.ts` | Rankings/rematch, audio assets |
| `tests/engine_acceptance.test.ts`, `tests/simulate_10000.ts` | The standalone `src/engine` (see §7) |

Single suites: `npm run test:rules`, `test:contrast`, `test:engine`, `test:simulate`.

---

## 7. Standalone deterministic engine (`src/engine/`)

`src/engine/` is a separate, fully **pure and seedable** 4-seat engine kept as a reference implementation and test bed. **The UI does not use it** (the app only imports `engine/rng.ts`); the playable game runs on `utils/gameRulesEngine.ts` + `App.tsx`. Its step scale is `0 … 57` and its timings in `config.ts` are independent of the app's.

```
(state, action, rng) ──► State machine (pure, JSON-serialisable) ──► events[]
                                                                      │
                                       Animation controller (consumes events in order)
```

- Mulberry32 PRNG (`rng.ts`), typed domain events (`DICE_ROLLED`, `TOKEN_STEP`, `ENEMY_CAPTURED`, `TOKEN_HOME`, `THREE_SIX_FORFEIT`, `SEAT_FINISHED`, `TEAM_WON`, `GAME_OVER`, …), bot AI, and a `CFG` object (`config.ts`) holding every rule flag (stacks, friendly kill, team win, three-six penalty, …).
- Verified by `tests/engine_acceptance.test.ts` and `tests/simulate_10000.ts` (10,000 bot games per mode, no deadlocks).
- Differences from the live game: forfeit-on-third-six instead of the forced `1–5`, fair dice, stacks that block capture, no hazards.

If you want the app to run on this engine, the live rules would need to be ported to it (or vice-versa) — see "Known gaps" below.

---

## 8. Known gaps

- Two rule implementations exist (live game vs `src/engine`); they are not kept in sync.
- Gameplay randomness (dice, hazard placement, jump size, bots) uses `Math.random`/an unseeded PRNG, so live games are not replayable.
- `App.tsx` (~1,700 lines) holds the whole turn loop with chained timeouts; it has no UI-level tests (tests mostly assert on the rules engine and on source text).
- Android: debug-signed builds only; `package.json`/`versionName` (`1.2.5`) lag behind the git tags (`v1.2.7`).
