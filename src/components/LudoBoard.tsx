import React, { useMemo } from 'react';
import { Player, Pawn, PlayerColor, Coordinate, TurnPhase, BoardTheme, TokenId } from '../types/ludo';
import { 
  getPawnCoordinate, 
  GLOBAL_TRACK,
} from '../utils/boardCoordinates';
import { Star, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Crown } from 'lucide-react';
import { TokenPreviewSVG, getCanonicalFamily } from './TokenPreviewSVG';

interface LudoBoardProps {
  players: Player[];
  activePlayer: Player;
  phase: TurnPhase;
  legalPawnIds: number[];
  friendlyKillPawnIds?: number[];
  animatingPawn: {
    color: PlayerColor;
    pawnId: number;
    coord: Coordinate;
    isHopping: boolean;
    isRewinding?: boolean;
  } | null;
  onPawnClick: (pawnId: number) => void;
  theme?: BoardTheme;
  freezeStarIndices?: number[];
  jumpIconIndex?: number | null;
  jumpIconIndices?: number[];
  movablePlayerId?: string;
  selectedTokenId?: TokenId;
}

export const LudoBoard: React.FC<LudoBoardProps> = ({
  players,
  activePlayer,
  phase,
  legalPawnIds,
  friendlyKillPawnIds = [],
  animatingPawn,
  onPawnClick,
  freezeStarIndices = [],
  jumpIconIndex = null,
  jumpIconIndices = [],
  movablePlayerId,
  selectedTokenId,
}) => {
  // Quadrant visual configurations dynamically derived from player choices.
  // In 2-player (or 3-player) matches, if active players pick colors like Green or Blue,
  // the remaining empty quadrants are automatically assigned distinct canonical colors
  // so no empty quadrant duplicates an active player's color on the board!
  const quadrantConfigs = useMemo<Record<PlayerColor, {
    seatColor: string;
    baseColor: string;
    textColor: string;
    textSize: string;
    name: string;
    isActive: boolean;
    player?: Player;
  }>>(() => {
    const ALL_CANONICAL: PlayerColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

    const defaultSeatMap: Record<PlayerColor, {
      seatColor: string;
      baseColor: string;
      textColor: string;
      textSize: string;
    }> = {
      RED: {
        seatColor: 'var(--seat-red)',
        baseColor: 'var(--seat-red)',
        textColor: 'var(--text-light)',
        textSize: 'text-[16px]',
      },
      GREEN: {
        seatColor: 'var(--seat-green)',
        baseColor: 'var(--seat-green)',
        textColor: 'var(--text-light)',
        textSize: 'text-[19px]',
      },
      YELLOW: {
        seatColor: 'var(--accent-yellow)',
        baseColor: 'var(--accent-yellow)',
        textColor: 'var(--text-dark)',
        textSize: 'text-[16px]',
      },
      BLUE: {
        seatColor: 'var(--seat-blue)',
        baseColor: 'var(--seat-blue)',
        textColor: 'var(--text-light)',
        textSize: 'text-[16px]',
      },
    };

    // 1. Identify canonical families taken by active players
    const activePlayers = players.filter(p => p.isActive);
    const takenFamilies = new Set<PlayerColor>();
    activePlayers.forEach(p => {
      const fam = getCanonicalFamily(p.tokenColorHex || p.color);
      if (fam) takenFamilies.add(fam);
    });

    // 2. Available canonical colors not used by any active player
    const availableColors = ALL_CANONICAL.filter(c => !takenFamilies.has(c));

    // 3. Smart resolution for empty quadrants so empty seats never duplicate active player colors
    const emptySeats = ALL_CANONICAL.filter(c => !players.some(p => p.color === c && p.isActive));
    const emptySeatAssignments = new Map<PlayerColor, PlayerColor>();

    // Pass 1: Empty seats that can keep their native default color without clashing
    emptySeats.forEach(seat => {
      const availIdx = availableColors.indexOf(seat);
      if (availIdx !== -1) {
        emptySeatAssignments.set(seat, seat);
        availableColors.splice(availIdx, 1);
      }
    });

    // Pass 2: Remaining empty seats take next available distinct color
    emptySeats.forEach(seat => {
      if (!emptySeatAssignments.has(seat) && availableColors.length > 0) {
        const fallback = availableColors.shift()!;
        emptySeatAssignments.set(seat, fallback);
      }
    });

    // 4. Build config for each quadrant
    const result = {} as Record<PlayerColor, {
      seatColor: string;
      baseColor: string;
      textColor: string;
      textSize: string;
      name: string;
      isActive: boolean;
      player?: Player;
    }>;

    ALL_CANONICAL.forEach(quadrantColor => {
      const player = players.find(p => p.color === quadrantColor && p.isActive);
      const defaultCfg = defaultSeatMap[quadrantColor];

      if (player) {
        const chosenColor = player.tokenColorHex || defaultCfg.seatColor;
        const seatColor = chosenColor;
        const baseColor = chosenColor;

        // Dynamically compute high-contrast text color without any raw hex codes in source
        let textColor = defaultCfg.textColor;
        if (chosenColor.startsWith('#')) {
          const hex = chosenColor.replace(/[^0-9a-fA-F]/g, '');
          if (hex.length === 6 || hex.length === 8) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            textColor = lum > 0.55 ? 'var(--text-dark)' : 'var(--text-light)';
          }
        } else if (
          chosenColor.includes('yellow') ||
          chosenColor.includes('gold') ||
          chosenColor.includes('silver') ||
          chosenColor.includes('tint')
        ) {
          textColor = 'var(--text-dark)';
        } else {
          textColor = 'var(--text-light)';
        }

        result[quadrantColor] = {
          ...defaultCfg,
          seatColor,
          baseColor,
          textColor,
          name: player.name,
          isActive: true,
          player,
        };
      } else {
        // Empty quadrant: use its assigned distinct canonical color
        const assignedCanonical = emptySeatAssignments.get(quadrantColor) || quadrantColor;
        const fallbackCfg = defaultSeatMap[assignedCanonical];

        result[quadrantColor] = {
          ...fallbackCfg,
          textSize: defaultCfg.textSize,
          name: '',
          isActive: false,
          player: undefined,
        };
      }
    });

    return result;
  }, [players]);

  const getQuadrantConfig = (color: PlayerColor) => quadrantConfigs[color];

  const redConfig = quadrantConfigs['RED'];
  const greenConfig = quadrantConfigs['GREEN'];
  const yellowConfig = quadrantConfigs['YELLOW'];
  const blueConfig = quadrantConfigs['BLUE'];

  // Helper to render Yard Base socket (with perfectly positioned stationary token when in base)
  const renderYardSocket = (
    color: PlayerColor,
    config: ReturnType<typeof getQuadrantConfig>,
    idx: number
  ) => {
    const pawn = config.player?.pawns.find(pw => pw.id === idx);
    const isInBase = pawn && pawn.step === -1;
    const isPawnAnimating =
      animatingPawn && animatingPawn.color === color && animatingPawn.pawnId === idx;
    const showToken = isInBase && !isPawnAnimating && config.isActive;

    const isLegal =
      showToken &&
      config.player?.id === (movablePlayerId ?? activePlayer.id) &&
      phase === 'SELECTING_PAWN' &&
      legalPawnIds.includes(idx);

    return (
      <div
        key={idx}
        onClick={e => {
          if (isLegal) {
            e.stopPropagation();
            onPawnClick(idx);
          }
        }}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-inner flex items-center justify-center border-2 relative transition-transform ${
          isLegal ? 'cursor-pointer hover:scale-110 active:scale-95' : ''
        }`}
        style={{
          backgroundColor: config.seatColor,
          borderColor: 'var(--grid-line)',
        }}
      >
        {showToken && (
          <div
            className={`relative flex items-center justify-center ${
              isLegal ? 'pawn-movable' : ''
            }`}
          >
            <TokenPreviewSVG
              tokenType={config.player?.tokenId || selectedTokenId || 'pin'}
              color={color}
              customHex={config.player?.tokenColorHex || config.seatColor}
              className="w-[22px] h-[28px] sm:w-[25px] sm:h-[32px] translate-y-[1px]"
            />
          </div>
        )}
      </div>
    );
  };

  // Helper to render Yard Base: 4 stationary sockets OR finished Rank display (e.g. 👑 1, 👑 2, 👑 3)
  const renderYardBase = (
    color: PlayerColor,
    config: ReturnType<typeof getQuadrantConfig>
  ) => {
    const player = config.player;
    const rank = player?.rank;
    const totalActive = players.filter(p => p.isActive).length;
    // In classic Ludo, a player finishes when all their pawns are home (or in quick mode 1 pawn)
    // Only players who actually completed the race one by one display their rank crown watermark.
    // The last unfinished player (loser) retains their yard sockets and tokens, matching Ludo King snap.
    const allPawnsHome = Boolean(player && player.pawns.every(pw => pw.isHome || pw.step >= 56));
    const isWinnerFinished = typeof rank === 'number' && rank > 0 && (
      (totalActive <= 2 ? rank === 1 : rank < totalActive) || allPawnsHome
    );

    return (
      <div
        className="w-[84%] aspect-square rounded-xl p-1.5 sm:p-2 relative flex items-center justify-center shadow-inner overflow-hidden transition-all duration-500"
        style={{
          backgroundColor: 'var(--base-inner)',
          border: '2px solid var(--grid-line)',
        }}
      >
        {isWinnerFinished ? (
          <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in-75 duration-500 relative select-none">
            {/* Subtle radial golden glow backdrop */}
            <div
              className="absolute inset-0 rounded-lg opacity-25 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, var(--accent-gold) 0%, transparent 75%)',
              }}
            />
            {/* Majestic Crown Watermark in background */}
            <Crown
              className="absolute w-14 h-14 sm:w-16 sm:h-16 opacity-30 pointer-events-none drop-shadow"
              style={{
                color: 'var(--accent-gold)',
                fill: 'var(--accent-gold)',
              }}
            />
            {/* Golden Crown sitting proudly above rank number */}
            <Crown
              className="w-7 h-7 sm:w-8 sm:h-8 relative z-10 drop-shadow animate-pulse"
              style={{
                color: 'var(--accent-gold)',
                fill: 'var(--accent-gold)',
              }}
            />
            {/* Big Bold Rank Number matching Ludo King reference snap */}
            <span
              className="text-4xl sm:text-5xl font-black leading-none tracking-tight relative z-10 drop-shadow select-none"
              style={{ color: 'var(--text-dark)' }}
            >
              {rank}
            </span>
          </div>
        ) : (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1.5 sm:gap-2 place-items-center">
            {[0, 1, 2, 3].map(idx => renderYardSocket(color, config, idx))}
          </div>
        )}
      </div>
    );
  };

  // Collect all static pawns ON THE BOARD (excluding in-base pawns and in-flight hopping pawn)
  interface BoardPawnItem {
    player: Player;
    pawn: Pawn;
    coord: Coordinate;
    isLegal: boolean;
    isFriendlyKill: boolean;
    colorHex: string;
  }

  const boardPawns: BoardPawnItem[] = [];

  players.forEach(p => {
    if (!p.isActive) return;
    const seatColor = getQuadrantConfig(p.color).seatColor;

    p.pawns.forEach(pawn => {
      // Stationary pawns in Yard Base (step === -1) are rendered directly inside their yard base sockets
      if (pawn.step === -1) return;

      if (
        animatingPawn &&
        animatingPawn.color === p.color &&
        animatingPawn.pawnId === pawn.id
      ) {
        return;
      }

      const coord = getPawnCoordinate(p.color, pawn.step, pawn.id);
      const isLegal =
        p.id === (movablePlayerId ?? activePlayer.id) &&
        phase === 'SELECTING_PAWN' &&
        legalPawnIds.includes(pawn.id);
      const isFriendlyKill = isLegal && friendlyKillPawnIds.includes(pawn.id);

      boardPawns.push({
        player: p,
        pawn,
        coord,
        isLegal,
        isFriendlyKill,
        colorHex: seatColor,
      });
    });
  });

  // Group pawns by cell coordinate to calculate radial stacking offset
  const pawnsByCell: Record<string, BoardPawnItem[]> = {};
  boardPawns.forEach(item => {
    const key = `${Math.round(item.coord.row * 2) / 2},${Math.round(item.coord.col * 2) / 2}`;
    if (!pawnsByCell[key]) pawnsByCell[key] = [];
    pawnsByCell[key].push(item);
  });

  // Stack rendering (Part 11): 2 tokens at scale 0.85 diagonal, 3-4 at scale 0.65 in 2x2 grid (fits inside cell)
  const getClusterOffset = (index: number, total: number) => {
    if (total <= 1) return { x: 0, y: 0, scale: 1 };
    if (total === 2) {
      const offsets = [
        { x: -4, y: -2, scale: 0.85 },
        { x: 4, y: 2, scale: 0.85 },
      ];
      return offsets[index] || { x: 0, y: 0, scale: 0.85 };
    }
    const gridOffsets = [
      { x: -5, y: -5, scale: 0.65 },
      { x: 5, y: -5, scale: 0.65 },
      { x: -5, y: 5, scale: 0.65 },
      { x: 5, y: 5, scale: 0.65 },
    ];
    return gridOffsets[index % 4];
  };

  // Helper to render Star Badge on safe cells (Role map: Dark grid line on Silver track is 11.4:1)
  const renderSafeStar = () => (
    <Star
      className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2] fill-none"
      style={{ color: 'var(--grid-line)' }}
    />
  );

  // Helper to render Freeze Star on board (Rule 1: Icy cyan star with frost shimmer)
  const renderFreezeStar = () => (
    <div className="relative flex items-center justify-center animate-pulse z-10" title="Freeze Star">
      <Star
        className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.8]"
        style={{
          color: 'var(--grid-line)',
          fill: 'var(--seat-blue)',
        }}
      />
      <span className="absolute -top-1.5 -right-1.5 text-[8px] leading-none select-none pointer-events-none drop-shadow">❄️</span>
    </div>
  );

  // Helper to render Jump Icon on board (Rule 2: Energetic zap / spring jump icon)
  const renderJumpIcon = () => (
    <div className="relative flex items-center justify-center animate-bounce z-10" title="Jump Icon (+1 to +5)">
      <Zap
        className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.8]"
        style={{
          color: 'var(--grid-line)',
          fill: 'var(--accent-yellow)',
        }}
      />
    </div>
  );

  return (
    <div className="relative aspect-square w-full max-w-[500px] mx-auto select-none touch-manipulation p-1 sm:p-1.5 rounded-2xl bg-slate-900/60 shadow-2xl">
      {/* 15x15 Ludo Board Grid with 3px --board-border and Silver --track-cell background */}
      <div
        className="relative w-full h-full rounded-xl overflow-hidden shadow-inner grid grid-cols-15 grid-rows-15"
        style={{
          backgroundColor: 'var(--track-cell)',
          border: '3px solid var(--board-border)',
        }}
      >

        {/* ===================== 1. RED YARD (Top-Left 6x6) ===================== */}
        <div
          className="col-span-6 row-span-6 flex flex-col items-center justify-between p-1.5 sm:p-2 border-b-2 border-r-2 transition-colors duration-300"
          style={{
            backgroundColor: redConfig.baseColor,
            borderColor: 'var(--grid-line)',
          }}
        >
          {/* Player Name at top of yard */}
          <div
            className={`w-full text-center font-black ${redConfig.textSize} tracking-wide capitalize drop-shadow truncate px-1 leading-tight`}
            style={{ color: redConfig.textColor }}
          >
            {redConfig.isActive ? redConfig.name : ''}
          </div>

          {/* White square base with 4 colored sockets or Rank Badge */}
          {renderYardBase('RED', redConfig)}
          <div className="h-0.5" />
        </div>

        {/* ===================== 2. TOP ARM (Rows 0-5, Cols 6-8) ===================== */}
        <div
          className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 border-b-2"
          style={{ borderColor: 'var(--grid-line)' }}
        >
          {Array.from({ length: 18 }).map((_, i) => {
            const row = Math.floor(i / 3);
            const colInArm = i % 3;

            // Green Home Corridor (center column: colInArm 1, rows 1..5)
            const isGreenCorridor = colInArm === 1 && row > 0;
            // Green Start Cell: row 1, col 2 in arm (col 8)
            const isGreenStart = row === 1 && colInArm === 2;
            // Safe Star Cell: row 2, col 0 in arm (col 6)
            const isStar = row === 2 && colInArm === 0;
            // Directional arrow at top of corridor (row 0, col 1 in arm)
            const isArrowTop = row === 0 && colInArm === 1;

            const trackIdx = GLOBAL_TRACK.findIndex(c => c.row === row && c.col === (6 + colInArm));
            const isFreezeStar = freezeStarIndices.includes(trackIdx);
            const isJumpIcon = (jumpIconIndices && jumpIconIndices.length > 0) ? jumpIconIndices.includes(trackIdx) : jumpIconIndex === trackIdx;

            return (
              <div
                key={`top-${i}`}
                className="border flex items-center justify-center relative"
                style={{
                  backgroundColor: isGreenCorridor || isGreenStart ? greenConfig.seatColor : 'var(--track-cell)',
                  borderColor: 'var(--grid-line)',
                }}
              >
                {isStar && renderSafeStar()}
                {isFreezeStar && renderFreezeStar()}
                {isJumpIcon && renderJumpIcon()}
                {isGreenStart && (
                  <ArrowDown
                    className="w-3.5 h-3.5 stroke-[3] drop-shadow"
                    style={{ color: greenConfig.textColor }}
                  />
                )}
                {isArrowTop && (
                  <ArrowDown
                    className="w-4 h-4 stroke-[3] drop-shadow"
                    style={{ color: 'var(--grid-line)' }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ===================== 3. GREEN YARD (Top-Right 6x6) ===================== */}
        <div
          className="col-span-6 row-span-6 flex flex-col items-center justify-between p-1.5 sm:p-2 border-b-2 border-l-2 transition-colors duration-300"
          style={{
            backgroundColor: greenConfig.baseColor,
            borderColor: 'var(--grid-line)',
          }}
        >
          {/* Player Name at top of yard */}
          <div
            className={`w-full text-center font-black ${greenConfig.textSize} tracking-wide capitalize drop-shadow truncate px-1 leading-tight`}
            style={{ color: greenConfig.textColor }}
          >
            {greenConfig.isActive ? greenConfig.name : ''}
          </div>

          {/* White square base with 4 colored sockets or Rank Badge */}
          {renderYardBase('GREEN', greenConfig)}
          <div className="h-0.5" />
        </div>

        {/* ===================== 4. LEFT ARM (Rows 6-8, Cols 0-5) ===================== */}
        <div
          className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 border-r-2"
          style={{ borderColor: 'var(--grid-line)' }}
        >
          {Array.from({ length: 18 }).map((_, i) => {
            const rowInArm = Math.floor(i / 6);
            const col = i % 6;

            // Red Home Corridor (center row: row 1 in arm, cols 1..5)
            const isRedCorridor = rowInArm === 1 && col > 0;
            // Red Start Cell: row 0 in arm, col 1
            const isRedStart = rowInArm === 0 && col === 1;
            // Safe Star Cell: row 2 in arm, col 2
            const isStar = rowInArm === 2 && col === 2;
            // Directional arrow at start of corridor (row 1, col 0)
            const isArrowLeft = rowInArm === 1 && col === 0;

            const trackIdx = GLOBAL_TRACK.findIndex(c => c.row === (6 + rowInArm) && c.col === col);
            const isFreezeStar = freezeStarIndices.includes(trackIdx);
            const isJumpIcon = (jumpIconIndices && jumpIconIndices.length > 0) ? jumpIconIndices.includes(trackIdx) : jumpIconIndex === trackIdx;

            return (
              <div
                key={`left-${i}`}
                className="border flex items-center justify-center relative"
                style={{
                  backgroundColor: isRedCorridor || isRedStart ? redConfig.seatColor : 'var(--track-cell)',
                  borderColor: 'var(--grid-line)',
                }}
              >
                {isStar && renderSafeStar()}
                {isFreezeStar && renderFreezeStar()}
                {isJumpIcon && renderJumpIcon()}
                {isRedStart && (
                  <ArrowRight
                    className="w-3.5 h-3.5 stroke-[3] drop-shadow"
                    style={{ color: redConfig.textColor }}
                  />
                )}
                {isArrowLeft && (
                  <ArrowRight
                    className="w-4 h-4 stroke-[3] drop-shadow"
                    style={{ color: 'var(--grid-line)' }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ===================== 5. CENTER HOME TRIANGLES (Rows 6-8, Cols 6-8) ===================== */}
        <div
          className="col-span-3 row-span-3 relative overflow-hidden border-2"
          style={{
            backgroundColor: 'var(--grid-line)',
            borderColor: 'var(--grid-line)',
          }}
        >
          {/* Top (Green) Triangle */}
          <div 
            className="absolute inset-0 transition-colors duration-300"
            style={{ 
              backgroundColor: greenConfig.seatColor,
              clipPath: 'polygon(0 0, 100% 0, 50% 50%)' 
            }}
          />
          {/* Right (Yellow/Purple) Triangle */}
          <div 
            className="absolute inset-0 transition-colors duration-300"
            style={{ 
              backgroundColor: yellowConfig.seatColor,
              clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)' 
            }}
          />
          {/* Bottom (Blue) Triangle */}
          <div 
            className="absolute inset-0 transition-colors duration-300"
            style={{ 
              backgroundColor: blueConfig.seatColor,
              clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)' 
            }}
          />
          {/* Left (Red) Triangle */}
          <div 
            className="absolute inset-0 transition-colors duration-300"
            style={{ 
              backgroundColor: redConfig.seatColor,
              clipPath: 'polygon(0 0, 0 100%, 50% 50%)' 
            }}
          />
        </div>

        {/* ===================== 6. RIGHT ARM (Rows 6-8, Cols 9-14) ===================== */}
        <div
          className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 border-l-2"
          style={{ borderColor: 'var(--grid-line)' }}
        >
          {Array.from({ length: 18 }).map((_, i) => {
            const rowInArm = Math.floor(i / 6);
            const col = i % 6;

            // Seat 2 Yellow Home Corridor (center row: row 1 in arm, cols 0..4)
            const isYellowCorridor = rowInArm === 1 && col < 5;
            // Seat 2 Yellow Start Cell: row 2 in arm, col 4 (row 8, col 13)
            const isYellowStart = rowInArm === 2 && col === 4;
            // Safe Star Cell: row 0 in arm, col 3 (row 6, col 12)
            const isStar = rowInArm === 0 && col === 3;
            // Directional arrow at end of corridor (row 1, col 5)
            const isArrowRight = rowInArm === 1 && col === 5;

            const trackIdx = GLOBAL_TRACK.findIndex(c => c.row === (6 + rowInArm) && c.col === (9 + col));
            const isFreezeStar = freezeStarIndices.includes(trackIdx);
            const isJumpIcon = (jumpIconIndices && jumpIconIndices.length > 0) ? jumpIconIndices.includes(trackIdx) : jumpIconIndex === trackIdx;

            return (
              <div
                key={`right-${i}`}
                className="border flex items-center justify-center relative"
                style={{
                  backgroundColor: isYellowCorridor || isYellowStart ? yellowConfig.seatColor : 'var(--track-cell)',
                  borderColor: 'var(--grid-line)',
                }}
              >
                {isStar && renderSafeStar()}
                {isFreezeStar && renderFreezeStar()}
                {isJumpIcon && renderJumpIcon()}
                {isYellowStart && (
                  <ArrowLeft
                    className="w-3.5 h-3.5 stroke-[3] drop-shadow"
                    style={{ color: yellowConfig.textColor }}
                  />
                )}
                {isArrowRight && (
                  <ArrowLeft
                    className="w-4 h-4 stroke-[3] drop-shadow"
                    style={{ color: 'var(--grid-line)' }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ===================== 7. BLUE YARD (Bottom-Left 6x6) ===================== */}
        <div
          className="col-span-6 row-span-6 flex flex-col items-center justify-between p-1.5 sm:p-2 border-t-2 border-r-2 transition-colors duration-300"
          style={{
            backgroundColor: blueConfig.baseColor,
            borderColor: 'var(--grid-line)',
          }}
        >
          <div className="h-0.5" />
          {/* White square base with 4 colored sockets or Rank Badge */}
          {renderYardBase('BLUE', blueConfig)}

          {/* Player Name at bottom of yard */}
          <div
            className={`w-full text-center font-black ${blueConfig.textSize} tracking-wide capitalize drop-shadow truncate px-1 leading-tight`}
            style={{ color: blueConfig.textColor }}
          >
            {blueConfig.isActive ? blueConfig.name : ''}
          </div>
        </div>

        {/* ===================== 8. BOTTOM ARM (Rows 9-14, Cols 6-8) ===================== */}
        <div
          className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 border-t-2"
          style={{ borderColor: 'var(--grid-line)' }}
        >
          {Array.from({ length: 18 }).map((_, i) => {
            const rowInArm = Math.floor(i / 3);
            const colInArm = i % 3;

            // Blue Home Corridor (center column: col 1 in arm, rows 0..4)
            const isBlueCorridor = colInArm === 1 && rowInArm < 5;
            // Blue Start Cell: row 4 in arm, col 0 (row 13, col 6)
            const isBlueStart = rowInArm === 4 && colInArm === 0;
            // Safe Star Cell: row 3 in arm, col 2 (row 12, col 8)
            const isStar = rowInArm === 3 && colInArm === 2;
            // Directional arrow at bottom of corridor (row 5 in arm, col 1)
            const isArrowBottom = rowInArm === 5 && colInArm === 1;

            const trackIdx = GLOBAL_TRACK.findIndex(c => c.row === (9 + rowInArm) && c.col === (6 + colInArm));
            const isFreezeStar = freezeStarIndices.includes(trackIdx);
            const isJumpIcon = (jumpIconIndices && jumpIconIndices.length > 0) ? jumpIconIndices.includes(trackIdx) : jumpIconIndex === trackIdx;

            return (
              <div
                key={`bottom-${i}`}
                className="border flex items-center justify-center relative"
                style={{
                  backgroundColor: isBlueCorridor || isBlueStart ? blueConfig.seatColor : 'var(--track-cell)',
                  borderColor: 'var(--grid-line)',
                }}
              >
                {isStar && renderSafeStar()}
                {isFreezeStar && renderFreezeStar()}
                {isJumpIcon && renderJumpIcon()}
                {isBlueStart && (
                  <ArrowUp
                    className="w-3.5 h-3.5 stroke-[3] drop-shadow"
                    style={{ color: blueConfig.textColor }}
                  />
                )}
                {isArrowBottom && (
                  <ArrowUp
                    className="w-4 h-4 stroke-[3] drop-shadow"
                    style={{ color: 'var(--grid-line)' }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ===================== 9. YELLOW YARD (Bottom-Right 6x6) ===================== */}
        <div
          className="col-span-6 row-span-6 flex flex-col items-center justify-between p-1.5 sm:p-2 border-t-2 border-l-2 transition-colors duration-300"
          style={{
            backgroundColor: yellowConfig.baseColor,
            borderColor: 'var(--grid-line)',
          }}
        >
          <div className="h-0.5" />
          {/* White square base with 4 colored sockets or Rank Badge */}
          {renderYardBase('YELLOW', yellowConfig)}

          {/* Player Name at bottom of yard */}
          <div
            className={`w-full text-center font-black ${yellowConfig.textSize} tracking-wide capitalize truncate px-1 leading-tight`}
            style={{ color: yellowConfig.textColor }}
          >
            {yellowConfig.isActive ? yellowConfig.name : ''}
          </div>
        </div>

        {/* ===================== 10. PAWNS LAYER (Absolute Overlay) ===================== */}
        <div className="absolute inset-0 pointer-events-none">
          {Object.entries(pawnsByCell).map(([cellKey, items]) => {
            const hasStack = items.length >= 2;
            return items.map((item, itemIdx) => {
              const { player, pawn, coord, isLegal, isFriendlyKill, colorHex } = item;
              const offset = getClusterOffset(itemIdx, items.length);

              // Percentage coordinates on 15x15 board
              const leftPercent = ((coord.col + 0.5) / 15) * 100;
              const topPercent = ((coord.row + 0.5) / 15) * 100;

              return (
                <div
                  key={`${player.id}-${pawn.id}`}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${offset.scale})`,
                    zIndex: isLegal ? 45 : 20 + itemIdx,
                  }}
                  className="absolute pointer-events-auto"
                  onClick={() => {
                    if (isLegal) onPawnClick(pawn.id);
                  }}
                >
                  <div
                    className={`relative flex items-center justify-center transition-transform ${
                      isLegal ? 'cursor-pointer pawn-movable' : ''
                    }`}
                  >
                    {/* Frozen Ice Badge (Rule 1: Freeze Star effect) */}
                    {pawn.isFrozen && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap animate-pulse">
                        <div
                          className="font-black text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded-full shadow-lg flex items-center gap-0.5 border"
                          style={{
                            backgroundColor: 'var(--seat-blue)',
                            color: 'var(--text-light)',
                            borderColor: 'var(--grid-line)',
                          }}
                        >
                          <span>🧊</span>
                          <span>FROZEN</span>
                        </div>
                      </div>
                    )}

                    {/* Token Graphic */}
                    <div
                      style={{
                        filter: pawn.isFrozen
                          ? 'drop-shadow(0 0 5px var(--seat-blue))'
                          : 'drop-shadow(0 2px 2px rgba(0,0,0,0.45))',
                      }}
                    >
                      <TokenPreviewSVG
                        tokenType={item.player.tokenId || selectedTokenId || 'pin'}
                        color={item.player.color}
                        customHex={colorHex}
                        className="w-[22px] h-[28px] sm:w-[25px] sm:h-[32px]"
                      />
                    </div>
                  </div>
                </div>
              );
            });
          })}

          {/* Actively Animating Pawn (Hopping along trajectory or Rewinding to Yard Base) */}
          {animatingPawn && (() => {
            const animHex = getQuadrantConfig(animatingPawn.color).seatColor;
            const animPlayer = players.find(p => p.color === animatingPawn.color);

            return (
              <div
                style={{
                  left: `${((animatingPawn.coord.col + 0.5) / 15) * 100}%`,
                  top: `${((animatingPawn.coord.row + 0.5) / 15) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 60,
                  transition: animatingPawn.isRewinding
                    ? 'left 40ms linear, top 40ms linear'
                    : 'left 140ms ease-out, top 140ms ease-out',
                }}
                className={`absolute pointer-events-none ${
                  !animatingPawn.isRewinding && animatingPawn.isHopping ? 'pawn-hop' : ''
                }`}
              >
                <TokenPreviewSVG
                  tokenType={animPlayer?.tokenId || selectedTokenId || 'pin'}
                  color={animatingPawn.color}
                  customHex={animPlayer?.tokenColorHex || animHex}
                  className="w-[22px] h-[28px] sm:w-[25px] sm:h-[32px]"
                />
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
};
