import { voucherApi } from '../../../api/vouchers';
import { dashboardApi } from '../api/dashboard';
import { omzetApi } from '../../../api/omzet';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { accountingApi } from '../../../api/accounting';
import AccountingDashboardPage from './AccountingDashboardPage';

let role = 'HEAD_OPS';
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role, divisionCode: 'ACC' } }) }));

const operations = { month: '2026-08', as_of: '2026-08-07T12:00:00+07:00', total: 8, counts: { draft: 1, correction: 1, submitted: 1, pending_approval: 1, approved: 4 }, approved_amount: '2020001.00', paid_amount: '1350000.75', remaining_amount: '670000.25', unpaid_count: 3, partial_count: 1, paid_count: 1, overdue_count: 0, due_vouchers: [] };
const envelope = <T,>(data: T) => ({ data, meta: { trace_id: 'test' } });
beforeEach(() => {
  vi.spyOn(omzetApi, 'list').mockResolvedValue(envelope({items:[],total:0,current_page:1,last_page:1}) as never);
  vi.spyOn(voucherApi, 'list').mockResolvedValue(envelope({items:[],total:0,current_page:1,last_page:1}) as never);
});
const mount = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AccountingDashboardPage /></MemoryRouter></QueryClientProvider>);
describe('Dashboard ringkasan Accounting', () => {
  beforeEach(() => {
    vi.spyOn(dashboardApi, 'operations').mockResolvedValue(envelope(operations));
    vi.spyOn(omzetApi, 'annual').mockResolvedValue(envelope({ year: 2026, source: 'validated', amount: null, validated_count: 0, pending_count: 0, months: Array.from({length: 12}, (_, i) => ({month: '2026-' + String(i + 1).padStart(2, '0'), amount: null, validated_count: 0, pending_count: 0})), outlets: [] }));
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); role='HEAD_OPS'; });
  it('menampilkan ringkasan tanpa meminta rincian keuangan atau membuka tautannya', async () => {
    const fullReport = vi.spyOn(accountingApi, 'cashflowReport');
    const summary = vi.spyOn(accountingApi, 'cashflowSummary');
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AccountingDashboardPage /></MemoryRouter></QueryClientProvider>);
    await screen.findByRole('region', { name: 'Ringkasan cashflow' });
    expect(screen.getByText('Penerimaan tercatat')).toBeInTheDocument();
    expect(summary).toHaveBeenCalledWith({ period_month: '2026-08' });
    expect(fullReport).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: 'Buka laporan cashflow' })).not.toBeInTheDocument();
  });
  it('Finance melihat pintasan setoran tanpa pintasan data pegawai', async () => {
    role='FINANCE';
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AccountingDashboardPage /></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByRole('link',{name:/Setoran & Penerimaan/})).toHaveAttribute('href','/accounting/kas-bank/setoran');
    expect(screen.queryByRole('link',{name:/Cuti/})).not.toBeInTheDocument();
  });
  it('mengganti periode ringkasan tanpa mengambil detail transaksi', async () => {
    vi.spyOn(accountingApi, 'periods').mockResolvedValue({ data: [
      { id: 'aug', periodMonth: '2026-08', status: 'open', version: 1 },
      { id: 'jul', periodMonth: '2026-07', status: 'open', version: 1 },
    ], meta: { trace_id: 'ui-test' } });
    const summary = vi.spyOn(accountingApi, 'cashflowSummary');
    const details = vi.spyOn(accountingApi, 'cashflowReport');
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AccountingDashboardPage /></MemoryRouter></QueryClientProvider>);
    const picker = await screen.findByRole('combobox', { name: 'Periode ringkasan' });
    await screen.findByRole('region', { name: 'Ringkasan cashflow' });
    fireEvent.change(picker, { target: { value: '2026-07' } });
    await waitFor(() => expect(summary).toHaveBeenCalledWith({ period_month: '2026-07' }));
    expect(details).not.toHaveBeenCalled();
  });
  it('periode kosong tidak menampilkan saldo nol dan tetap membuka pekerjaan sesuai role', async () => {
    role = 'ADMIN';
    vi.spyOn(accountingApi, 'periods').mockResolvedValue({ data: [], meta: { trace_id: 'ui-test' } });
    const summary = vi.spyOn(accountingApi, 'cashflowSummary');
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AccountingDashboardPage /></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByText('Belum ada periode Accounting')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Buka register dokumen/ })).toHaveAttribute('href', '/accounting/dokumen/register');
    expect(screen.queryByRole('region', { name: 'Ringkasan cashflow' })).not.toBeInTheDocument();
    expect(summary).not.toHaveBeenCalled();
  });
  it('gagal memuat periode tetap menyediakan retry dan pintasan pekerjaan', async () => {
    role = 'ADMIN';
    vi.spyOn(accountingApi, 'periods').mockRejectedValueOnce(new Error('Periode gagal dimuat')).mockResolvedValue({ data: [], meta: { trace_id: 'ui-test' } });
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AccountingDashboardPage /></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Buka register dokumen/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }));
    expect(await screen.findByText('Belum ada periode Accounting')).toBeInTheDocument();
  });
});

