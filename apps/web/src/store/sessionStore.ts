/**
 * SOP 1B: Zustand store — SOP minta state global via Zustand, bukan prop drilling.
 * Wrapper di atas SessionContext untuk migrasi bertahap.
 * SessionContext tetap sebagai source persist (localStorage), store ini read-only mirror + actions.
 */
import { create } from 'zustand';

import { MOCK_SESSIONS, type Role, type SessionUser } from '../mocks/session';

interface SessionState {
  user: SessionUser;
  setRole: (role: Role) => void;
  setDivisionCode: (code: string | null) => void;
  // SOP: hydrate dari SessionContext (dipanggil di AppLayout)
  _hydrate: (user: SessionUser, setRole: (r: Role) => void, setDivision: (c: string | null) => void) => void;
  _setRoleFn: ((r: Role) => void) | null;
  _setDivisionFn: ((c: string | null) => void) | null;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: MOCK_SESSIONS.MANAGER!,
  _setRoleFn: null,
  _setDivisionFn: null,
  _hydrate: (user, setRole, setDivision) =>
    set({ user, _setRoleFn: setRole, _setDivisionFn: setDivision }),
  setRole: (role) => get()._setRoleFn?.(role),
  setDivisionCode: (code) => get()._setDivisionFn?.(code),
}));
