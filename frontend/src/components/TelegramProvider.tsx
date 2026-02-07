'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { authApi } from '@/lib/api';

interface AuthContextType {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (initData: string) => Promise<void>;
  logout: () => void;
  initData: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within TelegramProvider');
  return ctx;
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initData, setInitData] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('token');
    if (saved) {
      setToken(saved);
    }
    import('@twa-dev/sdk')
      .then(({ default: WebApp }) => {
        WebApp.ready();
        WebApp.expand();
        try { WebApp.enableClosingConfirmation?.(); } catch { }
        setInitData(WebApp.initData || '');
      })
      .catch(() => setInitData(''))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (initData: string) => {
    setError(null);
    try {
      const { token: t } = await authApi.telegram(initData);
      localStorage.setItem('token', t);
      setToken(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка входа');
      throw e;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isLoading, error, login, logout, initData }}>
      {children}
    </AuthContext.Provider>
  );
}
