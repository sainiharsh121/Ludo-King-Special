import React, { useState, useEffect } from 'react';
import { TeamUpTaskOption, TeamUpTaskId } from '../types/ludo';
import { soundEngine } from '../utils/soundEngine';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Check,
  Sparkles,
  Flame,
  Swords,
  Music,
  Award,
} from 'lucide-react';

export const STORAGE_KEY_SELECTED_TASK = 'ludo_teamup_selected_task';

export const TEAM_UP_TASKS: TeamUpTaskOption[] = [
  {
    id: 'task-1',
    taskNumber: 1,
    title: 'Dance on Bhojpuri song',
    hindiDescription: 'Haarne par poori team Bhojpuri gaane par dhamakedar dance karegi!',
    iconEmoji: '💃',
    badge: 'TASK 1',
  },
  {
    id: 'task-2',
    taskNumber: 2,
    title: 'salute marna hai ladle',
    hindiDescription: 'Haarne wale sabhi ladlo ko jeetne walo ke samne salute marna hoga!',
    iconEmoji: '🫡',
    badge: 'TASK 2',
  },
  {
    id: 'task-3',
    taskNumber: 3,
    title: 'Dhumka marna hai',
    hindiDescription: 'Haarne wali team ko sabke samne mast zabardast dhumka lagana padega!',
    iconEmoji: '🕺',
    badge: 'TASK 3',
  },
];

