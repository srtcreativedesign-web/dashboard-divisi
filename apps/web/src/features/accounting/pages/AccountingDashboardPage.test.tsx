import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { accountingApi } from '../../../api/accounting';
import AccountingDashboardPage from './AccountingDashboardPage';

let role = 'HEAD_OPS';
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role, divisionCode: 'ACC' } }) }));

describe('Dashboard ringkasan Accounting', () => {
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
    expect(await screen.findByRole('link',{name:/Rekap Setoran/})).toHaveAttribute('href','/accounting/setoran');
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
    expect(screen.getByRole('link', { name: /Rekap Omzet H\+1/ })).toHaveAttribute('href', '/accounting/omzet');
    expect(screen.queryByRole('region', { name: 'Ringkasan cashflow' })).not.toBeInTheDocument();
    expect(summary).not.toHaveBeenCalled();
  });
  it('gagal memuat periode tetap menyediakan retry dan pintasan pekerjaan', async () => {
    role = 'ADMIN';
    vi.spyOn(accountingApi, 'periods').mockRejectedValueOnce(new Error('Periode gagal dimuat')).mockResolvedValue({ data: [], meta: { trace_id: 'ui-test' } });
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AccountingDashboardPage /></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Voucher Pengeluaran/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }));
    expect(await screen.findByText('Belum ada periode Accounting')).toBeInTheDocument();
  });
});
