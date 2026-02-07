import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { pool, runMigrations } from '@/lib/db';

const XP_PER_LEVEL = 100;
const LEVEL_MULTIPLIER = 1.5;

function xpToReachLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor((XP_PER_LEVEL * (Math.pow(LEVEL_MULTIPLIER, level - 1) - 1)) / (LEVEL_MULTIPLIER - 1));
}

function levelFromExperience(exp: number): number {
  let lvl = 1;
  while (xpToReachLevel(lvl + 1) <= exp) lvl++;
  return lvl;
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    await runMigrations();

    const stats = await pool.query(
      'SELECT us.experience, us.total_completions FROM user_stats us WHERE us.user_id = $1',
      [user.userId]
    );
    const achievements = await pool.query(
      `SELECT a.code, a.title, a.description, a.icon, ua.earned_at
       FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id
       WHERE ua.user_id = $1 ORDER BY ua.earned_at DESC`,
      [user.userId]
    );

    const experience = stats.rows[0]?.experience ?? 0;
    const level = levelFromExperience(experience);
    const xpCurrent = xpToReachLevel(level);
    const xpNext = xpToReachLevel(level + 1);
    const xpInLevel = experience - xpCurrent;
    const xpNeededForLevel = xpNext - xpCurrent;
    const progress = xpNeededForLevel > 0 ? Math.min(100, (xpInLevel / xpNeededForLevel) * 100) : 0;

    return NextResponse.json({
      level,
      experience,
      totalCompletions: stats.rows[0]?.total_completions ?? 0,
      xpToNextLevel: Math.max(0, xpNeededForLevel - xpInLevel),
      progressPercent: Math.round(progress),
      achievements: achievements.rows,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Требуется авторизация') {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
