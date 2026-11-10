import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Play, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface SplashScreenProps {
  onStart: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onStart,
  soundEnabled,
  onToggleSound,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Connecting to Ludo...');
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  // Simulated authentic mobile game loading progression
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsReady(true);
          setStatusText('Ready! Tap to start playing.');
          try {
            localStorage.setItem('ludo_king_splash_seen', 'true');
          } catch {}
          return 100;
        }

        const next = Math.min(100, prev + Math.floor(Math.random() * 8) + 4);
        if (next < 30) {
          setStatusText('Connecting to Ludo...');
        } else if (next < 60) {
          setStatusText('Loading Pass & Play arena...');
        } else if (next < 85) {
          setStatusText('Synthesizing procedural audio...');
        } else {
          setStatusText('Finalizing assets...');
        }
        return next;
      });
    }, 70);

    return () => clearInterval(timer);
  }, []);

  const handleStartGame = () => {
    if (isExiting) return;
    try {
      localStorage.setItem('ludo_king_splash_seen', 'true');
    } catch {}
    setIsExiting(true);
    soundEngine.playGameStartFanfare();

    // Smooth exit transition
    setTimeout(() => {
      onStart();
    }, 350);
  };

  return (
    <div 
      onClick={handleStartGame}
      className={`relative w-full h-full select-none overflow-hidden flex flex-col justify-between font-['Nunito',sans-serif] cursor-pointer transition-all duration-300 ${
        isExiting ? 'scale-105 opacity-0' : 'scale-100 opacity-100'
      }`}
      style={{ backgroundColor: 'var(--ui-lobby-bg)' }}
    >
      {/* 1. Authentic Reference Image Wallpaper (Full Screen Cover) */}
      <img
        src="/splash_screen.jpg"
        alt="Ludo King Page 1 Splash Screen"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
      />

      {/* 2. Atmospheric Ambient Light Overlays & Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle radial dark vignette at top and bottom to make controls crisp */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-slate-950/70 via-slate-950/20 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

        {/* Floating Sparkle Glints around the logo & crown */}
        <div className="absolute top-[32%] left-[24%] text-amber-300 animate-ping opacity-75">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="absolute top-[35%] right-[22%] text-amber-200 animate-pulse opacity-90 delay-300">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="absolute top-[48%] left-[18%] text-cyan-300 animate-pulse opacity-70 delay-700">
          <Zap className="w-3.5 h-3.5" />
        </div>
        <div className="absolute top-[52%] right-[20%] text-yellow-300 animate-ping opacity-60 delay-500">
          <Sparkles className="w-4 h-4" />
        </div>

        {/* Subtle crown golden glow pulse centered on emblem */}
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none animate-pulse" />
      </div>

      {/* 3. Top Header Bar (App branding badge, Sound toggle & Skip) */}
      <header className="relative z-20 w-full flex items-center justify-between p-3 sm:p-4">
        {/* Pass & Play Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-amber-400/40 shadow-lg backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 drop-shadow">
            Pass & Play Edition
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSound();
            }}
            className="p-2 rounded-full bg-slate-900/80 border border-slate-700 text-amber-400 hover:text-white hover:bg-slate-800 transition shadow-lg backdrop-blur-md"
            title="Toggle Sound"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Quick Enter Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleStartGame();
            }}
            className="px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-lg flex items-center gap-1 active:scale-95"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Middle Spacer for Logo in Background Image */}
      <div className="flex-1" />

      {/* 4. Bottom Interactive Loading & Launch Dock */}
      <footer className="relative z-20 w-full p-4 sm:p-6 flex flex-col items-center gap-3">
        
        {/* Loading Bar & Progress */}
        <div className="w-full max-w-sm flex flex-col items-center gap-1.5">
          <div className="w-full flex items-center justify-between text-xs font-black text-slate-200 px-1 drop-shadow">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
              {statusText}
            </span>
            <span className="font-mono text-amber-300 font-black tracking-wider">
              {progress}%
            </span>
          </div>

          {/* Animated Golden Striped Progress Bar */}
          <div className="w-full h-4 bg-slate-950/80 rounded-full border-2 border-amber-400/80 p-0.5 shadow-2xl backdrop-blur-md overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-150 ease-out relative overflow-hidden"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--ui-arcade-g2) 0%, var(--accent-gold) 50%, var(--ui-cosmic-bg-1) 100%)',
                boxShadow: '0 0 12px rgba(251, 191, 36, 0.9)',
              }}
            >
              {/* Shimmer light sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>
        </div>

        {/* Big Glowing Start / Tap Button */}
        <div className="w-full max-w-sm mt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleStartGame();
            }}
            className="w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base tracking-wider uppercase text-slate-950 flex items-center justify-center gap-2.5 transition-all shadow-2xl active:scale-95 cursor-pointer golden-pulse-glow"
            style={{
              background: 'linear-gradient(180deg, var(--ui-arcade-g1) 0%, var(--ui-arcade-g2) 40%, var(--ui-arcade-g3) 80%, var(--ui-arcade-g4) 100%)',
              border: '2px solid var(--ui-arcade-g1)',
            }}
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>{isReady ? 'TAP TO PLAY' : 'TAP SCREEN TO START'}</span>
            <Sparkles className="w-4 h-4 text-slate-950" />
          </button>
        </div>

        {/* Bottom Details / Version */}
        <div className="flex flex-col items-center text-center gap-0.5 text-[10px] text-slate-400 drop-shadow">
          <p className="font-bold flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ludo™ • Official Pass & Play Edition</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono">v1.2.9</span>
          </p>
          <p className="text-slate-400 text-[9px]">
            Tap anywhere on screen to enter the arena
          </p>
        </div>

      </footer>
    </div>
  );
};

