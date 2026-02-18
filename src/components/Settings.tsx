import { useState } from 'react';
import { Key, Check, Plus, Pencil, Trash2, X, Users } from 'lucide-react';
import { loadTeams, createTeam, renameTeam, deleteTeam } from '../hooks/useTeam';
import type { Team } from '../types';

export default function Settings() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('smartstats-api-key') || '');
  const [saved, setSaved] = useState(false);
  const [teams, setTeams] = useState<Team[]>(loadTeams);
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  function handleSave() {
    localStorage.setItem('smartstats-api-key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    localStorage.removeItem('smartstats-api-key');
    setApiKey('');
  }

  function handleCreateTeam() {
    if (!newTeamName.trim()) return;
    createTeam(newTeamName.trim());
    setTeams(loadTeams());
    setNewTeamName('');
  }

  function handleRenameTeam(id: string) {
    if (!editName.trim()) return;
    renameTeam(id, editName.trim());
    setTeams(loadTeams());
    setEditingTeam(null);
  }

  function handleDeleteTeam(id: string) {
    if (teams.length <= 1) return;
    deleteTeam(id);
    setTeams(loadTeams());
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-bold text-gray-900">Settings</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Users size={18} />
          <h3 className="font-medium">Teams</h3>
        </div>

        <p className="text-sm text-gray-500">
          Manage your teams. Each team has its own roster and game history.
        </p>

        <div className="divide-y border rounded-lg">
          {teams.map(team => (
            <div key={team.id} className="flex items-center px-3 py-2 gap-2">
              {editingTeam === team.id ? (
                <>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRenameTeam(team.id)}
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    autoFocus
                  />
                  <button onClick={() => handleRenameTeam(team.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                  <button onClick={() => setEditingTeam(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-gray-900">{team.name}</span>
                  <button
                    onClick={() => { setEditingTeam(team.id); setEditName(team.name); }}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  >
                    <Pencil size={14} />
                  </button>
                  {teams.length > 1 && (
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
            placeholder="New team name"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button
            onClick={handleCreateTeam}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Key size={18} />
          <h3 className="font-medium">Anthropic API Key</h3>
        </div>

        <p className="text-sm text-gray-500">
          The server uses the ANTHROPIC_API_KEY environment variable by default.
          Set a key here as a fallback if the env var is not configured.
        </p>

        <input
          type="password"
          value={apiKey}
          onChange={e => { setApiKey(e.target.value); setSaved(false); }}
          placeholder="sk-ant-..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
          >
            {saved ? <><Check size={14} /> Saved</> : 'Save Key'}
          </button>
          {apiKey && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-red-600 border border-red-200 rounded text-sm hover:bg-red-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
