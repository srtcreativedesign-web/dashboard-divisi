import { type FormEvent, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock3, History, Pencil, Plus, ReceiptText, Search, UserRoundCheck, X } from 'lucide-react';
import { DivisionPageHeader } from '../../../components/ui/DivisionPageHeader';
import { Button } from '../../../components/ui/Button';
import { DetailSheet } from '../../../components/ui/DetailSheet';
import { EmptyState, ErrorState, LoadingState } from '../../../components/states';
import { KPICard, KPICardGrid } from '../../../components/ui/primitives';
import { useAuth } from '../../../session/AuthContext';
import { cellularApi, type DailyClosing } from '../api';

type ClosingAction = 'submit' | 'request-late' | 'approve-late' | 'validate' | 'approve' | 'correction';
type ClosingForm = { version?: number; outlet_id: string; business_date: string; shift_code: string; cash: string; qris: string; edc: string; transfer: string; source_reference: string };

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const blank = (): ClosingForm => ({ outlet_id: '', business_date: today(), shift_code: 'SHIFT-1', cash: '0', qris: '0', edc: '0', transfer: '0', source_reference: '' });
const money = (value: string | number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value));
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value)) : 'Belum tersedia';
const statusLabel: Record<DailyClosing['status'], string> = { draft: 'Draf Admin', submitted: 'Pemeriksaan Accounting', validated: 'Keputusan Manager', approved: 'Disetujui', correction: 'Perlu Koreksi' };
const statusClass: Record<DailyClosing['status'], string> = { draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200', submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200', validated: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200', approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200', correction: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' };
const actionLabel: Record<string, string> = { saved: 'Draf disimpan', submit: 'Diajukan ke Accounting', 'request-late': 'Izin terlambat diminta', 'approve-late': 'Izin terlambat disetujui', validate: 'Divalidasi Accounting', correction: 'Dikembalikan untuk koreksi', approve: 'Disetujui Manager' };
const field = 'mt-1.5 min-h-11 w-full rounded-input border border-line bg-panel px-3 text-sm text-navy outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-950';

export default function CellularDailyClosingPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [month, setMonth] = useState(today().slice(0, 7));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState<ClosingForm>(blank());
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<DailyClosing | null>(null);
  const [action, setAction] = useState<{ row: DailyClosing; type: 'request-late' | 'correction' } | null>(null);
  const [reason, setReason] = useState('');
  const closings = useQuery({ queryKey: ['cellular', 'daily-closings', month], queryFn: () => cellularApi.dailyClosings(month) });
  const outlets = useQuery({ queryKey: ['cellular', 'outlets'], queryFn: cellularApi.outlets });
  const mutation = useMutation({
    mutationFn: async (input: { kind: 'save'; data: ClosingForm } | { kind: 'action'; row: DailyClosing; action: ClosingAction; note?: string }) => input.kind === 'save' ? cellularApi.saveDailyClosing(input.data) : cellularApi.transitionDailyClosing(input.row, input.action, input.note),
    onSuccess: async response => {
      await client.invalidateQueries({ queryKey: ['cellular', 'daily-closings'] });
      setSelected(response.data);
      setAction(null);
      setReason('');
      setFormOpen(false);
      setForm(blank());
    },
  });
  const rows = closings.data?.data ?? [];
  const metrics = useMemo(() => ({
    total: rows.reduce((sum, row) => sum + Number(row.system_sales), 0),
    difference: rows.reduce((sum, row) => sum + Number(row.difference), 0),
    pending: rows.filter(row => ['submitted', 'validated'].includes(row.status)).length,
    overdue: rows.filter(row => row.is_overdue).length,
  }), [rows]);
  const filtered = rows.filter(row => (!status || row.status === status) && `${row.outlet_name ?? ''} ${row.business_date} ${row.shift_code} ${row.source_reference} ${row.current_pic?.name ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const role = user?.role ?? '';

  if (closings.isLoading || outlets.isLoading) return <LoadingState label="Menyiapkan register closing H+1..." />;
  if (closings.error || outlets.error) return <ErrorState title="Closing H+1 gagal dimuat" description={(closings.error ?? outlets.error)?.message ?? 'Data tidak tersedia.'} onRetry={() => { void closings.refetch(); void outlets.refetch(); }} />;

  const submitForm = (event: FormEvent) => { event.preventDefault(); mutation.mutate({ kind: 'save', data: form }); };
  const run = (row: DailyClosing, next: ClosingAction, note?: string) => mutation.mutate({ kind: 'action', row, action: next, note });
  const edit = (row: DailyClosing) => {
    setForm({ version: row.version, outlet_id: row.outlet_id, business_date: row.business_date, shift_code: row.shift_code, cash: row.cash, qris: row.qris, edc: row.edc, transfer: row.transfer, source_reference: row.source_reference });
    setFormOpen(true);
    setSelected(null);
  };

  return <div className="space-y-6 pb-12">
    <DivisionPageHeader division="Divisi Cellular" descriptor="Penerimaan Harian · Closing H+1" title="Pusat Closing dan Penerimaan Harian" description="Selesaikan pencocokan kanal, izin keterlambatan, pemeriksaan Accounting, dan keputusan Manager dalam satu alur yang dapat diaudit." actions={role === 'ADMIN' ? <Button onClick={() => { setForm(blank()); setFormOpen(true); }}><Plus className="h-4 w-4" />Buat closing</Button> : undefined} />

    <section className="grid gap-3 rounded-card-lg border border-line bg-panel p-4 shadow-card md:grid-cols-3">
      <FlowStep number="1" title="Admin menutup hari" detail="Cocokkan tunai, QRIS, EDC, transfer, dan referensi sumber." active={role === 'ADMIN'} />
      <FlowStep number="2" title="Accounting memeriksa" detail="Validasi selisih atau kembalikan dengan alasan yang jelas." active={role === 'ACCOUNTING'} />
      <FlowStep number="3" title="Manager memutuskan" detail="Setujui izin terlambat dan closing yang sudah divalidasi." active={role === 'MANAGER'} />
    </section>

    <KPICardGrid columns={4}>
      <KPICard size="sm" variant="gradient" label="Omzet sistem" value={money(metrics.total)} note={`${rows.length} closing pada periode`} icon={<ReceiptText />} />
      <KPICard size="sm" variant={metrics.difference !== 0 ? 'outlined' : 'default'} label="Selisih kanal" value={money(metrics.difference)} note="Pembayaran dikurangi omzet sistem" icon={<AlertTriangle />} />
      <KPICard size="sm" label="Menunggu keputusan" value={metrics.pending} note="Accounting atau Manager" icon={<UserRoundCheck />} />
      <KPICard size="sm" variant={metrics.overdue ? 'outlined' : 'default'} label="Lewat tenggat" value={metrics.overdue} note="Belum selesai setelah H+1 23.59 WIB" icon={<Clock3 />} />
    </KPICardGrid>

    {formOpen && role === 'ADMIN' && <ClosingFormPanel form={form} setForm={setForm} outlets={outlets.data?.data ?? []} busy={mutation.isPending} error={mutation.error?.message} onSubmit={submitForm} onClose={() => { setFormOpen(false); setForm(blank()); }} />}

    <section className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card">
      <div className="flex flex-col gap-4 border-b border-line p-5 xl:flex-row xl:items-end xl:justify-between">
        <div><h2 className="font-bold text-navy">Register closing H+1</h2><p className="mt-1 text-xs text-subtle">Setiap dokumen menampilkan status, PIC, tenggat, selisih, dan tindakan berikutnya.</p></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="relative sm:col-span-1"><Search className="absolute left-3 top-4 h-4 w-4 text-muted" /><input aria-label="Cari closing" className={`${field} mt-0 pl-9`} placeholder="Cari outlet, PIC, referensi" value={search} onChange={event => setSearch(event.target.value)} /></label>
          <select aria-label="Filter status closing" className={`${field} mt-0`} value={status} onChange={event => setStatus(event.target.value)}><option value="">Semua status</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <input aria-label="Periode closing" type="month" className={`${field} mt-0`} value={month} onChange={event => { setMonth(event.target.value); setSelected(null); }} />
        </div>
      </div>
      {filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-sm"><thead className="bg-surface text-[11px] uppercase tracking-wider text-subtle"><tr><th className="px-5 py-3">Dokumen</th><th>Nilai dan selisih</th><th>Status</th><th>PIC saat ini</th><th>Tenggat H+1</th><th>Izin terlambat</th><th className="px-5 text-right">Tindakan</th></tr></thead><tbody className="divide-y divide-line">{filtered.map(row => <ClosingRow key={row.id} row={row} role={role} busy={mutation.isPending} run={run} edit={edit} inspect={setSelected} openReason={(type) => { setAction({ row, type }); setReason(''); }} />)}</tbody></table></div> : <div className="p-8"><EmptyState title="Tidak ada closing sesuai filter" description="Ubah periode, status, atau kata pencarian untuk melihat dokumen lain." /></div>}
    </section>

    {selected && <ClosingDetail row={selected} role={role} busy={mutation.isPending} close={() => setSelected(null)} run={run} edit={edit} openReason={(type) => { setAction({ row: selected, type }); setReason(''); }} />}
    {action && <ReasonDialog type={action.type} reason={reason} setReason={setReason} busy={mutation.isPending} error={mutation.error?.message} close={() => { setAction(null); setReason(''); }} submit={() => run(action.row, action.type, reason)} />}
  </div>;
}

function FlowStep({ number, title, detail, active }: { number: string; title: string; detail: string; active: boolean }) { return <article className={`flex gap-3 rounded-card border p-4 ${active ? 'border-primary-300 bg-primary-50 dark:border-primary-800 dark:bg-primary-950/30' : 'border-line bg-surface'}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${active ? 'bg-primary-600 text-white' : 'bg-panel text-subtle'}`}>{number}</span><div><h3 className="font-semibold text-navy">{title}</h3><p className="mt-1 text-xs leading-5 text-subtle">{detail}</p></div></article>; }

function ClosingFormPanel({ form, setForm, outlets, busy, error, onSubmit, onClose }: { form: ClosingForm; setForm: (value: ClosingForm) => void; outlets: Array<{ id: string; name: string }>; busy: boolean; error?: string; onSubmit: (event: FormEvent) => void; onClose: () => void }) {
  const deadline = new Date(`${form.business_date}T23:59:59+07:00`); deadline.setDate(deadline.getDate() + 1);
  return <form aria-label={form.version ? 'Ubah closing H+1' : 'Buat closing H+1'} onSubmit={onSubmit} className="rounded-card-lg border border-line bg-panel shadow-card">
    <div className="flex items-start justify-between border-b border-line p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-primary-700">{form.version ? 'Perbaiki dokumen' : 'Dokumen baru'}</p><h2 className="mt-1 text-lg font-bold text-navy">{form.version ? 'Ubah closing H+1' : 'Catat closing H+1'}</h2><p className="mt-1 text-sm text-subtle">Omzet sistem dihitung dari transaksi posted. Tenggat pengajuan: <strong className="text-navy">{dateTime(deadline.toISOString())}</strong>.</p></div><button type="button" aria-label="Tutup form closing" onClick={onClose} className="rounded-input p-2 text-subtle hover:bg-surface"><X className="h-5 w-5" /></button></div>
    <fieldset disabled={busy} className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4"><Field label="Outlet"><select required className={field} value={form.outlet_id} onChange={event => setForm({ ...form, outlet_id: event.target.value })}><option value="">Pilih outlet</option>{outlets.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field><Field label="Tanggal bisnis"><input required type="date" max={today()} className={field} value={form.business_date} onChange={event => setForm({ ...form, business_date: event.target.value })} /></Field><Field label="Shift"><input required maxLength={20} className={field} value={form.shift_code} onChange={event => setForm({ ...form, shift_code: event.target.value })} /></Field><Field label="Referensi laporan"><input required maxLength={255} className={field} placeholder="Contoh: CLOSE-T3-20261010" value={form.source_reference} onChange={event => setForm({ ...form, source_reference: event.target.value })} /></Field>{(['cash', 'qris', 'edc', 'transfer'] as const).map(key => <Field key={key} label={`${key.toUpperCase()} (Rp)`}><input required inputMode="decimal" pattern="\d{1,12}(\.\d{1,2})?" className={field} value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} /></Field>)}</fieldset>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-5">{error ? <p role="alert" className="text-sm font-semibold text-danger">{error}</p> : <p className="text-xs text-subtle">Menyimpan ulang koreksi akan membatalkan izin terlambat sebelumnya karena nilai dokumen berubah.</p>}<div className="flex gap-2"><Button type="button" variant="ghost" onClick={onClose}>Batal</Button><Button type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan draf'}</Button></div></div>
  </form>;
}

function ClosingRow({ row, role, busy, run, edit, inspect, openReason }: { row: DailyClosing; role: string; busy: boolean; run: (row: DailyClosing, action: ClosingAction) => void; edit: (row: DailyClosing) => void; inspect: (row: DailyClosing) => void; openReason: (type: 'request-late' | 'correction') => void }) {
  const late = row.late_submission?.state ?? 'not_required';
  return <tr className="align-top hover:bg-surface/60"><td className="px-5 py-4"><p className="font-semibold text-navy">{row.outlet_name ?? 'Outlet Cellular'}</p><p className="mt-1 text-xs text-subtle">{row.business_date} · {row.shift_code}</p><p className="mt-1 max-w-56 truncate text-xs text-subtle">{row.source_reference}</p></td><td className="py-4"><p className="font-bold tabular-nums text-navy">{money(row.system_sales)}</p><p className={`mt-1 text-xs font-semibold ${Number(row.difference) === 0 ? 'text-success' : 'text-danger'}`}>Selisih {money(row.difference)}</p></td><td className="py-4"><span className={`rounded-pill px-2.5 py-1 text-xs font-bold ${statusClass[row.status]}`}>{statusLabel[row.status]}</span>{row.review_note && <p className="mt-2 max-w-48 text-xs text-danger">{row.review_note}</p>}</td><td className="py-4"><p className="font-medium text-navy">{row.current_pic?.name ?? row.maker_name ?? 'Belum ditetapkan'}</p><p className="mt-1 text-xs text-subtle">{row.current_pic?.role ?? 'ADMIN'}</p></td><td className="py-4"><p className={row.is_overdue ? 'font-semibold text-danger' : 'text-navy'}>{dateTime(row.deadline_at)}</p><p className="mt-1 text-xs text-subtle">H+1 pukul 23.59 WIB</p></td><td className="py-4"><LateBadge state={late} /><p className="mt-2 max-w-48 text-xs text-subtle">{row.late_submission?.reason ?? 'Tidak ada alasan keterlambatan'}</p></td><td className="px-5 py-3 text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => inspect(row)} className="min-h-10 rounded-input px-3 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300">Buka</button><PrimaryAction row={row} role={role} busy={busy} run={run} edit={edit} openReason={openReason} /></div></td></tr>;
}

function PrimaryAction({ row, role, busy, run, edit, openReason }: { row: DailyClosing; role: string; busy: boolean; run: (row: DailyClosing, action: ClosingAction) => void; edit: (row: DailyClosing) => void; openReason: (type: 'request-late' | 'correction') => void }) {
  const late = row.late_submission?.state ?? 'not_required';
  if (role === 'ADMIN' && ['draft', 'correction'].includes(row.status)) return <>{<button type="button" disabled={busy} onClick={() => edit(row)} className="min-h-10 rounded-input px-3 text-xs font-semibold text-subtle hover:bg-surface"><Pencil className="mr-1 inline h-3.5 w-3.5" />Ubah</button>}{late === 'required' ? <button type="button" disabled={busy} onClick={() => openReason('request-late')} className="min-h-10 rounded-input bg-amber-100 px-3 text-xs font-bold text-amber-900">Minta izin</button> : late === 'requested' ? <span className="self-center text-xs font-semibold text-amber-700">Menunggu Manager</span> : <button type="button" disabled={busy} onClick={() => run(row, 'submit')} className="min-h-10 rounded-input bg-primary-600 px-3 text-xs font-bold text-white">Ajukan</button>}</>;
  if (role === 'ACCOUNTING' && row.status === 'submitted') return <><button type="button" disabled={busy} onClick={() => openReason('correction')} className="min-h-10 rounded-input px-3 text-xs font-semibold text-danger">Koreksi</button><button type="button" disabled={busy} onClick={() => run(row, 'validate')} className="min-h-10 rounded-input bg-success px-3 text-xs font-bold text-white">Validasi</button></>;
  if (role === 'MANAGER' && late === 'requested' && ['draft', 'correction'].includes(row.status)) return <button type="button" disabled={busy} onClick={() => run(row, 'approve-late')} className="min-h-10 rounded-input bg-amber-600 px-3 text-xs font-bold text-white">Setujui izin</button>;
  if (role === 'MANAGER' && row.status === 'validated') return <button type="button" disabled={busy} onClick={() => run(row, 'approve')} className="min-h-10 rounded-input bg-primary-600 px-3 text-xs font-bold text-white">Setujui</button>;
  return null;
}

function ClosingDetail({ row, role, busy, close, run, edit, openReason }: { row: DailyClosing; role: string; busy: boolean; close: () => void; run: (row: DailyClosing, action: ClosingAction) => void; edit: (row: DailyClosing) => void; openReason: (type: 'request-late' | 'correction') => void }) {
  return <DetailSheet isOpen onClose={close} title="Detail closing H+1" subtitle={`${row.outlet_name ?? 'Outlet Cellular'} · ${row.business_date} · ${row.shift_code} · ${row.source_reference} · Versi ${row.version}`} icon={ReceiptText} size="2xl" badge={{ text: statusLabel[row.status], variant: row.status === 'approved' ? 'success' : row.status === 'correction' ? 'danger' : 'warning' }} footer={<div className="flex w-full flex-wrap items-center justify-between gap-3"><p className="text-xs text-subtle">Keputusan diperiksa ulang oleh backend berdasarkan role, scope outlet, status, dan versi dokumen.</p><div className="flex gap-2"><PrimaryAction row={row} role={role} busy={busy} run={run} edit={edit} openReason={openReason} /><Button variant="ghost" onClick={close}>Tutup</Button></div></div>}><div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><div className="space-y-5"><section><h3 className="font-bold text-navy">Rekonsiliasi kanal</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><Detail label="Omzet sistem" value={money(row.system_sales)} /><Detail label="Tunai" value={money(row.cash)} /><Detail label="QRIS" value={money(row.qris)} /><Detail label="EDC" value={money(row.edc)} /><Detail label="Transfer" value={money(row.transfer)} /><Detail label="Selisih" value={money(row.difference)} danger={Number(row.difference) !== 0} /></div></section><section className="rounded-card border border-line p-4"><h3 className="font-bold text-navy">Penanggung jawab dan tenggat</h3><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><Info label="PIC saat ini" value={`${row.current_pic?.name ?? row.maker_name ?? 'Belum tersedia'} · ${row.current_pic?.role ?? 'ADMIN'}`} /><Info label="Tenggat" value={`${dateTime(row.deadline_at)} · ${row.is_overdue ? 'Lewat tenggat' : 'Dalam waktu'}`} /><Info label="Dibuat oleh" value={row.maker_name ?? 'Belum tersedia'} /><Info label="Diperiksa oleh" value={row.reviewer_name ?? 'Belum diperiksa'} /><Info label="Disetujui oleh" value={row.approver_name ?? 'Belum disetujui'} /><Info label="Izin terlambat" value={row.late_submission?.approved_by_name ?? row.late_submission?.requested_by_name ?? 'Tidak diperlukan/belum diajukan'} /></dl>{row.late_submission?.reason && <p className="mt-3 rounded-input bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><strong>Alasan terlambat:</strong> {row.late_submission.reason}</p>}</section></div><aside className="rounded-card border border-line bg-surface p-4"><div className="flex items-center gap-2"><History className="h-5 w-5 text-primary-600" /><h3 className="font-bold text-navy">Jejak pemeriksaan</h3></div><div className="mt-4 space-y-4">{(row.timeline ?? []).map(event => <article key={event.id} className="relative border-l-2 border-primary-200 pl-4"><span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-primary-600" /><p className="text-sm font-semibold text-navy">{actionLabel[event.action] ?? event.action}</p><p className="mt-0.5 text-xs text-subtle">{event.actor_name} · {event.actor_role ?? 'Sistem'} · {dateTime(event.created_at)}</p>{event.note && <p className="mt-1 text-xs text-navy">{event.note}</p>}</article>)}{!(row.timeline ?? []).length && <p className="text-sm text-subtle">Histori lama belum memiliki audit event terstruktur.</p>}</div></aside></div></DetailSheet>;
}

function ReasonDialog({ type, reason, setReason, busy, error, close, submit }: { type: 'request-late' | 'correction'; reason: string; setReason: (value: string) => void; busy: boolean; error?: string; close: () => void; submit: () => void }) { const valid = reason.trim().length >= 10; const reasonRef = useRef<HTMLTextAreaElement>(null); const formId = `closing-${type}-form`; const title = type === 'request-late' ? 'Minta izin pengajuan terlambat' : 'Kembalikan untuk koreksi'; return <DetailSheet isOpen onClose={() => { if (!busy) close(); }} title={title} subtitle={type === 'request-late' ? 'Jelaskan penyebab closing melewati batas H+1 pukul 23.59 WIB. Manager akan melihat alasan ini sebelum menyetujui.' : 'Tuliskan temuan yang harus diperbaiki Admin. Alasan tersimpan dalam histori dokumen.'} icon={AlertTriangle} size="md" initialFocusRef={reasonRef} footer={<div className="flex w-full justify-end gap-2"><Button type="button" variant="ghost" disabled={busy} onClick={close}>Batal</Button><Button form={formId} type="submit" disabled={busy || !valid}>{busy ? 'Memproses...' : type === 'request-late' ? 'Kirim permintaan' : 'Kirim koreksi'}</Button></div>}><form id={formId} onSubmit={event => { event.preventDefault(); if (valid) submit(); }}><label className="block text-sm font-semibold text-navy">Alasan<textarea ref={reasonRef} required minLength={10} maxLength={2000} className={`${field} min-h-28 py-3`} value={reason} onChange={event => setReason(event.target.value)} /></label><p className="mt-1 text-xs text-subtle">Minimal 10 karakter · {reason.trim().length}/2000</p>{error && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{error}</p>}</form></DetailSheet>; }

function LateBadge({ state }: { state: 'not_required' | 'required' | 'requested' | 'approved' }) { const content = { not_required: ['Tanpa izin', 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'], required: ['Izin dibutuhkan', 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'], requested: ['Menunggu izin', 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'], approved: ['Izin disetujui', 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'] }[state]; return <span className={`rounded-pill px-2.5 py-1 text-xs font-bold ${content[1]}`}>{content[0]}</span>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-xs font-semibold text-subtle">{label}{children}</label>; }
function Detail({ label, value, danger }: { label: string; value: string; danger?: boolean }) { return <div className="rounded-card border border-line bg-surface p-4"><p className="text-xs font-semibold text-subtle">{label}</p><p className={`mt-2 font-bold tabular-nums ${danger ? 'text-danger' : 'text-navy'}`}>{value}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold text-subtle">{label}</dt><dd className="mt-1 font-medium text-navy">{value}</dd></div>; }
