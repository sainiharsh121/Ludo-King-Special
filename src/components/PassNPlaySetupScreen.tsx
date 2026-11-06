import React, { useState, useEffect } from 'react';
import { BoardTheme, PassNPlaySubMode, TokenId } from '../types/ludo';
import { soundEngine } from '../utils/soundEngine';
import { 
  Volume2, 
  VolumeX, 
  Check, 
  Lock, 
  HelpCircle, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Smartphone, 
  Sparkles,
  Info,
  X,
  RotateCcw
} from 'lucide-react';

const WhitePlayerIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="#ffffff" className={`${className} filter drop-shadow`}>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

interface PassNPlaySetupScreenProps {
  onBack: () => void;
  onNext: (subMode: PassNPlaySubMode, token: TokenId, theme: BoardTheme) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentTheme?: BoardTheme;
  onSelectTheme?: (theme: BoardTheme) => void;
}

const STORAGE_KEY_SUBMODE = 'ludo_pnp_submode';
const STORAGE_KEY_TOKEN = 'ludo_pnp_token';

export const PassNPlaySetupScreen: React.FC<PassNPlaySetupScreenProps> = ({
  onBack,
  onNext,
  soundEnabled,
  onToggleSound,
  currentTheme = 'classic',
  onSelectTheme,
}) => {
  // Restore persisted subMode or default to 'TEAM_UP' (matching user's reference screenshot!)
  const [selectedSubMode, setSelectedSubMode] = useState<PassNPlaySubMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBMODE) as PassNPlaySubMode | null;
      if (saved && (saved === 'CLASSIC' || saved === 'TEAM_UP' || saved === 'QUICK')) {
        return saved;
      }
    } catch {}
    return 'TEAM_UP';
  });

  // Restore persisted token or default to 'pin' (matching user's reference screenshot!)
  const [selectedToken, setSelectedToken] = useState<TokenId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TOKEN) as TokenId | null;
      if (saved && (saved === 'pin' || saved === 'disc' || saved === 'hammer' || saved === 'top' || saved === 'ninja')) {
        return saved;
      }
    } catch {}
    return 'pin';
  });

  // State for popups & feedback
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize choices to localStorage so refresh keeps exact state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBMODE, selectedSubMode);
    } catch {}
  }, [selectedSubMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TOKEN, selectedToken);
    } catch {}
  }, [selectedToken]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleModeSelect = (mode: PassNPlaySubMode) => {
    soundEngine.playButtonClick();
    setSelectedSubMode(mode);
  };

  const ALL_TOKENS_LIST: TokenId[] = ['pin', 'disc', 'hammer', 'top', 'ninja'];

  const handleTokenSelect = (token: TokenId) => {
    soundEngine.playButtonClick();
    setSelectedToken(token);
  };

  const handleLeftArrow = () => {
    soundEngine.playButtonClick();
    const idx = ALL_TOKENS_LIST.indexOf(selectedToken);
    const nextIdx = (idx - 1 + ALL_TOKENS_LIST.length) % ALL_TOKENS_LIST.length;
    setSelectedToken(ALL_TOKENS_LIST[nextIdx]);
  };

  const handleRightArrow = () => {
    soundEngine.playButtonClick();
    const idx = ALL_TOKENS_LIST.indexOf(selectedToken);
    const nextIdx = (idx + 1) % ALL_TOKENS_LIST.length;
    setSelectedToken(ALL_TOKENS_LIST[nextIdx]);
  };

  const handleNextClick = () => {
    soundEngine.playButtonClick();
    onNext(selectedSubMode, selectedToken, currentTheme);
  };

  const handleBackClick = () => {
    soundEngine.playButtonClick();
    onBack();
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden flex items-center justify-center font-['Nunito',sans-serif] bg-[#07245c]">
      
      {/* 
        Mobile Stage Container:
        Locks the exact 469:1024 native mobile game aspect ratio matching HomeScreen.tsx.
        Ensures perfect proportions, tight vertical rhythm, and prevents oversized stretching on larger viewports.
      */}
      <div 
        className="relative mx-auto h-full max-h-full max-w-full overflow-hidden flex flex-col justify-between shadow-2xl p-2.5 sm:p-3"
        style={{
          aspectRatio: '469 / 1024',
          maxWidth: '100%',
          maxHeight: '100%',
          width: '100%',
        }}
      >
        {/* 1. Underlying Lobby Background */}
        <img
          src="/page2_reference.jpg"
          alt="Lobby Backdrop"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none filter brightness-[0.20] contrast-[1.15]"
        />

        {/* Deep radial navy vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#02183d]/92 via-[#03235b]/85 to-[#021535]/95 pointer-events-none" />

        {/* 2. Top Header Status Bar */}
        <div className="relative z-20 w-full pt-1 px-1 flex items-center justify-between pointer-events-auto">
          {/* Profile Card on Left */}
          <div className="flex items-center gap-1.5">
            <div className="relative w-8 h-8 rounded-lg border-2 border-amber-400 bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden shadow-md flex items-center justify-center">
              <span className="text-base">🦁</span>
              {/* Level 1 Star */}
              <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center text-[8px] font-black text-slate-950 border border-amber-200 shadow">
                1
              </div>
            </div>
          </div>

          {/* Currency Counters */}
          <div className="flex items-center gap-1.5">
            {/* Diamonds: 62 + */}
            <div className="flex items-center gap-1 bg-[#061e47]/90 border border-sky-400/60 rounded-full px-2 py-0.5 shadow-md">
              <span className="text-[11px]">💎</span>
              <span className="text-[11px] font-black text-white">62</span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black leading-none ml-0.5">
                +
              </span>
            </div>

            {/* Coins: 8,350 + */}
            <div className="flex items-center gap-1 bg-[#061e47]/90 border border-amber-400/60 rounded-full px-2 py-0.5 shadow-md">
              <span className="text-[11px]">🪙</span>
              <span className="text-[11px] font-black text-white">8,350</span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black leading-none ml-0.5">
                +
              </span>
            </div>
          </div>

          {/* Audio Toggle Top-Right */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onToggleSound();
            }}
            className="w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-700/80 text-amber-300 hover:text-white transition shadow backdrop-blur-md cursor-pointer flex items-center justify-center"
            title="Toggle Sound"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
          </button>
        </div>

        {/* 3. Main Center Setup Deck */}
        <div className="relative z-30 w-full flex-1 flex flex-col justify-evenly items-center px-1 max-w-[340px] mx-auto py-1">
        
        {/* ========================================================================= */}
        {/* A. SELECT THEME PILL (Top Header Strip)                                  */}
        {/* ========================================================================= */}
        <div className="relative mb-2 flex items-center justify-center gap-1.5">
          {/* Gold Checked Icon on Left */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 border-2 border-amber-200 flex items-center justify-center shadow-md shadow-amber-500/40">
            <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
          </div>

          {/* Theme Selector Capsule */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              setShowThemeModal(true);
            }}
            className="group relative flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#0d47a1] via-[#1565c0] to-[#0d47a1] border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)] active:scale-95 transition-all cursor-pointer"
          >
            {/* Phone Icon showing 4 color quadrants */}
            <div className="w-4 h-6 rounded border border-white/60 bg-slate-900 p-0.5 flex flex-col justify-between shadow-inner">
              <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full rounded-xs overflow-hidden">
                <div className="bg-red-500" />
                <div className="bg-green-500" />
                <div className="bg-blue-500" />
                <div className="bg-yellow-400" />
              </div>
            </div>

            {/* Mini Themes Badges */}
            <div className="flex items-center -space-x-1">
              <span className="text-[11px] filter drop-shadow">🦋</span>
              <span className="text-[11px] filter drop-shadow">👑</span>
              <span className="text-[11px] filter drop-shadow">🏺</span>
              <span className="text-[11px] filter drop-shadow">🐸</span>
              <span className="text-[11px] filter drop-shadow">💎</span>
            </div>

            {/* "SELECT THEME" Text */}
            <span className="text-[11px] font-black tracking-wide text-white uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              SELECT THEME
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* B. SELECT TOKEN SECTION                                                  */}
        {/* ========================================================================= */}
        <div className="w-full flex flex-col items-center mb-2">
          {/* Header Title with Comic/Arcade Gold Styling */}
          <h2 
            className="text-base sm:text-lg font-black tracking-wider uppercase text-amber-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] mb-1.5"
            style={{ textShadow: '0 2px 0 #000, 0 -1px 0 #000, 1px 0 0 #000, -1px 0 0 #000, 0 3px 5px rgba(0,0,0,0.8)' }}
          >
            SELECT TOKEN
          </h2>

          {/* Tokens Carousel Strip */}
          <div className="w-full flex items-center justify-between px-1">
            {/* Left Yellow Arrow */}
            <button
              type="button"
              onClick={handleLeftArrow}
              className="p-1 rounded-full text-amber-400 hover:text-amber-300 active:scale-90 transition cursor-pointer"
              title="Previous Token"
            >
              <ChevronLeft className="w-5 h-5 stroke-[3.5] filter drop-shadow" />
            </button>

            {/* 5 Token Items (All 5 Tokens Completely Unlocked Matching Screenshot 3) */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-1 px-1">
              
              {/* Token 1: GPS Pin Token (Default & Active) */}
              <div 
                onClick={() => handleTokenSelect('pin')}
                className="relative cursor-pointer group transition-transform active:scale-95"
                title="GPS Pin Token"
              >
                {/* Checkmark Badge */}
                {selectedToken === 'pin' && (
                  <div className="absolute -top-1.5 -left-1.5 z-10 w-4 h-4 rounded-full bg-amber-400 border border-white flex items-center justify-center shadow-md">
                    <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                  </div>
                )}
                {/* SVG Pin Marker */}
                <div className={`w-8 h-10 flex items-center justify-center transition filter ${
                  selectedToken === 'pin' ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]' : 'opacity-80'
                }`}>
                  <svg viewBox="0 0 24 32" className="w-full h-full">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.52-4.48-10-10-10z"
                      fill="#ffffff"
                      stroke="#0284c7"
                      strokeWidth="2"
                    />
                    <circle cx="12" cy="12" r="4.5" fill="#38bdf8" />
                  </svg>
                </div>
              </div>

              {/* Token 2: 2D Blue Star Disc Token (Crisp Vector SVG matching Reference) */}
              <div 
                onClick={() => handleTokenSelect('disc')}
                className="relative cursor-pointer group transition-transform active:scale-95"
                title="Star Disc Token"
              >
                {selectedToken === 'disc' && (
                  <div className="absolute -top-1.5 -left-1.5 z-10 w-4 h-4 rounded-full bg-amber-400 border border-white flex items-center justify-center shadow-md">
                    <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                  </div>
                )}
                <div className={`w-8 h-10 flex items-center justify-center transition filter ${
                  selectedToken === 'disc' ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.9)] scale-105' : 'opacity-85 hover:opacity-100'
                }`}>
                  <svg viewBox="0 0 34 34" className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow">
                    <defs>
                      <linearGradient id="token2OuterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="60%" stopColor="#1d4ed8" />
                        <stop offset="100%" stopColor="#0f3b9c" />
                      </linearGradient>
                      <radialGradient id="token2InnerFace" cx="45%" cy="38%" r="58%">
                        <stop offset="0%" stopColor="#e0f2fe" />
                        <stop offset="40%" stopColor="#bae6fd" />
                        <stop offset="85%" stopColor="#7dd3fc" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </radialGradient>
                    </defs>

                    {/* Dark Rim Outline & Drop Shadow */}
                    <circle cx="17" cy="17" r="16" fill="#031846" />

                    {/* Outer 2D Beveled Ring */}
                    <circle cx="17" cy="17" r="15" fill="url(#token2OuterGrad)" stroke="#0c2b70" strokeWidth="0.8" />

                    {/* Bottom Cyan Specular Highlight Curve */}
                    <path
                      d="M 5.5 20.5 A 13 13 0 0 0 28.5 20.5"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />

                    {/* Top Specular Arc */}
                    <path
                      d="M 9.5 10 A 13 13 0 0 1 24.5 10"
                      fill="none"
                      stroke="#93c5fd"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      opacity="0.85"
                    />

                    {/* Concentric White Ring */}
                    <circle cx="17" cy="16.5" r="10.5" fill="none" stroke="#ffffff" strokeWidth="1.5" />

                    {/* Inner Light Blue Face */}
                    <circle cx="17" cy="16.5" r="9.3" fill="url(#token2InnerFace)" stroke="#0284c7" strokeWidth="0.6" />

                    {/* Center 5-Point Blue Star */}
                    <polygon
                      points="
                        17,10.6
                        18.7,14.2
                        22.7,14.8
                        19.8,17.6
                        20.5,21.5
                        17,19.6
                        13.5,21.5
                        14.2,17.6
                        11.3,14.8
                        15.3,14.2
                      "
                      fill="#1d4ed8"
                      stroke="#0f3b9c"
                      strokeWidth="0.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Token 3: Lightning Hammer (Thor Mjolnir - UNLOCKED Matching Image 3) */}
              <div 
                onClick={() => handleTokenSelect('hammer')}
                className="relative cursor-pointer group transition-transform active:scale-95"
                title="Thor Lightning Hammer (Unlocked)"
              >
                {selectedToken === 'hammer' && (
                  <div className="absolute -top-1.5 -left-1.5 z-10 w-4 h-4 rounded-full bg-amber-400 border border-white flex items-center justify-center shadow-md">
                    <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                  </div>
                )}
                <div className={`w-8 h-10 flex items-center justify-center transition filter ${
                  selectedToken === 'hammer' ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.9)] scale-105' : 'opacity-85 hover:opacity-100'
                }`}>
                  <svg viewBox="0 0 32 40" className="w-full h-full drop-shadow">
                    <defs>
                      <linearGradient id="hammerHeadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="35%" stopColor="#0284c7" />
                        <stop offset="100%" stopColor="#0369a1" />
                      </linearGradient>
                      <linearGradient id="hammerShaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#e2e8f0" />
                        <stop offset="50%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                    {/* Hammer Head with Rounded Corners */}
                    <rect x="4" y="4" width="24" height="18" rx="4" fill="url(#hammerHeadGrad)" stroke="#bae6fd" strokeWidth="1.5" />
                    {/* White Lightning Bolt in Center */}
                    <path d="M17 7 L11.5 14 L15.5 14 L13.5 19 L19.5 12 L15.5 12 Z" fill="#ffffff" filter="drop-shadow(0 0 2px rgba(255,255,255,0.9))" />
                    {/* Handle / Shaft */}
                    <rect x="13.5" y="22" width="5" height="12" rx="1.5" fill="url(#hammerShaftGrad)" stroke="#475569" strokeWidth="0.8" />
                    <line x1="13.5" y1="26" x2="18.5" y2="26" stroke="#334155" strokeWidth="1" />
                    <line x1="13.5" y1="29" x2="18.5" y2="29" stroke="#334155" strokeWidth="1" />
                    <rect x="12" y="34" width="8" height="3" rx="1.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
                  </svg>
                </div>
              </div>

              {/* Token 4: Spinning Top / Pagoda (UNLOCKED 2D Vector matching Image) */}
              <div 
                onClick={() => handleTokenSelect('top')}
                className="relative cursor-pointer group transition-transform active:scale-95"
                title="Spinning Top (Unlocked)"
              >
                {selectedToken === 'top' && (
                  <div className="absolute -top-1.5 -left-1.5 z-10 w-4 h-4 rounded-full bg-amber-400 border border-white flex items-center justify-center shadow-md">
                    <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                  </div>
                )}
                <div className={`w-8 h-10 flex items-center justify-center transition filter ${
                  selectedToken === 'top' ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.9)] scale-105' : 'opacity-85 hover:opacity-100'
                }`}>
                  <svg viewBox="0 0 32 40" className="w-full h-full drop-shadow">
                    <defs>
                      <linearGradient id="topSaucerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#7dd3fc" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                      <linearGradient id="topBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0284c7" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    {/* Small top handle peg */}
                    <rect x="14.5" y="3" width="3" height="4" rx="1" fill="#7dd3fc" />
                    {/* Canopy Saucer Rim */}
                    <path d="M4 11 C4 7, 28 7, 28 11 L25 14 L7 14 Z" fill="url(#topSaucerGrad)" stroke="#bae6fd" strokeWidth="1" />
                    {/* Canopy ribs */}
                    <line x1="16" y1="7" x2="16" y2="14" stroke="#e0f2fe" strokeWidth="0.8" />
                    <line x1="10" y1="9" x2="9" y2="14" stroke="#38bdf8" strokeWidth="0.8" />
                    <line x1="22" y1="9" x2="23" y2="14" stroke="#38bdf8" strokeWidth="0.8" />
                    {/* Dark eye mask band under hat */}
                    <rect x="10.5" y="13.5" width="11" height="3" rx="1" fill="#0f172a" />
                    <circle cx="13.5" cy="15" r="0.8" fill="#ffffff" />
                    <circle cx="18.5" cy="15" r="0.8" fill="#ffffff" />
                    {/* Conical Body tapering down */}
                    <path d="M8 16.5 L24 16.5 L16 33 Z" fill="url(#topBodyGrad)" stroke="#38bdf8" strokeWidth="1" />
                    {/* Cyan Light Swirl Stripes */}
                    <path d="M9 19.5 Q16 22.5 23 19.5" stroke="#ffffff" strokeWidth="1.3" fill="none" opacity="0.95" />
                    <path d="M11 23.5 Q16 26.5 21 23.5" stroke="#e0f2fe" strokeWidth="1.1" fill="none" opacity="0.9" />
                    <path d="M13 27.5 Q16 29.5 19 27.5" stroke="#ffffff" strokeWidth="0.9" fill="none" opacity="0.85" />
                    {/* Sharp metallic needle tip */}
                    <polygon points="14.5,33 17.5,33 16,37" fill="#a855f7" stroke="#6b21a8" strokeWidth="0.8" />
                  </svg>
                </div>
              </div>

              {/* Token 5: Ninja / Sunglasses Face (UNLOCKED Matching Image 3) */}
              <div 
                onClick={() => handleTokenSelect('ninja')}
                className="relative cursor-pointer group transition-transform active:scale-95"
                title="Cool Ninja with Shades (Unlocked)"
              >
                {selectedToken === 'ninja' && (
                  <div className="absolute -top-1.5 -left-1.5 z-10 w-4 h-4 rounded-full bg-amber-400 border border-white flex items-center justify-center shadow-md">
                    <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                  </div>
                )}
                <div className={`w-8 h-10 flex items-center justify-center transition filter ${
                  selectedToken === 'ninja' ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.9)] scale-105' : 'opacity-85 hover:opacity-100'
                }`}>
                  <svg viewBox="0 0 32 40" className="w-full h-full drop-shadow">
                    <defs>
                      <linearGradient id="ninjaHairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#7dd3fc" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                      <linearGradient id="ninjaCollarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                      </linearGradient>
                    </defs>
                    {/* Blue Spiky Hair / Head */}
                    <path d="M8 14 C6 8, 12 3, 16 3 C20 3, 26 8, 24 14 Z" fill="url(#ninjaHairGrad)" stroke="#bae6fd" strokeWidth="1" />
                    <path d="M6 14 C5 10, 8 7, 10 6" stroke="#bae6fd" strokeWidth="1" fill="none" />
                    <path d="M26 14 C27 10, 24 7, 22 6" stroke="#bae6fd" strokeWidth="1" fill="none" />
                    {/* Face Base */}
                    <rect x="7" y="12" width="18" height="12" rx="4" fill="#93c5fd" />
                    {/* Cool Black Sunglasses */}
                    <path d="M6 14 L15 14 L14 20 L8 20 Z" fill="#0f172a" stroke="#020617" strokeWidth="1" />
                    <path d="M17 14 L26 14 L24 20 L18 20 Z" fill="#0f172a" stroke="#020617" strokeWidth="1" />
                    <rect x="14.5" y="15" width="3" height="2" fill="#020617" />
                    {/* Sunglasses Glare Reflections */}
                    <polygon points="8,15 11,15 9,19 7,19" fill="#ffffff" opacity="0.9" />
                    <polygon points="19,15 22,15 20,19 18,19" fill="#ffffff" opacity="0.9" />
                    {/* White Collar / V-Neck */}
                    <path d="M9 25 L16 35 L23 25 L21 22 L11 22 Z" fill="url(#ninjaCollarGrad)" stroke="#94a3b8" strokeWidth="1" />
                    <polygon points="14,24 18,24 16,30" fill="#38bdf8" />
                  </svg>
                </div>
              </div>

            </div>

            {/* Right Yellow Arrow */}
            <button
              type="button"
              onClick={handleRightArrow}
              className="p-1 rounded-full text-amber-400 hover:text-amber-300 active:scale-90 transition cursor-pointer"
              title="Next Token"
            >
              <ChevronRight className="w-6 h-6 stroke-[3.5] filter drop-shadow" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* C. SELECT GAME SECTION                                                   */}
        {/* ========================================================================= */}
        <div className="w-full flex flex-col items-center mb-2">
          {/* Header Row: Title + Question Mark Help Icon */}
          <div className="relative w-full flex items-center justify-center mb-1.5">
            <h2 
              className="text-base sm:text-lg font-black tracking-wider uppercase text-amber-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]"
              style={{ textShadow: '0 2px 0 #000, 0 -1px 0 #000, 1px 0 0 #000, -1px 0 0 #000, 0 3px 5px rgba(0,0,0,0.8)' }}
            >
              SELECT GAME
            </h2>

            {/* Help Question Mark on Right */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setShowHelpModal(true);
              }}
              className="absolute right-3 w-5 h-5 rounded-full bg-amber-400 border border-amber-200 text-slate-950 font-black text-[10px] flex items-center justify-center shadow hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Game Rules Guide"
              aria-label="Game Rules Guide"
            >
              ?
            </button>
          </div>

          {/* 3 Game Mode Rows */}
          <div className="w-full space-y-2">
            
            {/* -------------------- 1. CLASSIC MODE -------------------- */}
            <div 
              onClick={() => handleModeSelect('CLASSIC')}
              className="flex items-center gap-2 cursor-pointer group active:scale-[0.98] transition-all"
            >
              {/* Left Tile Icon: 4 White Players VS (Pure White SVG Silhouettes) */}
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-b from-[#094196] to-[#042055] border-2 ${
                selectedSubMode === 'CLASSIC' ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]' : 'border-sky-400/70'
              } flex flex-col items-center justify-center p-0.5 relative shadow-md shrink-0`}>
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute top-0 flex justify-center"><WhitePlayerIcon className="w-3 h-3" /></div>
                  <div className="absolute bottom-0 flex justify-center"><WhitePlayerIcon className="w-3 h-3" /></div>
                  <div className="absolute left-0 flex items-center"><WhitePlayerIcon className="w-3 h-3" /></div>
                  <div className="absolute right-0 flex items-center"><WhitePlayerIcon className="w-3 h-3" /></div>
                  <span className="text-[9px] font-black text-amber-300 drop-shadow">VS</span>
                </div>
              </div>

              {/* Right Capsule Button */}
              <div className={`flex-1 h-11 rounded-full flex items-center px-2.5 bg-gradient-to-r from-[#0d47a1] via-[#1565c0] to-[#0d47a1] border-2 ${
                selectedSubMode === 'CLASSIC' 
                  ? 'border-amber-400 ring-2 ring-amber-300/80 shadow-[0_0_14px_rgba(251,191,36,0.5)]' 
                  : 'border-amber-400/80 shadow-sm'
              } transition-all`}>
                
                {/* Radio Indicator */}
                <div className="w-6 h-6 rounded-full border-2 border-amber-400 bg-[#05225c] flex items-center justify-center mr-2.5 shadow-inner shrink-0">
                  {selectedSubMode === 'CLASSIC' && (
                    <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                      <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Mode Label */}
                <span className="text-sm sm:text-base font-black italic tracking-wide text-white drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.8)]">
                  Classic
                </span>
              </div>
            </div>

            {/* -------------------- 2. CLASSIC TEAM UP (DEFAULT CHECKED) -------------------- */}
            <div 
              onClick={() => handleModeSelect('TEAM_UP')}
              className="flex items-center gap-2 cursor-pointer group active:scale-[0.98] transition-all"
            >
              {/* Left Tile Icon: 2 vs 2 (Pure White SVG Silhouettes) */}
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-b from-[#094196] to-[#042055] border-2 ${
                selectedSubMode === 'TEAM_UP' ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]' : 'border-sky-400/70'
              } flex flex-col items-center justify-center p-0.5 relative shadow-md shrink-0`}>
                <div className="relative w-full h-full flex items-center justify-between px-1">
                  <div className="flex items-center -space-x-1">
                    <WhitePlayerIcon className="w-3 h-3" />
                    <WhitePlayerIcon className="w-3 h-3" />
                  </div>
                  <span className="text-[9px] font-black text-amber-300 drop-shadow">VS</span>
                  <div className="flex items-center -space-x-1">
                    <WhitePlayerIcon className="w-3 h-3" />
                    <WhitePlayerIcon className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Right Capsule Button */}
              <div className={`flex-1 h-11 rounded-full flex items-center px-2.5 bg-gradient-to-r from-[#0d47a1] via-[#1565c0] to-[#0d47a1] border-2 ${
                selectedSubMode === 'TEAM_UP' 
                  ? 'border-amber-400 ring-2 ring-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.6)]' 
                  : 'border-amber-400/80 shadow-sm'
              } transition-all relative overflow-hidden`}>
                
                {/* Golden Checkmark Badge */}
                <div className="w-6 h-6 rounded-full border-2 border-amber-300 bg-gradient-to-b from-amber-300 to-amber-500 flex items-center justify-center mr-2.5 shadow-md shrink-0">
                  {selectedSubMode === 'TEAM_UP' ? (
                    <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3.5]" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#05225c]" />
                  )}
                </div>

                {/* Double-Line Text: Classic (small) + Team Up (bold) */}
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] font-bold text-amber-200 uppercase tracking-wider">
                    Classic
                  </span>
                  <span className="text-xs sm:text-sm font-black tracking-wide text-white drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.8)]">
                    Team Up
                  </span>
                </div>

                {/* Glowing Sweep Highlight */}
                {selectedSubMode === 'TEAM_UP' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/15 to-transparent pointer-events-none" />
                )}
              </div>
            </div>

            {/* -------------------- 3. QUICK MODE -------------------- */}
            <div 
              onClick={() => handleModeSelect('QUICK')}
              className="flex items-center gap-2 cursor-pointer group active:scale-[0.98] transition-all"
            >
              {/* Left Tile Icon: 4 White Players Around Refresh */}
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-b from-[#094196] to-[#042055] border-2 ${
                selectedSubMode === 'QUICK' ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]' : 'border-sky-400/70'
              } flex flex-col items-center justify-center p-0.5 relative shadow-md shrink-0`}>
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute top-0 flex justify-center"><WhitePlayerIcon className="w-3 h-3" /></div>
                  <div className="absolute bottom-0 flex justify-center"><WhitePlayerIcon className="w-3 h-3" /></div>
                  <div className="absolute left-0 flex items-center"><WhitePlayerIcon className="w-3 h-3" /></div>
                  <div className="absolute right-0 flex items-center"><WhitePlayerIcon className="w-3 h-3" /></div>
                  <div className="w-3.5 h-3.5 rounded-xs bg-sky-400 border border-sky-200 flex items-center justify-center shadow-xs">
                    <RotateCcw className="w-2 h-2 text-white stroke-[3] rotate-45" />
                  </div>
                </div>
              </div>

              {/* Right Capsule Button */}
              <div className={`flex-1 h-11 rounded-full flex items-center px-2.5 bg-gradient-to-r from-[#0d47a1] via-[#1565c0] to-[#0d47a1] border-2 ${
                selectedSubMode === 'QUICK' 
                  ? 'border-amber-400 ring-2 ring-amber-300/80 shadow-[0_0_14px_rgba(251,191,36,0.5)]' 
                  : 'border-amber-400/80 shadow-sm'
              } transition-all`}>
                
                {/* Radio Indicator */}
                <div className="w-6 h-6 rounded-full border-2 border-amber-400 bg-[#05225c] flex items-center justify-center mr-2.5 shadow-inner shrink-0">
                  {selectedSubMode === 'QUICK' && (
                    <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                      <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Mode Label */}
                <span className="text-sm sm:text-base font-black tracking-wide text-white drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.8)]">
                  QUICK
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* D. ACTION BUTTON: NEXT                                                    */}
        {/* ========================================================================= */}
        <div className="w-full flex justify-center mt-2">
          <button
            type="button"
            onClick={handleNextClick}
            className="group relative w-40 sm:w-44 py-2 rounded-full bg-gradient-to-r from-[#1976d2] via-[#2196f3] to-[#1976d2] border-2 border-amber-300 ring-3 ring-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.7)] text-white font-black text-base sm:text-lg tracking-wider active:scale-95 transition-all cursor-pointer overflow-hidden"
          >
            {/* Shimmer Light Reflection Sweep */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 animate-[shimmer_2.5s_infinite]" />
            </div>

            {/* Next Text */}
            <span className="relative z-10 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] flex items-center justify-center gap-1">
              Next
            </span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM BAR: BACK BUTTON (Bottom Left) + TAB DOCK (Underneath)           */}
      {/* ========================================================================= */}
      <div className="relative z-30 w-full px-3 pb-2 flex items-center justify-between">
        {/* Curved Yellow Arrow Back Button */}
        <button
          type="button"
          onClick={handleBackClick}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-[#0a316c] to-[#041a3d] border-2 border-amber-400 ring-2 ring-amber-300/80 shadow-[0_0_12px_rgba(251,191,36,0.5)] flex items-center justify-center text-amber-300 hover:text-white active:scale-90 transition-all cursor-pointer group"
          title="Back to Main Lobby"
          aria-label="Back to Main Lobby"
        >
          {/* Authentic Curved Yellow U-turn Arrow */}
          <ArrowLeft className="w-5 h-5 stroke-[3.5] text-amber-300 group-hover:text-amber-200 transition" />
        </button>

        {/* Faint Bottom Dock Tabs beneath overlay */}
        <div className="flex items-center gap-3.5 text-[9px] font-bold text-slate-400/70 opacity-60">
          <span>EVENT</span>
          <span>ADDA</span>
          <span>INVENTORY</span>
          <span>SOCIAL</span>
        </div>
      </div>

      </div> {/* Closes mobile stage container (line 137) */}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 py-1.5 rounded-full bg-slate-900/95 border border-amber-400 text-amber-300 text-xs font-black shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. GAME RULES GUIDE POPUP (Triggered by ?)                                 */}
      {/* ========================================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xs sm:max-w-sm rounded-3xl bg-gradient-to-b from-[#082d6b] to-[#041940] border-2 border-amber-400 p-4 text-white shadow-2xl relative">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                setShowHelpModal(false);
              }}
              className="absolute top-3 right-3 p-1 rounded-full bg-slate-900/80 text-amber-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-amber-300 uppercase tracking-wide text-center mb-3">
              GAME MODES GUIDE
            </h3>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700">
                <span className="font-black text-amber-400 block mb-0.5">1. Classic Mode</span>
                Standard authentic Ludo match. Move all 4 tokens to home center to win.
              </div>

              <div className="p-2 rounded-xl bg-slate-900/60 border border-amber-400/50">
                <span className="font-black text-amber-300 block mb-0.5">2. Classic Team Up</span>
                2 vs 2 partnership mode! Teammates assist each other and share victories.
              </div>

              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700">
                <span className="font-black text-amber-400 block mb-0.5">3. Quick Mode</span>
                Fast-paced blitz! First player to move just 1 token home wins immediately.
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playButtonClick();
                setShowHelpModal(false);
              }}
              className="mt-4 w-full py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md"
            >
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. THEMES SELECTION SHEET (Triggered by SELECT THEME)                      */}
      {/* ========================================================================= */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xs sm:max-w-sm rounded-3xl bg-gradient-to-b from-[#082d6b] to-[#041940] border-2 border-amber-400 p-4 text-white shadow-2xl relative">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                setShowThemeModal(false);
              }}
              className="absolute top-3 right-3 p-1 rounded-full bg-slate-900/80 text-amber-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-amber-300 uppercase tracking-wide text-center mb-3">
              SELECT BOARD THEME
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'classic', name: 'Classic Ludo', icon: '👑', color: 'from-blue-600 to-indigo-800' },
                { id: 'wood', name: 'Nature Forest', icon: '🦋', color: 'from-emerald-600 to-teal-800' },
                { id: 'royal', name: 'Egypt Pharaoh', icon: '🏺', color: 'from-amber-600 to-yellow-800' },
                { id: 'neon', name: 'Cyber Neon', icon: '💎', color: 'from-purple-600 to-pink-800' },
              ].map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    soundEngine.playButtonClick();
                    onSelectTheme?.(theme.id as BoardTheme);
                    setShowThemeModal(false);
                    showToast(`Theme updated to ${theme.name}`);
                  }}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all active:scale-95 bg-gradient-to-b ${theme.color} ${
                    currentTheme === theme.id ? 'border-amber-400 ring-2 ring-amber-300' : 'border-white/20'
                  }`}
                >
                  <span className="text-2xl">{theme.icon}</span>
                  <span className="text-xs font-black">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

