import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
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
});
