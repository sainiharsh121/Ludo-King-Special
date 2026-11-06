import React, { useState, useEffect, useRef } from 'react';
import { BoardTheme } from '../types/ludo';
import { soundEngine } from '../utils/soundEngine';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Lock, 
  X
} from 'lucide-react';

interface HomeScreenProps {
  onStartPassNPlay: () => void;
  onStartVsComputer?: () => void;
  onStartQuickMode?: () => void;
  onStartTeamUp?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentTheme?: BoardTheme;
  onSelectTheme?: (theme: BoardTheme) => void;
  onOpenSettings: () => void;
  onShowSplash?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartPassNPlay,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onShowSplash,
}) => {
  // In-app toast notification for locked modes
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToastTimer = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
  };

  const scheduleToastDismiss = () => {
    clearToastTimer();
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const showLockedToast = (modeName: string) => {
    soundEngine.playNoMoveSound();
    setToastMessage(`🔒 ${modeName} is locked! Only PASS N PLAY is enabled for this edition.`);
    scheduleToastDismiss();
  };

  // WCAG 2.1 AA (1.4.13 Content on Hover or Focus): Escape key dismisses toast
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toastMessage) {
        setToastMessage(null);
        clearToastTimer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearToastTimer();
    };
  }, [toastMessage]);

  const handlePassNPlayClick = () => {
    soundEngine.playButtonClick();
    onStartPassNPlay();
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden flex items-center justify-center font-['Nunito',sans-serif] bg-[var(--ui-lobby-bg)]">
      
      {/* 
        WCAG 2.1 AA Responsive Lobby Stage:
        Locker container enforces the exact native 469:1024 aspect ratio of page2_reference.jpg.
        Scales responsively across all displays, screen orientations (1.3.4), and reflow/zoom (1.4.10)
        so that background card graphics and interactive hotspots remain 100% aligned with zero drift.
      */}
      <div 
        className="relative mx-auto h-full max-h-full max-w-full overflow-hidden flex items-center justify-center shadow-2xl"
        style={{
          aspectRatio: '469 / 1024',
          maxHeight: '100%',
          maxWidth: '100%',
        }}
      >
        {/* 1. Authentic Page 2 Reference Graphic (Locked 1:1 to aspect-ratio container) */}
        <img
          src="/page2_reference.jpg"
          alt="Ludo King Page 2 Main Lobby"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
        />

        {/* 2. Top Quick Toolbar (Discreet floating overlays for sound & intro preview) */}
        <div className="absolute top-2 right-2 z-40 flex items-center gap-1.5 pointer-events-auto">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onToggleSound();
            }}
            className="p-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-amber-300 hover:text-white transition shadow backdrop-blur-md cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-300"
            title="Toggle Sound"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
          </button>

          {/* Page 1 Replay Intro Button */}
          {onShowSplash && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onShowSplash();
              }}
              className="p-1.5 rounded-full bg-slate-900/80 border border-amber-400/60 text-amber-300 hover:text-white transition shadow backdrop-blur-md cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-300"
              title="Preview Page 1 (Splash Screen)"
              aria-label="Preview Page 1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}
        </div>

        {/* 3. Interactive Hotspot: Top Left Settings Cog */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            soundEngine.playButtonClick();
            onOpenSettings();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              soundEngine.playButtonClick();
              onOpenSettings();
            }
          }}
          title="Settings & Custom Game Rules"
          aria-label="Settings and Custom Game Rules"
          className="absolute z-30 cursor-pointer rounded-lg hover:bg-white/10 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{
            left: '12.8%',
            top: '5.2%',
            width: '7.5%',
            height: '4.0%',
          }}
        />

        {/* 4. Locked Game Mode Hotspots (Row 1: Online, Team Up, Friends) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => showLockedToast('Online Multiplayer')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showLockedToast('Online Multiplayer');
            }
          }}
          title="ONLINE (Locked in this edition)"
          aria-label="Online Multiplayer Mode (Locked)"
          className="absolute z-20 cursor-pointer rounded-xl hover:bg-amber-400/10 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{
            left: '11.3%',
            top: '42.5%',
            width: '22.0%',
            height: '8.5%',
          }}
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => showLockedToast('Team Up Mode')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showLockedToast('Team Up Mode');
            }
          }}
          title="TEAM UP (Locked in this edition)"
          aria-label="Team Up Mode (Locked)"
          className="absolute z-20 cursor-pointer rounded-xl hover:bg-amber-400/10 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{
            left: '37.0%',
            top: '41.8%',
            width: '25.8%',
            height: '9.5%',
          }}
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => showLockedToast('Play with Friends')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showLockedToast('Play with Friends');
            }
          }}
          title="FRIENDS (Locked in this edition)"
          aria-label="Play with Friends Mode (Locked)"
          className="absolute z-20 cursor-pointer rounded-xl hover:bg-amber-400/10 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{
            left: '63.5%',
            top: '42.2%',
            width: '26.5%',
            height: '9.2%',
          }}
        />

        {/* 5. Row 2 Left: Computer Mode Hotspot (Locked) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => showLockedToast('Vs Computer')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showLockedToast('Vs Computer');
            }
          }}
          title="VS COMPUTER (Locked in this edition)"
          aria-label="Vs Computer Mode (Locked)"
          className="absolute z-20 cursor-pointer rounded-2xl hover:bg-amber-400/10 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{
            left: '20.8%',
            top: '55.0%',
            width: '26.6%',
            height: '9.2%',
          }}
        />

        {/* ========================================================================= */}
        {/* 6. PRIMARY ACTIVE HOTSPOT: PASS N PLAY (THE ONLY CLICKABLE GAME MODE!)    */}
        {/* ========================================================================= */}
        <div
          role="button"
          tabIndex={0}
          onClick={handlePassNPlayClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePassNPlayClick();
            }
          }}
          title="Tap to Play Pass & Play with Friends!"
          aria-label="Play Pass and Play with Friends"
          className="absolute z-30 cursor-pointer rounded-2xl transition-all duration-200 active:scale-95 group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
          style={{
            left: '52.8%',
            top: '55.0%',
            width: '26.6%',
            height: '9.2%',
          }}
        >
          {/* Animated Golden Pulse Ring Glow precisely enclosing the Pass & Play card (WCAG 1.4.11 contrast >= 3:1) */}
          <div className="absolute inset-0 rounded-2xl ring-2 sm:ring-4 ring-amber-400 golden-pulse-glow group-hover:ring-amber-300 transition" />

          {/* Shimmer Light Reflection Sweep */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>

          {/* Bouncing Callout Badge: "PLAY NOW ✨" */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 text-white font-black text-[9px] sm:text-[10px] tracking-wide shadow-xl border border-amber-200 animate-bounce whitespace-nowrap pointer-events-none z-40">
            <Sparkles className="w-2.5 h-2.5 text-yellow-200" />
            <span>PLAY NOW</span>
          </div>
        </div>

        {/* 7. Row 3 Locked Modes (Dice Cup, Tournament, Snakes & Ladders) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => showLockedToast('7 Up Down Mini Game')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showLockedToast('7 Up Down Mini Game');
            }
          }}
          title="Dice Cup (Locked)"
          aria-label="Dice Cup 7 Up Down Mini Game (Locked)"
          className="absolute z-20 cursor-pointer rounded-2xl hover:bg-amber-400/10 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{
            left: '12.8%',
            top: '69.8%',
            width: '14.0%',
            height: '6.2%',
          }}
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => showLockedToast('Tournament Mode')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showLockedToast('Tournament Mode');
            }
          }}
          title="Tournament (Locked)"
          aria-label="Tournament Mode (Locked)"
          className="absolute z-20 cursor-pointer rounded-2xl hover:bg-amber-400/10 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{
            left: '36.5%',
            top: '68.2%',
            width: '27.0%',
            height: '7.8%',
          }}
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => showLockedToast('Snakes & Ladders')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showLockedToast('Snakes & Ladders');
            }
          }}
          title="Snakes & Ladders (Locked)"
          aria-label="Snakes and Ladders Game (Locked)"
          className="absolute z-20 cursor-pointer rounded-2xl hover:bg-amber-400/10 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{
            left: '74.0%',
            top: '69.8%',
            width: '14.0%',
            height: '6.2%',
          }}
        />

        {/* 8. Bottom Navigation Dock Hotspots (Locked Tabs with Toasts) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => showLockedToast('Events & Tournaments')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showLockedToast('Events & Tournaments');
            }
          }}
          title="Event (Locked)"
          aria-label="Event tab (Locked)"
          className="absolute z-20 cursor-pointer hover:bg-white/5 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{
            left: '25.0%',
            top: '92.5%',
            width: '16.0%',
            height: '7.5%',
          }}
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => showLockedToast('Adda Voice Chat')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showLockedToast('Adda Voice Chat');
            }
          }}
          title="Adda (Locked)"
          aria-label="Adda Voice Chat tab (Locked)"
          className="absolute z-20 cursor-pointer hover:bg-white/5 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{
            left: '42.0%',
            top: '92.5%',
            width: '16.0%',
            height: '7.5%',
          }}
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => showLockedToast('Dice & Pawn Inventory')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showLockedToast('Dice & Pawn Inventory');
            }
          }}
          title="Inventory (Locked)"
          aria-label="Inventory tab (Locked)"
          className="absolute z-20 cursor-pointer hover:bg-white/5 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{
            left: '59.0%',
            top: '92.5%',
            width: '16.0%',
            height: '7.5%',
          }}
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => showLockedToast('Social Friends List')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showLockedToast('Social Friends List');
            }
          }}
          title="Social (Locked)"
          aria-label="Social Friends List tab (Locked)"
          className="absolute z-20 cursor-pointer hover:bg-white/5 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{
            left: '76.0%',
            top: '92.5%',
            width: '16.0%',
            height: '7.5%',
          }}
        />

        {/* 9. Floating Toast Notification Banner (WCAG 1.4.13: Hoverable, Dismissible, Persistent) */}
        {toastMessage && (
          <div 
            className="absolute bottom-20 inset-x-3 sm:inset-x-6 z-50 flex items-center justify-center animate-in fade-in slide-in-from-bottom-3 duration-200"
            onMouseEnter={clearToastTimer}
            onMouseLeave={scheduleToastDismiss}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-950/95 border-2 border-amber-400/80 text-amber-200 text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="flex-1 drop-shadow">{toastMessage}</span>
              <button
                type="button"
                onClick={() => {
                  setToastMessage(null);
                  clearToastTimer();
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-300"
                aria-label="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
