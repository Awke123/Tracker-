'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/TelegramProvider';
import Link from 'next/link';
import { habitsApi, trackingApi, Habit } from '@/lib/api';

export default function HomePage() {
  const { token, isLoading, login, initData } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHabits = () => {
    if (!token) return;
    setLoading(true);
    habitsApi
      .list()
      .then(setHabits)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    fetchHabits();
  }, [token]);

  useEffect(() => {
    if (isLoading) return;
    if (!token && initData) {
      login(initData).catch(console.error);
    }
  }, [isLoading, token, login, initData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-dark-muted">Загрузка...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-dark-muted text-center">
          Открой приложение через Telegram для входа
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-dark-bg/95 backdrop-blur border-b border-dark-border px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">Привычки</h1>
        <div className="flex gap-2">
          <Link
            href="/profile"
            className="px-3 py-1.5 rounded-lg bg-dark-card hover:bg-dark-border transition"
          >
            Профиль
          </Link>
          <Link
            href="/add"
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
          >
            + Добавить
          </Link>
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <p className="text-dark-muted">Загрузка привычек...</p>
        ) : habits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-muted mb-4">Пока нет привычек</p>
            <Link
              href="/add"
              className="inline-block px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium"
            >
              Создать первую привычку
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((h) => (
              <HabitCard key={h.id} habit={h} onToggle={fetchHabits} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function HabitCard({
  habit,
  onToggle,
}: {
  habit: Habit;
  onToggle: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const lastCompleted = habit.last_completed?.slice(0, 10);
  const isTodayDone = lastCompleted === today;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      await trackingApi.toggle(habit.id, today);
      onToggle();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/habit/${habit.id}`}>
      <div className="bg-dark-card rounded-xl p-4 border border-dark-border hover:border-dark-muted/50 transition flex items-center gap-4">
        <button
          onClick={handleToggle}
          className="w-10 h-10 rounded-full border-2 border-dark-muted flex-shrink-0 flex items-center justify-center hover:border-blue-500 transition"
        >
          {isTodayDone && (
            <span className="text-green-500 text-xl">✓</span>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {habit.emoji} {habit.title}
          </p>
          <p className="text-sm text-dark-muted">
            {habit.completions_count} / {habit.goal_days} дней
          </p>
        </div>
        <span className="text-dark-muted">→</span>
      </div>
    </Link>
  );
}
