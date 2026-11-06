import { PlayerColor, Coordinate, SafeZoneMode } from '../types/ludo';

// 52 Perimeter track tiles in 15x15 grid (row, col: 0..14)
export const GLOBAL_TRACK: Coordinate[] = [
  /*  0 */ { row: 6, col: 1 },  // Red start
  /*  1 */ { row: 6, col: 2 },
  /*  2 */ { row: 6, col: 3 },
  /*  3 */ { row: 6, col: 4 },
  /*  4 */ { row: 6, col: 5 },
  /*  5 */ { row: 5, col: 6 },
  /*  6 */ { row: 4, col: 6 },
  /*  7 */ { row: 3, col: 6 },
  /*  8 */ { row: 2, col: 6 },  // Safe Star 1
  /*  9 */ { row: 1, col: 6 },
  /* 10 */ { row: 0, col: 6 },
  /* 11 */ { row: 0, col: 7 },
  /* 12 */ { row: 0, col: 8 },
  /* 13 */ { row: 1, col: 8 },  // Green start
  /* 14 */ { row: 2, col: 8 },
  /* 15 */ { row: 3, col: 8 },
  /* 16 */ { row: 4, col: 8 },
  /* 17 */ { row: 5, col: 8 },
  /* 18 */ { row: 6, col: 9 },
  /* 19 */ { row: 6, col: 10 },
  /* 20 */ { row: 6, col: 11 },
  /* 21 */ { row: 6, col: 12 }, // Safe Star 2
  /* 22 */ { row: 6, col: 13 },
  /* 23 */ { row: 6, col: 14 },
  /* 24 */ { row: 7, col: 14 },
  /* 25 */ { row: 8, col: 14 },
  /* 26 */ { row: 8, col: 13 }, // Yellow start
  /* 27 */ { row: 8, col: 12 },
  /* 28 */ { row: 8, col: 11 },
  /* 29 */ { row: 8, col: 10 },
  /* 30 */ { row: 8, col: 9 },
  /* 31 */ { row: 9, col: 8 },
  /* 32 */ { row: 10, col: 8 },
  /* 33 */ { row: 11, col: 8 },
  /* 34 */ { row: 12, col: 8 }, // Safe Star 3
  /* 35 */ { row: 13, col: 8 },
  /* 36 */ { row: 14, col: 8 },
  /* 37 */ { row: 14, col: 7 },
  /* 38 */ { row: 14, col: 6 },
  /* 39 */ { row: 13, col: 6 }, // Blue start
  /* 40 */ { row: 12, col: 6 },
  /* 41 */ { row: 11, col: 6 },
  /* 42 */ { row: 10, col: 6 },
  /* 43 */ { row: 9, col: 6 },
  /* 44 */ { row: 8, col: 5 },
  /* 45 */ { row: 8, col: 4 },
  /* 46 */ { row: 8, col: 3 },
  /* 47 */ { row: 8, col: 2 },  // Safe Star 4
  /* 48 */ { row: 8, col: 1 },
  /* 49 */ { row: 8, col: 0 },
  /* 50 */ { row: 7, col: 0 },
  /* 51 */ { row: 6, col: 0 },
];

export const COLOR_OFFSETS: Record<PlayerColor, number> = {
  RED: 0,
  GREEN: 13,
  YELLOW: 26,
  BLUE: 39,
};

// Safe star tiles on global track
export const START_CELL_INDICES = [0, 13, 26, 39];
export const MID_STAR_INDICES = [8, 21, 34, 47];
export const ALL_SAFE_INDICES = [...START_CELL_INDICES, ...MID_STAR_INDICES];

// Eligible track indices for dynamic board hazards/items (running common cells, excluding start squares & static safe stars)
export const ELIGIBLE_HAZARD_INDICES: number[] = Array.from({ length: 52 }, (_, i) => i)
  .filter(i => !START_CELL_INDICES.includes(i) && !MID_STAR_INDICES.includes(i));

