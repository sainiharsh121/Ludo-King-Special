import { calculateMoveOutcome, canPawnMove } from '../src/utils/gameRulesEngine';
import { getStepPath, getPawnCoordinate, stepToGlobalIndex } from '../src/utils/boardCoordinates';
import { Player, GameRules } from '../src/types/ludo';

/**
 * Rule: a Jump Icon placed right before a home column carries a circling token INTO the column when the
 * jump is big enough to cross the entrance, instead of sending it around the track for another lap.
 * (Previously, in Quick Mode before the first capture, `(toStep + jump) % 52` wrapped the token back to the start.)
 */

let passed = 0;
function check(name: string, cond: boolean, extra = '') {
  if (!cond) {
    console.error(`❌ FAIL: ${name} ${extra}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${name}`);
  passed++;
}

const mkPlayer = (color: any, steps: number[], corridor: boolean[], hasCaptured: boolean): Player => ({
  id: color,
  name: color,
  color,
  avatar: '',
  hasCaptured,
  consecutiveSixes: 0,
  rank: null,
  isActive: true,
  pawns: steps.map((s, i) => ({ id: i, color, step: s, isHome: s === 56, inHomeCorridor: corridor[i] })),
});

const quick = { openOnSixOnly: true, mustCaptureToEnterHome: true, safeZoneMode: 'standard', bonusOnCapture: true, bonusOnHomeReach: true } as unknown as GameRules;
const classic = { ...quick, mustCaptureToEnterHome: false } as unknown as GameRules;

function jumpOutcome(rules: GameRules, hasCaptured: boolean, step: number, corridor: boolean, roll: number, jumpIdx: number[], k: number) {
  const red = mkPlayer('RED', [step, -1, -1, -1], [corridor, false, false, false], hasCaptured);
  const green = mkPlayer('GREEN', [-1, -1, -1, -1], [false, false, false, false], false);
  const orig = Math.random;
  let n = 0;
  // 1st call chooses jump size k (1..5); 2nd call decides direction (>= .5 => forward for dual icons)
  Math.random = () => (n++ === 0 ? (k - 1) / 5 + 0.01 : 0.99);
  try {
    return calculateMoveOutcome([red, green], red, 0, roll, rules, [], jumpIdx);
  } finally {
    Math.random = orig;
  }
}

console.log('--- TEST SUITE: Jump Icon before the home column ---');

// Quick Mode, home still locked (no capture yet): the bug case
let o = jumpOutcome(quick, false, 47, false, 3, [50], 2);
check('locked Quick: lands on icon at step 50, jump +2 -> enters column at step 52', o.toStep === 50 && o.jumpToStep === 52 && o.jumpEnteredCorridor === true, JSON.stringify(o));

o = jumpOutcome(quick, false, 46, false, 4, [50], 5);
check('locked Quick: step 50 + jump 5 -> step 55 (inside column)', o.jumpToStep === 55 && o.jumpEnteredCorridor === true);

o = jumpOutcome(quick, false, 49, false, 2, [51], 5);
check('locked Quick: icon on track cell 51 + jump 5 -> reaches home centre (56) and counts as home', o.jumpToStep === 56 && o.bonusReason === 'HOME_REACH');

// Jump too small to cross the entrance keeps circling normally
o = jumpOutcome(quick, false, 44, false, 2, [46], 3);
check('locked Quick: jump that does not reach the entrance stays on the track (46 + 3 = 49)', o.jumpToStep === 49 && !o.jumpEnteredCorridor);

o = jumpOutcome(quick, false, 40, false, 1, [41], 1);
check('locked Quick: ordinary mid-track jump is unchanged', o.jumpToStep === 42 && !o.jumpEnteredCorridor);

// Classic / unlocked Quick behaviour is unchanged
o = jumpOutcome(classic, false, 47, false, 3, [50], 2);
check('Classic: icon at step 50 + jump 2 -> step 52 (unchanged)', o.jumpToStep === 52);
o = jumpOutcome(quick, true, 47, false, 3, [50], 2);
check('unlocked Quick: icon at step 50 + jump 2 -> step 52 (unchanged)', o.jumpToStep === 52);

// A locked player's token that is already INSIDE the column must obey normal home rules (not circle the track)
const lockedInColumn = mkPlayer('RED', [52, -1, -1, -1], [true, false, false, false], false);
check('token inside column, roll 4 (52 -> 56) is legal', canPawnMove(lockedInColumn, lockedInColumn.pawns[0], 4, quick));
check('token inside column cannot overshoot (52 + 5 = 57)', !canPawnMove(lockedInColumn, lockedInColumn.pawns[0], 5, quick));
const green = mkPlayer('GREEN', [-1, -1, -1, -1], [false, false, false, false], false);
const move = calculateMoveOutcome([lockedInColumn, green], lockedInColumn, 0, 4, quick, [], []);
check('token inside column finishes with exact roll (52 + 4 = 56 home)', move.toStep === 56 && move.reachedHome === true);

// --- Backward jump animation near the home column -------------------------------------------------
// Regression: a backward Jump Icon hop from a cell near the home column (step >= 46) used to be animated as a
// forward lap around the whole board (the "perimeter wrap" heuristic in getStepPath), ending only a few cells behind.
console.log('--- TEST SUITE: backward jump path never laps the board ---');

const startCoord = (step: number) => getPawnCoordinate('RED', step, 0, false);

let p = getStepPath('RED', 50, 48, 0, false, false, true);
check('backward hop 50 -> 48 is exactly 2 cells', p.length === 2, `len=${p.length}`);
check('backward hop 50 -> 48 ends on step 48', p[p.length - 1].row === startCoord(48).row && p[p.length - 1].col === startCoord(48).col);

p = getStepPath('RED', 46, 41, 0, false, false, true);
check('backward hop 46 -> 41 is exactly 5 cells', p.length === 5, `len=${p.length}`);

p = getStepPath('RED', 1, 50, 0, false, true, true);
check('circling token going back across the 0/51 seam: 1 -> 50 is 3 cells', p.length === 3, `len=${p.length}`);

p = getStepPath('RED', 1, 0, 0, false, false, true);
check('unlocked token clamped at start: 1 -> 0 is a single cell', p.length === 1, `len=${p.length}`);

// Exhaustive check: every forward/backward jump animation has the same length as the logical move
const allRules = [true, false];
let combos = 0;
for (const mustCap of allRules) for (const hasCap of allRules) for (const corr of allRules)
for (let from = 0; from <= 55; from++) for (let roll = 1; roll <= 6; roll++) for (const backward of [false, true]) for (let k = 1; k <= 5; k++) {
  const rules = { ...quick, mustCaptureToEnterHome: mustCap } as unknown as GameRules;
  const red = mkPlayer('RED', [from, -1, -1, -1], [corr, false, false, false], hasCap);
  const grn = mkPlayer('GREEN', [-1, -1, -1, -1], [false, false, false, false], false);
  if (!canPawnMove(red, red.pawns[0], roll, rules)) continue;
  const plain = calculateMoveOutcome([red, grn], red, 0, roll, rules, [], []);
  if (plain.toStep > 51 || plain.reachedHome) continue;
  const cell = stepToGlobalIndex('RED', plain.toStep);
  if (cell === null) continue;
  const orig = Math.random;
  let n = 0;
  Math.random = () => (n++ === 0 ? (k - 1) / 5 + 0.01 : (backward ? 0.01 : 0.99));
  // icon index 0 or 1 carries the backward power, so put the landing cell first
  const o = calculateMoveOutcome([red, grn], red, 0, roll, rules, [], [cell, 100, 101, 102]);
  Math.random = orig;
  if (o.jumpToStep === undefined || o.jumpSteps === undefined) continue;

  const locked = Boolean(mustCap && !hasCap && corr !== true);
  const pastEntrance = Boolean(corr === false && from === 51);
  const circling = locked || pastEntrance;
  const enteredCorridor = Boolean(o.jumpEnteredCorridor);
  const entering = Boolean((enteredCorridor || (!locked && !pastEntrance)) && o.jumpToStep >= 51 && o.jumpToStep <= 56);
  const wrapping = Boolean(!enteredCorridor && circling && o.jumpToStep < o.toStep && o.jumpSteps > 0);
  const isBack = o.jumpSteps < 0;
  const path = getStepPath('RED', o.toStep, o.jumpToStep, 0, entering, isBack ? circling : wrapping, isBack);
  const expected = isBack
    ? (circling ? (o.toStep - o.jumpToStep + 52) % 52 : o.toStep - o.jumpToStep)
    : (circling && !enteredCorridor ? (o.jumpToStep - o.toStep + 52) % 52 : o.jumpToStep - o.toStep);
  if (path.length !== expected) {
    check(`jump animation length matches the move (from=${from} roll=${roll} jump=${o.jumpSteps})`, false, `len=${path.length} expected=${expected}`);
  }
  // A forward jump that crosses the column entrance always ends inside the column / home
  if (!isBack && o.toStep + k >= 51) {
    if (!(o.jumpToStep >= 51)) check(`forward jump crossing the entrance enters the column (from=${from} roll=${roll} k=${k})`, false, JSON.stringify(o));
  }
  combos++;
}
check(`all ${combos} jump animations match the logical move and forward jumps enter the column`, combos > 10000);

console.log(`🎉 ALL JUMP-INTO-HOME-COLUMN TESTS PASSED (${passed})`);
