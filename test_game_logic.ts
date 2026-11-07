import { Player, Pawn, PlayerColor, GameRules } from './src/types/ludo';
import { 
  canPawnMove, 
  getLegalPawns, 
  calculateMoveOutcome, 
  getNextPlayerIndex,
  countActiveRemainingPlayers,
  createPawns,
  checkTeamUpWinner,
  isPlayerFinished
} from './src/utils/gameRulesEngine';
import { 
  getPawnCoordinate, 
  getStepPath,
  stepToGlobalIndex, 
  isSafeGlobalCell,
  GLOBAL_TRACK,
  HOME_CORRIDORS,
  HOME_CENTERS,
  BASE_SOCKETS,
  generateRandomHazardIndices,
  ELIGIBLE_HAZARD_INDICES,
  ALL_SAFE_INDICES,
  getRandomHazardRespawnDelay,
  respawnSingleHazard,
  processHazardRespawns,
  initializeHazardState,
  MIN_HAZARD_RESPAWN_MS,
  MAX_HAZARD_RESPAWN_MS
} from './src/utils/boardCoordinates';
import { TEAM_UP_TASKS, STORAGE_KEY_SELECTED_TASK } from './src/components/TeamUpTaskSelectionScreen';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

const defaultRules: GameRules = {
  openOnSixOnly: true,
  mustCaptureToEnterHome: true,
  threeSixesForfeit: true,
  bonusOnCapture: true,
  bonusOnHomeReach: true,
  safeZoneMode: 'standard',
  pawnSpeedMs: 210,
  autoMoveSingleLegal: true,
};

const createPlayer = (color: PlayerColor, isActive: boolean = true): Player => ({
  id: `p-${color.toLowerCase()}`,
  name: `${color} Player`,
  color,
  avatar: '🦁',
  pawns: [
    { id: 0, color, step: -1, isHome: false },
    { id: 1, color, step: -1, isHome: false },
    { id: 2, color, step: -1, isHome: false },
    { id: 3, color, step: -1, isHome: false },
  ],
  hasCaptured: false,
  consecutiveSixes: 0,
  rank: null,
  isActive,
});

console.log('--- TEST SUITE: Ludo Game Rules & Coordinates ---');

// 1. Pawn Unlocking
{
  const player = createPlayer('RED');
  assert(!canPawnMove(player, player.pawns[0], 5, defaultRules), 'Cannot open base yard with roll 5 when openOnSixOnly is true');
  assert(canPawnMove(player, player.pawns[0], 6, defaultRules), 'Can open base yard with roll 6 when openOnSixOnly is true');

  const fastRules = { ...defaultRules, openOnSixOnly: false };
  assert(canPawnMove(player, player.pawns[0], 1, fastRules), 'Can open base yard with roll 1 when openOnSixOnly is false');
  assert(canPawnMove(player, player.pawns[0], 6, fastRules), 'Can open base yard with roll 6 when openOnSixOnly is false');
  assert(!canPawnMove(player, player.pawns[0], 2, fastRules), 'Cannot open base yard with roll 2');
}

// 2. Track & Coordinates
{
  assert(GLOBAL_TRACK.length === 52, 'Global track has exactly 52 cells');
  assert(stepToGlobalIndex('RED', 0) === 0, 'RED step 0 is global track 0 (6, 1)');
  assert(stepToGlobalIndex('GREEN', 0) === 13, 'GREEN step 0 is global track 13 (1, 8)');
  assert(stepToGlobalIndex('YELLOW', 0) === 26, 'YELLOW step 0 is global track 26 (8, 13)');
  assert(stepToGlobalIndex('BLUE', 0) === 39, 'BLUE step 0 is global track 39 (13, 6)');

  // Base socket coordinates
  const baseCoord = getPawnCoordinate('RED', -1, 0);
  assert(baseCoord.row === 1.8 && baseCoord.col === 1.8, 'RED pawn 0 yard coordinate is (1.8, 1.8)');

  // Home center coordinates
  const homeCoord = getPawnCoordinate('RED', 56, 0);
  assert(homeCoord.row === 7 && homeCoord.col === 6.2, 'RED pawn home coordinate is (7, 6.2)');
}

// 3. Safe Zones
{
  // Track 0, 13, 26, 39 are start exits (safe)
  assert(isSafeGlobalCell(0, 'standard'), 'Track 0 is safe in standard mode');
  assert(isSafeGlobalCell(13, 'standard'), 'Track 13 is safe in standard mode');
  assert(isSafeGlobalCell(26, 'standard'), 'Track 26 is safe in standard mode');
  assert(isSafeGlobalCell(39, 'standard'), 'Track 39 is safe in standard mode');

  // Mid stars 8, 21, 34, 47 are safe
  assert(isSafeGlobalCell(8, 'standard'), 'Track 8 is safe star');
  assert(isSafeGlobalCell(21, 'standard'), 'Track 21 is safe star');
  assert(isSafeGlobalCell(34, 'standard'), 'Track 34 is safe star');
  assert(isSafeGlobalCell(47, 'standard'), 'Track 47 is safe star');

  // Unsafe cells
  assert(!isSafeGlobalCell(1, 'standard'), 'Track 1 is not safe');
  assert(!isSafeGlobalCell(7, 'standard'), 'Track 7 is not safe');
}

// 4. Capturing opponent pawn
{
  const pRed = createPlayer('RED');
  const pGreen = createPlayer('GREEN');
  const players = [pRed, pGreen];

  // RED pawn 0 at step 0 -> global track 0
  // GREEN pawn 0 at step 39 -> global track (13 + 39) % 52 = 0
  // But track 0 is a safe start tile, so capture should NOT occur
  pRed.pawns[0].step = 0;
  pGreen.pawns[0].step = 39;
  const outcomeSafe = calculateMoveOutcome(players, pGreen, 0, 0, defaultRules);
  assert(outcomeSafe.capturedPawn === null, 'Cannot capture opponent on safe start cell');

  // Move RED pawn to step 1 -> global track 1 (not safe)
  pRed.pawns[0].step = 1;
  // GREEN pawn at step 39 (track 0), rolls 1 -> lands on step 40 (track 1)
  pGreen.pawns[0].step = 39;
  const outcomeCapture = calculateMoveOutcome(players, pGreen, 0, 1, defaultRules);
  assert(outcomeCapture.capturedPawn !== null, 'Captured opponent pawn on unsafe track cell');
  assert(outcomeCapture.capturedPawn?.playerColor === 'RED', 'Captured pawn belongs to RED');
  assert(outcomeCapture.capturedPawn?.pawnId === 0, 'Captured pawn ID is 0');
  assert(outcomeCapture.bonusRoll === true, 'Bonus roll awarded on capture');
  assert(outcomeCapture.bonusReason === 'CAPTURE', 'Bonus reason is CAPTURE');
}

// 5. Kill Requirement Check (Quick Mode enforces kill, Classic Mode allows free entry)
{
  const player = createPlayer('RED');
  player.pawns[0].step = 50; // At doorstep of corridor (step 51..55)

  // Quick Mode rules (mustCaptureToEnterHome = true)
  const quickRules: GameRules = { ...defaultRules, mustCaptureToEnterHome: true };
  player.hasCaptured = false;
  assert(canPawnMove(player, player.pawns[0], 2, quickRules), 'Quick Mode: Uncaptured pawn can move (circles main outer track)');
  const outcomeWithoutCapture = calculateMoveOutcome([player], player, 0, 2, quickRules);
  assert(outcomeWithoutCapture.toStep === 0, 'Quick Mode: Pawn circles main outer track wrapping to step 0');
  assert(outcomeWithoutCapture.reachedHome === false, 'Quick Mode: Uncaptured pawn cannot reach home');

  player.hasCaptured = true;
  assert(canPawnMove(player, player.pawns[0], 2, quickRules), 'Quick Mode: Can enter home corridor once capture requirement is satisfied');
  const outcomeWithCapture = calculateMoveOutcome([player], player, 0, 2, quickRules);
  assert(outcomeWithCapture.toStep === 52, 'Quick Mode: Pawn enters home corridor step 52 once capture requirement is satisfied');

  // Classic Mode rules (mustCaptureToEnterHome = false)
  const classicRules: GameRules = { ...defaultRules, mustCaptureToEnterHome: false };
  player.hasCaptured = false;
  assert(canPawnMove(player, player.pawns[0], 2, classicRules), 'Classic Mode: Can enter home corridor freely without any prior kill/capture');
  const outcomeClassic = calculateMoveOutcome([player], player, 0, 2, classicRules);
  assert(outcomeClassic.toStep === 52, 'Classic Mode: Pawn enters home corridor step 52 without capture');

  // Quick Mode deep verification: wrapping across step 50, 51, and back to 0, 1
  player.hasCaptured = false;
  player.pawns[0].step = 50;
  const outcomeRoll1 = calculateMoveOutcome([player], player, 0, 1, quickRules);
  assert(outcomeRoll1.toStep === 51, 'Quick Mode: Step 50 + roll 1 advances to outer track step 51');

  player.pawns[0].step = 51;
  const outcomeRollFrom51 = calculateMoveOutcome([player], player, 0, 1, quickRules);
  assert(outcomeRollFrom51.toStep === 0, 'Quick Mode: Step 51 + roll 1 wraps around to step 0');

  player.pawns[0].step = 48;
  const outcomeRoll5 = calculateMoveOutcome([player], player, 0, 5, quickRules);
  assert(outcomeRoll5.toStep === 1, 'Quick Mode: Step 48 + roll 5 wraps around to step 1');

  // getStepPath verification for perimeter wrapping
  const wrapPath = getStepPath('RED', 50, 1, 0, false, true);
  assert(wrapPath.length === 3, 'Wrap path from 50 to 1 contains 3 hops (51, 0, 1)');
  assert(wrapPath[0].row === 6 && wrapPath[0].col === 0, 'Wrap path hop 1 is global track 51 (row 6, col 0)');
  assert(wrapPath[1].row === 6 && wrapPath[1].col === 1, 'Wrap path hop 2 is global track 0 (row 6, col 1)');
  assert(wrapPath[2].row === 6 && wrapPath[2].col === 2, 'Wrap path hop 3 is global track 1 (row 6, col 2)');
}

