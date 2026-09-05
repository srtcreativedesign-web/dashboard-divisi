import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../session/AuthContext';
import { ToastProvider } from '../components/ui/Toast';
import TenantRevenuePage from './TenantRevenuePage';
import CashflowPage from './CashflowPage';
import PnlPage from './PnlPage';
import DailyReportPage from './DailyReportPage';
import AccountingMasterPage from './AccountingMasterPage';
import { sobathrApi, type TenantRecordDto } from '../api/sobathr';

const MOCK_REAL_TENANTS: TenantRecordDto[] = [
  {
    id: 'TNT-001',
    name: 'Wrapping Outlet Terminal 3 CGK',
    division: 'WRAP',
    category: 'Wrapping',
    location: 'Bandara CGK T3 Gate 4',
    monthlyRevenue: 300000000,
    monthlyTarget: 300000000,
    status: 'On Track',
    growth: 10.5,
  },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe('Multi-Module Timeframe Filtering (Real Data, Multi-Period)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(sobathrApi, 'syncTenants').mockResolvedValue({
      data: {
        provider: 'Sobat API',
        source: 'LIVE_SOBAT_API',
        total_tenants: 1,
        synced_at: '2026-09-03T07:00:00Z',
        tenants: MOCK_REAL_TENANTS,
      },
      meta: { trace_id: 'test' },
      links: { self: '' },
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('1. TenantRevenuePage: Menyesuaikan omzet tenant Sobat secara proporsional sesuai timeframe', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'MANAGER');
    localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/tenants?period=month']}>
            <TenantRevenuePage />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );

    // Tunggu syncTenants dipanggil
    await waitFor(() => {
      expect(sobathrApi.syncTenants).toHaveBeenCalled();
    });

    // Tunggu data tenant muncul
    await waitFor(() => {
      expect(screen.getAllByText(/Wrapping Outlet Terminal 3 CGK/i).length).toBeGreaterThanOrEqual(1);
    });

    // Default bulan ini: 300 Jt
    expect(screen.getByText('Total Omset Tenant (Bulan Ini)')).toBeInTheDocument();
    expect(screen.getAllByText(/300\.000\.000/i).length).toBeGreaterThan(0);

    // Ganti filter ke 7 Hari
    const btn7d = screen.getByTestId('btn-tenant-period-7d');
    fireEvent.click(btn7d);

    // Nilai 7 hari: 300 Jt * 7/30 = 70.000.000
    expect(screen.getByText('Total Omset Tenant (7 Hari Terakhir)')).toBeInTheDocument();
    expect(screen.getAllByText(/70\.000\.000/i).length).toBeGreaterThan(0);

    // Ganti filter ke YTD (9 bulan): 300 Jt * 9 = 2.700.000.000
    const btnYtd = screen.getByTestId('btn-tenant-period-ytd');
    fireEvent.click(btnYtd);

    expect(screen.getByText('Total Omset Tenant (Setahun (YTD))')).toBeInTheDocument();
    expect(screen.getAllByText(/2\.700\.000\.000/i).length).toBeGreaterThan(0);
  });

  it('2. CashflowPage: Menghitung arus kas masuk & keluar dari data riil Excel sesuai timeframe', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/cashflow?period=month']}>
            <CashflowPage />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );

    // Default bulan ini: 5.050.891.572
    expect(screen.getByText('Kas Masuk (Bulan Ini)')).toBeInTheDocument();
    expect(screen.getAllByText(/5\.050\.891\.572/i).length).toBeGreaterThan(0);

    // Ganti ke 7 hari: 5.050.891.572 * 7 / 30 = 1.178.541.367
    const btn7d = screen.getByTestId('btn-cashflow-period-7d');
    fireEvent.click(btn7d);

    expect(screen.getByText('Kas Masuk (7 Hari Terakhir)')).toBeInTheDocument();
    expect(screen.getAllByText(/1\.178\.541\.367/i).length).toBeGreaterThan(0);

    // Ganti ke Setahun (YTD): 5.050.891.572 * 9 = 45.458.024.148
    const btnYtd = screen.getByTestId('btn-cashflow-period-ytd');
    fireEvent.click(btnYtd);

    expect(screen.getByText('Kas Masuk (Setahun (YTD))')).toBeInTheDocument();
    expect(screen.getAllByText(/45\.458\.024\.149/i).length).toBeGreaterThan(0);
  });

  it('3. PnlPage: Menghitung laporan laba rugi resmi dari data riil Excel sesuai timeframe', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/pnl?period=month']}>
            <PnlPage />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );

    // Default bulan ini: 5.050.891.572
    expect(screen.getByText('Gross Revenue (Bulan Ini)')).toBeInTheDocument();
    expect(screen.getAllByText(/5\.050\.891\.572/i).length).toBeGreaterThan(0);

    // Ganti ke 7 Hari
    const btn7d = screen.getByTestId('btn-pnl-period-7d');
    fireEvent.click(btn7d);

    expect(screen.getByText('Gross Revenue (7 Hari Terakhir)')).toBeInTheDocument();
    expect(screen.getAllByText(/1\.178\.541\.367/i).length).toBeGreaterThan(0);
  });

  it('4. DailyReportPage: Memiliki tombol filter rentang tanggal pada tabel dan tidak memakai filter deret waktu di modal input', () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'BOD');
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/daily-report']}>
            <DailyReportPage />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );

    // Tombol filter tanggal di tabel riwayat tersedia
    expect(screen.getByTestId('btn-daily-filter-all')).toBeInTheDocument();
    expect(screen.getByTestId('btn-daily-filter-today')).toBeInTheDocument();
    expect(screen.getByTestId('btn-daily-filter-7d')).toBeInTheDocument();
    expect(screen.getByTestId('btn-daily-filter-month')).toBeInTheDocument();

    // Klik filter hari ini
    fireEvent.click(screen.getByTestId('btn-daily-filter-today'));
    expect(screen.getByTestId('btn-daily-filter-today')).toHaveClass('bg-primary');
  });

  it('5. AccountingMasterPage: Halaman Master Data tidak memiliki filter timeframe rentang waktu', () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
    localStorage.setItem('dashboard-divisi.division-demo', 'ACC');
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={['/accounting/master']}>
              <AccountingMasterPage />
            </MemoryRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>,
    );

    // Verifikasi master data bersih tanpa filter rentang waktu
    expect(screen.queryByText(/Filter Rentang Waktu/i)).toBeNull();
    expect(screen.queryByTestId('btn-tenant-period-7d')).toBeNull();
    expect(screen.queryByTestId('btn-cashflow-period-7d')).toBeNull();
  });
});
