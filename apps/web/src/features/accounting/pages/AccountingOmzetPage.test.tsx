import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { omzetApi, type OmzetRecord } from '../../../api/omzet';
import AccountingOmzetPage from './AccountingOmzetPage';

const identity = vi.hoisted(() => ({ role: 'ADMIN' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role: identity.role, divisionCode: 'ACC' } }) }));
vi.mock('../../../api/omzet', () => ({ omzetApi: { outlets: vi.fn(), list: vi.fn(), detail: vi.fn(), save: vi.fn(), action: vi.fn() } }));
const envelope = <T,>(data: T) => ({ data, meta: { trace_id: 'omzet-test' } });
const fixture: OmzetRecord = {
  id: 'rec-1', outlet_id: 'outlet-1', outlet_name: 'Outlet anonim', source_division_code: 'CELL',
  business_date: '2026-10-04', shift: '1', outlet_amount: '1000.00', cash_amount: '1000.00',
  qris_amount: '0', edc_amount: '0', transfer_amount: '0', other_amount: '0',
  expense_amount: '0', expected_deposit_amount: '1000.00', shift_total: '1000.00', shift_difference: '0.00',
  shift_breakdown: [{ shift_no: 1, gross_amount: '1000.00' }],
  source_reference: 'Laporan anonim', notes: '', requires_ap: true, status: 'submitted', version: 2,
  received_amount: '1000.00', payment_difference: '0.00', ap_amount: null, ap_difference: null,
  review_notes: null, decision_notes: null, events: [], unlock_requests: [],
  submission_window: { opens_at: '2026-10-05T00:00:00+07:00', deadline: '2026-10-05T23:59:59+07:00', can_submit: true, can_request_unlock: false, has_permit: false },
};
let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  identity.role = 'ADMIN';
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  vi.mocked(omzetApi.outlets).mockResolvedValue(envelope([{ id: 'outlet-1', code: 'CELL-1', name: 'Outlet anonim', divisionCode: 'CELL' }]));
  vi.mocked(omzetApi.list).mockResolvedValue(envelope({ items: [fixture], total: 1, current_page: 1, last_page: 1, summary: { validated_count: 0, outlet_amount: '0', received_amount: '0', ap_difference: '0' } }));
  vi.mocked(omzetApi.detail).mockResolvedValue(envelope(fixture));
});
afterEach(() => { cleanup(); client.clear(); });
const mount = (route = '/accounting') => render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[route]}><AccountingOmzetPage /></MemoryRouter></QueryClientProvider>);

