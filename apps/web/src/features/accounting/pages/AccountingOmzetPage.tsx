import { Link, useSearchParams } from 'react-router-dom';
import { formatRupiah as rupiah, formatDate } from '../ui/format';
import { StatusBadge } from '../ui/StatusBadge';
import { WorkflowGuide } from '../ui/WorkflowGuide';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { omzetApi, type OmzetInput, type OmzetRecord } from '../../../api/omzet';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { DetailSheet } from '../../../components/ui/DetailSheet';
import { Button } from '../../../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../../../components/states';

const statusLabels = { draft: 'Draf', submitted: 'Menunggu pemeriksaan', correction: 'Perlu koreksi', pending_approval: 'Menunggu Manager', validated: 'Tervalidasi' };
const amountFields = [['outlet_amount', 'Omzet laporan outlet'], ['cash_amount', 'Tunai'], ['qris_amount', 'QRIS'], ['edc_amount', 'EDC'], ['transfer_amount', 'Transfer'], ['other_amount', 'Pembayaran lainnya']] as const;
const localDate = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)!.value).join('-');
};
const emptyInput = (): OmzetInput => ({ outlet_id: '', business_date: '', shift: '', outlet_amount: '0', cash_amount: '0', qris_amount: '0', edc_amount: '0', transfer_amount: '0', other_amount: '0', requires_ap: false, source_reference: '', notes: '' });
const inputClass = 'mt-1 w-full rounded-input border border-line bg-panel px-3 py-2 text-sm';