/**
 * Pick 'count' random unique track indices from eligible common cells, avoiding any specified 'excluded' indices.
 */
export function generateRandomHazardIndices(count: number, excluded: number[] = []): number[] {
  const available = ELIGIBLE_HAZARD_INDICES.filter(idx => !excluded.includes(idx));
  const picked: number[] = [];
  const pool = [...available];

  while (picked.length < count && pool.length > 0) {
    const randomIdx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(randomIdx, 1)[0]);
  }

  return picked;
}

export const MIN_HAZARD_RESPAWN_MS = 120000; // 2 minutes
export const MAX_HAZARD_RESPAWN_MS = 180000; // 3 minutes

/**
 * Returns a random respawn delay between minMs (default 120,000ms = 2 min) and maxMs (default 180,000ms = 3 min).
 * Closed interval [minMs, maxMs].
 */
export function getRandomHazardRespawnDelay(
  minMs: number = MIN_HAZARD_RESPAWN_MS,
  maxMs: number = MAX_HAZARD_RESPAWN_MS
): number {
  const min = Math.min(minMs, maxMs);
  const max = Math.max(minMs, maxMs);
  return Math.floor(min + Math.random() * (max - min + 1));
}

/**
 * Respawn a single hazard (freeze star or jump icon) onto an eligible common running track cell.
 * Excludes start squares, static safe stars, and all indices in the excluded list.
 */
export function respawnSingleHazard(excluded: number[] = []): number | null {
  const picked = generateRandomHazardIndices(1, excluded);
  return picked.length > 0 ? picked[0] : null;
}

export interface HazardRespawnState {
  freezeStarIndices: number[];
  jumpIconIndex: number | null;
  jumpIconIndices: number[];
  freezeStarRespawnTimes: number[];
  jumpIconRespawnTime: number | null;
  jumpIconRespawnTimes: number[];
}

export interface HazardRespawnResult {
  nextState: HazardRespawnState;
  respawnedFreezeCount: number;
  respawnedJump: boolean;
}

/**
 * Initializes hazard state cleanly from saved match data or fresh non-overlapping generation.
 * Generates 4 Freeze Stars and 4 Jump Icons on the track.
 */
export function initializeHazardState(
  initialMatch?: Partial<HazardRespawnState> | null
): HazardRespawnState {
  if (initialMatch && Array.isArray(initialMatch.freezeStarIndices)) {
    const jumpArr = Array.isArray(initialMatch.jumpIconIndices)
      ? initialMatch.jumpIconIndices
      : (initialMatch.jumpIconIndex !== null && initialMatch.jumpIconIndex !== undefined ? [initialMatch.jumpIconIndex] : []);
    const jumpTimes = Array.isArray(initialMatch.jumpIconRespawnTimes)
      ? initialMatch.jumpIconRespawnTimes
      : (initialMatch.jumpIconRespawnTime !== null && initialMatch.jumpIconRespawnTime !== undefined ? [initialMatch.jumpIconRespawnTime] : []);
    return {
      freezeStarIndices: initialMatch.freezeStarIndices,
      jumpIconIndex: jumpArr[0] ?? null,
      jumpIconIndices: jumpArr,
      freezeStarRespawnTimes: initialMatch.freezeStarRespawnTimes || [],
      jumpIconRespawnTime: jumpTimes[0] ?? null,
      jumpIconRespawnTimes: jumpTimes,
    };
  }
  const initialFreeze = generateRandomHazardIndices(4);
  const pickedJump = generateRandomHazardIndices(4, initialFreeze);
  return {
    freezeStarIndices: initialFreeze,
    jumpIconIndex: pickedJump[0] ?? null,
    jumpIconIndices: pickedJump,
    freezeStarRespawnTimes: [],
    jumpIconRespawnTime: null,
    jumpIconRespawnTimes: [],
  };
}