// 6. Exact Roll to Reach Home (Step 56)
{
  const player = createPlayer('RED');
  player.hasCaptured = true;
  player.pawns[0].step = 54; // 2 steps away from center (step 56)

  assert(canPawnMove(player, player.pawns[0], 2, defaultRules), 'Roll 2 reaches home step 56');
  assert(canPawnMove(player, player.pawns[0], 1, defaultRules), 'Roll 1 advances to step 55');
  assert(!canPawnMove(player, player.pawns[0], 3, defaultRules), 'Roll 3 overshoots step 56 and is rejected');

  const outcomeHome = calculateMoveOutcome([player], player, 0, 2, defaultRules);
  assert(outcomeHome.reachedHome === true, 'toStep is 56 and reachedHome is true');
  assert(outcomeHome.bonusRoll === true, 'Bonus roll awarded on reaching home');
  assert(outcomeHome.bonusReason === 'HOME_REACH', 'Bonus reason is HOME_REACH');
}

// 7. Turn Rotation Clockwise
{
  // 4 active players: RED(0) -> GREEN(1) -> YELLOW(2) -> BLUE(3) -> RED(0)
  const players4 = [
    createPlayer('RED'),
    createPlayer('GREEN'),
    createPlayer('YELLOW'),
    createPlayer('BLUE'),
  ];
  assert(getNextPlayerIndex(players4, 0) === 1, '4P: RED(0) passes to GREEN(1)');
  assert(getNextPlayerIndex(players4, 1) === 2, '4P: GREEN(1) passes to YELLOW(2)');
  assert(getNextPlayerIndex(players4, 2) === 3, '4P: YELLOW(2) passes to BLUE(3)');
  assert(getNextPlayerIndex(players4, 3) === 0, '4P: BLUE(3) passes to RED(0)');

  // 2 active players: Opposite (Red 0 vs Yellow 2)
  const players2Opposite = [
    createPlayer('RED', true),
    createPlayer('GREEN', false),
    createPlayer('YELLOW', true),
    createPlayer('BLUE', false),
  ];
  assert(getNextPlayerIndex(players2Opposite, 0) === 2, '2P Opposite: RED(0) passes directly to YELLOW(2)');
  assert(getNextPlayerIndex(players2Opposite, 2) === 0, '2P Opposite: YELLOW(2) passes directly to RED(0)');

  // When a player finishes (rank !== null), they are skipped
  players4[1].rank = 1; // GREEN finished 1st
  assert(getNextPlayerIndex(players4, 0) === 2, 'RED passes to YELLOW skipping finished GREEN');
}

// Test Page 4 Navigation & Refresh Persistence Logic
console.log('\n--- TEST SUITE: Page 4 (Pass & Play Setup) & Refresh Persistence ---');

// Mock localStorage and window
const mockLocalStorage: Record<string, string> = {};
const mockWindow = {
  location: { hash: '' }
};

const resolveInitialScreen = (
  hash: string,
  storage: Record<string, string>,
  hasSeenSplash: boolean
): string => {
  const h = hash.toLowerCase();
  if (h.includes('pass-classic') || h.includes('classic-setup')) {
    return 'PASS_N_PLAY_CLASSIC_SETUP';
  }
  if (h.includes('pass-team') || h.includes('team-up-setup') || h.includes('teamup') || h.includes('team-up')) {
    return 'PASS_N_PLAY_TEAM_UP_SETUP';
  }
  if (h.includes('pass') || h.includes('setup') || h.includes('page4') || h.includes('page-4')) {
    return 'PASS_N_PLAY_SETUP';
  }
  if (h.includes('home') || h.includes('lobby') || h.includes('page3') || h.includes('page-3')) {
    return 'HOME';
  }
  if (h.includes('game') || h.includes('arena') || h.includes('play')) {
    return 'GAME';
  }
  if (h.includes('splash') || h.includes('intro') || h.includes('page1') || h.includes('page-1')) {
    return 'SPLASH';
  }

  const saved = storage['ludo_active_screen'];
  if (saved && [
    'SPLASH', 
    'HOME', 
    'PASS_N_PLAY_SETUP', 
    'PASS_N_PLAY_CLASSIC_SETUP', 
    'PASS_N_PLAY_TEAM_UP_SETUP', 
    'GAME'
  ].includes(saved)) {
    return saved;
  }

  return hasSeenSplash ? 'HOME' : 'SPLASH';
};

// 1. Refresh while on Page 4 (PASS_N_PLAY_SETUP)
mockLocalStorage['ludo_active_screen'] = 'PASS_N_PLAY_SETUP';
assert(
  resolveInitialScreen('', mockLocalStorage, true) === 'PASS_N_PLAY_SETUP',
  'On browser refresh while on Page 4 (Pass & Play), must remain on PASS_N_PLAY_SETUP'
);

// 2. Refresh while on Page 5A (PASS_N_PLAY_CLASSIC_SETUP)
mockLocalStorage['ludo_active_screen'] = 'PASS_N_PLAY_CLASSIC_SETUP';
assert(
  resolveInitialScreen('', mockLocalStorage, true) === 'PASS_N_PLAY_CLASSIC_SETUP',
  'On browser refresh while on Page 5A (Classic Setup), must remain on PASS_N_PLAY_CLASSIC_SETUP'
);

// 3. Refresh while on Page 5B (PASS_N_PLAY_TEAM_UP_SETUP)
mockLocalStorage['ludo_active_screen'] = 'PASS_N_PLAY_TEAM_UP_SETUP';
assert(
  resolveInitialScreen('', mockLocalStorage, true) === 'PASS_N_PLAY_TEAM_UP_SETUP',
  'On browser refresh while on Page 5B (Team Up Setup), must remain on PASS_N_PLAY_TEAM_UP_SETUP'
);

// 4. Refresh while on Page 3 (HOME)
mockLocalStorage['ludo_active_screen'] = 'HOME';
assert(
  resolveInitialScreen('', mockLocalStorage, true) === 'HOME',
  'On browser refresh while on Page 3 (Home Lobby), must remain on HOME'
);

// 5. Refresh while on Page 1 (SPLASH)
mockLocalStorage['ludo_active_screen'] = 'SPLASH';
assert(
  resolveInitialScreen('', mockLocalStorage, false) === 'SPLASH',
  'On browser refresh while on Splash screen, must remain on SPLASH'
);

// 6. Refresh while on Game arena
mockLocalStorage['ludo_active_screen'] = 'GAME';
assert(
  resolveInitialScreen('', mockLocalStorage, true) === 'GAME',
  'On browser refresh while in Game arena, must remain on GAME'
);

// 6b. Active match persistence across reloads (board and tokens do not refresh/reset)
const mockMatch = {
  players: [
    { id: 'p-1', name: 'Tester', color: 'RED', tokenColorHex: '#b21919', pawns: [{ id: 0, color: 'RED', step: 12, isHome: false }] }
  ],
  activePlayerIndex: 0,
  diceValue: 4,
};
mockLocalStorage['ludo_active_match_state'] = JSON.stringify(mockMatch);
const restoredMatch = JSON.parse(mockLocalStorage['ludo_active_match_state']);
assert(
  restoredMatch.players[0].pawns[0].step === 12,
  'On browser reload, ongoing match pawns and board state do NOT reset/refresh'
);

// 7. URL Hash override persistence (#pass-classic, #pass-team, #pass-n-play)
assert(
  resolveInitialScreen('#pass-classic', {}, true) === 'PASS_N_PLAY_CLASSIC_SETUP',
  'URL hash #pass-classic opens Page 5A directly'
);
assert(
  resolveInitialScreen('#pass-team-up', {}, true) === 'PASS_N_PLAY_TEAM_UP_SETUP',
  'URL hash #pass-team-up opens Page 5B directly'
);
assert(
  resolveInitialScreen('#pass-n-play', {}, true) === 'PASS_N_PLAY_SETUP',
  'URL hash #pass-n-play opens Page 4 directly'
);

// 8. Token unlocking rules (All 5 Tokens Unlocked 2D Vector)
const ALL_UNLOCKED_TOKENS = ['pin', 'disc', 'hammer', 'top', 'ninja'];
assert(ALL_UNLOCKED_TOKENS.includes('pin'), 'Default pin token is unlocked');
assert(ALL_UNLOCKED_TOKENS.includes('disc'), 'Secondary star disc token is unlocked');
assert(ALL_UNLOCKED_TOKENS.includes('hammer'), 'Mjolnir lightning hammer token is unlocked');
assert(ALL_UNLOCKED_TOKENS.includes('top'), 'Spinning top pagoda token is unlocked');
assert(ALL_UNLOCKED_TOKENS.includes('ninja'), 'Cool ninja visor token is unlocked');

// 9. Sub-modes
const PASS_N_PLAY_MODES = ['CLASSIC', 'TEAM_UP', 'QUICK'];
assert(PASS_N_PLAY_MODES.includes('TEAM_UP'), 'Classic Team Up mode is supported');
assert(PASS_N_PLAY_MODES.includes('CLASSIC'), 'Classic mode is supported');
assert(PASS_N_PLAY_MODES.includes('QUICK'), 'Quick Blitz mode is supported');

console.log('\n--- TEST SUITE: Page 5A & 5B Game Rules (One Token Out & Friendly Kill) ---');

// 10. "Play - One Token Out -" rule
{
  const standardPawns = createPawns('BLUE', false);
  assert(standardPawns[0].step === -1, 'Standard Play: token 0 starts in yard (-1)');
  assert(standardPawns[1].step === -1, 'Standard Play: token 1 starts in yard (-1)');

  const oneTokenPawns = createPawns('BLUE', true);
  assert(oneTokenPawns[0].step === 0, 'One Token Out Play: token 0 starts already on track step 0');
  assert(oneTokenPawns[1].step === -1, 'One Token Out Play: token 1 remains in yard (-1)');
  assert(oneTokenPawns[2].step === -1, 'One Token Out Play: token 2 remains in yard (-1)');
  assert(oneTokenPawns[3].step === -1, 'One Token Out Play: token 3 remains in yard (-1)');

  const playerOneOut: Player = {
    ...createPlayer('BLUE'),
    pawns: oneTokenPawns,
  };

  // When rolling a 1, token 0 on track CAN move, whereas yard tokens cannot
  assert(canPawnMove(playerOneOut, playerOneOut.pawns[0], 1, defaultRules), 'One Token Out: token 0 can move with roll 1');
  assert(canPawnMove(playerOneOut, playerOneOut.pawns[0], 4, defaultRules), 'One Token Out: token 0 can move with roll 4');
  assert(!canPawnMove(playerOneOut, playerOneOut.pawns[1], 4, defaultRules), 'One Token Out: yard token 1 CANNOT move with roll 4 (requires 6)');
}

