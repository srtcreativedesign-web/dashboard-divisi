import type { ReactNode } from 'react';

import { Navigate } from 'react-router-dom';
import { EmptyState, NoAccessState } from './states';
import { useAuth } from '../session/AuthContext';
import { hasCapability, canAccessDivision } from '../session/capability';

interface RouteGuardProps {
  children: ReactNode;
  capability?: string;
  divisionCode?: string | null;
  fallback?: ReactNode;
}

export function RouteGuard({ children, capability, divisionCode, fallback }: RouteGuardProps) {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <EmptyState title="Memuat sesi..." description="Menunggu verifikasi token" />;
  if (!user) return <Navigate to="/login" replace />;

  if (capability && !hasCapability(user.role as never, capability, user.divisionCode)) {
    return fallback ?? <NoAccessState description={`Role ${user.role} tidak memiliki izin ${capability}.`} />;
  }

  if (divisionCode && !canAccessDivision(user as unknown as { role: never; divisionCode: string | null }, divisionCode)) {
    return fallback ?? <NoAccessState description={`Role ${user.role} tidak memiliki akses ke divisi ${divisionCode}.`} />;
  }

  return <>{children}</>;
}
