import React, { useState } from 'react';
import { soundEngine } from '../utils/soundEngine';
import confetti from 'canvas-confetti';
import { X, Gift, Coins, Sparkles, Check } from 'lucide-react';

interface FreeCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimCoins: (amount: number) => void;
}

export const FreeCoinsModal: React.FC<FreeCoinsModalProps> = ({
  isOpen,
  onClose,
  onClaimCoins,
}) => {
  const [claimedDays, setClaimedDays] = useState<number[]>([1]);

  if (!isOpen) return null;

  const dailyRewards = [
    { day: 1, reward: 1000, label: '1,000' },
    { day: 2, reward: 2500, label: '2,500' },
    { day: 3, reward: 5000, label: '5,000' },
    { day: 4, reward: 7500, label: '7,500' },
    { day: 5, reward: 10000, label: '10,000' },
    { day: 6, reward: 15000, label: '15,000' },
    { day: 7, reward: 50000, label: '50K 👑' },
  ];

  const handleClaim = (day: number, amount: number) => {
    if (claimedDays.includes(day)) return;
    setClaimedDays([...claimedDays, day]);
    onClaimCoins(amount);
    soundEngine.playCoinSound();

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-amber-400 rounded-3xl p-5 shadow-2xl flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-lg font-black text-white">Daily Login Bonus</h3>
            <p className="text-[10px] text-slate-400 font-bold">Collect free coins every day!</p>
          </div>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-4 gap-2 my-2">
          {dailyRewards.map(item => {
            const isClaimed = claimedDays.includes(item.day);
            const isToday = item.day === 2 && !isClaimed;

            return (
              <button
                key={item.day}
                onClick={() => handleClaim(item.day, item.reward)}
                disabled={isClaimed}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all ${
                  item.day === 7 ? 'col-span-2 bg-gradient-to-r from-amber-500/20 to-rose-500/20 border-amber-400' : ''
                } ${
                  isClaimed
                    ? 'border-emerald-500/60 bg-emerald-500/10 opacity-75'
                    : isToday
                    ? 'border-amber-400 bg-amber-400/20 animate-pulse'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                }`}
              >
                <span className="text-[10px] font-black text-slate-400">Day {item.day}</span>
                <span className="text-lg my-0.5">💰</span>
                <span className="text-[11px] font-black text-amber-300">{item.label}</span>
                {isClaimed && (
                  <span className="text-[9px] font-black text-emerald-400 flex items-center gap-0.5 mt-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" /> Done
                  </span>
                )}
                {isToday && (
                  <span className="text-[9px] font-black text-amber-400 mt-0.5">
                    Claim!
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Free Coins */}
        <button
          onClick={() => {
            onClaimCoins(2500);
            soundEngine.playCoinSound();
            confetti({ particleCount: 30, spread: 50 });
          }}
          className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition cursor-pointer"
        >
          <Coins className="w-4 h-4" /> Claim +2,500 Quick Bonus
        </button>
      </div>
    </div>
  );
};
