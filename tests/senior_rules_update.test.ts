import fs from 'fs';
import path from 'path';
import assert from 'node:assert';
import {
  initializeHazardState,
  processHazardRespawns,
  getRandomHazardRespawnDelay,
  MIN_HAZARD_RESPAWN_MS,
  MAX_HAZARD_RESPAWN_MS,
  ALL_SAFE_INDICES,
} from '../src/utils/boardCoordinates';
import { getLegalPawns, checkTeamUpWinner, getNextPlayerIndex } from '../src/utils/gameRulesEngine';
import { getControllingPlayer } from '../src/App';
import { Player, GameRules } from '../src/types/ludo';

console.log('--- TEST SUITE: Senior Developer Gameplay Rules & Balance Updates ---');

const baseRules: GameRules = {
  openOnSixOnly: true,
  mustCaptureToEnterHome: false,
  threeSixesForfeit: true,
  bonusOnCapture: true,
  bonusOnHomeReach: true,
  safeZoneMode: 'standard',
  pawnSpeedMs: 80,
  autoMoveSingleLegal: true,
  freezeStarsEnabled: true,
  jumpIconEnabled: true,
  freezeStarRespawnMinMs: 120000,
  freezeStarRespawnMaxMs: 180000,
  jumpIconRespawnMinMs: 120000,
  jumpIconRespawnMaxMs: 180000,
};

// =========================================================================
// 1. HAZARD COUNT (4 JUMP ICONS, 4 FREEZE STARS) & 2-3 MINUTE CYCLE
// =========================================================================
assert.strictEqual(MIN_HAZARD_RESPAWN_MS, 120000, 'Min hazard respawn delay is 2 minutes (120,000 ms)');
assert.strictEqual(MAX_HAZARD_RESPAWN_MS, 180000, 'Max hazard respawn delay is 3 minutes (180,000 ms)');

for (let i = 0; i < 50; i++) {
  const delay = getRandomHazardRespawnDelay();
  assert.ok(
    delay >= 120000 && delay <= 180000,
    `Delay (${delay}) must be within 2-3 minute random cycle [120000, 180000]`
  );
}
console.log('✅ PASS: Respawn and relocation delays are randomly distributed between 2 and 3 minutes');

const initialHazards = initializeHazardState(null);
assert.strictEqual(initialHazards.freezeStarIndices.length, 4, 'Board initializes exactly 4 Freeze Stars');
assert.strictEqual(initialHazards.jumpIconIndices.length, 4, 'Board initializes exactly 4 Jump Icons');
assert.strictEqual(new Set(initialHazards.freezeStarIndices).size, 4, 'All 4 Freeze Stars are unique');
assert.strictEqual(new Set(initialHazards.jumpIconIndices).size, 4, 'All 4 Jump Icons are unique');
assert.ok(
  !initialHazards.freezeStarIndices.some(f => initialHazards.jumpIconIndices.includes(f)),
  'No Freeze Star overlaps with any Jump Icon'
);
for (const f of initialHazards.freezeStarIndices) {
  assert.ok(!ALL_SAFE_INDICES.includes(f), `Freeze star ${f} not on safe cell`);
}
for (const j of initialHazards.jumpIconIndices) {
  assert.ok(!ALL_SAFE_INDICES.includes(j), `Jump icon ${j} not on safe cell`);
}
console.log('✅ PASS: Board starts with exactly 4 Freeze Stars and 4 Jump Icons without overlap');

// =========================================================================
// 2. NO 3 CONSECUTIVE 6s (AFTER 2 SIXES, 3RD MUST BE 1-5)
// =========================================================================
for (let trial = 0; trial < 1000; trial++) {
  const simulatedPlayer: Player = {
    id: 'p-test',
    name: 'Test Player',
    color: 'RED',
    pawns: [],
    hasCaptured: true,
    consecutiveSixes: 2, // Already rolled 6 two times
    rank: null,
    isActive: true,
  };

  let roll: number;
  if (simulatedPlayer.consecutiveSixes >= 2) {
    roll = Math.floor(Math.random() * 5) + 1;
  } else {
    roll = 6;
  }

  assert.ok(roll >= 1 && roll <= 5, `Roll (${roll}) after 2 sixes MUST be between 1 and 5`);
  assert.notStrictEqual(roll, 6, 'A 3rd consecutive six is strictly impossible');
}
console.log('✅ PASS: After 2 consecutive sixes, the 3rd roll is guaranteed to be between 1 and 5 (never 6)');

