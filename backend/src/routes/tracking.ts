import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../db/pool';

export const trackingRouter = Router();
trackingRouter.use(authMiddleware);

const toggleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты: YYYY-MM-DD'),
});

trackingRouter.post('/:habitId/toggle', async (req, res) => {
  try {
    const { habitId } = req.params;
    const parsed = toggleSchema.safeParse(req.body);
    const date = parsed.success ? parsed.data.date : new Date().toISOString().slice(0, 10);

    const habitCheck = await pool.query(
      'SELECT id FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, req.user!.userId]
    );
    if (habitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Привычка не найдена' });
    }

    const existing = await pool.query(
      'SELECT id FROM habit_completions WHERE habit_id = $1 AND completed_at = $2',
      [habitId, date]
    );

    const client = await pool.connect();
    try {
      if (existing.rows.length > 0) {
        await client.query(
          'DELETE FROM habit_completions WHERE habit_id = $1 AND completed_at = $2',
          [habitId, date]
        );
        await client.query(
          'UPDATE user_stats SET total_completions = total_completions - 1, updated_at = NOW() WHERE user_id = $1',
          [req.user!.userId]
        );
        return res.json({ completed: false, date });
      } else {
        await client.query(
          'INSERT INTO habit_completions (habit_id, completed_at) VALUES ($1, $2)',
          [habitId, date]
        );
        await client.query(
          'UPDATE user_stats SET total_completions = total_completions + 1, experience = experience + 10, updated_at = NOW() WHERE user_id = $1',
          [req.user!.userId]
        );
        const { checkAndAwardAchievements } = await import('../services/achievementService');
        await checkAndAwardAchievements(req.user!.userId);
        return res.json({ completed: true, date });
      }
    } finally {
      client.release();
    }
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

trackingRouter.get('/:habitId/calendar/:year/:month', async (req, res) => {
  try {
    const { habitId, year, month } = req.params;
    const habitCheck = await pool.query(
      'SELECT id FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, req.user!.userId]
    );
    if (habitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Привычка не найдена' });
    }

    const result = await pool.query(
      `SELECT completed_at::text as date FROM habit_completions
       WHERE habit_id = $1
         AND EXTRACT(YEAR FROM completed_at) = $2
         AND EXTRACT(MONTH FROM completed_at) = $3
       ORDER BY completed_at`,
      [habitId, year, month]
    );
    res.json(result.rows.map((r) => r.date));
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

trackingRouter.get('/:habitId/stats', async (req, res) => {
  try {
    const { habitId } = req.params;
    const habitCheck = await pool.query(
      'SELECT id FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, req.user!.userId]
    );
    if (habitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Привычка не найдена' });
    }

    const completions = await pool.query(
      `SELECT completed_at::text as date FROM habit_completions
       WHERE habit_id = $1
         AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY completed_at DESC`,
      [habitId]
    );

    const dates = new Set(completions.rows.map((r) => r.date));
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    let d = new Date(today);

    while (dates.has(d.toISOString().slice(0, 10))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }

    res.json({
      streak,
      history: completions.rows.map((r) => r.date),
      totalInPeriod: completions.rows.length,
    });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
