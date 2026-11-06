/**
 * BOT AI HEURISTIC DECISION ENGINE (PART 10 & PART 9)
 * Priority:
 * 1. Enemy capture
 * 2. Reach home
 * 3. Leave base (if fewer than 2 tokens out)
 * 4. Land on safe square
 * 5. Escape threat (enemy token 1..6 squares behind on non-safe square)
 * 6. Form protective stack with partner (TEAM_UP)
 * 7. Advance most advanced token
 * Special: Never choose a friendly kill unless it is the only legal move!
 */

import { GameState, LegalMove, TokenState } from './types';
import { getRingIndex, isSafeRingIndex, isTeammate, getTokensOnRingIndex } from './ludoEngine';

/** Count tokens currently active on board track/corridor (1 <= p <= 56) for a seat */
export function countTokensOnTrack(tokens: TokenState[][], seat: number): number {
  return tokens[seat].filter(t => t.progress >= 1 && t.progress <= 56).length;
}

/** Check if a token currently has an enemy 1..6 squares behind it on an unsafe square */
export function isTokenUnderThreat(
  state: GameState,
  tokenSeat: number,
  tokenProgress: number
): boolean {
  if (tokenProgress < 1 || tokenProgress > 51) return false;
  const currentRing = getRingIndex(tokenSeat, tokenProgress, state.cfg);
  if (currentRing === null || isSafeRingIndex(currentRing, state.cfg)) return false;

  // Check 1..6 squares behind
  for (let dist = 1; dist <= 6; dist++) {
    const checkRing = (currentRing - dist + state.cfg.ringSize) % state.cfg.ringSize;
    const tokensOnSquare = getTokensOnRingIndex(state.tokens, checkRing, state.cfg);
    const enemies = tokensOnSquare.filter(t => !isTeammate(tokenSeat, t.seat, state.cfg.mode));
    if (enemies.length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Score a legal move according to the official bot heuristic priority
 */
export function evaluateMoveScore(state: GameState, move: LegalMove): number {
  // CRITICAL RULE: Never a friendly kill unless it is the only legal move!
  if (move.isFriendlyKill) {
    return -100000; // Massive penalty so any non-friendly move beats it
  }

  let score = 0;

  // 1. Enemy Capture (Highest Priority)
  if (move.isEnemyCapture) {
    score += 10000;
  }

  // 2. Reach Home (progress 57)
  if (move.isReachingHome) {
    score += 8000;
  }

  // 3. Leave Base (if fewer than 2 tokens currently out)
  if (move.isEntering) {
    const tokensOut = countTokensOnTrack(state.tokens, move.seat);
    if (tokensOut < 2) {
      score += 6000;
    } else {
      score += 1500;
    }
  }

  // 4. Land on Safe Square (or in private home column)
  if (move.toProgress >= 52 && move.toProgress < 57) {
    score += 4500; // Private home corridor is safe from all enemies
  } else if (move.destRingIndex !== null && isSafeRingIndex(move.destRingIndex, state.cfg)) {
    score += 4000;
  }

  // 5. Escape Threat
  if (move.fromProgress >= 1 && move.fromProgress <= 51) {
    const wasThreatened = isTokenUnderThreat(state, move.seat, move.fromProgress);
    if (wasThreatened) {
      // Bonus if moving escapes or reaches safe square
      const destIsSafe =
        move.toProgress >= 52 ||
        (move.destRingIndex !== null && isSafeRingIndex(move.destRingIndex, state.cfg));
      score += destIsSafe ? 3500 : 2500;
    }
  }

  // 6. Form protective stack with partner in TEAM_UP
  if (state.cfg.mode === 'TEAM_UP' && move.formsStack) {
    score += 2000;
  }

  // 7. Advance most advanced token (higher progress preferred)
  score += move.toProgress * 15;

  return score;
}

/**
 * Pick best move from legal moves using the heuristic evaluator
 */
export function selectBestBotMove(state: GameState, legalMoves: LegalMove[]): LegalMove | null {
  if (legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  let bestMove = legalMoves[0];
  let bestScore = -Infinity;

  for (const move of legalMoves) {
    const score = evaluateMoveScore(state, move);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