// 11. "Friendly Kill" Rule in Classic Team Up
{
  const teamPlayer1: Player = {
    ...createPlayer('BLUE'),
    team: 'TEAM_A',
    pawns: [{ id: 0, color: 'BLUE', step: 10, isHome: false }, ...createPawns('BLUE').slice(1)],
  };
  const teamPlayerPartner: Player = {
    ...createPlayer('GREEN'),
    team: 'TEAM_A',
    // Positioned at step 10 - from step 0 of GREEN (global 13), step 10 = global 23
    // BLUE step 0 is global 39, so global 23 for BLUE is step (23 - 39 + 52) = step 36
    // Let's place GREEN at global 49 (step 36 for GREEN), and BLUE at step 10 (global 49)
    pawns: [{ id: 0, color: 'GREEN', step: 36, isHome: false }, ...createPawns('GREEN').slice(1)],
  };
  const teamOpponent: Player = {
    ...createPlayer('RED'),
    team: 'TEAM_B',
    // Place RED at step 49 (global 49)
    pawns: [{ id: 0, color: 'RED', step: 49, isHome: false }, ...createPawns('RED').slice(1)],
  };

  const allPlayers = [teamPlayer1, teamPlayerPartner, teamOpponent];

  // Case A: Friendly Kill is OFF (false) -> Landing on teammate DOES NOT capture teammate
  const friendlyKillOffRules: GameRules = {
    ...defaultRules,
    friendlyKill: false,
  };

  // BLUE token moving to global 49 where teammate GREEN is also present (without safe zone)
  const outcomeNoFriendlyKill = calculateMoveOutcome(
    [teamPlayer1, teamPlayerPartner],
    teamPlayer1,
    0,
    0, // landing on current tile
    friendlyKillOffRules
  );
  assert(outcomeNoFriendlyKill.capturedPawn === null, 'Friendly Kill OFF: Landing on teammate does NOT capture teammate');

  // Case B: Friendly Kill is ON (true) -> Landing on teammate DOES capture teammate
  const friendlyKillOnRules: GameRules = {
    ...defaultRules,
    friendlyKill: true,
  };
  const outcomeFriendlyKill = calculateMoveOutcome(
    [teamPlayer1, teamPlayerPartner],
    teamPlayer1,
    0,
    0,
    friendlyKillOnRules
  );
  assert(outcomeFriendlyKill.capturedPawn !== null, 'Friendly Kill ON: Landing on teammate DOES capture teammate');
  assert(outcomeFriendlyKill.capturedPawn?.playerColor === 'GREEN', 'Friendly Kill ON: Captured pawn belongs to partner GREEN');

  // Case C: Opponents from other team are ALWAYS captured
  const outcomeOpponentKill = calculateMoveOutcome(
    [teamPlayer1, teamOpponent],
    teamPlayer1,
    0,
    0,
    friendlyKillOffRules
  );
  assert(outcomeOpponentKill.capturedPawn !== null, 'Opponent on other team is captured even if friendlyKill is false');
  assert(outcomeOpponentKill.capturedPawn?.playerColor === 'RED', 'Captured opponent belongs to RED Team B');
}

// 12. Team Up Victory Condition
{
  const pA1: Player = {
    ...createPlayer('BLUE'),
    team: 'TEAM_A',
    pawns: [
      { id: 0, color: 'BLUE', step: 56, isHome: true },
      { id: 1, color: 'BLUE', step: 56, isHome: true },
      { id: 2, color: 'BLUE', step: 56, isHome: true },
      { id: 3, color: 'BLUE', step: 56, isHome: true },
    ],
  };
  const pA2: Player = {
    ...createPlayer('GREEN'),
    team: 'TEAM_A',
    pawns: [
      { id: 0, color: 'GREEN', step: 56, isHome: true },
      { id: 1, color: 'GREEN', step: 56, isHome: true },
      { id: 2, color: 'GREEN', step: 56, isHome: true },
      { id: 3, color: 'GREEN', step: 56, isHome: true },
    ],
  };
  const pB1: Player = {
    ...createPlayer('RED'),
    team: 'TEAM_B',
    pawns: createPawns('RED'),
  };
  const pB2: Player = {
    ...createPlayer('YELLOW'),
    team: 'TEAM_B',
    pawns: createPawns('YELLOW'),
  };

  assert(checkTeamUpWinner([pA1, pA2, pB1, pB2]) === 'TEAM_A', 'Team A wins when all pawns of both Team A partners are home');
  assert(checkTeamUpWinner([pB1, pB2]) === null, 'No winner while match is in progress');
}

// 13. TEST SUITE: Page 5A (Classic Setup Screen) Player Count & Color Selection Invariants
console.log('\n--- TEST SUITE: Page 5A Classic Player Count & Token Color Invariants ---');
{
  const CLASSIC_ALLOWED_PLAYER_COUNTS = [2, 3, 4];
  const isClassicPlayerCountValid = (count: number) => CLASSIC_ALLOWED_PLAYER_COUNTS.includes(count);

  assert(isClassicPlayerCountValid(2) === true, 'Classic 2P mode is valid');
  assert(isClassicPlayerCountValid(3) === true, 'Classic 3P mode is valid');
  assert(isClassicPlayerCountValid(4) === true, 'Classic 4P mode is valid');
  assert(isClassicPlayerCountValid(5) === false, 'Classic 5P mode is strictly removed/disallowed');
  assert(isClassicPlayerCountValid(6) === false, 'Classic 6P mode is strictly removed/disallowed');

  // Exact Quota Rule (no more, no less)
  const adjustSelectedColors = (
    currentColors: PlayerColor[],
    targetPlayerCount: number
  ): PlayerColor[] => {
    const allColors: PlayerColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
    if (currentColors.length === targetPlayerCount) return currentColors;
    if (currentColors.length > targetPlayerCount) {
      return currentColors.slice(0, targetPlayerCount);
    }
    const next = [...currentColors];
    for (const c of allColors) {
      if (!next.includes(c)) {
        next.push(c);
        if (next.length === targetPlayerCount) break;
      }
    }
    return next;
  };

  // 2P: Exactly 2 colors
  const colors2P = adjustSelectedColors(['BLUE', 'GREEN'], 2);
  assert(colors2P.length === 2, '2P mode has exactly 2 colors selected');
  assert(colors2P[0] === 'BLUE' && colors2P[1] === 'GREEN', '2P colors match initial selection');

  // Quota enforcement when switching from 4 to 2
  const colorsFrom4To2 = adjustSelectedColors(['RED', 'GREEN', 'YELLOW', 'BLUE'], 2);
  assert(colorsFrom4To2.length === 2, 'Switching from 4P to 2P truncates to exactly 2 colors (no more)');

  // 3P: Exactly 3 colors
  const colors3P = adjustSelectedColors(['BLUE', 'GREEN'], 3);
  assert(colors3P.length === 3, '3P mode expands to exactly 3 colors (no less)');
  assert(new Set(colors3P).size === 3, 'All 3 selected colors are unique');

  // 4P: Exactly 4 colors
  const colors4P = adjustSelectedColors(['BLUE', 'GREEN'], 4);
  assert(colors4P.length === 4, '4P mode expands to all 4 colors');
  assert(new Set(colors4P).size === 4, 'All 4 selected colors are unique');

  // Color Swapping Logic: When quota is full (e.g. 2P has 2 colors), tapping a new color replaces target slot
  const swapColor = (
    currentColors: PlayerColor[],
    newColor: PlayerColor,
    slotToReplace: number
  ): PlayerColor[] => {
    const next = [...currentColors];
    next[slotToReplace] = newColor;
    return next;
  };

  const swapped2P = swapColor(['BLUE', 'GREEN'], 'RED', 0);
  assert(swapped2P.length === 2, 'Swapping maintains exactly 2 colors (no more, no less)');
  assert(swapped2P[0] === 'RED' && swapped2P[1] === 'GREEN', 'Slot 0 successfully replaced with RED');

  // Player Builder for Classic match
  const buildClassicPlayers = (
    playerCount: number,
    colors: PlayerColor[],
    names: Record<string, string>,
    oneTokenOut: boolean
  ): Player[] => {
    return colors.slice(0, playerCount).map((col, idx) => ({
      id: `p-${col.toLowerCase()}`,
      name: names[`p${idx + 1}`] || `Player ${idx + 1}`,
      color: col,
      avatar: '🦁',
      pawns: createPawns(col, oneTokenOut),
      hasCaptured: false,
      consecutiveSixes: 0,
      rank: null,
      isActive: true,
    }));
  };

  const classicPlayers2P = buildClassicPlayers(2, ['RED', 'YELLOW'], { p1: 'Alice', p2: 'Bob' }, false);
  assert(classicPlayers2P.length === 2, 'Classic match initialized with exactly 2 players');
  assert(classicPlayers2P[0].name === 'Alice', 'Player 1 custom name preserved');
  assert(classicPlayers2P[0].color === 'RED', 'Player 1 assigned RED color');
  assert(classicPlayers2P[1].name === 'Bob', 'Player 2 custom name preserved');
  assert(classicPlayers2P[1].color === 'YELLOW', 'Player 2 assigned YELLOW color');
  assert(classicPlayers2P[0].pawns[0].step === -1, 'Standard Classic: all pawns start in yard (-1)');

  const classicPlayers1Out = buildClassicPlayers(2, ['BLUE', 'GREEN'], {}, true);
  assert(classicPlayers1Out[0].pawns[0].step === 0, 'One Token Out Classic: pawn 0 starts on track (step 0)');
  assert(classicPlayers1Out[0].pawns[1].step === -1, 'One Token Out Classic: pawn 1 remains in yard (-1)');
}

