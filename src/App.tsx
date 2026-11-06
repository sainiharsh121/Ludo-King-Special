import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Player, 
  Pawn, 
  PlayerColor, 
  GameRules, 
  TurnPhase, 
  Coordinate, 
  BoardTheme, 
  GameMode, 
  PassNPlaySubMode,
  TokenId,
  AppScreen 
} from './types/ludo';
import { LudoBoard } from './components/LudoBoard';
import { PlayerHUD } from './components/PlayerHUD';
import { SetupModal } from './components/SetupModal';
import { GameOverModal } from './components/GameOverModal';
import { HomeScreen } from './components/HomeScreen';
import { SplashScreen } from './components/SplashScreen';
import { PassNPlaySetupScreen } from './components/PassNPlaySetupScreen';
import { PassNPlayClassicSetupScreen } from './components/PassNPlayClassicSetupScreen';
import { PassNPlayTeamUpSetupScreen } from './components/PassNPlayTeamUpSetupScreen';
import { TeamUpTaskSelectionScreen } from './components/TeamUpTaskSelectionScreen';
import { MobileFrame } from './components/MobileFrame';
import { soundEngine } from './utils/soundEngine';
import confetti from 'canvas-confetti';
import { 
  getLegalPawns, 
  calculateMoveOutcome, 
  getNextPlayerIndex,
  countActiveRemainingPlayers,
  checkTeamUpWinner,
  createPawns,
  isPlayerFinished
} from './utils/gameRulesEngine';
import { saveCurrentGame } from './utils/savedGamesEngine';
import { 
  getStepPath, 
  getReturnPath, 
  getPawnCoordinate, 
  generateRandomHazardIndices,
  getRandomHazardRespawnDelay,
  processHazardRespawns,
  initializeHazardState
} from './utils/boardCoordinates';
import { createPRNG } from './engine/rng';
import { MoreVertical, LogOut } from 'lucide-react';
import { SavedGame } from './types/ludo';

const appRng = createPRNG(Date.now() ^ 0xa5a5a5a5);

const INITIAL_PAWNS = (color: PlayerColor): Pawn[] => [
  { id: 0, color, step: -1, isHome: false },
  { id: 1, color, step: -1, isHome: false },
  { id: 2, color, step: -1, isHome: false },
  { id: 3, color, step: -1, isHome: false },
];

export const ACTIVE_SCREEN_STORAGE_KEY = 'ludo_active_screen';
export const SPLASH_SEEN_STORAGE_KEY = 'ludo_king_splash_seen';
export const ACTIVE_MATCH_STORAGE_KEY = 'ludo_active_match_state';

export interface ActiveMatchState {
  players: Player[];
  rules: GameRules;
  gameMode: GameMode;
  boardTheme: BoardTheme;
  activePlayerIndex: number;
  diceValue: number;
  phase: TurnPhase;
  legalPawnIds: number[];
  friendlyKillPawnIds: number[];
  notification: string | null;
  winningTeam: number | null;
  freezeStarIndices?: number[];
  jumpIconIndex?: number | null;
  jumpIconIndices?: number[];
  freezeStarRespawnTimes?: number[];
  jumpIconRespawnTime?: number | null;
  jumpIconRespawnTimes?: number[];
}

export const getSavedActiveMatch = (): ActiveMatchState | null => {
  try {
    const raw = localStorage.getItem(ACTIVE_MATCH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
      return parsed as ActiveMatchState;
    }
  } catch {}
  return null;
};

/**
 * In TEAM_UP (2v2) mode, if the active player has already completed all tokens into home,
 * their dice roll is awarded to their teammate to move the teammate's tokens!
 */
export const getControllingPlayer = (
  currentActivePlayer: Player,
  currentPlayers: Player[],
  mode: GameMode
): Player => {
  if (mode !== 'TEAM_UP') return currentActivePlayer;
  const isFinished = currentActivePlayer.pawns.every(p => p.isHome || p.step >= 56);
  if (isFinished) {
    const partner = currentPlayers.find(
      p => p.team === currentActivePlayer.team && p.id !== currentActivePlayer.id
    );
    if (partner) return partner;
  }
  return currentActivePlayer;
};

const checkHasSeenSplash = (): boolean => {
  try {
    return localStorage.getItem(SPLASH_SEEN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const getInitialScreen = (): AppScreen => {
  try {
    // 1. Check URL Hash first (e.g. #pass-classic, #pass-team, #pass-n-play, #home, #game, #splash)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('pass-classic') || hash.includes('classic-setup')) {
        return 'PASS_N_PLAY_CLASSIC_SETUP';
      }
      if (hash.includes('pass-team') || hash.includes('team-up-setup') || hash.includes('teamup') || hash.includes('team-up')) {
        return 'PASS_N_PLAY_TEAM_UP_SETUP';
      }
      if (hash.includes('task') || hash.includes('penalty')) {
        return 'TEAM_UP_TASK_SELECTION';
      }
      if (hash.includes('pass') || hash.includes('setup') || hash.includes('page4') || hash.includes('page-4')) {
        return 'PASS_N_PLAY_SETUP';
      }
      if (hash.includes('home') || hash.includes('lobby') || hash.includes('page3') || hash.includes('page-3') || hash.includes('page2')) {
        return 'HOME';
      }
      if (hash.includes('game') || hash.includes('arena') || hash.includes('play')) {
        return 'GAME';
      }
      if (hash.includes('splash') || hash.includes('intro') || hash.includes('page1') || hash.includes('page-1')) {
        return 'SPLASH';
      }
    }

    // 2. Check localStorage: preserve exact same screen on refresh
    const saved = localStorage.getItem(ACTIVE_SCREEN_STORAGE_KEY) as AppScreen | null;
    if (saved && [
      'SPLASH', 
      'HOME', 
      'PASS_N_PLAY_SETUP', 
      'PASS_N_PLAY_CLASSIC_SETUP', 
      'PASS_N_PLAY_TEAM_UP_SETUP', 
      'TEAM_UP_TASK_SELECTION',
      'GAME'
    ].includes(saved)) {
      return saved;
    }

    // 3. Fallback: if splash has already been seen, go to HOME, else SPLASH
    return checkHasSeenSplash() ? 'HOME' : 'SPLASH';
  } catch {
    return 'SPLASH';
  }
};

const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p-red',
    name: 'Player 1',
    color: 'RED',
    avatar: '🦁',
    pawns: INITIAL_PAWNS('RED'),
    hasCaptured: false,
    consecutiveSixes: 0,
    rank: null,
    isActive: true,
  },
  {
    id: 'p-green',
    name: 'Player 2',
    color: 'GREEN',
    avatar: '🐯',
    pawns: INITIAL_PAWNS('GREEN'),
    hasCaptured: false,
    consecutiveSixes: 0,
    rank: null,
    isActive: true,
  },
  {
    id: 'p-yellow',
    name: 'Player 3',
    color: 'YELLOW',
    avatar: '🦅',
    pawns: INITIAL_PAWNS('YELLOW'),
    hasCaptured: false,
    consecutiveSixes: 0,
    rank: null,
    isActive: true,
  },
  {
    id: 'p-blue',
    name: 'Player 4',
    color: 'BLUE',
    avatar: '🐉',
    pawns: INITIAL_PAWNS('BLUE'),
    hasCaptured: false,
    consecutiveSixes: 0,
    rank: null,
    isActive: true,
  },
];

