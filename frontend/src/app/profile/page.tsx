'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authApi, gamificationApi } from '@/lib/api';
import { useAuth } from '@/components/TelegramProvider';

export default function ProfilePage() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<{
    level: number;
    experience: number;
    totalCompletions: number;
    xpToNextLevel: number;
    progressPercent: number;
    achievements: { code: string; title: string; description: string; icon: string; earned_at: string }[];
    allAchievements?: { code: string; title: string; description: string; icon: string; earned: boolean; earned_at?: string }[];
    user?: { first_name?: string; last_name?: string; username?: string; photo_url?: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([authApi.me(), gamificationApi.profile(), gamificationApi.achievements()])
      .then(([user, p, allAch]) => {
        setProfile({
          ...p,
          allAchievements: allAch,
          user: {
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            photo_url: user.photo_url,
          },
        });
      })
      .catch((err) => {
        if (err instanceof Error && err.message === 'Пользователь не найден') {
          logout();
        }
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [logout]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-dark-muted">Загрузка...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-red-500 text-center">
          Сессия устарела или произошла ошибка. Войдите снова.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition"
        >
          На главную
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-10 bg-dark-bg/95 backdrop-blur border-b border-dark-border px-4 py-3 flex items-center gap-2">
        <Link href="/" className="text-dark-muted hover:text-white">
          ← Назад
        </Link>
        <h1 className="text-xl font-bold flex-1 text-center">Профиль</h1>
        <div className="w-12" />
      </header>

      <main className="p-4 space-y-6">
        {profile.user && (profile.user.first_name || profile.user.username) && (
          <div className="bg-dark-card rounded-xl p-4 border border-dark-border flex items-center gap-4">
            {profile.user.photo_url ? (
              <img
                src={profile.user.photo_url}
                alt=""
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-500/30 flex items-center justify-center text-2xl">
                👤
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg truncate">
                {[profile.user.first_name, profile.user.last_name].filter(Boolean).join(' ') || 'Пользователь'}
              </p>
              {profile.user.username && (
                <p className="text-dark-muted text-sm">@{profile.user.username}</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-dark-card rounded-xl p-6 border border-dark-border text-center">
          <p className="text-5xl font-bold text-blue-500 mb-1">
            Уровень {profile.level}
          </p>
          <p className="text-dark-muted mb-4">
            {profile.experience} XP · {profile.totalCompletions} выполнений
          </p>
          <div className="h-3 bg-dark-border rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${profile.progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-dark-muted mt-2">
            До след. уровня: {profile.xpToNextLevel} XP
          </p>
        </div>

        <div>
          <h2 className="font-medium mb-3">Достижения</h2>
          {profile.allAchievements && profile.allAchievements.length > 0 ? (
            <div className="space-y-3">
              {profile.allAchievements.map((a) => (
                <div
                  key={a.code}
                  className={`bg-dark-card rounded-xl p-4 border flex items-center gap-4 transition ${
                    a.earned ? 'border-green-500/50' : 'border-dark-border opacity-60'
                  }`}
                >
                  <span className={`text-3xl ${a.earned ? '' : 'opacity-40'}`}>{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-dark-muted">{a.description}</p>
                  </div>
                  {a.earned && <span className="text-green-500 text-xl">✓</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-muted text-sm">
              Выполняй привычки, чтобы получать достижения!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
