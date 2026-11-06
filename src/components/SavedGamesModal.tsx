import React from 'react';
import { SavedGame } from '../types/ludo';
import { getSavedGames, deleteSavedGame } from '../utils/savedGamesEngine';
import { soundEngine } from '../utils/soundEngine';
import { X, Play, Trash2, Clock, Users, ShieldAlert, Sparkles } from 'lucide-react';

interface SavedGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadGame: (savedGame: SavedGame) => void;
}

export const SavedGamesModal: React.FC<SavedGamesModalProps> = ({
  isOpen,
  onClose,
  onLoadGame,
}) => {
  const [games, setGames] = React.useState<SavedGame[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setGames(getSavedGames());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playButtonClick();
    deleteSavedGame(id);
    setGames(getSavedGames());
  };

  const handleSelectGame = (game: SavedGame) => {
    soundEngine.playGameStartSound();
    onLoadGame(game);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Nunito',sans-serif]">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 border-2 border-amber-400 p-4 sm:p-5 shadow-[0_0_35px_rgba(245,158,11,0.35)] text-white flex flex-col max-h-[85vh]">

        {/* Close Button */}
        <button
          onClick={() => {
            soundEngine.playButtonClick();
            onClose();
          }}
          className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-gradient-to-b from-rose-500 to-rose-700 border-2 border-amber-300 flex items-center justify-center shadow-lg active:scale-95 text-white hover:brightness-110 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="text-center mb-4">
          <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow border border-amber-200">
            LOAD SAVED GAMES
          </div>
          <p className="text-[11px] text-sky-200/80 font-bold mt-1">
            Resume your previous matches anytime
          </p>
        </div>

        {/* Games List or Empty State */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1 custom-scrollbar">
          {games.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-sky-950/70 border border-sky-600/40 flex items-center justify-center mb-3 text-2xl shadow-inner">
                💾
              </div>
              <h4 className="text-sm font-black text-amber-300">No Saved Games Found</h4>
              <p className="text-xs text-sky-200/70 max-w-[210px] mt-1 leading-relaxed">
                Matches are automatically saved when you play. Start a new game now!
              </p>
            </div>
          ) : (
            games.map((g) => {
              const activeCount = g.players.filter(p => p.isActive).length;
              const activePlayer = g.players[g.activePlayerIndex] || g.players[0];

              return (
                <div
                  key={g.id}
                  onClick={() => handleSelectGame(g)}
                  className="group relative rounded-2xl bg-gradient-to-r from-blue-800/80 to-indigo-900/80 hover:from-blue-700 hover:to-indigo-800 border border-amber-400/50 hover:border-amber-400 p-3 transition-all cursor-pointer shadow-md hover:shadow-amber-500/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-[10px] uppercase">
                          {g.subMode || g.gameMode}
                        </span>
                        {g.rules.oneTokenOut && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-[9px]">
                            1 Token Out
                          </span>
                        )}
                        {g.rules.friendlyKill !== undefined && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border ${g.rules.friendlyKill
                              ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                              : 'bg-sky-500/20 border-sky-400/40 text-sky-300'
                            }`}>
                            {g.rules.friendlyKill ? 'Friendly Kill' : 'Teammate Safe'}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-black text-white truncate group-hover:text-amber-200 transition">
                        {g.title}
                      </h4>

                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-sky-200/70">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-sky-400" />
                          {activeCount} Players
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          {g.dateFormatted}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleDelete(g.id, e)}
                        className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-600 border border-rose-400/40 text-rose-300 hover:text-white flex items-center justify-center transition active:scale-90"
                        title="Delete Save"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="w-8 h-8 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md border border-amber-200 group-hover:scale-105 transition"
                        title="Resume Game"
                      >
                        <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-sky-800/60 flex items-center justify-between text-[11px] text-sky-300/80">
          <span>Total Saves: {games.length}/10</span>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="px-3 py-1 rounded-lg bg-sky-900/60 hover:bg-sky-800 text-sky-200 border border-sky-600/40 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