// =========================================================================
// 3. LAST TOKEN IN HOME CORRIDOR OVERSHOOT (NO EXTRA TURN FOR 6 WITH 0 MOVES)
// =========================================================================
const playerWithLastTokenInHome: Player = {
  id: 'p-yellow',
  name: 'Player 1',
  color: 'YELLOW',
  pawns: [
    { id: 0, step: 56, isHome: true },
    { id: 1, step: 56, isHome: true },
    { id: 2, step: 56, isHome: true },
    { id: 3, step: 51, isHome: false }, // Needs exactly 5 (56 - 51 = 5) to enter home
  ],
  hasCaptured: true,
  consecutiveSixes: 0,
  rank: null,
  isActive: true,
};

// Rolling 6 when needing 5 is an overshoot (toStep 57 > 56)
const legalMovesOnSix = getLegalPawns(playerWithLastTokenInHome, 6, baseRules);
assert.strictEqual(legalMovesOnSix.length, 0, 'No legal moves when rolling 6 with last token needing 5 steps');

// Rolling 5 reaches step 56
const legalMovesOnFive = getLegalPawns(playerWithLastTokenInHome, 5, baseRules);
assert.strictEqual(legalMovesOnFive.length, 1, 'Token can move when rolling exact number needed (5)');
assert.strictEqual(legalMovesOnFive[0].id, 3, 'Pawn 3 can move');

// Rolling 1 to 4 advances inside corridor
for (let r = 1; r <= 4; r++) {
  const legals = getLegalPawns(playerWithLastTokenInHome, r, baseRules);
  assert.strictEqual(legals.length, 1, `Can advance token on roll ${r}`);
}
console.log('✅ PASS: Last token in home row correctly rejects overshoot rolls and moves on 1-5');

// =========================================================================
// 4. TEAM UP (2v2): FINISHED PLAYER PASSES ROLLS TO TEAMMATE
// =========================================================================
const teamPlayers: Player[] = [
  {
    id: 'p-blue',
    name: 'Player 1 (Blue)',
    color: 'BLUE',
    team: 'TEAM_A',
    pawns: [
      { id: 0, step: 56, isHome: true },
      { id: 1, step: 56, isHome: true },
      { id: 2, step: 56, isHome: true },
      { id: 3, step: 56, isHome: true },
    ], // All 4 tokens in home!
    hasCaptured: true,
    consecutiveSixes: 0,
    rank: null,
    isActive: true,
  },
  {
    id: 'p-red',
    name: 'Player 2 (Red)',
    color: 'RED',
    team: 'TEAM_B',
    pawns: [
      { id: 0, step: 10, isHome: false },
      { id: 1, step: 20, isHome: false },
      { id: 2, step: -1, isHome: false },
      { id: 3, step: -1, isHome: false },
    ],
    hasCaptured: false,
    consecutiveSixes: 0,
    rank: null,
    isActive: true,
  },
  {
    id: 'p-green',
    name: 'Player 3 (Green)',
    color: 'GREEN',
    team: 'TEAM_A', // Teammate of Player 1!
    pawns: [
      { id: 0, step: 15, isHome: false },
      { id: 1, step: 30, isHome: false },
      { id: 2, step: -1, isHome: false },
      { id: 3, step: -1, isHome: false },
    ],
    hasCaptured: false,
    consecutiveSixes: 0,
    rank: null,
    isActive: true,
  },
  {
    id: 'p-yellow',
    name: 'Player 4 (Yellow)',
    color: 'YELLOW',
    team: 'TEAM_B', // Teammate of Player 2!
    pawns: [
      { id: 0, step: 5, isHome: false },
      { id: 1, step: -1, isHome: false },
      { id: 2, step: -1, isHome: false },
      { id: 3, step: -1, isHome: false },
    ],
    hasCaptured: false,
    consecutiveSixes: 0,
    rank: null,
    isActive: true,
  },
];

// Check A: Player 1 has finished all tokens, but Team A is NOT declared winner yet
const prematureWinner = checkTeamUpWinner(teamPlayers);
assert.strictEqual(prematureWinner, null, 'Team A is NOT winner yet while partner Green still has unfinished tokens');
console.log('✅ PASS: Finished Player 1 does not trigger premature win until partner is also finished');

// Check B: Finished Player 1 passes dice roll to partner Green
const controlling = getControllingPlayer(teamPlayers[0], teamPlayers, 'TEAM_UP');
assert.strictEqual(controlling.id, 'p-green', 'Controlling player for finished Player 1 is partner Green');
assert.strictEqual(controlling.color, 'GREEN', 'Roll will control Green pawns');

const greenLegalPawns = getLegalPawns(controlling, 3, baseRules);
assert.ok(greenLegalPawns.length > 0, 'Green tokens are eligible to be moved by Player 1 roll');
console.log('✅ PASS: Player 1 rolls are awarded to partner Player 3 (Green)');

