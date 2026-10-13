import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../App';

const ok = (data: unknown) => Promise.resolve(new Response(JSON.stringify({ data, meta: { trace_id: 'period-test' } }), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
}));

const readiness = (readyForClose: boolean) => ({
  periodId: 'period-1', transactionCount: 8, draftTransactionCount: 0, missingAttachmentCount: 0,
  bankAccountCount: 2, unverifiedBankCount: readyForClose ? 0 : 1, bankBalance: 12000000,
  cashBalance: 11500000, variance: readyForClose ? 0 : 500000, readyForSubmission: true, readyForClose,
  checks: [{ code: 'bank_entries_verified', label: 'Rekening sudah diverifikasi', passed: readyForClose, count: readyForClose ? 0 : 1, message: readyForClose ? 'Seluruh rekening telah diverifikasi.' : '1 rekening belum diverifikasi.' }],
});

describe('Accounting period control workbench', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dashboard-divisi.role-demo', 'MANAGER');
    localStorage.setItem('dashboard-divisi.division-demo', 'ACC');
    history.pushState({}, '', '/accounting/pembukuan/periode');
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const role = localStorage.getItem('dashboard-divisi.role-demo') ?? 'MANAGER';
      if (url.includes('/auth/me')) return ok({ id: 'user-1', name: 'Pengguna Uji', role, divisionCode: 'ACC' });
      if (url.includes('/periods/period-1/readiness')) return ok(readiness(role === 'ADMIN'));
      if (url.includes('/periods')) return ok([{ id: 'period-1', periodMonth: '2026-10-01', status: role === 'ADMIN' ? 'draft' : 'approved', version: 2, notes: 'Periode pengujian' }]);
      return ok([]);
    }));
  });

  it('shows Manager the database readiness checks and blocks close while exceptions remain', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Periode & penutupan' })).toBeInTheDocument();
    expect(await screen.findByText('Checklist kesiapan')).toBeInTheDocument();
    expect(screen.getByText('1 rekening belum diverifikasi.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tutup dan kunci' })).toBeDisabled();
  });

  it('shows Admin the submit action when the period is ready', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
    render(<App />);
    const submit = await screen.findByRole('button', { name: 'Ajukan ke Manager' });
    await waitFor(() => expect(submit).toBeEnabled());
    expect(screen.queryByRole('button', { name: 'Tutup dan kunci' })).not.toBeInTheDocument();
  });
});