interface TeamUpTaskSelectionScreenProps {
  onBack: () => void;
  onStartGame: (selectedTask: TeamUpTaskOption) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TeamUpTaskSelectionScreen: React.FC<TeamUpTaskSelectionScreenProps> = ({
  onBack,
  onStartGame,
  soundEnabled,
  onToggleSound,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<TeamUpTaskId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTED_TASK) as TeamUpTaskId | null;
      if (saved && (saved === 'task-1' || saved === 'task-2' || saved === 'task-3')) {
        return saved;
      }
    } catch {}
    return 'task-1';
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED_TASK, selectedTaskId);
      const chosen = TEAM_UP_TASKS.find((t) => t.id === selectedTaskId);
      if (chosen) {
        localStorage.setItem('ludo_teamup_selected_task_title', chosen.title);
      }
    } catch {}
  }, [selectedTaskId]);

  const handleSelectTask = (taskId: TeamUpTaskId) => {
    soundEngine.playCoinSound();
    setSelectedTaskId(taskId);
  };

  const handleConfirmAndPlay = () => {
    soundEngine.playGameStartSound();
    const chosen = TEAM_UP_TASKS.find((t) => t.id === selectedTaskId) || TEAM_UP_TASKS[0];
    onStartGame(chosen);
  };

  const currentSelectedTask =
    TEAM_UP_TASKS.find((t) => t.id === selectedTaskId) || TEAM_UP_TASKS[0];

  return (
    <div className="relative w-full h-full select-none overflow-hidden flex flex-col justify-between font-['Nunito',sans-serif] bg-slate-950">
      {/* 1. Underlying Dark Lobby Backdrop */}
      <img
        src="/page2_reference.jpg"
        alt="Lobby Backdrop"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none filter brightness-[0.20] contrast-[1.15]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/90 via-indigo-950/85 to-slate-950/95 pointer-events-none" />

      {/* 2. Top Header Status Bar */}
      <div className="relative z-20 w-full pt-2.5 px-3 flex items-center justify-between pointer-events-auto">
        {/* Profile Card on Left */}
        <div className="flex items-center gap-1.5">
          <div className="relative w-9 h-9 rounded-xl border-2 border-amber-400 bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden shadow-md flex items-center justify-center">
            <span className="text-lg">🦁</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white text-xs font-black tracking-wide leading-tight drop-shadow">
              Team Up 2v2
            </span>
            <span className="text-[10px] text-amber-300 font-extrabold flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
              Loss Punishment
            </span>
          </div>
        </div>

        {/* Right Status Badges: Sound Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleSound}
            aria-label="Toggle Sound"
            className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-700/80 text-amber-300 hover:text-white hover:bg-slate-800 flex items-center justify-center shadow transition active:scale-95 cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* 3. Main Center Container: Pure Task Selection */}
      <div className="relative z-20 w-full px-3 flex-1 flex flex-col justify-center py-2 pointer-events-auto">
        {/* Hanging Golden Arched Ribbon Title Banner */}
        <div className="relative w-full max-w-sm mx-auto mb-3">
          <div className="relative px-4 py-2.5 rounded-2xl bg-gradient-to-b from-blue-700 via-blue-800 to-indigo-950 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] text-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            <div className="flex items-center justify-center gap-1.5 text-amber-300">
              <Swords className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              <h1 className="text-sm sm:text-base font-black tracking-wider text-white drop-shadow">
                SELECT PENALTY TASK
              </h1>
              <Swords className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            </div>
            <p className="text-[11px] font-extrabold text-amber-300 tracking-wide mt-0.5 drop-shadow">
              Losing team will have to do this task!
            </p>
            <p className="text-[10px] font-bold text-sky-200/90 leading-tight">
              (हारने वाली टीम को यह टास्क करना होगा)
            </p>
          </div>
        </div>

        {/* Central Dedicated Task Selection Box */}
        <div className="w-full max-w-sm mx-auto bg-gradient-to-b from-blue-900/90 to-indigo-950/95 border-2 border-amber-400/80 rounded-2xl p-2.5 sm:p-3.5 shadow-[0_0_25px_rgba(245,158,11,0.25)] space-y-2.5">
          {TEAM_UP_TASKS.map((task) => {
            const isSelected = selectedTaskId === task.id;

            return (
              <label
                key={task.id}
                onClick={() => handleSelectTask(task.id)}
                className={`relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none group ${
                  isSelected
                    ? 'border-amber-400 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-900 shadow-[0_0_18px_rgba(245,158,11,0.55),inset_0_1px_1px_rgba(255,255,255,0.3)] scale-[1.02]'
                    : 'border-sky-400/35 bg-gradient-to-r from-blue-900/80 to-indigo-950/85 hover:border-amber-400/60 hover:from-blue-800/90 hover:to-indigo-900/90 shadow-[0_4px_10px_rgba(0,0,0,0.3)]'
                }`}
              >
                {/* Accessible hidden native radio button */}
                <input
                  type="radio"
                  name="teamup_penalty_task"
                  value={task.id}
                  checked={isSelected}
                  onChange={() => handleSelectTask(task.id)}
                  className="sr-only"
                />

                {/* Left: Thematic Emoji Avatar Badge */}
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-2 flex items-center justify-center text-2xl shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    isSelected
                      ? 'border-amber-300 bg-amber-400/25 shadow-[0_0_14px_rgba(245,158,11,0.6)] animate-pulse'
                      : 'border-sky-400/40 bg-sky-950/60'
                  }`}
                >
                  <span className="drop-shadow">{task.iconEmoji}</span>
                </div>

                {/* Center: Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wider border ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                          : 'bg-sky-900/60 text-sky-200 border-sky-600/40'
                      }`}
                    >
                      {task.badge}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-black text-amber-300 flex items-center gap-0.5 animate-pulse">
                        <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Exact Task Title */}
                  <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-200 transition-colors tracking-wide leading-tight drop-shadow">
                    {task.title}
                  </h2>

                  {/* Hindi Punishment Tagline */}
                  <p className="text-[10px] sm:text-[11px] font-bold text-sky-200/90 leading-tight mt-0.5">
                    {task.hindiDescription}
                  </p>
                </div>

                {/* Right: Golden Checkmark / Radio Indicator */}
                <div className="shrink-0 flex items-center justify-center">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 border border-slate-950 flex items-center justify-center text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.85)] animate-in zoom-in-75 duration-150">
                      <Check className="w-4 h-4 stroke-[3.5]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-400/50 bg-slate-900/60 group-hover:border-amber-400/60 transition-colors" />
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Controls: Back Button & Play Match Button */}
      <div className="relative z-20 pb-3 px-3 w-full max-w-sm mx-auto flex items-center gap-2.5 pointer-events-auto">
        {/* Curved Golden Back Button */}
        <button
          onClick={() => {
            soundEngine.playButtonClick();
            onBack();
          }}
          aria-label="Back to Team Up Setup"
          title="Back to Team Up Setup"
          className="w-11 h-11 rounded-full bg-gradient-to-b from-blue-700 to-indigo-950 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-95 transition cursor-pointer shrink-0"
        >
          <RotateCcw className="w-5 h-5 -rotate-90 stroke-[3]" />
        </button>

        {/* Start Match / Play Button */}
        <button
          onClick={handleConfirmAndPlay}
          className="flex-1 py-2.5 rounded-2xl bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-900 border-2 border-amber-300 hover:border-amber-200 text-white font-black text-sm tracking-wide shadow-[0_0_18px_rgba(245,158,11,0.5)] active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Play Match</span>
          <span className="text-xs bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-300/40 text-amber-200">
            🎲 Let's Go
          </span>
        </button>
      </div>
    </div>
  );
};
