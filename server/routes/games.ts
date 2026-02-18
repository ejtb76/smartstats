import { Router } from 'express';
import { readJSON, writeJSON } from '../utils/storage.js';
import type { Game } from '../../src/types/index.js';

const router = Router();

router.get('/', (_req, res) => {
  const games = readJSON<Game[]>('games.json');
  // Return without rawImageBase64 for list view
  const summary = games.map(({ rawImageBase64: _, ...rest }) => rest);
  res.json(summary);
});

router.get('/:id', (req, res) => {
  const games = readJSON<Game[]>('games.json');
  const game = games.find(g => g.id === req.params.id);
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  res.json(game);
});

router.post('/', (req, res) => {
  const games = readJSON<Game[]>('games.json');
  const game: Game = {
    id: crypto.randomUUID(),
    date: req.body.date || new Date().toISOString().split('T')[0],
    opponent: req.body.opponent || 'Unknown',
    score: req.body.score,
    notes: req.body.notes || '',
    playerStats: req.body.playerStats || [],
    rawImageBase64: req.body.rawImageBase64,
    createdAt: new Date().toISOString(),
  };
  games.push(game);
  writeJSON('games.json', games);
  res.status(201).json(game);
});

router.delete('/:id', (req, res) => {
  let games = readJSON<Game[]>('games.json');
  games = games.filter(g => g.id !== req.params.id);
  writeJSON('games.json', games);
  res.status(204).send();
});

export default router;
