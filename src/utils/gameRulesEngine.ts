import { Player, Pawn, GameRules, PlayerColor, GameMode } from '../types/ludo';
import { stepToGlobalIndex, isSafeGlobalCell } from './boardCoordinates';

export interface MoveOutcome {
  pawnId: number;
  fromStep: number;
  toStep: number;
  reachedHome: boolean;
  capturedPawn: {
    playerColor: PlayerColor;
    pawnId: number;
    step: number;
  } | null;
  landedOnSafeCell: boolean;
  bonusRoll: boolean;
  bonusReason: 'ROLL_SIX' | 'CAPTURE' | 'HOME_REACH' | null;
  landedOnFreezeStar?: boolean;
  usedFreezeStarIndex?: number | null;
  usedJumpIconIndex?: number | null;
  jumpSteps?: number;
  jumpToStep?: number;
  jumpCapturedPawn?: {
    playerColor: PlayerColor;
    pawnId: number;
    step: number;
  } | null;
}

// Helper to create pawns with support for One Token Out rule
export function createPawns(color: PlayerColor, oneTokenOut: boolean = false): Pawn[] {
  return [
    { id: 0, color, step: oneTokenOut ? 0 : -1, isHome: false },
    { id: 1, color, step: -1, isHome: false },
    { id: 2, color, step: -1, isHome: false },
    { id: 3, color, step: -1, isHome: false },
  ];
}

// Check if an individual pawn can legally move with the given roll
export function canPawnMove(
  player: Player,
  pawn: Pawn,
  roll: number,
  rules: GameRules
): boolean {
  if (pawn.isHome || pawn.step >= 56) {
    return false;
  }

  // Rule 1: Frozen pawns cannot move until thawed
  if (pawn.isFrozen || (pawn.frozenTurnsLeft !== undefined && pawn.frozenTurnsLeft > 0)) {
    return false;
  }

  // Case 1: Pawn is in base yard
  if (pawn.step === -1) {
    if (rules.openOnSixOnly) {
      return roll === 6;
    } else {
      return roll === 6 || roll === 1;
    }
  }

  // Case 2: Pawn is on track or in home corridor
  // Rule: In Quick Mode (mustCaptureToEnterHome = true), token CANNOT enter home corridor without a capture.
  // Instead, it continues circling the main outer track indefinitely (all rolls 1..6 are valid).
  if (rules.mustCaptureToEnterHome && !player.hasCaptured) {
    return true;
  }

  const targetStep = pawn.step + roll;

  // Exact roll required to reach home center (step 56)
  if (targetStep > 56) {
    return false;
  }

  return true;
}

// Return list of all legal movable pawns for current player
export function getLegalPawns(
  player: Player,
  roll: number,
  rules: GameRules
): Pawn[] {
  return player.pawns.filter(p => canPawnMove(player, p, roll, rules));
}

