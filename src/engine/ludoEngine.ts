/**
 * PURE DETERMINISTIC LUDO ENGINE (PART 0, 1, 2, 4, 5, 6, 7, 8, 9)
 * Input: (state, action, rng). Output: (newState, events[]).
 * No rendering, no timers, no I/O.
 */

import { LudoConfig, DEFAULT_CFG } from './config';
import { PRNG } from './rng';
import {
  GameState,
  GameAction,
  GameEvent,
  TokenState,
  LegalMove,
  EngineStepResult,
  BonusRollEvent,
} from './types';

// =========================================================================
// COORDINATE & PATH UTILITIES (PART 2)
// =========================================================================

/**
 * Progress p:
 * 0 = in base
 * 1 = own start square
 * 2..51 = outer ring
 * 52..56 = owner's home column
 * 57 = home
 * For 1 <= p <= 51: ringIndex = (seatStartRing[o] + p - 1) mod 52
 */
export function getRingIndex(seat: number, progress: number, cfg: LudoConfig): number | null {
  if (progress < 1 || progress > 51) return null;
  const start = cfg.seatStartRing[seat];
  return (start + progress - 1) % cfg.ringSize;
}

export function isSafeRingIndex(ringIndex: number, cfg: LudoConfig): boolean {
  return cfg.safeRing.includes(ringIndex);
}

export function getPartnerSeat(seat: number): number {
  return (seat + 2) % 4;
}

export function getTeam(seat: number): number {
  return seat % 2; // Team 0 = seats {0, 2}, Team 1 = seats {1, 3}
}

export function isTeammate(seatA: number, seatB: number, mode: LudoConfig['mode']): boolean {
  if (mode === 'CLASSIC') return seatA === seatB;
  return getTeam(seatA) === getTeam(seatB);
}

// =========================================================================
// INITIAL STATE CREATION
// =========================================================================

export function createInitialState(cfg: LudoConfig = DEFAULT_CFG, rng?: PRNG): GameState {
  const tokens: TokenState[][] = [];
  for (let s = 0; s < 4; s++) {
    const seatTokens: TokenState[] = [];
    for (let id = 0; id < cfg.tokensPerSeat; id++) {
      seatTokens.push({
        seat: s,
        id,
        progress: 0,
      });
    }
    tokens.push(seatTokens);
  }

  let activeSeat = 0;
  if (cfg.firstSeat === 'RANDOM') {
    if (rng) {
      activeSeat = rng.range(0, 3);
    } else {
      activeSeat = Math.floor(Math.random() * 4);
    }
  } else if (typeof cfg.firstSeat === 'number') {
    activeSeat = cfg.firstSeat % 4;
  }

  return {
    cfg,
    activeSeat,
    phase: 'WAIT_ROLL',
    diceValue: null,
    sixesInRow: 0,
    tokens,
    legalMoves: [],
    ranks: [null, null, null, null],
    finishedSeats: [],
    winningTeam: null,
    gameOver: false,
    turnCount: 0,
  };
}

// =========================================================================
// STACK & TOKEN POSITION HELPERS
// =========================================================================

/** Return all tokens currently resting on a specific ring index (1..51) */
export function getTokensOnRingIndex(
  tokens: TokenState[][],
  ringIndex: number,
  cfg: LudoConfig
): TokenState[] {
  const result: TokenState[] = [];
  for (let s = 0; s < tokens.length; s++) {
    for (let id = 0; id < tokens[s].length; id++) {
      const tok = tokens[s][id];
      if (tok.progress >= 1 && tok.progress <= 51) {
        if (getRingIndex(tok.seat, tok.progress, cfg) === ringIndex) {
          result.push(tok);
        }
      }
    }
  }
  return result;
}

