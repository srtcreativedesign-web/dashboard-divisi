import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { isRole, MOCK_SESSIONS } from '../mocks/session';
import type { Role, SessionUser } from '../mocks/session';

interface SessionContextValue {
  user: SessionUser;
  setRole: (role: Role) => void;
  setDivisionCode: (code: string | null) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = 'dashboard-divisi.role-demo';
const STORAGE_DIVISION_KEY = 'dashboard-divisi.division-demo';

function loadInitialRole(): Role {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isRole(stored)) {
    return stored;
  }
  return 'MANAGER';
}

function loadInitialDivision(): string | null {
  const stored = localStorage.getItem(STORAGE_DIVISION_KEY);
  return stored || null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(loadInitialRole);
  const [divisionCode, setDivisionCodeState] = useState<string | null>(() => {
    const initialRole = loadInitialRole();
    const storedDiv = loadInitialDivision();
    if (storedDiv) return storedDiv;
    return MOCK_SESSIONS[initialRole]!.divisionCode;
  });

  const setRolePersisted = useCallback((next: Role) => {
    setRole(next);
    localStorage.setItem(STORAGE_KEY, next);
    // auto set divisionCode sesuai role default
    const nextDiv = MOCK_SESSIONS[next]!.divisionCode;
    setDivisionCodeState(nextDiv);
    if (nextDiv) localStorage.setItem(STORAGE_DIVISION_KEY, nextDiv);
    else localStorage.removeItem(STORAGE_DIVISION_KEY);
  }, []);

  const setDivisionCode = useCallback((code: string | null) => {
    setDivisionCodeState(code);
    if (code) localStorage.setItem(STORAGE_DIVISION_KEY, code);
    else localStorage.removeItem(STORAGE_DIVISION_KEY);
  }, []);

  const user = useMemo<SessionUser>(() => {
    const base = MOCK_SESSIONS[role]!;
    return { ...base, divisionCode: divisionCode ?? base.divisionCode };
  }, [role, divisionCode]);

  const value = useMemo<SessionContextValue>(
    () => ({ user, setRole: setRolePersisted, setDivisionCode }),
    [user, setRolePersisted, setDivisionCode],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession harus dipakai di dalam <SessionProvider>');
  }
  return ctx;
}