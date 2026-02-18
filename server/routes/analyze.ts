import { Router } from 'express';
import multer from 'multer';
import { analyzeScoresheet } from '../utils/anthropic.js';
import { readJSON } from '../utils/storage.js';
import type { Player } from '../../src/types/index.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No photo uploaded' });
      return;
    }

    const notes = req.body.notes || '';
    const apiKey = req.headers['x-api-key'] as string || process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === 'your-api-key-here') {
      res.status(400).json({ error: 'No API key configured. Set ANTHROPIC_API_KEY in .env or provide via Settings.' });
      return;
    }

    const roster = readJSON<Player[]>('roster.json');
    const imageBase64 = file.buffer.toString('base64');
    const mimeType = file.mimetype;

    const result = await analyzeScoresheet(imageBase64, mimeType, roster, notes, apiKey);

    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    res.status(500).json({ error: message });
  }
});

export default router;
