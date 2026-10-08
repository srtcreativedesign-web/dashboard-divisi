import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectPettyCashPage from './ProjectPettyCashPage';
import { projectApi } from '../../../api/projects';

const state = vi.hoisted(() => ({ role: 'ADMIN' }));
vi.mock('../../../session/AuthContext', () => ({
  useAuth: () => ({ user: { role: state.role, divisionCode: 'PROJECT' } }),
}));
vi.mock('../../../layout/ProjectPageLayout', () => ({
  ProjectPageLayout: ({ children }: { children: (project: unknown, refresh: () => Promise<void>) => ReactNode }) =>
    children({ id: 1, name: 'Proyek Uji', contract_value: '500000000' }, async () => {}),
}));
vi.mock('../../../api/projects', () => ({
  projectApi: {
    getPettyCash: vi.fn(),
    addPettyCash: vi.fn(),
    updatePettyCash: vi.fn(),
    deletePettyCash: vi.fn(),
    downloadPettyCashReceipt: vi.fn(),
  },
}));

const mockEntry = {
  id: 1,
  project_id: 1,
  type: 'out' as const,
  category: 'Material Darurat',
  amount: 150000,
  transaction_date: '2026-10-05',
  description: 'Beli semen darurat 2 sak',
  recipient_or_vendor: 'TB Berkah',
  receipt_path: 'petty_cash_receipts/1/sample.jpg',
  created_by: 'Admin',
  created_at: '2026-10-05',
  updated_at: '2026-10-05',
};

const mockSummary = {
  total_in: 5000000,
  total_out: 150000,
  balance: 4850000,
  transaction_count: 1,
};

describe('Manajemen Petty Cash Proyek', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    state.role = 'ADMIN';
    vi.mocked(projectApi.getPettyCash).mockResolvedValue({
      data: [mockEntry],
      summary: mockSummary,
    });
  });
  afterEach(cleanup);

  it('pembaca melihat data dan saldo tanpa tombol mutasi', async () => {
    for (const role of ['HEAD_OPS', 'SPV', 'LEADER', 'ADMIN_GUDANG', 'ACCOUNTING', 'FINANCE', 'BOD']) {
      state.role = role;
      render(<ProjectPettyCashPage />);
      expect(await screen.findByText('Beli semen darurat 2 sak')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Catat Transaksi Kas/ })).not.toBeInTheDocument();
      expect(screen.queryByTitle('Edit Transaksi')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Hapus Transaksi')).not.toBeInTheDocument();
      cleanup();
    }
  });

  it('Admin dapat membuka modal dan menambah transaksi kas kecil', async () => {
    vi.mocked(projectApi.addPettyCash).mockResolvedValue(mockEntry);
    render(<ProjectPettyCashPage />);

    const addButton = await screen.findByRole('button', { name: /Catat Transaksi Kas/ });
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(screen.getByText('Catat Transaksi Kas Kecil')).toBeInTheDocument();

    const amountInput = screen.getByPlaceholderText('Contoh: 150000');
    fireEvent.change(amountInput, { target: { value: '250000' } });

    const descInput = screen.getByPlaceholderText(/Rincian pembelian material/);
    fireEvent.change(descInput, { target: { value: 'Beli paku & kawat' } });

    fireEvent.click(screen.getByRole('button', { name: 'Simpan Transaksi' }));

    await screen.findByRole('status');
    expect(projectApi.addPettyCash).toHaveBeenCalledTimes(1);
    expect(projectApi.getPettyCash).toHaveBeenCalledTimes(2);
  });
});
