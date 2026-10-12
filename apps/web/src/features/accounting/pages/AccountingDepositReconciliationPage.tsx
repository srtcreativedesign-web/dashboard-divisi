import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Banknote, CheckCircle2, Clock3, RefreshCw, Scale } from 'lucide-react';
import { depositsApi, type DepositReconciliation } from '../api/deposits';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { EmptyState, ErrorState, LoadingState } from '../../../components/states';
import { channelLabels, formatDate, formatRupiah } from '../ui/format';
import { AccountingPageHeader } from '../../../components/accounting/AccountingPageHeader';

type Source = DepositReconciliation['items'][number];
type StateTone = 'danger' | 'warning' | 'info' | 'success';

const value = (amount: string) => Number(amount);
const sourceTotals = (source: Source) => source.channels.reduce((total, channel) => ({
  reported: total.reported + value(channel.reported_amount),
  allocated: total.allocated + value(channel.allocated_amount),
  received: total.received + value(channel.received_amount),
}), { reported: 0, allocated: 0, received: 0 });

function sourceState(source: Source): { label: string; tone: StateTone; next: string } {
  const totals = sourceTotals(source);
  const allocationGap = totals.reported - totals.allocated;
  const receiptGap = totals.allocated - totals.received;
  if (allocationGap < -0.005 || receiptGap < -0.005) return { label: 'Perlu investigasi', tone: 'danger', next: 'Periksa alokasi berlebih atau penerimaan yang melebihi setoran.' };
  if (allocationGap > 0.005) return { label: 'Belum dialokasikan', tone: 'warning', next: 'Admin melengkapi setoran dari sumber omzet ini.' };
  if (receiptGap > 0.005) return { label: 'Menunggu Finance', tone: 'info', next: 'Finance mencatat penerimaan dan bukti kanal.' };
  return { label: 'Sesuai', tone: 'success', next: 'Sumber siap menjadi dasar pemeriksaan pembukuan.' };
}

const stateClass: Record<StateTone, string> = {
  danger: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200',
  warning: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  info: 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  success: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
};

