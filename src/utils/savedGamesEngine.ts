import { SavedGame, GameMode, BoardTheme, GameRules, Player, PassNPlaySubMode } from '../types/ludo';

const STORAGE_KEY_SAVED_GAMES = 'ludo_saved_games';

export function getSavedGames(): SavedGame[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_GAMES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load saved games:', err);
    return [];
  }
}

export function saveCurrentGame(gameData: {
  gameMode: GameMode;
  subMode?: PassNPlaySubMode;
  boardTheme: BoardTheme;
  rules: GameRules;
  players: Player[];
  activePlayerIndex: number;
  title?: string;
  freezeStarIndices?: number[];
  jumpIconIndex?: number | null;
  jumpIconIndices?: number[];
  freezeStarRespawnTimes?: number[];
  jumpIconRespawnTime?: number | null;
  jumpIconRespawnTimes?: number[];
}): SavedGame {
  const existing = getSavedGames();
  const id = `save_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const dateFormatted = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

  const activeP = gameData.players[gameData.activePlayerIndex];
  const title = gameData.title || `${gameData.subMode || gameData.gameMode} (${gameData.players.filter(p => p.isActive).length}P) - ${activeP ? activeP.name : 'Match'}`;

  const newGame: SavedGame = {
    id,
    dateFormatted,
    timestamp: Date.now(),
    gameMode: gameData.gameMode,
    subMode: gameData.subMode,
    boardTheme: gameData.boardTheme,
    rules: gameData.rules,
    players: gameData.players,
    activePlayerIndex: gameData.activePlayerIndex,
    title,
    freezeStarIndices: gameData.freezeStarIndices,
    jumpIconIndex: gameData.jumpIconIndex,
    jumpIconIndices: gameData.jumpIconIndices,
    freezeStarRespawnTimes: gameData.freezeStarRespawnTimes,
    jumpIconRespawnTime: gameData.jumpIconRespawnTime,
    jumpIconRespawnTimes: gameData.jumpIconRespawnTimes,
  };

  // Keep up to 10 latest saved games
  const updated = [newGame, ...existing.slice(0, 9)];
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_GAMES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save game to localStorage:', err);
  }

  return newGame;
}

export function deleteSavedGame(id: string): void {
  try {
    const existing = getSavedGames();
    const updated = existing.filter(g => g.id !== id);
    localStorage.setItem(STORAGE_KEY_SAVED_GAMES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete saved game:', err);
  }
}

