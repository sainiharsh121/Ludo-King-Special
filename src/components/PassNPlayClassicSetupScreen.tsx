import React, { useState, useEffect } from 'react';
import { Player, PlayerColor, GameRules, SavedGame, TokenId, BoardTheme } from '../types/ludo';
import { soundEngine } from '../utils/soundEngine';
import { SavedGamesModal } from './SavedGamesModal';
import {
  TokenPreviewSVG,
  NINE_TOKEN_COLORS,
  LUDO_TOKEN_PALETTE,
  TokenColorOption
} from './TokenPreviewSVG';
import {
  Check,
  Bot,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRightLeft,
  AlertCircle
} from 'lucide-react';

interface PassNPlayClassicSetupScreenProps {
  onBack: () => void;
  onStartGame: (players: Player[], rules: GameRules) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  selectedToken?: TokenId;
  boardTheme?: BoardTheme;
  onLoadSavedGame?: (savedGame: SavedGame) => void;
}

// Storage keys for persisting user choices across reloads
const STORAGE_KEY_CLASSIC_COUNT = 'ludo_pnp_classic_playercount';
const STORAGE_KEY_CLASSIC_HEXES = 'ludo_pnp_classic_selected_hexes';
const STORAGE_KEY_CLASSIC_NAMES = 'ludo_pnp_classic_names';
const STORAGE_KEY_CLASSIC_BOTS = 'ludo_pnp_classic_bot_count';
const STORAGE_KEY_CLASSIC_ACTIVE_SLOT = 'ludo_pnp_classic_active_slot';

