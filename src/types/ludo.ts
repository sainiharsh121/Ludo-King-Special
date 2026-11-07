export type PlayerColor = 'RED' | 'GREEN' | 'YELLOW' | 'BLUE';

export interface Pawn {
  id: number; // 0, 1, 2, 3
  color: PlayerColor;
  step: number; // -1: Base yard, 0..51: Track steps, 51..55: Home corridor, 56: Reached Home
  isHome: boolean;
  isFrozen?: boolean; // True if token stepped on a Freeze Star (cannot move)
  frozenTurnsLeft?: number; // Turns left until ice thaws
  inHomeCorridor?: boolean; // True if pawn has entered the home corridor (51..55)
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  tokenColorHex?: string; // Custom token color hex or CSS variable from the palette
  tokenId?: TokenId; // Token skin: 'pin' | 'disc' | 'hammer' | 'top' | 'ninja'
  avatar: string;
  pawns: Pawn[];
  hasCaptured: boolean; // Has this player captured at least one opponent?
  consecutiveSixes: number; // Tracks consecutive 6s in current turn
  rank: number | null; // 1 = 1st, 2 = 2nd, 3 = 3rd, null = not yet finished
  isActive: boolean;
  isAi?: boolean; // If true, controlled by computer bot
  team?: 'TEAM_A' | 'TEAM_B'; // In TEAM_UP 2v2 mode: TEAM_A (Blue+Green) vs TEAM_B (Red+Yellow)
}


export type SafeZoneMode = 'standard' | 'exits_only' | 'none';

export interface GameRules {
  openOnSixOnly: boolean; // true: 6 only, false: 1 or 6
  mustCaptureToEnterHome: boolean; // Quick game rule (false in Classic; true in Quick Mode)
  threeSixesForfeit: boolean; // rolling three 6s forfeits turn
  bonusOnCapture: boolean; // extra roll upon capturing opponent
  bonusOnHomeReach: boolean; // extra roll upon reaching home
  safeZoneMode: SafeZoneMode; // standard (8 stars), exits only (4 stars), or none
  pawnSpeedMs: number; // speed of pawn hop per step (ms)
  autoMoveSingleLegal: boolean; // automatically move if only 1 pawn is legal
  friendlyKill?: boolean; // In TEAM_UP: true = teammates can capture each other; false = teammates are safe
  oneTokenOut?: boolean; // In "Play - One Token Out -": true = 1 token starts on board track, 3 in yard
  freezeStarsEnabled?: boolean; // Rule 1: 2 random freeze stars in 5-minute cycle
  jumpIconEnabled?: boolean; // Rule 2: 1 random jump icon in 7-minute cycle
  freezeStarCycleMs?: number; // Milliseconds per freeze star relocation cycle (default 300,000 = 5 min)
  jumpIconCycleMs?: number; // Milliseconds per jump icon relocation cycle (default 420,000 = 7 min)
  freezeStarRespawnMinMs?: number; // Minimum ms before used freeze star respawns (default: 180,000 = 3 min)
  freezeStarRespawnMaxMs?: number; // Maximum ms before used freeze star respawns (default: 300,000 = 5 min)
  jumpIconRespawnMinMs?: number; // Minimum ms before used jump icon respawns (default: 180,000 = 3 min)
  jumpIconRespawnMaxMs?: number; // Maximum ms before used jump icon respawns (default: 300,000 = 5 min)
}

export type TurnPhase = 
  | 'WAITING_ROLL' 
  | 'ROLLING' 
  | 'SELECTING_PAWN' 
  | 'ANIMATING_MOVE' 
  | 'TURN_TRANSITION' 
  | 'GAME_OVER';

export interface Coordinate {
  row: number;
  col: number;
}

export interface MoveStep {
  pawnId: number;
  fromStep: number;
  toStep: number;
  path: Coordinate[];
}

export type BoardTheme = 'classic' | 'wood' | 'royal' | 'neon';

export type GameMode = 'PASS_N_PLAY' | 'QUICK_MODE' | 'TEAM_UP' | 'VS_COMPUTER';

export type PassNPlaySubMode = 'CLASSIC' | 'TEAM_UP' | 'QUICK';

export type TokenId = 'pin' | 'disc' | 'hammer' | 'top' | 'ninja';

export type AppScreen = 
  | 'SPLASH' 
  | 'HOME' 
  | 'PASS_N_PLAY_SETUP' 
  | 'PASS_N_PLAY_CLASSIC_SETUP' 
  | 'PASS_N_PLAY_TEAM_UP_SETUP' 
  | 'TEAM_UP_TASK_SELECTION' 
  | 'GAME';

export type TeamUpTaskId = 'task-1' | 'task-2' | 'task-3';

export interface TeamUpTaskOption {
  id: TeamUpTaskId;
  taskNumber: number;
  title: string;
  hindiDescription: string;
  iconEmoji: string;
  badge: string;
}

export interface SavedGame {
  id: string;
  dateFormatted: string;
  timestamp: number;
  gameMode: GameMode;
  subMode?: PassNPlaySubMode;
  boardTheme: BoardTheme;
  rules: GameRules;
  players: Player[];
  activePlayerIndex: number;
  title: string;
  freezeStarIndices?: number[];
  jumpIconIndex?: number | null;
  jumpIconIndices?: number[];
  freezeStarRespawnTimes?: number[];
  jumpIconRespawnTime?: number | null;
  jumpIconRespawnTimes?: number[];
}


