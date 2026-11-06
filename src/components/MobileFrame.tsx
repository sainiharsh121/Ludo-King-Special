import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  useEffect(() => {
    // Detect if current screen is mobile size or touch device
    const checkMobile = () => {
      const isNarrow = window.innerWidth <= 768;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobileDevice(isNarrow || (isTouch && window.innerWidth <= 1024));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // If running directly on a phone screen, render full-bleed native container
  if (isMobileDevice) {
    return (
      <div className="w-full min-h-dvh h-dvh bg-slate-950 flex flex-col overflow-x-hidden overflow-y-auto">
        {children}
      </div>
    );
  }

  // On desktop / tablet
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      
      {/* Top Floating View Toggle Toolbar for Desktop */}
      <div className="mb-2 sm:mb-3 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-full px-3 py-1 shadow-lg backdrop-blur-md z-40">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
          View Mode:
        </span>
        <button
          onClick={() => setIsPhoneFrame(true)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all ${
            isPhoneFrame
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" /> Mobile Phone
        </button>
        <button
          onClick={() => setIsPhoneFrame(false)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all ${
            !isPhoneFrame
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" /> Expanded
        </button>
      </div>

      {/* Main Container */}
      {isPhoneFrame ? (
        /* Realistic Smartphone Chassis Frame */
        <div className="relative w-full max-w-[420px] h-[870px] max-h-[95vh] phone-chassis flex flex-col">
          
          {/* Top Dynamic Island / Speaker Notch */}
          <div className="phone-speaker-island">
            <div className="phone-mic-hole" />
            <div className="phone-camera-lens" />
          </div>

          {/* Phone Screen Viewport */}
          <div className="w-full h-full pt-6 flex flex-col overflow-hidden relative">
            {children}
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full pointer-events-none z-50" />
        </div>
      ) : (
        /* Expanded Full Screen Container */
        <div className="w-full max-w-2xl h-[90vh] bg-slate-900 rounded-3xl border-2 border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
          {children}
        </div>
      )}

    </div>
  );
};
