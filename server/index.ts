import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import analyzeRouter from './routes/analyze.js';
import rosterRouter from './routes/roster.js';
import gamesRouter from './routes/games.js';
import statsRouter from './routes/stats.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/analyze', analyzeRouter);
app.use('/api/roster', rosterRouter);
app.use('/api/games', gamesRouter);
app.use('/api/stats', statsRouter);

// Serve static frontend in production
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Serving static files from: ${distPath}`);
});
