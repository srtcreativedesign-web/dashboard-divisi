import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProjectProgressPage from './ProjectProgressPage';
import ProjectRabPage from './ProjectRabPage';
import ProjectPaymentsPage from './ProjectPaymentsPage';

const identity = vi.hoisted(() => ({ role: 'HEAD_OPS' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role: identity.role, divisionCode: 'PROJECT' } }) }));
vi.mock('../../../layout/ProjectPageLayout', () => ({ ProjectPageLayout: ({ children }: { children: (project: unknown, refresh: () => Promise<void>) => ReactNode }) => children({ id: 1, contract_value: '0', rabs: [], milestones: [{ id: 1, title: 'Pekerjaan uji', payment_status: false, weight_percentage: 100 }] }, async () => {}) }));
afterEach(cleanup);
describe('Aksi RAB dan milestone sesuai role', () => {
  it('pembaca dan BOD tidak mendapat tombol mutasi', () => {
    for (const role of ['HEAD_OPS', 'SPV', 'LEADER', 'ADMIN_GUDANG', 'ACCOUNTING', 'FINANCE', 'BOD']) {
      identity.role = role; render(<><ProjectProgressPage /><ProjectRabPage /><ProjectPaymentsPage /></>);
      expect(screen.queryByRole('button', { name: /Tambah/ })).not.toBeInTheDocument(); expect(screen.queryByRole('button', { name: /Ubah penandaan/ })).not.toBeInTheDocument(); cleanup();
    }
  });
  it('Admin dapat menambah RAB dan milestone', () => {
    identity.role = 'ADMIN'; render(<><ProjectProgressPage /><ProjectRabPage /><ProjectPaymentsPage /></>);
    expect(screen.getByRole('button', { name: /Tambah Milestone/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tambah Item RAB/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ubah penandaan administratif/ })).toBeInTheDocument();
  });
});
