import { Router } from 'express';
import { readJSON } from '../utils/storage.js';
import type { Game, SeasonPlayerStats } from '../../src/types/index.js';

const router = Router();

router.get('/', (_req, res) => {
  const games = readJSON<Game[]>('games.json');
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

  // Calculate rate stats
  const stats = Array.from(statsMap.values()).map(s => {
    s.AVG = s.AB > 0 ? Number((s.H / s.AB).toFixed(3)) : 0;
    s.OBP = (s.AB + s.BB) > 0 ? Number(((s.H + s.BB) / (s.AB + s.BB)).toFixed(3)) : 0;
    const totalBases = (s.H - s['2B'] - s['3B'] - s.HR) + (2 * s['2B']) + (3 * s['3B']) + (4 * s.HR);
    s.SLG = s.AB > 0 ? Number((totalBases / s.AB).toFixed(3)) : 0;
    return s;
  });

  stats.sort((a, b) => b.AVG - a.AVG);
  res.json(stats);
});

export default router;
