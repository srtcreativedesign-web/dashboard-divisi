import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cellularApi, type DailyClosing } from '../api';
import CellularWorkspacePage from './CellularWorkspacePage';

const session = vi.hoisted(() => ({ role: 'ADMIN', divisionCode: 'CELL' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: session }) }));

const response = <T,>(data: T) => ({ data, meta: { trace_id: 'cellular-workspace-test' } });
const closing = (status: DailyClosing['status'], id: string): DailyClosing => ({
  id,
  outlet_id: 'outlet-1',
  business_date: '2026-10-03',
  shift_code: `SHIFT-${id}`,
  system_sales: '1500000.00',
  cash: '1000000.00',
  qris: '500000.00',
  edc: '0.00',
  transfer: '0.00',
  difference: status === 'correction' ? '100000.00' : '0.00',
  source_reference: `REF-${id}`,
  status,
  review_note: status === 'correction' ? 'Periksa bukti QRIS' : null,
  version: 1,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/cellular/pekerjaan']}><CellularWorkspacePage /></MemoryRouter></QueryClientProvider>);
}

describe('Antrean Kerja Cellular', () => {
  beforeEach(() => {
    session.role = 'ADMIN';
    vi.spyOn(cellularApi, 'outlets').mockResolvedValue(response([{ id: 'outlet-1', code: 'CELL-A', name: 'Outlet Uji' }]));
    vi.spyOn(cellularApi, 'products').mockResolvedValue(response([{ id: 'product-1', sku: 'SIM-10', name: 'Perdana 10 GB', kind: 'SIM_CARD', provider: 'Telkomsel', variant: '10 GB' }]));
    vi.spyOn(cellularApi, 'stock').mockResolvedValue(response([{ id: 'stock-1', outlet_id: 'outlet-1', product_id: 'product-1', sku: 'SIM-10', name: 'Perdana 10 GB', quantity: 2, version: 1 }]));
    vi.spyOn(cellularApi, 'movements').mockResolvedValue(response([]));
    vi.spyOn(cellularApi, 'sales').mockResolvedValue(response([{ id: 'sale-1', outlet_id: 'outlet-1', outlet_name: 'Outlet Uji', product_name: 'Perdana 10 GB', business_date: '2026-10-03', quantity: 2, unit_price: '750000.00', total_amount: '1500000.00', source_reference: 'SALE-1', status: 'posted', version: 1, void_reason: null }]));
    vi.spyOn(cellularApi, 'dailyClosings').mockResolvedValue(response([
      closing('draft', 'DRAFT'),
      closing('submitted', 'SUBMITTED'),
      closing('validated', 'VALIDATED'),
      closing('approved', 'APPROVED'),
      closing('correction', 'CORRECTION'),
    ]));
  });

  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('menampilkan draf dan koreksi sebagai tindakan Admin', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Antrean Kerja Cellular' })).toBeInTheDocument();
    expect(screen.getByText('Prioritas untuk Admin Cellular')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Perbaiki/ })).toHaveAttribute('href', '/cellular/penerimaan');
    expect(screen.getByRole('link', { name: /Tinjau dan ajukan/ })).toHaveAttribute('href', '/cellular/penerimaan');
    expect(screen.queryByRole('link', { name: /Putuskan/ })).not.toBeInTheDocument();
  });

  it('menampilkan pengajuan sebagai antrean Accounting', async () => {
    session.role = 'ACCOUNTING';
    renderPage();
    expect(await screen.findByText('Prioritas untuk Accounting')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Periksa/ })).toHaveAttribute('href', '/cellular/penerimaan');
    expect(screen.queryByRole('link', { name: /Perbaiki/ })).not.toBeInTheDocument();
  });

  it('menampilkan hasil validasi sebagai keputusan Manager', async () => {
    session.role = 'MANAGER';
    renderPage();
    expect(await screen.findByText('Prioritas untuk Manager')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Putuskan/ })).toHaveAttribute('href', '/cellular/penerimaan');
  });

  it('menampilkan stok kritis sebagai pekerjaan Admin Gudang tanpa meminta data penjualan', async () => {
    session.role = 'ADMIN_GUDANG';
    renderPage();
    expect(await screen.findByText('Prioritas untuk Admin Gudang')).toBeInTheDocument();
    expect(screen.getByText('SIM-10 · Perdana 10 GB')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Catat mutasi/ })).toHaveAttribute('href', '/cellular/persediaan');
    expect(cellularApi.sales).not.toHaveBeenCalled();
  });
});
