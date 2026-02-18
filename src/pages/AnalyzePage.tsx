import { useState, useCallback } from 'react';
import PhotoUpload from '../components/PhotoUpload';
import NotesField from '../components/NotesField';
import AnalysisResult from '../components/AnalysisResult';
import { apiFetch } from '../hooks/useApi';
import { Loader2 } from 'lucide-react';
import type { PlayerGameStats } from '../types';

interface AnalysisData {
  opponent: string;
  score: string;
  date: string;
  players: PlayerGameStats[];
}

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  async function handleAnalyze() {
    if (!file) return;
    setAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('notes', notes);

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

  async function handleSave(data: AnalysisData) {
    setSaving(true);
    try {
      // Match players against roster by first name and assign IDs
      const rosterPlayers = await apiFetch<{ id: string; firstName: string; lastName?: string }[]>('/api/roster');
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

      await apiFetch('/api/games', {
        method: 'POST',
        body: JSON.stringify({
          date: data.date || new Date().toISOString().split('T')[0],
          opponent: data.opponent || 'Unknown',
          score: data.score,
          notes,
          playerStats,
        }),
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
        <AnalysisResult data={result} onSave={handleSave} saving={saving} saved={saved} />
      )}
    </div>
  );
}
