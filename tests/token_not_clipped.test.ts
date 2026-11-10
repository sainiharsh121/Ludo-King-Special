import { readFileSync } from 'fs';

/**
 * Regression: tokens standing on an edge cell (e.g. the top row of the board) used to be cut off because the
 * pawns layer lived inside the `overflow-hidden` board grid. The layer must stay OUTSIDE that grid and above it.
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

console.log('--- TEST SUITE: board tokens are never clipped at the board edge ---');

const board = readFileSync('src/components/LudoBoard.tsx', 'utf8');

const gridOpen = board.indexOf('overflow-hidden shadow-inner grid grid-cols-15 grid-rows-15');
const gridEndMarker = board.indexOf('end of the clipped board grid');
const pawnsLayer = board.indexOf('10. PAWNS LAYER');

check('board grid keeps overflow-hidden (rounded corners / background layer)', gridOpen !== -1);
check('the clipped grid is closed before the pawns layer starts', gridEndMarker !== -1 && gridEndMarker > gridOpen && gridEndMarker < pawnsLayer);
check('pawns layer wrapper sits above the grid (z-30) and is aligned to the grid content box', /absolute inset-\[7px\] sm:inset-\[9px\] z-30 pointer-events-none/.test(board));
check('the inset equals wrapper padding + 3px border (p-1 -> 7px, sm:p-1.5 -> 9px)', /p-1 sm:p-1\.5 rounded-2xl/.test(board) && /border: '3px solid var\(--board-border\)'/.test(board));
check('the outer board wrapper itself does not clip its children', !/relative aspect-square[^"]*overflow-hidden/.test(board));

console.log(`🎉 ALL TOKEN-NOT-CLIPPED TESTS PASSED (${passed})`);
