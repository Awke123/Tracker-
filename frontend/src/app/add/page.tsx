'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { habitsApi } from '@/lib/api';

const EMOJIS = ['📌', '🏃', '📚', '💧', '🧘', '✍️', '🎯', '💪', '🌅', '😴'];

export default function AddHabitPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📌');
  const [goalDays, setGoalDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Введи название привычки');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await habitsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        emoji,
        goal_days: goalDays,
      });
      router.push('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-dark-bg/95 backdrop-blur border-b border-dark-border px-4 py-3 flex items-center gap-2">
        <Link href="/" className="text-dark-muted hover:text-white">
          ← Назад
        </Link>
        <h1 className="text-xl font-bold flex-1 text-center">Новая привычка</h1>
        <div className="w-12" />
      </header>

      <main className="p-4 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm text-dark-muted mb-2">
              Название *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Утренняя зарядка"
              className="w-full px-4 py-3 rounded-xl bg-dark-card border border-dark-border focus:border-blue-500 outline-none transition"
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-2">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание (необязательно)"
              className="w-full px-4 py-3 rounded-xl bg-dark-card border border-dark-border focus:border-blue-500 outline-none transition resize-none h-20"
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-2">Иконка</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition ${
                    emoji === e
                      ? 'bg-blue-600 ring-2 ring-blue-400'
                      : 'bg-dark-card border border-dark-border hover:border-dark-muted'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-2">
              Цель (дней)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={goalDays}
              onChange={(e) => setGoalDays(Number(e.target.value) || 30)}
              className="w-full px-4 py-3 rounded-xl bg-dark-card border border-dark-border focus:border-blue-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-medium transition"
          >
            {loading ? 'Создание...' : 'Создать привычку'}
          </button>
        </form>
      </main>
    </div>
  );
}
