import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cellularApi, type CellularAnalytics } from '../api';
import CellularAnalyticsPage from './CellularAnalyticsPage';

const response = <T,>(data: T) => ({ data, meta: { trace_id: 'analytics-test' } });
const report: CellularAnalytics = {
  period: '2026-10', kpis: { sales: '150000.00', units: 2, ecsys_entered: '140000.00', variance: '10000.00', exception_days: 1 },
  coverage: { outlets: 1, sales_days: 1, closing_days: 1, ecsys_days: 1, ecsys_batches: 1 },
  sources: { sales: true, closing: true, settlement: true, ecsys: true },
  outlets: [{ outlet_id: 'outlet-1', outlet_name: 'Cellular T3', sales: '150000.00', units: 2, closing: '150000.00', settled_net: '149000.00', ecsys_entered: '140000.00', ecsys_net: '127272.73', ecsys_days: 1, variance: '10000.00' }],
  providers: [{ provider: 'Telkomsel', sales: '150000.00', units: 2 }],
  daily: [{ outlet_id: 'outlet-1', outlet_name: 'Cellular T3', business_date: '2026-10-10', sales: '150000.00', units: 2, closing: '150000.00', closing_status: 'approved', settled_net: '149000.00', fee: '1000.00', ecsys_gross: '150000.00', ecsys_net: '127272.73', ecsys_entered: '140000.00', ecsys_realization: '140000.00', ecsys_validation: 'valid', variance: '10000.00', reconciliation_status: 'variance' }],
};

function renderPage() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}><MemoryRouter><CellularAnalyticsPage /></MemoryRouter></QueryClientProvider>);
}

describe('Kinerja dan Rekonsiliasi Cellular', () => {
  beforeEach(() => {
    vi.spyOn(cellularApi, 'outlets').mockResolvedValue(response([{ id: 'outlet-1', code: 'T3', name: 'Cellular T3' }]));
    vi.spyOn(cellularApi, 'analytics').mockResolvedValue(response(report));
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('menjelaskan selisih lintas sumber dan menyediakan drill-down', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Kinerja dan Rekonsiliasi Cellular' })).toBeInTheDocument();
    expect(screen.getAllByText(/10\.000/).length).toBeGreaterThan(0);
    expect(screen.getByText(/bukan otomatis dianggap laba/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Periksa' }));
    expect(screen.getByRole('dialog', { name: 'Detail rekonsiliasi harian' })).toBeInTheDocument();
    expect(screen.getByText(/Status closing:/)).toBeInTheDocument();
  });

  it('menampilkan sumber yang belum tersedia tanpa menggantinya dengan angka nol', async () => {
    vi.mocked(cellularApi.analytics).mockResolvedValue(response({ ...report, kpis: { ...report.kpis, ecsys_entered: null, variance: null }, sources: { ...report.sources, ecsys: false }, coverage: { ...report.coverage, ecsys_days: 0, ecsys_batches: 0 }, daily: [{ ...report.daily[0]!, ecsys_entered: null, variance: null, reconciliation_status: 'incomplete' }] }));
    renderPage();
    expect(await screen.findAllByText('Belum tersedia')).not.toHaveLength(0);
    expect(screen.getByText('Belum ada sumber periode ini')).toBeInTheDocument();
    expect(screen.getAllByText('Belum lengkap').length).toBeGreaterThan(0);
  });
});
