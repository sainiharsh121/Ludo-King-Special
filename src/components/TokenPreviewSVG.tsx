import React from 'react';
import { PlayerColor, TokenId } from '../types/ludo';

/**
 * Authentic 9-Color Palette specified by user for Ludo Tokens:
 * 1. #ffd700 (Gold | rgb(255,215,0))
 * 2. #777777ff (Silver)
 * 3. #b21919 (Crimson Red)
 * 4. #3a72db (Royal Blue)
 * 5. #ff69b4 (Pink / Hot Pink)
 * 6. #e6cc46 (Bright Gold / Lemon Yellow)
 * 7. #45901A (Green)
 * 8. #af27d7 (Vivid Purple)
 * 9. #3b3c36 (Black / Charcoal)
 */
export const LUDO_TOKEN_PALETTE = {
  YELLOW: 'var(--accent-gold)',
  WHITE_SILVER: 'var(--track-cell)',
  RED: 'var(--seat-red)',
  BLUE: 'var(--seat-blue)',
  LAVENDER: 'var(--seat-purple-tint)', // #ff69b4 Pink
  GOLD_ACCENT: 'var(--accent-yellow)',
  GREEN: 'var(--seat-green)',
  VIVID_PURPLE: 'var(--seat-purple)',
  CHARCOAL: '#3b3c36',
  RING_BROWN: 'var(--token-ring-brown, #5c2c16)',
  RING_BROWN_LIGHT: 'var(--token-ring-brown-light, #803d1c)',
} as const;

export interface TokenColorOption {
  id: string;
  name: string;
  hex: string;
  accent: string;
  glow: string;
  bgGrad: string;
  borderColor: string;
  textColor: string;
}

export const NINE_TOKEN_COLORS: TokenColorOption[] = [
  {
    id: 'amber-gold',
    name: 'Gold',
    hex: '#ffd700',
    accent: '#ffe44d',
    glow: 'shadow-[0_0_12px_rgba(255,215,0,0.65)]',
    bgGrad: 'from-[#ffd700]/35 via-[#ffd700]/15 to-[#3b3c36]/60',
    borderColor: 'border-[#ffd700]',
    textColor: 'text-[#ffd700]',
  },
  {
    id: 'platinum-silver',
    name: 'Silver',
    hex: '#777777ff',
    accent: '#aaaaaa',
    glow: 'shadow-[0_0_12px_rgba(119,119,119,0.65)]',
    bgGrad: 'from-[#777777]/35 via-[#777777]/15 to-[#3b3c36]/60',
    borderColor: 'border-[#777777]',
    textColor: 'text-[#777777]',
  },
  {
    id: 'crimson-red',
    name: 'Red',
    hex: '#ff0000',
    accent: '#ff4d4d',
    glow: 'shadow-[0_0_12px_rgba(255,0,0,0.65)]',
    bgGrad: 'from-[#ff0000]/35 via-[#ff0000]/15 to-[#3b3c36]/60',
    borderColor: 'border-[#ff0000]',
    textColor: 'text-[#ff0000]',
  },
  {
    id: 'royal-blue',
    name: 'Blue',
    hex: '#3a72db',
    accent: '#60a5fa',
    glow: 'shadow-[0_0_12px_rgba(58,114,219,0.65)]',
    bgGrad: 'from-[#3a72db]/35 via-[#3a72db]/15 to-[#3b3c36]/60',
    borderColor: 'border-[#3a72db]',
    textColor: 'text-[#3a72db]',
  },
  {
    id: 'pink',
    name: 'Pink',
    hex: '#ff69b4',
    accent: '#ff85c2',
    glow: 'shadow-[0_0_12px_rgba(255,105,180,0.65)]',
    bgGrad: 'from-[#ff69b4]/35 via-[#ff69b4]/15 to-[#3b3c36]/60',
    borderColor: 'border-[#ff69b4]',
    textColor: 'text-[#ff69b4]',
  },
  {
    id: 'lemon-yellow',
    name: 'Yellow',
    hex: '#ffff00',
    accent: '#ffff66',
    glow: 'shadow-[0_0_12px_rgba(255,255,0,0.65)]',
    bgGrad: 'from-[#ffff00]/35 via-[#ffff00]/15 to-[#3b3c36]/60',
    borderColor: 'border-[#ffff00]',
    textColor: 'text-[#ffff00]',
  },
  {
    id: 'lime-green',
    name: 'Green',
    hex: '#008000',
    accent: '#00b300',
    glow: 'shadow-[0_0_12px_rgba(0,128,0,0.65)]',
    bgGrad: 'from-[#008000]/35 via-[#008000]/15 to-[#3b3c36]/60',
    borderColor: 'border-[#008000]',
    textColor: 'text-[#008000]',
  },
  {
    id: 'vivid-purple',
    name: 'Purple',
    hex: '#af27d7',
    accent: '#c084fc',
    glow: 'shadow-[0_0_12px_rgba(175,39,215,0.65)]',
    bgGrad: 'from-[#af27d7]/35 via-[#af27d7]/15 to-[#3b3c36]/60',
    borderColor: 'border-[#af27d7]',
    textColor: 'text-[#af27d7]',
  },
  {
    id: 'charcoal-dark',
    name: 'Black',
    hex: '#3b3c36',
    accent: '#66685f',
    glow: 'shadow-[0_0_12px_rgba(59,60,54,0.7)]',
    bgGrad: 'from-[#3b3c36]/60 via-[#3b3c36]/35 to-slate-950/80',
    borderColor: 'border-[#3b3c36]',
    textColor: 'text-slate-200',
  },
];