/**
 * Checks pending respawns against timestamp 'now' and respawns any matured hazards
 * onto eligible common track cells without colliding with each other or existing safe cells.
 * Retains unconsumed pending timestamps if board capacity is reached.
 * Enforces up to 4 Freeze Stars and 4 Jump Icons on board with 2-3 minute random cycles.
 */
export function processHazardRespawns(
  state: HazardRespawnState,
  now: number = Date.now()
): HazardRespawnResult {
  const { freezeStarIndices, jumpIconIndices, freezeStarRespawnTimes, jumpIconRespawnTimes } = state;
  const currentJumpArr = jumpIconIndices || (state.jumpIconIndex !== null && state.jumpIconIndex !== undefined ? [state.jumpIconIndex] : []);
  const currentJumpTimes = jumpIconRespawnTimes || (state.jumpIconRespawnTime !== null && state.jumpIconRespawnTime !== undefined ? [state.jumpIconRespawnTime] : []);

  const sortedFreezeTimes = [...freezeStarRespawnTimes].sort((a, b) => a - b);
  const readyFreezeTimes = sortedFreezeTimes.filter(t => t <= now);
  const unreadyFreezeTimes = sortedFreezeTimes.filter(t => t > now);

  const sortedJumpTimes = [...currentJumpTimes].sort((a, b) => a - b);
  const readyJumpTimes = sortedJumpTimes.filter(t => t <= now);
  const unreadyJumpTimes = sortedJumpTimes.filter(t => t > now);

  let newFreezeStars = [...freezeStarIndices];
  let newJumpIcons = [...currentJumpArr];
  let respawnedFreezeCount = 0;
  let respawnedJump = false;
  const unconsumedFreezeTimes: number[] = [];
  const unconsumedJumpTimes: number[] = [];

  // Respawn ready freeze stars (ensuring up to 4 freeze stars total on board)
  for (let i = 0; i < readyFreezeTimes.length; i++) {
    if (newFreezeStars.length >= 4) {
      unconsumedFreezeTimes.push(...readyFreezeTimes.slice(i));
      break;
    }
    const excluded = [...newFreezeStars, ...newJumpIcons];
    const newIdx = respawnSingleHazard(excluded);
    if (newIdx !== null) {
      newFreezeStars.push(newIdx);
      respawnedFreezeCount++;
    } else {
      unconsumedFreezeTimes.push(readyFreezeTimes[i]);
    }
  }

  // Respawn ready jump icons (ensuring up to 4 jump icons total on board)
  for (let i = 0; i < readyJumpTimes.length; i++) {
    if (newJumpIcons.length >= 4) {
      unconsumedJumpTimes.push(...readyJumpTimes.slice(i));
      break;
    }
    const excluded = [...newFreezeStars, ...newJumpIcons];
    const newIdx = respawnSingleHazard(excluded);
    if (newIdx !== null) {
      newJumpIcons.push(newIdx);
      respawnedJump = true;
    } else {
      unconsumedJumpTimes.push(readyJumpTimes[i]);
    }
  }

  return {
    nextState: {
      freezeStarIndices: newFreezeStars,
      jumpIconIndex: newJumpIcons[0] ?? null,
      jumpIconIndices: newJumpIcons,
      freezeStarRespawnTimes: [...unconsumedFreezeTimes, ...unreadyFreezeTimes],
      jumpIconRespawnTime: unreadyJumpTimes[0] ?? null,
      jumpIconRespawnTimes: [...unconsumedJumpTimes, ...unreadyJumpTimes],
    },
    respawnedFreezeCount,
    respawnedJump,
  };
}

// Home corridor coordinates (step 51 to 55)
export const HOME_CORRIDORS: Record<PlayerColor, Coordinate[]> = {
  RED: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
  ],
  GREEN: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
  ],
  YELLOW: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
  ],
  BLUE: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
  ],
};

// Home Center Final Destination (step 56)
export const HOME_CENTERS: Record<PlayerColor, Coordinate> = {
  RED: { row: 7, col: 6.2 },
  GREEN: { row: 6.2, col: 7 },
  YELLOW: { row: 7, col: 7.8 },
  BLUE: { row: 7.8, col: 7 },
};