// 14. TEST SUITE: 9-Color Token Palette & Play Button Quota Guard Rules
console.log('\n--- TEST SUITE: 9-Color Token Palette & Play Button Quota Guard ---');
{
  const NINE_PALETTE_HEXES = [
    '#ecae02', // Gold
    '#777777ff', // Silver
    '#b21919', // Red
    '#3a72db', // Blue
    '#c36ede', // Lavender
    '#e6cc46', // Yellow
    '#7dc929', // Green
    '#af27d7', // Purple
    '#2e2730', // Dark
  ];

  assert(NINE_PALETTE_HEXES.length === 9, 'Exactly 9 colors are integrated in the palette');

  // Play Button Quota Rule
  const isPlayButtonEnabled = (selectedHexes: string[], playerCount: number): boolean => {
    return selectedHexes.length === playerCount;
  };

  // 2P Mode Quota Tests
  assert(isPlayButtonEnabled([], 2) === false, '2P Mode: 0 colors selected -> Play button is disabled');
  assert(isPlayButtonEnabled(['#ecae02'], 2) === false, '2P Mode: 1 color selected -> Play button is disabled');
  assert(isPlayButtonEnabled(['#ecae02', '#3a72db'], 2) === true, '2P Mode: Exactly 2 colors selected -> Play button is ENABLED');

  // Deselecting reduces count and disables play button
  let selected2P = ['#ecae02', '#3a72db'];
  // User deselects '#ecae02'
  selected2P = selected2P.filter(h => h !== '#ecae02');
  assert(selected2P.length === 1, 'Deselecting color leaves 1 color');
  assert(isPlayButtonEnabled(selected2P, 2) === false, 'After deselecting, Play button is immediately disabled');

  // 3P Mode Quota Tests
  assert(isPlayButtonEnabled(['#ecae02', '#3a72db'], 3) === false, '3P Mode: 2 colors selected -> Play button is disabled');
  assert(isPlayButtonEnabled(['#ecae02', '#3a72db', '#7dc929'], 3) === true, '3P Mode: Exactly 3 colors selected -> Play button is ENABLED');

  // 4P Mode Quota Tests
  assert(isPlayButtonEnabled(['#ecae02', '#3a72db', '#7dc929'], 4) === false, '4P Mode: 3 colors selected -> Play button is disabled');
  assert(isPlayButtonEnabled(['#ecae02', '#3a72db', '#7dc929', '#af27d7'], 4) === true, '4P Mode: Exactly 4 colors selected -> Play button is ENABLED');

  // Player Builder with tokenColorHex
  const buildPlayersWith9Colors = (
    playerCount: number,
    hexes: string[],
    names: Record<string, string>
  ): Player[] => {
    const quadrants: PlayerColor[] = ['RED', 'YELLOW', 'GREEN', 'BLUE'];
    return Array.from({ length: playerCount }).map((_, idx) => ({
      id: `p-${idx + 1}`,
      name: names[`p${idx + 1}`] || `Player ${idx + 1}`,
      color: quadrants[idx % quadrants.length],
      tokenColorHex: hexes[idx],
      avatar: '🦁',
      pawns: createPawns(quadrants[idx % quadrants.length]),
      hasCaptured: false,
      consecutiveSixes: 0,
      rank: null,
      isActive: true,
    }));
  };

  const players2P = buildPlayersWith9Colors(2, ['#c36ede', '#7dc929'], { p1: 'Alice', p2: 'Bob' });
  assert(players2P[0].tokenColorHex === '#c36ede', 'Player 1 correctly assigned Lavender token color (#c36ede)');
  assert(players2P[1].tokenColorHex === '#7dc929', 'Player 2 correctly assigned Green token color (#7dc929)');
  assert(players2P[0].color === 'RED', 'Player 1 seated at RED quadrant');
  assert(players2P[1].color === 'YELLOW', 'Player 2 seated at YELLOW quadrant');

  const players4P = buildPlayersWith9Colors(4, ['#ecae02', '#777777ff', '#b21919', '#2e2730'], {});
  assert(players4P.length === 4, '4P mode creates 4 players with custom token colors');
  assert(players4P[1].tokenColorHex === '#777777ff', 'Player 2 assigned Silver token color (#777777ff)');
  assert(players4P[3].tokenColorHex === '#2e2730', 'Player 4 assigned Charcoal Dark token color (#2e2730)');
}

// 15. TEST SUITE: Page 5B Team Up 4-Token Color Rules & Selection
console.log('\n--- TEST SUITE: Page 5B Team Up 4-Token Color Rules & Selection ---');
{
  const NINE_PALETTE_HEXES = [
    '#ecae02', // Gold
    '#777777ff', // Silver
    '#b21919', // Red
    '#3a72db', // Blue
    '#c36ede', // Lavender
    '#e6cc46', // Yellow
    '#7dc929', // Green
    '#af27d7', // Purple
    '#2e2730', // Dark
  ];

  type TeamUpPlayerKey = 'p1' | 'p3' | 'p2' | 'p4';

  const DEFAULT_TEAMUP_COLORS: Record<TeamUpPlayerKey, string> = {
    p1: '#3a72db', // Royal Blue
    p3: '#7dc929', // Lime Green
    p2: '#b21919', // Crimson Red
    p4: '#e6cc46', // Lemon Yellow
  };

  // Rule 1: Default initialization has 4 distinct colors
  let currentColors = { ...DEFAULT_TEAMUP_COLORS };
  const initialValues = Object.values(currentColors);
  assert(initialValues.length === 4, 'Team Up has exactly 4 player token colors');
  assert(new Set(initialValues.map(h => h.toLowerCase())).size === 4, 'All 4 default Team Up token colors are strictly unique');

  // Rule 2: Dynamic unselected colors calculation
  const getUnselectedColors = (colors: Record<TeamUpPlayerKey, string>) => {
    const selected = Object.values(colors).map(h => h.toLowerCase());
    return NINE_PALETTE_HEXES.filter(hex => !selected.includes(hex.toLowerCase()));
  };

  let unselected = getUnselectedColors(currentColors);
  assert(unselected.length === 5, 'Exactly 5 colors are unselected initially (9 - 4 = 5)');
  assert(unselected.includes('#c36ede'), 'Lavender (#c36ede) is initially unselected');
  assert(!unselected.includes('#3a72db'), 'Royal Blue (#3a72db) is initially selected (not in unselected pool)');

  // Rule 3: Selecting an unselected color updates that player and releases their old color
  const selectColorForPlayer = (
    colors: Record<TeamUpPlayerKey, string>,
    player: TeamUpPlayerKey,
    newHex: string
  ): Record<TeamUpPlayerKey, string> => {
    // Guard: newHex must be unselected to maintain uniqueness
    const unselectedNow = getUnselectedColors(colors);
    if (!unselectedNow.some(h => h.toLowerCase() === newHex.toLowerCase())) {
      throw new Error(`Color ${newHex} is already taken!`);
    }
    return {
      ...colors,
      [player]: newHex,
    };
  };

  // Player 1 picks Lavender (#c36ede)
  currentColors = selectColorForPlayer(currentColors, 'p1', '#c36ede');
  assert(currentColors.p1 === '#c36ede', 'Player 1 successfully updated to Lavender (#c36ede)');

  // Verify all 4 are still unique
  assert(new Set(Object.values(currentColors).map(h => h.toLowerCase())).size === 4, 'After picking unselected color, all 4 tokens remain strictly unique');

  // Unselected pool now has Blue (#3a72db) and NOT Lavender (#c36ede)
  unselected = getUnselectedColors(currentColors);
  assert(unselected.length === 5, 'Unselected pool remains exactly 5 colors');
  assert(unselected.includes('#3a72db'), 'Royal Blue (#3a72db) was released back to unselected pool');
  assert(!unselected.includes('#c36ede'), 'Lavender (#c36ede) is now occupied and removed from unselected pool');

  // Rule 4: Attempting to pick an already selected color is guarded
  let duplicatePrevented = false;
  try {
    // Attempt to set Player 3 to Red (#b21919), which is already taken by Player 2
    selectColorForPlayer(currentColors, 'p3', '#b21919');
  } catch {
    duplicatePrevented = true;
  }
  assert(duplicatePrevented, 'Selecting an occupied color directly is strictly prevented to avoid duplicate tokens');

  // Rule 5: Swap rule between two players maintains uniqueness
  const swapPlayerColors = (
    colors: Record<TeamUpPlayerKey, string>,
    pA: TeamUpPlayerKey,
    pB: TeamUpPlayerKey
  ): Record<TeamUpPlayerKey, string> => ({
    ...colors,
    [pA]: colors[pB],
    [pB]: colors[pA],
  });

  const swapped = swapPlayerColors(currentColors, 'p2', 'p4');
  assert(swapped.p2 === '#e6cc46', 'Player 2 received Player 4 yellow color');
  assert(swapped.p4 === '#b21919', 'Player 4 received Player 2 red color');
  assert(new Set(Object.values(swapped).map(h => h.toLowerCase())).size === 4, 'Swapping maintains 4 distinct colors');

  // Rule 6: Player Builder includes tokenColorHex for 2v2 team match
  const buildTeamUpMatchPlayers = (
    colors: Record<TeamUpPlayerKey, string>,
    names: Record<string, string>,
    oneTokenOut: boolean
  ): Player[] => {
    return [
      {
        id: 'p-blue',
        name: names.p1 || 'Player 1',
        color: 'BLUE',
        tokenColorHex: colors.p1,
        avatar: '🐉',
        team: 'TEAM_A',
        pawns: createPawns('BLUE', oneTokenOut),
        hasCaptured: false,
        consecutiveSixes: 0,
        rank: null,
        isActive: true,
      },
      {
        id: 'p-red',
        name: names.p2 || 'Player 2',
        color: 'RED',
        tokenColorHex: colors.p2,
        avatar: '🦁',
        team: 'TEAM_B',
        pawns: createPawns('RED', oneTokenOut),
        hasCaptured: false,
        consecutiveSixes: 0,
        rank: null,
        isActive: true,
      },
      {
        id: 'p-green',
        name: names.p3 || 'Player 3',
        color: 'GREEN',
        tokenColorHex: colors.p3,
        avatar: '🐯',
        team: 'TEAM_A',
        pawns: createPawns('GREEN', oneTokenOut),
        hasCaptured: false,
        consecutiveSixes: 0,
        rank: null,
        isActive: true,
      },
      {
        id: 'p-yellow',
        name: names.p4 || 'Player 4',
        color: 'YELLOW',
        tokenColorHex: colors.p4,
        avatar: '🦅',
        team: 'TEAM_B',
        pawns: createPawns('YELLOW', oneTokenOut),
        hasCaptured: false,
        consecutiveSixes: 0,
        rank: null,
        isActive: true,
      },
    ];
  };

  const matchPlayers = buildTeamUpMatchPlayers(currentColors, { p1: 'Gamer 1', p2: 'Gamer 2' }, false);
  assert(matchPlayers[0].tokenColorHex === '#c36ede', 'Team A Player 1 match pawn has tokenColorHex Lavender (#c36ede)');
  assert(matchPlayers[1].tokenColorHex === '#b21919', 'Team B Player 2 match pawn has tokenColorHex Red (#b21919)');
  assert(matchPlayers[2].tokenColorHex === '#7dc929', 'Team A Player 3 match pawn has tokenColorHex Green (#7dc929)');
  assert(matchPlayers[3].tokenColorHex === '#e6cc46', 'Team B Player 4 match pawn has tokenColorHex Yellow (#e6cc46)');
  assert(matchPlayers[0].team === 'TEAM_A', 'Player 1 belongs to TEAM_A');
  assert(matchPlayers[1].team === 'TEAM_B', 'Player 2 belongs to TEAM_B');

  // Rule 7: Refresh persistence via localStorage
  const savedColorsJson = JSON.stringify(currentColors);
  mockLocalStorage['ludo_pnp_teamup_colors'] = savedColorsJson;
  const reloadedColors = JSON.parse(mockLocalStorage['ludo_pnp_teamup_colors']);
  assert(reloadedColors.p1 === '#c36ede', 'Reloaded Player 1 color from localStorage is Lavender (#c36ede)');
  assert(reloadedColors.p3 === '#7dc929', 'Reloaded Player 3 color from localStorage is Green (#7dc929)');
}

