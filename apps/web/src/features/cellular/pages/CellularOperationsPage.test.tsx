import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CellularOperationsPage from './CellularOperationsPage';
import { cellularApi, type Sale } from '../api';

const auth = vi.hoisted(() => ({ role: 'ADMIN' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role: auth.role, divisionCode: 'CELL' } }) }));
vi.mock('../api', () => ({ cellularApi: { products: vi.fn(), outlets: vi.fn(), stock: vi.fn(), movements: vi.fn(), sales: vi.fn(), createProduct: vi.fn(), adjust: vi.fn(), sell: vi.fn(), voidSale: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
function renderPage(role: string, rows: Sale[] = [], path = '/cellular/produk') {
  auth.role = role;
  vi.mocked(cellularApi.products).mockResolvedValue({ data: [{ id: 'p', sku: 'SIM-1', name: 'Kartu uji', kind: 'SIM_CARD', provider: 'Provider uji', variant: '10GB' }], meta: { trace_id: 't' } });
  vi.mocked(cellularApi.outlets).mockResolvedValue({ data: [{ id: 'o', code: 'CELL-1', name: 'Outlet uji' }], meta: { trace_id: 't' } });
  vi.mocked(cellularApi.stock).mockResolvedValue({ data: [], meta: { trace_id: 't' } });
  vi.mocked(cellularApi.movements).mockResolvedValue({ data: [], meta: { trace_id: 't' } });
  vi.mocked(cellularApi.sales).mockResolvedValue({ data: rows, meta: { trace_id: 't' } });
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}><MemoryRouter initialEntries={[path]}><CellularOperationsPage /></MemoryRouter></QueryClientProvider>);
}
describe('Operasional Cellular', () => {
  it('membuka halaman kerja sesuai route menu Cellular', async () => {
    renderPage('ADMIN', [], '/cellular/penjualan');
    expect(await screen.findByRole('heading', { name: 'Penjualan Cellular' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Catat penjualan' })).toBeInTheDocument();
  });
  it('menyembunyikan laporan finansial dan form mutasi dari reader operasional', async () => {
    renderPage('LEADER');
    expect(await screen.findByText('Kartu uji')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Penjualan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Tambah produk' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stok & mutasi' }));
    expect(screen.queryByRole('form', { name: 'Catat mutasi stok' })).not.toBeInTheDocument();
    expect(cellularApi.sales).not.toHaveBeenCalled();
  });
  it('menyimpan harga desimal sebagai string dan mempertahankan input penjualan saat gagal', async () => {
    vi.mocked(cellularApi.sell).mockRejectedValueOnce(new Error('Stok tidak mencukupi.')).mockResolvedValueOnce({ data: [], meta: { trace_id: 't' } });
    renderPage('ADMIN');
    await screen.findByText('Kartu uji');
    fireEvent.click(screen.getByRole('button', { name: 'Penjualan' }));
    fireEvent.change(screen.getByLabelText('Produk'), { target: { value: 'p' } });
    fireEvent.change(screen.getByLabelText('Outlet'), { target: { value: 'o' } });
    fireEvent.change(screen.getByLabelText('Jumlah terjual'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Harga per unit (Rp)'), { target: { value: '0.10' } });
    fireEvent.change(screen.getByLabelText('Referensi laporan manual'), { target: { value: 'JUAL-1' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Catat penjualan' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Stok tidak mencukupi.');
    expect(screen.getByLabelText('Harga per unit (Rp)')).toHaveValue('0.10');
    expect(screen.queryByText('Data berhasil disimpan.')).not.toBeInTheDocument();
    expect(cellularApi.sell).toHaveBeenCalledWith(expect.objectContaining({ quantity: 3, unit_price: '0.10', reference: 'JUAL-1' }));
    fireEvent.submit(screen.getByRole('form', { name: 'Catat penjualan' }));
    expect(await screen.findByText('Data berhasil disimpan.')).toBeInTheDocument();
    expect(screen.getByLabelText('Referensi laporan manual')).toHaveValue('');
  });
  it('memberikan Gudang form stok tanpa penjualan atau katalog tulis', async () => {
    renderPage('ADMIN_GUDANG');
    await screen.findByText('Kartu uji');
    fireEvent.click(screen.getByRole('button', { name: 'Stok & mutasi' }));
    expect(screen.getByRole('form', { name: 'Catat mutasi stok' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Penjualan' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Belum ada mutasi stok.')).toBeInTheDocument());
  });
});

it('akun tanpa capability tidak meminta data Cellular', () => {
 renderPage('UNKNOWN'); expect(screen.getByRole('alert')).toHaveTextContent('Akses operasional Cellular tidak tersedia');
 for (const call of [cellularApi.products,cellularApi.outlets,cellularApi.stock,cellularApi.movements,cellularApi.sales]) expect(call).not.toHaveBeenCalled();
});
it('mengunci konteks dan menolak submit berulang saat produk sedang disimpan', async () => {
 vi.mocked(cellularApi.createProduct).mockImplementation(()=>new Promise(()=>{})); renderPage('ADMIN'); await screen.findByText('Kartu uji');
 fireEvent.change(screen.getByLabelText('SKU'),{target:{value:'UJI-2'}}); fireEvent.change(screen.getByLabelText('Nama produk'),{target:{value:'Produk anonim'}});
 const form=screen.getByRole('form',{name:'Tambah produk'}); fireEvent.submit(form); await waitFor(()=>expect(cellularApi.createProduct).toHaveBeenCalledOnce());
 expect(screen.getByRole('button',{name:'Stok & mutasi'})).toBeDisabled(); expect(screen.getByLabelText('SKU')).toBeDisabled();
 fireEvent.submit(form); expect(cellularApi.createProduct).toHaveBeenCalledOnce();
});
it('perubahan bulan atau tab menutup pembatalan penjualan sebelumnya', async()=>{
 const sale:Sale={id:'s',outlet_id:'o',outlet_name:'Outlet uji',product_name:'Kartu uji',business_date:'2026-10-07',quantity:1,unit_price:'0.10',total_amount:'0.10',source_reference:'JUAL-1',status:'posted',version:1,void_reason:null};
 renderPage('MANAGER',[sale]); await screen.findByText('Kartu uji'); fireEvent.click(screen.getByRole('button',{name:'Penjualan'}));
 fireEvent.click(await screen.findByRole('button',{name:'Batalkan penjualan JUAL-1'})); expect(screen.getByRole('form',{name:'Batalkan penjualan'})).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Bulan laporan'),{target:{value:'2026-09'}}); expect(screen.queryByRole('form',{name:'Batalkan penjualan'})).not.toBeInTheDocument();
 fireEvent.click(await screen.findByRole('button',{name:'Batalkan penjualan JUAL-1'})); fireEvent.click(screen.getByRole('button',{name:'Stok & mutasi'})); fireEvent.click(screen.getByRole('button',{name:'Penjualan'}));
 expect(screen.queryByRole('form',{name:'Batalkan penjualan'})).not.toBeInTheDocument(); expect(cellularApi.voidSale).not.toHaveBeenCalled();
});
