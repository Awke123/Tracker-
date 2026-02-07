import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { pool, runMigrations } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { habitId: string; year: string; month: string } }
) {
  try {
    const user = requireAuth(req);
    await runMigrations();
    const { habitId, year, month } = params;

    const habitCheck = await pool.query('SELECT id FROM habits WHERE id = $1 AND user_id = $2', [habitId, user.userId]);
    if (habitCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Привычка не найдена' }, { status: 404 });
    }

    const result = await pool.query(
      `SELECT completed_at::text as date FROM habit_completions
       WHERE habit_id = $1 AND EXTRACT(YEAR FROM completed_at) = $2 AND EXTRACT(MONTH FROM completed_at) = $3
       ORDER BY completed_at`,
      [habitId, year, month]
    );
    return NextResponse.json(result.rows.map((r) => r.date));
  } catch (err) {
    if (err instanceof Error && err.message === 'Требуется авторизация') {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
