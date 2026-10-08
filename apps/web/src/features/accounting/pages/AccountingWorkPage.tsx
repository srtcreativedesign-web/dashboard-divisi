import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, FilePlus2, RefreshCw, FileText } from 'lucide-react';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { Button } from '../../../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../../../components/states';
import { formatDate, formatRupiah } from '../ui/format';
import { StatusBadge } from '../ui/StatusBadge';
import { currentWorkMonth, useAccountingWork, workLabels, workStatuses, type WorkKind, type WorkStatus } from '../hooks/useAccountingWork';
import { AccountingPageHeader } from '../../../components/accounting/AccountingPageHeader';

export type AccountingWorkMode = 'admin' | 'accounting' | 'manager' | 'finance';
const headings = { admin: 'Pengajuan Admin', accounting: 'Pemeriksaan Accounting', manager: 'Persetujuan Manager', finance: 'Realisasi Finance' };
const inputClass = 'min-h-11 rounded-lg border border-line bg-panel px-3 text-sm text-navy';
const linkClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-primary dark:text-primary-300 dark:hover:bg-primary-950';

export default function AccountingWorkPage({ mode }: { mode?: AccountingWorkMode }) {
  const { user } = useAuth();
  const isWriter = hasCapability(user?.role ?? '', 'write:omzet', user?.divisionCode);
  const isReviewer = hasCapability(user?.role ?? '', 'validate:omzet', user?.divisionCode);
  const isFinance = hasCapability(user?.role ?? '', 'execute:payment', user?.divisionCode);
  const defaultStatus: WorkStatus = mode === 'finance' || isFinance ? 'done' : mode === 'manager' ? 'pending_approval' : isWriter ? 'correction' : isReviewer ? 'submitted' : 'pending_approval';
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState<WorkKind>(() => mode === 'finance' || isFinance ? 'voucher' : params.get('kind') === 'voucher' ? 'voucher' : 'omzet');
  const [month, setMonth] = useState(() => /^20\d{2}-(0[1-9]|1[0-2])$/.test(params.get('month') ?? '') ? params.get('month')! : currentWorkMonth());
  const [outlet, setOutlet] = useState(params.get('outlet') ?? '');
  const [status, setStatus] = useState<WorkStatus>(() => mode === 'finance' ? 'done' : workStatuses.includes(params.get('status') as WorkStatus) ? params.get('status') as WorkStatus : defaultStatus);
  const [page, setPage] = useState(() => { const value = Number(params.get('page')); return Number.isInteger(value) && value > 0 && value <= 10000 ? value : 1; });
  useEffect(() => {
    const next = new URLSearchParams({ kind, month, status, page: String(page), ...(outlet ? { outlet } : {}) });
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [kind, month, outlet, status, page, params, setParams]);
  const { query, counts, directory, writer, reviewer, approver, validMonth, refresh } = useAccountingWork(kind, month, outlet, status, page);
  const task = status === 'draft' || status === 'correction' ? writer ? 'Lengkapi dan ajukan' : 'Lihat laporan' : status === 'submitted' ? reviewer ? 'Periksa laporan' : 'Lihat pengajuan' : status === 'pending_approval' ? approver ? 'Tinjau keputusan' : 'Lihat pemeriksaan' : isFinance && kind === 'voucher' ? 'Lihat realisasi' : 'Lihat hasil';
  const owner = status === 'draft' || status === 'correction' ? 'Admin' : status === 'submitted' ? 'Staff Accounting' : status === 'pending_approval' ? 'Manager' : kind === 'voucher' ? 'Staff Finance' : 'Admin / Finance';
  const base = kind === 'omzet' ? '/accounting/pendapatan/rekap' : '/accounting/pengeluaran/voucher';
  const instruction = status === 'correction' ? 'Perbaiki laporan sesuai alasan pengembalian sebelum mengajukan ulang.' : status === 'draft' ? 'Lengkapi rincian dan referensi sumber, lalu ajukan untuk pemeriksaan.' : status === 'submitted' ? 'Periksa rincian dan bukti; teruskan atau kembalikan dengan catatan.' : status === 'pending_approval' ? 'Tinjau pemeriksaan dan alasan pengajuan sebelum memberikan keputusan.' : kind === 'voucher' ? 'Persetujuan berbeda dari pembayaran. Buka dokumen untuk melihat sisa dan bukti realisasi Finance.' : 'Rekap tervalidasi dapat menjadi sumber setoran dan laporan omzet.';
  const statusLabel = status === 'done' && kind === 'voucher' ? 'Disetujui' : workLabels[status];
  const heading = mode ? headings[mode] : 'Register dokumen Accounting';
  const roleLabel = isWriter ? 'Admin Accounting' : isReviewer ? 'Staff Accounting' : isFinance ? 'Staff Finance' : 'Pembaca / pengambil keputusan';

  return <div className="space-y-6 pb-10 animate-fade-in text-navy">
    <AccountingPageHeader area={`Pekerjaan Saya · ${roleLabel}`} title={heading} description="Temukan dokumen yang menjadi tanggung jawab Anda, pahami tahapnya, lalu selesaikan tindakan yang tersedia." actions={writer ? <Link to={base + '?new=1&month=' + month} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-input bg-primary-700 px-4 text-sm font-semibold text-white hover:bg-primary-800"><FilePlus2 aria-hidden="true" className="h-4 w-4" />{kind === 'omzet' ? 'Buat rekap' : 'Buat voucher'}</Link> : undefined} />
    <section aria-label="Konteks antrean" className="grid overflow-hidden rounded-card-lg border border-line bg-line shadow-card sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'Jenis dokumen', value: kind === 'omzet' ? 'Rekap omzet' : 'Voucher pengeluaran' },
        { label: 'Periode', value: month },
        { label: 'Tahap aktif', value: statusLabel },
        { label: 'Penanggung jawab', value: owner },
      ].map(item => <div key={item.label} className="bg-panel px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-wider text-subtle">{item.label}</p><p className="mt-1.5 text-sm font-bold text-navy">{item.value}</p></div>)}
    </section>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line" aria-label="Jenis pekerjaan">
      <div className="flex gap-5">{(mode === 'finance' ? ['voucher'] as const : ['omzet', 'voucher'] as const).map(value => <button key={value} type="button" aria-pressed={kind === value} onClick={() => { setKind(value); setPage(1); }} className={'min-h-12 border-b-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary ' + (kind === value ? 'border-primary-600 text-primary-700 dark:text-primary-300' : 'border-transparent text-subtle hover:text-navy')}>{value === 'omzet' ? 'Rekap omzet' : 'Voucher pengeluaran'}</button>)}</div><Link to="/accounting" className={linkClass}>Dashboard Accounting <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
    </div>
    <p className="text-xs leading-relaxed text-subtle">Mulai di sini: <span className="font-semibold text-navy">1. Pilih omzet atau voucher</span> · 2. Pilih periode dan outlet · 3. Pilih status, lalu buka tindakan pada baris dokumen.</p>
    <section aria-label="Filter dokumen" className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-subtle">Periode<input aria-label="Periode pekerjaan" type="month" min="2000-01" max="2099-12" className={inputClass} value={month} onChange={e => { setMonth(e.target.value); setPage(1); }} /></label>
      <label className="flex min-w-52 flex-1 flex-col gap-1 text-xs text-subtle">Outlet<select aria-label="Outlet pekerjaan" className={inputClass} value={outlet} onChange={e => { setOutlet(e.target.value); setPage(1); }}><option value="">Semua outlet dalam akses Anda</option>{directory.data?.map(o => <option key={o.id} value={o.id}>{o.name} · {o.divisionCode}</option>)}</select></label>
      <Button variant="secondary" onClick={refresh}><RefreshCw aria-hidden="true" className="h-4 w-4" />Muat ulang</Button>
    </section>
    {directory.error && <ErrorState description={directory.error.message} onRetry={() => void directory.refetch()} />}
    <section className="overflow-hidden rounded-xl border border-line bg-panel shadow-card" aria-label="Antrean pekerjaan">
      <div className="flex flex-wrap gap-1 border-b border-line bg-surface p-2" aria-label="Status pekerjaan">{workStatuses.map((state, index) => mode === 'finance' && state !== 'done' ? null : <button key={state} type="button" aria-pressed={status === state} onClick={() => { setStatus(state); setPage(1); }} className={'inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-primary ' + (status === state ? 'bg-panel text-primary-700 shadow-sm dark:text-primary-300' : 'text-subtle hover:bg-panel')}><span>{state === 'done' && kind === 'voucher' ? 'Disetujui' : workLabels[state]}</span><span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] tabular-nums">{counts[index]?.isError ? 'Gagal' : counts[index]?.data?.total ?? '…'}</span></button>)}</div>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5"><div><h2 className="text-base font-semibold">{statusLabel}</h2><p className="mt-1 max-w-3xl text-xs leading-relaxed text-subtle">{instruction}</p></div><span className="flex items-center gap-2 rounded-input bg-surface px-3 py-2 text-xs text-muted"><FileText aria-hidden="true" className="h-4 w-4" />{query.data?.total ?? '—'} dokumen</span></div>
      {counts.some(q => q.isError) && <p role="alert" className="px-5 py-3 text-sm text-danger dark:text-red-300">Sebagian jumlah antrean gagal dimuat. Klik Muat ulang untuk mencoba lagi.</p>}
      {!validMonth ? <p role="alert" className="p-5 text-sm">Pilih periode yang valid untuk memuat dokumen.</p> : query.isLoading ? <LoadingState label="Memuat dokumen dari database…" /> : query.error ? <ErrorState description={query.error.message} onRetry={() => void query.refetch()} /> : query.data && <>
        {query.data.items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><caption className="sr-only">Register {kind === 'omzet' ? 'rekap omzet' : 'voucher pengeluaran'} · {statusLabel}</caption><thead className="border-b border-line bg-surface text-[10px] font-semibold uppercase tracking-wider text-subtle"><tr>{['Dokumen / sumber', 'Outlet / tanggal', 'Nominal', 'Status', 'Penanggung jawab', 'Tindakan'].map(label => <th key={label} scope="col" className={'px-5 py-3 ' + (label === 'Nominal' ? 'text-right' : '')}>{label}</th>)}</tr></thead><tbody className="divide-y divide-line">{query.data.items.map(item => <tr key={item.id} className="align-top hover:bg-surface/60">
          <td className="max-w-80 px-5 py-4"><p className="break-words font-semibold">{item.context}</p><p className="mt-1 break-words text-xs text-subtle">{item.reference} · Versi {item.version}</p>{status === 'correction' && <p className="mt-2 break-words text-xs text-danger dark:text-red-300"><span className="font-semibold">Alasan koreksi: </span>{item.note || 'Lihat catatan pemeriksa pada detail.'}</p>}</td>
          <td className="px-5 py-4"><p className="font-medium">{item.outlet}</p><p className="mt-1 text-xs text-subtle">{formatDate(item.date)} · {item.division}</p>{kind === 'voucher' ? <p className="mt-1 text-[11px] text-subtle">Jatuh tempo {formatDate(item.deadline)}</p> : writer && (status === 'draft' || status === 'correction') && <p className="mt-1 max-w-56 text-[11px] text-subtle">{item.canSubmit ? 'Pengajuan tersedia' : 'Periksa jendela H+1 / izin Manager'} · batas normal H+1 {new Date(item.deadline).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>}</td>
          <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums">{formatRupiah(item.amount)}</td><td className="whitespace-nowrap px-5 py-4"><StatusBadge status={status === 'done' ? kind === 'voucher' ? 'approved' : 'validated' : status} label={statusLabel} />{kind === 'voucher' && status === 'done' && <p className="mt-2 text-[11px] text-subtle">{item.paymentStatus === 'PAID' ? 'Realisasi lunas' : item.paymentStatus === 'PARTIAL' ? 'Realisasi sebagian' : 'Belum ada realisasi'}</p>}</td><td className="px-5 py-4 text-xs text-muted">{kind === 'voucher' && status === 'done' && item.paymentStatus === 'PAID' ? 'Selesai realisasi' : owner}</td><td className="whitespace-nowrap px-5 py-3"><Link to={base + '?' + new URLSearchParams({ month, [kind === 'omzet' ? 'rekap' : 'voucher']: item.id }).toString()} className={linkClass}>{task}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link></td>
        </tr>)}</tbody></table></div> : <EmptyState title="Tidak ada dokumen pada antrean ini" description="Coba status atau periode lain. Antrean kosong tidak membuktikan semua laporan outlet sudah masuk." />}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-xs text-subtle"><span>{query.data.total} laporan · halaman {query.data.current_page} dari {query.data.last_page}</span><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page <= 1 || query.isFetching} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button><Button size="sm" variant="secondary" disabled={page >= query.data.last_page || query.isFetching} onClick={() => setPage(p => p + 1)}>Berikutnya</Button></div></footer>
      </>}
    </section>
    <p className="text-xs leading-relaxed text-subtle">Angka dan jumlah mengikuti periode/outlet yang dipilih. Rekap tervalidasi, persetujuan voucher, realisasi Finance dan catatan transaksi mempunyai status tersendiri.</p>
  </div>;
}
