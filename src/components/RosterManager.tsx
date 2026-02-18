import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { apiFetch } from '../hooks/useApi';
import type { Player } from '../types';

const STORAGE_KEY = 'smartstats-roster';

function loadRoster(): Player[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveRoster(players: Player[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  // Sync to server in background so the analyzer can use it
  apiFetch('/api/roster/sync', {
    method: 'PUT',
    body: JSON.stringify(players),
  }).catch(() => {});
}

export default function RosterManager() {
  const [players, setPlayers] = useState<Player[]>(loadRoster);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', number: '', position: '' });

  // On mount, if localStorage is empty but server has data, pull from server
  useEffect(() => {
    if (players.length === 0) {
      apiFetch<Player[]>('/api/roster').then(serverPlayers => {
        if (serverPlayers.length > 0) {
          setPlayers(serverPlayers);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverPlayers));
        }
      }).catch(() => {});
    }
  }, []);

  function updatePlayers(next: Player[]) {
    setPlayers(next);
    saveRoster(next);
  }

  function handleAdd() {
    if (!form.firstName.trim()) return;
    const player: Player = {
      id: crypto.randomUUID(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || undefined,
      number: form.number.trim() || undefined,
      position: form.position.trim() || undefined,
    };
    updatePlayers([...players, player]);
    setForm({ firstName: '', lastName: '', number: '', position: '' });
  }

  function handleUpdate(id: string) {
    const next = players.map(p => p.id === id ? {
      ...p,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || undefined,
      number: form.number.trim() || undefined,
      position: form.position.trim() || undefined,
    } : p);
    updatePlayers(next);
    setEditing(null);
  }

  function handleDelete(id: string) {
    updatePlayers(players.filter(p => p.id !== id));
  }

  function startEdit(player: Player) {
    setEditing(player.id);
    setForm({
      firstName: player.firstName,
      lastName: player.lastName || '',
      number: player.number || '',
      position: player.position || '',
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Roster</h2>
        <p className="text-sm text-gray-500">Add player names to help the analyzer match names on scoresheets. First names are usually what appears on the scorecard.</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg flex items-end gap-3 flex-wrap">
        <div className="w-40">
          <label className="block text-xs text-gray-600 mb-1">First name *</label>
          <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
            className="w-full border rounded px-2 py-1 text-sm" placeholder="e.g. Albert"
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <div className="w-40">
          <label className="block text-xs text-gray-600 mb-1">Last name</label>
          <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
            className="w-full border rounded px-2 py-1 text-sm" placeholder="e.g. van Asten"
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <div className="w-16">
          <label className="block text-xs text-gray-600 mb-1">#</label>
          <input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })}
            className="w-full border rounded px-2 py-1 text-sm" placeholder="#"
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <div className="w-20">
          <label className="block text-xs text-gray-600 mb-1">Position</label>
          <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
            className="w-full border rounded px-2 py-1 text-sm" placeholder="Pos"
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> Add Player
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y">
        {players.length === 0 && (
          <p className="p-4 text-gray-500 text-sm">No players in roster yet. Add players so the analyzer can match names on scoresheets.</p>
        )}
        {players.map(player => (
          <div key={player.id} className="flex items-center px-4 py-3">
            {editing === player.id ? (
              <>
                <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                  className="w-32 border rounded px-2 py-1 text-sm mr-2" placeholder="First name" autoFocus />
                <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                  className="w-32 border rounded px-2 py-1 text-sm mr-2" placeholder="Last name" />
                <input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })}
                  className="w-14 border rounded px-2 py-1 text-sm mr-2" placeholder="#" />
                <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                  className="w-16 border rounded px-2 py-1 text-sm mr-2" placeholder="Pos" />
                <button onClick={() => handleUpdate(player.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                <button onClick={() => setEditing(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{player.firstName}</span>
                  {player.lastName && <span className="text-gray-600 ml-1">{player.lastName}</span>}
                  {player.number && <span className="text-gray-400 ml-2">#{player.number}</span>}
                  {player.position && <span className="text-gray-400 ml-2 text-sm">{player.position}</span>}
                </div>
                <button onClick={() => startEdit(player)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil size={16} /></button>
                <button onClick={() => handleDelete(player.id)} className="p-1 text-gray-400 hover:text-red-600 rounded ml-1"><Trash2 size={16} /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