describe('Pemantauan operasional', () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); role = 'HEAD_OPS'; });
  it('role ringkasan tidak meminta operasi atau tren detail', async () => {
    role = 'HEAD_OPS';
    const ops = vi.spyOn(dashboardApi, 'operations'); const annual = vi.spyOn(omzetApi, 'annual');
    mount(); await screen.findByRole('region', {name: 'Ringkasan cashflow'});
    expect(ops).not.toHaveBeenCalled(); expect(annual).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', {name: 'Ringkasan operasional'})).not.toBeInTheDocument();
  });
  it('Admin melihat antrean dan sisa voucher dari API meskipun belum ada periode jurnal', async () => {
    role = 'ADMIN';
    vi.spyOn(accountingApi, 'periods').mockResolvedValue(envelope([]));
    vi.spyOn(dashboardApi, 'operations').mockResolvedValue(envelope(operations));
    vi.spyOn(omzetApi, 'annual').mockResolvedValue(envelope({year: 2026, source: 'validated', amount: null, validated_count: 0, pending_count: 0, months: [], outlets: []}));
    mount();
    const link = await screen.findByRole('link', {name: /Perbaiki voucher/});
    expect(link.getAttribute('href')).toMatch(/month=\d{4}-\d{2}&status=correction/);
    expect(screen.getByText('Rp 670.000,25')).toBeInTheDocument();
    expect(screen.queryByRole('link', {name: /Persetujuan voucher/})).not.toBeInTheDocument();
    expect(screen.getByText('Belum ada periode Accounting')).toBeInTheDocument();
  });
  it('tren tidak mengubah nominal sen kecil dan drill-down mempertahankan bulan', async () => {
    role = 'FINANCE';
    vi.spyOn(accountingApi, 'periods').mockResolvedValue(envelope([{id:'aug',periodMonth:'2026-08',status:'open',version:1}]));
    vi.spyOn(dashboardApi, 'operations').mockResolvedValue(envelope(operations));
    vi.spyOn(omzetApi, 'annual').mockResolvedValue(envelope({year:2026,source:'validated',amount:'2.01',validated_count:2,pending_count:0,outlets:[],months:[{month:'2026-07',amount:'1.00',validated_count:1,pending_count:0},{month:'2026-08',amount:'1.01',validated_count:1,pending_count:0}]}));
    mount();
    expect(await screen.findByText('Naik Rp 0,01 dibanding bulan sebelumnya')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name:'Juli 2026: Rp 1,00'}));
    await waitFor(() => expect(dashboardApi.operations).toHaveBeenCalledWith('2026-07'));
    expect(await screen.findByRole('link', {name:/Realisasi voucher/})).toHaveAttribute('href','/accounting/pengeluaran/voucher?month=2026-07&status=approved');
    expect(screen.getByText('Belum ada periode jurnal pada bulan ini')).toBeInTheDocument();
  });
});
