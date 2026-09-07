import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TenantRevenuePage from './TenantRevenuePage';
import { AuthProvider } from '../session/AuthContext';
import { sobathrApi, type TenantRecordDto } from '../api/sobathr';

const MOCK_TENANTS: TenantRecordDto[] = [
  { id: 'TNT-001', name: 'Wrapping Master Outlet 1', division: 'WRAP', category: 'Wrapping', location: 'Lantai 1 - A01', monthlyRevenue: 125000000, monthlyTarget: 100000000, status: 'Over Target', growth: +14.2 },
  { id: 'TNT-002', name: 'Cellular Flagship Store', division: 'CELL', category: 'Cellular', location: 'Lantai 1 - A05', monthlyRevenue: 310000000, monthlyTarget: 280000000, status: 'Over Target', growth: +11.1 },
  { id: 'TNT-003', name: 'Refleksi Family Wellness', division: 'REFL', category: 'Refleksi', location: 'Lantai 2 - B12', monthlyRevenue: 98000000, monthlyTarget: 95000000, status: 'On Track', growth: +5.1 },
];

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantRevenuePage />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('TenantRevenuePage - Integrasi Sobat API & Scoping', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(sobathrApi, 'syncTenants').mockResolvedValue({
      data: {
        provider: 'Sobat API',
        source: 'LIVE_SOBAT_API',
        total_tenants: 3,
        synced_at: '2026-09-03T07:00:00Z',
        tenants: MOCK_TENANTS,
      },
      meta: { trace_id: 'test' },
      links: { self: '' },
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('merender judul dan memuat tenant dari API secara otomatis (MANAGER WRAP)', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'MANAGER');
    localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

    renderWithProviders();

    // Judul muncul saat render
    expect(screen.getByText('Rincian Omset Tenant')).toBeDefined();

    // Tunggu data dari auto-fetch muncul
    await waitFor(() => {
      expect(screen.getAllByText('Wrapping Master Outlet 1').length).toBeGreaterThanOrEqual(1);
    });

    // Tenant divisi lain tidak terlihat
    expect(screen.queryByText('Cellular Flagship Store')).toBeNull();
  });

  it('menampilkan banner error fail-closed saat sinkronisasi gagal', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'MANAGER');
    localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

    const qc = new (await import('@tanstack/react-query')).QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { render: _render } = await import('@testing-library/react');
    const { QueryClientProvider } = await import('@tanstack/react-query');
    const { AuthProvider } = await import('../session/AuthContext');
    const TenantRevenuePage = (await import('./TenantRevenuePage')).default;

    vi.spyOn(sobathrApi, 'syncTenants').mockRejectedValue(
      new Error('Gagal berkomunikasi dengan upstream API Sobat (timeout).'),
    );

    _render(
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <TenantRevenuePage />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Gagal memuat data tenant/i)).toBeDefined();
    }, { timeout: 5000 });
  });

  it('BOD melihat scope lintas 7 divisi dan header yang benar', () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'BOD');
    localStorage.removeItem('dashboard-divisi.division-demo');

    renderWithProviders();

    expect(screen.getByText(/Analisis Kontribusi Omset Tenant 7 Divisi/i)).toBeDefined();
    expect(screen.getByText(/Lintas 7 Divisi \(BOD\)/i)).toBeDefined();
  });

  it('menampilkan banner alert ketika Sobat API belum terkonfigurasi (UNCONFIGURED)', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'MANAGER');
    localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

    vi.spyOn(sobathrApi, 'getStatus').mockResolvedValue({
      data: {
        provider: 'Sobat API',
        configured: false,
        status: 'UNCONFIGURED',
        base_url: null,
        has_api_key: false,
        has_company_id: false,
        last_sync: null,
        scheduler: 'MANUAL_ONLY',
      },
      meta: { trace_id: 'test-trace' },
      links: { self: '/api/v1/sobathr/status' },
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/Integrasi Sobat API belum dikonfigurasi/i)).toBeDefined();
    });
  });

  it('menampilkan spinner loading saat data sedang dimuat', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'MANAGER');
    localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

    // Make fetch hang so we can check the loading state
    let resolveFetch!: () => void;
    vi.spyOn(sobathrApi, 'syncTenants').mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = () => resolve({
          data: { provider: 'Sobat API', source: 'LIVE_SOBAT_API', total_tenants: 0, synced_at: '', tenants: [] },
          meta: { trace_id: '' },
          links: { self: '' },
        });
      }),
    );

    renderWithProviders();

    expect(screen.getByText(/Memuat data tenant dari Sobat API/i)).toBeDefined();
    resolveFetch();
  });

});
