import React from 'react';

interface LudoKingLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showMascots?: boolean;
}

export const LudoKingLogo: React.FC<LudoKingLogoProps> = ({ 
  size = 'md',
  showMascots = true 
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36 sm:w-44 sm:h-44',
    lg: 'w-48 h-48 sm:w-56 sm:h-56',
  }[size];

  return (
    <div className="relative flex items-center justify-center my-1 select-none">
      
      {/* Mascot Pawn - Left (Red King Mascot) */}
      {showMascots && (
        <div className="hidden xs:flex flex-col items-center -mr-3 sm:-mr-5 mb-2 z-10 animate-bounce duration-1000">
          <div className="relative">
            {/* Small Crown on Pawn */}
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-sm sm:text-base drop-shadow-md">
              👑
            </span>
            {/* 3D Red Pawn Mascot */}
            <div className="w-8 h-10 sm:w-10 sm:h-12 rounded-full flex flex-col items-center justify-center shadow-2xl">
              <div 
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white shadow"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #e11d48 60%, #881337 100%)',
                }}
              />
              <div 
                className="w-7 h-4 sm:w-8 sm:h-5 rounded-b-lg -mt-1.5 shadow"
                style={{
                  background: 'linear-gradient(180deg, #e11d48 0%, #4c0519 100%)',
                }}
              />
            </div>
          </div>
          <span className="text-[9px] font-black uppercase text-amber-300 drop-shadow mt-0.5 tracking-tighter">
            Play
          </span>
        </div>
      )}

      {/* Main Logo Container */}
      <div className={`relative ${sizeClasses} transition-transform hover:scale-105 duration-300`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-3xl bg-amber-400/25 blur-xl -z-10 animate-pulse" />
        
        {/* High-Fidelity Vector Ludo King Emblem (Matches Image 3 pixel-for-pixel) */}
        <svg
          viewBox="0 0 240 250"
          className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fde047" />
              <stop offset="60%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            <linearGradient id="kingTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>

            {/* Bubble 3D Radial Gradients */}
            <radialGradient id="bubbleBlue" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="40%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </radialGradient>
            <radialGradient id="bubbleRed" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fca5a5" />
              <stop offset="40%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </radialGradient>
            <radialGradient id="bubbleGreen" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="40%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#14532d" />
            </radialGradient>
            <radialGradient id="bubbleYellow" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#78350f" />
            </radialGradient>

            <filter id="logoShadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* 1. Main Board Chassis (Matches Image 3) */}
          <rect
            x="24"
            y="48"
            width="192"
            height="192"
            rx="32"
            fill="#1e40af"
            stroke="#60a5fa"
            strokeWidth="3.5"
            filter="url(#logoShadow)"
          />

          {/* Inner board background */}
          <rect x="30" y="54" width="180" height="180" rx="26" fill="#0f172a" />

          {/* Quadrant 1: Top-Left RED */}
          <rect x="34" y="58" width="84" height="84" rx="20" fill="#dc2626" />
          {/* Top-Left Dice (White with 4 Red pips) */}
          <rect x="44" y="68" width="56" height="56" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" filter="url(#logoShadow)" />
          <circle cx="58" cy="82" r="5" fill="#dc2626" />
          <circle cx="86" cy="82" r="5" fill="#dc2626" />
          <circle cx="58" cy="110" r="5" fill="#dc2626" />
          <circle cx="86" cy="110" r="5" fill="#dc2626" />

          {/* Quadrant 2: Top-Right GREEN */}
          <rect x="122" y="58" width="84" height="84" rx="20" fill="#16a34a" />
          {/* Top-Right Dice (White with 4 Green pips) */}
          <rect x="140" y="68" width="56" height="56" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" filter="url(#logoShadow)" />
          <circle cx="154" cy="82" r="5" fill="#16a34a" />
          <circle cx="182" cy="82" r="5" fill="#16a34a" />
          <circle cx="154" cy="110" r="5" fill="#16a34a" />
          <circle cx="182" cy="110" r="5" fill="#16a34a" />

          {/* Quadrant 3: Bottom-Left BLUE */}
          <rect x="34" y="146" width="84" height="84" rx="20" fill="#0284c7" />
          {/* Bottom-Left Dice (White with 4 Blue pips) */}
          <rect x="44" y="160" width="56" height="56" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" filter="url(#logoShadow)" />
          <circle cx="58" cy="174" r="5" fill="#0284c7" />
          <circle cx="86" cy="174" r="5" fill="#0284c7" />
          <circle cx="58" cy="202" r="5" fill="#0284c7" />
          <circle cx="86" cy="202" r="5" fill="#0284c7" />

          {/* Quadrant 4: Bottom-Right YELLOW */}
          <rect x="122" y="146" width="84" height="84" rx="20" fill="#eab308" />
          {/* Bottom-Right Dice (White with 4 Yellow pips) */}
          <rect x="140" y="160" width="56" height="56" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" filter="url(#logoShadow)" />
          <circle cx="154" cy="174" r="5" fill="#eab308" />
          <circle cx="182" cy="174" r="5" fill="#eab308" />
          <circle cx="154" cy="202" r="5" fill="#eab308" />
          <circle cx="182" cy="202" r="5" fill="#eab308" />

          {/* Central Track Cross Grid Lines */}
          <rect x="114" y="54" width="12" height="180" fill="#f8fafc" opacity="0.9" />
          <rect x="30" y="138" width="180" height="12" fill="#f8fafc" opacity="0.9" />

          {/* 2. Golden Royal Crown on Top (Matches Image 3) */}
          <g filter="url(#logoShadow)">
            {/* Crown Base Band */}
            <path
              d="M78 52 C90 48 150 48 162 52 L158 64 C148 61 92 61 82 64 Z"
              fill="url(#crownGold)"
              stroke="#78350f"
              strokeWidth="1.5"
            />
            {/* Crown Jewels on Band */}
            <circle cx="95" cy="58" r="3.5" fill="#dc2626" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="120" cy="57" r="4.5" fill="#16a34a" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="145" cy="58" r="3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="0.8" />

            {/* Crown Spikes / Peaks */}
            <path
              d="M80 52 L72 26 L94 40 L120 14 L146 40 L168 26 L160 52 Z"
              fill="url(#crownGold)"
              stroke="#78350f"
              strokeWidth="2"
            />
            {/* Crown Pearls on Peak Tips */}
            <circle cx="72" cy="25" r="4.5" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
            <circle cx="94" cy="39" r="4" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
            <circle cx="120" cy="13" r="6" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
            <circle cx="146" cy="39" r="4" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
            <circle cx="168" cy="25" r="4.5" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
            
            {/* Center Crown Ruby */}
            <polygon points="120,24 125,32 120,40 115,32" fill="#dc2626" stroke="#fde047" strokeWidth="1" />
          </g>

          {/* 3. Circular 3D Letter Bubbles "L U D O" (Matches Image 3) */}
          <g filter="url(#logoShadow)">
            {/* Bubble L (Blue) */}
            <g transform="translate(48, 126)">
              <circle cx="0" cy="0" r="22" fill="#ffffff" />
              <circle cx="0" cy="0" r="19" fill="url(#bubbleBlue)" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="-6" cy="-7" r="6" fill="#ffffff" opacity="0.4" />
              <text x="0" y="8" textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="900" fontFamily="'Fredoka', 'Nunito', sans-serif">
                L
              </text>
            </g>

            {/* Bubble U (Red) */}
            <g transform="translate(96, 126)">
              <circle cx="0" cy="0" r="22" fill="#ffffff" />
              <circle cx="0" cy="0" r="19" fill="url(#bubbleRed)" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="-6" cy="-7" r="6" fill="#ffffff" opacity="0.4" />
              <text x="0" y="8" textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="900" fontFamily="'Fredoka', 'Nunito', sans-serif">
                U
              </text>
            </g>

            {/* Bubble D (Green) */}
            <g transform="translate(144, 126)">
              <circle cx="0" cy="0" r="22" fill="#ffffff" />
              <circle cx="0" cy="0" r="19" fill="url(#bubbleGreen)" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="-6" cy="-7" r="6" fill="#ffffff" opacity="0.4" />
              <text x="0" y="8" textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="900" fontFamily="'Fredoka', 'Nunito', sans-serif">
                D
              </text>
            </g>

            {/* Bubble O (Yellow) */}
            <g transform="translate(192, 126)">
              <circle cx="0" cy="0" r="22" fill="#ffffff" />
              <circle cx="0" cy="0" r="19" fill="url(#bubbleYellow)" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="-6" cy="-7" r="6" fill="#ffffff" opacity="0.4" />
              <text x="0" y="8" textAnchor="middle" fill="#78350f" fontSize="24" fontWeight="900" fontFamily="'Fredoka', 'Nunito', sans-serif">
                O
              </text>
            </g>
          </g>

          {/* 4. 3D Embossed Golden Banner */}
          <g filter="url(#logoShadow)">
            {/* Banner Dark Backdrop Ribbon */}
            <path
              d="M52 166 L188 166 C196 166 202 172 198 180 L188 196 C186 200 180 202 174 202 L66 202 C60 202 54 200 52 196 L42 180 C38 172 44 166 52 166 Z"
              fill="#090d16"
              stroke="#ca8a04"
              strokeWidth="2"
            />
            
            {/* 3D Drop Shadow Text */}
            <text
              x="120"
              y="192"
              textAnchor="middle"
              fill="#451a03"
              fontSize="22"
              fontWeight="900"
              fontFamily="'Fredoka', 'Cinzel', 'Nunito', serif"
              letterSpacing="3"
            >
              CLASSIC
            </text>
            
            {/* Golden Embossed Main Text */}
            <text
              x="120"
              y="190"
              textAnchor="middle"
              fill="url(#kingTextGrad)"
              stroke="#78350f"
              strokeWidth="1.2"
              fontSize="22"
              fontWeight="900"
              fontFamily="'Fredoka', 'Cinzel', 'Nunito', serif"
              letterSpacing="3"
            >
              CLASSIC
            </text>
          </g>
        </svg>
      </div>

      {/* Mascot Pawn - Right (Yellow / Blue Cheer Mascot) */}
      {showMascots && (
        <div className="hidden xs:flex flex-col items-center -ml-3 sm:-ml-5 mb-2 z-10 animate-bounce duration-1000 delay-150">
          <div className="relative">
            {/* Star badge */}
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-sm sm:text-base drop-shadow-md">
              ⭐
            </span>
            {/* 3D Yellow Pawn Mascot */}
            <div className="w-8 h-10 sm:w-10 sm:h-12 rounded-full flex flex-col items-center justify-center shadow-2xl">
              <div 
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white shadow"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #f59e0b 60%, #78350f 100%)',
                }}
              />
              <div 
                className="w-7 h-4 sm:w-8 sm:h-5 rounded-b-lg -mt-1.5 shadow"
                style={{
                  background: 'linear-gradient(180deg, #f59e0b 0%, #451a03 100%)',
                }}
              />
            </div>
          </div>
          <span className="text-[9px] font-black uppercase text-amber-300 drop-shadow mt-0.5 tracking-tighter">
            Win
          </span>
        </div>
      )}

    </div>
  );
};