// Calculate the full outcome of moving a pawn
export function calculateMoveOutcome(
  players: Player[],
  activePlayer: Player,
  pawnId: number,
  roll: number,
  rules: GameRules,
  freezeStarIndices: number[] = [],
  jumpIconIndex: number | null | number[] = null
): MoveOutcome {
  const pawn = activePlayer.pawns[pawnId];
  const fromStep = pawn.step;
  const mustCircleTrack = Boolean(rules.mustCaptureToEnterHome && !activePlayer.hasCaptured);

  const toStep = fromStep === -1 ? 0 : (mustCircleTrack ? (fromStep + roll) % 52 : fromStep + roll);
  const reachedHome = !mustCircleTrack && toStep === 56;

  let capturedPawn: MoveOutcome['capturedPawn'] = null;
  let landedOnSafeCell = false;
  let landedOnFreezeStar = false;
  let usedFreezeStarIndex: number | null = null;
  let usedJumpIconIndex: number | null = null;
  let jumpSteps: number | undefined;
  let jumpToStep: number | undefined;
  let jumpCapturedPawn: MoveOutcome['capturedPawn'] = null;

  // Check captures if landing on global track
  const isOnTrack = !reachedHome && toStep >= 0 && (mustCircleTrack ? toStep <= 51 : toStep <= 50);
  if (isOnTrack) {
    const landingGlobalIdx = stepToGlobalIndex(activePlayer.color, toStep)!;
    
    // Freeze Star check: sets landedOnFreezeStar flag and registers consumed index
    const isStandardSafe = isSafeGlobalCell(landingGlobalIdx, rules.safeZoneMode);
    const isFreezeStar = Boolean(freezeStarIndices && freezeStarIndices.includes(landingGlobalIdx));

    if (isFreezeStar) {
      landedOnFreezeStar = true;
      usedFreezeStarIndex = landingGlobalIdx;
      landedOnSafeCell = true;
    } else {
      landedOnSafeCell = isStandardSafe;
    }

    // Check captures:
    // 1. If opponent pawn is FROZEN (isFrozen === true), it is vulnerable and gets captured!
    // 2. If the cell is NOT a safe cell (standard safe or freeze star), any opponent pawn gets captured.
    for (const opponent of players) {
      if (opponent.color === activePlayer.color || opponent.rank !== null) continue;

      // In TEAM_UP mode, check Friendly Kill rule
      const isTeammate = Boolean(
        activePlayer.team &&
        opponent.team &&
        activePlayer.team === opponent.team
      );

      // If teammates and friendlyKill is explicitly false, cannot capture teammate
      if (isTeammate && rules.friendlyKill === false) {
        continue;
      }

      for (const oppPawn of opponent.pawns) {
        const oppOnTrack = oppPawn.step >= 0 && (oppPawn.step <= 50 || (oppPawn.step === 51 && !oppPawn.inHomeCorridor)) && !oppPawn.isHome;
        if (oppOnTrack) {
          const oppGlobalIdx = stepToGlobalIndex(opponent.color, oppPawn.step);
          if (oppGlobalIdx === landingGlobalIdx) {
            // Opponent pawn is captured if:
            // - The pawn is FROZEN (isFrozen === true), OR
            // - The tile is NOT a safe zone
            const isProtected = isStandardSafe || (isFreezeStar && !oppPawn.isFrozen);
            if (!isProtected || oppPawn.isFrozen) {
              capturedPawn = {
                playerColor: opponent.color,
                pawnId: oppPawn.id,
                step: oppPawn.step,
              };
              landedOnSafeCell = false;
              break;
            }
          }
        }
      }
      if (capturedPawn) break;
    }

    // Rule 2: Jump Icon check (triggers random 1-5 step jump forward, or backward for dual-power icons)
    const isJumpLanding = Array.isArray(jumpIconIndex)
      ? jumpIconIndex.includes(landingGlobalIdx)
      : (jumpIconIndex !== null && jumpIconIndex !== undefined && landingGlobalIdx === jumpIconIndex);

    if (isJumpLanding) {
      usedJumpIconIndex = landingGlobalIdx;
      // 2 of the 4 jump icons have the backward power along with forward
      const isDualDirection = Array.isArray(jumpIconIndex)
        ? (jumpIconIndex.indexOf(landingGlobalIdx) >= 0 && jumpIconIndex.indexOf(landingGlobalIdx) < 2)
        : false;

      const k = Math.floor(Math.random() * 5) + 1; // 1..5
      const isBackward = isDualDirection && (Math.random() < 0.5);
      jumpSteps = isBackward ? -k : k;
      let targetJump: number;
      if (mustCircleTrack) {
        targetJump = (toStep + jumpSteps + 52) % 52;
      } else {
        targetJump = toStep + jumpSteps;
        if (targetJump < 0) targetJump = 0;
        if (targetJump > 56) targetJump = 56;
      }
      jumpToStep = targetJump;

      // Check secondary landing effects after jump
      const isJumpOnTrack = jumpToStep >= 0 && (mustCircleTrack ? jumpToStep <= 51 : jumpToStep <= 50);
      if (isJumpOnTrack) {
        const jumpLandingGlobalIdx = stepToGlobalIndex(activePlayer.color, jumpToStep)!;
        const jumpOnFreeze = Boolean(freezeStarIndices && freezeStarIndices.includes(jumpLandingGlobalIdx));
        const jumpStandardSafe = isSafeGlobalCell(jumpLandingGlobalIdx, rules.safeZoneMode);

        if (jumpOnFreeze) {
          landedOnFreezeStar = true;
          usedFreezeStarIndex = jumpLandingGlobalIdx;
        }

        for (const opponent of players) {
          if (opponent.color === activePlayer.color || opponent.rank !== null) continue;
          const isTeammate = Boolean(activePlayer.team && opponent.team && activePlayer.team === opponent.team);
          if (isTeammate && rules.friendlyKill === false) continue;

          for (const oppPawn of opponent.pawns) {
            const oppOnTrack = oppPawn.step >= 0 && (oppPawn.step <= 50 || (oppPawn.step === 51 && !oppPawn.inHomeCorridor)) && !oppPawn.isHome;
            if (oppOnTrack) {
              const oppGlobalIdx = stepToGlobalIndex(opponent.color, oppPawn.step);
              if (oppGlobalIdx === jumpLandingGlobalIdx) {
                if (!jumpStandardSafe || oppPawn.isFrozen) {
                  jumpCapturedPawn = {
                    playerColor: opponent.color,
                    pawnId: oppPawn.id,
                    step: oppPawn.step,
                  };
                  break;
                }
              }
            }
          }
          if (jumpCapturedPawn) break;
        }
      }
    }
  }

  // Determine bonus roll rewards
  let bonusRoll = false;
  let bonusReason: MoveOutcome['bonusReason'] = null;

  const totalCaptured = capturedPawn || jumpCapturedPawn;
  const isFinalHome = reachedHome || jumpToStep === 56;

  if (totalCaptured && rules.bonusOnCapture) {
    bonusRoll = true;
    bonusReason = 'CAPTURE';
  } else if (isFinalHome && rules.bonusOnHomeReach) {
    bonusRoll = true;
    bonusReason = 'HOME_REACH';
  } else if (roll === 6) {
    bonusRoll = true;
    bonusReason = 'ROLL_SIX';
  }

  return {
    pawnId,
    fromStep,
    toStep,
    reachedHome,
    capturedPawn,
    landedOnSafeCell,
    bonusRoll,
    bonusReason,
    landedOnFreezeStar,
    usedFreezeStarIndex,
    usedJumpIconIndex,
    jumpSteps,
    jumpToStep,
    jumpCapturedPawn,
  };
}