describe('Alur rekap omzet sesuai role', () => {
  it('Admin menyimpan draf dengan outlet lintas divisi dan rincian pembayaran', async () => {
    const draft = { ...fixture, status: 'draft' as const, version: 1, requires_ap: false };
    vi.mocked(omzetApi.save).mockResolvedValue(envelope(draft));
    vi.mocked(omzetApi.detail).mockResolvedValue(envelope(draft));
    mount();
    await screen.findByText('Outlet anonim');
    fireEvent.click(screen.getByRole('button', { name: 'Buat rekap' }));
    const form = within(screen.getByRole('form', { name: 'Form rekap omzet' }));
    fireEvent.change(form.getByLabelText('Outlet'), { target: { value: 'outlet-1' } });
    fireEvent.change(form.getByLabelText('Tanggal omzet'), { target: { value: '2026-10-04' } });
    fireEvent.change(form.getByLabelText('Shift 1 (Rp)'), { target: { value: '1000' } });
    fireEvent.change(form.getByLabelText('Tunai (Rp)'), { target: { value: '1000' } });
    fireEvent.change(form.getByLabelText('Referensi laporan sumber'), { target: { value: 'Laporan anonim' } });
    fireEvent.click(form.getByRole('button', { name: 'Simpan draf' }));
    await waitFor(() => expect(omzetApi.save).toHaveBeenCalledWith(expect.objectContaining({ outlet_id: 'outlet-1', cash_amount: '1000', outlet_amount: '1000.00', expense_amount: '0', source_reference: 'Laporan anonim', shift_breakdown: expect.arrayContaining([expect.objectContaining({ shift_no: 1, gross_amount: '1000' })]) }), undefined));
    expect(await screen.findByRole('button', { name: 'Ajukan pemeriksaan' })).toBeInTheDocument();
    expect(omzetApi.action).not.toHaveBeenCalled();
  });

  it('Staff Accounting memeriksa AP tanpa mendapat aksi persetujuan Manager', async () => {
    identity.role = 'ACCOUNTING';
    vi.mocked(omzetApi.action).mockResolvedValue(envelope({ ...fixture, status: 'pending_approval', ap_amount: '950', ap_difference: '50', version: 3 }));
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Lihat' }));
    fireEvent.change(await screen.findByLabelText('Omzet laporan Angkasa Pura (Rp)'), { target: { value: '950' } });
    fireEvent.change(screen.getByLabelText('Catatan / alasan tindakan'), { target: { value: 'Selisih laporan AP perlu ditinjau' } });
    fireEvent.click(screen.getByRole('button', { name: 'Validasi rekap' }));
    await waitFor(() => expect(omzetApi.action).toHaveBeenCalledWith(expect.objectContaining({ id: 'rec-1', version: 2 }), 'review', { decision: 'validate', reason: 'Selisih laporan AP perlu ditinjau', ap_amount: '950' }));
    expect(screen.queryByRole('button', { name: 'Setujui rekap dengan selisih' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Buat rekap' })).not.toBeInTheDocument();
  });

  it('Manager membaca rekap dan memperoleh keputusan selisih, tanpa input Admin', async () => {
    identity.role = 'MANAGER';
    vi.mocked(omzetApi.detail).mockResolvedValue(envelope({ ...fixture, status: 'pending_approval' }));
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Lihat' }));
    const approve = await screen.findByRole('button', { name: 'Setujui rekap dengan selisih' });
    expect(approve).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Catatan / alasan tindakan'), { target: { value: 'Bukti selisih sudah diperiksa' } });
    expect(approve).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Buat rekap' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Validasi rekap' })).not.toBeInTheDocument();
  });

  it('rekap tervalidasi tidak menawarkan perubahan kepada Admin', async () => {
    vi.mocked(omzetApi.detail).mockResolvedValue(envelope({ ...fixture, status: 'validated' }));
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Lihat' }));
    await screen.findByRole('heading', { name: 'Riwayat perubahan' });
    expect(screen.queryByRole('button', { name: 'Edit draf' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ajukan pemeriksaan' })).not.toBeInTheDocument();
  });
});

it('drill-down dashboard mempertahankan bulan/status valid dan mengabaikan filter palsu', async () => {
  mount('/accounting?month=2026-07&status=submitted');
  await waitFor(() => expect(omzetApi.list).toHaveBeenCalledWith(expect.objectContaining({ month: '2026-07', status: 'submitted' })));
  cleanup(); client.clear(); vi.mocked(omzetApi.list).mockClear();
  mount('/accounting?month=2026-13&status=paid');
  await waitFor(() => expect(omzetApi.list).toHaveBeenCalledWith(expect.objectContaining({ status: '' })));
  expect(vi.mocked(omzetApi.list).mock.calls[0]![0].month).not.toBe('2026-13');
});

it('tautan antrean membuka UUID rekap langsung; UUID palsu tidak memicu detail', async () => {
  const id = '11111111-1111-4111-8111-111111111111';
  mount('/accounting/pendapatan/rekap?rekap=' + id);
  await waitFor(() => expect(omzetApi.detail).toHaveBeenCalledWith(id));
  cleanup(); client.clear(); vi.mocked(omzetApi.detail).mockClear();
  mount('/accounting/pendapatan/rekap?rekap=private-path');
  await screen.findByRole('button', { name: 'Lihat' });
  expect(omzetApi.detail).not.toHaveBeenCalled();
});
it('tautan buat membuka form draf hanya untuk Admin', async () => {
  mount('/accounting/pendapatan/rekap?new=1');
  expect(await screen.findByRole('form', { name: 'Form rekap omzet' })).toBeInTheDocument();
  cleanup(); client.clear(); identity.role = 'ACCOUNTING';
  mount('/accounting/pendapatan/rekap?new=1');
  await screen.findByRole('button', { name: 'Lihat' });
  expect(screen.queryByRole('form', { name: 'Form rekap omzet' })).not.toBeInTheDocument();
});
