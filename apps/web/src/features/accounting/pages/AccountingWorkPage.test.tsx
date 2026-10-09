import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { omzetApi, type OmzetRecord } from '../../../api/omzet';
import { voucherApi, type VoucherRecord } from '../../../api/vouchers';
import AccountingWorkPage from './AccountingWorkPage';

const identity = vi.hoisted(() => ({ role: 'ADMIN', divisionCode: 'ACC' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: identity }) }));
vi.mock('../../../api/omzet', () => ({ omzetApi: { list: vi.fn(), outlets: vi.fn() } }));
vi.mock('../../../api/vouchers', () => ({ voucherApi: { list: vi.fn() } }));
const envelope = <T,>(data: T) => ({ data, meta: { trace_id: 'work-test' } });
const fixture: OmzetRecord = {
  id: '11111111-1111-4111-8111-111111111111', outlet_id: 'outlet-1', outlet_name: 'Outlet anonim', source_division_code: 'CELL', business_date: '2026-10-04', shift: '1', outlet_amount: '1000.00', cash_amount: '1000', qris_amount: '0', edc_amount: '0', transfer_amount: '0', other_amount: '0', expense_amount: '0', expected_deposit_amount: '1000.00', shift_total: null, shift_difference: null, shift_breakdown: [], source_reference: 'Sumber anonim', notes: '', requires_ap: false, status: 'correction', version: 2, received_amount: '1000', payment_difference: '0', ap_amount: null, ap_difference: null, review_notes: 'Perbaiki rincian tunai', decision_notes: null, events: [], unlock_requests: [], submission_window: { opens_at: '2026-10-05T00:00:00+07:00', deadline: '2026-10-05T23:59:59+07:00', can_submit: false, can_request_unlock: true, has_permit: false },
};
let client: QueryClient;
const mount = (route = '/accounting/dokumen/register') => render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[route]}><AccountingWorkPage /></MemoryRouter></QueryClientProvider>);
beforeEach(() => {
  vi.clearAllMocks(); identity.role = 'ADMIN'; identity.divisionCode = 'ACC';
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(omzetApi.outlets).mockResolvedValue(envelope([{ id: 'outlet-1', code: 'CELL1', name: 'Outlet anonim', divisionCode: 'CELL' }]));
  vi.mocked(omzetApi.list).mockImplementation(async filter => envelope({ items: [{ ...fixture, status: filter.status as OmzetRecord['status'] }], total: 47, current_page: Number(filter.page), last_page: 3, summary: { validated_count: 0, outlet_amount: '0', received_amount: '0', ap_difference: '0' } }));
  vi.mocked(voucherApi.list).mockResolvedValue(envelope({ items: [], total: 0, current_page: 1, last_page: 1 }));
});
afterEach(() => { cleanup(); client.clear(); });
describe('Ruang kerja Accounting dari transaksi persisten', () => {
  it('Admin diarahkan ke koreksi, alasan dan laporan yang sama; total tidak memakai panjang halaman', async () => {
    mount();
    expect(await screen.findByRole('heading', { name: 'Register dokumen Accounting' })).toBeInTheDocument();
    expect(await screen.findByText('Perbaiki rincian tunai')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lengkapi dan ajukan/ })).toHaveAttribute('href', expect.stringContaining('rekap=' + fixture.id));
    expect(screen.getByText('47 laporan · halaman 1 dari 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Perlu koreksi/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: 'Buat rekap' })).toHaveAttribute('href', expect.stringContaining('new=1'));
  });
  it('Staff Accounting membuka pemeriksaan tanpa tombol input Admin', async () => {
    identity.role = 'ACCOUNTING'; mount();
    expect(await screen.findByRole('link', { name: /Periksa laporan/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Buat rekap' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Menunggu pemeriksaan/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('link', { name: /Tinjau keputusan/ })).not.toBeInTheDocument();
  });
  it('Manager menerima antrean keputusan, bukan pemeriksaan Staff', async () => {
    identity.role = 'MANAGER'; mount();
    expect(await screen.findByRole('link', { name: /Tinjau keputusan/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Buat rekap' })).not.toBeInTheDocument();
  });
  it('filter mengubah API dan mengembalikan pagination ke halaman pertama', async () => {
    mount(); fireEvent.click(await screen.findByRole('button', { name: 'Berikutnya' }));
    await waitFor(() => expect(omzetApi.list).toHaveBeenCalledWith(expect.objectContaining({ page: '2', status: 'correction' })));
    fireEvent.change(screen.getByLabelText('Periode pekerjaan'), { target: { value: '2026-09' } });
    fireEvent.change(screen.getByLabelText('Outlet pekerjaan'), { target: { value: 'outlet-1' } });
    await waitFor(() => expect(omzetApi.list).toHaveBeenCalledWith({ month: '2026-09', outlet_id: 'outlet-1', status: 'correction', page: '1' }));
    fireEvent.click(screen.getByRole('button', { name: /Selesai diperiksa/ }));
    await waitFor(() => expect(omzetApi.list).toHaveBeenCalledWith(expect.objectContaining({ status: 'validated', page: '1' })));
  });
  it('voucher membuka detail UUID dan tidak menganggap persetujuan sebagai pembayaran', async () => {
    const voucher: VoucherRecord = { id: fixture.id, type: 'OPERATIONAL', outlet_id: fixture.outlet_id, outlet_name: fixture.outlet_name, source_division_code: 'CELL', voucher_date: '2026-09-04', due_date: '2026-10-04', entity_name: 'Penerima anonim', source_reference: 'Anonim', amount: '1000', description: 'Kebutuhan outlet', status: 'approved', version: 1, voucher_no: 'V/ANONIM', created_by: 'admin', reviewed_by: null, approved_by: null, review_notes: null, decision_notes: null, events: [] };
    vi.mocked(voucherApi.list).mockResolvedValue(envelope({ items: [voucher], total: 1, current_page: 1, last_page: 1 }));
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Voucher pengeluaran' }));
    fireEvent.click(await screen.findByRole('button', { name: /Disetujui/ }));
    expect(await screen.findByRole('link', { name: /Lihat hasil/ })).toHaveAttribute('href', expect.stringContaining('voucher=' + fixture.id));
    expect(screen.getByText(/Persetujuan berbeda dari pembayaran/)).toBeInTheDocument();
    expect(screen.queryByText(/batas .*WIB/)).not.toBeInTheDocument();
  });
  it('request gagal tetap error dan tidak membuat jumlah nol palsu', async () => {
    vi.mocked(omzetApi.list).mockRejectedValue(new Error('Tidak dapat memuat antrean'));
    mount(); expect(await screen.findByText('Tidak dapat memuat antrean')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Perlu koreksi Gagal/ })).toBeInTheDocument();
    expect(screen.queryByText(/0 laporan/)).not.toBeInTheDocument();
  });
});

it('mengembalikan konteks voucher, periode, status dan halaman dari URL', async () => {
  mount('/accounting/dokumen/register?kind=voucher&month=2026-09&status=submitted&page=2&outlet=outlet-1');
  await waitFor(() => expect(voucherApi.list).toHaveBeenCalledWith({ month: '2026-09', status: 'submitted', page: '2', outlet_id: 'outlet-1', type: '' }));
  expect(screen.getByLabelText('Periode pekerjaan')).toHaveValue('2026-09');
  expect(screen.getByRole('button', { name: 'Voucher pengeluaran' })).toHaveAttribute('aria-pressed', 'true');
});

it('Finance membuka dokumen voucher disetujui tanpa tombol input atau keputusan', async () => {
  identity.role = 'FINANCE'; mount();
  await waitFor(() => expect(voucherApi.list).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' })));
  expect(screen.getByRole('button', { name: 'Voucher pengeluaran' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByRole('link', { name: 'Buat voucher' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Tinjau keputusan/ })).not.toBeInTheDocument();
});