/** Check if there is an enemy stack on a specific ring index */
export function hasEnemyStackOnRing(
  tokens: TokenState[][],
  ringIndex: number,
  moverSeat: number,
  cfg: LudoConfig
): boolean {
  const onSquare = getTokensOnRingIndex(tokens, ringIndex, cfg);
  const enemyTokens = onSquare.filter(t => !isTeammate(moverSeat, t.seat, cfg.mode));
  if (enemyTokens.length < 2) return false;

  // Stacks form when 2+ tokens belong to same seat, or same team if teamStackForms is true
  if (cfg.mode === 'TEAM_UP' && cfg.teamStackForms) {
    // Check if 2+ belong to same opposing team
    const teamCounts: Record<number, number> = {};
    for (const t of enemyTokens) {
      const team = getTeam(t.seat);
      teamCounts[team] = (teamCounts[team] || 0) + 1;
      if (teamCounts[team] >= 2) return true;
    }
  } else {
    // 2+ belong to exact same seat
    const seatCounts: Record<number, number> = {};
    for (const t of enemyTokens) {
      seatCounts[t.seat] = (seatCounts[t.seat] || 0) + 1;
      if (seatCounts[t.seat] >= 2) return true;
    }
  }
  return false;
}

/** Count tokens that have reached home (progress === 57) for a seat */
export function countHomeTokens(tokens: TokenState[][], seat: number): number {
  return tokens[seat].filter(t => t.progress === 57).length;
}

/** Check if a seat has completed its win tokens requirement */
export function isSeatFinished(state: GameState, seat: number): boolean {
  return countHomeTokens(state.tokens, seat) >= state.cfg.winTokensPerSeat;
}

// =========================================================================
// LEGAL MOVE GENERATION (PART 5)
// =========================================================================

/** Get list of seats controllable by the acting seat (Part 5 & Part 9) */
export function getControllableSeats(state: GameState, actingSeat: number): number[] {
  if (state.cfg.mode === 'CLASSIC') {
    return [actingSeat];
  }

  // TEAM_UP mode
  const partnerSeat = getPartnerSeat(actingSeat);
  if (state.cfg.partnerControl === 'ALWAYS') {
    return [actingSeat, partnerSeat];
  }

  if (state.cfg.partnerControl === 'AFTER_FINISH') {
    if (isSeatFinished(state, actingSeat)) {
      // Finished seat rolls and controls partner's tokens!
      return [partnerSeat];
    }
    return [actingSeat];
  }

  // partnerControl === "NONE"
  return [actingSeat];
}

