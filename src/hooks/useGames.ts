import type { Game } from '../types';

const STORAGE_KEY = 'smartstats-games';

export function loadGames(): Game[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveGames(games: Game[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function addGame(game: Omit<Game, 'id' | 'createdAt'> & { side?: 'home' | 'away' }): Game {
  const games = loadGames();
  const side = game.side || 'home';

  // Try to merge with existing game (same date + opponent)
  const existing = games.find(
    g => g.date === game.date && g.opponent.toLowerCase() === game.opponent.toLowerCase()
  );

  if (existing) {
    if (side === 'away') {
      existing.opponentStats = game.playerStats;
    } else {
      existing.playerStats = game.playerStats;
    }
    if (game.score) existing.score = game.score;
    if (game.notes) existing.notes = [existing.notes, game.notes].filter(Boolean).join(' | ');
    saveGames(games);
    return existing;
  }

  const newGame: Game = {
    id: crypto.randomUUID(),
    date: game.date,
    opponent: game.opponent,
    score: game.score,
    notes: game.notes,
    playerStats: side === 'home' ? game.playerStats : [],
    opponentStats: side === 'away' ? game.playerStats : undefined,
    createdAt: new Date().toISOString(),
  };
  games.push(newGame);
  saveGames(games);
  return newGame;
}

export function deleteGame(id: string) {
  const games = loadGames().filter(g => g.id !== id);
  saveGames(games);
}
