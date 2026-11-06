import React, { useState, useRef } from 'react';
import { soundEngine } from '../utils/soundEngine';
import confetti from 'canvas-confetti';
import { X, Sparkles, Trophy } from 'lucide-react';

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAwardCoins: (amount: number) => void;
}

const SEGMENTS = [
  { label: '500 Coins', value: 500, color: '#f59e0b' },
  { label: '1,000 Coins', value: 1000, color: '#3b82f6' },
  { label: '2,500 Coins', value: 2500, color: '#10b981' },
  { label: 'Jackpot 25K!', value: 25000, color: '#ef4444' },
  { label: '750 Coins', value: 750, color: '#8b5cf6' },
  { label: '5,000 Coins', value: 5000, color: '#ec4899' },
  { label: '1,500 Coins', value: 1500, color: '#06b6d4' },
  { label: '10,000 Coins', value: 10000, color: '#eab308' },
];

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  isOpen,
  onClose,
  onAwardCoins,
}) => {
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonPrize(null);

    // Pick a random prize index
    const prizeIdx = Math.floor(Math.random() * SEGMENTS.length);
    const segmentAngle = 360 / SEGMENTS.length;
    // Calculate rotation: 5 full turns (1800 deg) + prize angle offset
    // Indicator is at top (270 deg or 0 deg), let's align
    const targetAngle = 1800 + (SEGMENTS.length - prizeIdx) * segmentAngle - segmentAngle / 2;
    const finalRotation = rotation + targetAngle;
    
    setRotation(finalRotation);

    // Ticking audio interval
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      soundEngine.playWheelTick();
      tickCount++;
      if (tickCount > 25) clearInterval(tickInterval);
    }, 120);

    // After 4.2 seconds, land on the prize
    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      const prize = SEGMENTS[prizeIdx];
      setWonPrize(prize.label);
      onAwardCoins(prize.value);
      soundEngine.playWheelWin();

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 4200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-amber-400/70 rounded-3xl p-5 shadow-2xl flex flex-col items-center overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSpinning}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-40"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-3">
          <h3 className="text-xl font-black text-amber-300 flex items-center justify-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            LUCKY SPIN & WIN
          </h3>
          <p className="text-xs text-slate-400 font-bold">
            Spin daily for free bonus coins!
          </p>
        </div>

        {/* Wheel Container */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2 flex items-center justify-center">
          
          {/* Top Indicator Arrow */}
          <div className="absolute -top-3 z-30 filter drop-shadow-lg">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400" />
          </div>

          {/* Outer Wheel Rim */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] pointer-events-none" />

          {/* Spinning Wheel */}
          <div
            className="w-full h-full rounded-full overflow-hidden shadow-2xl relative transition-transform"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: isSpinning ? '4.2s' : '0s',
              transitionTimingFunction: 'cubic-bezier(0.15, 0.9, 0.25, 1)',
            }}
          >
            {SEGMENTS.map((seg, idx) => {
              const rotate = idx * (360 / SEGMENTS.length);
              return (
                <div
                  key={idx}
                  className="absolute top-0 left-1/2 w-1/2 h-full origin-left flex items-center justify-end pr-3"
                  style={{
                    backgroundColor: seg.color,
                    transform: `rotate(${rotate}deg) skewY(-45deg)`,
                  }}
                >
                  <span
                    className="text-[11px] font-black text-white drop-shadow transform rotate-45 origin-center"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    {seg.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Center Hub / Spin Button */}
          <div className="absolute z-20 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border-4 border-white shadow-xl flex items-center justify-center">
            <span className="text-xl">👑</span>
          </div>
        </div>

        {/* Win Notification */}
        {wonPrize && (
          <div className="my-2 text-center animate-in zoom-in-95 duration-200">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg">
              <Trophy className="w-4 h-4 fill-amber-950" />
              You won {wonPrize}!
            </span>
          </div>
        )}

        {/* Spin CTA Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_6px_0_#b45309] hover:brightness-110 active:translate-y-1 active:shadow-[0_2px_0_#b45309] transition cursor-pointer disabled:opacity-50"
        >
          {isSpinning ? 'SPINNING...' : 'SPIN FOR FREE'}
        </button>

      </div>
    </div>
  );
};
