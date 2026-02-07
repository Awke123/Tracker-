const API_BASE = '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Ошибка запроса');
  }
  return res.json();
}

export const authApi = {
  telegram: (initData: string) =>
    api<{ token: string; userId: number }>('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    }),
  me: () =>
    api<{
      id: number;
      telegram_id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      photo_url?: string;
      level: number;
      experience: number;
      total_completions?: number;
    }>('/api/auth/me'),
};

export const habitsApi = {
  list: () => api<Habit[]>('/api/habits'),
  get: (id: number) => api<Habit>(`/api/habits/${id}`),
  create: (data: { title: string; description?: string; emoji?: string; goal_days?: number }) =>
    api<Habit>('/api/habits', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) =>
    api<{ success: boolean }>(`/api/habits/${id}`, { method: 'DELETE' }),
};

export const trackingApi = {
  toggle: (habitId: number, date?: string) =>
    api<{ completed: boolean; date: string }>(`/api/tracking/${habitId}/toggle`, {
      method: 'POST',
      body: JSON.stringify(date ? { date } : {}),
    }),
  calendar: (habitId: number, year: number, month: number) =>
    api<string[]>(`/api/tracking/${habitId}/calendar/${year}/${month}`),
  stats: (habitId: number) =>
    api<{ streak: number; history: string[]; totalInPeriod: number }>(
      `/api/tracking/${habitId}/stats`
    ),
};

export const gamificationApi = {
  profile: () =>
    api<{
      level: number;
      experience: number;
      totalCompletions: number;
      xpToNextLevel: number;
      progressPercent: number;
      achievements: { code: string; title: string; description: string; icon: string; earned_at: string }[];
    }>('/api/gamification/profile'),
  achievements: () =>
    api<{ code: string; title: string; description: string; icon: string; earned: boolean; earned_at?: string }[]>(
      '/api/gamification/achievements'
    ),
};

export interface Habit {
  id: number;
  title: string;
  description?: string;
  emoji: string;
  goal_days: number;
  completions_count: string;
  last_completed: string | null;
}
