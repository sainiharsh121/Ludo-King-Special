import { LudoConfig } from './config';

/**
 * Discrete progress p:
 * 0 = in base yard
 * 1 = own start square
 * 2..51 = outer ring
 * 52..56 = owner's private home column
 * 57 = home (56 steps from start square to home)
 */
export interface TokenState {
  seat: number; // 0..3 (owner)
  id: number; // 0..3
  progress: number; // 0..57
}

export interface LegalMove {
  seat: number; // token owner seat
  tokenId: number; // 0..3
  fromProgress: number;
  toProgress: number;
  destRingIndex: number | null; // 0..51 if on ring, null if in base or home
  isEntering: boolean; // 0 -> 1
  isReachingHome: boolean; // toProgress === 57
  isFriendlyKill: boolean; // landing captures friendly/partner token
  isEnemyCapture: boolean; // landing captures 1+ enemy tokens
  formsStack: boolean; // landing forms a stack
}

export type EnginePhase = "WAIT_ROLL" | "WAIT_SELECT" | "GAME_OVER";

export interface GameState {
  cfg: LudoConfig;
  activeSeat: number; // 0..3
  phase: EnginePhase;
  diceValue: number | null; // rolled value (1..6)
  sixesInRow: number; // 0..3
  tokens: TokenState[][]; // [seat][id]
  legalMoves: LegalMove[];
  ranks: (number | null)[]; // rank 1..4 per seat, null if not yet finished
  finishedSeats: number[]; // order of seats that reached winTokensPerSeat
  winningTeam: number | null; // 0 (seats 0,2) or 1 (seats 1,3) in TEAM_UP
  gameOver: boolean;
  turnCount: number;
}

// -------------------------------------------------------------
// EVENT DEFINITIONS (PART 0)
// Events: DICE_ROLLED, TOKEN_ENTERED, TOKEN_STEP, STACK_FORMED,
// ENEMY_CAPTURED, FRIENDLY_CAPTURED, TOKEN_HOME, THREE_SIX_FORFEIT,
// TURN_PASSED, BONUS_ROLL, SEAT_FINISHED, TEAM_WON, GAME_OVER.
// -------------------------------------------------------------

export interface DiceRolledEvent {
  type: "DICE_ROLLED";
  seat: number;
  roll: number;
  sixesInRow: number;
}

export interface TokenEnteredEvent {
  type: "TOKEN_ENTERED";
  seat: number;
  tokenId: number;
  fromProgress: 0;
  toProgress: 1;
  ringIndex: number;
}

export interface TokenStepEvent {
  type: "TOKEN_STEP";
  seat: number;
  tokenId: number;
  fromProgress: number;
  toProgress: number;
  ringIndex: number | null; // null if in home column/home
  isHomeColumn: boolean;
}

export interface StackFormedEvent {
  type: "STACK_FORMED";
  seat: number;
  tokenId: number;
  ringIndex: number | null;
  isHomeColumn: boolean;
  tokensOnSquare: { seat: number; tokenId: number }[];
  isProtected: boolean;
}

export interface EnemyCapturedEvent {
  type: "ENEMY_CAPTURED";
  capturerSeat: number;
  capturerTokenId: number;
  victimSeat: number;
  victimTokenId: number;
  ringIndex: number;
}

export interface FriendlyCapturedEvent {
  type: "FRIENDLY_CAPTURED";
  capturerSeat: number;
  capturerTokenId: number;
  victimSeat: number;
  victimTokenId: number;
  ringIndex: number;
}

export interface TokenHomeEvent {
  type: "TOKEN_HOME";
  seat: number;
  tokenId: number;
  totalHomeForSeat: number;
}

export interface ThreeSixForfeitEvent {
  type: "THREE_SIX_FORFEIT";
  seat: number;
}

export interface TurnPassedEvent {
  type: "TURN_PASSED";
  fromSeat: number;
  toSeat: number;
  reason: "NO_LEGAL_MOVES" | "NORMAL" | "THREE_SIX_FORFEIT";
}

export interface BonusRollEvent {
  type: "BONUS_ROLL";
  seat: number;
  reason: "SIX" | "ENEMY_CAPTURE" | "FRIENDLY_CAPTURE" | "TOKEN_HOME";
}

export interface SeatFinishedEvent {
  type: "SEAT_FINISHED";
  seat: number;
  rank: number | null;
}

export interface TeamWonEvent {
  type: "TEAM_WON";
  winningTeam: number;
  seats: number[];
}

export interface GameOverEvent {
  type: "GAME_OVER";
  ranks: (number | null)[];
  winningTeam: number | null;
}

export type GameEvent =
  | DiceRolledEvent
  | TokenEnteredEvent
  | TokenStepEvent
  | StackFormedEvent
  | EnemyCapturedEvent
  | FriendlyCapturedEvent
  | TokenHomeEvent
  | ThreeSixForfeitEvent
  | TurnPassedEvent
  | BonusRollEvent
  | SeatFinishedEvent
  | TeamWonEvent
  | GameOverEvent;

// -------------------------------------------------------------
// ACTIONS (Deterministic Reducer Input)
// -------------------------------------------------------------

export interface RollDiceAction {
  type: "ROLL_DICE";
  forceRoll?: number; // deterministic test override if provided
}

export interface SelectTokenAction {
  type: "SELECT_TOKEN";
  seat: number;
  tokenId: number;
}

export type GameAction = RollDiceAction | SelectTokenAction;

export interface EngineStepResult {
  state: GameState;
  events: GameEvent[];
}

