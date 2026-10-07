import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { authApi, type AuthUser } from '../api/auth';
import { ApiException } from '../api/client';
import { queryClient } from '../api/queryClient';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch (e) {
      if (e instanceof ApiException && e.status === 401) {
        setUser(null);
      } else {
        setUser(null);
        if (!(e instanceof ApiException)) {
          setError('BE tidak terjangkau — pastikan server backend berjalan.');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    localStorage.removeItem('access_token');
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await authApi.login(email, password);
      queryClient.clear();
      localStorage.removeItem('access_token');
      setUser(resp.data.user);
      setLoading(false);
      setError(null);
    } catch (e) {
      const msg = e instanceof ApiException ? e.message : 'Login gagal';
      setError(msg);
      setLoading(false);
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      setError(e instanceof ApiException ? e.message : 'Logout gagal; sesi belum ditutup. Coba lagi.');
      throw e;
    }
    localStorage.removeItem('access_token');
    queryClient.clear();
    setUser(null);
    setError(null);
  }, []);

  const value = useMemo(() => ({ user, loading, error, login, logout, refresh }), [user, loading, error, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus di dalam <AuthProvider>');
  return ctx;
}
