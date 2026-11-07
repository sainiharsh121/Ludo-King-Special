import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../utils/soundEngine';

interface Dice3DProps {
  value: number;
  isRolling: boolean;
  disabled: boolean;
  onRoll: () => void;
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Dice3D: React.FC<Dice3DProps> = ({
  value,
  isRolling,
  disabled,
  onRoll,
  accentColor = 'var(--ui-phone-chassis)',
  size = 'md',
}) => {
  const [internalRolling, setInternalRolling] = useState(false);
  const [scrollingFace, setScrollingFace] = useState<number>(value);
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRolling) {
      setInternalRolling(true);
      soundEngine.playDiceShake();

      // Fast, authentic dice face scrolling animation
      // Cycles random faces every 24ms over the snappy 285ms rolling duration (page-flipping speed decreased by 1/4)
      rollIntervalRef.current = setInterval(() => {
        setScrollingFace(prev => {
          let next = Math.floor(Math.random() * 6) + 1;
          if (next === prev) next = (next % 6) + 1;
          return next;
        });
      }, 24);

      const timer = setTimeout(() => {
        if (rollIntervalRef.current) {
          clearInterval(rollIntervalRef.current);
          rollIntervalRef.current = null;
        }
        setScrollingFace(value);
        setInternalRolling(false);
        soundEngine.playDiceLand();
      }, 260);

      return () => {
        clearTimeout(timer);
        if (rollIntervalRef.current) {
          clearInterval(rollIntervalRef.current);
          rollIntervalRef.current = null;
        }
      };
    } else {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
      }
      setScrollingFace(value);
      setInternalRolling(false);
    }
  }, [isRolling, value]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isRolling || internalRolling) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
    onRoll();
  };

  // Authentic black/dark dice pips matching the reference image (scaled for 32px dice)
  const renderFacePips = (faceNum: number) => {
    const pipColorClass = 'bg-slate-900 shadow-inner';

    switch (faceNum) {
      case 1:
        return (
          <div className="flex items-center justify-center w-full h-full">
            <span className={`w-2.5 h-2.5 rounded-full shadow-inner ${pipColorClass}`} />
          </div>
        );
      case 2:
        return (
          <div className="flex justify-between w-full h-full p-1">
            <span className={`w-1.5 h-1.5 rounded-full self-start ${pipColorClass}`} />
            <span className={`w-1.5 h-1.5 rounded-full self-end ${pipColorClass}`} />
          </div>
        );
      case 3:
        return (
          <div className="flex justify-between w-full h-full p-1">
            <span className={`w-1.5 h-1.5 rounded-full self-start ${pipColorClass}`} />
            <span className={`w-1.5 h-1.5 rounded-full self-center ${pipColorClass}`} />
            <span className={`w-1.5 h-1.5 rounded-full self-end ${pipColorClass}`} />
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 gap-1 p-1 w-full h-full place-items-center">
            <span className={`w-1.5 h-1.5 rounded-full ${pipColorClass}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${pipColorClass}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${pipColorClass}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${pipColorClass}`} />
          </div>
        );
      case 5:
        return (
          <div className="relative w-full h-full p-1">
            <div className="absolute top-1 left-1">
              <span className={`w-1.5 h-1.5 rounded-full block ${pipColorClass}`} />
            </div>
            <div className="absolute top-1 right-1">
              <span className={`w-1.5 h-1.5 rounded-full block ${pipColorClass}`} />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className={`w-1.5 h-1.5 rounded-full block ${pipColorClass}`} />
            </div>
            <div className="absolute bottom-1 left-1">
              <span className={`w-1.5 h-1.5 rounded-full block ${pipColorClass}`} />
            </div>
            <div className="absolute bottom-1 right-1">
              <span className={`w-1.5 h-1.5 rounded-full block ${pipColorClass}`} />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="grid grid-cols-2 grid-rows-3 gap-x-1 gap-y-0.5 p-0.5 w-full h-full place-items-center">
            <span className={`w-1.5 h-1.5 rounded-full ${pipColorClass}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${pipColorClass}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${pipColorClass}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${pipColorClass}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${pipColorClass}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${pipColorClass}`} />
          </div>
        );
      default:
        return null;
    }
  };

  const isInteractive = !disabled && !isRolling && !internalRolling;
  const isRollingActive = isRolling || internalRolling;
  const activeFace = isRollingActive ? scrollingFace : value;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* 3D Scene Wrapper */}
      <button
        onClick={handleClick}
        disabled={!isInteractive}
        type="button"
        aria-label="Roll Dice"
        className={`dice-scene relative cursor-pointer outline-none transition-transform duration-200 border-0 bg-transparent shadow-none p-0.5 rounded-xl group ${
          isInteractive ? 'hover:scale-105 active:scale-95' : 'cursor-default'
        }`}
      >
        {/* Glow Ring Behind Dice when active turn */}
        {isInteractive && (
          <div className="absolute inset-0 rounded-2xl bg-amber-400/30 animate-pulse blur-sm pointer-events-none" />
        )}

        <div
          className={`dice-cube ${isRollingActive ? 'dice-tumbling-fast' : ''}`}
          data-face={isRollingActive ? activeFace : 1}
          style={!isRollingActive ? { transform: 'none' } : undefined}
        >
          {isRollingActive ? (
            <>
              <div className="dice-face face-front">{renderFacePips(1)}</div>
              <div className="dice-face face-top">{renderFacePips(2)}</div>
              <div className="dice-face face-right">{renderFacePips(3)}</div>
              <div className="dice-face face-left">{renderFacePips(4)}</div>
              <div className="dice-face face-bottom">{renderFacePips(5)}</div>
              <div className="dice-face face-back">{renderFacePips(6)}</div>
            </>
          ) : (
            <div className="dice-face face-front" style={{ transform: 'none' }}>
              {renderFacePips(value)}
            </div>
          )}
        </div>
      </button>
    </div>
  );
};
