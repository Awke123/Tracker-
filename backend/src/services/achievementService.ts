import { pool } from '../db/pool';

export async function checkAndAwardAchievements(userId: number) {
  const client = await pool.connect();
  try {
    const habits = await client.query(
      'SELECT id FROM habits WHERE user_id = $1',
      [userId]
    );

    if (habits.rows.length >= 1) {
      await awardAchievement(client, userId, 'first_habit');
    }

    for (const h of habits.rows) {
      const completions = await client.query(
        `SELECT completed_at FROM habit_completions
         WHERE habit_id = $1
         ORDER BY completed_at DESC`,
        [h.id]
      );

      const total = completions.rows.length;
      if (total >= 10) await awardAchievement(client, userId, 'completions_10');
      if (total >= 50) await awardAchievement(client, userId, 'completions_50');

      let streak = 0;
      const dates = new Set(completions.rows.map((r) => r.completed_at.toISOString().slice(0, 10)));
      const today = new Date().toISOString().slice(0, 10);
      let d = new Date(today);
      while (dates.has(d.toISOString().slice(0, 10))) {
        streak++;
        d.setDate(d.getDate() - 1);
      }
      if (streak >= 7) await awardAchievement(client, userId, 'streak_7');
      if (streak >= 30) await awardAchievement(client, userId, 'streak_30');
    }

    const totalCompletions = await client.query(
      'SELECT total_completions FROM user_stats WHERE user_id = $1',
      [userId]
    );
    const total = totalCompletions.rows[0]?.total_completions ?? 0;
    if (total >= 10) await awardAchievement(client, userId, 'completions_10');
    if (total >= 50) await awardAchievement(client, userId, 'completions_50');
  } finally {
    client.release();
  }
}

async function awardAchievement(
  client: { query: (a: string, b: unknown[]) => Promise<{ rows: { length: number } }> },
  userId: number,
  code: string
) {
  const ach = await client.query<{ id: number }>('SELECT id FROM achievements WHERE code = $1', [code]);
  if (ach.rows.length === 0) return;
  await client.query(
    `INSERT INTO user_achievements (user_id, achievement_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userId, ach.rows[0].id]
  );
}
