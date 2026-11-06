/**
 * PART 1 - CONFIG (single source of truth, nothing hardcoded elsewhere)
 */

export type GameMode = "CLASSIC" | "TEAM_UP";
export type SeatColor = "RED" | "GREEN" | "YELLOW" | "BLUE";
export type SeatType = "HUMAN" | "BOT";
export type ThreeSixPenalty = "FORFEIT_TURN";
export type FriendlyKill = "OFF" | "PARTNER" | "ALL";
export type PartnerControl = "NONE" | "AFTER_FINISH" | "ALWAYS";
export type TeamWin = "ALL_EIGHT_HOME" | "EITHER_SEAT_ALL_HOME";
export type ClassicEnd = "UNTIL_ALL_RANKED" | "FIRST_WINNER";
export type FirstSeatSelection = "RANDOM" | number;

export interface TimingConfig {
  /** ms for 3D dice tumbling */
  diceRoll: number;
  /** ms between face swaps while rolling */
  diceFaceSwap: number;
  /** ms to hold final dice face before pawn reaction */
  diceResultHold: number;
  /** ms per single hop step */
  tokenStepHop: number;
  /** Parabolic jump arc height relative to cell */
  hopArcHeightCell: number;
  /** ms to animate from base to start square */
  baseToStart: number;
  /** ms for captured token to return to base */
  captureReturn: number;
  /** ms for home entry glow & scale */
  homeEntry: number;
  /** ms auto delay before auto-moving when only 1 legal move exists */
  singleMoveAutoDelay: number;
  /** ms before turn switches to next player */
  turnSwitchDelay: number;
  /** [min, max] ms delay for bot rolling dice */
  botRollDelay: [number, number];
  /** [min, max] ms delay for bot selecting a token */
  botPickDelay: [number, number];
  /** ms turn timer for online human turns */
  turnTimer: number;
  /** Consecutive auto-plays before kicking human / bot takeover */
  maxAutoPlaysBeforeKick: number;
}

export interface BonusOnConfig {
  six: boolean;
  enemyCapture: boolean;
  tokenHome: boolean;
}

export interface LudoConfig {
  mode: GameMode;
  seats: string[]; // ["RED", "GREEN", "YELLOW", "BLUE"] index 0..3, clockwise
  seatType: SeatType[]; // length 4, index 0..3
  tokensPerSeat: number;
  winTokensPerSeat: number; // 4 (Quick variant: 1) [VERIFY]
  startRoll: number; // 6
  bonusOn: BonusOnConfig;
  bonusRollsAccumulate: boolean; // false: one move earns at most ONE extra roll [VERIFY]
  maxConsecutiveSixes: number; // 3
  threeSixPenalty: ThreeSixPenalty; // "FORFEIT_TURN": 3rd six is not played
  mustMoveIfPossible: boolean; // true
  exactRollToHome: boolean; // true
  ringSize: number; // 52
  seatStartRing: number[]; // [0, 13, 26, 39]
  safeRing: number[]; // [0, 8, 13, 21, 26, 34, 39, 47] - 4 start squares + 4 stars
  stackBlocksCapture: boolean; // true [VERIFY]
  stackBlocksPassing: boolean; // false [VERIFY]
  friendlyKill: FriendlyKill; // "OFF" | "PARTNER" | "ALL"
  friendlyKillGivesBonus: boolean; // false
  teamStackForms: boolean; // true: partner tokens on one square form a stack [VERIFY]
  partnerControl: PartnerControl; // "AFTER_FINISH" | "NONE" | "ALWAYS" [VERIFY]
  teamWin: TeamWin; // "ALL_EIGHT_HOME" | "EITHER_SEAT_ALL_HOME" [VERIFY]
  classicEnd: ClassicEnd; // "UNTIL_ALL_RANKED" | "FIRST_WINNER"
  firstSeat: FirstSeatSelection; // "RANDOM" | 0..3
  startSquareCapture: boolean; // false: variant flag, opponent on start square safe by default
  timing: TimingConfig;
}

export const DEFAULT_CFG: LudoConfig = {
  mode: "CLASSIC",
  seats: ["RED", "GREEN", "YELLOW", "BLUE"],
  seatType: ["HUMAN", "BOT", "BOT", "BOT"],
  tokensPerSeat: 4,
  winTokensPerSeat: 4,
  startRoll: 6,
  bonusOn: {
    six: true,
    enemyCapture: true,
    tokenHome: true,
  },
  bonusRollsAccumulate: false,
  maxConsecutiveSixes: 3,
  threeSixPenalty: "FORFEIT_TURN",
  mustMoveIfPossible: true,
  exactRollToHome: true,
  ringSize: 52,
  seatStartRing: [0, 13, 26, 39],
  safeRing: [0, 8, 13, 21, 26, 34, 39, 47],
  stackBlocksCapture: true,
  stackBlocksPassing: false,
  friendlyKill: "OFF",
  friendlyKillGivesBonus: false,
  teamStackForms: true,
  partnerControl: "AFTER_FINISH",
  teamWin: "ALL_EIGHT_HOME",
  classicEnd: "UNTIL_ALL_RANKED",
  firstSeat: "RANDOM",
  startSquareCapture: false,
  timing: {
    diceRoll: 800,
    diceFaceSwap: 70,
    diceResultHold: 250,
    tokenStepHop: 180,
    hopArcHeightCell: 0.3,
    baseToStart: 300,
    captureReturn: 500,
    homeEntry: 300,
    singleMoveAutoDelay: 300,
    turnSwitchDelay: 400,
    botRollDelay: [600, 1000],
    botPickDelay: [400, 700],
    turnTimer: 15000,
    maxAutoPlaysBeforeKick: 3,
  },
};

/** Deep merge custom config with defaults */
export function createConfig(overrides?: Partial<LudoConfig>): LudoConfig {
  if (!overrides) return { ...DEFAULT_CFG, timing: { ...DEFAULT_CFG.timing }, bonusOn: { ...DEFAULT_CFG.bonusOn } };
  return {
    ...DEFAULT_CFG,
    ...overrides,
    bonusOn: {
      ...DEFAULT_CFG.bonusOn,
      ...(overrides.bonusOn || {}),
    },
    timing: {
      ...DEFAULT_CFG.timing,
      ...(overrides.timing || {}),
    },
    seats: overrides.seats ? [...overrides.seats] : [...DEFAULT_CFG.seats],
    seatType: overrides.seatType ? [...overrides.seatType] : [...DEFAULT_CFG.seatType],
    seatStartRing: overrides.seatStartRing ? [...overrides.seatStartRing] : [...DEFAULT_CFG.seatStartRing],
    safeRing: overrides.safeRing ? [...overrides.safeRing] : [...DEFAULT_CFG.safeRing],
    startSquareCapture: overrides.startSquareCapture !== undefined ? overrides.startSquareCapture : DEFAULT_CFG.startSquareCapture,
  };
}

