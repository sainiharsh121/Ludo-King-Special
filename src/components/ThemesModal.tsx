import React from 'react';
import { BoardTheme } from '../types/ludo';
import { soundEngine } from '../utils/soundEngine';
import { X, Check, Palette } from 'lucide-react';

interface ThemesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: BoardTheme;
  onSelectTheme: (theme: BoardTheme) => void;
}

const THEMES: { id: BoardTheme; name: string; desc: string; previewBg: string; border: string }[] = [
  {
    id: 'classic',
    name: 'Classic King',
    desc: 'Official tournament white & primary quadrants',
    previewBg: 'bg-white',
    border: 'border-slate-300',
  },
  {
    id: 'wood',
    name: 'Rich Mahogany',
    desc: 'Vintage polished walnut timber board',
    previewBg: 'bg-amber-950',
    border: 'border-amber-800',
  },
  {
    id: 'royal',
    name: 'Royal Sapphire',
    desc: 'Imperial golden trim on deep midnight navy',
    previewBg: 'bg-indigo-950',
    border: 'border-indigo-700',
  },
  {
    id: 'neon',
    name: 'Cyber Neon',
    desc: 'Ultra-modern dark glow arcade aesthetic',
    previewBg: 'bg-slate-950',
    border: 'border-cyan-500',
  },
];

export const ThemesModal: React.FC<ThemesModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-black text-white">Board Themes</h3>
        </div>

        {/* Themes Grid */}
        <div className="space-y-2.5">
          {THEMES.map(t => {
            const isSelected = currentTheme === t.id;
            return (
              <div
                key={t.id}
                onClick={() => {
                  soundEngine.playButtonClick();
                  onSelectTheme(t.id);
                }}
                className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10 shadow-md ring-2 ring-amber-400/30'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl ${t.previewBg} border-2 ${t.border} shadow-sm flex items-center justify-center`}>
                    <span className="text-xs">🎲</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{t.name}</h4>
                    <p className="text-[10px] text-slate-400">{t.desc}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-2.5 rounded-2xl bg-slate-800 text-white font-black text-xs hover:bg-slate-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};
