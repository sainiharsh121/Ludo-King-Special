import React, { useState, useEffect } from 'react';
import { PlayerColor, GameRules, SafeZoneMode, GameMode } from '../types/ludo';
import { Play, Settings2, Users, Shield, Zap, Swords, RotateCcw, X } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface SetupModalProps {
  isOpen: boolean;
  onClose?: () => void;
  gameMode?: GameMode;
  onStartGame: (
    playerCount: 2 | 3 | 4,
    seatingMode: 'opposite' | 'adjacent',
    playerNames: Record<PlayerColor, string>,
    rules: GameRules,
    playerAvatars?: Record<PlayerColor, string>
  ) => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ 
  isOpen, 
  onClose,
  gameMode = 'PASS_N_PLAY',
  onStartGame 
}) => {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [seatingMode, setSeatingMode] = useState<'opposite' | 'adjacent'>('opposite');
  const [playerNames, setPlayerNames] = useState<Record<PlayerColor, string>>({
    RED: 'Player 1',
    GREEN: 'Player 2',
    YELLOW: 'Player 3',
    BLUE: 'Player 4',
  });

  const [playerAvatars, setPlayerAvatars] = useState<Record<PlayerColor, string>>({
    RED: '🦁',
    GREEN: '🐯',
    YELLOW: '🦅',
    BLUE: '🐉',
  });

  const [rules, setRules] = useState<GameRules>({
    openOnSixOnly: gameMode !== 'QUICK_MODE',
    mustCaptureToEnterHome: gameMode === 'QUICK_MODE',
    threeSixesForfeit: true,
    bonusOnCapture: true,
    bonusOnHomeReach: true,
    safeZoneMode: 'standard',
    pawnSpeedMs: gameMode === 'QUICK_MODE' ? 155 : 310,
    autoMoveSingleLegal: true,
  });

  const [activeTab, setActiveTab] = useState<'players' | 'rules'>('players');

  useEffect(() => {
    setRules(prev => ({
      ...prev,
      openOnSixOnly: gameMode !== 'QUICK_MODE',
      mustCaptureToEnterHome: gameMode === 'QUICK_MODE',
      pawnSpeedMs: gameMode === 'QUICK_MODE' ? 155 : 310,
    }));
    if (gameMode === 'TEAM_UP') {
      setPlayerCount(4);
    }
  }, [gameMode, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (color: PlayerColor, name: string) => {
    setPlayerNames(prev => ({ ...prev, [color]: name }));
  };

  const handleAvatarChange = (color: PlayerColor, avatar: string) => {
    soundEngine.playButtonClick();
    setPlayerAvatars(prev => ({ ...prev, [color]: avatar }));
  };

  const handleStart = () => {
    soundEngine.playButtonClick();
    onStartGame(playerCount, seatingMode, playerNames, rules, playerAvatars);
  };

  const modeTitles: Record<GameMode, string> = {
    PASS_N_PLAY: 'Pass & Play Edition',
    QUICK_MODE: 'Quick Blitz Mode',
    TEAM_UP: '2 vs 2 Team Up',
    VS_COMPUTER: 'Vs Computer AI',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 p-4 sm:p-5 text-center relative shadow-md">
          {onClose && (
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onClose();
              }}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 text-white/80 hover:text-white transition hover:bg-black/50"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider drop-shadow-md flex items-center justify-center gap-2">
            <img src="/favicon.svg" alt="Ludo" className="w-8 h-8 rounded-lg shadow" />
            <span>LUDO</span>
          </h2>
          <p className="text-xs sm:text-sm font-bold text-amber-200 uppercase tracking-widest mt-0.5">
            {modeTitles[gameMode] || 'Pass & Play Edition'}
          </p>


          {/* Navigation Tabs */}
          <div className="flex justify-center gap-2 mt-3">
            <button
              onClick={() => setActiveTab('players')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                activeTab === 'players'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-black/30 text-white/80 hover:bg-black/40'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Players Setup
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                activeTab === 'rules'
                  ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                  : 'bg-black/30 text-white/80 hover:bg-black/40'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" /> Custom Rules
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'players' ? (
            <>
              {/* Player Count Selection */}
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                  Number of Players
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {([2, 3, 4] as const).map(count => (
                    <button
                      key={count}
                      onClick={() => setPlayerCount(count)}
                      className={`py-3 rounded-2xl font-black text-sm transition-all border-2 flex flex-col items-center gap-1 ${
                        playerCount === count
                          ? 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-lg'
                          : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>{count} Players</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2 Player Seating Mode */}
              {playerCount === 2 && (
                <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    2-Player Seating Layout
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSeatingMode('opposite')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border ${
                        seatingMode === 'opposite'
                          ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      Opposite (Red vs Yellow)
                    </button>
                    <button
                      onClick={() => setSeatingMode('adjacent')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border ${
                        seatingMode === 'adjacent'
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      Adjacent (Red vs Green)
                    </button>
                  </div>
                </div>
              )}

              {/* Player Names Input */}
              <div className="space-y-2.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  Player Names
                </label>
                {(['RED', 'GREEN', 'YELLOW', 'BLUE'] as PlayerColor[]).map((color, idx) => {
                  const isVisible =
                    playerCount === 4 ||
                    (playerCount === 3 && color !== 'BLUE') ||
                    (playerCount === 2 &&
                      seatingMode === 'opposite' &&
                      (color === 'RED' || color === 'YELLOW')) ||
                    (playerCount === 2 &&
                      seatingMode === 'adjacent' &&
                      (color === 'RED' || color === 'GREEN'));

                  if (!isVisible) return null;

                  const colorStyles: Record<PlayerColor, string> = {
                    RED: 'border-rose-500/60 focus:border-rose-400',
                    GREEN: 'border-emerald-500/60 focus:border-emerald-400',
                    YELLOW: 'border-amber-500/60 focus:border-amber-400',
                    BLUE: 'border-sky-500/60 focus:border-sky-400',
                  };

                  const avatarList = ['🦁', '🐯', '🦅', '🐉', '👑', '⚡', '🤖', '🐼', '🦊', '🐺'];

                  return (
                    <div 
                      key={color} 
                      className="flex items-center gap-2.5 p-2 rounded-2xl bg-slate-800/40 border border-slate-800"
                    >
                      {/* Avatar Selector Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const currentIdx = avatarList.indexOf(playerAvatars[color] || '🦁');
                          const nextAvatar = avatarList[(currentIdx + 1) % avatarList.length];
                          handleAvatarChange(color, nextAvatar);
                        }}
                        title="Click to cycle avatar"
                        className="w-10 h-10 rounded-xl bg-slate-950 border-2 border-amber-400/60 flex items-center justify-center text-xl shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
                      >
                        {playerAvatars[color]}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-black uppercase text-slate-400">
                            {color} Player
                          </span>
                          {gameMode === 'VS_COMPUTER' && idx > 0 && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              BOT AI
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={playerNames[color]}
                          maxLength={14}
                          onChange={e => handleNameChange(color, e.target.value)}
                          className={`w-full bg-slate-950 border px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-white outline-none transition-all ${colorStyles[color]}`}
                          placeholder={`${color} Player`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

            </>
          ) : (
            /* Custom Rules Specification Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4" /> Custom Gameplay Specifications
                </span>
                <button
                  onClick={() =>
                    setRules({
                      openOnSixOnly: true,
                      mustCaptureToEnterHome: false,
                      threeSixesForfeit: true,
                      bonusOnCapture: true,
                      bonusOnHomeReach: true,
                      safeZoneMode: 'standard',
                      pawnSpeedMs: 310,
                      autoMoveSingleLegal: true,
                    })
                  }
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset to Classic
                </button>
              </div>

              {/* Rule 1: Pawn Unlock */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> Pawn Unlock Condition
                  </div>
                  <div className="text-xs text-slate-400">
                    {rules.openOnSixOnly ? 'Requires rolling 6 to open base' : 'Roll 1 or 6 opens base (Fast Start)'}
                  </div>
                </div>
                <button
                  onClick={() => setRules(r => ({ ...r, openOnSixOnly: !r.openOnSixOnly }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    rules.openOnSixOnly
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {rules.openOnSixOnly ? '6 Only' : '1 or 6'}
                </button>
              </div>

              {/* Rule 2: Mandatory Kill to enter home corridor */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-rose-400" /> Mandatory Kill Requirement
                  </div>
                  <div className="text-xs text-slate-400">
                    Must capture opponent before entering home column (Quick game rule)
                  </div>
                </div>
                <button
                  onClick={() =>
                    setRules(r => ({ ...r, mustCaptureToEnterHome: !r.mustCaptureToEnterHome }))
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    rules.mustCaptureToEnterHome
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {rules.mustCaptureToEnterHome ? 'Active' : 'Off (Free)'}
                </button>
              </div>

              {/* Rule 3: Three 6s Penalty */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-sky-400" /> Three Consecutive 6s Penalty
                  </div>
                  <div className="text-xs text-slate-400">
                    Third consecutive six cancels turn immediately
                  </div>
                </div>
                <button
                  onClick={() =>
                    setRules(r => ({ ...r, threeSixesForfeit: !r.threeSixesForfeit }))
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    rules.threeSixesForfeit
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {rules.threeSixesForfeit ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Rule 4: Safe Star Cells */}
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="text-sm font-black text-slate-100">Safe Star Zones</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['standard', 'exits_only', 'none'] as SafeZoneMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setRules(r => ({ ...r, safeZoneMode: mode }))}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                        rules.safeZoneMode === mode
                          ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                          : 'border-slate-800 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {mode === 'standard' && 'Standard (8)'}
                      {mode === 'exits_only' && 'Exits Only (4)'}
                      {mode === 'none' && 'No Safe Zones'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rule 5: Pawn Hop Speed */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="text-sm font-black text-slate-100">Animation Hop Speed</div>
                  <div className="text-xs text-slate-400">
                    {rules.pawnSpeedMs === 310 ? 'Normal (smooth hops)' : 'Turbo Fast (quick matches)'}
                  </div>
                </div>
                <button
                  onClick={() =>
                    setRules(r => ({
                      ...r,
                      pawnSpeedMs: r.pawnSpeedMs === 310 ? 155 : 310,
                    }))
                  }
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-800 border border-slate-700 text-slate-200"
                >
                  {rules.pawnSpeedMs === 310 ? '1x Normal' : '2x Turbo'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Start Button */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800">
          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-slate-950 font-black text-base tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" /> Start Pass & Play Match
          </button>
        </div>

      </div>
    </div>
  );
};

