import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CellularOperationsPage from './CellularOperationsPage';
import { cellularApi, type Movement, type Sale, type Stock } from '../api';

const auth = vi.hoisted(() => ({ role: 'ADMIN' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role: auth.role, divisionCode: 'CELL' } }) }));
vi.mock('../api', () => ({ cellularApi: { products: vi.fn(), outlets: vi.fn(), stock: vi.fn(), movements: vi.fn(), movementRegister: vi.fn(), sales: vi.fn(), createProduct: vi.fn(), updateProduct: vi.fn(), adjust: vi.fn(), sell: vi.fn(), voidSale: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
function renderPage(role: string, rows: Sale[] = [], path = '/cellular/produk', movementRows: Movement[] = [], stockRows: Stock[] = []) {
  auth.role = role;
  vi.mocked(cellularApi.products).mockResolvedValue({ data: [{ id: 'p', sku: 'SIM-1', name: 'Kartu uji', kind: 'SIM_CARD', provider: 'Provider uji', variant: '10GB', is_active: true, version: 1, stock_quantity: 2, stock_locations: 1, updated_at: '2026-10-10T03:00:00Z' }], meta: { trace_id: 't' } });
  vi.mocked(cellularApi.outlets).mockResolvedValue({ data: [{ id: 'o', code: 'CELL-1', name: 'Outlet uji' }], meta: { trace_id: 't' } });
  vi.mocked(cellularApi.stock).mockResolvedValue({ data: stockRows, meta: { trace_id: 't' } });
  vi.mocked(cellularApi.movements).mockResolvedValue({ data: movementRows, meta: { trace_id: 't' } });
  vi.mocked(cellularApi.movementRegister).mockResolvedValue({ data: movementRows, meta: { trace_id: 't' } });
  vi.mocked(cellularApi.sales).mockResolvedValue({ data: rows, meta: { trace_id: 't' } });
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}><MemoryRouter initialEntries={[path]}><CellularOperationsPage /></MemoryRouter></QueryClientProvider>);
}
describe('Operasional Cellular', () => {
  it('membuka halaman kerja sesuai route menu Cellular', async () => {
    renderPage('ADMIN', [], '/cellular/penjualan');
    expect(await screen.findByRole('heading', { name: 'Penjualan Cellular' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Register penjualan' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Catat penjualan' }));
    expect(screen.getByRole('form', { name: 'Catat penjualan' })).toBeInTheDocument();
  });
  it('memfilter register penjualan berdasarkan pencarian dan status', async () => {
    const posted: Sale = { id: 'posted', outlet_id: 'o', outlet_name: 'Outlet T3', product_name: 'Kartu Telkomsel', business_date: '2026-10-07', quantity: 1, unit_price: '10000', total_amount: '10000', source_reference: 'REF-POSTED', status: 'posted', version: 1, void_reason: null };
    const voided: Sale = { ...posted, id: 'voided', outlet_name: 'Outlet T2', product_name: 'Kartu Indosat', source_reference: 'REF-VOID', status: 'voided', void_reason: 'Salah pencatatan outlet' };
    renderPage('MANAGER', [posted, voided], '/cellular/penjualan');
    expect(await screen.findByText('REF-POSTED')).toBeInTheDocument();
    expect(screen.getByText('REF-VOID')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Cari transaksi penjualan'), { target: { value: 'Indosat' } });
    expect(screen.queryByText('REF-POSTED')).not.toBeInTheDocument();
    expect(screen.getByText('REF-VOID')).toBeInTheDocument();
    expect(screen.getByText('1 dari 2 transaksi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Status penjualan'), { target: { value: 'posted' } });
    expect(screen.getByText('Penjualan tidak ditemukan')).toBeInTheDocument();
  });
  it('menyembunyikan laporan finansial dan form mutasi dari reader operasional', async () => {
    renderPage('LEADER');
    expect(await screen.findByText('Kartu uji')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Penjualan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tambah produk' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stok & mutasi' }));
    expect(screen.queryByRole('form', { name: 'Catat mutasi stok' })).not.toBeInTheDocument();
    expect(cellularApi.sales).not.toHaveBeenCalled();
  });
  it('menyimpan harga desimal sebagai string dan mempertahankan input penjualan saat gagal', async () => {
    vi.mocked(cellularApi.sell).mockRejectedValueOnce(new Error('Stok tidak mencukupi.')).mockResolvedValueOnce({ data: [], meta: { trace_id: 't' } });
    renderPage('ADMIN');
    await screen.findByText('Kartu uji');
    fireEvent.click(screen.getByRole('button', { name: 'Penjualan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Catat penjualan' }));
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
    expect(screen.queryByRole('form', { name: 'Catat penjualan' })).not.toBeInTheDocument();
  });
  it('mencegah posting jika jumlah melampaui stok outlet', async () => {
    const balance: Stock = { id: 'b', outlet_id: 'o', product_id: 'p', sku: 'SIM-1', name: 'Kartu uji', quantity: 2, version: 1 };
    renderPage('ADMIN', [], '/cellular/penjualan', [], [balance]);
    await screen.findByRole('button', { name: 'Catat penjualan' });
    fireEvent.click(screen.getByRole('button', { name: 'Catat penjualan' }));
    fireEvent.change(screen.getByLabelText('Produk'), { target: { value: 'p' } });
    fireEvent.change(screen.getByLabelText('Outlet'), { target: { value: 'o' } });
    fireEvent.change(screen.getByLabelText('Jumlah terjual'), { target: { value: '3' } });
    expect(screen.getByRole('alert')).toHaveTextContent('melebihi stok tersedia');
    expect(screen.getByRole('button', { name: 'Posting penjualan' })).toBeDisabled();
    expect(cellularApi.sell).not.toHaveBeenCalled();
  });
  it('memberikan Gudang form stok tanpa penjualan atau katalog tulis', async () => {
    renderPage('ADMIN_GUDANG');
    await screen.findByText('Kartu uji');
    fireEvent.click(screen.getByRole('button', { name: 'Stok & mutasi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Catat mutasi' }));
    expect(screen.getByRole('form', { name: 'Catat mutasi stok' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Penjualan' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Mutasi tidak ditemukan')).toBeInTheDocument());
  });
  it('menampilkan buku persediaan yang dapat ditelusuri ke bukti sumber', async () => {
    const movement: Movement = { id: 'm1', product_id: 'p', outlet_id: 'o', sku: 'SIM-1', name: 'Kartu uji', provider: 'Provider uji', variant: '10GB', quantity_delta: 10, quantity_after: 10, kind: 'ADJUSTMENT', reference: 'SJ-001', reason: 'Penerimaan dari pemasok utama', source_key: 'hash', source_document_type: 'Bukti eksternal', source_document_id: null, actor_id: 'user-1', created_at: '2026-10-10T03:00:00Z' };
    renderPage('ADMIN_GUDANG', [], '/cellular/persediaan', [movement]);
    await waitFor(() => expect(screen.getByText('SJ-001')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Lihat mutasi SJ-001' }));
    const dialog = screen.getByRole('dialog', { name: 'Detail mutasi persediaan' });
    expect(dialog).toHaveTextContent('Penerimaan dari pemasok utama');
    expect(within(dialog).getAllByText('Bukti eksternal').length).toBeGreaterThan(0);
  });
});

it('akun tanpa capability tidak meminta data Cellular', () => {
 renderPage('UNKNOWN'); expect(screen.getByRole('alert')).toHaveTextContent('Akses operasional Cellular tidak tersedia');
 for (const call of [cellularApi.products,cellularApi.outlets,cellularApi.stock,cellularApi.movements,cellularApi.sales]) expect(call).not.toHaveBeenCalled();
});
it('mengunci konteks dan menolak submit berulang saat produk sedang disimpan', async () => {
 vi.mocked(cellularApi.createProduct).mockImplementation(()=>new Promise(()=>{})); renderPage('ADMIN'); await screen.findByText('Kartu uji');
 fireEvent.click(screen.getByRole('button',{name:'Tambah produk'}));
 fireEvent.change(screen.getByLabelText('SKU'),{target:{value:'UJI-2'}}); fireEvent.change(screen.getByLabelText('Nama produk'),{target:{value:'Produk anonim'}});
 const form=screen.getByRole('form',{name:'Tambah produk'}); fireEvent.submit(form); await waitFor(()=>expect(cellularApi.createProduct).toHaveBeenCalledOnce());
 expect(screen.getByRole('button',{name:'Stok & mutasi'})).toBeDisabled(); expect(screen.getByLabelText('SKU')).toBeDisabled();
 fireEvent.submit(form); expect(cellularApi.createProduct).toHaveBeenCalledOnce();
});
it('membuka detail produk dan menyimpan koreksi dengan versi serta alasan', async () => {
 vi.mocked(cellularApi.updateProduct).mockResolvedValue({ data: {} as never, meta: { trace_id: 't' } }); renderPage('MANAGER');
 await screen.findByText('Kartu uji'); fireEvent.click(screen.getByRole('button',{name:'Buka produk SIM-1'}));
 expect(screen.getByRole('dialog',{name:'Kartu uji'})).toHaveTextContent('2 unit');
 fireEvent.click(screen.getByRole('button',{name:'Ubah produk'}));
 const form=screen.getByRole('form',{name:'Ubah produk'}); fireEvent.change(screen.getByLabelText('Nama produk'),{target:{value:'Kartu uji revisi'}});
 fireEvent.change(screen.getByLabelText('Alasan perubahan'),{target:{value:'Perbaikan nama dari dokumen master'}}); fireEvent.submit(form);
 await waitFor(()=>expect(cellularApi.updateProduct).toHaveBeenCalledWith(expect.objectContaining({id:'p',version:1}),expect.objectContaining({name:'Kartu uji revisi',change_reason:'Perbaikan nama dari dokumen master'})));
});
it('perubahan bulan atau tab menutup pembatalan penjualan sebelumnya', async()=>{
 const sale:Sale={id:'s',outlet_id:'o',outlet_name:'Outlet uji',product_name:'Kartu uji',business_date:'2026-10-07',quantity:1,unit_price:'0.10',total_amount:'0.10',source_reference:'JUAL-1',status:'posted',version:1,void_reason:null};
 renderPage('MANAGER',[sale]); await screen.findByText('Kartu uji'); fireEvent.click(screen.getByRole('button',{name:'Penjualan'}));
 fireEvent.click(await screen.findByRole('button',{name:'Buka'})); fireEvent.click(screen.getByRole('button',{name:'Batalkan transaksi'})); expect(screen.getByRole('form',{name:'Batalkan penjualan'})).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Bulan laporan'),{target:{value:'2026-09'}}); expect(screen.queryByRole('form',{name:'Batalkan penjualan'})).not.toBeInTheDocument();
 fireEvent.click(await screen.findByRole('button',{name:'Buka'})); fireEvent.click(screen.getByRole('button',{name:'Batalkan transaksi'})); fireEvent.click(screen.getByRole('button',{name:'Stok & mutasi'})); fireEvent.click(screen.getByRole('button',{name:'Penjualan'}));
 expect(screen.queryByRole('form',{name:'Batalkan penjualan'})).not.toBeInTheDocument(); expect(cellularApi.voidSale).not.toHaveBeenCalled();
});