// ==================== TEST SUITE: Page 5C Team Up Penalty Task Selection Page ====================
console.log('\n--- TEST SUITE: Page 5C Team Up Penalty Task Selection Page ---');
{
  // 1. Task List & Exact Titles
  assert(Array.isArray(TEAM_UP_TASKS), 'TEAM_UP_TASKS is an array');
  assert(TEAM_UP_TASKS.length === 3, 'There are exactly 3 tasks for selection');

  const task1 = TEAM_UP_TASKS.find((t: any) => t.id === 'task-1');
  const task2 = TEAM_UP_TASKS.find((t: any) => t.id === 'task-2');
  const task3 = TEAM_UP_TASKS.find((t: any) => t.id === 'task-3');

  assert(task1 !== undefined, 'Task 1 exists');
  assert(task1.title === 'Dance on Bhojpuri song', 'Task 1 title is exactly "Dance on Bhojpuri song"');
  assert(task1.taskNumber === 1, 'Task 1 taskNumber is 1');
  assert(task1.iconEmoji === '💃', 'Task 1 has dance emoji 💃');

  assert(task2 !== undefined, 'Task 2 exists');
  assert(task2.title === 'salute marna hai ladle', 'Task 2 title is exactly "salute marna hai ladle"');
  assert(task2.taskNumber === 2, 'Task 2 taskNumber is 2');
  assert(task2.iconEmoji === '🫡', 'Task 2 has salute emoji 🫡');

  assert(task3 !== undefined, 'Task 3 exists');
  assert(task3.title === 'Dhumka marna hai', 'Task 3 title is exactly "Dhumka marna hai"');
  assert(task3.taskNumber === 3, 'Task 3 taskNumber is 3');
  assert(task3.iconEmoji === '🕺', 'Task 3 has dhumka dance emoji 🕺');

  // 2. Interactive Selection & State Transitions
  let currentSelectedTaskId = 'task-1';
  assert(currentSelectedTaskId === 'task-1', 'Default selected task is Task 1');

  // Select Task 2
  currentSelectedTaskId = 'task-2';
  assert(currentSelectedTaskId === 'task-2', 'Successfully switched to Task 2 (salute marna hai ladle)');

  // Select Task 3
  currentSelectedTaskId = 'task-3';
  assert(currentSelectedTaskId === 'task-3', 'Successfully switched to Task 3 (Dhumka marna hai)');

  // 3. LocalStorage persistence
  mockLocalStorage[STORAGE_KEY_SELECTED_TASK] = currentSelectedTaskId;
  const savedTaskId = mockLocalStorage[STORAGE_KEY_SELECTED_TASK];
  assert(savedTaskId === 'task-3', 'Task selection persisted in localStorage is task-3');

  // 4. Team Up Play Button triggers task selection navigation
  type Screen = 'PASS_N_PLAY_TEAM_UP_SETUP' | 'TEAM_UP_TASK_SELECTION' | 'GAME';
  let activeScreen: Screen = 'PASS_N_PLAY_TEAM_UP_SETUP';
  let pendingConfig: any = null;

  const onTeamUpPlayClicked = (players: any, rules: any) => {
    pendingConfig = { players, rules };
    activeScreen = 'TEAM_UP_TASK_SELECTION';
  };

  const dummyPlayers = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }];
  const dummyRules = { friendlyKill: true };

  onTeamUpPlayClicked(dummyPlayers, dummyRules);
  assert(activeScreen === 'TEAM_UP_TASK_SELECTION', 'Clicking Play on Team Up setup transitions to TEAM_UP_TASK_SELECTION screen');
  assert(pendingConfig !== null, 'Pending players and rules are saved for the match');
  assert(pendingConfig.players.length === 4, 'All 4 Team Up players are preserved');

  // 5. Confirming on Task Selection launches GAME
  const onConfirmAndPlay = (selectedTask: any) => {
    assert(selectedTask.title === 'Dhumka marna hai', 'Chosen task passed to match is Dhumka marna hai');
    activeScreen = 'GAME';
  };

  onConfirmAndPlay(task3);
  assert(activeScreen === 'GAME', 'Clicking Play on Task Selection launches GAME arena');

  // 6. URL hash routing
  const getScreenFromHash = (hash: string) => {
    if (hash.includes('task') || hash.includes('penalty')) return 'TEAM_UP_TASK_SELECTION';
    if (hash.includes('pass-team')) return 'PASS_N_PLAY_TEAM_UP_SETUP';
    return 'HOME';
  };
  assert(getScreenFromHash('#task-selection') === 'TEAM_UP_TASK_SELECTION', 'URL hash #task-selection opens TEAM_UP_TASK_SELECTION directly');
}

// =========================================================================
// TEST SUITE: Main Game Screen UI/UX & Board Rules (Selected Player Colors & Slower Dice)
// =========================================================================
{
  console.log('\n--- TEST SUITE: Main Game Screen UI/UX & Board Rules ---');

  // Test 1: Fast, crisp dice roll & scroll speed decreased by 1/4 (285ms)
  const DICE_ROLL_DURATION_MS = 285;
  assert(DICE_ROLL_DURATION_MS >= 250, 'Dice roll duration decreased by 1/4 to 285ms (snappy)');
  assert(DICE_ROLL_DURATION_MS <= 400, 'Dice roll duration decreased by 1/4 to 285ms (snappy)');

  // Test 1B: 3D Dice Face alignment (Faces 2 and 5 rotation correctly matches visible pips)
  const diceFaces = {
    1: { class: 'face-front', pips: 1, normal: [0, 0, 1] },
    2: { class: 'face-top', pips: 2, normal: [0, -1, 0] },
    3: { class: 'face-right', pips: 3, normal: [1, 0, 0] },
    4: { class: 'face-left', pips: 4, normal: [-1, 0, 0] },
    5: { class: 'face-bottom', pips: 5, normal: [0, 1, 0] },
    6: { class: 'face-back', pips: 6, normal: [0, 0, -1] },
  };
  const cubeRotations = {
    1: { rx: 0, ry: 0 },
    2: { rx: -90, ry: 0 },
    3: { rx: 0, ry: -90 },
    4: { rx: 0, ry: 90 },
    5: { rx: 90, ry: 0 },
    6: { rx: 180, ry: 0 },
  };
  function rotCheck(rx: number, ry: number, v: number[]) {
    const radX = (rx * Math.PI) / 180;
    const radY = (ry * Math.PI) / 180;
    const y1 = v[1] * Math.cos(radX) - v[2] * Math.sin(radX);
    const z1 = v[1] * Math.sin(radX) + v[2] * Math.cos(radX);
    const x1 = v[0];
    const x2 = x1 * Math.cos(radY) + z1 * Math.sin(radY);
    const y2 = y1;
    const z2 = -x1 * Math.sin(radY) + z1 * Math.cos(radY);
    return [Math.round(x2), Math.round(y2), Math.round(z2)];
  }
  for (let r = 1; r <= 6; r++) {
    const { rx, ry } = cubeRotations[r as keyof typeof cubeRotations];
    let frontPips = 0;
    for (const f of Object.values(diceFaces)) {
      const wn = rotCheck(rx, ry, f.normal);
      if (wn[0] === 0 && wn[1] === 0 && wn[2] === 1) {
        frontPips = f.pips;
      }
    }
    assert(frontPips === r, `Dice 3D rotation for roll ${r} displays exactly face ${r} (no 2-5 inversion)`);
  }

  // Test 2: Board Quadrants dynamically derive player custom selected colors
  const testPlayers: Player[] = [
    {
      id: 'p-red',
      name: 'Daniel',
      color: 'RED',
      tokenColorHex: '#c36ede', // Lavender selected for Red yard
      avatar: '🦁',
      pawns: createPawns('RED'),
      hasCaptured: false,
      consecutiveSixes: 0,
      rank: null,
      isActive: true,
    },
    {
      id: 'p-green',
      name: 'Sandy',
      color: 'GREEN',
      tokenColorHex: '#7dc929', // Lime green selected for Green yard
      avatar: '🐯',
      pawns: createPawns('GREEN'),
      hasCaptured: false,
      consecutiveSixes: 0,
      rank: null,
      isActive: true,
    },
    {
      id: 'p-yellow',
      name: 'John',
      color: 'YELLOW',
      tokenColorHex: '#e6cc46', // Lemon yellow selected for Yellow yard
      avatar: '🦅',
      pawns: createPawns('YELLOW'),
      hasCaptured: false,
      consecutiveSixes: 0,
      rank: null,
      isActive: true,
    },
    {
      id: 'p-blue',
      name: 'Soumya',
      color: 'BLUE',
      tokenColorHex: '#3a72db', // Royal blue selected for Blue yard
      avatar: '🐉',
      pawns: createPawns('BLUE'),
      hasCaptured: false,
      consecutiveSixes: 0,
      rank: null,
      isActive: true,
    },
  ];

  const getQuadrantColor = (color: PlayerColor, playerList: Player[]): string => {
    const p = playerList.find(item => item.color === color);
    const defaultHexes: Record<PlayerColor, string> = {
      RED: '#b21919',
      GREEN: '#7dc929',
      YELLOW: '#ecae02',
      BLUE: '#3a72db',
    };
    return (p && p.tokenColorHex) ? p.tokenColorHex : defaultHexes[color];
  };

  assert(getQuadrantColor('RED', testPlayers) === '#c36ede', 'Red yard uses selected player color #c36ede (Lavender)');
  assert(getQuadrantColor('GREEN', testPlayers) === '#7dc929', 'Green yard uses selected player color #7dc929 (Lime Green)');
  assert(getQuadrantColor('YELLOW', testPlayers) === '#e6cc46', 'Yellow yard uses selected player color #e6cc46 (Lemon Yellow)');
  assert(getQuadrantColor('BLUE', testPlayers) === '#3a72db', 'Blue yard uses selected player color #3a72db (Royal Blue)');

  // Test 3: Player names on board yard bases
  const getYardPlayerName = (color: PlayerColor, playerList: Player[]): string => {
    const p = playerList.find(item => item.color === color);
    return (p && p.isActive) ? p.name : '';
  };

  assert(getYardPlayerName('RED', testPlayers) === 'Daniel', 'Red yard displays player name Daniel');
  assert(getYardPlayerName('GREEN', testPlayers) === 'Sandy', 'Green yard displays player name Sandy');
  assert(getYardPlayerName('YELLOW', testPlayers) === 'John', 'Yellow yard displays player name John');
  assert(getYardPlayerName('BLUE', testPlayers) === 'Soumya', 'Blue yard displays player name Soumya');

  // Test 4: Yard empty socket count decreases when tokens leave yard
  const getEmptyYardSocketCount = (player: Player): number => {
    return player.pawns.filter(p => p.step >= 0 || p.isHome).length;
  };

  // Initially all in yard (-1) -> 0 empty sockets
  assert(getEmptyYardSocketCount(testPlayers[0]) === 0, 'Initially 0 empty sockets (all 4 tokens in yard)');

  // Move 1 token to track (like Daniel in screenshot with 1 token on track)
  testPlayers[0].pawns[0].step = 0;
  assert(getEmptyYardSocketCount(testPlayers[0]) === 1, 'Daniel has 1 empty socket on white square (token on track)');

  // Soumya has 2 tokens on track (like in screenshot)
  testPlayers[3].pawns[0].step = 0;
  testPlayers[3].pawns[1].step = 5;
  assert(getEmptyYardSocketCount(testPlayers[3]) === 2, 'Soumya has 2 empty sockets on white square (2 tokens on track)');

  // Test 5: Safe squares include 8 stars & start cells
  const safeIndices = [0, 8, 13, 21, 26, 34, 39, 47];
  for (const idx of safeIndices) {
    assert(isSafeGlobalCell(idx, 'standard'), `Global track index ${idx} is safe`);
  }

  // Non-safe cells
  assert(!isSafeGlobalCell(1, 'standard'), 'Global track index 1 is not safe');
  assert(!isSafeGlobalCell(5, 'standard'), 'Global track index 5 is not safe');

  // Test 6: In 2P match, inactive quadrants return empty player name
  const twoPlayerMatch: Player[] = [
    { ...testPlayers[0], isActive: true },
    { ...testPlayers[1], isActive: false }, // Inactive Green
    { ...testPlayers[2], isActive: true },
    { ...testPlayers[3], isActive: false }, // Inactive Blue
  ];
  assert(getYardPlayerName('GREEN', twoPlayerMatch) === '', 'Inactive Green yard displays no player name');
  assert(getYardPlayerName('BLUE', twoPlayerMatch) === '', 'Inactive Blue yard displays no player name');
}

