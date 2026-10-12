import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccTransaction } from '../../../api/accounting';
import AccountingJournalPage from './AccountingJournalPage';
import { MemoryRouter } from 'react-router-dom';

const state = vi.hoisted(() => ({ pending: false, periodError: null as Error | null, retryPeriods: vi.fn(), retryTransactions: vi.fn(), retrySummary: vi.fn(), save: vi.fn() }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role: 'ADMIN', divisionCode: 'ACC' } }) }));
vi.mock('../../../components/ui/Toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('../../../hooks/useAccounting', () => ({
  useAccountingPeriods: () => ({ data: [{ id: 'p1', periodMonth: '2026-10', status: 'draft' }, { id: 'p2', periodMonth: '2026-11', status: 'draft' }], error: state.periodError, isLoading: false, refetch: state.retryPeriods }),
  useAccountingAccounts: () => ({ data: [] }),
  useAccountingCategories: () => ({ data: [] }),
  useAccountingTransactions: () => ({ data: { data: [{ id: 'j1', periodId: 'p1', description: 'Jurnal uji' }], meta: { total: 1, per_page: 20 } }, isLoading: false, refetch: state.retryTransactions }),
  useAccountingSummary: () => ({ data: { periodId: 'p1', periodMonth: '2026-10', status: 'draft', totalTransactions: 1, totalDebit: '100.00', totalCredit: '0.00', netBalance: '100.00', missingAttachmentCount: 1, isReadyForSubmission: false }, isLoading: false, error: null, refetch: state.retrySummary }),
  useTransactionMutations: () => ({ create: { isPending: state.pending, mutateAsync: state.save }, update: { isPending: false }, cancel: { isPending: false }, upload: { isPending: false } }),
}));
vi.mock('../../../components/accounting/JournalTable', () => ({ JournalTable: ({ onEdit, onCancel, canWrite }: { onEdit: (tx: AccTransaction) => void; onCancel: (tx: AccTransaction) => void; canWrite: boolean }) => <div><button disabled={!canWrite} onClick={() => onEdit({ id: 'j1', periodId: 'p1' } as AccTransaction)}>Edit entri uji</button><button disabled={!canWrite} onClick={() => onCancel({ id: 'j1', periodId: 'p1', description: 'Jurnal uji', referenceNo: 'REF-1' } as AccTransaction)}>Batalkan entri uji</button></div> }));
vi.mock('../../../components/accounting/JournalFormDrawer', () => ({ JournalFormDrawer: ({ isOpen, periodId, onClose }: { isOpen: boolean; periodId: string; onClose: () => void }) => isOpen ? <div role="dialog" aria-label="Form jurnal"><span>{periodId}</span><button onClick={onClose}>Tutup form uji</button></div> : null }));

beforeEach(() => { state.pending = false; state.periodError = null; vi.clearAllMocks(); });
afterEach(cleanup);
const show = () => render(<MemoryRouter><AccountingJournalPage /></MemoryRouter>);
describe('Konteks jurnal Accounting', () => {
  it('menutup form periode lama saat periode diganti', async () => {
    show();
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Periode' })).toHaveValue('p1'));
    fireEvent.click(screen.getByRole('button', { name: 'Edit entri uji' }));
    expect(screen.getByRole('dialog', { name: 'Form jurnal' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Periode' }), { target: { value: 'p2' } });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Periode' })).toHaveValue('p2');
  });
  it('mengunci periode dan menjaga form selama penyimpanan berjalan', async () => {
    const view = show();
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Periode' })).toHaveValue('p1'));
    fireEvent.click(screen.getByRole('button', { name: 'Edit entri uji' }));
    state.pending = true; view.rerender(<MemoryRouter><AccountingJournalPage /></MemoryRouter>);
    expect(screen.getByRole('combobox', { name: 'Periode' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Cari jurnal' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup form uji' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  it('retry memuat ulang periode dan transaksi', async () => {
    state.periodError = new Error('Gagal membaca periode');
    show();
    fireEvent.click(await screen.findByRole('button', { name: /Coba lagi/i }));
    expect(state.retryPeriods).toHaveBeenCalledOnce();
    expect(state.retryTransactions).toHaveBeenCalledOnce();
    expect(state.retrySummary).toHaveBeenCalledOnce();
  });
  it('meminta alasan terstruktur sebelum membatalkan jurnal', async () => {
    show();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Batalkan entri uji' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Batalkan entri uji' }));
    expect(screen.getByRole('heading', { name: 'Batalkan jurnal' })).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Batalkan jurnal' });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Alasan pembatalan'), { target: { value: 'Salah memilih rekening jurnal' } });
    expect(submit).toBeEnabled();
  });
});
