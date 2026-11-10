# Ludo: Classic Mode — Complete Implemented Rules (Undocumented Rules Addendum)

> **Document Location:** `session-compact/classic_mode_rules.md`
> **Replaces** the former `classic-rules.md` (removed). This file records the **exact Classic rules as implemented in code** — including behaviours that were never written down before.
> **Workspace:** `E:\ludo_new` | **Verified against:** `src/App.tsx`, `src/utils/gameRulesEngine.ts`, `src/utils/boardCoordinates.ts`
> **Game mode:** Classic Pass & Play (2P / 3P / 4P) — also noted where Quick Mode / Team Up differ.
> **Last updated:** 2026-11-09

---

## 0. Which engine runs the game?

The live game uses **`src/utils/gameRulesEngine.ts` + `src/App.tsx`** (step scale `-1 … 56`, hazards, bots, saved games).
`src/engine/` (seeded, event-driven 0…57 engine described in `README.md`) is **not wired into the UI** (only `engine/rng.ts` is imported). The rules below describe the live game, not `src/engine/`.

---

## 1. Default Classic rule set (set by `PassNPlayClassicSetupScreen`)

| Rule flag | Classic value | Meaning |
|---|---|---|
| `openOnSixOnly` | `true` | A token leaves the yard only on a `6` (never on `1`) |
| `mustCaptureToEnterHome` | `false` | No capture needed before entering the home column (Quick Mode only) |
| `threeSixesForfeit` | see §3 | Third six is *prevented*, not punished |
| `bonusOnCapture` | `true` | Capture ⇒ extra roll |
| `bonusOnHomeReach` | `true` | Token reaches home ⇒ extra roll |
| `safeZoneMode` | `standard` | 8 safe squares (4 starts + 4 stars) |
| `pawnSpeedMs` | `210` | Hop time per cell |
| `autoMoveSingleLegal` | `true` | Only one legal token ⇒ moves automatically |
| `oneTokenOut` | setup toggle | Token 0 starts on the board at step 0 |
| Hazards | Freeze Stars + Jump Icons ON | 4 of each, see §6 |

---

## 2. Token progress scale (live game)

| `step` | Meaning |
|---|---|
| `-1` | In the yard (home base) |
| `0` | Own start square (global index = colour offset, safe) |
| `1 … 50` | Shared outer track |
| `51` | Last outer-track cell (decision point: enters the corridor in Classic) |
| `51 … 55` | Private coloured home corridor (`inHomeCorridor = true`) |
| `56` | Home centre — token finished |

- Leaving the yard moves the token to **step 0 (start square)**, never past it.
- **Exact roll required** to finish: `step + roll` must not exceed `56`. A token whose roll would overshoot cannot move.
- Start squares: Red `0`, Green `13`, Yellow `26`, Blue `39` (global track indices, 52-cell ring).

---

## 3. Dice rules

### 3.1 Roll generation (per roll)
| Situation | Roll rule |
|---|---|
| Player already rolled **two sixes in a row** this turn | Forced uniform `1…5` (**a third six is impossible**) |
| Player rolled exactly **one** six just before | Fair d6 (no boost) |
| Otherwise (fresh roll) | Weighted d6 — probability of `6` is boosted (see below) |

**Dynamic six-boost (fresh rolls only)** — probability of a `6` = `1/6 + boost`:
| Condition | Boost | P(6) |
|---|---|---|
| Default | +0.05 | ≈ 21.7 % |
| 2 rolls without a six | +0.12 | ≈ 28.7 % |
| ≥ 3 rolls without a six **or** every 3rd roll of the match | +0.18 | ≈ 34.7 % |

The counters (`rollsWithoutSix`, `matchRollsCount`) are **match-wide** (shared by all players), reset on rematch.
Non-six faces share the remaining probability uniformly.

### 3.2 Three-consecutive-sixes guard (and the bug that was fixed)
- Max **2** consecutive sixes per turn; the 3rd roll is always `1…5`.
- `Player.consecutiveSixes` counts sixes in the current turn. It is reset to `0` when the turn passes, on a non-six roll, or when no legal move exists.
- **Bug fixed (2026-11-09):** when only one token could move, the auto-move ran inside a `setTimeout` closure holding the *pre-roll* `players` snapshot; `animateAndApplyMove` then wrote that snapshot back and **reverted the six counter**, so the guard sometimes failed and `6-6-6` could appear. The fresh count is now passed explicitly (`animateAndApplyMove(id, roll, currentSixes)`) and re-applied before `setPlayers`. Regression test: `tests/three_sixes_rule.test.ts`.

