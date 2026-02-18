import type { Game } from '../types';

const STAT_KEYS = ['PA', 'AB', 'R', 'H', '2B', '3B', 'HR', 'BB', 'K', 'RBI'] as const;

export default function GameDetail({ game }: { game: Game }) {
  return (
    <div className="space-y-3">
      {game.notes && (
        <p className="text-sm text-gray-600 italic">Notes: {game.notes}</p>
      )}

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
            {game.playerStats.map((ps, i) => (
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
