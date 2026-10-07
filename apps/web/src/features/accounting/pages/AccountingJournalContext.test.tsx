import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccTransaction } from '../../../api/accounting';
import AccountingJournalPage from './AccountingJournalPage';

const state = vi.hoisted(() => ({ pending: false, periodError: null as Error | null, retryPeriods: vi.fn(), retryTransactions: vi.fn(), save: vi.fn() }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role: 'ADMIN', divisionCode: 'ACC' } }) }));
vi.mock('../../../components/ui/Toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('../../../hooks/useAccounting', () => ({
  useAccountingPeriods: () => ({ data: [{ id: 'p1', periodMonth: '2026-10', status: 'draft' }, { id: 'p2', periodMonth: '2026-11', status: 'draft' }], error: state.periodError, isLoading: false, refetch: state.retryPeriods }),
  useAccountingAccounts: () => ({ data: [] }),
  useAccountingCategories: () => ({ data: [] }),
  useAccountingTransactions: () => ({ data: { data: [{ id: 'j1', periodId: 'p1', description: 'Jurnal uji' }], meta: { total: 1, per_page: 20 } }, isLoading: false, refetch: state.retryTransactions }),
  useTransactionMutations: () => ({ create: { isPending: state.pending, mutateAsync: state.save }, update: { isPending: false }, cancel: { isPending: false }, upload: { isPending: false } }),
}));
vi.mock('../../../components/accounting/JournalTable', () => ({ JournalTable: ({ onEdit, canWrite }: { onEdit: (tx: AccTransaction) => void; canWrite: boolean }) => <button disabled={!canWrite} onClick={() => onEdit({ id: 'j1', periodId: 'p1' } as AccTransaction)}>Edit entri uji</button> }));
vi.mock('../../../components/accounting/JournalFormDrawer', () => ({ JournalFormDrawer: ({ isOpen, periodId, onClose }: { isOpen: boolean; periodId: string; onClose: () => void }) => isOpen ? <div role="dialog" aria-label="Form jurnal"><span>{periodId}</span><button onClick={onClose}>Tutup form uji</button></div> : null }));

beforeEach(() => { state.pending = false; state.periodError = null; vi.clearAllMocks(); });
afterEach(cleanup);
describe('Konteks jurnal Accounting', () => {
  it('menutup form periode lama saat periode diganti', async () => {
    render(<AccountingJournalPage />);
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Periode' })).toHaveValue('p1'));
    fireEvent.click(screen.getByRole('button', { name: 'Edit entri uji' }));
    expect(screen.getByRole('dialog', { name: 'Form jurnal' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Periode' }), { target: { value: 'p2' } });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Periode' })).toHaveValue('p2');
  });
  it('mengunci periode dan menjaga form selama penyimpanan berjalan', async () => {
    const view = render(<AccountingJournalPage />);
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Periode' })).toHaveValue('p1'));
    fireEvent.click(screen.getByRole('button', { name: 'Edit entri uji' }));
    state.pending = true; view.rerender(<AccountingJournalPage />);
    expect(screen.getByRole('combobox', { name: 'Periode' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Cari jurnal' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup form uji' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  it('retry memuat ulang periode dan transaksi', async () => {
    state.periodError = new Error('Gagal membaca periode');
    render(<AccountingJournalPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Coba lagi/i }));
    expect(state.retryPeriods).toHaveBeenCalledOnce();
    expect(state.retryTransactions).toHaveBeenCalledOnce();
  });
});