export const App: React.FC = () => {
  // Restore active match if ongoing (persisted across page reloads so match never resets)
  const [initialMatch] = useState<ActiveMatchState | null>(() => getSavedActiveMatch());

  // Navigation Screens & Game Modes (persisted so refresh never navigates away)
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(getInitialScreen);
  const [gameMode, setGameMode] = useState<GameMode>(initialMatch?.gameMode || 'PASS_N_PLAY');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(initialMatch?.boardTheme || 'classic');
  const [selectedToken, setSelectedToken] = useState<TokenId>(() => {
    try {
      const saved = localStorage.getItem('ludo_pnp_token') as TokenId | null;
      if (saved && ['pin', 'disc', 'hammer', 'top', 'ninja'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'pin';
  });

  // Keep localStorage and URL hash perfectly synchronized with active screen
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_SCREEN_STORAGE_KEY, currentScreen);
      const hashName: Record<AppScreen, string> = {
        SPLASH: 'splash',
        HOME: 'home',
        PASS_N_PLAY_SETUP: 'pass-n-play',
        PASS_N_PLAY_CLASSIC_SETUP: 'pass-classic',
        PASS_N_PLAY_TEAM_UP_SETUP: 'pass-team-up',
        TEAM_UP_TASK_SELECTION: 'task-selection',
        GAME: 'game',
      };
      window.history.replaceState(null, '', `#${hashName[currentScreen]}`);
    } catch {}
  }, [currentScreen]);

  // Synchronize screen state if URL hash changes (browser back/forward button)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('pass-classic') || hash.includes('classic-setup')) {
        setCurrentScreen('PASS_N_PLAY_CLASSIC_SETUP');
      } else if (hash.includes('pass-team') || hash.includes('team-up-setup') || hash.includes('teamup') || hash.includes('team-up')) {
        setCurrentScreen('PASS_N_PLAY_TEAM_UP_SETUP');
      } else if (hash.includes('task') || hash.includes('penalty')) {
        setCurrentScreen('TEAM_UP_TASK_SELECTION');
      } else if (hash.includes('pass') || hash.includes('setup') || hash.includes('page4') || hash.includes('page-4')) {
        setCurrentScreen('PASS_N_PLAY_SETUP');
      } else if (hash.includes('home') || hash.includes('lobby') || hash.includes('page3') || hash.includes('page-3')) {
        setCurrentScreen('HOME');
      } else if (hash.includes('game') || hash.includes('arena') || hash.includes('play')) {
        setCurrentScreen('GAME');
      } else if (hash.includes('splash') || hash.includes('intro') || hash.includes('page1') || hash.includes('page-1')) {
        setCurrentScreen('SPLASH');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Game Setup & Rules
  const [pendingTeamUpConfig, setPendingTeamUpConfig] = useState<{
    players: Player[];
    rules: GameRules;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('ludo_pending_teamup_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [rules, setRules] = useState<GameRules>(
    initialMatch?.rules || {
      openOnSixOnly: true,
      mustCaptureToEnterHome: false,
      threeSixesForfeit: true,
      bonusOnCapture: true,
      bonusOnHomeReach: true,
      safeZoneMode: 'standard',
      pawnSpeedMs: 80,
      autoMoveSingleLegal: true,
      freezeStarsEnabled: true,
      jumpIconEnabled: true,
      freezeStarCycleMs: 180000,
      jumpIconCycleMs: 180000,
      freezeStarRespawnMinMs: 120000, // 2 min
      freezeStarRespawnMaxMs: 180000, // 3 min
      jumpIconRespawnMinMs: 120000, // 2 min
      jumpIconRespawnMaxMs: 180000, // 3 min
    }
  );

  const [players, setPlayers] = useState<Player[]>(initialMatch?.players || INITIAL_PLAYERS);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(initialMatch?.activePlayerIndex ?? 0);
  const [diceValue, setDiceValue] = useState<number>(initialMatch?.diceValue ?? 6);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [phase, setPhase] = useState<TurnPhase>(
    initialMatch?.phase === 'ROLLING' ? 'WAITING_ROLL' : initialMatch?.phase || 'WAITING_ROLL'
  );
  const [legalPawnIds, setLegalPawnIds] = useState<number[]>(initialMatch?.legalPawnIds || []);
  const [friendlyKillPawnIds, setFriendlyKillPawnIds] = useState<number[]>(initialMatch?.friendlyKillPawnIds || []);
  const [notification, setNotification] = useState<string | null>(
    initialMatch?.notification || 'Tap glowing dice to roll!'
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Dynamic Board Hazards (Rule 1: 4 Freeze Stars, Rule 2: 4 Jump Icons in 2-3 minute random cycles)
  const initialHazards = useMemo(() => initializeHazardState(initialMatch), [initialMatch]);
  const [freezeStarIndices, setFreezeStarIndices] = useState<number[]>(initialHazards.freezeStarIndices);
  const [jumpIconIndices, setJumpIconIndices] = useState<number[]>(
    initialHazards.jumpIconIndices || (initialHazards.jumpIconIndex !== null && initialHazards.jumpIconIndex !== undefined ? [initialHazards.jumpIconIndex] : [])
  );
  const [freezeStarRespawnTimes, setFreezeStarRespawnTimes] = useState<number[]>(initialHazards.freezeStarRespawnTimes);
  const [jumpIconRespawnTimes, setJumpIconRespawnTimes] = useState<number[]>(
    initialHazards.jumpIconRespawnTimes || (initialHazards.jumpIconRespawnTime !== null && initialHazards.jumpIconRespawnTime !== undefined ? [initialHazards.jumpIconRespawnTime] : [])
  );

  // Keep live refs for timer callbacks to prevent stale closures and unnecessary timer restarts
  const freezeStarIndicesRef = useRef(freezeStarIndices);
  freezeStarIndicesRef.current = freezeStarIndices;
  const jumpIconIndicesRef = useRef(jumpIconIndices);
  jumpIconIndicesRef.current = jumpIconIndices;
  const freezeStarRespawnTimesRef = useRef(freezeStarRespawnTimes);
  freezeStarRespawnTimesRef.current = freezeStarRespawnTimes;
  const jumpIconRespawnTimesRef = useRef(jumpIconRespawnTimes);
  jumpIconRespawnTimesRef.current = jumpIconRespawnTimes;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Track wall-clock time for periodic relocation cycles (2-3 min random)
  const lastFreezeRelocationRef = useRef<number>(Date.now());
  const lastJumpRelocationRef = useRef<number>(Date.now());

  // Track match moves and rolls without a six for dynamic mid-match 6 boost
  const matchRollsCountRef = useRef<number>(0);
  const rollsWithoutSixRef = useRef<number>(0);

  // Unified Hazard Tick: checks respawns & wall-clock periodic relocations without turn interruptions
  useEffect(() => {
    if (currentScreen !== 'GAME') return;

    const tick = () => {
      if (phaseRef.current === 'GAME_OVER') return;
      const now = Date.now();

      // 1. Check Respawns (Rule 1 & Rule 2: 2-3 minute random delay for consumed hazards)
      const currentFreezeTimes = freezeStarRespawnTimesRef.current;
      const currentJumpTimes = jumpIconRespawnTimesRef.current;
      const hasReadyFreeze = currentFreezeTimes.some(t => t <= now);
      const isJumpReady = currentJumpTimes.some(t => t <= now);

      if (hasReadyFreeze || isJumpReady) {
        const result = processHazardRespawns(
          {
            freezeStarIndices: freezeStarIndicesRef.current,
            jumpIconIndices: jumpIconIndicesRef.current,
            jumpIconIndex: jumpIconIndicesRef.current[0] ?? null,
            freezeStarRespawnTimes: currentFreezeTimes,
            jumpIconRespawnTimes: currentJumpTimes,
            jumpIconRespawnTime: currentJumpTimes[0] ?? null,
          },
          now
        );

        setFreezeStarIndices(result.nextState.freezeStarIndices);
        setJumpIconIndices(result.nextState.jumpIconIndices);
        setFreezeStarRespawnTimes(result.nextState.freezeStarRespawnTimes);
        setJumpIconRespawnTimes(result.nextState.jumpIconRespawnTimes);

        if (result.respawnedFreezeCount > 0 && result.respawnedJump) {
          setNotification('❄️ Freeze Star and ⚡ Jump Icon have reappeared on the track!');
        } else if (result.respawnedFreezeCount > 0) {
          setNotification('❄️ Freeze Star has reappeared on the track!');
        } else if (result.respawnedJump) {
          setNotification('⚡ Jump Icon has reappeared on the track!');
        }
      }

      // 2. Rule 1: Periodic 2-3 minute random relocation cycle for active freeze stars
      const freezeCycleMs = getRandomHazardRespawnDelay(
        rules.freezeStarRespawnMinMs || 120000,
        rules.freezeStarRespawnMaxMs || 180000
      );
      if (now - lastFreezeRelocationRef.current >= freezeCycleMs) {
        lastFreezeRelocationRef.current = now;
        setFreezeStarIndices(current => {
          if (current.length === 0) return current;
          const currentJump = jumpIconIndicesRef.current;
          const newStars = generateRandomHazardIndices(current.length, currentJump);
          setNotification('❄️ Freeze Stars have relocated to new track positions!');
          return newStars;
        });
      }

      // 3. Rule 2: Periodic 2-3 minute random relocation cycle for active jump icons
      const jumpCycleMs = getRandomHazardRespawnDelay(
        rules.jumpIconRespawnMinMs || 120000,
        rules.jumpIconRespawnMaxMs || 180000
      );
      if (now - lastJumpRelocationRef.current >= jumpCycleMs) {
        lastJumpRelocationRef.current = now;
        setJumpIconIndices(current => {
          if (current.length === 0) return current;
          const currentStars = freezeStarIndicesRef.current;
          const newJump = generateRandomHazardIndices(current.length, currentStars);
          setNotification('⚡ Jump Icons have relocated to new track positions!');
          return newJump;
        });
      }
    };

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [currentScreen, rules.freezeStarCycleMs, rules.jumpIconCycleMs]);

  // Modals & Menu
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState<boolean>(false);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState<boolean>(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState<boolean>(false);
  const [winningTeam, setWinningTeam] = useState<number | null>(initialMatch?.winningTeam ?? null);

  // Synchronize active match state to localStorage on every change so browser reload never loses match progress
  useEffect(() => {
    if (currentScreen === 'GAME' && players.length > 0) {
      try {
        const stateToSave: ActiveMatchState = {
          players,
          rules,
          gameMode,
          boardTheme,
          activePlayerIndex,
          diceValue,
          phase: phase === 'ROLLING' ? 'WAITING_ROLL' : phase,
          legalPawnIds,
          friendlyKillPawnIds,
          notification,
          winningTeam,
          freezeStarIndices,
          jumpIconIndex: jumpIconIndices[0] ?? null,
          jumpIconIndices,
          freezeStarRespawnTimes,
          jumpIconRespawnTime: jumpIconRespawnTimes[0] ?? null,
          jumpIconRespawnTimes,
        };
        localStorage.setItem(ACTIVE_MATCH_STORAGE_KEY, JSON.stringify(stateToSave));
      } catch {}
    }
  }, [
    currentScreen,
    players,
    rules,
    gameMode,
    boardTheme,
    activePlayerIndex,
    diceValue,
    phase,
    legalPawnIds,
    friendlyKillPawnIds,
    notification,
    winningTeam,
    freezeStarIndices,
    jumpIconIndices,
    freezeStarRespawnTimes,
    jumpIconRespawnTimes,
  ]);

  // Active in-flight pawn animation
  const [animatingPawn, setAnimatingPawn] = useState<{
    color: PlayerColor;
    pawnId: number;
    coord: Coordinate;
    isHopping: boolean;
    isRewinding?: boolean;
  } | null>(null);

  const activePlayer = players[activePlayerIndex];

  // Sync soundEngine state
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundEngine.enabled = newState;
  };

  // Turn announcement sound in Game screen
  useEffect(() => {
    if (currentScreen === 'GAME' && phase === 'WAITING_ROLL' && activePlayer) {
      // In Classic and other non-team modes: if current active player is finished, immediately skip to next eligible player!
      if (gameMode !== 'TEAM_UP' && isPlayerFinished(activePlayer, gameMode)) {
        const nextIdx = getNextPlayerIndex(players, activePlayerIndex, gameMode);
        if (nextIdx !== activePlayerIndex) {
          setActivePlayerIndex(nextIdx);
          setNotification(`${players[nextIdx].name}'s Turn`);
          return;
        }
      }
      soundEngine.playTurnSound();
    }
  }, [activePlayerIndex, phase, currentScreen, gameMode, players, activePlayer]);

  // AI bot auto-play when in VS_COMPUTER mode
  useEffect(() => {
    if (currentScreen !== 'GAME' || !activePlayer || !activePlayer.isAi) return;

    if (phase === 'WAITING_ROLL' && !isRolling) {
      const timer = setTimeout(() => {
        handleRollDice();
      }, 750);
      return () => clearTimeout(timer);
    }

    if (phase === 'SELECTING_PAWN' && legalPawnIds.length > 0) {
      const controllingPlayer = getControllingPlayer(activePlayer, players, gameMode);
      const timer = setTimeout(() => {
        // AI heuristics:
        // 1. Prioritize capturing opponent pawn
        // 2. Prioritize entering home
        // 3. Prioritize unlocking from base
        // 4. Default to farthest pawn
        let bestPawnId = legalPawnIds[0];
        let bestScore = -1;

        for (const pId of legalPawnIds) {
          const outcome = calculateMoveOutcome(players, controllingPlayer, pId, diceValue, rules, freezeStarIndices, jumpIconIndices);
          let score = 0;
          if (outcome.capturedPawn) score += 100;
          if (outcome.reachedHome) score += 80;
          if (outcome.fromStep === -1) score += 50;
          if (outcome.landedOnSafeCell) score += 30;
          score += outcome.toStep;

          if (score > bestScore) {
            bestScore = score;
            bestPawnId = pId;
          }
        }

        animateAndApplyMove(bestPawnId, diceValue);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, phase, activePlayer, isRolling, legalPawnIds, diceValue, rules, freezeStarIndices, jumpIconIndices, gameMode, players]);

  // Execute Step-by-Step Parabolic Hopping Animation
  const animateAndApplyMove = async (pawnId: number, roll: number) => {
    setPhase('ANIMATING_MOVE');
    setLegalPawnIds([]);
    setFriendlyKillPawnIds([]);

    const controllingPlayer = getControllingPlayer(activePlayer, players, gameMode);
    const pawn = controllingPlayer.pawns[pawnId];
    const outcome = calculateMoveOutcome(
      players,
      controllingPlayer,
      pawnId,
      roll,
      rules,
      freezeStarIndices,
      jumpIconIndices
    );

    const stepPath = getStepPath(controllingPlayer.color, outcome.fromStep, outcome.toStep, pawnId);

    // Initial starting coordinate
    const startCoord = getPawnCoordinate(controllingPlayer.color, outcome.fromStep, pawnId);
    setAnimatingPawn({
      color: controllingPlayer.color,
      pawnId,
      coord: startCoord,
      isHopping: false,
    });

    // Brief frame pause so browser renders initial position before CSS transition starts
    await new Promise(res => setTimeout(res, 25));

    // Traverse each cell along the trajectory
    for (let i = 0; i < stepPath.length; i++) {
      const targetCoord = stepPath[i];
      setAnimatingPawn({
        color: controllingPlayer.color,
        pawnId,
        coord: targetCoord,
        isHopping: true,
      });

      soundEngine.playPawnStep();
      await new Promise(res => setTimeout(res, rules.pawnSpeedMs));
    }

    // Rule 2: Jump Icon landed on / used -> remove immediately and schedule 2-3 minute random respawn
    if (outcome.usedJumpIconIndex !== null && outcome.usedJumpIconIndex !== undefined) {
      const usedJump = outcome.usedJumpIconIndex;
      setJumpIconIndices(prev => prev.filter(idx => idx !== usedJump));
      const jumpDelay = getRandomHazardRespawnDelay(rules.jumpIconRespawnMinMs, rules.jumpIconRespawnMaxMs);
      setJumpIconRespawnTimes(prev => [...prev, Date.now() + jumpDelay]);
    }

    // Rule 2: Jump Icon triggered! Secondary hop (supports forward & backward pushes)
    if (outcome.jumpSteps && outcome.jumpToStep !== undefined && outcome.jumpToStep !== outcome.toStep) {
      soundEngine.playJumpSound();
      if (outcome.jumpSteps < 0) {
        setNotification(`⚡ Backward Jump! Pushed back ${Math.abs(outcome.jumpSteps)} steps!`);
      } else {
        setNotification(`⚡ Jump Icon triggered! Hopping +${outcome.jumpSteps} steps!`);
      }
      await new Promise(res => setTimeout(res, 160));

      const jumpPath = getStepPath(controllingPlayer.color, outcome.toStep, outcome.jumpToStep, pawnId);
      for (let i = 0; i < jumpPath.length; i++) {
        const targetCoord = jumpPath[i];
        setAnimatingPawn({
          color: controllingPlayer.color,
          pawnId,
          coord: targetCoord,
          isHopping: true,
        });

        soundEngine.playPawnStep();
        await new Promise(res => setTimeout(res, rules.pawnSpeedMs));
      }
    }

    // Settled at destination
    setAnimatingPawn(null);

    // Rule 1: Freeze Star landed on / used -> remove immediately and schedule 2-3 minute random respawn
    if (outcome.usedFreezeStarIndex !== null && outcome.usedFreezeStarIndex !== undefined) {
      const usedStar = outcome.usedFreezeStarIndex;
      setFreezeStarIndices(prev => prev.filter(idx => idx !== usedStar));
      const freezeDelay = getRandomHazardRespawnDelay(rules.freezeStarRespawnMinMs, rules.freezeStarRespawnMaxMs);
      setFreezeStarRespawnTimes(prev => [...prev, Date.now() + freezeDelay]);
    }

    const finalToStep = outcome.jumpToStep !== undefined ? outcome.jumpToStep : outcome.toStep;
    const finalReachedHome = finalToStep === 56;
    const effectiveCaptured = outcome.jumpCapturedPawn || outcome.capturedPawn;

    // Apply attacker/controlling player state change immediately so the moving pawn appears at its destination
    let updatedPlayers = players.map(p => {
      if (p.id === controllingPlayer.id) {
        const currentRanks = players.filter(pl => pl.rank !== null).length;
        const updatedPawns = p.pawns.map(item => {
          if (item.id === pawnId) {
            return {
              ...item,
              step: finalToStep,
              isHome: finalReachedHome,
              isFrozen: outcome.landedOnFreezeStar ? true : item.isFrozen,
              frozenTurnsLeft: outcome.landedOnFreezeStar ? 1 : item.frozenTurnsLeft,
            };
          }
          return item;
        });

        const tokensNeeded = gameMode === 'QUICK_MODE' ? 1 : 4;
        const finishedCount = updatedPawns.filter(item => item.isHome || item.step >= 56).length;
        const allFinished = finishedCount >= tokensNeeded;
        // In TEAM_UP, individual players NEVER get rank assigned until team victory!
        const newRank = (gameMode !== 'TEAM_UP' && allFinished && p.rank === null)
          ? currentRanks + 1
          : p.rank;

        return {
          ...p,
          pawns: updatedPawns,
          hasCaptured: p.hasCaptured || effectiveCaptured !== null,
          rank: newRank,
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);

    const movingPlayerState = updatedPlayers.find(p => p.id === controllingPlayer.id);
    const isMovingPlayerFinished = gameMode !== 'TEAM_UP' && !!movingPlayerState && isPlayerFinished(movingPlayerState, gameMode);

    // Play specific landing triggers for attacker
    if (outcome.fromStep === -1) {
      soundEngine.playPawnUnlock();
    } else if (outcome.landedOnFreezeStar) {
      soundEngine.playFreezeSound();
      setNotification(`❄️ ${controllingPlayer.name}'s token stepped on a Freeze Star and is FROZEN!`);
    } else if (outcome.landedOnSafeCell) {
      soundEngine.playSafeStarSound();
    } else if (finalReachedHome) {
      soundEngine.playHomeSound();
      if (isMovingPlayerFinished) {
        soundEngine.playCelebrationRocketSound();
        setNotification(`👑 ${controllingPlayer.name} finished Rank ${movingPlayerState?.rank ?? 1}!`);
      } else {
        setNotification(`🏆 Token reached home! Bonus Roll!`);
      }
    }

    // Capture Rewind Animation: Victim token retraces exact path back to base
    if (effectiveCaptured) {
      soundEngine.playCaptureSound();
      setNotification(`💥 Captured ${effectiveCaptured.playerColor} token! Bonus Roll!`);

      const victim = effectiveCaptured;
      const victimCoord = getPawnCoordinate(victim.playerColor, victim.step, victim.pawnId);

      // Instantly position animatingPawn on the victim token to hide its static board representation
      setAnimatingPawn({
        color: victim.playerColor,
        pawnId: victim.pawnId,
        coord: victimCoord,
        isHopping: false,
        isRewinding: true,
      });

      // Visceral impact pause (120ms)
      await new Promise(res => setTimeout(res, 120));

      // Retrace backwards through every single cell along the perimeter track to start tile (step 0), then into base socket
      const returnPath = getReturnPath(victim.playerColor, victim.step, victim.pawnId);
      const rewindStepMs = Math.max(28, Math.min(48, Math.round(900 / Math.max(1, returnPath.length))));

      for (let i = 0; i < returnPath.length; i++) {
        const targetCoord = returnPath[i];
        setAnimatingPawn({
          color: victim.playerColor,
          pawnId: victim.pawnId,
          coord: targetCoord,
          isHopping: false,
          isRewinding: true,
        });

        soundEngine.playRewindStep(i, returnPath.length);
        await new Promise(res => setTimeout(res, rewindStepMs));
      }

      // Landed safely back into its dedicated yard base socket
      soundEngine.playPawnUnlock();
      await new Promise(res => setTimeout(res, 80));

      // Reset captured victim pawn in players state
      updatedPlayers = updatedPlayers.map(p => {
        if (p.color === victim.playerColor) {
          return {
            ...p,
            pawns: p.pawns.map(item =>
              item.id === victim.pawnId
                ? { ...item, step: -1, isHome: false, isFrozen: false, frozenTurnsLeft: 0 }
                : item
            ),
          };
        }
        return p;
      });

      setPlayers(updatedPlayers);
      setAnimatingPawn(null);
    }

    // Check game termination condition
    if (gameMode === 'TEAM_UP') {
      const teamWinner = checkTeamUpWinner(updatedPlayers);
      if (teamWinner) {
        const finalPlayers = updatedPlayers.map(p => {
          if (p.team === teamWinner) {
            return { ...p, rank: 1 };
          }
          return { ...p, rank: 2 };
        });
        setPlayers(finalPlayers);
        setPhase('GAME_OVER');
        setWinningTeam(teamWinner === 'TEAM_A' ? 0 : 1);
        setIsGameOverOpen(true);
        setNotification(`🏆 ${teamWinner === 'TEAM_A' ? 'TEAM A' : 'TEAM B'} WINS THE MATCH!`);
        return;
      }
    } else {
      const activeRemaining = countActiveRemainingPlayers(updatedPlayers, gameMode);
      if (activeRemaining <= 1) {
        const totalActive = updatedPlayers.filter(p => p.isActive).length;
        const finalPlayers = updatedPlayers.map(p => {
          if (p.isActive && p.rank === null) {
            return { ...p, rank: totalActive };
          }
          return p;
        });
        setPlayers(finalPlayers);
        setPhase('GAME_OVER');
        setIsGameOverOpen(true);
        setNotification('🏆 MATCH OVER!');
        return;
      }
    }

    // Determine Turn Progression
    // In Classic and other non-team modes: a finished player CANNOT earn a bonus roll!
    const seatCanEarnBonus = !isMovingPlayerFinished;

    if (outcome.bonusRoll && seatCanEarnBonus) {
      if (outcome.bonusReason === 'ROLL_SIX') {
        setNotification('🎲 Rolled a 6! Extra Turn!');
      }
      setPhase('WAITING_ROLL');
    } else {
      // Turn passes to next player
      // Thaw handling: decrement frozenTurnsLeft for active player's tokens
      const thawedPlayers = updatedPlayers.map(p => {
        if (p.id === activePlayer.id) {
          const thawedPawns = p.pawns.map(pw => {
            if (pw.id === pawnId && outcome.landedOnFreezeStar) {
              return pw; // Just landed this turn, stay frozen for the next round
            }
            if (pw.isFrozen && pw.frozenTurnsLeft !== undefined) {
              const remaining = pw.frozenTurnsLeft - 1;
              if (remaining <= 0) {
                return { ...pw, isFrozen: false, frozenTurnsLeft: 0 };
              }
              return { ...pw, frozenTurnsLeft: remaining };
            }
            return pw;
          });
          return { ...p, pawns: thawedPawns, consecutiveSixes: 0 };
        }
        return p;
      });

      setPlayers(thawedPlayers);

      const nextIdx = getNextPlayerIndex(thawedPlayers, activePlayerIndex, gameMode);
      setActivePlayerIndex(nextIdx);
      setPhase('WAITING_ROLL');
      setNotification(`${thawedPlayers[nextIdx].name}'s Turn`);
    }
  };

  // Handle Dice Roll
  const handleRollDice = async () => {
    if (phase !== 'WAITING_ROLL' || isRolling) return;

    // Safety guard: in non-team modes, finished players must NEVER roll the dice!
    if (gameMode !== 'TEAM_UP' && isPlayerFinished(activePlayer, gameMode)) {
      const nextIdx = getNextPlayerIndex(players, activePlayerIndex, gameMode);
      if (nextIdx !== activePlayerIndex) {
        setActivePlayerIndex(nextIdx);
        setNotification(`${players[nextIdx].name}'s Turn`);
      }
      return;
    }

    matchRollsCountRef.current += 1;

    // Requirement 2: If player already rolled 2 consecutive sixes, 3rd six is strictly forbidden; roll 1..5!
    let roll: number;
    if (activePlayer.consecutiveSixes >= 2) {
      roll = Math.floor(Math.random() * 5) + 1; // 1..5 strictly guaranteed
    } else if (activePlayer.consecutiveSixes === 1) {
      // Second consecutive six uses unboosted baseline probability
      roll = appRng.d6(0);
    } else {
      // Dynamic single 6 probability boost mid-match every few moves to accelerate gameplay & maintain engagement
      const rollsWithoutSix = rollsWithoutSixRef.current;
      const isPeriodicBoostMove = matchRollsCountRef.current % 3 === 0;

      let boostSix = 0.05; // Base gentle boost
      if (rollsWithoutSix >= 3 || isPeriodicBoostMove) {
        boostSix = 0.18; // Strong boost (~34.7% chance = roughly 1 in 3 chance)
      } else if (rollsWithoutSix >= 2) {
        boostSix = 0.12; // Moderate boost (~28.7% chance)
      }

      roll = appRng.d6(boostSix);
    }

    if (roll === 6) {
      rollsWithoutSixRef.current = 0;
    } else {
      rollsWithoutSixRef.current += 1;
    }

    setDiceValue(roll);
    setIsRolling(true);
    setPhase('ROLLING');
    setNotification(null);

    // Settle roll after 260ms (snappy authentic dice roll matching Dice3D)
    setTimeout(async () => {
      setIsRolling(false);

      // Check Consecutive 6s Count
      let currentSixes = activePlayer.consecutiveSixes;
      if (roll === 6) {
        currentSixes += 1;
      } else {
        currentSixes = 0;
      }

      // Update consecutiveSixes count
      setPlayers(prev =>
        prev.map(p =>
          p.id === activePlayer.id ? { ...p, consecutiveSixes: currentSixes } : p
        )
      );

      // Requirement 4: In TEAM_UP mode, if activePlayer has completed all tokens, calculate legal moves for teammate!
      const controllingPlayer = getControllingPlayer(activePlayer, players, gameMode);
      const isControllingPartner = controllingPlayer.id !== activePlayer.id;

      // Calculate Legal Movable Pawns
      const legalPawns = getLegalPawns(controllingPlayer, roll, rules);

      if (legalPawns.length === 0) {
        // Requirement 3: 0 legal moves (including when last token is in home row and overshoots)
        // -> NEVER repeat turn, turn passes immediately to the next player!
        soundEngine.playNoMoveSound();
        setNotification(
          roll === 6
            ? 'Rolled a 6, but no legal moves! Passing turn...'
            : isControllingPartner
            ? `${controllingPlayer.name} has no legal moves for roll ${roll}! Passing turn...`
            : 'No legal moves! Passing turn...'
        );

        // Reset consecutiveSixes and thaw decrementing when turn passes with 0 legal moves
        setPlayers(prev =>
          prev.map(p => {
            if (p.id === activePlayer.id) {
              const thawedPawns = p.pawns.map(pw => {
                if (pw.isFrozen && pw.frozenTurnsLeft !== undefined) {
                  const remaining = pw.frozenTurnsLeft - 1;
                  if (remaining <= 0) {
                    return { ...pw, isFrozen: false, frozenTurnsLeft: 0 };
                  }
                  return { ...pw, frozenTurnsLeft: remaining };
                }
                return pw;
              });
              return { ...p, pawns: thawedPawns, consecutiveSixes: 0 };
            }
            return p;
          })
        );

        setTimeout(() => {
          const nextIdx = getNextPlayerIndex(players, activePlayerIndex, gameMode);
          setActivePlayerIndex(nextIdx);
          setPhase('WAITING_ROLL');
          setNotification(`${players[nextIdx].name}'s Turn`);
        }, 450);
        return;
      }

      // Legal moves available!
      if (isControllingPartner) {
        setNotification(`${activePlayer.name} finished! Rolled a ${roll} for partner ${controllingPlayer.name}!`);
      }

      if (legalPawns.length === 1 && rules.autoMoveSingleLegal) {
        // Auto-move single eligible pawn
        setPhase('SELECTING_PAWN');
        setLegalPawnIds([legalPawns[0].id]);
        setNotification(
          isControllingPartner
            ? `Auto-moving partner ${controllingPlayer.name}'s pawn #${legalPawns[0].id + 1}`
            : `Auto-moving pawn #${legalPawns[0].id + 1}`
        );
        setTimeout(() => {
          animateAndApplyMove(legalPawns[0].id, roll);
        }, 80);
      } else {
        // Multiple pawns can move, let the player select
        setLegalPawnIds(legalPawns.map(p => p.id));
        setPhase('SELECTING_PAWN');
        setNotification(
          isControllingPartner
            ? `Select partner ${controllingPlayer.name}'s glowing pawn to move!`
            : 'Select a glowing pawn to move!'
        );
      }
    }, 260);
  };

  // Handle Pawn Click from Board
  const handlePawnClick = (pawnId: number) => {
    if (phase !== 'SELECTING_PAWN' || !legalPawnIds.includes(pawnId)) return;
    animateAndApplyMove(pawnId, diceValue);
  };

  // Start Match from Setup Modal
  const handleStartGame = (
    playerCount: 2 | 3 | 4,
    seatingMode: 'opposite' | 'adjacent',
    playerNames: Record<PlayerColor, string>,
    newRules: GameRules,
    playerAvatars?: Record<PlayerColor, string>
  ) => {
    setRules(newRules);

    const activeColors: PlayerColor[] = 
      playerCount === 4
        ? ['RED', 'GREEN', 'YELLOW', 'BLUE']
        : playerCount === 3
        ? ['RED', 'GREEN', 'YELLOW']
        : seatingMode === 'opposite'
        ? ['RED', 'YELLOW']
        : ['RED', 'GREEN'];

    const newPlayers: Player[] = (['RED', 'GREEN', 'YELLOW', 'BLUE'] as PlayerColor[]).map((color, idx) => ({
      id: `p-${color.toLowerCase()}`,
      name: playerNames[color] || `Player ${idx + 1}`,
      color,
      avatar: (playerAvatars && playerAvatars[color]) || ['🦁', '🐯', '🦅', '🐉'][idx],
      pawns: INITIAL_PAWNS(color),
      hasCaptured: false,
      consecutiveSixes: 0,
      rank: null,
      isActive: activeColors.includes(color),
      isAi: gameMode === 'VS_COMPUTER' && idx > 0,
    }));

    setPlayers(newPlayers);
    const firstActiveIdx = newPlayers.findIndex(p => p.isActive);
    setActivePlayerIndex(firstActiveIdx >= 0 ? firstActiveIdx : 0);
    setDiceValue(6);
    setPhase('WAITING_ROLL');
    setLegalPawnIds([]);
    const initialFreeze = generateRandomHazardIndices(4);
    const initialJump = generateRandomHazardIndices(4, initialFreeze);
    setFreezeStarIndices(initialFreeze);
    setJumpIconIndices(initialJump);
    setFreezeStarRespawnTimes([]);
    setJumpIconRespawnTimes([]);
    lastFreezeRelocationRef.current = Date.now();
    lastJumpRelocationRef.current = Date.now();
    matchRollsCountRef.current = 0;
    rollsWithoutSixRef.current = 0;
    setNotification('Match Started! Tap dice to roll.');
    setIsSetupOpen(false);
    setIsGameOverOpen(false);
    setCurrentScreen('GAME');
  };

  // Handle direct rematch with same players, avatars, colors and rules
  const handleRematch = () => {
    try {
      confetti.reset();
    } catch {}
    if (typeof document !== 'undefined') {
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(c => {
        if (c.style.position === 'fixed' || c.style.pointerEvents === 'none') {
          c.remove();
        }
      });
    }

    const resetPlayers: Player[] = players.map(p => ({
      ...p,
      pawns: createPawns(p.color, rules.oneTokenOut),
      hasCaptured: false,
      consecutiveSixes: 0,
      rank: null,
    }));
    setPlayers(resetPlayers);
    const firstActiveIdx = resetPlayers.findIndex(p => p.isActive);
    setActivePlayerIndex(firstActiveIdx >= 0 ? firstActiveIdx : 0);
    setDiceValue(6);
    setPhase('WAITING_ROLL');
    setLegalPawnIds([]);
    setFriendlyKillPawnIds([]);
    setAnimatingPawn(null);
    setIsRolling(false);
    const initialFreeze = generateRandomHazardIndices(4);
    const initialJump = generateRandomHazardIndices(4, initialFreeze);
    setFreezeStarIndices(initialFreeze);
    setJumpIconIndices(initialJump);
    setFreezeStarRespawnTimes([]);
    setJumpIconRespawnTimes([]);
    lastFreezeRelocationRef.current = Date.now();
    lastJumpRelocationRef.current = Date.now();
    matchRollsCountRef.current = 0;
    rollsWithoutSixRef.current = 0;
    setWinningTeam(null);
    setIsGameOverOpen(false);
    setNotification('Rematch Started! Tap dice to roll.');
    try {
      localStorage.removeItem(ACTIVE_MATCH_STORAGE_KEY);
    } catch {}
  };

  // Start Pass & Play match from Page 5A (Classic) or Page 5B (Team Up)
  const handleStartPassNPlayMatch = (
    newPlayers: Player[],
    newRules: GameRules,
    mode: GameMode = 'PASS_N_PLAY'
  ) => {
    setRules(newRules);
    setGameMode(mode);
    setPlayers(newPlayers);
    const firstActiveIdx = newPlayers.findIndex(p => p.isActive);
    setActivePlayerIndex(firstActiveIdx >= 0 ? firstActiveIdx : 0);
    setDiceValue(6);
    setPhase('WAITING_ROLL');
    setLegalPawnIds([]);
    const initialFreeze = generateRandomHazardIndices(4);
    const initialJump = generateRandomHazardIndices(4, initialFreeze);
    setFreezeStarIndices(initialFreeze);
    setJumpIconIndices(initialJump);
    setFreezeStarRespawnTimes([]);
    setJumpIconRespawnTimes([]);
    lastFreezeRelocationRef.current = Date.now();
    lastJumpRelocationRef.current = Date.now();
    matchRollsCountRef.current = 0;
    rollsWithoutSixRef.current = 0;
    setNotification(
      newRules.oneTokenOut
        ? '1 Token Out Active! Tap glowing dice to roll.'
        : 'Match Started! Tap glowing dice to roll.'
    );
    setIsSetupOpen(false);
    setIsGameOverOpen(false);
    setCurrentScreen('GAME');

    // Auto-save the fresh game
    saveCurrentGame({
      gameMode: mode,
      boardTheme,
      rules: newRules,
      players: newPlayers,
      activePlayerIndex: firstActiveIdx >= 0 ? firstActiveIdx : 0,
      freezeStarIndices: initialFreeze,
      jumpIconIndex: initialJump[0] ?? null,
      jumpIconIndices: initialJump,
      freezeStarRespawnTimes: [],
      jumpIconRespawnTime: null,
      jumpIconRespawnTimes: [],
    });
  };

  // Load a Saved Game
  const handleLoadSavedGame = (savedGame: SavedGame) => {
    setBoardTheme(savedGame.boardTheme);
    setGameMode(savedGame.gameMode);
    setRules(savedGame.rules);
    setPlayers(savedGame.players);
    setActivePlayerIndex(savedGame.activePlayerIndex);
    setDiceValue(6);
    setPhase('WAITING_ROLL');
    setLegalPawnIds([]);
    const loadedFreeze = savedGame.freezeStarIndices ?? generateRandomHazardIndices(4);
    let loadedJump: number[] = [];
    if (Array.isArray(savedGame.jumpIconIndices) && savedGame.jumpIconIndices.length > 0) {
      loadedJump = savedGame.jumpIconIndices;
    } else if (savedGame.jumpIconIndex !== undefined && savedGame.jumpIconIndex !== null) {
      loadedJump = [savedGame.jumpIconIndex];
    } else {
      loadedJump = generateRandomHazardIndices(4, loadedFreeze);
    }
    setFreezeStarIndices(loadedFreeze);
    setJumpIconIndices(loadedJump);
    setFreezeStarRespawnTimes(savedGame.freezeStarRespawnTimes || []);
    setJumpIconRespawnTimes(savedGame.jumpIconRespawnTimes || (savedGame.jumpIconRespawnTime !== null && savedGame.jumpIconRespawnTime !== undefined ? [savedGame.jumpIconRespawnTime] : []));
    lastFreezeRelocationRef.current = Date.now();
    lastJumpRelocationRef.current = Date.now();
    matchRollsCountRef.current = 0;
    rollsWithoutSixRef.current = 0;
    setNotification(`Resumed: ${savedGame.title}`);
    setIsSetupOpen(false);
    setIsGameOverOpen(false);
    setCurrentScreen('GAME');
  };

  const handleEnterFromSplash = () => {
    try {
      localStorage.setItem(SPLASH_SEEN_STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('Unable to persist splash state:', e);
    }
    setCurrentScreen('HOME');
  };

  const handleConfirmExit = () => {
    soundEngine.playButtonClick();
    setIsExitConfirmOpen(false);
    setIsGameMenuOpen(false);
    setCurrentScreen('HOME');
    try {
      localStorage.removeItem(ACTIVE_MATCH_STORAGE_KEY);
    } catch {}
  };

  const handleCancelExit = () => {
    soundEngine.playButtonClick();
    setIsExitConfirmOpen(false);
  };

  const getPlayerByColor = (color: PlayerColor) => players.find(p => p.color === color)!;

  return (
    <MobileFrame>
      {currentScreen === 'SPLASH' ? (
        /* ==================== 0. PAGE 1: SPLASH SCREEN (First Open Only) ==================== */
        <SplashScreen
          onStart={handleEnterFromSplash}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      ) : currentScreen === 'HOME' ? (
        /* ==================== 1. HOME SCREEN / LOBBY (Page 3 / Image 2) ==================== */
        <HomeScreen
          onStartPassNPlay={() => {
            soundEngine.playButtonClick();
            setCurrentScreen('PASS_N_PLAY_SETUP');
          }}
          onStartVsComputer={() => {
            setGameMode('VS_COMPUTER');
            setIsSetupOpen(true);
          }}
          onStartQuickMode={() => {
            setGameMode('QUICK_MODE');
            setIsSetupOpen(true);
          }}
          onStartTeamUp={() => {
            setGameMode('TEAM_UP');
            setIsSetupOpen(true);
          }}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          currentTheme={boardTheme}
          onSelectTheme={(t) => setBoardTheme(t)}
          onOpenSettings={() => setIsSetupOpen(true)}
          onShowSplash={() => setCurrentScreen('SPLASH')}
        />
      ) : currentScreen === 'PASS_N_PLAY_SETUP' ? (
        /* ==================== 2. PAGE 4: PASS & PLAY SETUP (Image Reference) ==================== */
        <PassNPlaySetupScreen
          onBack={() => {
            setCurrentScreen('HOME');
          }}
          onNext={(subMode, token, theme) => {
            setSelectedToken(token);
            setBoardTheme(theme);
            if (subMode === 'CLASSIC') {
              setGameMode('PASS_N_PLAY');
              setCurrentScreen('PASS_N_PLAY_CLASSIC_SETUP');
            } else if (subMode === 'TEAM_UP') {
              setGameMode('TEAM_UP');
              setCurrentScreen('PASS_N_PLAY_TEAM_UP_SETUP');
            } else {
              setGameMode('QUICK_MODE');
              setCurrentScreen('PASS_N_PLAY_CLASSIC_SETUP');
            }
          }}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          currentTheme={boardTheme}
          onSelectTheme={(t) => setBoardTheme(t)}
        />
      ) : currentScreen === 'PASS_N_PLAY_CLASSIC_SETUP' ? (
        /* ==================== 3. PAGE 5A: CLASSIC PLAYER SETUP (Image 1 Reference) ==================== */
        <PassNPlayClassicSetupScreen
          onBack={() => setCurrentScreen('PASS_N_PLAY_SETUP')}
          onStartGame={(newPlayers, newRules) => handleStartPassNPlayMatch(newPlayers, newRules, gameMode)}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          selectedToken={selectedToken}
          boardTheme={boardTheme}
          onLoadSavedGame={handleLoadSavedGame}
        />
      ) : currentScreen === 'PASS_N_PLAY_TEAM_UP_SETUP' ? (
        /* ==================== 4. PAGE 5B: TEAM UP PLAYER SETUP (Image 2 Reference) ==================== */
        <PassNPlayTeamUpSetupScreen
          onBack={() => setCurrentScreen('PASS_N_PLAY_SETUP')}
          onStartGame={(newPlayers, newRules) => {
            const config = { players: newPlayers, rules: newRules };
            setPendingTeamUpConfig(config);
            try {
              localStorage.setItem('ludo_pending_teamup_config', JSON.stringify(config));
            } catch {}
            setCurrentScreen('TEAM_UP_TASK_SELECTION');
          }}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          selectedToken={selectedToken}
          boardTheme={boardTheme}
          onLoadSavedGame={handleLoadSavedGame}
        />
      ) : currentScreen === 'TEAM_UP_TASK_SELECTION' ? (
        /* ==================== 5. PAGE 5C: TEAM UP PENALTY TASK SELECTION ==================== */
        <TeamUpTaskSelectionScreen
          onBack={() => setCurrentScreen('PASS_N_PLAY_TEAM_UP_SETUP')}
          onStartGame={(_chosenTask) => {
            let playersToStart = pendingTeamUpConfig?.players;
            let rulesToStart = pendingTeamUpConfig?.rules;

            if (!playersToStart || playersToStart.length !== 4) {
              playersToStart = [
                {
                  id: 'p-blue',
                  name: 'Player 1',
                  color: 'BLUE',
                  tokenColorHex: 'var(--seat-blue)',
                  avatar: '🐉',
                  team: 'TEAM_A',
                  pawns: INITIAL_PAWNS('BLUE'),
                  hasCaptured: false,
                  consecutiveSixes: 0,
                  rank: null,
                  isActive: true,
                },
                {
                  id: 'p-red',
                  name: 'Player 2',
                  color: 'RED',
                  tokenColorHex: 'var(--seat-red)',
                  avatar: '🦁',
                  team: 'TEAM_B',
                  pawns: INITIAL_PAWNS('RED'),
                  hasCaptured: false,
                  consecutiveSixes: 0,
                  rank: null,
                  isActive: true,
                },
                {
                  id: 'p-green',
                  name: 'Player 3',
                  color: 'GREEN',
                  tokenColorHex: 'var(--seat-green)',
                  avatar: '🐯',
                  team: 'TEAM_A',
                  pawns: INITIAL_PAWNS('GREEN'),
                  hasCaptured: false,
                  consecutiveSixes: 0,
                  rank: null,
                  isActive: true,
                },
                {
                  id: 'p-yellow',
                  name: 'Player 4',
                  color: 'YELLOW',
                  tokenColorHex: 'var(--seat-purple)',
                  avatar: '🦅',
                  team: 'TEAM_B',
                  pawns: INITIAL_PAWNS('YELLOW'),
                  hasCaptured: false,
                  consecutiveSixes: 0,
                  rank: null,
                  isActive: true,
                },
              ];
            }

            if (!rulesToStart) {
              rulesToStart = {
                openOnSixOnly: true,
                mustCaptureToEnterHome: false,
                threeSixesForfeit: true,
                bonusOnCapture: true,
                bonusOnHomeReach: true,
                safeZoneMode: 'standard',
                pawnSpeedMs: 80,
                autoMoveSingleLegal: true,
                friendlyKill: true,
                oneTokenOut: false,
              };
            }

            handleStartPassNPlayMatch(playersToStart, rulesToStart, 'TEAM_UP');
          }}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      ) : (
        /* ==================== 2. PASS & PLAY GAME ARENA (Reference Image Board) ==================== */
        <div className="w-full h-full ludo-king-match-bg text-slate-100 flex flex-col justify-between p-1.5 sm:p-2.5 select-none overflow-y-auto">
          
          {/* Top In-Game Header */}
          <header className="w-full flex items-center justify-center px-2.5 py-2 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="Ludo" className="w-5 h-5 rounded-md shadow drop-shadow-sm" />
              <span className="text-xs sm:text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                LUDO
                {rules.oneTokenOut && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                    1 Token Out
                  </span>
                )}
              </span>
            </div>
          </header>

          {/* Central Game Arena Matching Reference Image */}
          <main className="w-full flex-1 flex flex-col justify-center my-1 sm:my-1.5">
            
            {/* Top HUDs: Red (Top-Left) & Green (Top-Right) */}
            <div className="grid grid-cols-2 gap-3 mb-1.5 sm:mb-2 px-1">
              <PlayerHUD
                player={getPlayerByColor('RED')}
                isActiveTurn={activePlayer.color === 'RED'}
                phase={phase}
                diceValue={diceValue}
                isRolling={isRolling}
                onRollDice={handleRollDice}
                position="top-left"
              />
              <PlayerHUD
                player={getPlayerByColor('GREEN')}
                isActiveTurn={activePlayer.color === 'GREEN'}
                phase={phase}
                diceValue={diceValue}
                isRolling={isRolling}
                onRollDice={handleRollDice}
                position="top-right"
              />
            </div>

            {/* Central Ludo Board (with player's selected colors) */}
            <LudoBoard
              players={players}
              activePlayer={activePlayer}
              phase={phase}
              legalPawnIds={legalPawnIds}
              friendlyKillPawnIds={friendlyKillPawnIds}
              animatingPawn={animatingPawn}
              onPawnClick={handlePawnClick}
              theme={boardTheme}
              freezeStarIndices={freezeStarIndices}
              jumpIconIndex={jumpIconIndices.length > 0 ? jumpIconIndices[0] : null}
              jumpIconIndices={jumpIconIndices}
              movablePlayerId={getControllingPlayer(activePlayer, players, gameMode).id}
              selectedTokenId={selectedToken}
              pawnSpeedMs={rules.pawnSpeedMs}
            />

            {/* Bottom HUDs: Blue (Bottom-Left) & Yellow (Bottom-Right) */}
            <div className="grid grid-cols-2 gap-3 mt-1.5 sm:mt-2 px-1">
              <PlayerHUD
                player={getPlayerByColor('BLUE')}
                isActiveTurn={activePlayer.color === 'BLUE'}
                phase={phase}
                diceValue={diceValue}
                isRolling={isRolling}
                onRollDice={handleRollDice}
                position="bottom-left"
              />
              <PlayerHUD
                player={getPlayerByColor('YELLOW')}
                isActiveTurn={activePlayer.color === 'YELLOW'}
                phase={phase}
                diceValue={diceValue}
                isRolling={isRolling}
                onRollDice={handleRollDice}
                position="bottom-right"
              />
            </div>

          </main>

          {/* Glassmorphic Mode Badge with 3-Dot Menu on Left */}
          <footer className="w-full relative flex items-center justify-center py-1.5 px-2.5 mt-auto min-h-[44px]">
            {/* 3-Dot Button on Left Side of Bottom */}
            <div className="absolute left-2.5 bottom-1 z-30">
              <button
                onClick={() => {
                  soundEngine.playButtonClick();
                  setIsGameMenuOpen(prev => !prev);
                }}
                className={`p-2 rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer border ${
                  isGameMenuOpen
                    ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80 backdrop-blur-md'
                }`}
                title="Options"
                aria-label="Game Menu"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* 3-Dot Dropdown Menu */}
              {isGameMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsGameMenuOpen(false)}
                  />
                  <div className="absolute bottom-full left-0 mb-2 w-36 rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <button
                      onClick={() => {
                        soundEngine.playButtonClick();
                        setIsGameMenuOpen(false);
                        setIsExitConfirmOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-500/20 active:bg-rose-500/30 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Exit</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Center Bottom Glassmorphic Mode Badge (Replacing dots indicator) */}
            <div className="flex items-center justify-center pointer-events-none select-none">
              <div className="px-4 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.45)] flex items-center justify-center">
                <span className="text-xs font-black tracking-widest uppercase text-amber-300 drop-shadow-sm">
                  {gameMode === 'PASS_N_PLAY'
                    ? 'Classic'
                    : gameMode === 'TEAM_UP'
                    ? 'Team Up'
                    : gameMode === 'QUICK_MODE'
                    ? 'Quick'
                    : 'Vs Computer'}
                </span>
              </div>
            </div>
          </footer>

        </div>
      )}

      {/* Setup / Custom Rules Modal (Available from both Home & Game screens) */}
      <SetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        gameMode={gameMode}
        onStartGame={handleStartGame}
      />

      {/* Game Over Celebration Modal */}
      <GameOverModal
        isOpen={isGameOverOpen}
        players={players}
        gameMode={gameMode}
        winningTeam={winningTeam}
        onRestart={handleRematch}
        onHome={() => {
          setIsGameOverOpen(false);
          setCurrentScreen('HOME');
          try {
            localStorage.removeItem(ACTIVE_MATCH_STORAGE_KEY);
          } catch {}
        }}
      />

      {/* Exit Confirmation Dialog (Simple theme matching game) */}
      {isExitConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Subtle glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <h3 className="text-base font-bold text-white mb-5 relative z-10">
              Do you want to exit?
            </h3>

            <div className="flex items-center gap-3 relative z-10">
              <button
                onClick={handleCancelExit}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-bold text-sm border border-slate-700 transition cursor-pointer"
              >
                No
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileFrame>
  );
};

export default App;
