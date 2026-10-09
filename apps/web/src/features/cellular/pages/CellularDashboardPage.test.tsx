import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cellularApi } from '../api';
import CellularDashboardPage from './CellularDashboardPage';

const session = vi.hoisted(() => ({ role: 'MANAGER', divisionCode: 'CELL' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: session }) }));

const response = <T,>(data: T) => ({ data, meta: { trace_id: 'cellular-dashboard-test' } });
function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><CellularDashboardPage /></MemoryRouter></QueryClientProvider>);
}

describe('Pusat Kendali Cellular', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    session.role = 'MANAGER';
    vi.spyOn(cellularApi, 'outlets').mockResolvedValue(response([{ id: 'outlet-1', code: 'CELL-A', name: 'Outlet Cellular Uji' }]));
    vi.spyOn(cellularApi, 'products').mockResolvedValue(response([
      { id: 'product-1', sku: 'SIM-10', name: 'Perdana 10 GB', kind: 'SIM_CARD', provider: 'Telkomsel', variant: '10 GB' },
      { id: 'product-2', sku: 'ACC-01', name: 'Kabel Data', kind: 'ACCESSORY', provider: null, variant: null },
    ]));
    vi.spyOn(cellularApi, 'stock').mockResolvedValue(response([
      { id: 'stock-1', outlet_id: 'outlet-1', product_id: 'product-1', sku: 'SIM-10', name: 'Perdana 10 GB', quantity: 4, version: 1 },
      { id: 'stock-2', outlet_id: 'outlet-1', product_id: 'product-2', sku: 'ACC-01', name: 'Kabel Data', quantity: 20, version: 1 },
    ]));
    vi.spyOn(cellularApi, 'movements').mockResolvedValue(response([
      { id: 'move-1', outlet_id: 'outlet-1', sku: 'SIM-10', name: 'Perdana 10 GB', quantity_delta: -2, quantity_after: 4, kind: 'SALE', created_at: '2026-10-03T08:00:00+07:00' },
    ]));
    vi.spyOn(cellularApi, 'sales').mockResolvedValue(response([
      { id: 'sale-1', outlet_id: 'outlet-1', outlet_name: 'Outlet Cellular Uji', product_name: 'Perdana 10 GB', business_date: '2026-10-03', quantity: 2, unit_price: '750000.00', total_amount: '1500000.00', source_reference: 'REF-1', status: 'posted', version: 1, void_reason: null },
    ]));
    vi.spyOn(cellularApi, 'dailyClosings').mockResolvedValue(response([
      { id: 'close-1', outlet_id: 'outlet-1', business_date: '2026-10-03', shift_code: 'SHIFT-1', system_sales: '1500000.00', cash: '1500000.00', qris: '0.00', edc: '0.00', transfer: '0.00', difference: '0.00', source_reference: 'CLOSE-1', status: 'validated', review_note: null, version: 1 },
    ]));
  });

  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('menampilkan ringkasan penjualan, stok kritis, performa outlet, dan aktivitas dari API', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Pusat Kendali Cellular' })).toBeInTheDocument();
    expect(screen.getByText('Meja Manager')).toBeInTheDocument();
    expect(screen.getAllByText(/1\.500\.000/).length).toBeGreaterThan(0);
    expect(screen.getByText('SIM-10 · Perdana 10 GB')).toBeInTheDocument();
    expect(screen.getAllByText('Outlet Cellular Uji').length).toBeGreaterThan(0);
    expect(screen.getByText('Penjualan · SIM-10')).toBeInTheDocument();
    expect(screen.getByText('Tindakan penerimaan saya')).toBeInTheDocument();
    expect(screen.getAllByText('Menunggu Manager')).toHaveLength(2);
  });

  it('menyesuaikan isi untuk role tanpa akses penjualan dan tidak meminta endpoint sales', async () => {
    session.role = 'SPV';
    renderPage();
    expect(await screen.findByText('Ringkasan Operasional')).toBeInTheDocument();
    expect(screen.getByText('Outlet aktif')).toBeInTheDocument();
    expect(screen.getByText('Komposisi katalog')).toBeInTheDocument();
    expect(cellularApi.sales).not.toHaveBeenCalled();
  });

  it('menampilkan kegagalan API tanpa membentuk angka pengganti', async () => {
    vi.mocked(cellularApi.products).mockRejectedValue(new Error('Katalog tidak tersedia'));
    renderPage();
    expect(await screen.findByText('Dashboard Cellular gagal dimuat')).toBeInTheDocument();
    expect(screen.getByText('Katalog tidak tersedia')).toBeInTheDocument();
    expect(screen.queryByText('Omzet tercatat')).not.toBeInTheDocument();
  });
});
