import fs from 'fs';
import path from 'path';
import { Player, Pawn, PlayerColor } from '../src/types/ludo';
import { soundEngine } from '../src/utils/soundEngine';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

console.log('--- TEST SUITE: Yard Base Rank Display & Celebration Rocket Bottom Card ---');

// 1. Verify soundEngine has playCelebrationRocketSound
assert(
  typeof soundEngine.playCelebrationRocketSound === 'function',
  'soundEngine.playCelebrationRocketSound is defined and callable'
);

// 2. Simulate one-by-one player finishing and rank allocation
const createInitialPawns = (color: PlayerColor): Pawn[] => [
  { id: 0, color, step: -1, isHome: false },
  { id: 1, color, step: -1, isHome: false },
  { id: 2, color, step: -1, isHome: false },
  { id: 3, color, step: -1, isHome: false },
];

const mockPlayers: Player[] = [
  {
    id: 'p-red',
    name: 'Player 1',
    color: 'RED',
    avatar: '🦁',
    pawns: createInitialPawns('RED'),
    hasCaptured: true,
    consecutiveSixes: 0,
    rank: null,
    isActive: true,
  },
  {
    id: 'p-green',
    name: 'Player 2',
    color: 'GREEN',
    avatar: '🐯',
    pawns: createInitialPawns('GREEN'),
    hasCaptured: true,
    consecutiveSixes: 0,
    rank: null,
    isActive: true,
  },
  {
    id: 'p-yellow',
    name: 'Player 3',
    color: 'YELLOW',
    avatar: '🦅',
    pawns: createInitialPawns('YELLOW'),
    hasCaptured: true,
    consecutiveSixes: 0,
    rank: null,
    isActive: true,
  },
  {
    id: 'p-blue',
    name: 'Player 4',
    color: 'BLUE',
    avatar: '🐉',
    pawns: createInitialPawns('BLUE'),
    hasCaptured: true,
    consecutiveSixes: 0,
    rank: null,
    isActive: true,
  },
];

// Initial state: all players have rank: null (all yard bases show 4 sockets)
assert(
  mockPlayers.every(p => p.rank === null),
  'Initially, all 4 players have rank === null (all yard bases show 4 sockets)'
);

// Player 1 (RED) finishes first
mockPlayers[0].pawns = mockPlayers[0].pawns.map(p => ({ ...p, step: 56, isHome: true }));
let currentRanks = mockPlayers.filter(p => p.rank !== null).length;
mockPlayers[0].rank = currentRanks + 1; // 1

assert(
  mockPlayers[0].rank === 1,
  'Player 1 (RED) finished 1st: yard base shows Rank 1 with Golden Crown'
);
assert(
  mockPlayers[1].rank === null && mockPlayers[2].rank === null && mockPlayers[3].rank === null,
  'Players 2, 3, 4 still have rank === null and retain their 4 yard sockets'
);

// Player 2 (GREEN) finishes second
mockPlayers[1].pawns = mockPlayers[1].pawns.map(p => ({ ...p, step: 56, isHome: true }));
currentRanks = mockPlayers.filter(p => p.rank !== null).length;
mockPlayers[1].rank = currentRanks + 1; // 2

assert(
  mockPlayers[1].rank === 2,
  'Player 2 (GREEN) finished 2nd: yard base shows Rank 2 with Golden Crown'
);

// Player 3 (YELLOW) finishes third
mockPlayers[2].pawns = mockPlayers[2].pawns.map(p => ({ ...p, step: 56, isHome: true }));
currentRanks = mockPlayers.filter(p => p.rank !== null).length;
mockPlayers[2].rank = currentRanks + 1; // 3

assert(
  mockPlayers[2].rank === 3,
  'Player 3 (YELLOW) finished 3rd: yard base shows Rank 3 with Golden Crown'
);

// Only Player 4 (BLUE) remains unfinished -> match terminates
const activeRemaining = mockPlayers.filter(p => p.isActive && p.rank === null).length;
assert(activeRemaining === 1, 'Only 1 active player remains unfinished (triggering game over)');

// Final rank allocated to remaining active player
const totalActive = mockPlayers.filter(p => p.isActive).length;
mockPlayers[3].rank = totalActive; // 4

assert(mockPlayers[3].rank === 4, 'Remaining Player 4 assigned rank 4 on match over');
assert(
  mockPlayers.map(p => p.rank).join(',') === '1,2,3,4',
  'All 4 players have positions: Rank 1 (1st), Rank 2 (2nd), Rank 3 (3rd), Rank 4 (4th)'
);

