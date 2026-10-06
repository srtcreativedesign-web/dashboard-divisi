import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { voucherApi, type VoucherRecord } from '../../../api/vouchers';
import AccountingVoucherPage from './AccountingVoucherPage';

const identity = vi.hoisted(() => ({ id: 'creator', role: 'ADMIN' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { id: identity.id, role: identity.role, divisionCode: 'ACC' } }) }));
vi.mock('../../../api/vouchers', () => ({ voucherApi: { outlets: vi.fn(), list: vi.fn(), detail: vi.fn(), save: vi.fn(), action: vi.fn(), attach: vi.fn(), downloadAttachment: vi.fn() } }));
const envelope = <T,>(data: T) => ({ data, meta: { trace_id: 'voucher-test' } });
const fixture: VoucherRecord = {
  id: 'voucher-1', voucher_no: 'VCH-TEST', type: 'BILLING', outlet_id: 'outlet-1', outlet_name: 'Outlet anonim',
  source_division_code: 'CELL', voucher_date: '2026-10-05', due_date: '2026-10-20', entity_name: 'Penerbit anonim',
  source_reference: 'INV-TEST', amount: '1000.50', description: 'Tagihan anonim untuk pengujian', status: 'draft',
  version: 1, created_by: 'creator', reviewed_by: null, approved_by: null, review_notes: null, decision_notes: null, events: [],
};
let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks(); identity.id = 'creator'; identity.role = 'ADMIN';
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  vi.mocked(voucherApi.outlets).mockResolvedValue(envelope([{ id: 'outlet-1', code: 'CELL-1', name: 'Outlet anonim', divisionCode: 'CELL' }]));
  vi.mocked(voucherApi.list).mockResolvedValue(envelope({ items: [fixture], total: 1, current_page: 1, last_page: 1 }));
  vi.mocked(voucherApi.detail).mockResolvedValue(envelope(fixture));
});
afterEach(() => { cleanup(); client.clear(); });
const mount = () => render(<QueryClientProvider client={client}><AccountingVoucherPage /></QueryClientProvider>);
const open = async () => { fireEvent.click(await screen.findByRole('button', { name: 'Lihat' })); await screen.findByRole('heading', { name: 'Riwayat voucher' }); };