export function generateLegalMoves(
  state: GameState,
  actingSeat: number,
  roll: number
): LegalMove[] {
  if (state.gameOver) return [];

  const controllableSeats = getControllableSeats(state, actingSeat);
  const moves: LegalMove[] = [];

  for (const seat of controllableSeats) {
    const seatTokens = state.tokens[seat];

    for (const tok of seatTokens) {
      const p = tok.progress;

      // Token already reached home (57)
      if (p >= 57) continue;

      // Base yard (p = 0)
      if (p === 0) {
        if (roll === state.cfg.startRoll) {
          const destRingIndex = state.cfg.seatStartRing[seat];
          const onSquare = getTokensOnRingIndex(state.tokens, destRingIndex, state.cfg);
          const friendlyTokens = onSquare.filter(t => isTeammate(actingSeat, t.seat, state.cfg.mode));
          const enemyTokens = onSquare.filter(t => !isTeammate(actingSeat, t.seat, state.cfg.mode));
          const isEnemyStack = hasEnemyStackOnRing(state.tokens, destRingIndex, actingSeat, state.cfg);

          // If startSquareCapture variant is enabled, enemy stack blocks entering if stackBlocksCapture is true
          if (state.cfg.startSquareCapture && isEnemyStack && state.cfg.stackBlocksCapture) {
            continue;
          }

          // If startSquareCapture variant is enabled, enemy on start square is captured upon entering
          const willCaptureEnemy = Boolean(
            state.cfg.startSquareCapture &&
            enemyTokens.length > 0 &&
            (!isEnemyStack || !state.cfg.stackBlocksCapture)
          );

          moves.push({
            seat,
            tokenId: tok.id,
            fromProgress: 0,
            toProgress: 1,
            destRingIndex,
            isEntering: true,
            isReachingHome: false,
            isFriendlyKill: false,
            isEnemyCapture: willCaptureEnemy,
            formsStack: friendlyTokens.length >= 1,
          });
        }
        continue;
      }

      // Track or Home column (1 <= p <= 56)
      const newP = p + roll;

      // Exact roll to home rule
      if (state.cfg.exactRollToHome && newP > 57) {
        continue;
      }
      if (!state.cfg.exactRollToHome && newP > 57) {
        // If not exact roll, still cannot overshoot 57 in standard Ludo
        continue;
      }

      // Check intermediate squares for enemy stack if stackBlocksPassing is enabled
      if (state.cfg.stackBlocksPassing && p <= 51) {
        let blocked = false;
        const maxCheckStep = Math.min(newP - 1, 51);
        for (let step = p + 1; step <= maxCheckStep; step++) {
          const intermediateRing = getRingIndex(seat, step, state.cfg)!;
          if (hasEnemyStackOnRing(state.tokens, intermediateRing, actingSeat, state.cfg)) {
            blocked = true;
            break;
          }
        }
        if (blocked) continue;
      }

      // Destination is in private home column (52..56) or home (57)
      if (newP >= 52) {
        const formsHomeStack = newP < 57 && seatTokens.some(t => t.id !== tok.id && t.progress === newP);
        moves.push({
          seat,
          tokenId: tok.id,
          fromProgress: p,
          toProgress: newP,
          destRingIndex: null,
          isEntering: false,
          isReachingHome: newP === 57,
          isFriendlyKill: false,
          isEnemyCapture: false,
          formsStack: formsHomeStack,
        });
        continue;
      }

      // Destination is on the outer ring (newP <= 51)
      const destRingIndex = getRingIndex(seat, newP, state.cfg)!;
      const isStartSquareOfMover = destRingIndex === state.cfg.seatStartRing[seat];
      const isSafe = isSafeRingIndex(destRingIndex, state.cfg) && !(state.cfg.startSquareCapture && isStartSquareOfMover);
      const onSquare = getTokensOnRingIndex(state.tokens, destRingIndex, state.cfg);

      if (isSafe) {
        // Safe square: tokens of any colour coexist, no capture
        const friendlyTokens = onSquare.filter(t => isTeammate(actingSeat, t.seat, state.cfg.mode));
        moves.push({
          seat,
          tokenId: tok.id,
          fromProgress: p,
          toProgress: newP,
          destRingIndex,
          isEntering: false,
          isReachingHome: false,
          isFriendlyKill: false,
          isEnemyCapture: false,
          formsStack: friendlyTokens.length >= 1,
        });
        continue;
      }

      // Non-safe square
      const enemyTokens = onSquare.filter(t => !isTeammate(actingSeat, t.seat, state.cfg.mode));
      const friendlyTokens = onSquare.filter(t => isTeammate(actingSeat, t.seat, state.cfg.mode));

      // Case 1: Enemy tokens present
      if (enemyTokens.length > 0) {
        const isEnemyStack = hasEnemyStackOnRing(state.tokens, destRingIndex, actingSeat, state.cfg);
        if (isEnemyStack && state.cfg.stackBlocksCapture) {
          // Blocked by enemy stack
          continue;
        }

        moves.push({
          seat,
          tokenId: tok.id,
          fromProgress: p,
          toProgress: newP,
          destRingIndex,
          isEntering: false,
          isReachingHome: false,
          isFriendlyKill: false,
          isEnemyCapture: true,
          formsStack: false,
        });
        continue;
      }

      // Case 2: Only friendly tokens or empty
      if (friendlyTokens.length > 0) {
        // Apply friendlyKill rules
        if (state.cfg.friendlyKill === 'OFF') {
          // Stacks with friendly tokens
          moves.push({
            seat,
            tokenId: tok.id,
            fromProgress: p,
            toProgress: newP,
            destRingIndex,
            isEntering: false,
            isReachingHome: false,
            isFriendlyKill: false,
            isEnemyCapture: false,
            formsStack: true,
          });
          continue;
        }

        if (state.cfg.friendlyKill === 'PARTNER') {
          if (state.cfg.mode === 'TEAM_UP') {
            const hasPartner = friendlyTokens.some(t => t.seat !== seat);
            const hasOwn = friendlyTokens.some(t => t.seat === seat);

            if (hasPartner && !hasOwn) {
              // Partner tokens captured!
              moves.push({
                seat,
                tokenId: tok.id,
                fromProgress: p,
                toProgress: newP,
                destRingIndex,
                isEntering: false,
                isReachingHome: false,
                isFriendlyKill: true,
                isEnemyCapture: false,
                formsStack: false,
              });
              continue;
            }
          }
          // Own tokens stack
          moves.push({
            seat,
            tokenId: tok.id,
            fromProgress: p,
            toProgress: newP,
            destRingIndex,
            isEntering: false,
            isReachingHome: false,
            isFriendlyKill: false,
            isEnemyCapture: false,
            formsStack: true,
          });
          continue;
        }

        if (state.cfg.friendlyKill === 'ALL') {
          // Landing on any token captures it (cannot stack on non-safe square)
          moves.push({
            seat,
            tokenId: tok.id,
            fromProgress: p,
            toProgress: newP,
            destRingIndex,
            isEntering: false,
            isReachingHome: false,
            isFriendlyKill: true,
            isEnemyCapture: false,
            formsStack: false,
          });
          continue;
        }
      }

      // Empty square
      moves.push({
        seat,
        tokenId: tok.id,
        fromProgress: p,
        toProgress: newP,
        destRingIndex,
        isEntering: false,
        isReachingHome: false,
        isFriendlyKill: false,
        isEnemyCapture: false,
        formsStack: false,
      });
    }
  }

  return moves;
}