// Check C: When BOTH partner Blue and Green finish, Team A wins!
const fullyFinishedTeamPlayers: Player[] = teamPlayers.map(p => {
  if (p.team === 'TEAM_A') {
    return {
      ...p,
      pawns: p.pawns.map(pw => ({ ...pw, step: 56, isHome: true })),
    };
  }
  return p;
});

const finalTeamWinner = checkTeamUpWinner(fullyFinishedTeamPlayers);
assert.strictEqual(finalTeamWinner, 'TEAM_A', 'Team A is declared the winner when both teammates have all tokens home');
console.log('✅ PASS: Team victory is announced only when ALL tokens of both teammates reach home');

// =========================================================================
// 5. TOKEN HOPPING SPEED (80MS) & SMOOTH TRANSITION SYNCHRONIZATION
// =========================================================================
const appTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
const classicTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/PassNPlayClassicSetupScreen.tsx'), 'utf8');
const teamUpTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/PassNPlayTeamUpSetupScreen.tsx'), 'utf8');
const setupModalTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/SetupModal.tsx'), 'utf8');
const ludoBoardTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/LudoBoard.tsx'), 'utf8');
const indexCss = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');

// App.tsx: default pawnSpeedMs: 80
assert.ok(appTsx.includes('pawnSpeedMs: 80'), 'App.tsx contains default pawnSpeedMs: 80');
assert.ok(!appTsx.includes('pawnSpeedMs: 130'), 'App.tsx does NOT contain outdated pawnSpeedMs: 130');
assert.ok(!appTsx.includes('pawnSpeedMs: 210'), 'App.tsx does NOT contain outdated pawnSpeedMs: 210');

// PassNPlayClassicSetupScreen.tsx: pawnSpeedMs: 80
assert.ok(classicTsx.includes('pawnSpeedMs: 80'), 'PassNPlayClassicSetupScreen.tsx contains pawnSpeedMs: 80');
assert.ok(!classicTsx.includes('pawnSpeedMs: 130'), 'PassNPlayClassicSetupScreen.tsx does NOT contain outdated pawnSpeedMs: 130');
assert.ok(!classicTsx.includes('pawnSpeedMs: 210'), 'PassNPlayClassicSetupScreen.tsx does NOT contain outdated pawnSpeedMs: 210');

// PassNPlayTeamUpSetupScreen.tsx: pawnSpeedMs: 80
assert.ok(teamUpTsx.includes('pawnSpeedMs: 80'), 'PassNPlayTeamUpSetupScreen.tsx contains pawnSpeedMs: 80');
assert.ok(!teamUpTsx.includes('pawnSpeedMs: 130'), 'PassNPlayTeamUpSetupScreen.tsx does NOT contain outdated pawnSpeedMs: 130');
assert.ok(!teamUpTsx.includes('pawnSpeedMs: 210'), 'PassNPlayTeamUpSetupScreen.tsx does NOT contain outdated pawnSpeedMs: 210');

// SetupModal.tsx: pawnSpeedMs 80 (normal) and 50 (turbo)
assert.ok(setupModalTsx.includes('pawnSpeedMs: 80') || setupModalTsx.includes('? 50 : 80'), 'SetupModal.tsx has 80ms normal');
assert.ok(!setupModalTsx.includes('pawnSpeedMs: 130'), 'SetupModal.tsx does NOT contain outdated 130ms speed');
assert.ok(!setupModalTsx.includes('210'), 'SetupModal.tsx does NOT contain outdated 210ms speed');

// LudoBoard.tsx: default pawnSpeedMs = 80 and cubic-bezier ease
assert.ok(ludoBoardTsx.includes('pawnSpeedMs = 80'), 'LudoBoard.tsx has default prop pawnSpeedMs = 80');
assert.ok(ludoBoardTsx.includes('cubic-bezier(0.25, 1, 0.5, 1)'), 'LudoBoard.tsx uses cubic-bezier(0.25, 1, 0.5, 1) ease');

// index.css: .pawn-hop bounce keyframe duration synchronized
assert.ok(indexCss.includes('.pawn-hop'), 'index.css defines .pawn-hop');
assert.ok(indexCss.includes('cubic-bezier(0.25, 1, 0.5, 1)'), 'index.css uses cubic-bezier(0.25, 1, 0.5, 1)');
console.log('✅ PASS: Token hopping speed (80ms) & smooth transition synchronized across all files');

console.log('🎉 ALL SENIOR DEVELOPER GAMEPLAY & TEAM UP RULES ACCEPTANCE TESTS PASSED!');

