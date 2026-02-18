import { useState } from 'react';
import { Key, Check } from 'lucide-react';

export default function Settings() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('smartstats-api-key') || '');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem('smartstats-api-key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    localStorage.removeItem('smartstats-api-key');
    setApiKey('');
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-bold text-gray-900">Settings</h2>

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
