import React, { useState, useEffect } from 'react';
import { Player, PlayerColor, GameRules, SavedGame, TokenId, BoardTheme } from '../types/ludo';
import { soundEngine } from '../utils/soundEngine';
import {
  TokenPreviewSVG,
  LUDO_TOKEN_PALETTE,
  NINE_TOKEN_COLORS,
  normalizeTokenHex,
  TokenColorOption,
} from './TokenPreviewSVG';
import {
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Shield,
  Swords,
  Palette,
} from 'lucide-react';

interface PassNPlayTeamUpSetupScreenProps {
  onBack: () => void;
  onStartGame: (players: Player[], rules: GameRules) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  selectedToken?: TokenId;
  boardTheme?: BoardTheme;
  onLoadSavedGame?: (savedGame: SavedGame) => void;
}

export type TeamUpPlayerKey = 'p1' | 'p3' | 'p2' | 'p4';

const STORAGE_KEY_TEAMUP_NAMES = 'ludo_pnp_teamup_names';
const STORAGE_KEY_TEAMUP_COLORS = 'ludo_pnp_teamup_colors';
const STORAGE_KEY_FRIENDLY_KILL = 'ludo_pnp_teamup_friendly_kill';

// Default initial colors matching classic quadrant standards:
// Team A: Blue (P1) & Green (P3)
// Team B: Red (P2) & Yellow (P4)
export const DEFAULT_TEAMUP_COLORS: Record<TeamUpPlayerKey, string> = {
  p1: '#3a72db', // Royal Blue
  p3: '#78f62f', // Green
  p2: '#b21919', // Crimson Red
  p4: '#e6cc46', // Lemon Yellow
};