/**
 * Detect if a token color hex/variable/name belongs to one of the 4 canonical Ludo colors (RED, GREEN, YELLOW, BLUE).
 * Used by board and HUDs to prevent duplicate/clashing colors on empty quadrants in 2-player or 3-player matches.
 */
export const getCanonicalFamily = (colorStr?: string): PlayerColor | null => {
  if (!colorStr) return null;
  const s = colorStr.toLowerCase();
  // Check exact match in NINE_TOKEN_COLORS
  const found = NINE_TOKEN_COLORS.find(c => c.hex.toLowerCase() === s);
  if (found) {
    if (found.name === 'Green') return 'GREEN';
    if (found.name === 'Blue') return 'BLUE';
    if (found.name === 'Red') return 'RED';
    if (found.name === 'Yellow' || found.name === 'Gold') return 'YELLOW';
  }
  if (s.includes('green') || s === '#008000' || s === '#45901a' || s === '#7dc929' || s === '#16a34a' || s === '#22c55e') {
    return 'GREEN';
  }
  if (s.includes('blue') || s === '#3a72db' || s === '#2563eb' || s === '#0284c7' || s === '#60a5fa') {
    return 'BLUE';
  }
  if (s.includes('red') || s === '#ff0000' || s === '#b21919' || s === '#ef4444' || s === '#dc2626') {
    return 'RED';
  }
  if (s.includes('yellow') || s.includes('gold') || s === '#ffff00' || s === '#ffd700' || s === '#ecae02' || s === '#e6cc46' || s === '#facc15' || s === '#eab308') {
    return 'YELLOW';
  }
  return null;
};