### 3.3 Timing
- Dice result is committed ~**260 ms** after the tap (3D cube tumble ≈ 285 ms, 24 ms face cycling), then legal moves are computed.
- Auto-move delay (single legal token): **180 ms**. Bot rolls ~**750 ms** after its turn starts; bot picks a token ~**650 ms** after the roll.

---

## 4. Turn flow

1. `WAITING_ROLL` → player/bot rolls.
2. `ROLLING` → dice settles.
3. Legal tokens computed (`getLegalPawns`):
   - **0 legal moves:** turn passes immediately (after ~450 ms), **even on a rolled 6 — no bonus roll**; `consecutiveSixes` resets; the player's frozen tokens thaw by one turn.
   - **1 legal move + `autoMoveSingleLegal`:** auto-moves.
   - **2+ legal moves:** `SELECTING_PAWN` — legal tokens glow; the player taps one.
4. `ANIMATING_MOVE` → hop cell-by-cell (210 ms/cell, step sound each hop), then effects resolve.
5. Next: bonus roll (`WAITING_ROLL` same player) **or** pass turn to the next unfinished player clockwise.

### Bonus-roll priority (a move grants at most ONE extra roll)
1. Capture (enemy token sent home — including captures made after a Jump) ⇒ bonus
2. Reaching home (centre, including via Jump) ⇒ bonus
3. Rolling a `6` ⇒ bonus

A player who has **just finished** (all 4 tokens home, rank assigned) **never earns a bonus roll**; the turn passes.
Finished players are **skipped** in the turn order (Classic/Quick); they never roll again.

---

## 5. Captures & safe squares

- Landing on a **non-safe** track cell occupied by an opponent token **captures** it (token returns to the yard, with a retrace "rewind" animation).
- **Safe squares** (`standard`): global indices `0, 8, 13, 21, 26, 34, 39, 47`. Any number of tokens of any colour may share them; no capture.
- Only **one** token is captured per move (the first match found).
- There are **no blockades / stacks**: two tokens of the same colour on one cell do not protect each other.
- Tokens inside a home corridor or at home can never be captured. Finished players' tokens are ignored.
- A Freeze Star cell protects like a safe cell **unless** the occupant is already frozen (see §6).
- Capture animation: ~120 ms impact pause, then the victim retraces its path (28–48 ms per cell) to its yard, then a 210 ms settle.

---

## 6. Board hazards (Classic has both enabled)

Hazards only spawn on **ordinary track cells** (never on start squares or the 4 safe stars ⇒ 36 eligible cells) and never overlap each other.

### 6.1 Freeze Stars ❄️ (4)
- Landing on a Freeze Star **freezes that token for 1 turn** (`isFrozen`, `frozenTurnsLeft = 1`): it cannot move.
- The star is **consumed** immediately and **respawns after a random 2–3 minutes** on a new cell.
- A frozen token **loses all protection**: an opponent landing on it captures it, even if it sits on a safe star.
- Thawing: when the frozen player's turn passes, `frozenTurnsLeft` decreases; the token that *just* froze stays frozen through the following round. A captured token is reset (unfrozen) in the yard.
- If every token of the active player is frozen/immobile, the roll has no legal move and the turn passes.

### 6.2 Jump Icons ⚡ (4)
- Landing on a Jump Icon applies a random hop of **1–5 cells**, animated after a 160 ms pause.
- The **first two** icons are *dual-direction*: 50 % chance of a **backward** jump (`-1…-5`); the other two are always forward.
- In normal (non-circling) movement the result is clamped to `0…56` (a forward jump can carry a token **into the home column or straight to home**, which then counts as home ⇒ bonus roll). A backward jump clamps at step `0`.
- **Jump Icon next to the home column (2026-11-09):** if a *forward* jump is big enough to cross the home-column entrance (`landing step + jump >= 51`), the token is carried **into its home column** (steps `51…55`, or straight to home `56` = home bonus) instead of wrapping around the track for another lap. This matters in Quick Mode while the column is still locked (before the first capture): previously `(step + jump) % 52` sent such a token back to the start. A jump too small to reach the entrance behaves as before. Classic and unlocked Quick already entered the column and are unchanged.
- Once a token is inside its home column the Quick Mode lock no longer applies to it (it needs the exact roll to finish, like any column token).
- After jumping, the destination is evaluated again: it can **capture** an enemy (unless the cell is a standard safe square) and can trigger a Freeze Star.
- The icon is **consumed** and respawns after a random 2–3 minutes.

