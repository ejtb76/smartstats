import { useState, useCallback } from 'react';
import PhotoUpload from '../components/PhotoUpload';
import NotesField from '../components/NotesField';
import AnalysisResult from '../components/AnalysisResult';
import { apiFetch } from '../hooks/useApi';
import { addGame } from '../hooks/useGames';
import { Loader2, Camera } from 'lucide-react';
import type { PlayerGameStats } from '../types';

interface AnalysisData {
  opponent: string;
  score: string;
  date: string;
  players: PlayerGameStats[];
}

type Side = 'home' | 'away';

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [side, setSide] = useState<Side>('home');

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setSaved(false);
    setError('');
  }, []);

  const handleClear = useCallback(() => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setResult(null);
    setSaved(false);
    setError('');
  }, [preview]);

  function handleNewPhoto() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setResult(null);
    setSaved(false);
    setError('');
    setNotes('');
  }

  async function handleAnalyze() {
    if (!file) return;
    setAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('notes', notes);
      formData.append('side', side);

      const data = await apiFetch<AnalysisData>('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  function handleSave(data: AnalysisData) {
    setSaving(true);
    try {
      const rosterData = localStorage.getItem('smartstats-roster');
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

      addGame({
        date: data.date || new Date().toISOString().split('T')[0],
        opponent: data.opponent || 'Unknown',
        score: data.score,
        notes,
        side,
        playerStats,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900">Analyze Scoresheet</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Which side of the scoresheet?</label>
        <div className="flex gap-2">
          <button
            onClick={() => setSide('home')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              side === 'home'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Home (our batting)
          </button>
          <button
            onClick={() => setSide('away')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              side === 'away'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Away (opponent batting)
          </button>
        </div>
      </div>

      <PhotoUpload file={file} preview={preview} onFileSelect={handleFileSelect} onClear={handleClear} />

      <NotesField value={notes} onChange={setNotes} />

      {file && !result && (
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {analyzing && <Loader2 size={18} className="animate-spin" />}
          {analyzing ? 'Analyzing...' : 'Analyze Scoresheet'}
        </button>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {result && (
        <>
          <AnalysisResult data={result} onSave={handleSave} saving={saving} saved={saved} side={side} />
          <button
            onClick={handleNewPhoto}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            <Camera size={16} /> Analyze Another Photo
          </button>
        </>
      )}
    </div>
  );
}