export const COLOR_CONFIG_PALETTE: Record<PlayerColor, {
  name: string;
  fill: string;
  stroke: string;
  highlight: string;
  accent: string;
  glow: string;
  textColor: string;
  borderColor: string;
  bgGrad: string;
}> = {
  RED: {
    name: 'RED',
    fill: LUDO_TOKEN_PALETTE.RED, // #b21919
    stroke: LUDO_TOKEN_PALETTE.CHARCOAL, // #2e2730
    highlight: LUDO_TOKEN_PALETTE.WHITE_SILVER, // #e4e4e4
    accent: LUDO_TOKEN_PALETTE.LAVENDER, // #c36ede
    glow: 'shadow-[0_0_15px_rgba(178,25,25,0.65)]',
    textColor: 'text-[#ef4444]',
    borderColor: 'border-[#b21919]',
    bgGrad: 'from-[#b21919]/40 via-[#b21919]/25 to-[#2e2730]/60',
  },
  GREEN: {
    name: 'GREEN',
    fill: LUDO_TOKEN_PALETTE.GREEN, // #7dc929
    stroke: LUDO_TOKEN_PALETTE.CHARCOAL, // #2e2730
    highlight: LUDO_TOKEN_PALETTE.WHITE_SILVER, // #e4e4e4
    accent: LUDO_TOKEN_PALETTE.GOLD_ACCENT, // #e6cc46
    glow: 'shadow-[0_0_15px_rgba(125,201,41,0.65)]',
    textColor: 'text-[#7dc929]',
    borderColor: 'border-[#7dc929]',
    bgGrad: 'from-[#7dc929]/40 via-[#7dc929]/25 to-[#2e2730]/60',
  },
  YELLOW: {
    name: 'YELLOW',
    fill: LUDO_TOKEN_PALETTE.YELLOW, // #ffd700
    stroke: LUDO_TOKEN_PALETTE.CHARCOAL, // #2e2730
    highlight: LUDO_TOKEN_PALETTE.WHITE_SILVER, // #e4e4e4
    accent: LUDO_TOKEN_PALETTE.GOLD_ACCENT, // #e6cc46
    glow: 'shadow-[0_0_15px_rgba(255,215,0,0.65)]',
    textColor: 'text-[#ffd700]',
    borderColor: 'border-[#ffd700]',
    bgGrad: 'from-[#ffd700]/40 via-[#ffd700]/25 to-[#2e2730]/60',
  },
  BLUE: {
    name: 'BLUE',
    fill: LUDO_TOKEN_PALETTE.BLUE, // #3a72db
    stroke: LUDO_TOKEN_PALETTE.CHARCOAL, // #2e2730
    highlight: LUDO_TOKEN_PALETTE.WHITE_SILVER, // #e4e4e4
    accent: LUDO_TOKEN_PALETTE.LAVENDER, // #c36ede
    glow: 'shadow-[0_0_15px_rgba(58,114,219,0.65)]',
    textColor: 'text-[#3a72db]',
    borderColor: 'border-[#3a72db]',
    bgGrad: 'from-[#3a72db]/40 via-[#3a72db]/25 to-[#2e2730]/60',
  },
};

interface TokenPreviewSVGProps {
  color?: PlayerColor;
  customHex?: string;
  tokenType?: TokenId;
  className?: string;
}