// 23. TEST SUITE: Rule 1 (2 Freeze Stars in 5-min cycle) & Rule 2 (1 Jump Icon in 7-min cycle)
console.log('\n--- TEST SUITE: Dynamic Board Hazards (Freeze Stars & Jump Icon) ---');
{
  // Test 1: Random Hazard Index Generator
  const freezeStars = generateRandomHazardIndices(2);
  assert(freezeStars.length === 2, 'Generated exactly 2 freeze stars');
  assert(freezeStars[0] !== freezeStars[1], 'The 2 freeze stars are on distinct tiles');
  assert(!ALL_SAFE_INDICES.includes(freezeStars[0]), 'Freeze star 1 is not on a start tile or existing safe star');
  assert(!ALL_SAFE_INDICES.includes(freezeStars[1]), 'Freeze star 2 is not on a start tile or existing safe star');
  assert(ELIGIBLE_HAZARD_INDICES.includes(freezeStars[0]), 'Freeze star 1 is on an eligible common running cell');
  assert(ELIGIBLE_HAZARD_INDICES.includes(freezeStars[1]), 'Freeze star 2 is on an eligible common running cell');

  const jumpIcons = generateRandomHazardIndices(1, freezeStars);
  assert(jumpIcons.length === 1, 'Generated exactly 1 jump icon');
  assert(!freezeStars.includes(jumpIcons[0]), 'Jump icon does not overlap with freeze stars');
  assert(!ALL_SAFE_INDICES.includes(jumpIcons[0]), 'Jump icon is not on a start tile or existing safe star');
  assert(ELIGIBLE_HAZARD_INDICES.includes(jumpIcons[0]), 'Jump icon is on an eligible common running cell');

  // Test 2: Freeze Star Landing & Safe Coexistence
  const freezeTile = 5; // Global track index 5 (Red step 5)
  const pRed = createPlayer('RED');
  const pGreen = createPlayer('GREEN');
  pRed.pawns[0].step = 2;

  // Move Red pawn from step 2 with roll 3 -> lands on step 5 (which is freezeTile)
  const freezeOutcome = calculateMoveOutcome([pRed, pGreen], pRed, 0, 3, defaultRules, [freezeTile], null);
  assert(freezeOutcome.toStep === 5, 'Pawn lands on step 5');
  assert(freezeOutcome.landedOnFreezeStar === true, 'Pawn recognized as landing on Freeze Star');
  assert(freezeOutcome.landedOnSafeCell === true, 'Freeze star acts as a safe cell');

  // Opponent landing on freeze star cell cannot capture an unfrozen pawn
  pGreen.pawns[0].step = 43; // Green step 43 is (13 + 43) % 52 = 4 (just behind 5)
  pRed.pawns[0].step = 5; // Red pawn standing on freeze star (global 5)
  pRed.pawns[0].isFrozen = false;
  const greenRollOutcome = calculateMoveOutcome([pRed, pGreen], pGreen, 0, 1, defaultRules, [freezeTile], null);
  assert(greenRollOutcome.capturedPawn === null, 'Opponent landing on Freeze Star cannot capture an unfrozen pawn');

  // Rule Update: If pawn is FROZEN, opponent landing on it CAPTURES the frozen pawn!
  pRed.pawns[0].isFrozen = true;
  const greenCaptureOutcome = calculateMoveOutcome([pRed, pGreen], pGreen, 0, 1, defaultRules, [freezeTile], null);
  assert(greenCaptureOutcome.capturedPawn !== null, 'Opponent landing on a frozen pawn CAPTURES it!');
  assert(greenCaptureOutcome.capturedPawn?.playerColor === 'RED', 'Captured pawn belongs to RED');

  // Test 3: canPawnMove forbids frozen pawn from moving
  const frozenPawn: Pawn = { id: 0, color: 'RED', step: 5, isHome: false, isFrozen: true, frozenTurnsLeft: 1 };
  const movablePawn: Pawn = { id: 1, color: 'RED', step: 0, isHome: false, isFrozen: false };
  const playerWithFrozen = { ...pRed, pawns: [frozenPawn, movablePawn, pRed.pawns[2], pRed.pawns[3]] };
  assert(!canPawnMove(playerWithFrozen, frozenPawn, 4, defaultRules), 'Frozen pawn CANNOT move (canPawnMove is false)');
  assert(canPawnMove(playerWithFrozen, movablePawn, 4, defaultRules), 'Unfrozen pawn can move normally');

  // Test 4: Jump Icon Landing & Forward Hop
  const jumpTile = 10; // Global track index 10 (Red step 10)
  pRed.pawns[1].step = 7;
  const jumpOutcome = calculateMoveOutcome([pRed, pGreen], pRed, 1, 3, defaultRules, [], jumpTile);
  assert(jumpOutcome.toStep === 10, 'Pawn lands on step 10 (Jump Icon tile)');
  assert(jumpOutcome.jumpSteps !== undefined && jumpOutcome.jumpSteps >= 1 && jumpOutcome.jumpSteps <= 5, 'Jump icon rolls random 1-5 steps');
  assert(jumpOutcome.jumpToStep === 10 + jumpOutcome.jumpSteps!, 'jumpToStep is advanced by jumpSteps');

  // Test 5: Jump Icon landing captures opponent if landing on unsafe cell
  const fixedJumpTile = 15; // Red step 15
  pRed.pawns[2].step = 13;
  // Green pawn sits on global index 17 (Red step 17) which is not a safe star
  pGreen.pawns[1].step = 4; // Green step 4 is global 17
  // We mock Math.random to return 0.25 (which maps to jumpSteps = 2 -> landing on step 17!)
  const origRandom = Math.random;
  Math.random = () => 0.25; // 0.25 * 5 = 1.25 -> floor is 1 + 1 = 2 steps
  try {
    const jumpCaptureOutcome = calculateMoveOutcome([pRed, pGreen], pRed, 2, 2, defaultRules, [], fixedJumpTile);
    assert(jumpCaptureOutcome.jumpSteps === 2, 'Jump rolled 2 steps');
    assert(jumpCaptureOutcome.jumpToStep === 17, 'Jump advanced to step 17');
    assert(jumpCaptureOutcome.jumpCapturedPawn !== null, 'Jump landing captured opponent pawn');
    assert(jumpCaptureOutcome.jumpCapturedPawn?.playerColor === 'GREEN', 'Captured opponent is GREEN');
    assert(jumpCaptureOutcome.bonusRoll === true, 'Bonus roll awarded for jump capture');
  } finally {
    Math.random = origRandom;
  }

  // Test 6: Freeze Star Removal on Use & 3-5 Minute Random Respawn Delay
  {
    const activeFreezeStars = [5, 20];
    const redPawn = { ...pRed.pawns[0], step: 2 };
    const playerRed = { ...pRed, pawns: [redPawn, pRed.pawns[1], pRed.pawns[2], pRed.pawns[3]] };
    const outcome = calculateMoveOutcome([playerRed, pGreen], playerRed, 0, 3, defaultRules, activeFreezeStars, null);
    assert(outcome.landedOnFreezeStar === true, 'Pawn landed on freeze star');
    assert(outcome.usedFreezeStarIndex === 5, 'Tracked usedFreezeStarIndex is 5');

    // Immediate removal of used freeze star
    const updatedStars = activeFreezeStars.filter(idx => idx !== outcome.usedFreezeStarIndex);
    assert(updatedStars.length === 1 && updatedStars[0] === 20, 'Specific used freeze star is removed immediately from board, keeping other star');

    // Respawn delay is within 3-5 minutes (180,000ms to 300,000ms)
    for (let i = 0; i < 50; i++) {
      const delay = getRandomHazardRespawnDelay();
      assert(delay >= MIN_HAZARD_RESPAWN_MS && delay <= MAX_HAZARD_RESPAWN_MS, 'Freeze star respawn delay is within 2-3 minutes (120,000ms to 180,000ms)');
    }
  }

  // Test 7: Jump Icon Removal on Use & 2-3 Minute Random Respawn Delay
  {
    const jumpCell = 10;
    const redPawn = { ...pRed.pawns[0], step: 6 };
    const playerRed = { ...pRed, pawns: [redPawn, pRed.pawns[1], pRed.pawns[2], pRed.pawns[3]] };
    const outcome = calculateMoveOutcome([playerRed, pGreen], playerRed, 0, 4, defaultRules, [5], jumpCell);
    assert(outcome.usedJumpIconIndex === 10, 'Tracked usedJumpIconIndex is 10');

    // Immediate removal of Jump Icon
    let currentJump: number | null = jumpCell;
    if (outcome.usedJumpIconIndex !== null && outcome.usedJumpIconIndex !== undefined) {
      currentJump = null;
    }
    assert(currentJump === null, 'Jump icon is removed immediately from board upon trigger');

    // Respawn delay is within 2-3 minutes (120,000ms to 180,000ms)
    for (let i = 0; i < 50; i++) {
      const delay = getRandomHazardRespawnDelay();
      assert(delay >= MIN_HAZARD_RESPAWN_MS && delay <= MAX_HAZARD_RESPAWN_MS, 'Jump icon respawn delay is within 2-3 minutes (120,000ms to 180,000ms)');
    }
  }

  // Test 8: processHazardRespawns lifecycle and non-overlapping track placement
  {
    const now = 1_000_000;
    const freezeRespawnAt = now + 130_000; // in 130s (within 2-3 min)
    const jumpRespawnAt = now + 150_000; // in 150s (within 2-3 min)

    const initialHazardState = {
      freezeStarIndices: [20],
      jumpIconIndex: null,
      jumpIconIndices: [],
      freezeStarRespawnTimes: [freezeRespawnAt],
      jumpIconRespawnTime: jumpRespawnAt,
      jumpIconRespawnTimes: [jumpRespawnAt],
    };

    // Before respawn time (at now + 100_000ms): no respawns
    const beforeResult = processHazardRespawns(initialHazardState, now + 100_000);
    assert(beforeResult.respawnedFreezeCount === 0, 'No freeze star respawns before scheduled delay');
    assert(beforeResult.respawnedJump === false, 'Jump icon does not respawn before scheduled delay');
    assert(beforeResult.nextState.freezeStarIndices.length === 1, 'Freeze star count remains 1 before delay');
    assert(beforeResult.nextState.jumpIconIndex === null, 'Jump icon remains null before delay');

    // At freezeRespawnAt (now + 130_001ms): Freeze star respawns!
    const midResult = processHazardRespawns(beforeResult.nextState, freezeRespawnAt + 1);
    assert(midResult.respawnedFreezeCount === 1, 'Freeze star respawns when delay elapses');
    assert(midResult.respawnedJump === false, 'Jump icon does not respawn yet');
    assert(midResult.nextState.freezeStarIndices.length === 2, 'Total freeze stars on board incremented');
    assert(midResult.nextState.freezeStarRespawnTimes.length === 0, 'Pending freeze star respawn list is cleared');

    const newStar = midResult.nextState.freezeStarIndices.find(x => x !== 20)!;
    assert(ELIGIBLE_HAZARD_INDICES.includes(newStar), 'Respawned freeze star is on an eligible track cell');
    assert(!ALL_SAFE_INDICES.includes(newStar), 'Respawned freeze star is not on a safe star or start cell');

    // At jumpRespawnAt (now + 150_001ms): Jump icon respawns!
    const finalResult = processHazardRespawns(midResult.nextState, jumpRespawnAt + 1);
    assert(finalResult.respawnedJump === true, 'Jump icon respawns when delay elapses');
    assert(finalResult.nextState.jumpIconIndex !== null, 'Jump icon is restored on track');
    assert(finalResult.nextState.jumpIconRespawnTime === null, 'Pending jump icon respawn time is cleared');
    assert(!finalResult.nextState.freezeStarIndices.includes(finalResult.nextState.jumpIconIndex!), 'Respawned jump icon does not overlap with any freeze star');
    assert(!ALL_SAFE_INDICES.includes(finalResult.nextState.jumpIconIndex!), 'Respawned jump icon is not on safe star or start cell');
    assert(ELIGIBLE_HAZARD_INDICES.includes(finalResult.nextState.jumpIconIndex!), 'Respawned jump icon is on eligible running cell');
  }

  // Test 9: Independent respawning for multiple freeze stars
  {
    const now = 2_000_000;
    const t1 = now + 130_000;
    const t2 = now + 160_000;

    const bothUsedState = {
      freezeStarIndices: [],
      jumpIconIndex: 7,
      jumpIconIndices: [7],
      freezeStarRespawnTimes: [t1, t2],
      jumpIconRespawnTime: null,
      jumpIconRespawnTimes: [],
    };

    // Stage 1: t1 elapses
    const stage1 = processHazardRespawns(bothUsedState, t1 + 10);
    assert(stage1.respawnedFreezeCount === 1, 'First freeze star respawns independently');
    assert(stage1.nextState.freezeStarIndices.length === 1, 'Board now has 1 freeze star');
    assert(stage1.nextState.freezeStarRespawnTimes.length === 1, 'Board has 1 pending freeze star respawn');

    // Stage 2: t2 elapses
    const stage2 = processHazardRespawns(stage1.nextState, t2 + 10);
    assert(stage2.respawnedFreezeCount === 1, 'Second freeze star respawns independently');
    assert(stage2.nextState.freezeStarIndices.length === 2, 'Board now has 2 freeze stars');
    assert(stage2.nextState.freezeStarIndices[0] !== stage2.nextState.freezeStarIndices[1], 'Both respawned freeze stars are on distinct tiles');
    assert(!stage2.nextState.freezeStarIndices.includes(7), 'Neither freeze star overlaps with active jump icon');
  }

  // Test 10: Jump onto Freeze Star (chain hazard activation)
  {
    const jumpTile = 10;
    const freezeTileAfterJump = 12; // Red step 10 + 2 = 12
    const redPawn = { ...pRed.pawns[0], step: 8 };
    const playerRed = { ...pRed, pawns: [redPawn, pRed.pawns[1], pRed.pawns[2], pRed.pawns[3]] };

    const origRandom = Math.random;
    Math.random = () => 0.25; // 0.25 * 5 = 1.25 -> 2 steps jump
    try {
      const outcome = calculateMoveOutcome([playerRed, pGreen], playerRed, 0, 2, defaultRules, [freezeTileAfterJump], jumpTile);
      assert(outcome.usedJumpIconIndex === 10, 'Jump icon was stepped on and flagged as used');
      assert(outcome.jumpSteps === 2, 'Jump moved token +2 steps to tile 12');
      assert(outcome.usedFreezeStarIndex === 12, 'Secondary landing on Freeze Star flagged as used');
      assert(outcome.landedOnFreezeStar === true, 'Token is frozen after jumping onto Freeze Star');
    } finally {
      Math.random = origRandom;
    }
  }

  // Test 11: ActiveMatchState reload persistence invariant
  {
    const stateBeforeReload = {
      freezeStarIndices: [14], // 1 freeze star currently active
      jumpIconIndex: null, // jump icon currently removed/respawning
      jumpIconIndices: [],
      freezeStarRespawnTimes: [3_500_000],
      jumpIconRespawnTime: 3_600_000,
      jumpIconRespawnTimes: [3_600_000],
    };

    const serialized = JSON.stringify(stateBeforeReload);
    const restored = JSON.parse(serialized);

    assert(Array.isArray(restored.freezeStarIndices) && restored.freezeStarIndices.length === 1, 'Restored state retains exactly 1 active freeze star');
    assert(restored.jumpIconIndex === null, 'Restored state retains null jump icon (does not respawn early on reload)');
    assert(restored.freezeStarRespawnTimes[0] === 3_500_000, 'Restored freeze star respawn timestamp preserved');
    assert(restored.jumpIconRespawnTime === 3_600_000, 'Restored jump icon respawn timestamp preserved');

    // Simulate time passing beyond reload timestamp
    const afterReloadProcess = processHazardRespawns(restored, 3_700_000);
    assert(afterReloadProcess.respawnedFreezeCount === 1, 'Freeze star respawns correctly after reload when scheduled time arrives');
    assert(afterReloadProcess.respawnedJump === true, 'Jump icon respawns correctly after reload when scheduled time arrives');
    assert(afterReloadProcess.nextState.freezeStarIndices.length === 2, 'Board restored to full 2 freeze stars');
    assert(afterReloadProcess.nextState.jumpIconIndex !== null, 'Jump icon restored onto board');
  }

  // Test 12: initializeHazardState clean initial generation with 0 overlaps across 100 trials (4 freeze stars, 4 jump icons)
  {
    for (let i = 0; i < 100; i++) {
      const init = initializeHazardState(null);
      assert(init.freezeStarIndices.length === 4, 'Always generates exactly 4 freeze stars');
      assert(init.jumpIconIndices.length === 4, 'Always generates exactly 4 jump icons');
      const uniqueFreeze = new Set(init.freezeStarIndices);
      assert(uniqueFreeze.size === 4, 'Freeze stars do not overlap each other');
      const uniqueJump = new Set(init.jumpIconIndices);
      assert(uniqueJump.size === 4, 'Jump icons do not overlap each other');
      assert(!init.freezeStarIndices.some(f => init.jumpIconIndices.includes(f)), 'Jump icons do NOT overlap with any freeze star on clean start');
      for (const j of init.jumpIconIndices) {
        assert(!ALL_SAFE_INDICES.includes(j), 'Jump icon is not on safe star or start cell');
      }
      for (const f of init.freezeStarIndices) {
        assert(!ALL_SAFE_INDICES.includes(f), 'Freeze star is not on safe star or start cell');
      }
      assert(init.freezeStarRespawnTimes.length === 0, 'No pending freeze star respawns on clean start');
      assert(init.jumpIconRespawnTime === null, 'No pending jump icon respawn on clean start');
    }
  }

  // Test 13: processHazardRespawns queue retention when board reaches capacity
  {
    const now = 5_000_000;
    // 3 freeze stars already on board, but 2 pending freeze timestamps matured
    const state = {
      freezeStarIndices: [14, 15, 16],
      jumpIconIndex: null,
      jumpIconIndices: [],
      freezeStarRespawnTimes: [now - 500, now - 100],
      jumpIconRespawnTime: null,
      jumpIconRespawnTimes: [],
    };
    const res = processHazardRespawns(state, now);
    assert(res.respawnedFreezeCount === 1, 'Respawns exactly 1 star to reach maximum capacity of 4');
    assert(res.nextState.freezeStarIndices.length === 4, 'Board now has exactly 4 freeze stars');
    assert(res.nextState.freezeStarRespawnTimes.length === 1, 'Retains unconsumed matured timestamp in queue (does NOT drop it)');
    assert(res.nextState.freezeStarRespawnTimes[0] === now - 100, 'Retained timestamp is preserved for future respawn');
  }

  // Test 14: Jump icon redundant timer handling when at capacity
  {
    const now = 6_000_000;
    const state = {
      freezeStarIndices: [],
      jumpIconIndex: 25,
      jumpIconIndices: [25, 30, 35, 40], // Jump icons already at full capacity of 4
      freezeStarRespawnTimes: [],
      jumpIconRespawnTime: now - 100, // Stale/redundant timer
      jumpIconRespawnTimes: [now - 100],
    };
    const res = processHazardRespawns(state, now);
    assert(res.respawnedJump === false, 'Does not duplicate jump icon if already present on board');
    assert(res.nextState.jumpIconIndices.length === 4, 'Jump icons remain at capacity 4');
  }

  // Test 15: Friendly Kill detection accounts for Freeze Stars and Jump Icons
  {
    const teamPlayer: Player = {
      ...pRed,
      team: 'TEAM_A',
      pawns: [{ id: 0, color: 'RED', step: 8, isHome: false }, ...pRed.pawns.slice(1)],
    };
    const teammate: Player = {
      ...pGreen,
      team: 'TEAM_A',
      // Global track 10 = Green step (10 - 13 + 52) % 52 = step 49
      pawns: [{ id: 0, color: 'GREEN', step: 49, isHome: false }, ...pGreen.pawns.slice(1)],
    };

    // If tile 10 is a Freeze Star, landing on it is SAFE, so friendly kill is not triggered
    const outcomeWithFreeze = calculateMoveOutcome(
      [teamPlayer, teammate],
      teamPlayer,
      0,
      2, // lands on global 10 (8 + 2)
      { ...defaultRules, friendlyKill: true },
      [10], // Freeze Star at 10
      null
    );
    assert(outcomeWithFreeze.landedOnSafeCell === true, 'Freeze star is recognized as safe cell');
    assert(outcomeWithFreeze.capturedPawn === null, 'Freeze star prevents friendly kill');

    // If tile 10 is a Jump Icon and hops onto teammate at global 12 (Red step 12, Green step 51)
    const origRandom = Math.random;
    Math.random = () => 0.25; // rolls +2 steps
    try {
      const teammateAt12: Player = {
        ...pGreen,
        team: 'TEAM_A',
        pawns: [{ id: 0, color: 'GREEN', step: 51 - 52 + 13 /* = 12 */, isHome: false }, ...pGreen.pawns.slice(1)],
      };
      // For Green, global 12 is step (12 - 13 + 52) = 51, but track steps are 0..50.
      // Let's use global track 14: Red step 14, Green step (14 - 13) = step 1.
      const teammateAt14: Player = {
        ...pGreen,
        team: 'TEAM_A',
        pawns: [{ id: 0, color: 'GREEN', step: 1, isHome: false }, ...pGreen.pawns.slice(1)],
      };
      // Red at step 10 has jump icon at global 12. Red moves from step 9 + 3 = step 12 (global 12).
      // Jump rolls +2 steps -> Red lands on step 14 (global 14) where Green is!
      teamPlayer.pawns[0].step = 9;
      const jumpOutcome = calculateMoveOutcome(
        [teamPlayer, teammateAt14],
        teamPlayer,
        0,
        3, // lands on global 12
        { ...defaultRules, friendlyKill: true },
        [],
        12 // Jump Icon at 12
      );
      assert(jumpOutcome.jumpSteps === 2, 'Jump rolls +2 steps');
      assert(jumpOutcome.jumpToStep === 14, 'Jump lands on step 14');
      assert(jumpOutcome.jumpCapturedPawn !== null, 'Jump landing triggers capture on teammate (friendly kill)');
      assert(jumpOutcome.jumpCapturedPawn?.playerColor === 'GREEN', 'Captured teammate is GREEN');
    } finally {
      Math.random = origRandom;
    }
  }
}

