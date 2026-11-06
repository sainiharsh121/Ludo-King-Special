import React from 'react';
import { Player, PlayerColor, TurnPhase } from '../types/ludo';
import { Dice3D } from './Dice3D';
import { Trophy, Swords } from 'lucide-react';

interface PlayerHUDProps {
  player?: Player;
  isActiveTurn: boolean;
  phase: TurnPhase;
  diceValue: number;
  isRolling: boolean;
  onRollDice: () => void;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({
  player,
  isActiveTurn,
  phase,
  diceValue,
  isRolling,
  onRollDice,
  position,
}) => {
  // If player slot is inactive or not present (e.g. in 2P mode, Green & Blue are inactive)
  if (!player || !player.isActive) {
    return <div className="invisible w-full" />;
  }

  const isRight = position.includes('right');

  // Fallback default colors using CSS variables from role map
  const DEFAULT_SEAT_VAR: Record<PlayerColor, string> = {
    RED: 'var(--seat-red)',
    GREEN: 'var(--seat-green)',
    YELLOW: 'var(--accent-yellow)',
    BLUE: 'var(--seat-blue)',
  };

  const activeColorHex = player.tokenColorHex || DEFAULT_SEAT_VAR[player.color];
  const isDiceTurn = isActiveTurn && phase === 'WAITING_ROLL';

  return (
    <div className={`relative w-full flex items-center ${isRight ? 'justify-end' : 'justify-start'}`}>
      {/* Main HUD Card - compact inline-flex matching reference snapshot */}
      <div
        onClick={() => {
          if (isDiceTurn) onRollDice();
        }}
        className={`relative inline-flex items-center gap-1.5 sm:gap-2 rounded-2xl p-1 sm:p-1.5 transition-all duration-300 border-[2.5px] shadow-lg select-none ${
          isActiveTurn
            ? 'border-[var(--accent-gold)] ring-2 ring-[var(--accent-gold)]/50 shadow-[0_4px_16px_rgba(255,215,0,0.35)] scale-[1.02] z-20 cursor-pointer'
            : 'border-slate-500/60 opacity-90 z-10'
        } ${isRight ? 'flex-row-reverse' : 'flex-row'}`}
        style={{
          background: 'linear-gradient(180deg, var(--ui-match-bg-2) 0%, var(--ui-match-bg-3) 50%, var(--ui-match-bg-1) 100%)',
          boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.5), 0 4px 10px rgba(0,0,0,0.6)',
        }}
      >
        {/* ================= 1. TOKEN PIN BADGE SOCKET ================= */}
        <div className="relative flex-shrink-0">
          <div
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border border-sky-300/40 shadow-inner relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 40% 35%, var(--ui-arcade-stage-1) 0%, var(--ui-arcade-stage-2) 70%, var(--ui-cosmic-bg-3) 100%)',
            }}
          >
            {/* Authentic Map-Pin Token Icon */}
            <svg
              viewBox="0 0 24 32"
              className="w-6 h-7 sm:w-7 sm:h-8 transition-transform hover:scale-110"
              style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.45))' }}
            >
              {/* Teardrop outer shell in silver-white with 1.5px --token-outline */}
              <path
                d="M12 2C6.48 2 2 6.48 2 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.52-4.48-10-10-10z"
                fill="var(--token-body)"
                stroke="var(--token-outline)"
                strokeWidth="1.5"
              />
              {/* Inner colored circular gem in seat colour */}
              <circle
                cx="12"
                cy="12"
                r="5"
                fill={activeColorHex}
                stroke="var(--token-outline)"
                strokeWidth="0.8"
              />
              {/* Shiny glossy specular highlight */}
              <circle cx="10" cy="10" r="1.5" fill="var(--token-body)" opacity="0.9" />
            </svg>

            {/* Rank Trophy Badge if Finished */}
            {player.rank !== null && (
              <div
                className="absolute top-0 right-0 px-1 py-0.2 rounded-bl-lg text-[10px] font-black flex items-center shadow-md"
                style={{
                  backgroundColor: 'var(--accent-gold)',
                  color: 'var(--text-dark)',
                }}
              >
                <Trophy className="w-2.5 h-2.5 mr-0.5" style={{ color: 'var(--text-dark)' }} />#{player.rank}
              </div>
            )}

            {/* Kill Sword Badge if captured opponent */}
            {player.hasCaptured && player.rank === null && (
              <div
                title="Captured opponent! Allowed in home corridor"
                className="absolute bottom-0 right-0 p-0.5 rounded-tl-md bg-rose-600/90 text-white shadow"
              >
                <Swords className="w-2.5 h-2.5" />
              </div>
            )}

            {/* Team indicator badge if 2v2 */}
            {player.team && (
              <span
                className={`absolute top-0 left-0 text-[8px] px-1 font-black rounded-br ${
                  player.team === 'TEAM_A' ? 'bg-sky-500 text-white' : 'bg-rose-500 text-white'
                }`}
              >
                {player.team === 'TEAM_A' ? 'A' : 'B'}
              </span>
            )}
          </div>
        </div>

        {/* ================= 2. DICE OR WAITING SLOT ================= */}
        <div className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center">
          {isActiveTurn ? (
            <div className="relative flex items-center justify-center">
              <Dice3D
                value={diceValue}
                isRolling={isRolling}
                disabled={!isDiceTurn}
                onRoll={onRollDice}
                accentColor={activeColorHex}
              />
            </div>
          ) : (
            /* Authentic Empty Waiting Slot from Reference Screenshot */
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border border-white/20 shadow-inner flex items-center justify-center"
              style={{
                background:
                  'radial-gradient(circle at 40% 35%, rgba(254, 205, 211, 0.45) 0%, rgba(244, 63, 94, 0.15) 60%, rgba(15, 23, 42, 0.4) 100%)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
              }}
            >
              <div className="w-6 h-6 rounded-lg border border-white/10 bg-white/10" />
            </div>
          )}
        </div>

        {/* ================= 3. GOLDEN POINTER ARROW (Pointing at Active Dice) ================= */}
        {isActiveTurn && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 pointer-events-none z-30 ${
              isRight ? '-left-6 sm:-left-7 arrow-bounce-right' : '-right-6 sm:-right-7 arrow-bounce-left'
            }`}
          >
            <svg
              viewBox="0 0 28 24"
              className="w-6 h-6 sm:w-7 sm:h-7 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              {isRight ? (
                /* Pointing RIGHT at the dice in the right controller */
                <polygon
                  points="24,12 14,3 14,8 2,8 2,16 14,16 14,21"
                  fill="var(--accent-gold)"
                  stroke="var(--grid-line)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              ) : (
                /* Pointing LEFT at the dice in the left controller */
                <polygon
                  points="4,12 14,3 14,8 26,8 26,16 14,16 14,21"
                  fill="var(--accent-gold)"
                  stroke="var(--grid-line)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
