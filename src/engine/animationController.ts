/**
 * ANIMATION CONTROLLER (PART 0 & PART 11)
 * Consumes the event log emitted by the pure game logic in strict chronological order.
 * Decoupled from logic: logic never waits on rendering.
 */

import { GameEvent } from './types';
import { TimingConfig } from './config';

export interface AnimationCallbacks {
  onDiceRollStart?: (seat: number) => void;
  onDiceRollSettle?: (seat: number, roll: number) => void;
  onTokenEntered?: (seat: number, tokenId: number, ringIndex: number) => void;
  onTokenStep?: (
    seat: number,
    tokenId: number,
    fromP: number,
    toP: number,
    ringIndex: number | null,
    isHomeCol: boolean
  ) => void;
  onStackFormed?: (seat: number, tokenId: number, isProtected: boolean) => void;
  onEnemyCaptured?: (
    capturerSeat: number,
    victimSeat: number,
    victimTokenId: number,
    ringIndex: number
  ) => void;
  onFriendlyCaptured?: (
    capturerSeat: number,
    victimSeat: number,
    victimTokenId: number,
    ringIndex: number
  ) => void;
  onTokenHome?: (seat: number, tokenId: number) => void;
  onThreeSixForfeit?: (seat: number) => void;
  onTurnPassed?: (fromSeat: number, toSeat: number, reason: string) => void;
  onBonusRoll?: (seat: number, reason: string) => void;
  onSeatFinished?: (seat: number, rank: number | null) => void;
  onTeamWon?: (winningTeam: number, seats: number[]) => void;
  onGameOver?: (ranks: (number | null)[], winningTeam: number | null) => void;
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export class AnimationController {
  private timing: TimingConfig;
  private isPlaying = false;

  constructor(timing: TimingConfig) {
    this.timing = timing;
  }

  public setTiming(timing: TimingConfig) {
    this.timing = timing;
  }

  /**
   * Play an event log in chronological sequence with authentic timings
   */
  public async playEvents(
    events: GameEvent[],
    callbacks: AnimationCallbacks = {},
    speedMultiplier = 1.0
  ): Promise<void> {
    if (events.length === 0) return;
    this.isPlaying = true;

    const scale = (ms: number) => Math.max(0, ms * speedMultiplier);

    for (const evt of events) {
      if (!this.isPlaying) break;

      switch (evt.type) {
        case 'DICE_ROLLED': {
          callbacks.onDiceRollStart?.(evt.seat);
          await sleep(scale(this.timing.diceRoll));
          callbacks.onDiceRollSettle?.(evt.seat, evt.roll);
          await sleep(scale(this.timing.diceResultHold));
          break;
        }

        case 'TOKEN_ENTERED': {
          callbacks.onTokenEntered?.(evt.seat, evt.tokenId, evt.ringIndex);
          await sleep(scale(this.timing.baseToStart));
          break;
        }

        case 'TOKEN_STEP': {
          callbacks.onTokenStep?.(
            evt.seat,
            evt.tokenId,
            evt.fromProgress,
            evt.toProgress,
            evt.ringIndex,
            evt.isHomeColumn
          );
          await sleep(scale(this.timing.tokenStepHop));
          break;
        }

        case 'ENEMY_CAPTURED': {
          callbacks.onEnemyCaptured?.(
            evt.capturerSeat,
            evt.victimSeat,
            evt.victimTokenId,
            evt.ringIndex
          );
          await sleep(scale(this.timing.captureReturn));
          break;
        }

        case 'FRIENDLY_CAPTURED': {
          callbacks.onFriendlyCaptured?.(
            evt.capturerSeat,
            evt.victimSeat,
            evt.victimTokenId,
            evt.ringIndex
          );
          await sleep(scale(this.timing.captureReturn));
          break;
        }

        case 'STACK_FORMED': {
          callbacks.onStackFormed?.(evt.seat, evt.tokenId, evt.isProtected);
          await sleep(scale(80)); // Short snap animation
          break;
        }

        case 'TOKEN_HOME': {
          callbacks.onTokenHome?.(evt.seat, evt.tokenId);
          await sleep(scale(this.timing.homeEntry));
          break;
        }

        case 'THREE_SIX_FORFEIT': {
          callbacks.onThreeSixForfeit?.(evt.seat);
          await sleep(scale(500));
          break;
        }

        case 'BONUS_ROLL': {
          callbacks.onBonusRoll?.(evt.seat, evt.reason);
          await sleep(scale(200));
          break;
        }

        case 'TURN_PASSED': {
          callbacks.onTurnPassed?.(evt.fromSeat, evt.toSeat, evt.reason);
          await sleep(scale(this.timing.turnSwitchDelay));
          break;
        }

        case 'SEAT_FINISHED': {
          callbacks.onSeatFinished?.(evt.seat, evt.rank);
          await sleep(scale(300));
          break;
        }

        case 'TEAM_WON': {
          callbacks.onTeamWon?.(evt.winningTeam, evt.seats);
          await sleep(scale(500));
          break;
        }

        case 'GAME_OVER': {
          callbacks.onGameOver?.(evt.ranks, evt.winningTeam);
          break;
        }
      }
    }

    this.isPlaying = false;
  }

  public stop() {
    this.isPlaying = false;
  }
}

