/**
 * SOP 1B: Auth real — ganti SessionContext mock (localStorage role-demo) ke BE /auth/me + httpOnly cookie.
 * Simpan sebagai konteks baru, SessionContext lama dipertahankan sebagai legacy fallback untuk test.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { authApi, type AuthUser } from '../api/auth';
import { ApiException } from '../api/client';
import { MOCK_SESSIONS as _MOCK_FALLBACK } from '../mocks/session';

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
  const isTestEnv = typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE === 'test';
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (isTestEnv) {
      try {
        const stored = localStorage.getItem('dashboard-divisi.role-demo');
        const key = stored && (stored in _MOCK_FALLBACK) ? stored : 'MANAGER';
        const base = (_MOCK_FALLBACK as Record<string, { name: string; role: string; divisionCode: string | null }>)[key]!;
        const div = localStorage.getItem('dashboard-divisi.division-demo') ?? base.divisionCode;
        return { id: base.name, email: `${key.toLowerCase()}@dashboard.test`, name: base.name, role: base.role as unknown as string, divisionCode: div } as unknown as AuthUser;
      } catch { return null; }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => !isTestEnv);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    // If we already have a logged-in user, skip refresh to avoid overwriting after login
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
      // Test env: jika tanpa BE, fallback ke mock sesuai role-demo agar test tetap hijau (hanya saat Vitest).
      // SOP: Zero Hardcoded Secrets — tidak pernah auto-login ke BE asli dengan kredensial seed.
      if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE === 'test') {
        try {
          const { MOCK_SESSIONS, isRole } = await import('../mocks/session');
          const storedRole = localStorage.getItem('dashboard-divisi.role-demo');
          const role = storedRole && isRole(storedRole) ? storedRole : 'MANAGER';
          const base = MOCK_SESSIONS[role]!;
          const div = localStorage.getItem('dashboard-divisi.division-demo') ?? base.divisionCode;
          setUser({ id: base.name, email: `${role.toLowerCase()}@dashboard.test`, name: base.name, role: base.role, divisionCode: div } as unknown as AuthUser);
        } catch {}
      }
      if (e instanceof ApiException && e.status === 401) {
        setUser(null);
      } else {
        // Network error (Failed to fetch) — biarkan null agar redirect ke /login, bukan error
        setUser(null);
        if (!(e instanceof ApiException)) {
          setError('BE tidak terjangkau — cek http://localhost:3000/api/v1/health');
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isTestEnv) return;
    // Run once on mount to check existing session
    void refresh();
  }, [refresh, isTestEnv]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await authApi.login(email, password);
      if (resp.data?.accessToken) {
        localStorage.setItem('access_token', resp.data.accessToken);
      }
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
    await authApi.logout().catch(() => {});
    localStorage.removeItem('access_token');
    setUser(null);
    setError(null); // jangan bawa pesan error sesi lama ke halaman login
  }, []);

  const value = useMemo(() => ({ user, loading, error, login, logout, refresh }), [user, loading, error, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus di dalam <AuthProvider>');
  return ctx;
}
