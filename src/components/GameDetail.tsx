import { useState, useCallback } from 'react';
import { Pencil, Save, Check, X, Trash2, Camera, Loader2 } from 'lucide-react';
import { updateGame } from '../hooks/useGames';
import { apiFetch } from '../hooks/useApi';
import { ensureActiveTeam } from '../hooks/useTeam';
import PhotoUpload from './PhotoUpload';
import AnalysisResult from './AnalysisResult';
import type { Game, PlayerGameStats } from '../types';

interface AnalysisData {
  opponent: string;
  score: string;
  date: string;
  players: PlayerGameStats[];
}

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

  function removePlayer(index: number) {
    onChange(players.filter((_, i) => i !== index));
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
              <th className="px-1 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {players.map((ps, i) => (
              <tr key={i} className={`border-t ${ps.isSubstitute ? 'bg-yellow-50' : ''}`}>
                <td className="px-2 py-1 text-gray-500">{ps.battingOrder}</td>
                <td className="px-2 py-1">
                  <input
                    value={ps.playerName}
                    onChange={e => updatePlayer(i, 'playerName', e.target.value)}
                    className="w-32 border border-gray-200 rounded px-1 py-0.5 text-sm font-medium"
                  />
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
                <td className="px-1 py-1">
                  <button onClick={() => removePlayer(i)} className="p-0.5 text-gray-400 hover:text-red-600 rounded">
                    <Trash2 size={14} />
                  </button>
                </td>
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

  // Re-analyze state
  const [reanalyzing, setReanalyzing] = useState(false);
  const [raFile, setRaFile] = useState<File | null>(null);
  const [raPreview, setRaPreview] = useState<string | null>(null);
  const [raNotes, setRaNotes] = useState(game.notes || '');
  const [raAnalyzing, setRaAnalyzing] = useState(false);
  const [raResult, setRaResult] = useState<AnalysisData | null>(null);
  const [raError, setRaError] = useState('');
  const [raSaving, setRaSaving] = useState(false);
  const [raSaved, setRaSaved] = useState(false);

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

  // Re-analyze handlers
  function startReanalyze() {
    setReanalyzing(true);
    setRaFile(null);
    setRaPreview(null);
    setRaNotes(game.notes || '');
    setRaResult(null);
    setRaError('');
    setRaSaved(false);
  }

  function cancelReanalyze() {
    if (raPreview) URL.revokeObjectURL(raPreview);
    setReanalyzing(false);
    setRaFile(null);
    setRaPreview(null);
    setRaResult(null);
    setRaError('');
    setRaSaved(false);
  }

  const handleRaFileSelect = useCallback((f: File) => {
    setRaFile(f);
    setRaPreview(URL.createObjectURL(f));
    setRaResult(null);
    setRaSaved(false);
    setRaError('');
  }, []);

  const handleRaClear = useCallback(() => {
    setRaFile(null);
    if (raPreview) URL.revokeObjectURL(raPreview);
    setRaPreview(null);
    setRaResult(null);
    setRaError('');
  }, [raPreview]);

  async function handleRaAnalyze() {
    if (!raFile) return;
    setRaAnalyzing(true);
    setRaError('');

    try {
      const formData = new FormData();
      formData.append('photo', raFile);
      formData.append('notes', raNotes);
      formData.append('side', 'home');
      const rosterData = localStorage.getItem(`smartstats-roster-${ensureActiveTeam()}`);
      if (rosterData) formData.append('roster', rosterData);

      const data = await apiFetch<AnalysisData>('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      setRaResult(data);
    } catch (err) {
      setRaError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setRaAnalyzing(false);
    }
  }

  function handleRaSave(data: AnalysisData) {
    setRaSaving(true);
    try {
      const rosterData = localStorage.getItem(`smartstats-roster-${ensureActiveTeam()}`);
      const rosterPlayers: { id: string; firstName: string; lastName?: string }[] = rosterData ? JSON.parse(rosterData) : [];
      const playerStats = data.players.map(p => {
        const nameLower = p.playerName.toLowerCase();
        const rosterMatch = rosterPlayers.find(rp => {
          const first = rp.firstName.toLowerCase();
          const full = rp.lastName ? `${rp.firstName} ${rp.lastName}`.toLowerCase() : first;
          const reversed = rp.lastName ? `${rp.lastName} ${rp.firstName}`.toLowerCase() : first;
          return nameLower === first || nameLower === full || nameLower === reversed || nameLower.includes(first);
        });
        return {
          ...p,
          playerId: rosterMatch?.id || p.playerName.toLowerCase().replace(/\s+/g, '-'),
        };
      });

      const updatedGame: Game = {
        ...game,
        opponent: data.opponent || game.opponent,
        score: data.score || game.score,
        date: data.date || game.date,
        notes: raNotes,
        playerStats,
      };
      updateGame(updatedGame);
      setRaSaved(true);
      onGameUpdated?.(updatedGame);
      setTimeout(() => {
        cancelReanalyze();
      }, 1500);
    } catch (err) {
      setRaError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setRaSaving(false);
    }
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
            onClick={startReanalyze}
            disabled={reanalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Camera size={14} /> Re-analyze
          </button>
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Pencil size={14} /> Edit
          </button>
        </div>
      </div>

      {reanalyzing && (
        <div className="space-y-4 border border-blue-200 bg-blue-50/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">Re-analyze Scoresheet</h4>
            <button
              onClick={cancelReanalyze}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X size={14} /> Cancel
            </button>
          </div>

          {!raResult && (
            <>
              <PhotoUpload file={raFile} preview={raPreview} onFileSelect={handleRaFileSelect} onClear={handleRaClear} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={raNotes}
                  onChange={e => setRaNotes(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                  rows={2}
                  placeholder="Any notes for the analysis..."
                />
              </div>

              {raFile && (
                <button
                  onClick={handleRaAnalyze}
                  disabled={raAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {raAnalyzing && <Loader2 size={16} className="animate-spin" />}
                  {raAnalyzing ? 'Analyzing...' : 'Analyze'}
                </button>
              )}
            </>
          )}

          {raError && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{raError}</div>
          )}

          {raResult && (
            <AnalysisResult data={raResult} onSave={handleRaSave} saving={raSaving} saved={raSaved} side="home" />
          )}
        </div>
      )}

      {game.playerStats.length > 0 && (
        <StatsTable players={game.playerStats} label="Our Batting" />
      )}

      {game.opponentStats && game.opponentStats.length > 0 && (
        <StatsTable players={game.opponentStats} label="Opponent Batting" />
      )}
    </div>
  );
}