export default function AccountingDepositReconciliationPage() {
  const { user } = useAuth();
  const allowed = Boolean(user && hasCapability(user.role, 'view:acc_deposits', user.divisionCode));
  const [params] = useSearchParams();
  const requestedMonth = params.get('month');
  const [month, setMonth] = useState(() => requestedMonth && /^20\d{2}-(0[1-9]|1[0-2])$/.test(requestedMonth) ? requestedMonth : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).slice(0, 7));
  const [page, setPage] = useState(1);
  const validMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
  const report = useQuery({ queryKey: ['acc-deposits', 'reconciliation', month, page], queryFn: () => depositsApi.reconciliation(month, page), enabled: allowed && validMonth });
  const data = report.data?.data;
  if (!allowed) return <p role="alert">Akses pencocokan setoran tidak tersedia untuk akun ini.</p>;

  return <div className="space-y-6 pb-6">
    <AccountingPageHeader area="Penerimaan Harian · Penelusuran Sumber" title="Pencocokan omzet & setoran" description="Tuntaskan selisih antara pembayaran outlet, setoran Admin, dan penerimaan Finance sebelum data dipakai dalam pembukuan." actions={<button disabled={!validMonth || report.isFetching} onClick={() => void report.refetch()} className="inline-flex min-h-10 items-center gap-2 rounded-input border border-line bg-panel px-4 text-sm font-semibold disabled:opacity-50"><RefreshCw aria-hidden="true" className={`h-4 w-4 ${report.isFetching ? 'animate-spin' : ''}`} />Muat ulang</button>} />
    <section aria-label="Alur pencocokan" className="rounded-card-lg border border-line bg-panel p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Alur kontrol penerimaan</p>
      <ol className="mt-4 grid gap-3 md:grid-cols-4">{['Omzet tervalidasi', 'Setoran dialokasikan', 'Finance menerima', 'Siap diperiksa jurnal'].map((step, index) => <li key={step} className="flex items-center gap-3 rounded-card border border-line bg-surface p-3 text-sm font-medium text-navy"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">0{index + 1}</span>{step}</li>)}</ol>
      <p className="mt-4 text-sm leading-relaxed text-subtle">Periode mengikuti tanggal bisnis omzet. Penerimaan setelah bulan omzet tetap ditarik ke sumber asalnya. Hasil ini adalah kontrol operasional dan belum memposting jurnal atau merekonsiliasi rekening bank.</p>
    </section>
    <section aria-label="Filter pencocokan" className="rounded-card-lg border border-line bg-panel p-5">
      <div className="flex flex-wrap items-end gap-4"><label className="text-sm font-medium text-navy">Periode omzet<input aria-label="Periode omzet" type="month" required value={month} onChange={event => { setMonth(event.target.value); setPage(1); }} className="mt-2 block min-h-10 rounded-input border border-line bg-panel px-3 py-2" /></label><nav aria-label="Tindak lanjut pencocokan" className="flex flex-wrap gap-2"><Link to="/accounting/pendapatan/rekap" className="inline-flex min-h-10 items-center gap-2 rounded-input border border-line px-4 text-sm font-semibold text-primary-700 dark:text-primary-300">Periksa omzet <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link><Link to="/accounting/kas-bank/setoran" className="inline-flex min-h-10 items-center gap-2 rounded-input border border-line px-4 text-sm font-semibold text-primary-700 dark:text-primary-300">Kelola setoran <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></nav></div>
    </section>
    {!validMonth ? <p role="alert">Pilih bulan omzet yang valid.</p> : report.isLoading ? <LoadingState label="Memuat pencocokan setoran..." /> : report.error ? <ErrorState description={report.error.message} onRetry={() => void report.refetch()} /> : data && <>
      <section aria-label="Ringkasan pencocokan periode" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Sumber omzet', amount: String(data.summary.total_sources), note: `${data.summary.matched_sources} sudah sesuai`, icon: Scale, tone: 'text-primary-700 dark:text-primary-300' },
          { label: 'Perlu tindak lanjut', amount: String(data.summary.attention_sources), note: `${data.summary.exception_sources} perlu investigasi`, icon: AlertTriangle, tone: 'text-amber-700 dark:text-amber-300' },
          { label: 'Belum dialokasikan', amount: formatRupiah(data.summary.unallocated_amount), note: `${data.summary.allocation_pending_sources} sumber`, icon: Clock3, tone: 'text-orange-700 dark:text-orange-300' },
          { label: 'Belum diterima Finance', amount: formatRupiah(data.summary.remaining_amount), note: `${data.summary.receipt_pending_sources} sumber`, icon: Banknote, tone: 'text-red-700 dark:text-red-300' },
        ].map(item => <article key={item.label} className="rounded-card-lg border border-line bg-panel p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-subtle">{item.label}</p><p className="mt-2 break-words text-2xl font-bold tabular-nums text-navy">{item.amount}</p><p className="mt-2 text-xs text-subtle">{item.note}</p></div><item.icon aria-hidden="true" className={`h-5 w-5 ${item.tone}`} /></div></article>)}
      </section>
      <section aria-label="Nilai pencocokan periode" className="grid gap-4 rounded-card-lg border border-line bg-panel p-5 sm:grid-cols-3">
        {([['Omzet tervalidasi', data.summary.reported_amount], ['Setoran dialokasikan', data.summary.allocated_amount], ['Penerimaan Finance', data.summary.received_amount]] as [string, string][]).map(([label, amount]) => <div key={label}><p className="text-xs font-semibold uppercase tracking-wide text-subtle">{label}</p><p className="mt-2 text-lg font-bold tabular-nums text-navy">{formatRupiah(amount)}</p></div>)}
        <p className="text-xs leading-relaxed text-subtle sm:col-span-3">Ringkasan mencakup seluruh {data.total} sumber tervalidasi pada periode, sedangkan daftar di bawah menampilkan maksimal 50 sumber per halaman. Diperbarui {new Date(data.as_of).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB.</p>
      </section>
      {data.items.length === 0 ? <EmptyState title="Belum ada sumber omzet pada halaman ini" description="Laporan hanya memuat omzet tervalidasi. Periksa bulan atau selesaikan pemeriksaan rekap omzet." /> : <section className="space-y-4" aria-label="Daftar sumber pencocokan">{data.items.map(source => {
        const totals = sourceTotals(source);
        const state = sourceState(source);
        return <article key={source.id} aria-label={`Pencocokan ${source.source_reference}`} className="overflow-hidden rounded-card-lg border border-line bg-panel">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-navy">{source.outlet_name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateClass[state.tone]}`}>{state.label}</span></div><p className="mt-1 text-sm text-subtle">{formatDate(source.business_date)} · shift {source.shift} · <span className="break-all font-medium text-navy">{source.source_reference}</span></p><p className="mt-2 text-xs text-subtle">{state.next}</p></div><Link to={`/accounting/kas-bank/setoran?omzet_id=${encodeURIComponent(source.id)}`} className="inline-flex min-h-10 items-center gap-2 rounded-input bg-primary px-4 text-sm font-semibold text-white">Buka sumber <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></header>
          <div className="grid gap-px bg-line sm:grid-cols-3"><div className="bg-panel p-4"><p className="text-xs text-subtle">Pembayaran outlet</p><p className="mt-1 font-semibold tabular-nums text-navy">{formatRupiah(totals.reported.toFixed(2))}</p></div><div className="bg-panel p-4"><p className="text-xs text-subtle">Setoran tercatat</p><p className="mt-1 font-semibold tabular-nums text-navy">{formatRupiah(totals.allocated.toFixed(2))}</p></div><div className="bg-panel p-4"><p className="text-xs text-subtle">Penerimaan Finance</p><p className="mt-1 font-semibold tabular-nums text-navy">{formatRupiah(totals.received.toFixed(2))}</p></div></div>
          <details className="group"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm font-semibold text-primary-700 dark:text-primary-300">Rincian per kanal <span className="text-xs text-subtle group-open:hidden">Tampilkan</span><span className="hidden text-xs text-subtle group-open:inline">Sembunyikan</span></summary><div role="region" aria-label={`Kanal ${source.source_reference}`} className="border-t border-line p-4"><div className="hidden grid-cols-[1.1fr_repeat(5,minmax(120px,1fr))] gap-3 px-3 pb-2 text-right text-xs font-semibold text-subtle md:grid"><span className="text-left">Kanal</span><span>Pembayaran</span><span>Setoran</span><span>Diterima</span><span>Belum dialokasikan</span><span>Belum diterima</span></div><div className="space-y-2">{source.channels.map(channel => <div key={channel.channel} className="grid gap-3 rounded-card border border-line bg-surface p-3 md:grid-cols-[1.1fr_repeat(5,minmax(120px,1fr))] md:text-right"><strong className="text-sm text-navy md:text-left">{channelLabels[channel.channel] ?? channel.channel}</strong>{([['Pembayaran', channel.reported_amount], ['Setoran', channel.allocated_amount], ['Diterima', channel.received_amount], ['Belum dialokasikan', channel.unallocated_amount], ['Belum diterima', channel.remaining_amount]] as [string, string][]).map(([label, amount], index) => <div key={label}><span className="text-xs text-subtle md:hidden">{label}</span><p className={`text-sm tabular-nums ${index > 2 && Math.abs(value(amount)) > 0.005 ? 'font-semibold text-amber-700 dark:text-amber-300' : 'text-navy'}`}>{formatRupiah(amount)}</p></div>)}</div>)}</div></div></details>
        </article>;
      })}</section>}
      <nav aria-label="Halaman pencocokan setoran" className="flex flex-wrap items-center gap-4 text-sm"><button disabled={page === 1 || report.isFetching} onClick={() => setPage(page - 1)} className="min-h-10 rounded-input border border-line px-4 disabled:opacity-50">Sebelumnya</button><span>Halaman {page} dari {Math.max(1, Math.ceil(data.total / 50))}</span><button disabled={page * 50 >= data.total || report.isFetching} onClick={() => setPage(page + 1)} className="min-h-10 rounded-input border border-line px-4 disabled:opacity-50">Berikutnya</button></nav>
      {data.summary.attention_sources === 0 && data.summary.total_sources > 0 && <div className="flex items-center gap-3 rounded-card-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"><CheckCircle2 aria-hidden="true" className="h-5 w-5" />Seluruh sumber periode ini sudah dialokasikan dan diterima.</div>}
    </>}
  </div>;
}
