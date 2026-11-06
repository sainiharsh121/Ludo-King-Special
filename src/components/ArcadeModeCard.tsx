import React from 'react';
import { GameMode } from '../types/ludo';
import { soundEngine } from '../utils/soundEngine';
import { Sparkles, Users, Zap, Swords, Bot } from 'lucide-react';

interface ArcadeModeCardProps {
  mode: GameMode;
  onClick: () => void;
  isPrimary?: boolean;
}

export const ArcadeModeCard: React.FC<ArcadeModeCardProps> = ({
  mode,
  onClick,
  isPrimary = false,
}) => {
  const handleClick = () => {
    soundEngine.playButtonClick();
    onClick();
  };

  // Render Mode-Specific Artwork
  const renderIllustration = () => {
    switch (mode) {
      case 'PASS_N_PLAY':
        return (
          <div className="relative w-full h-20 sm:h-24 flex items-center justify-center overflow-hidden">
            {/* Ambient golden stage glow */}
            <div className="absolute w-24 h-16 bg-amber-400/20 rounded-full blur-md" />

            {/* Razor-Sharp Vector Illustration of Two Kids Playing Ludo (Matches Image 1 directly) */}
            <svg
              className="w-full h-full max-h-[82px] sm:max-h-[96px] filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
              viewBox="0 0 200 130"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Radial gradient defs */}
              <defs>
                <linearGradient id="goldKidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="45%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
                <filter id="kidGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.5" />
                </filter>
              </defs>

              {/* Central Ludo Board (Diamond on the floor) */}
              <g filter="url(#kidGlow)">
                {/* Board base / shadow */}
                <polygon
                  points="100,68 126,82 100,96 74,82"
                  fill="#ca8a04"
                />
                {/* Board top face */}
                <polygon
                  points="100,66 125,80 100,94 75,80"
                  fill="url(#goldKidGrad)"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
                {/* Quadrants dividers */}
                <line x1="100" y1="66" x2="100" y2="94" stroke="#854d0e" strokeWidth="0.8" />
                <line x1="75" y1="80" x2="125" y2="80" stroke="#854d0e" strokeWidth="0.8" />
                
                {/* Mini color quadrant dots on board */}
                <circle cx="93" cy="74" r="2" fill="#e11d48" />
                <circle cx="107" cy="74" r="2" fill="#059669" />
                <circle cx="93" cy="86" r="2" fill="#0284c7" />
                <circle cx="107" cy="86" r="2" fill="#d97706" />
              </g>

              {/* Left Kid (Wearing backwards cap, seated, arm reaching toward board) */}
              <g fill="url(#goldKidGrad)" filter="url(#kidGlow)">
                {/* Head */}
                <circle cx="48" cy="38" r="16" />
                {/* Backwards cap & visor */}
                <path d="M34 32 C34 22 58 20 62 30 C55 28 42 30 38 34 Z" fill="#fef08a" />
                <path d="M34 33 C25 35 22 39 21 42 C26 42 32 37 35 34 Z" fill="#ca8a04" />
                {/* Cap button */}
                <circle cx="48" cy="22" r="2" fill="#eab308" />
                {/* Neck & Torso leaning forward */}
                <path d="M42 50 C44 54 48 68 50 82 C52 92 64 94 68 85 C68 76 60 56 56 48 Z" />
                {/* Back / spine curve */}
                <path d="M34 52 C30 62 26 78 30 90 C34 98 48 98 52 94 C46 88 42 70 42 54 Z" />
                {/* Outstretched right arm pointing/playing with pawn */}
                <path d="M52 58 C60 62 72 68 82 72 C85 73 85 76 81 77 C72 75 62 70 52 65 Z" />
                {/* Hand with token */}
                <circle cx="84" cy="73" r="3.5" fill="#fef08a" />
                {/* Seated legs on floor */}
                <path d="M32 90 C28 94 30 102 36 104 C50 106 66 104 80 98 C82 95 78 92 70 93 C58 96 46 96 38 92 Z" />
                <circle cx="80" cy="97" r="4" fill="#facc15" />
              </g>

              {/* Right Kid (Seated facing left, leaning in, arm reaching to board) */}
              <g fill="url(#goldKidGrad)" filter="url(#kidGlow)">
                {/* Head */}
                <circle cx="152" cy="40" r="16" />
                {/* Hair tuft */}
                <path d="M152 24 C155 18 160 19 162 22 C158 24 156 25 152 25 Z" fill="#fef08a" />
                {/* Torso leaning forward */}
                <path d="M158 52 C156 56 152 70 150 84 C148 94 136 96 132 87 C132 78 140 58 144 50 Z" />
                {/* Back curve */}
                <path d="M166 54 C170 64 174 80 170 92 C166 100 152 100 148 96 C154 90 158 72 158 56 Z" />
                {/* Outstretched left arm reaching toward board */}
                <path d="M148 60 C140 64 128 70 118 74 C115 75 115 78 119 79 C128 77 138 72 148 67 Z" />
                {/* Hand with token */}
                <circle cx="116" cy="75" r="3.5" fill="#fef08a" />
                {/* Seated legs on floor */}
                <path d="M168 92 C172 96 170 104 164 106 C150 108 134 106 120 100 C118 97 122 94 130 95 C142 98 154 98 162 94 Z" />
                <circle cx="120" cy="99" r="4" fill="#facc15" />
              </g>
            </svg>
          </div>
        );

      case 'QUICK_MODE':
        return (
          <div className="relative w-full h-20 sm:h-24 flex items-center justify-center overflow-hidden">
            {/* Speed trails & Gold Pin matching Image 2 */}
            <div className="relative flex items-center justify-center">
              {/* Dynamic diagonal speed motion streaks */}
              <div className="absolute -left-8 sm:-left-10 flex flex-col gap-1.5 opacity-80 -rotate-12">
                <span className="w-8 h-1.5 rounded-full bg-gradient-to-r from-transparent via-amber-300 to-white animate-pulse" />
                <span className="w-12 h-1.5 rounded-full bg-gradient-to-r from-transparent via-yellow-200 to-white" />
                <span className="w-6 h-1 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-amber-200" />
              </div>
              
              {/* Golden Speed Pin / Target (Matches Image 2) */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-100 flex items-center justify-center shadow-2xl border-2 border-white z-10 transform hover:scale-105 transition">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-500 border border-amber-200 flex items-center justify-center shadow-inner">
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-amber-950 fill-amber-200 drop-shadow" />
                </div>
              </div>

              {/* Fast Dice badge */}
              <div className="absolute -bottom-1.5 -right-2 bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full border border-white shadow-lg">
                ⚡ BLITZ
              </div>
            </div>
          </div>
        );

      case 'TEAM_UP':
        return (
          <div className="relative w-full h-20 sm:h-24 flex items-center justify-center overflow-hidden">
            <div className="relative flex items-center justify-center">
              {/* Central Golden Winged Sword (Matches Image 2) */}
              <div className="absolute -top-3 z-20">
                <div className="p-2 rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 border-2 border-white shadow-xl flex items-center justify-center">
                  <Swords className="w-6 h-6 text-slate-950 drop-shadow" />
                </div>
              </div>

              {/* Green & Red United Pawn Markers (Matches Image 2) */}
              <div className="flex items-end gap-3 pt-4">
                {/* Green Marker */}
                <div className="w-7 h-9 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex flex-col items-center transform -rotate-6">
                  <div className="w-4.5 h-4.5 rounded-full bg-emerald-300 shadow-inner mt-0.5" />
                  <div className="w-5.5 h-3 bg-emerald-700 rounded-b mt-0.5" />
                </div>

                {/* Red Marker */}
                <div className="w-7 h-9 rounded-full bg-rose-500 border-2 border-white shadow-xl flex flex-col items-center transform rotate-6">
                  <div className="w-4.5 h-4.5 rounded-full bg-rose-300 shadow-inner mt-0.5" />
                  <div className="w-5.5 h-3 bg-rose-700 rounded-b mt-0.5" />
                </div>
              </div>

              <div className="absolute -bottom-1.5 bg-gradient-to-r from-emerald-500 to-rose-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border border-white shadow-lg">
                2 vs 2
              </div>
            </div>
          </div>
        );

      case 'VS_COMPUTER':
        return (
          <div className="relative w-full h-20 sm:h-24 flex items-center justify-center overflow-hidden">
            <div className="relative flex items-center justify-center">
              {/* Golden 3D Duel Card (Matches Image 2) */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border-2 border-white shadow-xl flex flex-col items-center justify-center transform -rotate-3 hover:rotate-0 transition">
                <span className="arcade-banner-text text-xl sm:text-2xl font-black text-white drop-shadow">
                  VS
                </span>
                <span className="text-[9px] font-black text-amber-950 uppercase tracking-widest -mt-1">
                  AI BOTS
                </span>
              </div>

              {/* Bot icon badge */}
              <div className="absolute -top-1.5 -right-2 p-1.5 rounded-full bg-indigo-600 text-white border-2 border-white shadow-lg">
                <Bot className="w-4 h-4" />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const titles: Record<GameMode, string> = {
    PASS_N_PLAY: 'PASS N PLAY',
    QUICK_MODE: 'QUICK MODE',
    TEAM_UP: 'TEAM UP',
    VS_COMPUTER: 'VS COMPUTER',
  };

  return (
    <div
      onClick={handleClick}
      className={`arcade-mode-card group ${
        isPrimary ? 'golden-pulse-glow ring-2 sm:ring-4 ring-amber-300' : ''
      }`}
    >
      {/* Popular / Recommended Badge for Pass & Play */}
      {isPrimary && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-[10px] sm:text-xs shadow-lg border border-amber-200 animate-bounce">
          <Sparkles className="w-3 h-3 text-yellow-200" />
          <span>PLAY WITH FRIENDS</span>
        </div>
      )}

      {/* Inner Blue Recessed Stage */}
      <div className="arcade-inner-stage">
        {renderIllustration()}
      </div>

      {/* Bottom Golden Arcade Text Banner */}
      <div className="w-full pt-2 pb-1 text-center">
        <span className="arcade-banner-text text-xs sm:text-sm md:text-base tracking-wider block">
          {titles[mode]}
        </span>
      </div>
    </div>
  );
};
