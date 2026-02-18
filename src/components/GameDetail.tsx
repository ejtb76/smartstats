import { useState } from 'react';
import { Pencil, Save, Check, X } from 'lucide-react';
import { updateGame } from '../hooks/useGames';
import type { Game, PlayerGameStats } from '../types';

const STAT_KEYS = ['PA', 'AB', 'R', 'H', '2B', '3B', 'HR', 'BB', 'K', 'RBI'] as const;

function recalcRates(p: PlayerGameStats) {
  p.AVG = p.AB > 0 ? Number((p.H / p.AB).toFixed(3)) : 0;
  p.OBP = (p.AB + p.BB) > 0 ? Number(((p.H + p.BB) / (p.AB + p.BB)).toFixed(3)) : 0;
  const totalBases = (p.H - p['2B'] - p['3B'] - p.HR) + (2 * p['2B']) + (3 * p['3B']) + (4 * p.HR);
  p.SLG = p.AB > 0 ? Number((totalBases / p.AB).toFixed(3)) : 0;
}

function StatsTable({ players, label }: { players: PlayerGameStats[]; label: string }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{label}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-2 py-1 font-medium text-gray-700">#</th>
              <th className="text-left px-2 py-1 font-medium text-gray-700">Player</th>
              {STAT_KEYS.map(key => (
                <th key={key} className="text-center px-2 py-1 font-medium text-gray-700">{key}</th>
              ))}
              <th className="text-center px-2 py-1 font-medium text-gray-700">AVG</th>
              <th className="text-center px-2 py-1 font-medium text-gray-700">OBP</th>
              <th className="text-center px-2 py-1 font-medium text-gray-700">SLG</th>
            </tr>
          </thead>
          <tbody>
            {players.map((ps, i) => (
              <tr key={i} className={`border-t ${ps.isSubstitute ? 'bg-yellow-50' : ''}`}>
                <td className="px-2 py-1 text-gray-500">{ps.battingOrder}</td>
                <td className="px-2 py-1 font-medium">
                  {ps.playerName}
                  {ps.isSubstitute && <span className="text-xs text-yellow-600 ml-1">(SUB)</span>}
                </td>
                {STAT_KEYS.map(key => (
                  <td key={key} className="text-center px-2 py-1">{ps[key]}</td>
                ))}
                <td className="text-center px-2 py-1 font-mono">{ps.AVG.toFixed(3)}</td>
                <td className="text-center px-2 py-1 font-mono">{ps.OBP.toFixed(3)}</td>
                <td className="text-center px-2 py-1 font-mono">{ps.SLG.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditableStatsTable({ players, label, onChange }: {
  players: PlayerGameStats[];
  label: string;
  onChange: (players: PlayerGameStats[]) => void;
}) {
  function updatePlayer(index: number, field: string, value: string | number) {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    recalcRates(updated[index]);
    onChange(updated);
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{label}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-2 py-1 font-medium text-gray-700">#</th>
              <th className="text-left px-2 py-1 font-medium text-gray-700">Player</th>
              {STAT_KEYS.map(key => (
                <th key={key} className="text-center px-2 py-1 font-medium text-gray-700">{key}</th>
              ))}
              <th className="text-center px-2 py-1 font-medium text-gray-700">AVG</th>
              <th className="text-center px-2 py-1 font-medium text-gray-700">OBP</th>
              <th className="text-center px-2 py-1 font-medium text-gray-700">SLG</th>
            </tr>
          </thead>
          <tbody>
            {players.map((ps, i) => (
              <tr key={i} className={`border-t ${ps.isSubstitute ? 'bg-yellow-50' : ''}`}>
                <td className="px-2 py-1 text-gray-500">{ps.battingOrder}</td>
                <td className="px-2 py-1">
                  <span className="font-medium">{ps.playerName}</span>
                  {ps.isSubstitute && <span className="text-xs text-yellow-600 ml-1">(SUB)</span>}
                </td>
                {STAT_KEYS.map(key => (
                  <td key={key} className="text-center px-1 py-1">
                    <input
                      type="number"
                      min={0}
                      value={ps[key]}
                      onChange={e => updatePlayer(i, key, parseInt(e.target.value) || 0)}
                      className="w-10 text-center border border-gray-200 rounded"
                    />
                  </td>
                ))}
                <td className="text-center px-2 py-1 font-mono">{ps.AVG.toFixed(3)}</td>
                <td className="text-center px-2 py-1 font-mono">{ps.OBP.toFixed(3)}</td>
                <td className="text-center px-2 py-1 font-mono">{ps.SLG.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface Props {
  game: Game;
  onGameUpdated?: (game: Game) => void;
}

export default function GameDetail({ game, onGameUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [editGame, setEditGame] = useState<Game>(game);
  const [saved, setSaved] = useState(false);

  function startEdit() {
    setEditGame({ ...game, playerStats: game.playerStats.map(p => ({ ...p })), opponentStats: game.opponentStats?.map(p => ({ ...p })) });
    setEditing(true);
    setSaved(false);
  }

  function cancelEdit() {
    setEditing(false);
    setSaved(false);
  }

  function handleSave() {
    updateGame(editGame);
    setEditing(false);
    setSaved(true);
    onGameUpdated?.(editGame);
    setTimeout(() => setSaved(false), 2000);
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block text-gray-500">Opponent</label>
            <input
              value={editGame.opponent}
              onChange={e => setEditGame({ ...editGame, opponent: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block text-gray-500">Score</label>
            <input
              value={editGame.score || ''}
              onChange={e => setEditGame({ ...editGame, score: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block text-gray-500">Date</label>
            <input
              type="date"
              value={editGame.date}
              onChange={e => setEditGame({ ...editGame, date: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-500 text-sm mb-1">Notes</label>
          <textarea
            value={editGame.notes || ''}
            onChange={e => setEditGame({ ...editGame, notes: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
            rows={2}
          />
        </div>

        {editGame.playerStats.length > 0 && (
          <EditableStatsTable
            players={editGame.playerStats}
            label="Our Batting"
            onChange={playerStats => setEditGame({ ...editGame, playerStats })}
          />
        )}

        {editGame.opponentStats && editGame.opponentStats.length > 0 && (
          <EditableStatsTable
            players={editGame.opponentStats}
            label="Opponent Batting"
            onChange={opponentStats => setEditGame({ ...editGame, opponentStats })}
          />
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <Save size={14} /> Save Changes
          </button>
          <button
            onClick={cancelEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {game.notes && (
            <p className="text-sm text-gray-600 italic">Notes: {game.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> Saved</span>}
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Pencil size={14} /> Edit
          </button>
        </div>
      </div>

      {game.playerStats.length > 0 && (
        <StatsTable players={game.playerStats} label="Our Batting" />
      )}

      {game.opponentStats && game.opponentStats.length > 0 && (
        <StatsTable players={game.opponentStats} label="Opponent Batting" />
      )}
    </div>
  );
}
