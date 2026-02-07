import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../db/pool';

const XP_PER_LEVEL = 100;
const LEVEL_MULTIPLIER = 1.5;

export const gamificationRouter = Router();
gamificationRouter.use(authMiddleware);

function xpToReachLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(XP_PER_LEVEL * (Math.pow(LEVEL_MULTIPLIER, level - 1) - 1) / (LEVEL_MULTIPLIER - 1));
}

function levelFromExperience(exp: number): number {
  let lvl = 1;
  while (xpToReachLevel(lvl + 1) <= exp) lvl++;
  return lvl;
}

gamificationRouter.get('/profile', async (req, res) => {
  try {
    const stats = await pool.query(
      `SELECT us.experience, us.total_completions
       FROM user_stats us
       WHERE us.user_id = $1`,
      [req.user!.userId]
    );

    const achievements = await pool.query(
      `SELECT a.code, a.title, a.description, a.icon, ua.earned_at
       FROM user_achievements ua
       JOIN achievements a ON a.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.earned_at DESC`,
      [req.user!.userId]
    );

    const experience = stats.rows[0]?.experience ?? 0;
    const level = levelFromExperience(experience);
    const xpCurrent = xpToReachLevel(level);
    const xpNext = xpToReachLevel(level + 1);
    const xpInLevel = experience - xpCurrent;
    const xpNeededForLevel = xpNext - xpCurrent;
    const progress = xpNeededForLevel > 0 ? Math.min(100, (xpInLevel / xpNeededForLevel) * 100) : 0;

    res.json({
      level,
      experience,
      totalCompletions: stats.rows[0]?.total_completions ?? 0,
      xpToNextLevel: Math.max(0, xpNeededForLevel - xpInLevel),
      progressPercent: Math.round(progress),
      achievements: achievements.rows,
    });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

gamificationRouter.get('/achievements', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, ua.earned_at IS NOT NULL as earned, ua.earned_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = $1
       ORDER BY a.requirement`,
      [req.user!.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
