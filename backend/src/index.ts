import dotenv from 'dotenv';
import { join } from 'path';
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

import express from 'express';
import cors from 'cors';
import { readdirSync, readFileSync } from 'fs';
import { pool } from './db/pool';
import { authRouter } from './routes/auth';
import { habitsRouter } from './routes/habits';
import { trackingRouter } from './routes/tracking';
import { gamificationRouter } from './routes/gamification';
import { startNotificationScheduler } from './services/notificationScheduler';

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const dir = join(__dirname, 'db', 'migrations');
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const name = file.replace('.sql', '');
      const r = await pool.query('SELECT 1 FROM migrations WHERE name = $1', [name]);
      if (r.rows.length === 0) {
        const sql = readFileSync(join(dir, file), 'utf-8');
        await pool.query(sql);
        await pool.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
      }
    }
  } catch (e) {
    console.warn('Migrations dir not found, skipping');
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/gamification', gamificationRouter);

runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startNotificationScheduler();
  });
}).catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