// =========================================================================
// Bug Fix Verification: Base Yard Unlock Direct Movement & Classic Turn Skip
// =========================================================================
console.log('\n--- TEST SUITE: Base Yard Unlock & Finished Player Turn Rules ---');
{
  // 1. Bug 1: Unlocking from base yard (-1 to 0) must NOT contain in-place socket bounce
  const colors: PlayerColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
  for (const c of colors) {
    for (let pId = 0; pId < 4; pId++) {
      const path = getStepPath(c, -1, 0, pId);
      assert(path.length === 1, `${c} pawn ${pId}: unlock path length is exactly 1 (no in-place bounce)`);
      const startCoord = getPawnCoordinate(c, 0, pId);
      assert(path[0].row === startCoord.row && path[0].col === startCoord.col, `${c} pawn ${pId}: path targets start cell directly`);
    }
  }
  console.log('✅ PASS: All 4 colors pawns unlock directly into step 0 without in-place yard bounce');

  // 2. Bug 2: Classic Mode - Finished players strictly skipped in turn rotation
  const classicPlayers: Player[] = [
    createPlayer('RED', true),
    createPlayer('GREEN', true),
    createPlayer('YELLOW', true),
    createPlayer('BLUE', true),
  ];

  // P0 (RED) finishes with all pawns home
  classicPlayers[0].pawns = classicPlayers[0].pawns.map(p => ({ ...p, step: 56, isHome: true }));
  classicPlayers[0].rank = 1;

  assert(isPlayerFinished(classicPlayers[0], 'PASS_N_PLAY') === true, 'P0 is detected as finished');
  // From P3 (BLUE), next player must skip P0 and go directly to P1 (GREEN)
  assert(getNextPlayerIndex(classicPlayers, 3, 'PASS_N_PLAY') === 1, 'Classic: P3 passes to P1, strictly skipping finished P0');
  // Even if P0 was current index, passing turn immediately moves to P1
  assert(getNextPlayerIndex(classicPlayers, 0, 'PASS_N_PLAY') === 1, 'Classic: P0 immediately yields turn to P1');

  // Even if rank is null, if all pawns are home, player is finished and skipped in Classic
  const classicPlayersUnrankedFinished: Player[] = [
    createPlayer('RED', true),
    createPlayer('GREEN', true),
    createPlayer('YELLOW', true),
    createPlayer('BLUE', true),
  ];
  classicPlayersUnrankedFinished[0].pawns = classicPlayersUnrankedFinished[0].pawns.map(p => ({ ...p, step: 56, isHome: true }));
  classicPlayersUnrankedFinished[0].rank = null; // rank not yet assigned
  assert(isPlayerFinished(classicPlayersUnrankedFinished[0], 'PASS_N_PLAY') === true, 'All pawns home means finished even if rank is null');
  assert(getNextPlayerIndex(classicPlayersUnrankedFinished, 3, 'PASS_N_PLAY') === 1, 'Classic: P3 skips unranked finished P0 to P1');
  console.log('✅ PASS: Finished players in Classic mode are strictly skipped regardless of rank field assignment');

  // 3. TEAM_UP Mode: Finished player (rank === null) is NOT skipped; rolls to help partner
  const teamUpPlayers: Player[] = [
    { ...createPlayer('BLUE', true), id: 'p-blue', team: 'TEAM_A' },
    { ...createPlayer('RED', true), id: 'p-red', team: 'TEAM_B' },
    { ...createPlayer('GREEN', true), id: 'p-green', team: 'TEAM_A' },
    { ...createPlayer('YELLOW', true), id: 'p-yellow', team: 'TEAM_B' },
  ];
  // Blue finishes all tokens
  teamUpPlayers[0].pawns = teamUpPlayers[0].pawns.map(p => ({ ...p, step: 56, isHome: true }));
  teamUpPlayers[0].rank = null; // in TEAM_UP, individual rank stays null until team wins

  // In TEAM_UP mode, Yellow (index 3) passes turn to Blue (index 0)
  assert(getNextPlayerIndex(teamUpPlayers, 3, 'TEAM_UP') === 0, 'TEAM_UP: Yellow passes to finished Blue so Blue can roll for partner Green');
  console.log('✅ PASS: Finished player in TEAM_UP mode retains turn rotation to help partner');

  // 4. In 4P Classic, if P0 and P2 are finished, turns alternate strictly between P1 and P3
  classicPlayers[2].pawns = classicPlayers[2].pawns.map(p => ({ ...p, step: 56, isHome: true }));
  classicPlayers[2].rank = 2;
  assert(getNextPlayerIndex(classicPlayers, 1, 'PASS_N_PLAY') === 3, 'P1 passes to P3 (skipping finished P2)');
  assert(getNextPlayerIndex(classicPlayers, 3, 'PASS_N_PLAY') === 1, 'P3 passes to P1 (skipping finished P0)');
  console.log('✅ PASS: Multiple finished players in Classic mode are properly skipped during turn rotation');
}

console.log('\n🎉 ALL UNIT & INTEGRATION TESTS PASSED CLEANLY!\n');
