import { calculateMoveOutcome, canPawnMove } from '../src/utils/gameRulesEngine';
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

console.log(`🎉 ALL JUMP-INTO-HOME-COLUMN TESTS PASSED (${passed})`);