export default function AccountingOmzetPage() {
  const { user } = useAuth();
  const can = (capability: string) => hasCapability(user?.role ?? '', capability, user?.divisionCode);
  const writer = can('write:omzet');
  const reviewer = can('validate:omzet');
  const approver = can('approve:omzet');
  const unlockApprover = can('manage:omzet_unlock');
  const client = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialMonth = searchParams.get('month') ?? '';
  const initialStatus = searchParams.get('status') ?? '';
  const [month, setMonth] = useState(/^\d{4}-(0[1-9]|1[0-2])$/.test(initialMonth) ? initialMonth : localDate().slice(0, 7));
  const [outlet, setOutlet] = useState('');
  const [status, setStatus] = useState(["draft","submitted","correction","pending_approval","validated"].includes(initialStatus) ? initialStatus : '');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(() => { const id = searchParams.get('rekap'); return id && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id) ? id : null; });
  const [formOpen, setFormOpen] = useState(() => writer && searchParams.get('new') === '1');
  const [editing, setEditing] = useState<{ id: string; version: number }>();
  const [input, setInput] = useState<OmzetInput>(emptyInput);
  const [reason, setReason] = useState('');
  const [apAmount, setApAmount] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const directory = useQuery({ queryKey: ['omzet', 'outlets'], queryFn: async () => (await omzetApi.outlets()).data });
  const list = useQuery({ queryKey: ['omzet', 'list', month, outlet, status, page], enabled: /^\d{4}-\d{2}$/.test(month), queryFn: async () => (await omzetApi.list({ month, status, outlet_id: outlet, page: String(page) })).data });
  const detail = useQuery({ queryKey: ['omzet', 'detail', selected], enabled: Boolean(selected), queryFn: async () => (await omzetApi.detail(selected!)).data });
  const saved = (record: OmzetRecord) => {
    setSelected(record.id);
    client.setQueryData(['omzet', 'detail', record.id], record);
    void client.invalidateQueries({ queryKey: ['omzet', 'list'] });
    void client.invalidateQueries({ queryKey: ['accounting-work'] });
    setFormOpen(false);
    setReason('');
    setApAmount(record.ap_amount ?? '');
    setFeedback('Rekap berhasil diperbarui.');
    setFailure(null);
  };
  const failed = (error: Error) => { setFailure(error.message); setFeedback(null); };
  const save = useMutation({ mutationFn: () => omzetApi.save(input, editing), onSuccess: response => saved(response.data), onError: failed });
  const action = useMutation({ mutationFn: ({ record, kind, data }: { record: OmzetRecord; kind: string; data?: Parameters<typeof omzetApi.action>[2] }) => omzetApi.action(record, kind, data), onSuccess: response => saved(response.data), onError: failed });
  const busy = save.isPending || action.isPending;
  const open = (id: string) => { setSelected(id); setReason(''); setApAmount(''); setFeedback(null); setFailure(null); };
  const openForm = (record?: OmzetRecord) => {
    setEditing(record ? { id: record.id, version: record.version } : undefined);
    setInput(record ? Object.fromEntries(Object.keys(emptyInput()).map(key => [key, record[key as keyof OmzetInput] ?? ''])) as unknown as OmzetInput : emptyInput());
    setSelected(null); setFormOpen(true); setFailure(null); setFeedback(null);
  };
  const perform = (record: OmzetRecord, kind: string, data?: Parameters<typeof omzetApi.action>[2]) => { setFailure(null); action.mutate({ record, kind, data }); };
  const record = detail.data;
  const editable = record && ['draft', 'correction'].includes(record.status);
  const pendingUnlocks = record?.unlock_requests?.filter(request => request.status === 'pending') ?? [];
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><Link to="/accounting/pekerjaan" className="mb-2 inline-block text-sm font-semibold text-primary-700 dark:text-primary-300">← Ruang kerja Accounting</Link><h1 className="text-2xl font-semibold text-navy">Rekap omzet H+1</h1><p className="mt-2 max-w-3xl text-sm text-subtle">Rekap per outlet dan shift, diperiksa oleh tim Accounting pusat. Pengajuan dibuka pada H+1 hingga pukul 23.59 WIB.</p></div>
      {writer && <Button onClick={() => openForm()}>Buat rekap</Button>}
    </header>
    {feedback && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</p>}
    {failure && !selected && !formOpen && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{failure}</p>}
    <WorkflowGuide kind="omzet" />
    <div className="flex flex-wrap gap-4 rounded-card border border-line bg-panel p-4">
      <label className="text-sm">Bulan<input className={inputClass} type="month" value={month} onChange={event => { setMonth(event.target.value); setPage(1); }} /></label>
      <label className="min-w-52 text-sm">Outlet<select className={inputClass} value={outlet} onChange={event => { setOutlet(event.target.value); setPage(1); }}><option value="">Semua outlet</option>{directory.data?.map(item => <option key={item.id} value={item.id}>{item.name} ({item.divisionCode})</option>)}</select></label>
      <label className="text-sm">Status<select className={inputClass} value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">Semua status</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <Button variant="secondary" onClick={() => { void list.refetch(); void directory.refetch(); }}>Muat ulang</Button>
    </div>
    {directory.error && <ErrorState description={directory.error.message} onRetry={() => void directory.refetch()} />}
    {list.isLoading ? <LoadingState /> : list.error ? <ErrorState description={list.error.message} onRetry={() => void list.refetch()} /> : list.data && <>
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Ringkasan omzet tervalidasi">
        {[[`Omzet tervalidasi (${list.data.summary.validated_count} rekap)`, list.data.summary.outlet_amount], ['Pembayaran tervalidasi', list.data.summary.received_amount], ['Selisih laporan AP', list.data.summary.ap_difference]].map(([label, value]) => <article key={label} className="rounded-card border border-line bg-panel p-4"><p className="text-sm text-subtle">{label}</p><p className="mt-2 text-xl font-semibold">{rupiah(value ?? '0')}</p></article>)}
      </section>
      <p className="text-xs text-subtle">Ringkasan mengikuti bulan dan outlet yang dipilih, hanya mencakup rekap tervalidasi. Selisih AP belum merupakan laba atau jurnal akuntansi.</p>
      {list.data.items.length ? <div className="overflow-x-auto rounded-card border border-line bg-panel"><table className="w-full text-left text-sm"><caption className="p-4 text-left font-semibold">Rekap omzet ({list.data.total})</caption><thead className="bg-surface"><tr>{['Tanggal / shift', 'Outlet', 'Omzet', 'Selisih pembayaran', 'Status', 'Aksi'].map(label => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{list.data.items.map(item => <tr key={item.id} className="border-t border-line"><td className="px-4 py-3 whitespace-nowrap">{formatDate(item.business_date)}<span className="block text-xs text-subtle">Shift {item.shift}</span></td><td className="px-4 py-3">{item.outlet_name}<span className="block text-xs text-subtle">{item.source_division_code}</span></td><td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{rupiah(item.outlet_amount)}</td><td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{rupiah(item.payment_difference)}</td><td className="px-4 py-3"><StatusBadge status={item.status} label={statusLabels[item.status]} /></td><td className="px-4 py-3"><Button variant="secondary" size="sm" onClick={() => open(item.id)}>Lihat</Button></td></tr>)}</tbody></table></div> : <EmptyState title="Belum ada rekap pada filter ini" />}
      <div className="flex items-center justify-between text-sm"><span>Halaman {list.data.current_page} dari {list.data.last_page}</span><div className="flex gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</Button><Button variant="secondary" disabled={page >= list.data.last_page} onClick={() => setPage(page + 1)}>Berikutnya</Button></div></div>
    </>}
    <DetailSheet isOpen={formOpen} onClose={() => !busy && setFormOpen(false)} title={editing ? 'Edit rekap omzet' : 'Buat rekap omzet'}>
      <form aria-label="Form rekap omzet" onSubmit={event => { event.preventDefault(); save.mutate(); }} className="space-y-4">
        {failure && <p role="alert" className="text-sm text-red-700">{failure}</p>}
        <fieldset disabled={busy || !writer || !directory.data?.length} className="space-y-4">
          <label className="block text-sm">Outlet<select className={inputClass} required value={input.outlet_id} onChange={event => setInput({ ...input, outlet_id: event.target.value })}><option value="">Pilih outlet</option>{directory.data?.map(item => <option key={item.id} value={item.id}>{item.name} ({item.divisionCode})</option>)}</select></label>
          <div className="grid grid-cols-2 gap-4"><label className="text-sm">Tanggal omzet<input className={inputClass} required type="date" max={localDate()} value={input.business_date} onChange={event => setInput({ ...input, business_date: event.target.value })} /></label><label className="text-sm">Shift<input className={inputClass} required maxLength={30} value={input.shift} onChange={event => setInput({ ...input, shift: event.target.value })} placeholder="Contoh: 1 atau Pagi" /></label></div>
          {amountFields.map(([key, label]) => <label key={key} className="block text-sm">{label} (Rp)<input className={inputClass} required type="number" min="0" max="999999999999.99" step="0.01" value={input[key]} onChange={event => setInput({ ...input, [key]: event.target.value })} /></label>)}
          <label className="block text-sm">Referensi laporan sumber<input className={inputClass} required maxLength={255} value={input.source_reference} onChange={event => setInput({ ...input, source_reference: event.target.value })} placeholder="Nomor / nama laporan outlet" /></label>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={input.requires_ap} onChange={event => setInput({ ...input, requires_ap: event.target.checked })} />Perlu pencocokan laporan Angkasa Pura</label>
          <label className="block text-sm">Catatan Admin<textarea className={inputClass} maxLength={2000} value={input.notes} onChange={event => setInput({ ...input, notes: event.target.value })} /></label>
          <Button type="submit">{busy ? 'Menyimpan...' : 'Simpan draf'}</Button>
        </fieldset>
        {!directory.data?.length && <p className="text-sm text-subtle">Direktori outlet aktif harus tersedia sebelum rekap dibuat.</p>}
      </form>
    </DetailSheet>
    <DetailSheet isOpen={Boolean(selected)} onClose={() => !busy && setSelected(null)} title="Detail rekap omzet">
      {detail.isLoading ? <LoadingState /> : detail.error ? <ErrorState description={detail.error.message} onRetry={() => void detail.refetch()} /> : record && <div className="space-y-5">
        {failure && <p role="alert" className="text-sm text-red-700">{failure}<Button variant="secondary" onClick={() => void detail.refetch()}>Muat ulang detail</Button></p>}
        <div><h2 className="font-semibold">{record.outlet_name}</h2><p className="mt-1 text-sm">{formatDate(record.business_date)} · Shift {record.shift} · <StatusBadge status={record.status} label={statusLabels[record.status]} /></p><p className="mt-1 text-xs text-subtle">Referensi: {record.source_reference}</p></div>
        <dl className="space-y-2 text-sm">{[...amountFields.map(([key,label]) => [label, rupiah(record[key])]), ['Total pembayaran', rupiah(record.received_amount)], ['Selisih pembayaran', rupiah(record.payment_difference)], ['Laporan AP', record.ap_amount === null ? 'Belum dicocokkan / tidak berlaku' : rupiah(record.ap_amount)], ['Selisih AP', record.ap_difference === null ? '—' : rupiah(record.ap_difference)]].map(([label,value]) => <div key={label} className="flex justify-between gap-4 border-b border-line pb-2"><dt>{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl>
        {record.notes && <p className="text-sm">Catatan Admin: {record.notes}</p>}
        {record.review_notes && <p className="text-sm">Catatan pemeriksaan: {record.review_notes}</p>}
        {record.decision_notes && <p className="text-sm">Keputusan Manager: {record.decision_notes}</p>}
        {writer && editable && <section className="space-y-3 rounded-lg border border-line p-3"><p className="text-sm">Batas pengajuan: {new Date(record.submission_window.deadline).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB.</p><div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={busy} onClick={() => openForm(record)}>Edit draf</Button><Button disabled={busy || !record.submission_window.can_submit} onClick={() => perform(record, 'submit')}>Ajukan pemeriksaan</Button></div>{!record.submission_window.can_submit && <p className="text-xs text-subtle">Pengajuan di luar H+1 memerlukan izin Manager. Izin berlaku satu pengajuan selama 24 jam.</p>}</section>}
        {((writer && editable && record.submission_window.can_request_unlock) || (reviewer && record.status === 'submitted') || (approver && record.status === 'pending_approval') || (unlockApprover && pendingUnlocks.length > 0)) && <label className="block text-sm">Catatan / alasan tindakan<textarea className={inputClass} maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} placeholder="Minimal 10 karakter untuk pengembalian, selisih, dan izin" /></label>}
        {writer && editable && record.submission_window.can_request_unlock && <Button disabled={busy || reason.trim().length < 10 || pendingUnlocks.length > 0 || record.submission_window.has_permit} onClick={() => perform(record, 'request-unlock', { reason })}>Minta izin pengajuan terlambat</Button>}
        {reviewer && record.status === 'submitted' && <section className="space-y-3 rounded-lg border border-line p-3"><h3 className="font-semibold">Pemeriksaan Accounting</h3>{record.requires_ap && <label className="block text-sm">Omzet laporan Angkasa Pura (Rp)<input className={inputClass} type="number" min="0" max="999999999999.99" step="0.01" value={apAmount} onChange={event => setApAmount(event.target.value)} /></label>}<p className="text-xs text-subtle">Selisih memerlukan catatan dan persetujuan Manager. Rekap tanpa selisih langsung tervalidasi.</p><div className="flex flex-wrap gap-2"><Button disabled={busy || (record.requires_ap && apAmount === '')} onClick={() => perform(record, 'review', { decision: 'validate', reason, ...(record.requires_ap ? { ap_amount: apAmount } : {}) })}>Validasi rekap</Button><Button variant="secondary" disabled={busy || reason.trim().length < 10} onClick={() => perform(record, 'review', { decision: 'return', reason })}>Kembalikan untuk koreksi</Button></div></section>}
        {approver && record.status === 'pending_approval' && <section className="space-y-3"><h3 className="font-semibold">Persetujuan selisih</h3><p className="text-xs text-subtle">Persetujuan menyelesaikan pemeriksaan rekap; tidak membuat jurnal atau mengubah selisih menjadi laba.</p><div className="flex gap-2"><Button disabled={busy || reason.trim().length < 10} onClick={() => perform(record, 'decide', { decision: 'approve', reason })}>Setujui rekap dengan selisih</Button><Button variant="secondary" disabled={busy || reason.trim().length < 10} onClick={() => perform(record, 'decide', { decision: 'reject', reason })}>Kembalikan rekap</Button></div></section>}
        {record.unlock_requests?.length > 0 && <section className="space-y-3"><h3 className="font-semibold">Permintaan izin terlambat</h3>{record.unlock_requests.map(request => <article key={request.id} className="rounded-lg border border-line p-3 text-sm"><p>{request.reason}</p><p className="mt-1 text-subtle">{({ pending: 'Menunggu keputusan', approved: 'Disetujui', rejected: 'Ditolak', revoked: 'Dicabut setelah perubahan identitas rekap' } as Record<string,string>)[request.status] ?? request.status}</p>{request.decision_notes && <p>{request.decision_notes}</p>}{unlockApprover && request.status === 'pending' && <div className="mt-2 flex gap-2"><Button disabled={busy || reason.trim().length < 10} onClick={() => perform(record, 'decide-unlock', { unlock_id: request.id, decision: 'approve', reason })}>Izinkan pengajuan</Button><Button variant="secondary" disabled={busy || reason.trim().length < 10} onClick={() => perform(record, 'decide-unlock', { unlock_id: request.id, decision: 'reject', reason })}>Tolak izin</Button></div>}</article>)}</section>}
        <section className="space-y-2"><h3 className="font-semibold">Riwayat perubahan</h3>{record.events?.map(event => <article key={event.id} className="border-l-2 border-line pl-3 text-sm"><p>{({ created: 'Draf dibuat', updated: 'Draf diperbarui', submit: 'Diajukan', review: 'Diperiksa', decide: 'Keputusan Manager', 'request-unlock': 'Izin terlambat diminta', 'decide-unlock': 'Izin terlambat diputuskan' } as Record<string,string>)[event.action] ?? event.action} · {event.actor_role} · Versi {event.metadata.version}</p>{event.metadata.reason && <p className="text-subtle">{event.metadata.reason}</p>}<p className="text-xs text-subtle">{event.created_at}</p></article>)}</section>
      </div>}
    </DetailSheet>
  </div>;
}