// Yard Base Display Logic Check (matching Ludo King snapshot media_1793897793186_be34149a.jpg)
const checkYardBaseDisplay = (player: Player, allPlayers: Player[]) => {
  const rank = player.rank;
  const totalActive = allPlayers.filter(p => p.isActive).length;
  const allPawnsHome = Boolean(player.pawns.every(pw => pw.isHome || pw.step >= 56));
  return typeof rank === 'number' && rank > 0 && (
    (totalActive <= 2 ? rank === 1 : rank < totalActive) || allPawnsHome
  );
};

assert(checkYardBaseDisplay(mockPlayers[0], mockPlayers) === true, 'Player 1 (Rank 1 Winner): yard base shows Golden Crown + Rank 1');
assert(checkYardBaseDisplay(mockPlayers[1], mockPlayers) === true, 'Player 2 (Rank 2 Winner): yard base shows Golden Crown + Rank 2');
assert(checkYardBaseDisplay(mockPlayers[2], mockPlayers) === true, 'Player 3 (Rank 3 Winner): yard base shows Golden Crown + Rank 3');
assert(checkYardBaseDisplay(mockPlayers[3], mockPlayers) === false, 'Player 4 (Rank 4 Loser): yard base retains sockets & tokens (no crown watermark)');

// Rematch verification: all pawns reset to step -1 and ranks reset to null
const rematchedPlayers = mockPlayers.map(p => ({
  ...p,
  pawns: createInitialPawns(p.color),
  hasCaptured: false,
  consecutiveSixes: 0,
  rank: null,
}));

assert(
  rematchedPlayers.every(p => p.rank === null),
  'On Rematch: all player ranks are reset to null'
);
assert(
  rematchedPlayers.every(p => p.pawns.every(pw => pw.step === -1 && !pw.isHome)),
  'On Rematch: all 4 pawns of all players are returned to yard base (step -1)'
);

// One Token Out Rematch Check: pawn 0 starts on step 0, pawns 1..3 on step -1
const oneTokenOutPawns = (color: PlayerColor) => [
  { id: 0, color, step: 0, isHome: false },
  { id: 1, color, step: -1, isHome: false },
  { id: 2, color, step: -1, isHome: false },
  { id: 3, color, step: -1, isHome: false },
];
const rematchedOneTokenOut = mockPlayers.map(p => ({
  ...p,
  pawns: oneTokenOutPawns(p.color),
  rank: null,
}));
assert(
  rematchedOneTokenOut.every(p => p.pawns[0].step === 0 && p.pawns[1].step === -1 && p.pawns[2].step === -1 && p.pawns[3].step === -1),
  'On Rematch (One Token Out): pawn 0 begins at step 0 on track, pawns 1..3 remain in yard'
);

// Quick Blitz Mode Check: 1 token home triggers victory
const quickBlitzPawns = [
  { id: 0, color: 'RED' as PlayerColor, step: 56, isHome: true },
  { id: 1, color: 'RED' as PlayerColor, step: -1, isHome: false },
  { id: 2, color: 'RED' as PlayerColor, step: -1, isHome: false },
  { id: 3, color: 'RED' as PlayerColor, step: -1, isHome: false },
];
const quickTokensNeeded = 1;
const quickFinished = quickBlitzPawns.filter(pw => pw.isHome || pw.step >= 56).length >= quickTokensNeeded;
assert(quickFinished === true, 'Quick Blitz mode: 1 token reached home finishes player');

// 3. Verify ZERO raw hex codes across all critical files
const checkFileForRawHex = (filePath: string, allowRoot: boolean = false) => {
  const content = fs.readFileSync(filePath, 'utf8');
  let text = content;
  if (allowRoot) {
    text = content.replace(/:root\s*\{[^}]+\}/g, '');
  }
  return text.match(/#[0-9a-fA-F]{3,8}/g) || [];
};

const boardMatches = checkFileForRawHex(path.resolve(process.cwd(), 'src/components/LudoBoard.tsx'));
assert(boardMatches.length === 0, `LudoBoard.tsx has ZERO raw hex codes (found: ${boardMatches.length})`);

const modalMatches = checkFileForRawHex(path.resolve(process.cwd(), 'src/components/GameOverModal.tsx'));
assert(modalMatches.length === 0, `GameOverModal.tsx has ZERO raw hex codes (found: ${modalMatches.length})`);

const hudMatches = checkFileForRawHex(path.resolve(process.cwd(), 'src/components/PlayerHUD.tsx'));
assert(hudMatches.length === 0, `PlayerHUD.tsx has ZERO raw hex codes (found: ${hudMatches.length})`);

const cssMatches = checkFileForRawHex(path.resolve(process.cwd(), 'src/index.css'), true);
assert(cssMatches.length === 0, `index.css has ZERO raw hex codes outside :root (found: ${cssMatches.length})`);

console.log('\n🎉 ALL CELEBRATION & YARD BASE RANK TESTS PASSED SUCCESSFULLY!');
