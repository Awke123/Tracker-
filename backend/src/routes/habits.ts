import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createHabitSchema } from '../validators/habits';
import { pool } from '../db/pool';

export const habitsRouter = Router();
habitsRouter.use(authMiddleware);

habitsRouter.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.*, 
        (SELECT COUNT(*) FROM habit_completions WHERE habit_id = h.id) as completions_count,
        (SELECT MAX(completed_at) FROM habit_completions WHERE habit_id = h.id) as last_completed
       FROM habits h
       WHERE h.user_id = $1
       ORDER BY h.created_at DESC`,
      [req.user!.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

habitsRouter.post('/', validate(createHabitSchema), async (req, res) => {
  try {
    const { title, description, emoji, goal_days } = req.body;
    const result = await pool.query(
      `INSERT INTO habits (user_id, title, description, emoji, goal_days)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user!.userId, title, description || null, emoji || '📌', goal_days || 30]
    );
    const { checkAndAwardAchievements } = await import('../services/achievementService');
    await checkAndAwardAchievements(req.user!.userId);
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

habitsRouter.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.*, 
        (SELECT COUNT(*) FROM habit_completions WHERE habit_id = h.id) as completions_count,
        (SELECT MAX(completed_at) FROM habit_completions WHERE habit_id = h.id) as last_completed
       FROM habits h
       WHERE h.id = $1 AND h.user_id = $2`,
      [req.params.id, req.user!.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Привычка не найдена' });
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

habitsRouter.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Привычка не найдена' });
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