// Base yard pawn socket positions (step -1)
export const BASE_SOCKETS: Record<PlayerColor, Coordinate[]> = {
  RED: [
    { row: 1.8, col: 1.8 },
    { row: 1.8, col: 3.8 },
    { row: 3.8, col: 1.8 },
    { row: 3.8, col: 3.8 },
  ],
  GREEN: [
    { row: 1.8, col: 10.8 },
    { row: 1.8, col: 12.8 },
    { row: 3.8, col: 10.8 },
    { row: 3.8, col: 12.8 },
  ],
  YELLOW: [
    { row: 10.8, col: 10.8 },
    { row: 10.8, col: 12.8 },
    { row: 12.8, col: 10.8 },
    { row: 12.8, col: 12.8 },
  ],
  BLUE: [
    { row: 10.8, col: 1.8 },
    { row: 10.8, col: 3.8 },
    { row: 12.8, col: 1.8 },
    { row: 12.8, col: 3.8 },
  ],
};

// Check if a global track cell is safe
export function isSafeGlobalCell(globalIndex: number, mode: SafeZoneMode): boolean {
  if (mode === 'none') return false;
  if (mode === 'exits_only') return START_CELL_INDICES.includes(globalIndex);
  return ALL_SAFE_INDICES.includes(globalIndex);
}

// Convert player step (0..50) to global track index (0..51)
export function stepToGlobalIndex(color: PlayerColor, step: number): number | null {
  if (step < 0 || step > 50) return null;
  const offset = COLOR_OFFSETS[color];
  return (offset + step) % 52;
}

// Get Board Grid Coordinate for any pawn state
export function getPawnCoordinate(color: PlayerColor, step: number, pawnId: number): Coordinate {
  // 1. In Yard Base
  if (step === -1) {
    return BASE_SOCKETS[color][pawnId] || { row: 0, col: 0 };
  }

  // 2. On Main Perimeter Track (0..50)
  if (step >= 0 && step <= 50) {
    const globalIdx = stepToGlobalIndex(color, step)!;
    return GLOBAL_TRACK[globalIdx];
  }

  // 3. In Colored Home Corridor (51..55)
  if (step >= 51 && step <= 55) {
    const corridorIdx = step - 51;
    return HOME_CORRIDORS[color][corridorIdx];
  }

  // 4. Center Home Triangle (56)
  return HOME_CENTERS[color];
}

// Build list of coordinates from fromStep to toStep for animation hopping (supports both forward and backward steps)
export function getStepPath(color: PlayerColor, fromStep: number, toStep: number, pawnId: number): Coordinate[] {
  const path: Coordinate[] = [];
  if (fromStep === -1) {
    // Exiting base into start tile
    path.push(BASE_SOCKETS[color][pawnId]);
    path.push(getPawnCoordinate(color, 0, pawnId));
    return path;
  }

  if (toStep < fromStep) {
    // Hopping backwards step-by-step
    for (let s = fromStep - 1; s >= toStep; s--) {
      path.push(getPawnCoordinate(color, s, pawnId));
    }
    return path;
  }

  for (let s = fromStep + 1; s <= toStep; s++) {
    path.push(getPawnCoordinate(color, s, pawnId));
  }
  return path;
}

// Build reverse list of coordinates for captured token to return home along its exact path
export function getReturnPath(color: PlayerColor, fromStep: number, pawnId: number): Coordinate[] {
  const path: Coordinate[] = [];
  // Retrace every single cell in reverse from (fromStep - 1) down to 0 (start square)
  for (let s = fromStep - 1; s >= 0; s--) {
    path.push(getPawnCoordinate(color, s, pawnId));
  }
  // Final destination: back into its own dedicated yard base socket (-1)
  path.push(BASE_SOCKETS[color][pawnId]);
  return path;
}

