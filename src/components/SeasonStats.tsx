import { useState, useMemo } from 'react';
import { loadGames } from '../hooks/useGames';
import type { SeasonPlayerStats } from '../types';

type SortKey = keyof SeasonPlayerStats;

function computeSeasonStats(): SeasonPlayerStats[] {
  const games = loadGames();
  const statsMap = new Map<string, SeasonPlayerStats>();

  for (const game of games) {
    for (const ps of game.playerStats) {
      const key = ps.playerId || ps.playerName;
      const existing = statsMap.get(key);

      if (existing) {
        existing.games += 1;
        existing.PA += ps.PA;
        existing.AB += ps.AB;
        existing.R += ps.R;
        existing.H += ps.H;
        existing['2B'] += ps['2B'];
        existing['3B'] += ps['3B'];
        existing.HR += ps.HR;
        existing.BB += ps.BB;
        existing.K += ps.K;
        existing.RBI += ps.RBI;
      } else {
        statsMap.set(key, {
          playerId: ps.playerId,
          playerName: ps.playerName,
          games: 1,
          PA: ps.PA,
          AB: ps.AB,
          R: ps.R,
          H: ps.H,
          '2B': ps['2B'],
          '3B': ps['3B'],
          HR: ps.HR,
          BB: ps.BB,
          K: ps.K,
          RBI: ps.RBI,
          AVG: 0,
          OBP: 0,
          SLG: 0,
        });
      }
    }
  }

  return Array.from(statsMap.values()).map(s => {
    s.AVG = s.AB > 0 ? Number((s.H / s.AB).toFixed(3)) : 0;
    s.OBP = (s.AB + s.BB) > 0 ? Number(((s.H + s.BB) / (s.AB + s.BB)).toFixed(3)) : 0;
    const totalBases = (s.H - s['2B'] - s['3B'] - s.HR) + (2 * s['2B']) + (3 * s['3B']) + (4 * s.HR);
    s.SLG = s.AB > 0 ? Number((totalBases / s.AB).toFixed(3)) : 0;
    return s;
  });
}

export default function SeasonStats() {
  const stats = useMemo(computeSeasonStats, []);
  const [sortKey, setSortKey] = useState<SortKey>('AVG');
  const [sortAsc, setSortAsc] = useState(false);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sorted = [...stats].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const columns: { key: SortKey; label: string }[] = [
    { key: 'playerName', label: 'Player' },
    { key: 'games', label: 'G' },
    { key: 'PA', label: 'PA' },
    { key: 'AB', label: 'AB' },
    { key: 'R', label: 'R' },
    { key: 'H', label: 'H' },
    { key: '2B', label: '2B' },
    { key: '3B', label: '3B' },
    { key: 'HR', label: 'HR' },
    { key: 'BB', label: 'BB' },
    { key: 'K', label: 'K' },
    { key: 'RBI', label: 'RBI' },
    { key: 'AVG', label: 'AVG' },
    { key: 'OBP', label: 'OBP' },
    { key: 'SLG', label: 'SLG' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Season Statistics</h2>

      {stats.length === 0 ? (
        <p className="text-gray-500 text-sm">No game data yet. Analyze scoresheets to build statistics.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-2 py-2 font-medium cursor-pointer hover:bg-gray-200 ${
                      col.key === 'playerName' ? 'text-left' : 'text-center'
                    } ${sortKey === col.key ? 'text-blue-700' : 'text-gray-700'}`}
                  >
                    {col.label} {sortKey === col.key && (sortAsc ? '↑' : '↓')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(player => (
                <tr key={player.playerId} className="border-t hover:bg-gray-50">
                  <td className="px-2 py-2 font-medium">{player.playerName}</td>
                  <td className="text-center px-2 py-2">{player.games}</td>
                  <td className="text-center px-2 py-2">{player.PA}</td>
                  <td className="text-center px-2 py-2">{player.AB}</td>
                  <td className="text-center px-2 py-2">{player.R}</td>
                  <td className="text-center px-2 py-2">{player.H}</td>
                  <td className="text-center px-2 py-2">{player['2B']}</td>
                  <td className="text-center px-2 py-2">{player['3B']}</td>
                  <td className="text-center px-2 py-2">{player.HR}</td>
                  <td className="text-center px-2 py-2">{player.BB}</td>
                  <td className="text-center px-2 py-2">{player.K}</td>
                  <td className="text-center px-2 py-2">{player.RBI}</td>
                  <td className="text-center px-2 py-2 font-mono">{player.AVG.toFixed(3)}</td>
                  <td className="text-center px-2 py-2 font-mono">{player.OBP.toFixed(3)}</td>
                  <td className="text-center px-2 py-2 font-mono">{player.SLG.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
