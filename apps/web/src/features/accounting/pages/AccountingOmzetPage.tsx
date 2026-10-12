import { DocumentWorkflow } from '../ui/DocumentWorkflow';
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
import { AccountingPageHeader } from '../../../components/accounting/AccountingPageHeader';
import { AlertTriangle, CheckCircle2, Clock3, FileCheck2, ReceiptText } from 'lucide-react';

const statusLabels = { draft: 'Draf', submitted: 'Menunggu pemeriksaan', correction: 'Perlu koreksi', pending_approval: 'Menunggu Manager', validated: 'Tervalidasi' };
const paymentFields = [['cash_amount', 'Tunai'], ['qris_amount', 'QRIS'], ['edc_amount', 'EDC'], ['transfer_amount', 'Transfer'], ['other_amount', 'Pembayaran lainnya']] as const;
const localDate = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)!.value).join('-');
};
const emptyInput = (): OmzetInput => ({ outlet_id: '', business_date: '', shift: 'HARIAN', outlet_amount: '0.00', cash_amount: '0', qris_amount: '0', edc_amount: '0', transfer_amount: '0', other_amount: '0', expense_amount: '0', shift_breakdown: [1, 2, 3].map(shift_no => ({ shift_no: shift_no as 1 | 2 | 3, gross_amount: '0' })), requires_ap: false, source_reference: '', notes: '' });
const inputClass = 'mt-1 w-full rounded-input border border-line bg-panel px-3 py-2 text-sm';
const amount = (value: string) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nextRole = (status: OmzetRecord['status']) => ({
  draft: 'Admin', correction: 'Admin', submitted: 'Staff Accounting', pending_approval: 'Manager', validated: 'Selesai',
}[status]);
const nextAction = (status: OmzetRecord['status']) => ({
  draft: 'Lengkapi & ajukan', correction: 'Perbaiki & ajukan ulang', submitted: 'Periksa sumber & selisih', pending_approval: 'Putuskan selisih', validated: 'Siap dicocokkan',
}[status]);
const deadlineLabel = (businessDate: string) => {
  if (!businessDate) return 'Pilih tanggal omzet';
  const date = new Date(`${businessDate}T12:00:00+07:00`);
  date.setDate(date.getDate() + 1);
  return `${date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })} · 23.59 WIB`;
};
const inputFromRecord = (record: OmzetRecord): OmzetInput => ({
  ...emptyInput(), ...Object.fromEntries(Object.keys(emptyInput()).filter(key => key !== 'shift_breakdown').map(key => [key, record[key as keyof OmzetInput] ?? ''])),
  shift_breakdown: record.shift_breakdown.length ? record.shift_breakdown : [
    { shift_no: 1, gross_amount: record.outlet_amount }, { shift_no: 2, gross_amount: '0' }, { shift_no: 3, gross_amount: '0' },
  ],
});

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
    setInput(record ? inputFromRecord(record) : emptyInput());
    setSelected(null); setFormOpen(true); setFailure(null); setFeedback(null);
  };
  const perform = (record: OmzetRecord, kind: string, data?: Parameters<typeof omzetApi.action>[2]) => { setFailure(null); action.mutate({ record, kind, data }); };
  const record = detail.data;
  const editable = record && ['draft', 'correction'].includes(record.status);
  const pendingUnlocks = record?.unlock_requests?.filter(request => request.status === 'pending') ?? [];
  const shiftTotal = input.shift_breakdown.reduce((sum, line) => sum + amount(line.gross_amount), 0);
  const paymentTotal = paymentFields.reduce((sum, [key]) => sum + amount(input[key]), 0);
  const paymentDifference = shiftTotal - paymentTotal;
  const expectedDeposit = amount(input.cash_amount) - amount(input.expense_amount);
  const formChecks = [
    { label: 'Outlet dan tanggal omzet terisi', ready: Boolean(input.outlet_id && input.business_date) },
    { label: 'Total shift lebih dari nol', ready: shiftTotal > 0 },
    { label: 'Kanal pembayaran sama dengan omzet', ready: Math.abs(paymentDifference) < 0.005 },
    { label: 'Pengeluaran tidak melebihi kas', ready: expectedDeposit >= 0 },
    { label: 'Referensi sumber tersedia', ready: input.source_reference.trim().length > 0 },
  ];
  const readyCount = formChecks.filter(check => check.ready).length;
  return <div className="space-y-6">
      <AccountingPageHeader area="Penerimaan Harian · Omzet Outlet" title="Rekap omzet H+1" description="Catat omzet per outlet dan shift, kirim untuk pemeriksaan Accounting, lalu selesaikan selisih sebelum pencocokan setoran." actions={writer ? <Button onClick={() => openForm()}>Buat rekap</Button> : undefined} />
    <Link to="/accounting/dokumen/register" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-700 dark:text-primary-300">← Kembali ke semua dokumen</Link>
    {feedback && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</p>}
    {failure && !selected && !formOpen && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{failure}</p>}
    <WorkflowGuide kind="omzet" />
    <section className="grid gap-3 rounded-card-lg border border-line bg-panel p-4 lg:grid-cols-[1fr_auto] lg:items-end" aria-label="Filter register omzet">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium">Periode kerja<input className={inputClass} type="month" value={month} onChange={event => { setMonth(event.target.value); setPage(1); }} /></label>
        <label className="text-sm font-medium">Outlet sumber<select className={inputClass} value={outlet} onChange={event => { setOutlet(event.target.value); setPage(1); }}><option value="">Semua outlet</option>{directory.data?.map(item => <option key={item.id} value={item.id}>{item.name} ({item.divisionCode})</option>)}</select></label>
        <label className="text-sm font-medium">Tahap pekerjaan<select className={inputClass} value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">Semua status</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      </div>
      <Button variant="secondary" onClick={() => { void list.refetch(); void directory.refetch(); }}>Muat ulang</Button>
    </section>
    {directory.error && <ErrorState description={directory.error.message} onRetry={() => void directory.refetch()} />}
    {list.isLoading ? <LoadingState /> : list.error ? <ErrorState description={list.error.message} onRetry={() => void list.refetch()} /> : list.data && <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan antrean omzet">
        {[
          { label: 'Dokumen periode', value: list.data.summary.total_records, note: `${list.data.summary.status_counts.draft} masih draf`, icon: ReceiptText, tone: 'text-primary-700 bg-primary-50 dark:bg-primary-950 dark:text-primary-300' },
          { label: 'Menunggu pemeriksaan', value: list.data.summary.status_counts.submitted, note: 'PIC Staff Accounting', icon: Clock3, tone: 'text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300' },
          { label: 'Perlu keputusan/koreksi', value: list.data.summary.status_counts.pending_approval + list.data.summary.status_counts.correction, note: `${list.data.summary.exception_count} dokumen berselisih`, icon: AlertTriangle, tone: 'text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300' },
          { label: 'Tervalidasi', value: list.data.summary.validated_count, note: 'Siap ke pencocokan setoran', icon: FileCheck2, tone: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300' },
        ].map(card => <article key={card.label} className="rounded-card-lg border border-line bg-panel p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-subtle">{card.label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-navy">{card.value}</p><p className="mt-1 text-xs text-subtle">{card.note}</p></div><span className={`rounded-card p-2 ${card.tone}`}><card.icon className="h-5 w-5" /></span></div></article>)}
      </section>
      <section className="grid gap-3 rounded-card-lg border border-line bg-panel p-4 sm:grid-cols-3" aria-label="Nilai omzet tervalidasi"><div><p className="text-xs font-semibold uppercase tracking-wide text-subtle">Omzet tervalidasi</p><p className="mt-1 text-lg font-bold tabular-nums text-navy">{rupiah(list.data.summary.outlet_amount)}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-subtle">Penerimaan tercatat</p><p className="mt-1 text-lg font-bold tabular-nums text-navy">{rupiah(list.data.summary.received_amount)}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-subtle">Selisih laporan AP</p><p className="mt-1 text-lg font-bold tabular-nums text-navy">{rupiah(list.data.summary.ap_difference)}</p></div><p className="text-xs text-subtle sm:col-span-3">Nilai hanya berasal dari rekap tervalidasi. Selisih AP belum merupakan laba atau jurnal akuntansi.</p></section>
      {list.data.items.length ? <section className="overflow-hidden rounded-card-lg border border-line bg-panel"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">Register kerja</p><h2 className="mt-1 font-bold text-navy">Rekap omzet outlet</h2></div><span className="text-sm text-subtle">{list.data.total} dokumen</span></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-surface text-xs uppercase tracking-wide text-subtle"><tr>{['Tanggal & sumber', 'Omzet & selisih', 'Tahap dokumen', 'Kontrol & PIC', 'Tindakan'].map(label => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-line">{list.data.items.map(item => <tr key={item.id} className="align-top hover:bg-surface/70"><td className="px-4 py-4"><strong className="text-navy">{formatDate(item.business_date)}</strong><span className="mt-1 block text-xs text-subtle">{item.outlet_name} · {item.source_division_code}</span><span className="block text-xs text-subtle">Laporan {item.shift === 'HARIAN' ? 'harian · 3 shift' : `shift ${item.shift}`}</span></td><td className="px-4 py-4"><strong className="tabular-nums text-navy">{rupiah(item.outlet_amount)}</strong><span className={`mt-1 block text-xs font-semibold ${Math.abs(amount(item.payment_difference)) > 0.004 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{Math.abs(amount(item.payment_difference)) > 0.004 ? `Selisih ${rupiah(item.payment_difference)}` : 'Pembayaran sesuai'}</span></td><td className="px-4 py-4"><StatusBadge status={item.status} label={statusLabels[item.status]} /><span className="mt-2 block text-xs text-subtle">Versi {item.version}</span></td><td className="px-4 py-4"><strong className="text-navy">{nextRole(item.status)}</strong><span className="mt-1 block max-w-48 text-xs text-subtle">{nextAction(item.status)}</span>{['draft','correction'].includes(item.status) && <span className="mt-2 block text-xs text-amber-700 dark:text-amber-300">Batas {deadlineLabel(item.business_date)}</span>}</td><td className="px-4 py-4"><Button variant="secondary" size="sm" onClick={() => open(item.id)}>Buka rekap</Button></td></tr>)}</tbody></table></div></section> : <EmptyState title="Belum ada rekap pada filter ini" description="Ubah periode atau filter, atau buat rekap omzet baru jika Anda bertugas sebagai Admin." />}
      <div className="flex items-center justify-between text-sm"><span>Halaman {list.data.current_page} dari {list.data.last_page}</span><div className="flex gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</Button><Button variant="secondary" disabled={page >= list.data.last_page} onClick={() => setPage(page + 1)}>Berikutnya</Button></div></div>
    </>}
    <DetailSheet isOpen={formOpen} onClose={() => !busy && setFormOpen(false)} title={editing ? 'Edit rekap omzet' : 'Buat rekap omzet'}>
      <form aria-label="Form rekap omzet" onSubmit={event => { event.preventDefault(); save.mutate(); }} className="space-y-4">
        {failure && <p role="alert" className="text-sm text-red-700">{failure}</p>}
        <fieldset disabled={busy || !writer || !directory.data?.length} className="space-y-4">
          <aside className="rounded-card-lg border border-primary-200 bg-primary-50 p-4 text-sm dark:border-primary-900 dark:bg-primary-950"><p className="font-semibold text-primary-900 dark:text-primary-100">Target pengajuan H+1</p><p className="mt-1 text-primary-800 dark:text-primary-200">Dokumen omzet tanggal terpilih harus diajukan paling lambat <strong>{deadlineLabel(input.business_date)}</strong>. Setelah lewat batas, Admin perlu izin Manager.</p></aside>
          <section className="rounded-card-lg border border-line p-4"><div className="mb-4 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-card bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">01</span><div><h3 className="font-semibold text-navy">Sumber laporan</h3><p className="text-xs text-subtle">Pilih outlet dan tanggal bisnis yang tercantum pada laporan outlet.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Outlet<select className={inputClass} required value={input.outlet_id} onChange={event => setInput({ ...input, outlet_id: event.target.value })}><option value="">Pilih outlet</option>{directory.data?.map(item => <option key={item.id} value={item.id}>{item.name} ({item.divisionCode})</option>)}</select></label><label className="block text-sm font-medium">Tanggal omzet<input className={inputClass} required type="date" max={localDate()} value={input.business_date} onChange={event => setInput({ ...input, business_date: event.target.value })} /></label></div></section>
          <section className="rounded-card-lg border border-line bg-surface p-4"><div className="mb-4 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-card bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">02</span><div><h3 className="font-semibold text-navy">Omzet per shift</h3><p className="text-xs text-subtle">Salin nilai dari laporan shift; sistem menghitung total harian.</p></div></div><div className="grid gap-3 sm:grid-cols-3">{input.shift_breakdown.map((line, index) => <label key={line.shift_no} className="text-sm font-medium">Shift {line.shift_no} (Rp)<input className={inputClass} required type="number" min="0" max="999999999999.99" step="0.01" value={line.gross_amount} onChange={event => { const lines = input.shift_breakdown.map((item, lineIndex) => lineIndex === index ? { ...item, gross_amount: event.target.value } : item); setInput({ ...input, shift_breakdown: lines, outlet_amount: lines.reduce((sum, item) => sum + amount(item.gross_amount), 0).toFixed(2) }); }} /></label>)}</div><div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm"><span>Total omzet harian</span><strong className="text-lg tabular-nums text-navy">{rupiah(input.outlet_amount)}</strong></div></section>
          <section className="rounded-card-lg border border-line p-4"><div className="mb-4 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-card bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">03</span><div><h3 className="font-semibold text-navy">Penerimaan per kanal</h3><p className="text-xs text-subtle">Pisahkan tunai, QRIS, EDC, transfer, dan kanal lain untuk rekonsiliasi.</p></div></div><div className="grid gap-3 sm:grid-cols-2">{paymentFields.map(([key, label]) => <label key={key} className="block text-sm font-medium">{label} (Rp)<input className={inputClass} required type="number" min="0" max="999999999999.99" step="0.01" value={input[key]} onChange={event => setInput({ ...input, [key]: event.target.value })} /></label>)}</div><div aria-live="polite" className={`mt-4 rounded-card p-3 text-sm ${Math.abs(paymentDifference) < 0.005 ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'}`}><div className="flex items-center justify-between gap-3"><span>Total penerimaan <strong>{rupiah(paymentTotal.toFixed(2))}</strong></span><strong>{Math.abs(paymentDifference) < 0.005 ? 'Sesuai' : `Selisih ${rupiah(paymentDifference.toFixed(2))}`}</strong></div></div></section>
          <section className="rounded-card-lg border border-line p-4"><div className="mb-4 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-card bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">04</span><div><h3 className="font-semibold text-navy">Setoran dan bukti sumber</h3><p className="text-xs text-subtle">Lengkapi pengeluaran operasional, referensi laporan, dan kebutuhan pencocokan AP.</p></div></div><label className="block text-sm font-medium">Pengeluaran harian dari kas (Rp)<input className={inputClass} required type="number" min="0" max="999999999999.99" step="0.01" value={input.expense_amount} onChange={event => setInput({ ...input, expense_amount: event.target.value })} /></label><div className={`mt-3 flex items-center justify-between rounded-card p-3 text-sm ${expectedDeposit < 0 ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200' : 'bg-surface'}`}><span>Rencana setoran tunai</span><strong className="text-lg tabular-nums">{rupiah(Math.max(0, expectedDeposit).toFixed(2))}</strong></div><label className="mt-4 block text-sm font-medium">Referensi laporan sumber<input className={inputClass} required maxLength={255} value={input.source_reference} onChange={event => setInput({ ...input, source_reference: event.target.value })} placeholder="Contoh: Harian CELL T3 / 06-10-2026" /></label><label className="mt-4 flex gap-2 rounded-card border border-line p-3 text-sm"><input type="checkbox" checked={input.requires_ap} onChange={event => setInput({ ...input, requires_ap: event.target.checked })} /><span><strong className="block text-navy">Perlu pencocokan laporan Angkasa Pura</strong><span className="text-xs text-subtle">Staff Accounting akan mengisi nilai laporan AP dan menjelaskan selisihnya.</span></span></label><label className="mt-4 block text-sm font-medium">Catatan Admin<textarea className={inputClass} maxLength={2000} value={input.notes} onChange={event => setInput({ ...input, notes: event.target.value })} placeholder="Kondisi khusus, dokumen susulan, atau informasi untuk pemeriksa" /></label></section>
          <aside className="rounded-card-lg border border-line bg-surface p-4" aria-label="Pemeriksaan kesiapan draf"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold text-navy">Kesiapan dokumen</h3><p className="text-xs text-subtle">{readyCount} dari {formChecks.length} pemeriksaan terpenuhi</p></div><span className="text-lg font-bold text-navy">{Math.round((readyCount / formChecks.length) * 100)}%</span></div><ul className="mt-3 space-y-2">{formChecks.map(check => <li key={check.label} className="flex items-center gap-2 text-sm"><CheckCircle2 className={`h-4 w-4 ${check.ready ? 'text-emerald-600' : 'text-subtle'}`} /><span className={check.ready ? 'text-navy' : 'text-subtle'}>{check.label}</span></li>)}</ul></aside>
          <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-line bg-panel/95 px-4 py-3 backdrop-blur"><p className="text-xs text-subtle">Draf belum masuk antrean Accounting sampai diajukan.</p><Button type="submit">{busy ? 'Menyimpan...' : 'Simpan draf'}</Button></div>
        </fieldset>
        {!directory.data?.length && <p className="text-sm text-subtle">Direktori outlet aktif harus tersedia sebelum rekap dibuat.</p>}
      </form>
    </DetailSheet>
    <DetailSheet isOpen={Boolean(selected)} onClose={() => !busy && setSelected(null)} title="Detail rekap omzet" size="xl">
      {detail.isLoading ? <LoadingState /> : detail.error ? <ErrorState description={detail.error.message} onRetry={() => void detail.refetch()} /> : record && <div className="space-y-5">
        {failure && <p role="alert" className="text-sm text-red-700">{failure}<Button variant="secondary" onClick={() => void detail.refetch()}>Muat ulang detail</Button></p>}
        <div><h2 className="font-semibold">{record.outlet_name}</h2><p className="mt-1 text-sm">{formatDate(record.business_date)} · Shift {record.shift} · <StatusBadge status={record.status} label={statusLabels[record.status]} /></p><p className="mt-1 text-xs text-subtle">Referensi: {record.source_reference}</p></div>
        <DocumentWorkflow status={record.status} kind="omzet" version={record.version} />
        <section className="grid gap-3 rounded-card-lg border border-line bg-surface p-4 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-subtle">Penanggung jawab berikutnya</p><p className="mt-1 font-bold text-navy">{nextRole(record.status)}</p><p className="text-xs text-subtle">{nextAction(record.status)}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-subtle">Batas normal H+1</p><p className="mt-1 font-bold text-navy">{deadlineLabel(record.business_date)}</p><p className="text-xs text-subtle">Versi dokumen {record.version}</p></div></section>
        {(Math.abs(amount(record.payment_difference)) > 0.004 || Math.abs(amount(record.shift_difference ?? '0')) > 0.004 || Math.abs(amount(record.ap_difference ?? '0')) > 0.004) && <aside className="rounded-card-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Dokumen memiliki selisih yang perlu ditelusuri</p><p className="mt-1 text-xs">Staff Accounting wajib menjelaskan sumber selisih. Keputusan Manager diperlukan sebelum dokumen menjadi tervalidasi.</p></div></div></aside>}
        {record.shift_breakdown.length > 0 && <section className="rounded-card border border-line p-4"><h3 className="font-semibold">Omzet per shift</h3><div className="mt-3 grid gap-3 sm:grid-cols-3">{record.shift_breakdown.map(line => <div key={line.shift_no}><p className="text-xs text-subtle">Shift {line.shift_no}</p><p className="font-semibold tabular-nums">{rupiah(line.gross_amount)}</p></div>)}</div></section>}
        <dl className="space-y-2 text-sm">{[[ 'Total omzet harian', rupiah(record.outlet_amount)], ...paymentFields.map(([key,label]) => [label, rupiah(record[key])]), ['Total pembayaran', rupiah(record.received_amount)], ['Selisih pembayaran', rupiah(record.payment_difference)], ['Total shift', record.shift_total === null ? 'Belum dirinci' : rupiah(record.shift_total)], ['Selisih shift', record.shift_difference === null ? '—' : rupiah(record.shift_difference)], ['Pengeluaran harian', rupiah(record.expense_amount)], ['Rencana setoran tunai', rupiah(record.expected_deposit_amount)], ['Laporan AP', record.ap_amount === null ? 'Belum dicocokkan / tidak berlaku' : rupiah(record.ap_amount)], ['Selisih AP', record.ap_difference === null ? '—' : rupiah(record.ap_difference)]].map(([label,value]) => <div key={label} className="flex justify-between gap-4 border-b border-line pb-2"><dt>{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl>
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
