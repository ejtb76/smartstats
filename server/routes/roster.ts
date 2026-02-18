import { Router } from 'express';
import { readJSON, writeJSON } from '../utils/storage.js';
import type { Player } from '../../src/types/index.js';

const router = Router();

router.get('/', (_req, res) => {
  const roster = readJSON<Player[]>('roster.json');
  res.json(roster);
});

router.post('/', (req, res) => {
  const roster = readJSON<Player[]>('roster.json');
  const player: Player = {
    id: crypto.randomUUID(),
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    number: req.body.number,
    position: req.body.position,
  };
  roster.push(player);
  writeJSON('roster.json', roster);
  res.status(201).json(player);
});

router.put('/:id', (req, res) => {
  const roster = readJSON<Player[]>('roster.json');
  const index = roster.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  roster[index] = { ...roster[index], ...req.body, id: req.params.id };
  writeJSON('roster.json', roster);
  res.json(roster[index]);
});

router.delete('/:id', (req, res) => {
  let roster = readJSON<Player[]>('roster.json');
  roster = roster.filter(p => p.id !== req.params.id);
  writeJSON('roster.json', roster);
  res.status(204).send();
});

export default router;