// =========================================================================
// TURN ADVANCEMENT (NEXT_SEAT)
// =========================================================================

export function getNextSeat(state: GameState, currentSeat: number): number {
  if (state.cfg.mode === 'CLASSIC') {
    // Skip finished seats
    for (let i = 1; i <= 4; i++) {
      const next = (currentSeat + i) % 4;
      if (!isSeatFinished(state, next)) {
        return next;
      }
    }
    return currentSeat;
  }

  // TEAM_UP mode
  if (state.cfg.partnerControl === 'NONE') {
    // Finished seats are skipped
    for (let i = 1; i <= 4; i++) {
      const next = (currentSeat + i) % 4;
      if (!isSeatFinished(state, next)) {
        return next;
      }
    }
    return currentSeat;
  }

  // In AFTER_FINISH (default) or ALWAYS:
  // Finished seats still take turns to roll for partner!
  // Unless team has already won
  return (currentSeat + 1) % 4;
}

// =========================================================================
// STEP REDUCER: (state, action, rng) => (newState, events[]) (PART 0)
// =========================================================================

export function step(
  state: GameState,
  action: GameAction,
  rng: PRNG
): EngineStepResult {
  if (state.gameOver) {
    return { state, events: [] };
  }

  const events: GameEvent[] = [];

  // -----------------------------------------------------------------------
  // ACTION: ROLL_DICE
  // -----------------------------------------------------------------------
  if (action.type === 'ROLL_DICE') {
    if (state.phase !== 'WAIT_ROLL') {
      return { state, events };
    }

    const roll = action.forceRoll !== undefined ? action.forceRoll : rng.d6();
    const actingSeat = state.activeSeat;

    let sixesInRow = roll === 6 ? state.sixesInRow + 1 : 0;

    events.push({
      type: 'DICE_ROLLED',
      seat: actingSeat,
      roll,
      sixesInRow,
    });

    // Check consecutive 6s forfeit penalty (Part 7)
    if (sixesInRow === state.cfg.maxConsecutiveSixes && state.cfg.threeSixPenalty === 'FORFEIT_TURN') {
      events.push({
        type: 'THREE_SIX_FORFEIT',
        seat: actingSeat,
      });

      const nextSeat = getNextSeat(state, actingSeat);
      events.push({
        type: 'TURN_PASSED',
        fromSeat: actingSeat,
        toSeat: nextSeat,
        reason: 'THREE_SIX_FORFEIT',
      });

      return {
        state: {
          ...state,
          diceValue: roll,
          sixesInRow: 0,
          activeSeat: nextSeat,
          phase: 'WAIT_ROLL',
          legalMoves: [],
        },
        events,
      };
    }

    // Generate legal moves with this roll
    const legalMoves = generateLegalMoves(state, actingSeat, roll);

    // Case A: 0 legal moves
    if (legalMoves.length === 0) {
      if (roll === 6 && state.cfg.bonusOn.six) {
        // "A 6 grants the extra roll even when no legal move existed" (Part 7)
        events.push({
          type: 'BONUS_ROLL',
          seat: actingSeat,
          reason: 'SIX',
        });

        return {
          state: {
            ...state,
            diceValue: roll,
            sixesInRow,
            phase: 'WAIT_ROLL',
            legalMoves: [],
          },
          events,
        };
      } else {
        // Turn passes to next seat
        const nextSeat = getNextSeat(state, actingSeat);
        events.push({
          type: 'TURN_PASSED',
          fromSeat: actingSeat,
          toSeat: nextSeat,
          reason: 'NO_LEGAL_MOVES',
        });

        return {
          state: {
            ...state,
            diceValue: roll,
            sixesInRow: 0,
            activeSeat: nextSeat,
            phase: 'WAIT_ROLL',
            legalMoves: [],
          },
          events,
        };
      }
    }

    // Case B: 1+ legal moves
    return {
      state: {
        ...state,
        diceValue: roll,
        sixesInRow,
        phase: 'WAIT_SELECT',
        legalMoves,
      },
      events,
    };
  }

  // -----------------------------------------------------------------------
  // ACTION: SELECT_TOKEN
  // -----------------------------------------------------------------------
  if (action.type === 'SELECT_TOKEN') {
    if (state.phase !== 'WAIT_SELECT') {
      return { state, events };
    }

    // Find matching legal move
    const move = state.legalMoves.find(
      m => m.seat === action.seat && m.tokenId === action.tokenId
    );

    if (!move) {
      // Illegal move attempt, state unchanged
      return { state, events };
    }

    const actingSeat = state.activeSeat;
    const targetToken = state.tokens[move.seat][move.tokenId];
    const fromP = targetToken.progress;
    const toP = move.toProgress;

    // Deep clone tokens to apply update immutably
    const nextTokens: TokenState[][] = state.tokens.map(seatArr =>
      seatArr.map(t => ({ ...t }))
    );

    // 1. Emit Movement Events (Part 0 & 11)
    if (fromP === 0 && toP === 1) {
      const ringIdx = state.cfg.seatStartRing[move.seat];
      events.push({
        type: 'TOKEN_ENTERED',
        seat: move.seat,
        tokenId: move.tokenId,
        fromProgress: 0,
        toProgress: 1,
        ringIndex: ringIdx,
      });
      nextTokens[move.seat][move.tokenId].progress = 1;
    } else {
      // Emit single hop step events for animation fidelity
      for (let s = fromP; s < toP; s++) {
        const nextStep = s + 1;
        const ringIdx = nextStep <= 51 ? getRingIndex(move.seat, nextStep, state.cfg) : null;
        events.push({
          type: 'TOKEN_STEP',
          seat: move.seat,
          tokenId: move.tokenId,
          fromProgress: s,
          toProgress: nextStep,
          ringIndex: ringIdx,
          isHomeColumn: nextStep >= 52,
        });
      }
      nextTokens[move.seat][move.tokenId].progress = toP;
    }

    // 2. Resolve Landing Outcome (Capture / Stack / Home)
    let enemyCaptured = false;
    let friendlyCaptured = false;
    let tokenReachedHome = false;

    if (toP === 57) {
      tokenReachedHome = true;
      const totalHome = nextTokens[move.seat].filter(t => t.progress === 57).length;
      events.push({
        type: 'TOKEN_HOME',
        seat: move.seat,
        tokenId: move.tokenId,
        totalHomeForSeat: totalHome,
      });
    } else if (toP <= 51) {
      const destRing = getRingIndex(move.seat, toP, state.cfg)!;
      const isStartSquareOfMover = destRing === state.cfg.seatStartRing[move.seat];
      const isSafe = isSafeRingIndex(destRing, state.cfg) && !(state.cfg.startSquareCapture && isStartSquareOfMover);

      if (!isSafe) {
        // Check enemy captures
        for (let s = 0; s < 4; s++) {
          if (!isTeammate(actingSeat, s, state.cfg.mode)) {
            for (let id = 0; id < nextTokens[s].length; id++) {
              const opp = nextTokens[s][id];
              if (opp.progress >= 1 && opp.progress <= 51) {
                if (getRingIndex(opp.seat, opp.progress, state.cfg) === destRing) {
                  // Capture enemy token
                  opp.progress = 0;
                  enemyCaptured = true;
                  events.push({
                    type: 'ENEMY_CAPTURED',
                    capturerSeat: move.seat,
                    capturerTokenId: move.tokenId,
                    victimSeat: opp.seat,
                    victimTokenId: opp.id,
                    ringIndex: destRing,
                  });
                }
              }
            }
          }
        }

        // Check friendly capture (if friendlyKill is PARTNER or ALL)
        if (move.isFriendlyKill) {
          for (let s = 0; s < 4; s++) {
            if (isTeammate(actingSeat, s, state.cfg.mode)) {
              for (let id = 0; id < nextTokens[s].length; id++) {
                // Do not capture the moving token itself!
                if (s === move.seat && id === move.tokenId) continue;
                const fr = nextTokens[s][id];
                if (fr.progress >= 1 && fr.progress <= 51) {
                  if (getRingIndex(fr.seat, fr.progress, state.cfg) === destRing) {
                    fr.progress = 0;
                    friendlyCaptured = true;
                    events.push({
                      type: 'FRIENDLY_CAPTURED',
                      capturerSeat: move.seat,
                      capturerTokenId: move.tokenId,
                      victimSeat: fr.seat,
                      victimTokenId: fr.id,
                      ringIndex: destRing,
                    });
                  }
                }
              }
            }
          }
        }
      }

      // Check Stack Formation
      const onSquare = getTokensOnRingIndex(nextTokens, destRing, state.cfg);
      const friendlyOnSquare = onSquare.filter(t => isTeammate(actingSeat, t.seat, state.cfg.mode));
      if (friendlyOnSquare.length >= 2) {
        const isProtected = isSafe || (state.cfg.stackBlocksCapture && (state.cfg.friendlyKill === 'OFF' || state.cfg.friendlyKill === 'PARTNER'));
        events.push({
          type: 'STACK_FORMED',
          seat: move.seat,
          tokenId: move.tokenId,
          ringIndex: destRing,
          isHomeColumn: false,
          tokensOnSquare: friendlyOnSquare.map(t => ({ seat: t.seat, tokenId: t.id })),
          isProtected,
        });
      }
    } else {
      // In private home column (52..56)
      const homeColTokens = nextTokens[move.seat].filter(t => t.progress === toP);
      if (homeColTokens.length >= 2) {
        events.push({
          type: 'STACK_FORMED',
          seat: move.seat,
          tokenId: move.tokenId,
          ringIndex: null,
          isHomeColumn: true,
          tokensOnSquare: homeColTokens.map(t => ({ seat: t.seat, tokenId: t.id })),
          isProtected: true,
        });
      }
    }

    // 3. Check Finish & Ranking Conditions (Part 8 & 9)
    let nextRanks = [...state.ranks];
    let nextFinishedSeats = [...state.finishedSeats];
    let gameOver = false;
    let winningTeam: number | null = null;

    const seatFinishedNow =
      countHomeTokens(nextTokens, move.seat) >= state.cfg.winTokensPerSeat &&
      !nextFinishedSeats.includes(move.seat);

    if (seatFinishedNow) {
      nextFinishedSeats.push(move.seat);
      const currentRank = nextFinishedSeats.length; // 1st, 2nd, 3rd
      nextRanks[move.seat] = currentRank;

      events.push({
        type: 'SEAT_FINISHED',
        seat: move.seat,
        rank: currentRank,
      });

      if (state.cfg.mode === 'CLASSIC') {
        if (state.cfg.classicEnd === 'FIRST_WINNER') {
          gameOver = true;
        } else if (state.cfg.classicEnd === 'UNTIL_ALL_RANKED') {
          if (nextFinishedSeats.length === 3) {
            // Assign 4th rank to last remaining seat
            for (let s = 0; s < 4; s++) {
              if (nextRanks[s] === null) {
                nextRanks[s] = 4;
                nextFinishedSeats.push(s);
                events.push({
                  type: 'SEAT_FINISHED',
                  seat: s,
                  rank: 4,
                });
                break;
              }
            }
            gameOver = true;
          }
        }
      }
    }

    // Check TEAM_UP victory condition
    if (state.cfg.mode === 'TEAM_UP') {
      const isTeamAllHome = (team: number): boolean => {
        const s1 = team === 0 ? 0 : 1;
        const s2 = team === 0 ? 2 : 3;
        return (
          countHomeTokens(nextTokens, s1) >= state.cfg.winTokensPerSeat &&
          countHomeTokens(nextTokens, s2) >= state.cfg.winTokensPerSeat
        );
      };

      const isTeamEitherHome = (team: number): boolean => {
        const s1 = team === 0 ? 0 : 1;
        const s2 = team === 0 ? 2 : 3;
        return (
          countHomeTokens(nextTokens, s1) >= state.cfg.winTokensPerSeat ||
          countHomeTokens(nextTokens, s2) >= state.cfg.winTokensPerSeat
        );
      };

      let t0Won = false;
      let t1Won = false;

      if (state.cfg.teamWin === 'ALL_EIGHT_HOME') {
        t0Won = isTeamAllHome(0);
        t1Won = isTeamAllHome(1);
      } else {
        // EITHER_SEAT_ALL_HOME
        t0Won = isTeamEitherHome(0);
        t1Won = isTeamEitherHome(1);
      }

      if (t0Won || t1Won) {
        gameOver = true;
        winningTeam = t0Won ? 0 : 1;
        const seats = winningTeam === 0 ? [0, 2] : [1, 3];
        events.push({
          type: 'TEAM_WON',
          winningTeam,
          seats,
        });
      }
    }

    if (gameOver) {
      events.push({
        type: 'GAME_OVER',
        ranks: nextRanks,
        winningTeam,
      });

      return {
        state: {
          ...state,
          tokens: nextTokens,
          ranks: nextRanks,
          finishedSeats: nextFinishedSeats,
          winningTeam,
          gameOver: true,
          phase: 'GAME_OVER',
          legalMoves: [],
        },
        events,
      };
    }

    // 4. Bonus Roll Evaluation (Part 7)
    // "A move earns ONE extra roll if the roll was a 6, OR it captured an enemy,
    // OR a token reached home (bonusRollsAccumulate = false, so a 6 that also
    // captures gives one extra roll, not two)."
    // "No bonus when the token that just reached home ends the game, or (CLASSIC) when
    // it completes that seat's last token."
    let earnsBonus = false;
    let bonusReason: BonusRollEvent['reason'] = 'SIX';

    // In CLASSIC mode, once a seat completes all its win tokens, it is ranked and cannot earn an extra roll
    const seatCanEarnBonus = !(state.cfg.mode === 'CLASSIC' && seatFinishedNow);

    const rollWasSix = seatCanEarnBonus && state.diceValue === 6 && state.cfg.bonusOn.six;
    const captureBonus = seatCanEarnBonus && enemyCaptured && state.cfg.bonusOn.enemyCapture;
    const friendlyCaptureBonus = seatCanEarnBonus && friendlyCaptured && state.cfg.friendlyKillGivesBonus;
    const homeBonus =
      seatCanEarnBonus &&
      tokenReachedHome &&
      state.cfg.bonusOn.tokenHome;

    if (rollWasSix) {
      earnsBonus = true;
      bonusReason = 'SIX';
    } else if (captureBonus) {
      earnsBonus = true;
      bonusReason = 'ENEMY_CAPTURE';
    } else if (friendlyCaptureBonus) {
      earnsBonus = true;
      bonusReason = 'FRIENDLY_CAPTURE';
    } else if (homeBonus) {
      earnsBonus = true;
      bonusReason = 'TOKEN_HOME';
    }

    if (earnsBonus) {
      events.push({
        type: 'BONUS_ROLL',
        seat: actingSeat,
        reason: bonusReason,
      });

      return {
        state: {
          ...state,
          tokens: nextTokens,
          ranks: nextRanks,
          finishedSeats: nextFinishedSeats,
          phase: 'WAIT_ROLL',
          legalMoves: [],
          turnCount: state.turnCount + 1,
        },
        events,
      };
    }

    // No bonus roll -> Turn Passes to next seat
    const nextSeat = getNextSeat(
      { ...state, tokens: nextTokens, ranks: nextRanks, finishedSeats: nextFinishedSeats },
      actingSeat
    );

    events.push({
      type: 'TURN_PASSED',
      fromSeat: actingSeat,
      toSeat: nextSeat,
      reason: 'NORMAL',
    });

    return {
      state: {
        ...state,
        tokens: nextTokens,
        ranks: nextRanks,
        finishedSeats: nextFinishedSeats,
        activeSeat: nextSeat,
        sixesInRow: 0,
        phase: 'WAIT_ROLL',
        legalMoves: [],
        turnCount: state.turnCount + 1,
      },
      events,
    };
  }

  return { state, events };
}
