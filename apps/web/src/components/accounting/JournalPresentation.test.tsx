import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { JournalTable } from './JournalTable';
import { JournalFilterBar } from './JournalFilterBar';
import type { AccTransaction } from '../../api/accounting';

afterEach(cleanup);
const transaction: AccTransaction = { id: 'j1', periodId: 'p1', accountId: 'a1', categoryId: 'c1', transactionDate: '2026-10-07', description: 'Jurnal uji', debitAmount: '9007199254740993.12', creditAmount: '0.00', isDraft: true, isCancelled: false, version: 1 };
const actions = { onEdit: vi.fn(), onCancel: vi.fn(), onUpload: vi.fn(), onDownload: vi.fn() };
describe('Penyajian jurnal Accounting', () => {
  it('mempertahankan nominal besar dan tidak mengganti saldo yang tidak tersedia dengan nol', () => {
    render(<JournalTable transactions={[transaction]} canWrite={false} {...actions} page={1} setPage={vi.fn()} totalPages={1} totalEntries={1} />);
    expect(screen.getAllByText('Rp 9.007.199.254.740.993,12')).toHaveLength(2);
    expect(screen.getAllByText('Belum tersedia')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Edit jurnal/ })).not.toBeInTheDocument();
  });
  it('membedakan saldo nol yang benar-benar dikirim oleh server', () => {
    render(<JournalTable transactions={[{ ...transaction, runningBalance: '0.00' }]} canWrite={false} {...actions} page={1} setPage={vi.fn()} totalPages={1} totalEntries={1} />);
    expect(screen.queryByText('Belum tersedia')).not.toBeInTheDocument();
    expect(screen.getAllByText('Rp 0,00')).toHaveLength(4);
  });
  it('mencegah navigasi melewati halaman terakhir setelah jumlah data berkurang', () => {
    const setPage = vi.fn();
    render(<JournalTable transactions={[transaction]} canWrite={false} {...actions} page={3} setPage={setPage} totalPages={2} totalEntries={21} />);
    expect(screen.getByRole('button', { name: 'Lanjut' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Sebel.' }));
    expect(setPage).toHaveBeenCalledWith(2);
  });
  it('memberi label pencarian dan mengunci filter saat mutasi berlangsung', () => {
    render(<JournalFilterBar disabled periods={[]} periodId="" setPeriodId={vi.fn()} search="" setSearch={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'Cari jurnal' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Periode' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Filter Lanjutan' })).not.toBeInTheDocument();
  });
});