### 6.3 Relocation
Independently of use, all active Freeze Stars and Jump Icons **relocate to new random cells every random 2–3 minutes** (checked once per second). Notification toasts announce relocations/respawns. Hazard positions and respawn timestamps are saved with the match.

---

## 7. Home column & finishing

- Classic tokens enter the coloured corridor directly (no capture needed). Quick Mode instead locks home until the player's first capture and circles the outer track meanwhile (a token at step 51 then wraps `(step + roll) % 52`).
- **Last-token overshoot:** if the only remaining token is in the corridor and the roll exceeds the steps needed, there is no legal move and the turn passes with no bonus.
- A player finishes when all **4** tokens are home (Quick Mode: **1**). Rank = order of finishing (👑 crown + rank on the yard).
- The match ends when **≤ 1** active player is still unfinished; that player receives the last rank. In a 2-player game the winner ends the match.

---

## 8. Bots (AI-controlled seats)

Bots roll and pick tokens automatically. Token score (highest wins):
`+100` captures a token · `+80` reaches home · `+50` leaves the yard · `+30` lands on a safe square · `+ destination step` (tie-break: advance the furthest token).
Bots do not look at danger, blocks, or hazards beyond what the outcome calculation reports.

---

## 9. Persistence & session behaviour

- **Every app launch starts a fresh game (2026-11-09).** On startup `resetSessionOnLaunch()` (`App.tsx`) deletes the stored active match (`ludo_active_match_state`), the remembered screen (`ludo_active_screen`) and any stale URL hash. Closing and reopening the phone app (or reloading the page) therefore lands on the Home screen with no match in progress. Merely backgrounding and resuming the app does not reload the page, so a running match continues.
- The running match is still mirrored to `localStorage` while playing (unused on the next launch).
- Kept across launches: manually saved games, the "splash seen" flag (splash only on the very first launch) and preferences such as the token skin. Manual save/load uses the Saved Games modal (`ludo_saved_games`).
- Rematch resets ranks, tokens (respecting One Token Out), dice counters, hazards and confetti.

---

## 10. Visual constants tied to rules

| Item | Value |
|---|---|
| Token hop | 210 ms per cell |
| Token size on track | `27×31 px` (≥ `sm`: `31×36 px`) — all 5 skins (pin, disc, hammer, top, ninja); the same sizes are used by **Classic, Team Up and Quick** (one shared `LudoBoard`) |
| Token size in yard | `26×30 px` (≥ `sm`: `29×34 px`) |
| Yard socket | circles shrunk so enlarged tokens sit on a brown ring pedestal |
| Frozen token | blue glow + `🧊 FROZEN` badge |
| Pin token ring (skin 1) | Pedestal ring is 8 brown segments with small gaps; it **rotates (one turn / 2.4 s, clockwise)** only on the board/yard tokens that can legally move with the current roll (selectable tokens) and on the active player's HUD pin. Every other token's ring stands still (blocked tokens, other players, the hopping clone, game over, reduced-motion). All rings share one global phase so they turn in sync (`PIN_RING_SPIN_MS`, `spinRing` prop in `TokenPreviewSVG.tsx`, `.pin-ring-spin` in `index.css`) |
| Player colour palette (`NINE_TOKEN_COLORS`, `TokenPreviewSVG.tsx`) | Gold `#ffd700`, Silver `#c0c0c0`, Red `#ff0000`, Blue `#3a72db`, Pink `#ff69b4`, Yellow `#ffff00`, Green `#78f62f`, Purple `#af27d7`, Cyan `#00ffff` (Black was replaced by Cyan) |
| Board default seat colours (`index.css` `:root`) | unchanged: `--seat-green` is still `#008000` (used only when a player has no custom colour; contrast tests rely on it) |

---

## 11. Known limitations / things to keep in mind

- All dice, hazard placement, jump size and bot choices use `Math.random` / an unseeded PRNG ⇒ games are **not replayable**.
- Because of the six-boost, dice are intentionally *not* fair; the README's "fair d6" description refers to `src/engine/`, which is unused.
- `Player.consecutiveSixes` lives in React state; any new code that calls `setPlayers(<snapshot built from stale closure>)` can silently revert it — pass fresh values or use functional updates.
