import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { voucherApi } from '../../../api/vouchers';
import { dashboardApi } from '../api/dashboard';
import AccountingPaymentRunPage from './AccountingPaymentRunPage';

vi.mock('../../../api/vouchers', () => ({ voucherApi: { list: vi.fn(), outlets: vi.fn() } }));
vi.mock('../api/dashboard', () => ({ dashboardApi: { operations: vi.fn() } }));
const envelope = <T,>(data: T) => ({ data, meta: { trace_id: 'payment-run-test' } });
let client: QueryClient;
const record = { id: '11111111-1111-4111-8111-111111111111', voucher_no: 'VCH-UAT-01', type: 'OPERATIONAL' as const, outlet_id: 'outlet-1', outlet_name: 'Cellular T3', source_division_code: 'CELL', voucher_date: '2026-10-01', due_date: '2026-10-02', entity_name: 'Vendor UAT', source_reference: 'INV-UAT-01', amount: '1000000.00', description: 'Kebutuhan UAT', priority: 'URGENT' as const, payment_method: 'BANK' as const, status: 'approved' as const, version: 4, created_by: 'admin', reviewed_by: 'accounting', approved_by: 'manager', review_notes: null, decision_notes: 'Disetujui untuk realisasi', events: [], payment_summary: { paid_amount: '400000.00', remaining_amount: '600000.00', status: 'PARTIAL' as const } };
const mount = () => render(<QueryClientProvider client={client}><MemoryRouter><AccountingPaymentRunPage /></MemoryRouter></QueryClientProvider>);

beforeEach(() => {
  vi.clearAllMocks(); client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(voucherApi.outlets).mockResolvedValue(envelope([{ id: 'outlet-1', code: 'CELL-T3', name: 'Cellular T3', divisionCode: 'CELL' }]));
  vi.mocked(voucherApi.list).mockResolvedValue(envelope({ items: [record], total: 1, current_page: 1, last_page: 1 }));
  vi.mocked(dashboardApi.operations).mockResolvedValue(envelope({ month: '2026-10', as_of: '2026-10-10T10:00:00+07:00', total: 1, counts: { draft: 0, correction: 0, submitted: 0, pending_approval: 0, approved: 1 }, approved_amount: '1000000.00', paid_amount: '400000.00', remaining_amount: '600000.00', unpaid_count: 1, partial_count: 1, paid_count: 0, overdue_count: 1, due_vouchers: [] }));
});
afterEach(() => { cleanup(); client.clear(); });

describe('Payment Run Finance', () => {
  it('menampilkan prioritas, sisa, jatuh tempo, dan jalur realisasi dari database', async () => {
    mount();
    expect(await screen.findByRole('heading', { name: 'Payment Run' })).toBeInTheDocument();
    expect(await screen.findByText('VCH-UAT-01')).toBeInTheDocument();
    expect(screen.getByText('Mendesak')).toBeInTheDocument();
    expect(screen.getAllByText(/Rp\s?600.000,00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lewat jatuh tempo').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /Catat realisasi/ })).toHaveAttribute('href', expect.stringContaining('voucher=' + record.id));
    expect(screen.getByText(/tidak mengirim dana/)).toBeInTheDocument();
  });

  it('filter lunas tidak membuat transaksi baru atau angka palsu', async () => {
    mount(); await screen.findByText('VCH-UAT-01');
    fireEvent.click(screen.getByRole('button', { name: 'Lunas' }));
    expect(screen.getByText('Tidak ada voucher pada filter ini')).toBeInTheDocument();
    expect(voucherApi.list).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
  });
});
