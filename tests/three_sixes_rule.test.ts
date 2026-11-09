import fs from 'fs';
import path from 'path';

/**
 * Regression: "three consecutive sixes can never appear" (Classic / all modes).
 *
 * Root cause that was fixed: when exactly one token was movable, handleRollDice auto-moved it from a
 * setTimeout closure holding the PRE-roll `players` snapshot. animateAndApplyMove then wrote that stale
 * snapshot back with setPlayers(), reverting `consecutiveSixes` to its old value, so the 3rd-six guard
 * (`consecutiveSixes >= 2 -> roll 1..5`) was never reached.
 */

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    console.error(`❌ FAIL: ${name}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${name}`);
  passed++;
}

console.log('--- TEST SUITE: Three Consecutive Sixes Guard (stale-state regression) ---');

const app = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');

check(
  'animateAndApplyMove accepts the fresh post-roll six count',
  /animateAndApplyMove\s*=\s*async\s*\(pawnId: number, roll: number, sixesInRowAfterRoll\?: number\)/.test(app)
);
check(
  'auto-move path passes the fresh count (currentSixes) instead of relying on the stale snapshot',
  /animateAndApplyMove\(legalPawns\[0\]\.id, roll, currentSixes\)/.test(app)
);
check(
  "active player's consecutiveSixes is re-applied before setPlayers(updatedPlayers)",
  /preservedSixes\s*=\s*sixesInRowAfterRoll \?\? activePlayer\.consecutiveSixes/.test(app) &&
    /consecutiveSixes: preservedSixes/.test(app)
);
check(
  'roll generator forces 1..5 once two sixes are already rolled',
  /activePlayer\.consecutiveSixes >= 2\)\s*\{\s*\n\s*roll = Math\.floor\(Math\.random\(\) \* 5\) \+ 1/.test(app)
);

// Behavioural model of the counter across a turn: 6, 6, then the guard must prevent a 3rd six.
function nextSixes(prev: number, roll: number) {
  return roll === 6 ? prev + 1 : 0;
}
function rollWithGuard(sixesInRow: number, draw: number /* 1..6 raw */): number {
  return sixesInRow >= 2 ? ((draw - 1) % 5) + 1 : draw;
}

let sixes = 0;
let rolls: number[] = [];
for (const raw of [6, 6, 6, 6]) {
  const r = rollWithGuard(sixes, raw);
  rolls.push(r);
  sixes = nextSixes(sixes, r);
  if (sixes === 0) break;
}
check('counter model: 6,6 then forced non-six ends the chain (never 6,6,6)', rolls.length === 3 && rolls[2] !== 6 && rolls[0] === 6 && rolls[1] === 6);

console.log(`🎉 ALL THREE-SIXES GUARD TESTS PASSED (${passed})`);
