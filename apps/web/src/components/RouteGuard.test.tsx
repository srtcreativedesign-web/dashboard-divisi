import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider } from '../session/SessionContext';
import { RouteGuard } from './RouteGuard';
import { hasCapability, canAccessDivision } from '../session/capability';
import type { Role } from '../mocks/session';

import { AuthProvider } from '../session/AuthContext';

describe('ORG-06 RouteGuard per capability & division — 7 divisi', () => {
  it('hasCapability: BOD explicit view, Manager limited', () => {
    expect(hasCapability('BOD', 'view:division')).toBe(true);
    expect(hasCapability('BOD', 'random:cap')).toBe(false);
    expect(hasCapability('MANAGER', 'view:division')).toBe(true);
    expect(hasCapability('MANAGER', 'write:revenue')).toBe(true); // Data Dictionary v0.2 §1.2
    expect(hasCapability('ADMIN', 'write:revenue')).toBe(true);
    expect(hasCapability('ADMIN', 'manage:division')).toBe(false);
  });

  it('canAccessDivision: BOD all 7, Manager strict 1:1', () => {
    const bod = { role: 'BOD' as Role, divisionCode: null };
    for (const code of ['WRAP', 'CELL', 'REFL', 'MINI', 'FNB', 'FIN', 'MC']) {
      expect(canAccessDivision(bod, code)).toBe(true);
    }
    const mgrWrap = { role: 'MANAGER' as Role, divisionCode: 'WRAP' };
    expect(canAccessDivision(mgrWrap, 'WRAP')).toBe(true);
    expect(canAccessDivision(mgrWrap, 'CELL')).toBe(false);
    expect(canAccessDivision(mgrWrap, null)).toBe(true); // no filter
  });

  it('RouteGuard blocks jika capability tidak ada', async () => {
    // Mock session dengan ADMIN (tidak punya manage:division)
    localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
    localStorage.removeItem('dashboard-divisi.division-demo');
    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionProvider>
            <RouteGuard capability="manage:division" fallback={<div data-testid="blocked">blocked</div>}>
              <div data-testid="ok">ok</div>
            </RouteGuard>
          </SessionProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('blocked')).toBeDefined();
    expect(screen.queryByTestId('ok')).toBeNull();
    localStorage.clear();
  });

  it('RouteGuard blocks jika division tidak sesuai', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'MANAGER');
    localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');
    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionProvider>
            <RouteGuard divisionCode="CELL" fallback={<div data-testid="blocked">blocked</div>}>
              <div data-testid="ok">ok</div>
            </RouteGuard>
          </SessionProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('blocked')).toBeDefined();
    localStorage.clear();
  });

  it('RouteGuard allows jika capability & division sesuai', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'BOD');
    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionProvider>
            <RouteGuard capability="view:division" divisionCode="WRAP">
              <div data-testid="ok">ok</div>
            </RouteGuard>
          </SessionProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('ok')).toBeDefined();
    localStorage.clear();
  });

  it('ACC Capability & Division Scope: BOD read-only, Manager & Admin segregated, cross-division blocked', () => {
    // 1. BOD Accounting capability
    expect(hasCapability('BOD', 'view:acc_report')).toBe(true);
    expect(hasCapability('BOD', 'write:acc_transaction')).toBe(false);
    expect(hasCapability('BOD', 'approve:acc_period')).toBe(false);
    expect(hasCapability('BOD', 'manage:acc_master')).toBe(false);

    // 2. Manager ACC capability
    expect(hasCapability('MANAGER', 'view:acc_report', 'ACC')).toBe(true);
    expect(hasCapability('MANAGER', 'approve:acc_period', 'ACC')).toBe(true);
    expect(hasCapability('MANAGER', 'manage:acc_master', 'ACC')).toBe(true);
    expect(hasCapability('MANAGER', 'write:acc_transaction', 'ACC')).toBe(false); // Segregation of duties

    // 3. Admin ACC capability
    expect(hasCapability('ADMIN', 'view:acc_report', 'ACC')).toBe(true);
    expect(hasCapability('ADMIN', 'write:acc_transaction', 'ACC')).toBe(true);
    expect(hasCapability('ADMIN', 'import:acc_transaction', 'ACC')).toBe(true);
    expect(hasCapability('ADMIN', 'submit:acc_period', 'ACC')).toBe(true);
    expect(hasCapability('ADMIN', 'approve:acc_period', 'ACC')).toBe(false); // Segregation of duties

    // 4. Divisi lain (non-ACC) tidak memiliki capability ACC
    expect(hasCapability('ADMIN', 'write:acc_transaction', 'WRAP')).toBe(false);
    expect(hasCapability('MANAGER', 'approve:acc_period', 'CELL')).toBe(false);

    // 5. canAccessDivision untuk ACC
    const bod = { role: 'BOD' as Role, divisionCode: null };
    expect(canAccessDivision(bod, 'ACC')).toBe(true);

    const mgrAcc = { role: 'MANAGER' as Role, divisionCode: 'ACC' };
    expect(canAccessDivision(mgrAcc, 'ACC')).toBe(true);
    expect(canAccessDivision(mgrAcc, 'WRAP')).toBe(false);

    const mgrWrap = { role: 'MANAGER' as Role, divisionCode: 'WRAP' };
    expect(canAccessDivision(mgrWrap, 'ACC')).toBe(false);

    // 6. Admin & Manager ACC TIDAK memiliki capability generik non-accounting (Bugbot Medium)
    expect(hasCapability('ADMIN', 'write:revenue', 'ACC')).toBe(false);
    expect(hasCapability('ADMIN', 'write:target', 'ACC')).toBe(false);
    expect(hasCapability('MANAGER', 'write:revenue', 'ACC')).toBe(false);
    expect(hasCapability('MANAGER', 'write:target', 'ACC')).toBe(false);
    expect(hasCapability('ADMIN', 'view:division', 'ACC')).toBe(true);
    expect(hasCapability('MANAGER', 'view:division', 'ACC')).toBe(true);

    // Divisi retail (WRAP) tetap memiliki capability generik operasional
    expect(hasCapability('ADMIN', 'write:revenue', 'WRAP')).toBe(true);
    expect(hasCapability('ADMIN', 'write:target', 'WRAP')).toBe(true);
    expect(hasCapability('MANAGER', 'write:revenue', 'WRAP')).toBe(true);
    expect(hasCapability('MANAGER', 'write:target', 'WRAP')).toBe(true);
  });

  it('RouteGuard blocks Admin ACC from accessing retail write routes', () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
    localStorage.setItem('dashboard-divisi.division-demo', 'ACC');

    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionProvider>
            <RouteGuard capability="write:revenue" fallback={<div data-testid="blocked">blocked</div>}>
              <div data-testid="retail-ok">Retail OK</div>
            </RouteGuard>
          </SessionProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('blocked')).toBeDefined();
    expect(screen.queryByTestId('retail-ok')).toBeNull();
    localStorage.clear();
  });

  it('RouteGuard allows Admin ACC to access accounting report route', () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
    localStorage.setItem('dashboard-divisi.division-demo', 'ACC');

    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionProvider>
            <RouteGuard capability="view:acc_report">
              <div data-testid="acc-ok">Accounting OK</div>
            </RouteGuard>
          </SessionProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('acc-ok')).toBeDefined();
    localStorage.clear();
  });
});
