import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, FilePlus2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { Button } from '../../../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../../../components/states';
import { formatDate, formatRupiah } from '../ui/format';
import { currentWorkMonth, useAccountingWork, workLabels, workStatuses, type WorkKind, type WorkStatus } from '../hooks/useAccountingWork';

const panel = 'rounded-2xl border border-line bg-panel';
const linkClass = 'inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary dark:text-primary-300';
const inputClass = 'min-h-11 rounded-lg border border-line bg-panel px-3 text-sm text-navy';

export default function AccountingWorkPage() {
  const { user } = useAuth();
  const isWriter = hasCapability(user?.role ?? '', 'write:omzet', user?.divisionCode);
  const isReviewer = hasCapability(user?.role ?? '', 'validate:omzet', user?.divisionCode);
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState<WorkKind>(() => params.get('kind') === 'voucher' ? 'voucher' : 'omzet');
  const [month, setMonth] = useState(() => /^20\d{2}-(0[1-9]|1[0-2])$/.test(params.get('month') ?? '') ? params.get('month')! : currentWorkMonth());
  const [outlet, setOutlet] = useState(params.get('outlet') ?? '');
  const [status, setStatus] = useState<WorkStatus>(() => workStatuses.includes(params.get('status') as WorkStatus) ? params.get('status') as WorkStatus : isWriter ? 'correction' : isReviewer ? 'submitted' : 'pending_approval');
  const [page, setPage] = useState(() => { const value = Number(params.get('page')); return Number.isInteger(value) && value > 0 && value <= 10000 ? value : 1; });
  useEffect(() => {
    const next = new URLSearchParams({ kind, month, status, page: String(page), ...(outlet ? { outlet } : {}) });
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [kind, month, outlet, status, page, params, setParams]);
  const work = useAccountingWork(kind, month, outlet, status, page);
  const { query, counts, directory, writer, reviewer, approver, can } = work;
  const task = status === 'correction' || status === 'draft' ? (writer ? 'Lengkapi dan ajukan' : 'Lihat laporan') : status === 'submitted' ? (reviewer ? 'Periksa laporan' : 'Lihat pengajuan') : status === 'pending_approval' ? (approver ? 'Tinjau keputusan' : 'Lihat pemeriksaan') : 'Lihat hasil';
  const owner = status === 'draft' || status === 'correction' ? 'Admin' : status === 'submitted' ? 'Staff Accounting' : status === 'pending_approval' ? 'Manager' : kind === 'voucher' ? 'Finance untuk realisasi' : 'Accounting untuk laporan';
  const heading = isWriter ? 'Ruang kerja Admin Accounting' : isReviewer ? 'Ruang kerja Staff Accounting' : 'Ruang kerja Accounting';
  const introduction = isWriter ? 'Lengkapi rekap outlet dan voucher, ajukan pemeriksaan, lalu tindak lanjuti koreksi.' : isReviewer ? 'Periksa pengajuan Admin, telusuri bukti dan selisih, lalu validasi atau kembalikan untuk koreksi.' : 'Pantau pengajuan dan selesaikan keputusan sesuai kewenangan Anda.';
  const base = kind === 'omzet' ? '/accounting/omzet' : '/accounting/vouchers';
  const selectedCounts = counts.map(q => q.data?.total);
  const instruction = status === 'correction' ? 'Baca alasan pengembalian sebelum memperbaiki laporan.' : status === 'draft' ? 'Periksa rincian dan referensi sumber sebelum mengajukan.' : status === 'submitted' ? 'Cocokkan angka dan bukti. Kembalikan bila perlu perbaikan.' : status === 'pending_approval' ? 'Tinjau hasil pemeriksaan dan alasan selisih sebelum mengambil keputusan.' : kind === 'voucher' ? 'Voucher disetujui belum berarti sudah dibayar. Realisasi dilakukan Finance.' : 'Rekap tervalidasi tersedia untuk pencocokan setoran dan laporan.';

  return <div className="space-y-6 text-navy">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Accounting pusat · pekerjaan harian</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{heading}</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{introduction}</p></div>
      <Link className={linkClass} to="/accounting/dashboard">Dashboard pemantauan <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
    </header>
    <section aria-label="Alur kerja laporan" className={panel + ' flex flex-wrap gap-x-7 gap-y-3 px-5 py-4 text-sm'}>
      {['Admin menyiapkan', 'Accounting memeriksa', kind === 'voucher' ? 'Manager menyetujui voucher' : 'Manager memutuskan bila ada selisih', kind === 'voucher' ? 'Voucher disetujui untuk realisasi' : 'Omzet tervalidasi untuk laporan'].map((step, index) => <span key={step} className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-semibold">{index + 1}</span>{step}</span>)}
    </section>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="min-w-0 space-y-5" aria-label="Antrean pekerjaan">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1 rounded-xl border border-line bg-panel p-1" aria-label="Jenis pekerjaan">{(['omzet', 'voucher'] as const).map(value => <button key={value} type="button" aria-pressed={kind === value} onClick={() => { setKind(value); setPage(1); }} className={'min-h-11 rounded-lg px-5 text-sm font-semibold ' + (kind === value ? 'bg-primary-700 text-white' : 'text-muted hover:bg-surface')}>{value === 'omzet' ? 'Rekap omzet' : 'Voucher pengeluaran'}</button>)}</div>
          {writer && <Link to={base + '?new=1&month=' + month} className={linkClass}><FilePlus2 className="h-4 w-4" aria-hidden="true" />{kind === 'omzet' ? 'Buat rekap' : 'Buat voucher'}</Link>}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted">Periode<input aria-label="Periode pekerjaan" type="month" min="2000-01" max="2099-12" className={inputClass} value={month} onChange={e => { setMonth(e.target.value); setPage(1); }} /></label>
          <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs text-muted">Outlet<select aria-label="Outlet pekerjaan" className={inputClass} value={outlet} onChange={e => { setOutlet(e.target.value); setPage(1); }}><option value="">Semua outlet yang dapat Anda akses</option>{directory.data?.map(o => <option key={o.id} value={o.id}>{o.name} · {o.divisionCode}</option>)}</select></label>
          <Button variant="secondary" onClick={work.refresh}><RefreshCw aria-hidden="true" className="h-4 w-4" />Muat ulang</Button>
        </div>
        {directory.error && <ErrorState description={directory.error.message} onRetry={() => void directory.refetch()} />}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Status pekerjaan">{workStatuses.map((state, index) => <button type="button" key={state} aria-pressed={status === state} onClick={() => { setStatus(state); setPage(1); }} className={'rounded-xl border p-3 text-left focus-visible:outline-2 focus-visible:outline-primary ' + (status === state ? 'border-primary-700 bg-primary-700 text-white' : 'border-line bg-panel hover:bg-surface')}><span className="block text-xs leading-relaxed">{workLabels[state]}</span><span className="mt-2 block text-2xl font-semibold tabular-nums">{counts[index]?.isError ? 'Gagal' : selectedCounts[index] ?? '…'}</span></button>)}</div>
        {counts.some(q => q.isError) && <p role="alert" className="text-sm text-danger dark:text-red-300">Sebagian jumlah antrean gagal dimuat. Klik Muat ulang untuk mencoba lagi.</p>}
        <div className={panel + ' overflow-hidden'}>
          <div className="border-b border-line p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{workLabels[status]}</h2><span className="text-xs text-muted">Tahap berikutnya: {owner}</span></div><p className="mt-2 text-sm text-muted">{instruction}</p></div>
          {!work.validMonth ? <p role="alert" className="p-5 text-sm">Pilih periode yang valid untuk memuat pekerjaan.</p> : query.isLoading ? <LoadingState label="Memuat pekerjaan dari database…" /> : query.error ? <ErrorState description={query.error.message} onRetry={() => void query.refetch()} /> : query.data && <>
            {query.data.items.length ? <ul className="divide-y divide-line">{query.data.items.map(item => <li key={item.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{item.outlet}</h3><span className="text-xs text-muted">{item.division} · {formatDate(item.date)} · {item.context}</span></div><p className="mt-1 break-words text-xs text-muted">{item.reference} · Versi {item.version}</p>
                {status === 'correction' && <p className="mt-3 rounded-lg border border-line bg-surface p-3 text-sm"><span className="font-semibold">Alasan koreksi: </span>{item.note || 'Buka detail untuk meninjau catatan pemeriksa.'}</p>}
                {kind === 'omzet' && writer && (status === 'draft' || status === 'correction') && <p className="mt-2 text-xs text-muted">{item.canSubmit ? 'Pengajuan tersedia' : 'Pengajuan belum tersedia; periksa jendela H+1 atau izin Manager'} · batas normal H+1 {new Date(item.deadline).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>}
                {kind === 'voucher' && <p className="mt-2 text-xs text-muted">Jatuh tempo: {formatDate(item.deadline)}</p>}
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end"><p className="whitespace-nowrap text-lg font-semibold tabular-nums">{formatRupiah(item.amount)}</p><Link to={base + '?' + new URLSearchParams({ month, [kind === 'omzet' ? 'rekap' : 'voucher']: item.id }).toString()} className={linkClass}>{task}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>
            </li>)}</ul> : <EmptyState title="Tidak ada laporan pada antrean ini" description="Coba status atau periode lain. Antrean kosong tidak berarti semua laporan outlet sudah masuk." />}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4 text-xs text-muted"><span>{query.data.total} laporan · halaman {query.data.current_page} dari {query.data.last_page}</span><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page <= 1 || query.isFetching} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button><Button size="sm" variant="secondary" disabled={page >= query.data.last_page || query.isFetching} onClick={() => setPage(p => p + 1)}>Berikutnya</Button></div></div>
          </>}
        </div>
        <p className="text-xs leading-relaxed text-muted">Antrean mengikuti periode dan outlet yang dipilih. Status selesai menunjukkan pemeriksaan rekap atau persetujuan voucher; pembayaran dan pencatatan jurnal memiliki proses tersendiri.</p>
      </section>
      <aside className="space-y-4">
        <section className={panel + ' p-5'}><ClipboardCheck aria-hidden="true" className="mb-3 h-5 w-5 text-primary-700 dark:text-primary-300" /><h2 className="font-semibold">Lanjutkan pekerjaan</h2><p className="mt-2 text-xs leading-relaxed text-muted">Pilih kegiatan setelah rekap dan pengajuan diperiksa.</p><div className="mt-3 flex flex-col items-start">
          {can('view:acc_deposits') && <><Link className={linkClass} to={'/accounting/setoran?month=' + month}>Catat dan telusuri setoran</Link><Link className={linkClass} to={'/accounting/pencocokan-setoran?month=' + month}>Cocokkan setoran</Link></>}
          {can('view:acc_hr') && <Link className={linkClass} to="/accounting/kepegawaian">Rekap cuti dan absensi</Link>}
          <Link className={linkClass} to="/accounting/omzet-tahunan">Laporan omzet outlet</Link>
        </div></section>
        {can('preview:cellular_report') && <details className={panel + ' p-5'}><summary className="cursor-pointer text-sm font-semibold">Laporan Excel pendukung</summary><p className="mt-3 text-xs leading-relaxed text-muted">Bandingkan laporan Cellular lama bila diperlukan untuk pemeriksaan. Pembacaan file belum menyimpan atau mengajukan rekap.</p><Link className={linkClass + ' mt-2'} to="/accounting/preview-cellular">Periksa sumber Excel <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></details>}
      </aside>
    </div>
  </div>;
}