describe('Alur voucher sesuai peran', () => {
  it('Admin mengunggah lampiran pada versi voucher yang tampil lalu dapat mengunduh hasilnya', async () => {
    const file = new File(['anonim'], 'tagihan.pdf', { type: 'application/pdf' });
    const attachment = { id: 'attachment-1', original_name: 'tagihan.pdf', mime_type: 'application/pdf', size_bytes: 10, sha256: '', uploaded_by: 'creator', created_at: '' };
    vi.mocked(voucherApi.attach).mockResolvedValue(envelope({ ...fixture, version: 2, attachments: [attachment] }));
    vi.mocked(voucherApi.downloadAttachment).mockResolvedValue(undefined);
    mount(); await open();
    fireEvent.change(screen.getByLabelText('Berkas tagihan atau bukti'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Unggah lampiran' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Unduh tagihan.pdf' }));
    await waitFor(() => expect(voucherApi.downloadAttachment).toHaveBeenCalledWith(expect.objectContaining({ version: 2 }), attachment));
    expect(voucherApi.attach).toHaveBeenCalledWith(expect.objectContaining({ version: 1 }), file);
  });
  it('Manager hanya dapat mengunduh lampiran, tanpa unggah pada voucher pending', async () => {
    identity.role = 'MANAGER'; identity.id = 'manager';
    vi.mocked(voucherApi.detail).mockResolvedValue(envelope({ ...fixture, status: 'pending_approval' }));
    mount(); await open();
    expect(screen.queryByLabelText('Berkas tagihan atau bukti')).not.toBeInTheDocument();
  });
  it('Admin menyimpan draf pembelian tanpa langsung mengajukan atau menyetujui', async () => {
    vi.mocked(voucherApi.save).mockResolvedValue(envelope(fixture));
    mount(); await screen.findByText('Outlet anonim');
    fireEvent.click(screen.getByRole('button', { name: 'Buat voucher' }));
    const form = within(screen.getByRole('form', { name: 'Form voucher' }));
    for (const [label, value] of [['Jenis voucher', 'PURCHASING'], ['Outlet sumber', 'outlet-1'], ['Tanggal voucher', '2026-10-05'], ['Jatuh tempo', '2026-10-20'], ['Penerima pembayaran', 'Pemasok anonim'], ['Referensi tagihan / permintaan', 'REQ-TEST'], ['Nominal voucher (Rp)', '1000.50'], ['Rincian tagihan / barang', 'Pembelian sepuluh barang anonim']] as const) {
      fireEvent.change(form.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(form.getByRole('button', { name: 'Simpan draf' }));
    await waitFor(() => expect(voucherApi.save).toHaveBeenCalledWith(expect.objectContaining({ type: 'PURCHASING', amount: '1000.50', outlet_id: 'outlet-1', source_reference: 'REQ-TEST' }), undefined));
    expect(await screen.findByRole('button', { name: 'Ajukan pemeriksaan' })).toBeInTheDocument();
    expect(voucherApi.action).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Setujui voucher' })).not.toBeInTheDocument();
  });

  it('Staff Accounting wajib mencatat pemeriksaan sebelum meneruskan ke Manager', async () => {
    identity.role = 'ACCOUNTING'; identity.id = 'reviewer';
    vi.mocked(voucherApi.detail).mockResolvedValue(envelope({ ...fixture, status: 'submitted', version: 2 }));
    vi.mocked(voucherApi.action).mockResolvedValue(envelope({ ...fixture, status: 'pending_approval', reviewed_by: 'reviewer', version: 3 }));
    mount(); await open();
    const forward = screen.getByRole('button', { name: 'Teruskan ke Manager' });
    expect(forward).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Catatan pemeriksaan / keputusan'), { target: { value: 'Rincian dan dokumen telah diperiksa' } });
    fireEvent.click(forward);
    await waitFor(() => expect(voucherApi.action).toHaveBeenCalledWith(expect.objectContaining({ version: 2 }), 'review', { decision: 'validate', reason: 'Rincian dan dokumen telah diperiksa' }));
    expect(screen.queryByRole('button', { name: 'Buat voucher' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Setujui voucher' })).not.toBeInTheDocument();
  });

  it('Manager menyetujui voucher dan hasil persetujuan ditampilkan sebagai terkunci', async () => {
    identity.role = 'MANAGER'; identity.id = 'manager';
    vi.mocked(voucherApi.detail).mockResolvedValue(envelope({ ...fixture, status: 'pending_approval', reviewed_by: 'reviewer', version: 3 }));
    vi.mocked(voucherApi.action).mockResolvedValue(envelope({ ...fixture, status: 'approved', approved_by: 'manager', reviewed_by: 'reviewer', version: 4 }));
    mount(); await open();
    const approve = screen.getByRole('button', { name: 'Setujui voucher' });
    expect(approve).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Catatan pemeriksaan / keputusan'), { target: { value: 'Kebutuhan dan nominal telah disetujui' } });
    fireEvent.click(approve);
    await waitFor(() => expect(voucherApi.action).toHaveBeenCalledWith(expect.objectContaining({ version: 3 }), 'decide', { decision: 'approve', reason: 'Kebutuhan dan nominal telah disetujui' }));
    expect(await screen.findByText('Voucher disetujui dan terkunci. Status ini belum menyatakan pembayaran selesai.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit draf' })).not.toBeInTheDocument();
  });

  it('Admin lain tidak memperoleh aksi edit maupun pengajuan voucher milik orang lain', async () => {
    identity.id = 'other-admin'; mount(); await open();
    expect(screen.queryByRole('button', { name: 'Edit draf' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ajukan pemeriksaan' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Muat ulang voucher' })).toBeInTheDocument();
  });

  it('konflik versi ditampilkan dan voucher tetap belum disetujui', async () => {
    identity.role = 'MANAGER'; identity.id = 'manager';
    vi.mocked(voucherApi.detail).mockResolvedValue(envelope({ ...fixture, status: 'pending_approval', reviewed_by: 'reviewer', version: 3 }));
    vi.mocked(voucherApi.action).mockRejectedValue(new Error('Voucher sudah berubah. Muat ulang sebelum melanjutkan.'));
    mount(); await open();
    fireEvent.change(screen.getByLabelText('Catatan pemeriksaan / keputusan'), { target: { value: 'Dokumen telah ditinjau kembali' } });
    fireEvent.click(screen.getByRole('button', { name: 'Setujui voucher' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Voucher sudah berubah');
    expect(screen.getByRole('button', { name: 'Muat ulang voucher' })).toBeEnabled();
    expect(screen.queryByText('Voucher disetujui dan terkunci. Status ini belum menyatakan pembayaran selesai.')).not.toBeInTheDocument();
  });
});
