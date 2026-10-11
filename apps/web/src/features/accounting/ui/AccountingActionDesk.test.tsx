import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { omzetApi } from '../../../api/omzet';
import { voucherApi } from '../../../api/vouchers';
import { AccountingActionDesk } from './AccountingActionDesk';
let role = 'ACCOUNTING';
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { id: 'user', role, divisionCode: 'ACC' } }) }));
const mount = () => render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><AccountingActionDesk month="2026-10" /></MemoryRouter></QueryClientProvider>);
afterEach(() => { cleanup(); vi.restoreAllMocks(); role = 'ACCOUNTING'; });
describe('Meja kerja transaksi Accounting', () => {
  it('role ringkasan tidak meminta daftar transaksi', () => {
    role = 'HEAD_OPS'; const omzet = vi.spyOn(omzetApi,'list'); const vouchers = vi.spyOn(voucherApi,'list'); mount();
    expect(omzet).not.toHaveBeenCalled(); expect(vouchers).not.toHaveBeenCalled();
    expect(screen.queryByRole('region',{name:'Meja kerja Accounting'})).not.toBeInTheDocument();
  });
  it('Accounting memeriksa omzet/voucher dan tautan menjaga UUID, periode serta sen', async () => {
    vi.spyOn(omzetApi,'list').mockResolvedValue({data:{items:[],total:0,current_page:1,last_page:1},meta:{trace_id:'test'}} as never);
    vi.spyOn(voucherApi,'list').mockResolvedValue({data:{items:[{id:'voucher-id',source_reference:'AP-01',outlet_name:'Outlet T3',source_division_code:'CELL',voucher_date:'2026-10-07',amount:'360000.25',entity_name:'Tagihan outlet',description:'Perlengkapan'}],total:31,current_page:1,last_page:2},meta:{trace_id:'test'}} as never);
    mount(); await waitFor(() => expect(screen.getByRole('button',{name:/Periksa voucher/})).toHaveAttribute('aria-pressed','true'));
    expect(await screen.findByText('Rp 360.000,25')).toBeInTheDocument();
    expect(screen.getByRole('link',{name:'Periksa voucher'})).toHaveAttribute('href','/accounting/pengeluaran/voucher?month=2026-10&voucher=voucher-id');
    expect(screen.queryByRole('link',{name:/Buat voucher/})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));
    await waitFor(() => expect(voucherApi.list).toHaveBeenCalledWith(expect.objectContaining({status:'submitted',page:'2'})));
  });
  it('gagal memuat tidak menyatakan antrean selesai atau kosong dan dapat dicoba ulang', async () => {
    vi.spyOn(omzetApi,'list').mockRejectedValue(new Error('Sumber belum tersedia'));
    vi.spyOn(voucherApi,'list').mockResolvedValue({data:{items:[],total:0,current_page:1,last_page:1},meta:{trace_id:'test'}} as never);
    mount(); expect(await screen.findByText('Sumber belum tersedia')).toBeInTheDocument();
    expect(screen.queryByText('Antrean ini belum memiliki dokumen')).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Coba Lagi'})).toBeInTheDocument();
  });
  it('Finance melihat status lunas tanpa mengklaim seluruh approved sebagai tunggakan', async () => {
    role='FINANCE'; const omzet = vi.spyOn(omzetApi,'list');
    vi.spyOn(voucherApi,'list').mockResolvedValue({data:{items:[{id:'paid-id',source_reference:'LUNAS-01',outlet_name:'Outlet',source_division_code:'PROJECT',voucher_date:'2026-10-07',amount:'50000.00',entity_name:'Penerima',payment_summary:{status:'PAID'}}],total:1,current_page:1,last_page:1},meta:{trace_id:'test'}} as never);
    mount(); expect(await screen.findByText(/Lunas · persetujuan terpisah/)).toBeInTheDocument();
    expect(omzet).not.toHaveBeenCalled(); expect(screen.queryByRole('button',{name:/Periksa omzet/})).not.toBeInTheDocument();
  });
});
