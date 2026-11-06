import assert from 'assert';
import { getCanonicalFamily } from '../src/components/TokenPreviewSVG';

console.log('--- TEST SUITE: 2-Player Empty Quadrant Color Resolution ---');

// 1. Verify getCanonicalFamily detects correctly
assert.strictEqual(getCanonicalFamily('#45901A'), 'GREEN');
assert.strictEqual(getCanonicalFamily('var(--seat-green)'), 'GREEN');
assert.strictEqual(getCanonicalFamily('#3a72db'), 'BLUE');
assert.strictEqual(getCanonicalFamily('var(--seat-blue)'), 'BLUE');
assert.strictEqual(getCanonicalFamily('#b21919'), 'RED');
assert.strictEqual(getCanonicalFamily('var(--seat-red)'), 'RED');
assert.strictEqual(getCanonicalFamily('#ecae02'), 'YELLOW');
assert.strictEqual(getCanonicalFamily('var(--accent-yellow)'), 'YELLOW');
assert.strictEqual(getCanonicalFamily('#777777ff'), null); // Silver is custom
console.log('✅ PASS: getCanonicalFamily correctly maps tokens to canonical color families');

// 2. Simulate 2-player game where Player 1 chose Green and Player 2 chose Blue
const ALL_CANONICAL = ['RED', 'GREEN', 'YELLOW', 'BLUE'] as const;
type PlayerColor = typeof ALL_CANONICAL[number];

function resolveQuadrantColors(activePlayers: { color: PlayerColor; tokenColorHex: string }[]) {
  const usedColorsOnBoard = new Set<PlayerColor>();
  activePlayers.forEach(p => {
    const fam = getCanonicalFamily(p.tokenColorHex);
    if (fam) usedColorsOnBoard.add(fam);
  });

  const availableColors = ALL_CANONICAL.filter(c => !usedColorsOnBoard.has(c));
  const emptySeats = ALL_CANONICAL.filter(c => !activePlayers.some(p => p.color === c));
  const emptySeatAssignments = new Map<PlayerColor, PlayerColor>();

  // Pass 1: Empty seats that can keep their native default color without clashing
  emptySeats.forEach(seat => {
    const availIdx = availableColors.indexOf(seat);
    if (availIdx !== -1) {
      emptySeatAssignments.set(seat, seat);
      availableColors.splice(availIdx, 1);
    }
  });

  // Pass 2: Remaining empty seats take next available distinct color
  emptySeats.forEach(seat => {
    if (!emptySeatAssignments.has(seat) && availableColors.length > 0) {
      const fallback = availableColors.shift()!;
      emptySeatAssignments.set(seat, fallback);
    }
  });

  return {
    RED: activePlayers.find(p => p.color === 'RED')?.tokenColorHex || emptySeatAssignments.get('RED'),
    GREEN: activePlayers.find(p => p.color === 'GREEN')?.tokenColorHex || emptySeatAssignments.get('GREEN'),
    YELLOW: activePlayers.find(p => p.color === 'YELLOW')?.tokenColorHex || emptySeatAssignments.get('YELLOW'),
    BLUE: activePlayers.find(p => p.color === 'BLUE')?.tokenColorHex || emptySeatAssignments.get('BLUE'),
  };
}

// Case A: User's snapshot (P1 = Green, P2 = Blue)
const caseA = resolveQuadrantColors([
  { color: 'RED', tokenColorHex: '#45901A' },    // Player 1 in RED seat chose Green
  { color: 'YELLOW', tokenColorHex: '#3a72db' }, // Player 2 in YELLOW seat chose Blue
]);

assert.strictEqual(caseA.RED, '#45901A', 'Top-Left yard is Green (Player 1)');
assert.strictEqual(caseA.GREEN, 'RED', 'Top-Right empty yard is RED (swapped away from clashing Green)');
assert.strictEqual(caseA.YELLOW, '#3a72db', 'Bottom-Right yard is Blue (Player 2)');
assert.strictEqual(caseA.BLUE, 'YELLOW', 'Bottom-Left empty yard is YELLOW (swapped away from clashing Blue)');
console.log('✅ PASS: Case A (P1=Green, P2=Blue): Top-Right empty yard avoids Green duplicate, Bottom-Left avoids Blue duplicate');

// Case B: Standard 2P (P1 = Red, P2 = Yellow)
const caseB = resolveQuadrantColors([
  { color: 'RED', tokenColorHex: '#b21919' },    // Player 1 in RED seat chose Red
  { color: 'YELLOW', tokenColorHex: '#ecae02' }, // Player 2 in YELLOW seat chose Yellow
]);
assert.strictEqual(caseB.GREEN, 'GREEN', 'Top-Right empty yard retains standard Green');
assert.strictEqual(caseB.BLUE, 'BLUE', 'Bottom-Left empty yard retains standard Blue');
console.log('✅ PASS: Case B (P1=Red, P2=Yellow): Default Green & Blue retained for empty yards');

// Case C: P1 = Red, P2 = Green
const caseC = resolveQuadrantColors([
  { color: 'RED', tokenColorHex: '#b21919' },    // Player 1 in RED seat chose Red
  { color: 'YELLOW', tokenColorHex: '#45901A' }, // Player 2 in YELLOW seat chose Green
]);
assert.notStrictEqual(caseC.GREEN, 'GREEN', 'Top-Right empty yard does NOT duplicate Player 2 Green');
assert.strictEqual(caseC.BLUE, 'BLUE', 'Bottom-Left empty yard retains Blue');
console.log('✅ PASS: Case C (P1=Red, P2=Green): Top-Right empty yard avoids duplicate Green');

console.log('\n🎉 ALL 2-PLAYER COLOR RESOLUTION TESTS PASSED!');

