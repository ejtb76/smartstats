import { useMemo } from 'react';
import { loadGames } from '../hooks/useGames';
import type { SeasonPlayerStats } from '../types';

interface SlotDef {
  role: string;
  weights: { AVG: number; OBP: number; SLG: number; HRrate: number; RBIrate: number };
  justifyStat: string;
}

const SLOTS: SlotDef[] = [
  { role: 'Leadoff',         weights: { AVG: 0.3, OBP: 0.7, SLG: 0,   HRrate: 0,   RBIrate: 0   }, justifyStat: 'OBP' },
  { role: 'Contact',         weights: { AVG: 0.5, OBP: 0.5, SLG: 0,   HRrate: 0,   RBIrate: 0   }, justifyStat: 'AVG' },
  { role: 'Best Hitter',     weights: { AVG: 0.3, OBP: 0.3, SLG: 0.4, HRrate: 0,   RBIrate: 0   }, justifyStat: 'SLG' },
  { role: 'Cleanup',         weights: { AVG: 0,   OBP: 0,   SLG: 0.4, HRrate: 0.3, RBIrate: 0.3 }, justifyStat: 'SLG' },
  { role: 'Secondary Power', weights: { AVG: 0,   OBP: 0.1, SLG: 0.4, HRrate: 0.2, RBIrate: 0.3 }, justifyStat: 'RBI' },
  { role: 'Balanced',        weights: { AVG: 0.25,OBP: 0.25,SLG: 0.25,HRrate: 0.1, RBIrate: 0.15}, justifyStat: 'AVG' },
  { role: '7th',             weights: { AVG: 0.3, OBP: 0.3, SLG: 0.2, HRrate: 0.1, RBIrate: 0.1 }, justifyStat: 'OBP' },
  { role: '8th',             weights: { AVG: 0.3, OBP: 0.3, SLG: 0.2, HRrate: 0.1, RBIrate: 0.1 }, justifyStat: 'AVG' },
  { role: '9th',             weights: { AVG: 0.3, OBP: 0.3, SLG: 0.2, HRrate: 0.1, RBIrate: 0.1 }, justifyStat: 'OBP' },
];

function computeStats(): SeasonPlayerStats[] {
  const games = loadGames();
  const map = new Map<string, SeasonPlayerStats>();

  for (const game of games) {
    for (const ps of game.playerStats) {
      const key = ps.playerId || ps.playerName;
      const ex = map.get(key);
      if (ex) {
        ex.games += 1;
        ex.PA += ps.PA; ex.AB += ps.AB; ex.R += ps.R; ex.H += ps.H;
        ex['2B'] += ps['2B']; ex['3B'] += ps['3B']; ex.HR += ps.HR;
        ex.BB += ps.BB; ex.K += ps.K; ex.RBI += ps.RBI;
      } else {
        map.set(key, { ...ps, games: 1, AVG: 0, OBP: 0, SLG: 0 });
      }
    }
  }

  return Array.from(map.values()).map(s => {
    s.AVG = s.AB > 0 ? s.H / s.AB : 0;
    s.OBP = (s.AB + s.BB) > 0 ? (s.H + s.BB) / (s.AB + s.BB) : 0;
    const tb = (s.H - s['2B'] - s['3B'] - s.HR) + 2 * s['2B'] + 3 * s['3B'] + 4 * s.HR;
    s.SLG = s.AB > 0 ? tb / s.AB : 0;
    return s;
  });
}

function scorePlayer(p: SeasonPlayerStats, slot: SlotDef): number {
  const w = slot.weights;
  const hrRate = p.AB > 0 ? p.HR / p.AB : 0;
  const rbiRate = p.PA > 0 ? p.RBI / p.PA : 0;
  return w.AVG * p.AVG + w.OBP * p.OBP + w.SLG * p.SLG + w.HRrate * hrRate + w.RBIrate * rbiRate;
}

function formatJustification(p: SeasonPlayerStats, stat: string): string {
  switch (stat) {
    case 'OBP': return `OBP ${p.OBP.toFixed(3)}`;
    case 'AVG': return `AVG ${p.AVG.toFixed(3)}`;
    case 'SLG': return `SLG ${p.SLG.toFixed(3)}`;
    case 'RBI': return `${p.RBI} RBI`;
    default: return '';
  }
}

function buildOrder(players: SeasonPlayerStats[]) {
  const eligible = players.filter(p => p.AB >= 3);
  if (eligible.length < 9) return null;

  const assigned: { player: SeasonPlayerStats; slot: SlotDef }[] = [];
  const used = new Set<string>();

  for (const slot of SLOTS) {
    let bestScore = -1;
    let bestPlayer: SeasonPlayerStats | null = null;
    for (const p of eligible) {
      const key = p.playerId || p.playerName;
      if (used.has(key)) continue;
      const s = scorePlayer(p, slot);
      if (s > bestScore) { bestScore = s; bestPlayer = p; }
    }
    if (!bestPlayer) break;
    used.add(bestPlayer.playerId || bestPlayer.playerName);
    assigned.push({ player: bestPlayer, slot });
  }

  return assigned.length === 9 ? assigned : null;
}

export default function BattingOrder() {
  const order = useMemo(() => buildOrder(computeStats()), []);

  if (!order) return null;

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h3 className="text-lg font-bold text-gray-900">Recommended Batting Order</h3>
      <ol className="space-y-1.5">
        {order.map(({ player, slot }, i) => (
          <li key={player.playerId || i} className="flex items-baseline gap-2 text-sm">
            <span className="w-5 text-right font-bold text-gray-500">{i + 1}.</span>
            <span className="font-medium text-gray-900">{player.playerName}</span>
            <span className="text-gray-400">—</span>
            <span className="text-gray-600">{slot.role}</span>
            <span className="ml-auto font-mono text-xs text-gray-500">
              {formatJustification(player, slot.justifyStat)}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-gray-400 pt-1">
        Based on weighted scoring per lineup slot using AVG, OBP, SLG, HR-rate, and RBI-rate.
        Players with fewer than 3 at-bats are excluded.
      </p>
    </div>
  );
}
