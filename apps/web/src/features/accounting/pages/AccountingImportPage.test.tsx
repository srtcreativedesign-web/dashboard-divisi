import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../App';

const ok = (data: unknown) => Promise.resolve(new Response(JSON.stringify({ data, meta: { trace_id: 'test' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

describe('Accounting import staging', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
    localStorage.setItem('dashboard-divisi.division-demo', 'ACC');
    history.pushState({}, '', '/accounting/pembukuan/impor');
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/me')) return ok({ id: 'test', name: 'Pengguna Uji', role: 'ADMIN', divisionCode: 'ACC' });
      if (url.includes('/accounting/periods')) return ok([{ id: 'period-10', periodMonth: '2026-10-01', status: 'draft', version: 1 }, { id: 'period-09', periodMonth: '2026-09-01', status: 'closed', version: 1 }]);
      if (url.includes('/accounting/import/preview')) return ok({ summary: { total_rows: 1, valid_rows: 0, warning_rows: 0, error_rows: 0, duplicate_candidates: 1, total_debit: 150000, total_credit: 0, can_commit: true }, rows: [{ row_number: 2, status: 'DUPLICATE', date: '2026-10-01', category_code: 'B990', category_id: 'cat-1', account_id: 'acc-1', account_name: 'Kas', reference_no: 'REF-1', description: 'Penerimaan', debit: 150000, credit: 0, errors: [], warnings: ['Kandidat duplikat terdeteksi'] }] });
      return ok([]);
    }));
  });

  it('requires an editable period and explicit duplicate acknowledgement before commit', async () => {
    const { container } = render(<App />);
    expect(await screen.findByRole('heading', { name: 'Impor transaksi Accounting' })).toBeInTheDocument();
    const period = await screen.findByLabelText('Periode tujuan');
    expect(period).toHaveValue('period-10');
    expect(screen.queryByRole('option', { name: /September 2026/i })).not.toBeInTheDocument();

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['data'], 'transaksi.csv', { type: 'text/csv' })] } });
    expect((await screen.findAllByText(/1 kandidat duplikat/i)).length).toBeGreaterThan(0);
    const commit = screen.getByRole('button', { name: /Commit 1 transaksi/i });
    expect(commit).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: /Saya sudah menelaah 1 kandidat duplikat/i }));
    await waitFor(() => expect(commit).toBeEnabled());
  });
});
