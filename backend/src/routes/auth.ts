import { Router } from 'express';
import { z } from 'zod';
import { authenticateWithTelegram } from '../services/authService';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../db/pool';

export const authRouter = Router();

const authSchema = z.object({
  initData: z.string().min(1, 'initData обязателен'),
});

authRouter.post('/telegram', async (req, res) => {
  try {
    const { initData } = authSchema.parse(req.body);
    const result = await authenticateWithTelegram(initData);
    res.json(result);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: err.errors,
      });
    }
    if (err instanceof Error) {
      return res.status(401).json({ error: err.message });
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

authRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name, u.photo_url,
              s.level, s.experience, s.total_completions
       FROM users u
       LEFT JOIN user_stats s ON s.user_id = u.id
       WHERE u.id = $1`,
      [req.user!.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
