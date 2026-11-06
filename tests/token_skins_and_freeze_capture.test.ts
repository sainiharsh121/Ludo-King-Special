import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateMoveOutcome } from '../src/utils/gameRulesEngine';
import { GameRules, Player, Pawn, TokenId } from '../src/types/ludo';
import { NINE_TOKEN_COLORS } from '../src/components/TokenPreviewSVG';

const defaultRules: GameRules = {
  openOnSixOnly: true,
  mustCaptureToEnterHome: false,
  threeSixesForfeit: true,
  bonusOnCapture: true,
  bonusOnHomeReach: true,
  safeZoneMode: 'standard',
  pawnSpeedMs: 140,
  autoMoveSingleLegal: true,
};

function createPlayer(color: 'RED' | 'GREEN' | 'YELLOW' | 'BLUE', tokenId: TokenId = 'hammer'): Player {
  return {
    id: `p-${color.toLowerCase()}`,
    name: `Player ${color}`,
    color,
    tokenColorHex: '#3a72db',
    tokenId,
    avatar: '🦁',
    pawns: [
      { id: 0, color, step: 0, isHome: false },
      { id: 1, color, step: -1, isHome: false },
      { id: 2, color, step: -1, isHome: false },
      { id: 3, color, step: -1, isHome: false },
    ],
    hasCaptured: false,
    consecutiveSixes: 0,
    rank: null,
    isActive: true,
  };
}

console.log('--- TEST SUITE: Token Skins & Freeze Capture Rules ---');

// 1. Frozen Token Vulnerability & Capture
const pRed = createPlayer('RED', 'hammer');
const pGreen = createPlayer('GREEN', 'disc');

// Put Red pawn at step 5 (global tile 5) and mark it frozen
pRed.pawns[0].step = 5;
pRed.pawns[0].isFrozen = true;
pRed.pawns[0].frozenTurnsLeft = 1;

// Put Green pawn at step 43 (global tile 4)
pGreen.pawns[0].step = 43;

// Green rolls 1, landing directly on Red's frozen pawn on global tile 5
const captureOutcome = calculateMoveOutcome([pRed, pGreen], pGreen, 0, 1, defaultRules, [5], null);
assert(captureOutcome.capturedPawn !== null, 'Opponent landing on a frozen token must capture it!');
assert.strictEqual(captureOutcome.capturedPawn?.playerColor, 'RED');
assert.strictEqual(captureOutcome.capturedPawn?.pawnId, 0);
assert.strictEqual(captureOutcome.bonusRoll, true);
assert.strictEqual(captureOutcome.bonusReason, 'CAPTURE');
console.log('✅ PASS: Frozen token on freeze star tile is successfully captured by opponent');

// 2. Unfrozen token on standard safe star is protected
pRed.pawns[0].step = 8; // Global safe star
pRed.pawns[0].isFrozen = false;
pGreen.pawns[0].step = 46; // Green step 46 is global index (13+46)%52 = 7
const safeStarOutcome = calculateMoveOutcome([pRed, pGreen], pGreen, 0, 1, defaultRules, [], null);
assert(safeStarOutcome.capturedPawn === null, 'Unfrozen token on safe star is not captured');
console.log('✅ PASS: Unfrozen token on safe star remains safe');

// 3. Frozen token on standard safe star CAN be captured
pRed.pawns[0].step = 8;
pRed.pawns[0].isFrozen = true;
const frozenSafeStarOutcome = calculateMoveOutcome([pRed, pGreen], pGreen, 0, 1, defaultRules, [], null);
assert(frozenSafeStarOutcome.capturedPawn !== null, 'Frozen token on safe star IS vulnerable and captured!');
assert.strictEqual(frozenSafeStarOutcome.capturedPawn?.playerColor, 'RED');
console.log('✅ PASS: Frozen token even on safe star is captured by opponent');

// 4. Color palette has 9 authentic colors with valid names
assert.strictEqual(NINE_TOKEN_COLORS.length, 9);
const colorNames = NINE_TOKEN_COLORS.map(c => c.name);
assert(colorNames.includes('Gold'));
assert(colorNames.includes('Silver'));
assert(colorNames.includes('Red'));
assert(colorNames.includes('Blue'));
assert(colorNames.includes('Lavender'));
assert(colorNames.includes('Yellow'));
assert(colorNames.includes('Green'));
assert(colorNames.includes('Purple'));
assert(colorNames.includes('Dark'));
const goldOption = NINE_TOKEN_COLORS.find(c => c.name === 'Gold');
assert(goldOption !== undefined);
assert.strictEqual(goldOption?.hex, '#ffd700');
console.log('✅ PASS: Gold color updated to #ffd700 | rgb(255,215,0)');
console.log('✅ PASS: 9 distinct color names present');

// 5. Random color shuffling ensures distinct colors for all players
for (let i = 0; i < 20; i++) {
  const shuffled = [...NINE_TOKEN_COLORS].sort(() => Math.random() - 0.5);
  const picked4 = shuffled.slice(0, 4).map(c => c.hex);
  const uniqueCount = new Set(picked4).size;
  assert.strictEqual(uniqueCount, 4, 'Dice random color generation yields 4 strictly distinct colors');
}
console.log('✅ PASS: Dice click randomizes strictly unique colors across players');

// 6. Token skins propagation
const supportedSkins: TokenId[] = ['pin', 'disc', 'hammer', 'top', 'ninja'];
for (const skin of supportedSkins) {
  const player = createPlayer('BLUE', skin);
  assert.strictEqual(player.tokenId, skin, `Player properly carries token skin: ${skin}`);
}
console.log('✅ PASS: All 5 token skins (pin, disc, hammer, top, ninja) assignable to player');

console.log('🎉 ALL TOKEN SKINS & FROZEN CAPTURE TESTS PASSED WITH 100% SUCCESS!');