// Check if a player has completed all their required tokens into home or assigned rank
export function isPlayerFinished(player: Player, mode?: GameMode): boolean {
  if (player.rank !== null) return true;
  if (!player.pawns || player.pawns.length === 0) return false;
  const tokensNeeded = mode === 'QUICK_MODE' ? 1 : 4;
  const finishedCount = player.pawns.filter(p => p.isHome || p.step >= 56).length;
  return finishedCount >= tokensNeeded;
}

// Get next eligible active player clockwise
// In Classic and other non-team modes: strictly skip any finished player!
// In TEAM_UP mode: players continue rolling dice to assist their partner until the team wins
export function getNextPlayerIndex(players: Player[], currentIndex: number, gameMode?: GameMode): number {
  const total = players.length;
  for (let i = 1; i <= total; i++) {
    const nextIdx = (currentIndex + i) % total;
    const candidate = players[nextIdx];
    if (!candidate || !candidate.isActive) continue;

    if (gameMode === 'TEAM_UP') {
      if (candidate.rank === null) {
        return nextIdx;
      }
    } else {
      if (!isPlayerFinished(candidate, gameMode)) {
        return nextIdx;
      }
    }
  }
  return currentIndex;
}

// Check how many players remain active and unfinished
export function countActiveRemainingPlayers(players: Player[], mode?: GameMode): number {
  return players.filter(p => p.isActive && !isPlayerFinished(p, mode)).length;
}

// Check winner for TEAM_UP (2v2) mode
export function checkTeamUpWinner(players: Player[]): 'TEAM_A' | 'TEAM_B' | null {
  const teamAPlayers = players.filter(p => p.team === 'TEAM_A');
  const teamBPlayers = players.filter(p => p.team === 'TEAM_B');

  if (teamAPlayers.length > 0 && teamAPlayers.every(p => p.pawns.every(pawn => pawn.isHome))) {
    return 'TEAM_A';
  }
  if (teamBPlayers.length > 0 && teamBPlayers.every(p => p.pawns.every(pawn => pawn.isHome))) {
    return 'TEAM_B';
  }
  return null;
}

