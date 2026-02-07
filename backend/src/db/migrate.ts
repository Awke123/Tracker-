import 'dotenv/config';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './pool';

const MIGRATIONS_DIR = join(__dirname, 'migrations');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const name = file.replace('.sql', '');
    const result = await pool.query(
      'SELECT 1 FROM migrations WHERE name = $1',
      [name]
    );

    if (result.rows.length === 0) {
      console.log(`Running migration: ${file}`);
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
      await pool.query(sql);
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
      console.log(`Done: ${file}`);
    }
  }

  console.log('Migrations complete');
  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