export const PassNPlayTeamUpSetupScreen: React.FC<PassNPlayTeamUpSetupScreenProps> = ({
  onBack,
  onStartGame,
  soundEnabled,
  onToggleSound,
  selectedToken = 'pin',
  boardTheme = 'classic',
}) => {
  // Player Names: P1 (Team A), P3 (Team A), P2 (Team B), P4 (Team B)
  const [playerNames, setPlayerNames] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEAMUP_NAMES);
      if (saved) return JSON.parse(saved);
    } catch { }
    return {
      p1: 'Player 1',
      p3: 'Player 3',
      p2: 'Player 2',
      p4: 'Player 4',
    };
  });

  // Player Token Colors from the 9-Color Palette (Strictly 4 distinct colors)
  const [playerColors, setPlayerColors] = useState<Record<TeamUpPlayerKey, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEAMUP_COLORS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.p1 && parsed.p3 && parsed.p2 && parsed.p4) {
          (['p1', 'p3', 'p2', 'p4'] as TeamUpPlayerKey[]).forEach(k => {
            if (typeof parsed[k] === 'string') parsed[k] = normalizeTokenHex(parsed[k]);
          });
          const values = [parsed.p1, parsed.p3, parsed.p2, parsed.p4];
          if (new Set(values.map((v: string) => v.toLowerCase())).size === 4) {
            return parsed;
          }
        }
      }
    } catch { }
    return DEFAULT_TEAMUP_COLORS;
  });

  // Friendly Kill Checkbox: default true (checked matching screenshot)
  const [friendlyKill, setFriendlyKill] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FRIENDLY_KILL);
      if (saved !== null) return saved === 'true';
    } catch { }
    return true;
  });

  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [activePickerPlayer, setActivePickerPlayer] = useState<TeamUpPlayerKey | null>(null);
  const [rollingDiceIndex, setRollingDiceIndex] = useState<number | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEAMUP_NAMES, JSON.stringify(playerNames));
      localStorage.setItem(STORAGE_KEY_TEAMUP_COLORS, JSON.stringify(playerColors));
      localStorage.setItem(STORAGE_KEY_FRIENDLY_KILL, friendlyKill.toString());
    } catch { }
  }, [playerNames, playerColors, friendlyKill]);

  const handleNameChange = (key: string, value: string) => {
    setPlayerNames(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDiceRollPreview = (idx: number) => {
    soundEngine.playDiceRollSound();
    setRollingDiceIndex(idx);

    // Randomize 4 distinct colors for all 4 team players from the 9-Color Palette
    const shuffled = [...NINE_TOKEN_COLORS].sort(() => Math.random() - 0.5);
    setPlayerColors({
      p1: shuffled[0].hex,
      p2: shuffled[1].hex,
      p3: shuffled[2].hex,
      p4: shuffled[3].hex,
    });

    setTimeout(() => {
      setRollingDiceIndex(null);
    }, 700);
  };

  const handleToggleFriendlyKill = () => {
    soundEngine.playButtonClick();
    setFriendlyKill(prev => !prev);
  };

  // Compute unselected colors from the 9-Color Palette
  const selectedHexes = Object.values(playerColors).map(h => h.toLowerCase());
  const unselectedColors = NINE_TOKEN_COLORS.filter(
    item => !selectedHexes.includes(item.hex.toLowerCase())
  );

  const getPlayerMeta = (playerKey: TeamUpPlayerKey) => {
    const isTeamA = playerKey === 'p1' || playerKey === 'p3';
    const defaultName =
      playerKey === 'p1' ? 'Player 1' : playerKey === 'p3' ? 'Player 3' : playerKey === 'p2' ? 'Player 2' : 'Player 4';
    const name = playerNames[playerKey] || defaultName;
    const currentColor = playerColors[playerKey];
    const colorOption = NINE_TOKEN_COLORS.find(c => c.hex.toLowerCase() === normalizeTokenHex(currentColor));
    return {
      name,
      teamLabel: isTeamA ? 'Team A' : 'Team B',
      currentColor,
      colorName: colorOption?.name || 'Custom',
      colorOption,
    };
  };

  const getOccupiedPlayers = (currentKey: TeamUpPlayerKey) => {
    const keys: TeamUpPlayerKey[] = ['p1', 'p3', 'p2', 'p4'];
    return keys
      .filter(k => k !== currentKey)
      .map(k => {
        const meta = getPlayerMeta(k);
        return {
          playerKey: k,
          name: meta.name,
          colorName: meta.colorName,
          hex: playerColors[k],
          teamLabel: meta.teamLabel,
        };
      });
  };

  const handleOpenColorPicker = (key: TeamUpPlayerKey) => {
    soundEngine.playButtonClick();
    setActivePickerPlayer(key);
  };

  const handleSelectColor = (newHex: string) => {
    if (!activePickerPlayer) return;
    soundEngine.playButtonClick();
    setPlayerColors(prev => ({
      ...prev,
      [activePickerPlayer]: newHex,
    }));
    setActivePickerPlayer(null);
  };

  const handleSwapWithPlayer = (targetKey: TeamUpPlayerKey) => {
    if (!activePickerPlayer || activePickerPlayer === targetKey) return;
    soundEngine.playButtonClick();
    setPlayerColors(prev => {
      const activeColor = prev[activePickerPlayer];
      const targetColor = prev[targetKey];
      return {
        ...prev,
        [activePickerPlayer]: targetColor,
        [targetKey]: activeColor,
      };
    });
    setActivePickerPlayer(null);
  };

  // Build Team Up Players (2v2) with selected token colors
  // Team A: P1 & P3
  // Team B: P2 & P4
  const buildTeamUpPlayers = (oneTokenOut: boolean): Player[] => {
    const createInitialPawns = (color: PlayerColor) => [
      { id: 0, color, step: oneTokenOut ? 0 : -1, isHome: false },
      { id: 1, color, step: -1, isHome: false },
      { id: 2, color, step: -1, isHome: false },
      { id: 3, color, step: -1, isHome: false },
    ];

    return [
      {
        id: 'p-blue',
        name: playerNames.p1 || 'Player 1',
        color: 'BLUE',
        tokenColorHex: playerColors.p1,
        tokenId: selectedToken,
        avatar: '🐉',
        team: 'TEAM_A',
        pawns: createInitialPawns('BLUE'),
        hasCaptured: false,
        consecutiveSixes: 0,
        rank: null,
        isActive: true,
      },
      {
        id: 'p-red',
        name: playerNames.p2 || 'Player 2',
        color: 'RED',
        tokenColorHex: playerColors.p2,
        tokenId: selectedToken,
        avatar: '🦁',
        team: 'TEAM_B',
        pawns: createInitialPawns('RED'),
        hasCaptured: false,
        consecutiveSixes: 0,
        rank: null,
        isActive: true,
      },
      {
        id: 'p-green',
        name: playerNames.p3 || 'Player 3',
        color: 'GREEN',
        tokenColorHex: playerColors.p3,
        tokenId: selectedToken,
        avatar: '🐯',
        team: 'TEAM_A',
        pawns: createInitialPawns('GREEN'),
        hasCaptured: false,
        consecutiveSixes: 0,
        rank: null,
        isActive: true,
      },
      {
        id: 'p-yellow',
        name: playerNames.p4 || 'Player 4',
        color: 'YELLOW',
        tokenColorHex: playerColors.p4,
        tokenId: selectedToken,
        avatar: '🦅',
        team: 'TEAM_B',
        pawns: createInitialPawns('YELLOW'),
        hasCaptured: false,
        consecutiveSixes: 0,
        rank: null,
        isActive: true,
      },
    ];
  };

  const handleStartTeamUpGame = (oneTokenOut: boolean) => {
    soundEngine.playGameStartSound();
    const finalPlayers = buildTeamUpPlayers(oneTokenOut);
    const rules: GameRules = {
      openOnSixOnly: true,
      mustCaptureToEnterHome: false,
      threeSixesForfeit: true,
      bonusOnCapture: true,
      bonusOnHomeReach: true,
      safeZoneMode: 'standard',
      pawnSpeedMs: 210,
      autoMoveSingleLegal: true,
      friendlyKill,
      oneTokenOut,
    };
    onStartGame(finalPlayers, rules);
  };

  const activePlayerMeta = activePickerPlayer ? getPlayerMeta(activePickerPlayer) : null;
  const occupiedPlayers = activePickerPlayer ? getOccupiedPlayers(activePickerPlayer) : [];

  return (
    <div className="relative w-full h-full select-none overflow-hidden flex items-center justify-center font-['Nunito',sans-serif] bg-[#07245c]">
      {/* 
        Mobile Stage Container:
        Locks the exact 469:1024 native mobile game aspect ratio matching HomeScreen.tsx.
        Ensures perfect proportions, tight vertical rhythm, and prevents oversized stretching on larger viewports.
      */}
      <div 
        className="relative mx-auto h-full max-h-full max-w-full overflow-hidden flex flex-col justify-between shadow-2xl p-2 sm:p-2.5"
        style={{
          aspectRatio: '469 / 1024',
          maxWidth: '100%',
          maxHeight: '100%',
          width: '100%',
        }}
      >
        {/* 1. Underlying Dark Lobby Backdrop */}
        <img
          src="/page2_reference.jpg"
          alt="Lobby Backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none filter brightness-[0.20] contrast-[1.15]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02183d]/90 via-[#03235b]/85 to-[#021535]/95 pointer-events-none" />

        {/* 2. Top Header Status Bar */}
        <div className="relative z-20 w-full pt-1 px-1 flex items-center justify-between pointer-events-auto">
          {/* Profile Card on Left */}
          <div className="flex items-center gap-1.5">
            <div className="relative w-8 h-8 rounded-lg border-2 border-amber-400 bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden shadow-md flex items-center justify-center">
              <span className="text-base">🦁</span>
              <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center text-[8px] font-black text-slate-950 border border-amber-200 shadow">
                1
              </div>
            </div>
          </div>

          {/* Currency Counters */}
          <div className="flex items-center gap-1.5">
            {/* Diamonds */}
            <div className="flex items-center gap-1 bg-[#061e47]/90 border border-sky-400/60 rounded-full px-2 py-0.5 shadow-md">
              <span className="text-[11px]">💎</span>
              <span className="text-[11px] font-black text-white">62</span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black leading-none ml-0.5">
                +
              </span>
            </div>

            {/* Coins */}
            <div className="flex items-center gap-1 bg-[#061e47]/90 border border-amber-400/60 rounded-full px-2 py-0.5 shadow-md">
              <span className="text-[11px]">🪙</span>
              <span className="text-[11px] font-black text-white">8,350</span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black leading-none ml-0.5">
                +
              </span>
            </div>

            {/* Audio toggle */}
            <button
              onClick={onToggleSound}
              aria-label="Toggle sound"
              className="w-7 h-7 rounded-lg bg-slate-900/80 border border-amber-400/40 flex items-center justify-center text-amber-300 hover:text-amber-200 transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
            </button>
          </div>
        </div>

      {/* 3. Main Center Setup Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-3 max-w-sm mx-auto w-full my-auto">
        {/* Title Bar with Help Question Mark Button (Matching Image 1) */}
        <div className="w-full flex items-center justify-center gap-2 mb-2 relative">
          <h2 className="text-base sm:text-lg font-black tracking-wide text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase">
            CHOOSE COLOR AND NAME
          </h2>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              setShowHelpModal(true);
            }}
            aria-label="Team Up Help"
            className="w-6 h-6 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 border border-amber-200 flex items-center justify-center text-slate-950 font-black text-xs shadow hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            ?
          </button>
        </div>

        {/* Team Up Configuration Card */}
        <div className="w-full rounded-2xl bg-gradient-to-b from-[#0b3b8c]/95 via-[#072c6e]/95 to-[#041e52]/98 border-2 border-sky-500/40 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          <div className="space-y-3">

            {/* ================= TEAM A (Top Section) ================= */}
            <div className="flex items-center gap-2.5">
              {/* TEAM A Hanging Badge */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-6 h-2 border-l border-r border-sky-200/60 mx-auto" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-b from-sky-400 to-sky-600 border-2 border-white shadow-lg flex flex-col items-center justify-center text-center">
                  <span className="text-[8px] font-black tracking-wider text-sky-100 leading-none">TEAM</span>
                  <span className="text-xs font-black text-white leading-none">A</span>
                </div>
              </div>

              {/* Team A Players */}
              <div className="flex-1 space-y-1.5">
                {/* Player 1 (Team A) */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {/* Clickable Token Box with crisp white background */}
                  <button
                    type="button"
                    onClick={() => handleOpenColorPicker('p1')}
                    aria-label={`Select token color for ${playerNames.p1 || 'Player 1'}`}
                    title={`Click to choose color for ${playerNames.p1 || 'Player 1'}`}
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border-2 flex items-center justify-center shrink-0 shadow-md transition-all duration-150 cursor-pointer group hover:scale-105 active:scale-95 ${
                      activePickerPlayer === 'p1'
                        ? 'border-amber-400 ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-105'
                        : 'border-sky-400 hover:border-amber-400 shadow-[0_2px_6px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    <TokenPreviewSVG
                      customHex={playerColors.p1}
                      color="BLUE"
                      tokenType={selectedToken}
                      className="w-6 h-7 group-hover:scale-110 transition-transform drop-shadow-sm"
                    />
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 border border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-950 shadow">
                      🎨
                    </span>
                  </button>

                  {/* Player Name Input: Decreased width size */}
                  <input
                    type="text"
                    value={playerNames.p1}
                    onChange={(e) => handleNameChange('p1', e.target.value)}
                    maxLength={14}
                    className="w-28 sm:w-36 px-2 py-0.5 rounded-lg bg-white border-2 border-dashed border-red-500/80 text-slate-900 font-extrabold text-xs shadow-inner outline-none focus:border-red-600 transition text-center"
                    placeholder="Player 1"
                  />

                  {/* Dice Preview Button */}
                  <button
                    onClick={() => handleDiceRollPreview(1)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-300 shadow-md flex items-center justify-center text-slate-900 text-sm font-black active:scale-90 transition cursor-pointer shrink-0 ${
                      rollingDiceIndex === 1 ? 'animate-spin' : ''
                    }`}
                  >
                    🎲
                  </button>
                </div>

                {/* Player 3 (Team A) */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {/* Clickable Token Box with crisp white background */}
                  <button
                    type="button"
                    onClick={() => handleOpenColorPicker('p3')}
                    aria-label={`Select token color for ${playerNames.p3 || 'Player 3'}`}
                    title={`Click to choose color for ${playerNames.p3 || 'Player 3'}`}
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border-2 flex items-center justify-center shrink-0 shadow-md transition-all duration-150 cursor-pointer group hover:scale-105 active:scale-95 ${
                      activePickerPlayer === 'p3'
                        ? 'border-amber-400 ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-105'
                        : 'border-sky-400 hover:border-amber-400 shadow-[0_2px_6px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    <TokenPreviewSVG
                      customHex={playerColors.p3}
                      color="GREEN"
                      tokenType={selectedToken}
                      className="w-6 h-7 group-hover:scale-110 transition-transform drop-shadow-sm"
                    />
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 border border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-950 shadow">
                      🎨
                    </span>
                  </button>

                  {/* Player Name Input: Decreased width size */}
                  <input
                    type="text"
                    value={playerNames.p3}
                    onChange={(e) => handleNameChange('p3', e.target.value)}
                    maxLength={14}
                    className="w-28 sm:w-36 px-2 py-0.5 rounded-lg bg-white border-2 border-dashed border-red-500/80 text-slate-900 font-extrabold text-xs shadow-inner outline-none focus:border-red-600 transition text-center"
                    placeholder="Player 3"
                  />

                  {/* Dice Preview Button */}
                  <button
                    onClick={() => handleDiceRollPreview(3)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-300 shadow-md flex items-center justify-center text-slate-900 text-sm font-black active:scale-90 transition cursor-pointer shrink-0 ${
                      rollingDiceIndex === 3 ? 'animate-spin' : ''
                    }`}
                  >
                    🎲
                  </button>
                </div>
              </div>
            </div>

            {/* ================= Horizontal Golden Line with VS Badge ================= */}
            <div className="relative flex items-center justify-center my-1">
              <div className="w-full h-0.5 bg-gradient-to-r from-amber-400/20 via-amber-400 to-amber-400/20" />
              <div className="absolute px-2 py-0.5 rounded-full bg-gradient-to-b from-[#124ea8] to-[#072c6e] border-2 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.6)] flex items-center justify-center">
                <span className="text-[10px] font-black tracking-wider text-amber-200">
                  VS
                </span>
              </div>
            </div>

            {/* ================= TEAM B (Bottom Section) ================= */}
            <div className="flex items-center gap-2.5">
              {/* TEAM B Hanging Badge */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-6 h-2 border-l border-r border-rose-200/60 mx-auto" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-b from-rose-500 to-rose-700 border-2 border-white shadow-lg flex flex-col items-center justify-center text-center">
                  <span className="text-[8px] font-black tracking-wider text-rose-100 leading-none">TEAM</span>
                  <span className="text-xs font-black text-white leading-none">B</span>
                </div>
              </div>

              {/* Team B Players */}
              <div className="flex-1 space-y-1.5">
                {/* Player 2 (Team B) */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {/* Clickable Token Box with crisp white background */}
                  <button
                    type="button"
                    onClick={() => handleOpenColorPicker('p2')}
                    aria-label={`Select token color for ${playerNames.p2 || 'Player 2'}`}
                    title={`Click to choose color for ${playerNames.p2 || 'Player 2'}`}
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border-2 flex items-center justify-center shrink-0 shadow-md transition-all duration-150 cursor-pointer group hover:scale-105 active:scale-95 ${
                      activePickerPlayer === 'p2'
                        ? 'border-amber-400 ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-105'
                        : 'border-rose-400 hover:border-amber-400 shadow-[0_2px_6px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    <TokenPreviewSVG
                      customHex={playerColors.p2}
                      color="RED"
                      tokenType={selectedToken}
                      className="w-6 h-7 group-hover:scale-110 transition-transform drop-shadow-sm"
                    />
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 border border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-950 shadow">
                      🎨
                    </span>
                  </button>

                  {/* Player Name Input: Decreased width size */}
                  <input
                    type="text"
                    value={playerNames.p2}
                    onChange={(e) => handleNameChange('p2', e.target.value)}
                    maxLength={14}
                    className="w-28 sm:w-36 px-2 py-0.5 rounded-lg bg-white border-2 border-dashed border-red-500/80 text-slate-900 font-extrabold text-xs shadow-inner outline-none focus:border-red-600 transition text-center"
                    placeholder="Player 2"
                  />

                  {/* Dice Preview Button */}
                  <button
                    onClick={() => handleDiceRollPreview(2)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-300 shadow-md flex items-center justify-center text-slate-900 text-sm font-black active:scale-90 transition cursor-pointer shrink-0 ${
                      rollingDiceIndex === 2 ? 'animate-spin' : ''
                    }`}
                  >
                    🎲
                  </button>
                </div>

                {/* Player 4 (Team B) */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {/* Clickable Token Box with crisp white background */}
                  <button
                    type="button"
                    onClick={() => handleOpenColorPicker('p4')}
                    aria-label={`Select token color for ${playerNames.p4 || 'Player 4'}`}
                    title={`Click to choose color for ${playerNames.p4 || 'Player 4'}`}
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border-2 flex items-center justify-center shrink-0 shadow-md transition-all duration-150 cursor-pointer group hover:scale-105 active:scale-95 ${
                      activePickerPlayer === 'p4'
                        ? 'border-amber-400 ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-105'
                        : 'border-rose-400 hover:border-amber-400 shadow-[0_2px_6px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    <TokenPreviewSVG
                      customHex={playerColors.p4}
                      color="YELLOW"
                      tokenType={selectedToken}
                      className="w-6 h-7 group-hover:scale-110 transition-transform drop-shadow-sm"
                    />
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 border border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-950 shadow">
                      🎨
                    </span>
                  </button>

                  {/* Player Name Input: Decreased width size */}
                  <input
                    type="text"
                    value={playerNames.p4}
                    onChange={(e) => handleNameChange('p4', e.target.value)}
                    maxLength={14}
                    className="w-28 sm:w-36 px-2 py-0.5 rounded-lg bg-white border-2 border-dashed border-red-500/80 text-slate-900 font-extrabold text-xs shadow-inner outline-none focus:border-red-600 transition text-center"
                    placeholder="Player 4"
                  />

                  {/* Dice Preview Button */}
                  <button
                    onClick={() => handleDiceRollPreview(4)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-300 shadow-md flex items-center justify-center text-slate-900 text-sm font-black active:scale-90 transition cursor-pointer shrink-0 ${
                      rollingDiceIndex === 4 ? 'animate-spin' : ''
                    }`}
                  >
                    🎲
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Friendly Kill Checkbox (Matching Image 1 exact style) */}
        <div
          onClick={handleToggleFriendlyKill}
          className="flex items-center justify-center gap-2.5 mt-3 py-1 cursor-pointer select-none group"
        >
          {/* Custom Green Checkbox */}
          <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition ${friendlyKill
              ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
              : 'bg-slate-900/80 border-slate-400'
            }`}>
            {friendlyKill && (
              <Check className="w-4 h-4 text-white stroke-[4]" />
            )}
          </div>

          <span className="text-sm sm:text-base font-black text-white group-hover:text-amber-200 transition tracking-wide drop-shadow">
            Friendly Kill
          </span>
        </div>

        {/* Action Button: Play */}
        <div className="w-full mt-3.5">
          <button
            onClick={() => handleStartTeamUpGame(false)}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-b from-[#1a66de] via-[#104db8] to-[#08307d] border-2 border-amber-300 hover:border-amber-200 text-white font-black text-sm tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-98 transition flex items-center justify-center cursor-pointer"
          >
            Play
          </button>
        </div>
      </div>

      {/* 4. Bottom-Left Golden Curved Back Button (Matching Image 1) */}
      <div className="relative z-20 pb-2 pl-2 pointer-events-auto">
        <button
          onClick={() => {
            soundEngine.playButtonClick();
            onBack();
          }}
          aria-label="Back to Mode Selection"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-[#0e489e] to-[#062456] border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-95 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 -rotate-90 stroke-[3]" />
        </button>
      </div>

      </div> {/* Closes mobile stage container */}

      {/* 5. Team Up Help Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-['Nunito',sans-serif]">
          <div className="relative w-full max-w-[300px] rounded-2xl bg-gradient-to-b from-[#0e4399] via-[#092e6d] to-[#041638] border-2 border-amber-400 p-3 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setShowHelpModal(false);
              }}
              aria-label="Close Help Guide"
              className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-gradient-to-b from-rose-500 to-rose-600 border-2 border-amber-300 flex items-center justify-center text-white font-black hover:scale-110 active:scale-95 transition cursor-pointer shadow-md"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="text-center mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase shadow">
                Team Up 2v2 Rules
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-sky-100">
              <div className="p-1.5 rounded-xl bg-white/5 border border-sky-400/20">
                <div className="flex items-center gap-1 font-black text-amber-300 mb-0.5">
                  <Swords className="w-3 h-3" /> 2v2 Alliance
                </div>
                <p className="text-[10px] leading-relaxed">
                  Team A (P1 + P3) battles Team B (P2 + P4). Turn order alternates: P1 → P2 → P3 → P4.
                </p>
              </div>

              <div className="p-1.5 rounded-xl bg-white/5 border border-sky-400/20">
                <div className="flex items-center gap-1 font-black text-emerald-400 mb-0.5">
                  <Shield className="w-3 h-3" /> Friendly Kill Option
                </div>
                <p className="text-[10px] leading-relaxed">
                  • <b>Checked (ON):</b> Landing on teammate’s token captures it back to base (Friendly Fire).<br />
                  • <b>Unchecked (OFF):</b> Teammates co-exist safely on the same cell.
                </p>
              </div>

              <div className="p-1.5 rounded-xl bg-white/5 border border-sky-400/20">
                <div className="flex items-center gap-1 font-black text-amber-300 mb-0.5">
                  <Sparkles className="w-3 h-3" /> Win Condition
                </div>
                <p className="text-[10px] leading-relaxed">
                  The team that successfully brings all 8 tokens of both players home first wins!
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playButtonClick();
                setShowHelpModal(false);
              }}
              className="w-full mt-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] transition cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* 6. Token Color Picker Modal */}
      {activePickerPlayer && activePlayerMeta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-['Nunito',sans-serif]"
          onClick={() => setActivePickerPlayer(null)}
        >
          <div
            className="relative w-[92%] max-w-[300px] rounded-2xl bg-gradient-to-b from-[#0b3882] via-[#072a6b] to-[#041947] border-2 border-amber-400 p-3 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button: Cleanly positioned in top-right corner, 100% round with golden border */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setActivePickerPlayer(null);
              }}
              aria-label="Close Color Picker"
              className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-gradient-to-b from-rose-500 to-rose-600 border-2 border-amber-300 flex items-center justify-center text-white font-black hover:scale-110 active:scale-95 transition cursor-pointer shadow-md"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Header Badge */}
            <div className="text-center mb-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-[10px] uppercase shadow">
                <Palette className="w-3 h-3" />
                <span>CHOOSE TOKEN COLOR</span>
              </div>
              <p className="text-[10px] text-sky-200 mt-1 font-bold">
                Assigning for{' '}
                <span className="text-amber-300 font-extrabold">
                  {activePlayerMeta.name} ({activePlayerMeta.teamLabel})
                </span>
              </p>
            </div>

            {/* Current Color Highlight */}
            <div className="mb-2 px-2.5 py-1 rounded-lg bg-white/5 border border-sky-400/30 flex items-center justify-between">
              <span className="text-[10px] font-bold text-sky-200">Current Color:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-white shadow-xs border border-slate-200 flex items-center justify-center">
                  <TokenPreviewSVG
                    customHex={activePlayerMeta.currentColor}
                    tokenType={selectedToken}
                    className="w-3.5 h-4 drop-shadow-xs"
                  />
                </div>
                <span className="text-[11px] font-black text-white">
                  {activePlayerMeta.colorName}
                </span>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                  Active
                </span>
              </div>
            </div>

            {/* Unselected Colors Section */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1 px-0.5">
                <span className="text-[10px] font-black tracking-wide text-amber-300 uppercase">
                  Available Unselected:
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {unselectedColors.length} Available
                </span>
              </div>

              {/* Grid of Unselected Colors: 3 columns fits 5 colors in 2 compact rows! */}
              <div className="grid grid-cols-3 gap-1.5">
                {unselectedColors.map((colorOption) => (
                  <button
                    key={colorOption.id}
                    onClick={() => handleSelectColor(colorOption.hex)}
                    className={`p-1.5 rounded-xl bg-gradient-to-b ${colorOption.bgGrad} border-2 ${colorOption.borderColor} ${colorOption.glow} flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer shadow group`}
                    title={`Select ${colorOption.name} for ${activePlayerMeta.name}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white shadow-xs border border-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TokenPreviewSVG
                        customHex={colorOption.hex}
                        tokenType={selectedToken}
                        className="w-5 h-6 drop-shadow-xs"
                      />
                    </div>
                    <span className={`text-[10px] font-black leading-tight ${colorOption.textColor}`}>
                      {colorOption.name}
                    </span>
                    <span className="text-[7px] font-bold text-sky-200/60 uppercase leading-none">
                      Tap to Pick
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors in use by other players */}
            <div className="mt-1.5 pt-1.5 border-t border-sky-400/20">
              <p className="text-[9px] text-sky-300/80 mb-1 font-semibold text-center">
                Colors taken by others (strictly unique):
              </p>
              <div className="flex items-center justify-center gap-1 flex-wrap">
                {occupiedPlayers.map((occ) => (
                  <button
                    key={occ.playerKey}
                    onClick={() => handleSwapWithPlayer(occ.playerKey)}
                    className="px-1.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/80 hover:border-amber-400/80 flex items-center gap-1 text-[9px] text-slate-300 hover:text-white transition cursor-pointer group shadow"
                    title={`Click to swap colors with ${occ.name}`}
                  >
                    <div
                      className="w-2 h-2 rounded-full border border-white/60 shrink-0"
                      style={{ backgroundColor: occ.hex }}
                    />
                    <span className="font-bold">{occ.name}</span>
                    <span className="text-[7px] text-sky-400 opacity-80 group-hover:opacity-100">
                      ⇄ Swap
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Close / Keep current color button */}
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                setActivePickerPlayer(null);
              }}
              className="w-full mt-2 py-1.5 rounded-lg bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-[11px] shadow transition cursor-pointer"
            >
              Keep Current Color
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
