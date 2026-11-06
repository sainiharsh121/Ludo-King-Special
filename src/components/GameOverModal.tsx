import React, { useEffect, useState } from 'react';
import { Player, PlayerColor } from '../types/ludo';
import { soundEngine } from '../utils/soundEngine';
import confetti from 'canvas-confetti';
import { Crown, RotateCcw, Volume2, VolumeX, Sparkles, Share2, Check, Menu } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  players: Player[];
  onRestart: () => void;
  onHome?: () => void;
  gameMode?: string;
  winningTeam?: number | null;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  players,
  onRestart,
  onHome,
  gameMode,
  winningTeam,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(!soundEngine.enabled);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const handleShare = async () => {
    soundEngine.playButtonClick();
    const ranked = [...players]
      .filter(p => p.isActive)
      .sort((a, b) => {
        if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
        if (a.rank !== null) return -1;
        if (b.rank !== null) return 1;
        return 0;
      });

    const summary = '🏆 Ludo Match Results:\n' +
      ranked.map((p, i) => `${i + 1}. ${p.name} (Rank #${p.rank || i + 1})`).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ludo Match Results',
          text: summary,
        });
        return;
      } catch {}
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(summary);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      } catch {}
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Trigger celebratory rocket firework audio with whistling ascents & booms
    soundEngine.playCelebrationRocketSound();

    // Dynamically query CSS variable palette for confetti to guarantee ZERO raw hex codes
    const getCssVar = (varName: string, fallback: string): string => {
      if (typeof window === 'undefined') return fallback;
      const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return val || fallback;
    };

    const confettiColors = [
      getCssVar('--accent-gold', 'gold'),
      getCssVar('--seat-blue', 'dodgerblue'),
      getCssVar('--seat-red', 'crimson'),
      getCssVar('--seat-green', 'limegreen'),
      getCssVar('--text-light', 'white'),
    ];

    // Fire continuous celebration firework particle rockets across the board
    const animationEnd = Date.now() + 3200;
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      // Left rocket burst
      confetti({
        particleCount: 28,
        angle: 60,
        spread: 65,
        origin: { x: 0.15, y: 0.35 },
        colors: confettiColors,
        startVelocity: 45,
        ticks: 80,
      });

      // Right rocket burst
      confetti({
        particleCount: 28,
        angle: 120,
        spread: 65,
        origin: { x: 0.85, y: 0.35 },
        colors: confettiColors,
        startVelocity: 45,
        ticks: 80,
      });

      // Center sky starburst
      confetti({
        particleCount: 35,
        spread: 100,
        origin: { x: 0.5, y: 0.2 },
        colors: confettiColors,
        startVelocity: 35,
        ticks: 90,
      });
    }, 420);

    return () => {
      clearInterval(interval);
      try {
        confetti.reset();
      } catch {}
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Fallback default seat colors using CSS variables
  const DEFAULT_SEAT_VAR: Record<PlayerColor, string> = {
    RED: 'var(--seat-red)',
    GREEN: 'var(--seat-green)',
    YELLOW: 'var(--accent-yellow)',
    BLUE: 'var(--seat-blue)',
  };

  // Sort players by rank (1st, 2nd, 3rd, 4th)
  const rankedPlayers = [...players]
    .filter(p => p.isActive)
    .sort((a, b) => {
      if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
      if (a.rank !== null) return -1;
      if (b.rank !== null) return 1;
      return 0;
    });

  const totalPlayers = rankedPlayers.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between pointer-events-none select-none overflow-hidden animate-in fade-in duration-300">
      {/* 1. Translucent backdrop allowing the board and rank badges to show clearly */}
      <div className="absolute inset-0 bg-slate-950/40 pointer-events-auto transition-opacity" />

      {/* 2. Visual Firework Particle Rings Overlay (matching reference snap over the board) */}
      <div className="relative w-full flex-1 pointer-events-none overflow-hidden">
        {/* Shimmering Firework Ring 1 (Top-Left) */}
        <div
          className="absolute top-[16%] left-[22%] -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-dashed animate-ping opacity-75"
          style={{
            borderColor: 'var(--accent-gold)',
            boxShadow: '0 0 30px var(--accent-gold)',
            animationDuration: '2.2s',
          }}
        />
        {/* Shimmering Firework Ring 2 (Top-Right Cyan/Blue) */}
        <div
          className="absolute top-[22%] right-[18%] translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-40 sm:h-40 rounded-full border-2 border-dotted animate-ping opacity-80"
          style={{
            borderColor: 'var(--seat-blue)',
            boxShadow: '0 0 35px var(--seat-blue)',
            animationDuration: '2.6s',
            animationDelay: '600ms',
          }}
        />
        {/* Sparkle bursts */}
        <div className="absolute top-[12%] right-[32%] text-amber-300 animate-pulse">
          <Sparkles className="w-6 h-6 drop-shadow" style={{ color: 'var(--accent-gold)' }} />
        </div>
        <div className="absolute top-[28%] left-[28%] text-amber-300 animate-bounce">
          <Sparkles className="w-5 h-5 drop-shadow" style={{ color: 'var(--accent-gold)' }} />
        </div>
      </div>

      {/* 3. Bottom Congratulations Card (matching reference snap bottom sheet) */}
      <div className="relative z-10 w-full max-w-[460px] mx-auto pointer-events-auto px-2.5 pb-3 sm:pb-5 animate-in slide-in-from-bottom duration-500">
        
        {/* Golden Scroll Banner Header: "Congratulations!" */}
        <div className="relative flex items-center justify-center -mb-3.5 z-20 px-3">
          {/* Left Gold Scroll Finial */}
          <div
            className="w-4 h-9 sm:w-5 sm:h-10 rounded-l-md shadow-lg border-2 flex items-center justify-center"
            style={{
              background: 'linear-gradient(90deg, var(--accent-gold), var(--ui-modal-gold-edge))',
              borderColor: 'var(--accent-gold)',
            }}
          />

          {/* Central Blue Banner with Gold Border */}
          <div
            className="relative flex-1 max-w-[310px] sm:max-w-[340px] py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl border-2 flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, var(--ui-banner-blue-1), var(--ui-banner-blue-2))',
              borderColor: 'var(--accent-gold)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.35)',
            }}
          >
            {/* Crown sitting proudly on top of banner */}
            <Crown
              className="w-5 h-5 sm:w-6 sm:h-6 absolute -top-3.5 drop-shadow animate-bounce"
              style={{
                color: 'var(--accent-gold)',
                fill: 'var(--accent-gold)',
              }}
            />
            <h2
              className="text-2xl sm:text-3xl font-black tracking-wide drop-shadow select-none"
              style={{
                color: 'var(--accent-gold)',
                textShadow: '0 2px 4px rgba(0,0,0,0.85), 0 0 10px rgba(255,215,0,0.45)',
              }}
            >
              Congratulations!
            </h2>
          </div>

          {/* Right Gold Scroll Finial */}
          <div
            className="w-4 h-9 sm:w-5 sm:h-10 rounded-r-md shadow-lg border-2 flex items-center justify-center"
            style={{
              background: 'linear-gradient(90deg, var(--ui-modal-gold-edge), var(--accent-gold))',
              borderColor: 'var(--accent-gold)',
            }}
          />
        </div>

        {/* Card Main Body */}
        <div
          className="rounded-3xl border-2 shadow-2xl pt-6 pb-3 px-3 sm:px-4 flex flex-col gap-2.5"
          style={{
            background: 'linear-gradient(180deg, var(--ui-modal-card-bg-2) 0%, var(--ui-modal-card-bg-1) 50%, var(--ui-modal-card-bg-3) 100%)',
            borderColor: 'var(--accent-gold)',
            boxShadow: '0 0 35px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.15)',
          }}
        >
          {/* Team Up Win Header Note if in Team Up Mode */}
          {gameMode === 'TEAM_UP' && (
            <div
              className="py-1 px-3 rounded-xl border flex items-center justify-between text-xs font-black uppercase tracking-wider"
              style={{
                backgroundColor: 'var(--ui-modal-row-bg)',
                borderColor: 'var(--accent-gold)',
                color: 'var(--accent-gold)',
              }}
            >
              <span>{winningTeam === 0 ? 'Team A Champions' : 'Team B Champions'}</span>
              <span>8/8 Home</span>
            </div>
          )}

          {/* Ranked Players Listing */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {rankedPlayers.map((player, index) => {
              const rankVal = player.rank || (index + 1);
              // In classic 4P: ranks 1, 2, 3 are Winners; rank 4 is Loser
              // In 2P mode: rank 1 is Winner; rank 2 is Loser
              // In Team Up: rank 1 (winning team) is Winner; rank 2 (losing team) is Loser
              const isWinner =
                gameMode === 'TEAM_UP'
                  ? rankVal === 1
                  : totalPlayers <= 2
                  ? rankVal === 1
                  : rankVal < totalPlayers;

              const seatColor = player.tokenColorHex || DEFAULT_SEAT_VAR[player.color];

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-xl border transition-all"
                  style={{
                    backgroundColor: 'var(--ui-modal-row-bg)',
                    borderColor: 'var(--ui-modal-row-border)',
                  }}
                >
                  {/* Left Column: Crown + Rank Badge */}
                  <div className="w-10 flex items-center justify-center flex-shrink-0">
                    {rankVal <= 3 && isWinner ? (
                      <div className="relative flex items-center justify-center w-8 h-8">
                        <Crown
                          className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow"
                          style={{
                            color: 'var(--accent-gold)',
                            fill: 'var(--accent-gold)',
                          }}
                        />
                        <span
                          className="absolute inset-0 flex items-center justify-center font-black text-xs sm:text-sm pt-1.5 drop-shadow-sm select-none"
                          style={{ color: 'var(--text-dark)' }}
                        >
                          {rankVal}
                        </span>
                      </div>
                    ) : (
                      <span
                        className="text-lg sm:text-xl font-black drop-shadow select-none"
                        style={{ color: 'var(--text-light)' }}
                      >
                        {rankVal}
                      </span>
                    )}
                  </div>

                  {/* Center Column: Teardrop Pin Token + Player Name */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 px-2">
                    {/* Teardrop map-pin token icon in player's color */}
                    <svg viewBox="0 0 24 32" className="w-5 h-6 sm:w-6 sm:h-7 flex-shrink-0 drop-shadow">
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.52-4.48-10-10-10z"
                        fill="var(--token-body)"
                        stroke="var(--token-outline)"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="7.2"
                        fill={seatColor}
                        stroke="var(--token-outline)"
                        strokeWidth="0.8"
                      />
                      <circle cx="9.8" cy="9.8" r="1.8" fill="var(--token-body)" opacity="0.85" />
                    </svg>

                    <div className="flex flex-col min-w-0">
                      <span
                        className="font-black text-sm sm:text-base tracking-wide truncate drop-shadow"
                        style={{ color: 'var(--text-light)' }}
                      >
                        {player.name}
                      </span>
                      {player.team && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: 'var(--accent-gold)' }}
                        >
                          {player.team === 'TEAM_A' ? 'Team A' : 'Team B'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Winner / Loser Tag */}
                  <div className="w-20 text-right flex-shrink-0">
                    <span
                      className="font-extrabold italic text-sm sm:text-base tracking-wider drop-shadow select-none"
                      style={{
                        color: isWinner ? 'var(--ui-modal-winner)' : 'var(--ui-modal-loser)',
                      }}
                    >
                      {isWinner ? 'Winner' : 'Loser'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. Action Buttons Toolbar (Menu, Audio Mute, Share, Rematch matching reference snap) */}
          <div className="flex items-center justify-between gap-2 pt-1.5">
            {/* Home / Menu Button */}
            <button
              onClick={() => {
                try {
                  confetti.reset();
                } catch {}
                soundEngine.playButtonClick();
                if (onHome) onHome();
              }}
              className="flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-full border-2 flex items-center justify-center gap-1.5 shadow-lg active:scale-95 hover:opacity-95 transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(180deg, var(--ui-banner-blue-1), var(--ui-banner-blue-2))',
                borderColor: 'var(--accent-gold)',
                color: 'var(--text-light)',
              }}
            >
              <Menu className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              <span className="font-black text-xs sm:text-sm tracking-wide">Menu</span>
            </button>

            {/* Sound Toggle Button */}
            <button
              onClick={() => {
                soundEngine.enabled = !soundEngine.enabled;
                setIsMuted(!soundEngine.enabled);
                soundEngine.playButtonClick();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center shadow-lg active:scale-95 hover:opacity-95 transition-all cursor-pointer flex-shrink-0"
              style={{
                background: 'linear-gradient(180deg, var(--ui-banner-blue-1), var(--ui-banner-blue-2))',
                borderColor: 'var(--accent-gold)',
                color: 'var(--accent-gold)',
              }}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Share Button (matching reference snapshot) */}
            <button
              onClick={handleShare}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center shadow-lg active:scale-95 hover:opacity-95 transition-all cursor-pointer flex-shrink-0"
              style={{
                background: 'linear-gradient(180deg, var(--ui-banner-blue-1), var(--ui-banner-blue-2))',
                borderColor: 'var(--accent-gold)',
                color: 'var(--accent-gold)',
              }}
              title={copiedShare ? 'Copied Results!' : 'Share Results'}
            >
              {copiedShare ? (
                <Check className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Rematch Button */}
            <button
              onClick={() => {
                try {
                  confetti.reset();
                } catch {}
                soundEngine.playButtonClick();
                onRestart();
              }}
              className="flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-full border-2 flex items-center justify-center gap-1.5 shadow-lg active:scale-95 hover:opacity-95 transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(180deg, var(--accent-gold), var(--ui-modal-gold-edge))',
                borderColor: 'var(--accent-gold)',
                color: 'var(--text-dark)',
              }}
            >
              <RotateCcw className="w-4 h-4" style={{ color: 'var(--text-dark)' }} />
              <span className="font-black text-xs sm:text-sm tracking-wide">Rematch</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