export const TokenPreviewSVG: React.FC<TokenPreviewSVGProps> = ({
  color = 'BLUE',
  customHex,
  tokenType = 'pin',
  className = 'w-7 h-7',
}) => {
  const p = COLOR_CONFIG_PALETTE[color];
  const P = LUDO_TOKEN_PALETTE;

  const activeFill = customHex || p.fill;
  const matchedOption = customHex
    ? NINE_TOKEN_COLORS.find(
        c =>
          c.hex.toLowerCase() === customHex.toLowerCase() ||
          (customHex.toLowerCase() === '#777777' && c.hex.toLowerCase() === '#777777ff') ||
          (customHex.toLowerCase() === '#e4e4e4' && c.id === 'platinum-silver')
      )
    : null;
  const activeAccent = matchedOption ? matchedOption.accent : p.accent;

  switch (tokenType) {
    case 'disc':
      return (
        <svg viewBox="0 0 34 34" className={`${className} filter drop-shadow`}>
          {/* Outer charcoal border */}
          <circle cx="17" cy="17" r="16" fill={P.CHARCOAL} />
          {/* Outer color ring */}
          <circle cx="17" cy="17" r="14.5" fill={activeFill} stroke={P.CHARCOAL} strokeWidth="1" />
          {/* Bottom specular highlight arc */}
          <path
            d="M 6.5 20.5 A 11.5 11.5 0 0 0 27.5 20.5"
            fill="none"
            stroke={activeAccent}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Top specular arc */}
          <path
            d="M 10 10.5 A 11.5 11.5 0 0 1 24 10.5"
            fill="none"
            stroke={P.WHITE_SILVER}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* Concentric white ring */}
          <circle cx="17" cy="17" r="9.5" fill="none" stroke={P.WHITE_SILVER} strokeWidth="1.5" />
          {/* Inner face */}
          <circle cx="17" cy="17" r="8.2" fill={P.CHARCOAL} opacity="0.15" />
          {/* Center 5-point star */}
          <polygon
            points="
              17,11.5
              18.5,14.8
              22.2,15.2
              19.4,17.7
              20.1,21.3
              17,19.5
              13.9,21.3
              14.6,17.7
              11.8,15.2
              15.5,14.8
            "
            fill={P.WHITE_SILVER}
            stroke={P.CHARCOAL}
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'hammer':
      return (
        <svg viewBox="0 0 32 40" className={`${className} filter drop-shadow`}>
          {/* Hammerhead in player color with charcoal outline */}
          <rect
            x="4"
            y="5"
            width="24"
            height="17"
            rx="3.5"
            fill={activeFill}
            stroke={P.CHARCOAL}
            strokeWidth="1.8"
          />
          {/* Top highlight bar */}
          <line x1="7" y1="7" x2="25" y2="7" stroke={P.WHITE_SILVER} strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          {/* White lightning bolt */}
          <path
            d="M17 7.5 L12 13.5 L16 13.5 L14 18.5 L20 12 L16 12 Z"
            fill={P.WHITE_SILVER}
            stroke={P.CHARCOAL}
            strokeWidth="0.6"
            filter="drop-shadow(0 0 2px rgba(255,255,255,0.8))"
          />
          {/* Handle / shaft in silver white with charcoal ridges */}
          <rect
            x="13.5"
            y="22"
            width="5"
            height="13"
            rx="1.5"
            fill={P.WHITE_SILVER}
            stroke={P.CHARCOAL}
            strokeWidth="1.2"
          />
          <line x1="13.5" y1="26" x2="18.5" y2="26" stroke={P.CHARCOAL} strokeWidth="1" />
          <line x1="13.5" y1="29" x2="18.5" y2="29" stroke={P.CHARCOAL} strokeWidth="1" />
          {/* Arrow pommel in vivid purple / accent */}
          <rect
            x="12"
            y="35"
            width="8"
            height="3"
            rx="1.5"
            fill={P.VIVID_PURPLE}
            stroke={P.CHARCOAL}
            strokeWidth="1"
          />
        </svg>
      );

    case 'top':
      return (
        <svg viewBox="0 0 32 40" className={`${className} filter drop-shadow`}>
          {/* Top handle peg in bright gold */}
          <rect x="14.5" y="3" width="3" height="4" rx="1" fill={P.GOLD_ACCENT} stroke={P.CHARCOAL} strokeWidth="0.8" />
          {/* Canopy saucer rim in player color */}
          <path
            d="M4 11 C4 7, 28 7, 28 11 L25 14 L7 14 Z"
            fill={activeFill}
            stroke={P.CHARCOAL}
            strokeWidth="1.2"
          />
          {/* Canopy ribs in silver white */}
          <line x1="16" y1="7.5" x2="16" y2="13.5" stroke={P.WHITE_SILVER} strokeWidth="1" />
          <line x1="10" y1="9.5" x2="9" y2="13.5" stroke={activeAccent} strokeWidth="0.8" />
          <line x1="22" y1="9.5" x2="23" y2="13.5" stroke={activeAccent} strokeWidth="0.8" />
          {/* Charcoal eye-mask visor band */}
          <rect x="10.5" y="13.5" width="11" height="3" rx="1" fill={P.CHARCOAL} />
          <circle cx="13.5" cy="15" r="0.8" fill={P.WHITE_SILVER} />
          <circle cx="18.5" cy="15" r="0.8" fill={P.WHITE_SILVER} />
          {/* Conical body in player color */}
          <path
            d="M8 16.5 L24 16.5 L16 33 Z"
            fill={activeFill}
            stroke={P.CHARCOAL}
            strokeWidth="1.2"
          />
          {/* Silver swirl stripes */}
          <path d="M9 20 Q16 23 23 20" stroke={P.WHITE_SILVER} strokeWidth="1.2" fill="none" />
          <path d="M11 24 Q16 27 21 24" stroke={P.WHITE_SILVER} strokeWidth="1" fill="none" opacity="0.9" />
          <path d="M13 28 Q16 30 19 28" stroke={P.WHITE_SILVER} strokeWidth="0.8" fill="none" opacity="0.85" />
          {/* Sharp metallic needle tip in vivid purple */}
          <polygon points="14.5,33 17.5,33 16,37" fill={P.VIVID_PURPLE} stroke={P.CHARCOAL} strokeWidth="0.8" />
        </svg>
      );

    case 'ninja':
      return (
        <svg viewBox="0 0 32 40" className={`${className} filter drop-shadow`}>
          {/* Ninja head in charcoal */}
          <circle cx="16" cy="16" r="13" fill={P.CHARCOAL} stroke={P.CHARCOAL} strokeWidth="1" />
          {/* Ninja colored headband */}
          <rect x="4" y="10" width="24" height="6.5" rx="2" fill={activeFill} stroke={P.CHARCOAL} strokeWidth="0.8" />
          {/* Visor sunglasses in onyx charcoal */}
          <rect x="7" y="14" width="18" height="5.5" rx="2.5" fill={P.CHARCOAL} stroke={P.CHARCOAL} strokeWidth="0.5" />
          {/* Angular glare reflections in silver white */}
          <ellipse cx="12" cy="16.5" rx="2.5" ry="1.2" fill={P.WHITE_SILVER} />
          <ellipse cx="20" cy="16.5" rx="2.5" ry="1.2" fill={P.WHITE_SILVER} />
          {/* Ninja collar in accent */}
          <path d="M10 27 L16 33 L22 27 Z" fill={activeAccent} stroke={P.CHARCOAL} strokeWidth="1" />
        </svg>
      );

    case 'pin':
    default:
      return (
        <svg viewBox="0 0 28 32" className={`${className} filter drop-shadow`}>
          {/* Base circular pedestal ring in rich brown with inner transparency */}
          <path
            d="M 14 10.8 A 9.2 9.2 0 1 0 14 29.2 A 9.2 9.2 0 1 0 14 10.8 Z M 14 13.6 A 6.4 6.4 0 1 1 14 26.4 A 6.4 6.4 0 1 1 14 13.6 Z"
            fill={P.RING_BROWN}
            stroke={P.CHARCOAL}
            strokeWidth="1.2"
            fillRule="evenodd"
          />
          {/* 3D specular highlight arc on the brown pedestal ring */}
          <path
            d="M 7.2 22.5 A 7.8 7.8 0 0 0 20.8 22.5"
            fill="none"
            stroke={P.RING_BROWN_LIGHT}
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Upright Teardrop pin body in silver white with charcoal outline */}
          <path
            d="M 14 2 C 9.58 2 6 5.58 6 10 C 6 15.8 14 23.5 14 23.5 S 22 15.8 22 10 C 22 5.58 18.42 2 14 2 Z"
            fill={P.WHITE_SILVER}
            stroke={P.CHARCOAL}
            strokeWidth="1.6"
          />
          {/* Center color dot in active color (enlarged for vivid color clarity) */}
          <circle
            cx="14"
            cy="10"
            r="5.8"
            fill={activeFill}
            stroke={P.CHARCOAL}
            strokeWidth="0.8"
          />
          {/* Highlight specular dot */}
          <circle cx="12" cy="8" r="1.5" fill={P.WHITE_SILVER} opacity="0.9" />
        </svg>
      );
  }
};
