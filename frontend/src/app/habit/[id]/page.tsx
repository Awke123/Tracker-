'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { habitsApi, trackingApi, Habit } from '@/lib/api';

export default function HabitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [habit, setHabit] = useState<Habit | null>(null);
  const [stats, setStats] = useState<{ streak: number; history: string[]; totalInPeriod?: number } | null>(null);
  const [calendar, setCalendar] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    if (!id) return;
    Promise.all([
      habitsApi.get(id),
      trackingApi.stats(id),
      trackingApi.calendar(id, year, month),
    ])
      .then(([h, s, c]) => {
        setHabit(h);
        setStats(s);
        setCalendar(c);
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id, year, month, router]);

  const today = new Date().toISOString().slice(0, 10);
  const isTodayDone = stats?.history?.includes(today);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await trackingApi.toggle(id, today);
      setStats((s) =>
        s
          ? {
              ...s,
              streak: res.completed ? s.streak + 1 : Math.max(0, s.streak - 1),
              history: res.completed
                ? [...s.history, today]
                : s.history.filter((d) => d !== today),
            }
          : null
      );
      setCalendar((c) =>
        res.completed ? [...c, today] : c.filter((d) => d !== today)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить привычку?')) return;
    try {
      await habitsApi.delete(id);
      router.push('/');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !habit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-dark-muted">Загрузка...</p>
      </div>
    );
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-10 bg-dark-bg/95 backdrop-blur border-b border-dark-border px-4 py-3 flex items-center gap-2">
        <Link href="/" className="text-dark-muted hover:text-white">
          ← Назад
        </Link>
        <h1 className="text-lg font-bold flex-1 truncate">
          {habit.emoji} {habit.title}
        </h1>
      </header>

      <main className="p-4 space-y-6">
        <div className="bg-dark-card rounded-xl p-4 border border-dark-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-dark-muted">Сегодня</span>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition ${
                isTodayDone
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-dark-muted hover:border-blue-500'
              }`}
            >
              {isTodayDone && <span className="text-green-500 text-xl">✓</span>}
            </button>
          </div>
          <p className="text-sm text-dark-muted">
            {habit.description || 'Без описания'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-dark-card rounded-xl p-4 border border-dark-border text-center">
            <p className="text-3xl font-bold text-orange-500">{stats?.streak ?? 0}</p>
            <p className="text-sm text-dark-muted">Дней подряд</p>
          </div>
          <div className="bg-dark-card rounded-xl p-4 border border-dark-border text-center">
            <p className="text-3xl font-bold">
              {stats?.totalInPeriod ?? 0} / {habit.goal_days}
            </p>
            <p className="text-sm text-dark-muted">За 30 дней</p>
          </div>
        </div>

        <div className="bg-dark-card rounded-xl p-4 border border-dark-border">
          <h2 className="font-medium mb-3">История выполнения (30 дней)</h2>
          {stats?.history && stats.history.length > 0 ? (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {[...stats.history]
                .sort((a, b) => b.localeCompare(a))
                .map((dateStr) => {
                  const d = new Date(dateStr + 'T12:00:00');
                  const formatted = d.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  });
                  return (
                    <div
                      key={dateStr}
                      className="flex items-center gap-2 text-sm text-green-400"
                    >
                      <span className="text-green-500">✓</span>
                      {formatted}
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-dark-muted">Пока нет выполнений</p>
          )}
        </div>

        <div className="bg-dark-card rounded-xl p-4 border border-dark-border">
          <h2 className="font-medium mb-3">Календарь ({month}.{year})</h2>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
              <span key={d} className="text-dark-muted py-1">
                {d}
              </span>
            ))}
            {Array.from({ length: startOffset }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const done = calendar.includes(dateStr);
              const isToday = dateStr === today;
              return (
                <div
                  key={day}
                  className={`aspect-square rounded flex items-center justify-center text-sm ${
                    done
                      ? 'bg-green-500/30 text-green-400'
                      : isToday
                      ? 'ring-2 ring-blue-500'
                      : ''
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleDelete}
          className="w-full py-2 text-red-500 hover:bg-red-500/10 rounded-xl transition"
        >
          Удалить привычку
        </button>
      </main>
    </div>
  );
}
