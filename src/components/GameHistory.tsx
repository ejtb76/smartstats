import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { loadGames, deleteGame } from '../hooks/useGames';
import type { Game } from '../types';
import GameDetail from './GameDetail';

export default function GameHistory() {
  const [games, setGames] = useState<Game[]>(loadGames);
  const [expanded, setExpanded] = useState<string | null>(null);

  function handleDelete(id: string) {
    deleteGame(id);
    setGames(games.filter(g => g.id !== id));
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Game History</h2>

      {games.length === 0 ? (
        <p className="text-gray-500 text-sm">No games recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {games.sort((a, b) => b.date.localeCompare(a.date)).map(game => (
            <div key={game.id} className="bg-white rounded-lg border border-gray-200">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === game.id ? null : game.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{game.date}</span>
                  <span className="font-medium text-gray-900">vs {game.opponent}</span>
                  {game.score && <span className="text-sm text-blue-600 font-mono">{game.score}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(game.id); }}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                  {expanded === game.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
              {expanded === game.id && (
                <div className="border-t px-4 py-3">
                  <GameDetail game={game} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
