import { useState } from 'react';
import type { PlayerGameStats } from '../types';
import { Save, Check } from 'lucide-react';

interface AnalysisData {
  opponent: string;
  score: string;
  date: string;
  players: PlayerGameStats[];
}

interface Props {
  data: AnalysisData;
  onSave: (data: AnalysisData) => void;
  saving: boolean;
  saved: boolean;
}

const STAT_KEYS = ['PA', 'AB', 'R', 'H', '2B', '3B', 'HR', 'BB', 'K', 'RBI'] as const;

export default function AnalysisResult({ data, onSave, saving, saved }: Props) {
  const [editData, setEditData] = useState<AnalysisData>(data);

  function updatePlayer(index: number, field: string, value: string | number) {
    const players = [...editData.players];
    players[index] = { ...players[index], [field]: value };

    // Recalculate rate stats
    const p = players[index];
    p.AVG = p.AB > 0 ? Number((p.H / p.AB).toFixed(3)) : 0;
    p.OBP = (p.AB + p.BB) > 0 ? Number(((p.H + p.BB) / (p.AB + p.BB)).toFixed(3)) : 0;
    const totalBases = (p.H - p['2B'] - p['3B'] - p.HR) + (2 * p['2B']) + (3 * p['3B']) + (4 * p.HR);
    p.SLG = p.AB > 0 ? Number((totalBases / p.AB).toFixed(3)) : 0;

    setEditData({ ...editData, players });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
        <button
          onClick={() => onSave(editData)}
          disabled={saving || saved}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
        >
          {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Game'}</>}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <label className="block text-gray-500">Opponent</label>
          <input
            value={editData.opponent}
            onChange={e => setEditData({ ...editData, opponent: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 w-full"
          />
        </div>
        <div>
          <label className="block text-gray-500">Score</label>
          <input
            value={editData.score}
            onChange={e => setEditData({ ...editData, score: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 w-full"
          />
        </div>
        <div>
          <label className="block text-gray-500">Date</label>
          <input
            type="date"
            value={editData.date}
            onChange={e => setEditData({ ...editData, date: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 w-full"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
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
            {editData.players.map((player, i) => (
              <tr key={i} className={`border-t ${player.isSubstitute ? 'bg-yellow-50' : ''}`}>
                <td className="px-2 py-1 text-gray-500">{player.battingOrder}</td>
                <td className="px-2 py-1">
                  <span className="font-medium">{player.playerName}</span>
                  {player.isSubstitute && (
                    <span className="text-xs text-yellow-600 ml-1">(SUB)</span>
                  )}
                </td>
                {STAT_KEYS.map(key => (
                  <td key={key} className="text-center px-1 py-1">
                    <input
                      type="number"
                      min={0}
                      value={player[key]}
                      onChange={e => updatePlayer(i, key, parseInt(e.target.value) || 0)}
                      className="w-10 text-center border border-gray-200 rounded"
                    />
                  </td>
                ))}
                <td className="text-center px-2 py-1 font-mono">{player.AVG.toFixed(3)}</td>
                <td className="text-center px-2 py-1 font-mono">{player.OBP.toFixed(3)}</td>
                <td className="text-center px-2 py-1 font-mono">{player.SLG.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
