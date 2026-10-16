import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cellularApi, type InventoryDocument } from '../api';
import CellularInventoryPage from './CellularInventoryPage';

const session = vi.hoisted(() => ({ role: 'ADMIN_GUDANG', divisionCode: 'CELL' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: session }) }));
const response = <T,>(data: T) => ({ data, meta: { trace_id: 'inventory-test' } });
const document: InventoryDocument = { id: 'doc-1', document_number: 'CEL-INV-202610-0001', kind: 'RECEIPT', source_outlet_id: null, source_outlet_name: null, destination_outlet_id: 'outlet-1', destination_outlet_name: 'Cellular T3', business_date: '2026-10-10', reference: 'SJ-001', notes: 'Penerimaan kartu perdana Telkomsel.', status: 'submitted', maker_id: 'warehouse-1', reviewer_id: null, review_note: null, version: 2, created_at: '2026-10-10T08:00:00Z', updated_at: '2026-10-10T08:00:00Z', lines: [{ id: 'line-1', product_id: 'product-1', sku: 'TSEL-10', product_name: 'Perdana 10 GB', quantity: 10 }] };

function renderPage() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}><MemoryRouter><CellularInventoryPage /></MemoryRouter></QueryClientProvider>);
}

describe('Kontrol Persediaan Cellular', () => {
  beforeEach(() => {
    session.role = 'ADMIN_GUDANG';
    vi.spyOn(cellularApi, 'inventoryCatalog').mockResolvedValue(response({ products: [{ id: 'product-1', sku: 'TSEL-10', name: 'Perdana 10 GB', kind: 'SIM_CARD', provider: 'Telkomsel', variant: '10 GB', is_active: true, version: 1, stock_quantity: 10, stock_locations: 1 }], outlets: [{ id: 'outlet-1', code: 'T3', name: 'Cellular T3' }], balances: [{ id: 'stock-1', product_id: 'product-1', outlet_id: 'outlet-1', sku: 'TSEL-10', name: 'Perdana 10 GB', quantity: 10, version: 1 }] }));
    vi.spyOn(cellularApi, 'inventoryDocuments').mockResolvedValue(response([document]));
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('memberi Admin Gudang pembuatan dokumen tanpa hak persetujuan', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Kontrol Persediaan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buat dokumen/ })).toBeInTheDocument();
    expect(await screen.findByText('CEL-INV-202610-0001')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Setujui/ })).not.toBeInTheDocument();
  });

  it('memberi Manager antrean persetujuan tanpa form pembuat', async () => {
    session.role = 'MANAGER';
    renderPage();
    expect(await screen.findByRole('button', { name: /Setujui/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Koreksi/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Buat dokumen/ })).not.toBeInTheDocument();
  });

  it('memfilter register berdasarkan nomor, referensi, outlet, dan jenis dokumen', async () => {
    renderPage();
    expect(await screen.findByText('CEL-INV-202610-0001')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Cari dokumen persediaan'), { target: { value: 'Cellular T3' } });
    expect(screen.getByText('1 dari 1 dokumen')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Filter jenis dokumen'), { target: { value: 'TRANSFER' } });
    expect(screen.getByText('Dokumen tidak ditemukan')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Filter jenis dokumen'), { target: { value: 'RECEIPT' } });
    fireEvent.change(screen.getByLabelText('Cari dokumen persediaan'), { target: { value: 'SJ-001' } });
    expect(screen.getByText('CEL-INV-202610-0001')).toBeInTheDocument();
  });

  it('memfilter posisi stok berdasarkan produk, outlet, dan kondisi', async () => {
    renderPage();
    expect(await screen.findByText('TSEL-10')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Cari posisi stok'), { target: { value: 'Cellular T3' } });
    expect(screen.getByText('1 dari 1 posisi')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Filter kondisi stok'), { target: { value: 'critical' } });
    expect(screen.getByText('Posisi stok tidak ditemukan')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Filter kondisi stok'), { target: { value: 'available' } });
    expect(screen.getByText('TSEL-10')).toBeInTheDocument();
  });
});