export const PassNPlayClassicSetupScreen: React.FC<PassNPlayClassicSetupScreenProps> = ({
  onBack,
  onStartGame,
  soundEnabled,
  onToggleSound,
  selectedToken = 'pin',
  boardTheme = 'classic',
  onLoadSavedGame,
}) => {
  // Player Count: Maximum 4 players (only 2P, 3P, 4P supported; 5P & 6P strictly removed)
  const [playerCount, setPlayerCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLASSIC_COUNT);
      if (saved && ['2', '3', '4'].includes(saved)) {
        return parseInt(saved, 10);
      }
    } catch { }
    return 2;
  });

  // Selected Token Color Hexes from the 9-Color Palette
  // For 2P: exactly 2 colors needed to play. For 3P: 3 colors. For 4P: 4 colors.
  const [selectedHexes, setSelectedHexes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLASSIC_HEXES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 1 && parsed.length <= 4) {
          return parsed.map((h: string) => h.toLowerCase() === '#e4e4e4' ? '#777777ff' : h) as string[];
        }
      }
    } catch { }
    // Default 2P: Red & Purple seats
    return ['var(--seat-red)', 'var(--seat-purple)'];
  });

  // Active Player Slot being focused for color customization (0..playerCount-1)
  const [activePlayerSlot, setActivePlayerSlot] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLASSIC_ACTIVE_SLOT);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 0 && parsed <= 3) return parsed;
      }
    } catch { }
    return 0;
  });

  // Player Nicknames
  const [playerNames, setPlayerNames] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLASSIC_NAMES);
      if (saved) return JSON.parse(saved);
    } catch { }
    return {
      p1: 'Player 1',
      p2: 'Player 2',
      p3: 'Player 3',
      p4: 'Player 4',
    };
  });

  // AI Computer Bots Count (0 up to playerCount - 1)
  const [botCount, setBotCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLASSIC_BOTS);
      if (saved) return parseInt(saved, 10);
    } catch { }
    return 0;
  });

  const [showBotPicker, setShowBotPicker] = useState<boolean>(false);
  const [showSavedGames, setShowSavedGames] = useState<boolean>(false);
  const [rollingDiceIndex, setRollingDiceIndex] = useState<number | null>(null);

  // Synchronize choices to localStorage so reload keeps exact state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLASSIC_COUNT, playerCount.toString());
      localStorage.setItem(STORAGE_KEY_CLASSIC_HEXES, JSON.stringify(selectedHexes));
      localStorage.setItem(STORAGE_KEY_CLASSIC_NAMES, JSON.stringify(playerNames));
      localStorage.setItem(STORAGE_KEY_CLASSIC_BOTS, botCount.toString());
      localStorage.setItem(STORAGE_KEY_CLASSIC_ACTIVE_SLOT, activePlayerSlot.toString());
    } catch { }
  }, [playerCount, selectedHexes, playerNames, botCount, activePlayerSlot]);

  // Adjust selected colors when player count changes
  const handleSelectPlayerCount = (count: number) => {
    soundEngine.playButtonClick();
    setPlayerCount(count);

    if (botCount >= count) {
      setBotCount(count - 1);
    }
    if (activePlayerSlot >= count) {
      setActivePlayerSlot(count - 1);
    }

    // Automatically adjust selected hexes to match count if needed
    setSelectedHexes(prev => {
      if (prev.length === count) return prev;
      if (prev.length > count) {
        return prev.slice(0, count);
      } else {
        const next = [...prev];
        for (const item of NINE_TOKEN_COLORS) {
          if (!next.includes(item.hex)) {
            next.push(item.hex);
            if (next.length === count) break;
          }
        }
        return next;
      }
    });
  };

  /**
   * Handle Click on any of the 9 Color Token Boxes:
   * 1. If color is ALREADY selected:
   *    - Clicking it deselects it!
   *    - If count drops below playerCount, Play buttons are disabled.
   * 2. If color is NOT selected:
   *    - If selectedHexes.length < playerCount: adds it (enabling Play once exact quota is reached).
   *    - If selectedHexes.length === playerCount: replaces the active slot color with this one!
   */
  const handleColorBoxClick = (hex: string) => {
    soundEngine.playButtonClick();
    const existingIndex = selectedHexes.indexOf(hex);

    if (existingIndex !== -1) {
      // Toggle off / Deselect
      setSelectedHexes(prev => prev.filter(h => h !== hex));
      // Focus on the deselected slot
      if (existingIndex < playerCount) {
        setActivePlayerSlot(existingIndex);
      }
      return;
    }

    // Color is not selected:
    if (selectedHexes.length < playerCount) {
      // Add to open slot
      setSelectedHexes(prev => [...prev, hex]);
      setActivePlayerSlot(selectedHexes.length);
    } else {
      // Quota is full: replace active slot's color
      setSelectedHexes(prev => {
        const next = [...prev];
        const targetSlot = Math.min(activePlayerSlot, playerCount - 1);
        next[targetSlot] = hex;
        return next;
      });
      // Advance focus to next slot
      setActivePlayerSlot(prev => (prev + 1) % playerCount);
    }
  };

  // Swap colors between Player 1 & Player 2
  const handleSwapPlayerColors = () => {
    soundEngine.playButtonClick();
    setSelectedHexes(prev => {
      if (prev.length < 2) return prev;
      const next = [...prev];
      const temp = next[0];
      next[0] = next[1];
      next[1] = temp;
      return next;
    });
  };

  const handleNameChange = (key: string, value: string) => {
    setPlayerNames(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDiceRollPreview = (idx: number) => {
    soundEngine.playDiceRollSound();
    setRollingDiceIndex(idx);

    // Randomize distinct colors for all active players from the 9-Color Palette
    const shuffled = [...NINE_TOKEN_COLORS].sort(() => Math.random() - 0.5);
    const newHexes = shuffled.slice(0, playerCount).map(c => c.hex);
    setSelectedHexes(newHexes);

    setTimeout(() => {
      setRollingDiceIndex(null);
    }, 700);
  };

  const handleToggleBotPicker = () => {
    soundEngine.playButtonClick();
    setShowBotPicker(prev => !prev);
  };

  const handleSelectBots = (count: number) => {
    soundEngine.playButtonClick();
    setBotCount(count);
    setShowBotPicker(false);
  };

  // Exact Quota Rule:
  // For 2P: exactly 2 colors must be selected.
  // For 3P: exactly 3 colors.
  // For 4P: exactly 4 colors.
  // If not selected, the Play button will NOT work!
  const isExactQuotaMet = selectedHexes.length === playerCount;

  // Build active players array for game engine
  const buildPlayers = (oneTokenOut: boolean): Player[] => {
    const avatarList = ['🦁', '🐯', '🦅', '🐉'];
    const quadrantColors: PlayerColor[] =
      playerCount === 2 ? ['RED', 'YELLOW'] : ['RED', 'GREEN', 'YELLOW', 'BLUE'];

    const createInitialPawns = (color: PlayerColor) => [
      { id: 0, color, step: oneTokenOut ? 0 : -1, isHome: false },
      { id: 1, color, step: -1, isHome: false },
      { id: 2, color, step: -1, isHome: false },
      { id: 3, color, step: -1, isHome: false },
    ];

    return Array.from({ length: playerCount }).map((_, idx) => {
      const isBot = idx >= (playerCount - botCount);
      const key = `p${idx + 1}`;
      const chosenHex = selectedHexes[idx] || NINE_TOKEN_COLORS[idx].hex;
      const colorOption = NINE_TOKEN_COLORS.find(
        c =>
          c.hex.toLowerCase() === chosenHex.toLowerCase() ||
          (chosenHex.toLowerCase() === '#777777' && c.hex.toLowerCase() === '#777777ff')
      );
      const defaultName = isBot ? `Bot ${colorOption?.name || idx + 1}` : `Player ${idx + 1}`;
      const name = playerNames[key] || defaultName;
      const quadrantColor = quadrantColors[idx % quadrantColors.length];

      return {
        id: `p-${idx + 1}-${quadrantColor.toLowerCase()}`,
        name,
        color: quadrantColor,
        tokenColorHex: chosenHex,
        tokenId: selectedToken,
        avatar: avatarList[idx % avatarList.length],
        pawns: createInitialPawns(quadrantColor),
        hasCaptured: false,
        consecutiveSixes: 0,
        rank: null,
        isActive: true,
        isAi: isBot,
      };
    });
  };

  const handleStartClassicGame = (oneTokenOut: boolean) => {
    if (!isExactQuotaMet) return; // Strict guard: Play button does not work if quota not met
    soundEngine.playGameStartSound();
    const finalPlayers = buildPlayers(oneTokenOut);
    const rules: GameRules = {
      openOnSixOnly: true,
      mustCaptureToEnterHome: false,
      threeSixesForfeit: true,
      bonusOnCapture: true,
      bonusOnHomeReach: true,
      safeZoneMode: 'standard',
      pawnSpeedMs: 80,
      autoMoveSingleLegal: true,
      oneTokenOut,
    };
    onStartGame(finalPlayers, rules);
  };

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
              <div className="w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black cursor-pointer hover:scale-105 active:scale-95 shadow ml-0.5 leading-none">
                +
              </div>
            </div>

            {/* Coins */}
            <div className="flex items-center gap-1 bg-[#061e47]/90 border border-amber-400/60 rounded-full px-2 py-0.5 shadow-md">
              <span className="text-[11px]">🪙</span>
              <span className="text-[11px] font-black text-white">8,350</span>
              <div className="w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black cursor-pointer hover:scale-105 active:scale-95 shadow ml-0.5 leading-none">
                +
              </div>
            </div>

            {/* Audio toggle */}
            <button
              type="button"
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

        {/* "Load Saved Games" Button (matching reference screenshot pill) */}
        <div className="mb-1.5 text-center">
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              setShowSavedGames(true);
            }}
            className="px-6 py-1 rounded-full bg-gradient-to-b from-[#1964d4] via-[#0f4bb5] to-[#0a358c] border-2 border-amber-300 text-amber-200 hover:text-white font-black text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.4)] active:scale-95 transition cursor-pointer"
          >
            Load Saved Games
          </button>
        </div>

        {/* Title Bar with Robot Bot Counter */}
        <div className="w-full flex items-center justify-between px-1 mb-1.5">
          <h2 className="text-xs sm:text-sm font-black tracking-wide text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase">
            CHOOSE COLOR AND NAME
          </h2>

          {/* Robot Bot Toggle Capsule */}
          <div className="relative">
            <button
              type="button"
              onClick={handleToggleBotPicker}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-sky-400/50 hover:border-amber-400 text-white shadow active:scale-95 transition cursor-pointer"
              title="Configure computer bots"
              aria-label="Configure computer bot players"
            >
              <Bot className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-black text-amber-300">
                {botCount}/{playerCount}
              </span>
            </button>

            {/* Mini Bot Count Picker Popover */}
            {showBotPicker && (
              <div className="absolute right-0 top-7 z-30 w-36 rounded-xl bg-slate-900 border-2 border-amber-400 p-2 shadow-2xl text-center">
                <span className="text-[10px] font-black text-sky-200 block mb-1">
                  AI Computer Bots:
                </span>
                <div className="flex items-center justify-center gap-1">
                  {Array.from({ length: playerCount }, (_, i) => i).map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSelectBots(num)}
                      className={`w-6 h-6 rounded-md text-xs font-black transition cursor-pointer ${
                        botCount === num
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Main Card: 9-Color Token Palette & Player Rows                            */}
        {/* ========================================================================= */}
        <div className="w-full rounded-2xl bg-gradient-to-b from-[#0b3b8c]/95 via-[#072c6e]/95 to-[#041e52]/98 border-2 border-sky-500/40 p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-sm space-y-2">

          {/* Status Alert Banner: Tells user exact selection quota */}
          <div className="flex items-center justify-between text-xs px-0.5">
            {isExactQuotaMet ? (
              <span className="text-[10.5px] font-black text-emerald-300 flex items-center gap-1 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <Check className="w-3 h-3 stroke-[3]" /> All {playerCount} Colors Selected
              </span>
            ) : (
              <span className="text-[10.5px] font-black text-amber-300 flex items-center gap-1 bg-amber-400/15 px-2 py-0.5 rounded-full border border-amber-400/40 animate-pulse">
                <AlertCircle className="w-3 h-3" /> Select {playerCount - selectedHexes.length} more color to Play
              </span>
            )}

            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-sky-200">
                Editing:
              </span>
              <span className="text-[10px] font-black text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/40">
                P{activePlayerSlot + 1}
              </span>
              {playerCount === 2 && selectedHexes.length === 2 && (
                <button
                  type="button"
                  onClick={handleSwapPlayerColors}
                  title="Swap P1 and P2 Colors"
                  className="p-1 rounded bg-slate-900/80 text-amber-300 border border-sky-600/50 hover:bg-slate-800 transition cursor-pointer ml-1"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE 9-COLOR TOKEN SELECTION PALETTE (Displayed on Frontend)              */}
          {/* ========================================================================= */}
          <div
            className="grid grid-cols-3 gap-1.5"
            role="group"
            aria-label="9 Colors Token Selection Palette"
          >
            {NINE_TOKEN_COLORS.map((opt) => {
              const assignedIndex = selectedHexes.indexOf(opt.hex);
              const isSelected = assignedIndex !== -1;
              const isTargetSlot = isSelected && assignedIndex === activePlayerSlot;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleColorBoxClick(opt.hex)}
                  aria-pressed={isSelected}
                  aria-label={`${opt.name} (${opt.hex}) ${
                    isSelected ? `- Assigned to Player ${assignedIndex + 1}` : '- Tap to select'
                  }`}
                  className={`group relative flex items-center gap-1.5 p-1.5 rounded-xl border-2 transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? `bg-gradient-to-r ${opt.bgGrad} ${opt.borderColor} ${opt.glow} ${
                          isTargetSlot ? 'ring-2 ring-amber-300 scale-[1.02]' : ''
                        }`
                      : 'bg-slate-900/70 border-slate-700/60 opacity-65 hover:opacity-100 hover:border-slate-400 hover:bg-slate-800/80'
                  }`}
                >
                  {/* Left: Vector Token Graphic */}
                  <div className="shrink-0 transition-transform group-hover:scale-105 active:scale-95">
                    <TokenPreviewSVG
                      customHex={opt.hex}
                      tokenType={selectedToken}
                      className="w-[22px] h-[26px]"
                    />
                  </div>

                  {/* Middle: Color Name preview */}
                  <div className="flex-1 flex flex-col justify-center text-left overflow-hidden">
                    <span
                      className={`text-[11px] font-black tracking-wide truncate ${
                        isSelected ? opt.textColor : 'text-slate-200'
                      }`}
                    >
                      {opt.name}
                    </span>
                  </div>

                  {/* Right: Checkmark & Player Slot Tag */}
                  <div className="shrink-0 flex flex-col items-center justify-center">
                    {isSelected ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-white shadow-xs">
                        <Check className="w-2 h-2 stroke-[3.5]" />
                      </span>
                    ) : (
                      <span className="w-3 h-3 rounded-full border border-slate-500/80" />
                    )}
                    {isSelected && (
                      <span className="text-[8px] font-black text-amber-200 leading-none mt-0.5">
                        P{assignedIndex + 1}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* Active Player Slots List (Showing assigned token color + name input)      */}
          {/* ========================================================================= */}
          <div className="space-y-1 pt-1.5 border-t border-sky-800/50">
            {Array.from({ length: playerCount }).map((_, idx) => {
              const assignedHex = selectedHexes[idx];
              const colorOption = assignedHex
                ? NINE_TOKEN_COLORS.find(
                    c =>
                      c.hex.toLowerCase() === assignedHex.toLowerCase() ||
                      (assignedHex.toLowerCase() === '#777777' && c.hex.toLowerCase() === '#777777ff')
                  )
                : null;
              const key = `p${idx + 1}`;
              const isTargetSlot = activePlayerSlot === idx;
              const isBot = idx >= (playerCount - botCount);

              return (
                <div
                  key={idx}
                  onClick={() => setActivePlayerSlot(idx)}
                  className={`flex items-center gap-2 p-1.5 rounded-xl transition cursor-pointer ${
                    isTargetSlot
                      ? 'bg-sky-950/80 ring-1 ring-amber-400/90 shadow-md'
                      : 'bg-slate-950/40 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Player Token Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      colorOption ? colorOption.borderColor : 'border-dashed border-slate-600'
                    } bg-slate-900/90 shadow-sm`}
                    title={colorOption ? `${colorOption.name} Token` : 'No color selected'}
                  >
                    {assignedHex ? (
                      <TokenPreviewSVG
                        customHex={assignedHex}
                        tokenType={selectedToken}
                        className="w-[22px] h-[26px]"
                      />
                    ) : (
                      <span className="text-xs text-amber-300 font-black">+</span>
                    )}
                  </div>

                  {/* Player Name Dashed Input Box (Matching Reference Screenshot!) */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={playerNames[key] ?? `Player ${idx + 1}`}
                      onChange={(e) => handleNameChange(key, e.target.value)}
                      maxLength={14}
                      autoComplete="off"
                      className="w-full px-2.5 py-0.5 rounded-lg bg-white border-2 border-dashed border-red-500/80 text-slate-900 font-extrabold text-xs shadow-inner outline-none focus:border-red-600 transition"
                      placeholder={`Player ${idx + 1}`}
                    />
                    {isBot && (
                      <span className="absolute right-2 top-1.5 text-[8.5px] font-black text-sky-900 bg-sky-200 px-1 rounded">
                        BOT
                      </span>
                    )}
                  </div>

                  {/* 3D Dice Preview Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDiceRollPreview(idx);
                    }}
                    aria-label={`Preview dice roll for Player ${idx + 1}`}
                    className={`w-7 h-7 rounded-lg bg-white border border-slate-300 shadow-md flex items-center justify-center text-slate-900 text-sm font-black active:scale-90 transition cursor-pointer ${
                      rollingDiceIndex === idx ? 'animate-spin' : ''
                    }`}
                  >
                    🎲
                  </button>
                </div>
              );
            })}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* Player Count Selector: 2P, 3P, 4P (5P & 6P Strictly Removed as Requested) */}
        {/* ========================================================================= */}
        <div className="w-full flex items-center justify-between gap-2 mt-2 px-1" role="group" aria-label="Player Count">
          {[2, 3, 4].map((num) => {
            const isSelected = playerCount === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => handleSelectPlayerCount(num)}
                aria-pressed={isSelected}
                className={`flex-1 py-1 rounded-full font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#1b6ae0] to-[#0d44a1] text-white border-2 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-105'
                    : 'bg-slate-950/70 text-sky-200/80 border border-sky-600/40 hover:border-amber-400/50 hover:text-white'
                }`}
              >
                {num}P
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* Action Button: "Play"                                                     */}
        {/* Strictly DISABLED if exact quota of colors is NOT selected!              */}
        {/* ========================================================================= */}
        <div className="w-full mt-3">
          <button
            type="button"
            disabled={!isExactQuotaMet}
            onClick={() => handleStartClassicGame(false)}
            aria-disabled={!isExactQuotaMet}
            className={`w-full py-2.5 rounded-2xl border-2 font-black text-sm tracking-wide transition flex items-center justify-center ${
              isExactQuotaMet
                ? 'bg-gradient-to-b from-[#1a66de] via-[#104db8] to-[#08307d] border-amber-300 hover:border-amber-200 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:brightness-105 active:scale-98 cursor-pointer'
                : 'bg-slate-800/80 border-slate-600/60 text-slate-500 opacity-50 cursor-not-allowed shadow-none'
            }`}
          >
            Play
          </button>
        </div>

      </div>

      {/* 4. Bottom-Left Golden Curved Back Button (Matching Reference Screenshot) */}
      <div className="relative z-20 pb-2.5 pl-3 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            soundEngine.playButtonClick();
            onBack();
          }}
          aria-label="Back to Mode Selection"
          className="w-10 h-10 rounded-full bg-gradient-to-b from-[#0e489e] to-[#062456] border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-95 transition cursor-pointer"
        >
          <RotateCcw className="w-4.5 h-4.5 -rotate-90 stroke-[3]" />
        </button>
      </div>

      </div> {/* Closes mobile stage container */}

      {/* 5. Load Saved Games Modal */}
      <SavedGamesModal
        isOpen={showSavedGames}
        onClose={() => setShowSavedGames(false)}
        onLoadGame={(game) => {
          setShowSavedGames(false);
          if (onLoadSavedGame) {
            onLoadSavedGame(game);
          } else {
            onStartGame(game.players, game.rules);
          }
        }}
      />
    </div>
  );
};
