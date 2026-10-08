import { AccountingActionDesk } from '../ui/AccountingActionDesk';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, CalendarDays, ChartNoAxesCombined, ClipboardCheck, FileText, RefreshCw, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { accountingApi } from '../../../api/accounting';
import { omzetApi } from '../../../api/omzet';
import { dashboardApi } from '../api/dashboard';
import { ACCOUNTING_MENU_ITEMS } from '../../../config/menus';
import { ErrorState, LoadingState } from '../../../components/states';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { formatRupiah, formatDate } from '../ui/format';
import { KPICard, KPICardGrid } from '../../../components/ui/primitives';
import { Card, CardHeader } from '../../../components/ui/Card';
import { AccountingPageHeader } from '../../../components/accounting/AccountingPageHeader';
import { roleDisplay } from '../../../config/session';

const monthLabel = (month: string) => new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(month.slice(0, 7) + '-01T00:00:00Z'));
const currentMonth = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  return parts.find(p => p.type === 'year')!.value + '-' + parts.find(p => p.type === 'month')!.value;
};
const centsLabel = (value: bigint) => formatRupiah(String(value / 100n) + '.' + String(value % 100n).padStart(2, '0'));
const panel = 'rounded-card-lg border border-line bg-panel shadow-xs';
const statusNames = { draft: 'Draf', correction: 'Perlu koreksi', submitted: 'Pemeriksaan Accounting', pending_approval: 'Persetujuan Manager', approved: 'Disetujui' };
const moneyCents = (value: string | null) => value && /^\d+\.\d{2}$/.test(value) ? BigInt(value.replace('.', '')) : 0n;

const roleDashboardCopy: Record<string, { title: string; description: string }> = {
  ADMIN: { title: 'Meja Kerja Admin Accounting', description: 'Lengkapi rekap H+1 dan voucher, perbaiki dokumen yang dikembalikan, lalu pantau status pengajuannya.' },
  STAFF_ACCOUNTING: { title: 'Pusat Pemeriksaan Accounting', description: 'Periksa sumber transaksi, selisih, voucher, dan kesiapan dokumen sebelum diteruskan untuk keputusan.' },
  MANAGER: { title: 'Pusat Keputusan Accounting', description: 'Tinjau pengajuan, materialitas selisih, risiko jatuh tempo, dan keputusan yang menunggu persetujuan.' },
  FINANCE: { title: 'Kontrol Realisasi Keuangan', description: 'Pantau voucher yang telah disetujui, jadwal jatuh tempo, pembayaran, dan sisa realisasi.' },
};

export default function AccountingDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState('');
  const can = (capability: string) => Boolean(user && hasCapability(user.role, capability, user.divisionCode));
  const detail = can('view:acc_detail');
  const periods = useQuery({ queryKey: ['accounting', 'dashboard-periods'], queryFn: async () => (await accountingApi.periods()).data });
  const sortedPeriods = periods.data?.slice().sort((a, b) => b.periodMonth.localeCompare(a.periodMonth)) ?? [];
  const month = selectedMonth || sortedPeriods[0]?.periodMonth.slice(0, 7) || currentMonth();
  const activePeriod = sortedPeriods.find(p => p.periodMonth.slice(0, 7) === month);
  const report = useQuery({ queryKey: ['accounting', 'dashboard-cashflow-summary', month], enabled: Boolean(activePeriod), queryFn: async () => (await accountingApi.cashflowSummary({ period_month: month })).data });
  const operations = useQuery({ queryKey: ['accounting', 'dashboard-operations', month], enabled: detail && !periods.isLoading, queryFn: async () => (await dashboardApi.operations(month)).data });
  const annual = useQuery({ queryKey: ['accounting', 'dashboard-annual-omzet', month.slice(0, 4)], enabled: detail && !periods.isLoading, queryFn: async () => (await omzetApi.annual(Number(month.slice(0, 4)))).data });
  const data = operations.data?.counts ? operations.data : undefined;
  const monthTrend = annual.data?.months?.find(m => m.month === month);
  const previousDate = new Date(month + '-01T00:00:00Z'); previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
  const previous = annual.data?.months?.find(m => m.month === previousDate.toISOString().slice(0, 7));
  const difference = monthTrend?.amount !== null && monthTrend?.amount !== undefined && previous?.amount !== null && previous?.amount !== undefined ? moneyCents(monthTrend.amount) - moneyCents(previous.amount) : null;
  const jobs = ACCOUNTING_MENU_ITEMS.filter(item => ['/accounting/kas-bank/setoran', '/accounting/administrasi/pegawai'].includes(item.path) && item.capability && can(item.capability));
  const queues = data ? [
    { name: 'Lengkapi draf voucher', count: data.counts.draft, status: 'draft', enabled: can('write:voucher'), note: 'Lengkapi lalu ajukan untuk pemeriksaan.' },
    { name: 'Perbaiki voucher', count: data.counts.correction, status: 'correction', enabled: can('write:voucher'), note: 'Pengajuan dikembalikan untuk koreksi.' },
    { name: 'Pemeriksaan voucher', count: data.counts.submitted, status: 'submitted', enabled: can('validate:voucher'), note: 'Periksa rincian sebelum diteruskan ke Manager.' },
    { name: 'Persetujuan voucher', count: data.counts.pending_approval, status: 'pending_approval', enabled: can('approve:voucher'), note: 'Pengajuan sudah diperiksa Accounting.' },
    { name: 'Realisasi voucher', count: data.unpaid_count, status: 'approved', enabled: can('execute:payment'), note: 'Voucher disetujui yang masih memiliki sisa.' },
  ].filter(q => q.enabled) : [];
  const pending = queues.reduce((total, q) => total + q.count, 0);
  const monthOptions = [...new Set([currentMonth(), ...sortedPeriods.map(p => p.periodMonth.slice(0, 7)), ...Array.from({ length: 12 }, (_, i) => month.slice(0, 4) + '-' + String(i + 1).padStart(2, '0'))])].sort().reverse();
  const max = annual.data?.months?.reduce((n, m) => moneyCents(m.amount) > n ? moneyCents(m.amount) : n, 0n) ?? 0n;
  const refresh = () => { if (detail) void queryClient.invalidateQueries({ queryKey: ['accounting-desk'] }); void periods.refetch(); if (activePeriod) void report.refetch(); if (detail) { void operations.refetch(); void annual.refetch(); } };
  const linkTo = (status = '') => '/accounting/pengeluaran/voucher?month=' + month + (status ? '&status=' + status : '');
  const dashboardCopy = roleDashboardCopy[user?.role ?? ''] ?? { title: 'Dashboard Accounting', description: 'Pantau pekerjaan, pendapatan, pengeluaran, dan posisi keuangan sesuai kewenangan akun.' };

  return <div className="space-y-6 pb-6">
    <AccountingPageHeader
      area="Kontrol Keuangan & Kepatuhan"
      title={dashboardCopy.title}
      description={dashboardCopy.description}
      actions={<><label className="flex items-center gap-2 rounded-input border border-line bg-panel px-3 py-1.5 shadow-card"><CalendarDays aria-hidden="true" className="h-4 w-4 text-subtle" /><span className="sr-only">Periode ringkasan</span><select aria-label="Periode ringkasan" className="min-h-8 bg-panel text-sm font-medium text-navy" value={month} onChange={e => setSelectedMonth(e.target.value)}>{monthOptions.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}</select></label><button type="button" onClick={refresh} className="flex min-h-11 items-center gap-2 rounded-input border border-line bg-panel px-3 text-sm font-medium text-navy shadow-card hover:bg-surface"><RefreshCw aria-hidden="true" className={'h-4 w-4 ' + (operations.isFetching || report.isFetching ? 'animate-spin motion-reduce:animate-none' : '')} />Muat ulang</button></>}
    />

    <section aria-label="Konteks kerja Accounting" className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card">
      <div className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Periode kerja', value: monthLabel(month), note: activePeriod ? `Periode jurnal ${activePeriod.status === 'open' ? 'terbuka' : activePeriod.status}` : 'Belum ada periode jurnal' },
          { label: 'Peran aktif', value: user ? roleDisplay(user.role) : 'Pengguna', note: 'Tindakan mengikuti kewenangan akun' },
          { label: 'Cakupan data', value: 'Lintas divisi', note: 'Accounting pusat · sumber outlet' },
          { label: 'Register dokumen', value: detail ? 'Tersedia' : 'Ringkasan', note: detail ? 'Telusuri status dan penanggung jawab' : 'Detail dibatasi oleh kewenangan' },
        ].map(item => <div key={item.label} className="bg-panel px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-wider text-subtle">{item.label}</p><p className="mt-1.5 text-sm font-bold text-navy">{item.value}</p><p className="mt-1 text-xs leading-relaxed text-subtle">{item.note}</p></div>)}
      </div>
      {detail && <div className="flex justify-end border-t border-line bg-surface px-5 py-2.5"><Link className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300" to={'/accounting/dokumen/register?month=' + month}>Buka register dokumen <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link></div>}
    </section>

    <AccountingActionDesk key={month} month={month} />

    {detail && <section aria-label="Ringkasan operasional" className="space-y-3">
      {operations.isLoading || periods.isLoading ? <LoadingState label="Memuat ringkasan operasional..." /> : operations.error ? <ErrorState description={operations.error.message} onRetry={() => { void operations.refetch(); }} /> : data ? <>
        <KPICardGrid columns={4}>
          <KPICard
            variant="gradient"
            label="Omzet tervalidasi"
            value={monthTrend?.amount != null ? formatRupiah(monthTrend.amount) : 'Belum tersedia'}
            note={annual.error ? 'Laporan omzet belum dapat dimuat' : annual.isLoading ? 'Memuat laporan omzet…' : (monthTrend ? monthTrend.validated_count + ' rekap tervalidasi · ' + monthLabel(month) : 'Belum ada rekap tervalidasi pada bulan ini')}
            icon={<ChartNoAxesCombined aria-hidden="true" className="h-5 w-5" />}
            trend={difference !== null ? {
              value: centsLabel(difference < 0n ? -difference : difference),
              label: 'dibanding bulan lalu',
              positive: difference >= 0n,
            } : undefined}
            action={<Link to="/accounting/pendapatan/analisis" className="inline-flex items-center gap-1 text-xs font-semibold text-white">Laporan tahunan <ArrowUpRight className="h-3.5 w-3.5" /></Link>}
          />
          <KPICard
            label="Pengeluaran disetujui"
            value={data.counts.approved ? formatRupiah(data.approved_amount) : 'Belum tersedia'}
            note={data.counts.approved + ' voucher disetujui'}
            icon={<FileText aria-hidden="true" className="h-5 w-5" />}
          />
          <KPICard
            label="Sisa realisasi voucher"
            value={data.counts.approved ? formatRupiah(data.remaining_amount) : 'Belum tersedia'}
            note={data.unpaid_count + ' voucher belum lunas · ' + data.overdue_count + ' lewat jatuh tempo'}
            icon={<Wallet aria-hidden="true" className="h-5 w-5" />}
          />
          <KPICard
            label={queues.length ? 'Voucher untuk Anda' : 'Menunggu proses'}
            value={String(queues.length ? pending : data.counts.submitted + data.counts.pending_approval)}
            note={queues.length ? 'Voucher untuk Anda tindak lanjuti' : 'Pemeriksaan & persetujuan'}
            icon={<ClipboardCheck aria-hidden="true" className="h-5 w-5" />}
          />
        </KPICardGrid>
        <details className="text-xs text-subtle"><summary className="w-fit cursor-pointer rounded py-1 font-medium focus-visible:outline-2 focus-visible:outline-primary">Dasar angka dan periode</summary><p className="mt-2 max-w-3xl leading-relaxed">Voucher mengikuti tanggal voucher. Pengeluaran disetujui belum merupakan beban jurnal; realisasi adalah catatan pembayaran aktif, bukan saldo bank atau hutang jurnal.</p></details>
      </> : <p className="rounded-card-lg border border-line bg-panel p-5 shadow-xs text-sm text-subtle">Ringkasan operasional belum tersedia.</p>}
    </section>}

    <div className={'grid gap-5 ' + (detail ? 'lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]' : '')}>
      {detail && <Card variant="default" padding="md" aria-label="Tren omzet">
        <CardHeader
          title="Tren omzet outlet"
          subtitle={`Tahun ${month.slice(0, 4)} · hanya rekap tervalidasi`}
          action={<Link to="/accounting/pendapatan/analisis" className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300">Laporan tahunan <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>}
        />
        {annual.isLoading || periods.isLoading ? <LoadingState label="Memuat tren omzet..." /> : annual.error ? <ErrorState description={annual.error.message} onRetry={() => { void annual.refetch(); }} /> : annual.data?.months ? <>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-subtle">{monthLabel(month)}</p>
              <p className="mt-1 text-2xl font-semibold text-navy tabular-nums">{monthTrend?.amount != null ? formatRupiah(monthTrend.amount) : 'Belum ada omzet tervalidasi'}</p>
            </div>
            <p className="max-w-64 text-xs text-subtle">{difference !== null ? (difference >= 0n ? 'Naik ' : 'Turun ') + centsLabel(difference < 0n ? -difference : difference) + ' dibanding bulan sebelumnya' : 'Perbandingan muncul setelah kedua bulan memiliki data.'}</p>
          </div>
          <div className={'mt-6 grid grid-cols-12 items-end gap-1 border-b border-line pb-2 ' + (annual.data.validated_count ? 'h-40' : 'h-14')} aria-label="Omzet per bulan">
            {annual.data.months.map(m => { const cents = moneyCents(m.amount); const height = max > 0n ? Number(cents * 100n / max) : 0; return <button key={m.month} type="button" onClick={() => setSelectedMonth(m.month)} aria-label={monthLabel(m.month) + ': ' + (m.amount === null ? 'belum ada data' : formatRupiah(m.amount))} aria-pressed={m.month === month} className="group flex h-full min-w-0 flex-col justify-end rounded-t focus-visible:outline-2 focus-visible:outline-primary" title={m.amount === null ? 'Belum ada data tervalidasi' : formatRupiah(m.amount)}><span className={'mx-auto w-3/4 rounded-t transition-colors ' + (m.month === month ? 'bg-primary-600' : 'bg-primary-200 dark:bg-primary-900 group-hover:bg-primary-400')} style={{ height: cents === 0n ? 0 : Math.max(height, 2) + '%'}} /><span className={'mt-2 text-[10px] sm:text-xs ' + (m.month === month ? 'font-bold text-primary-700 dark:text-primary-300' : 'text-subtle')}>{new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' }).format(new Date(m.month + '-01T00:00:00Z'))}</span></button>; })}
          </div>
          <p className="mt-3 text-xs text-subtle">Klik bulan untuk melihat ringkasannya. Bulan tanpa data tidak ditampilkan sebagai omzet nol.{month === currentMonth() && ' Bulan berjalan belum lengkap; perbandingan memakai total tervalidasi hingga saat ini.'}</p>
        </> : <p className="py-8 text-sm text-subtle">Belum ada laporan omzet tervalidasi.</p>}
      </Card>}
      <section className={panel + ' p-5 sm:p-6'} aria-label="Kontrol voucher"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-navy">Kontrol voucher</h2><ClipboardCheck aria-hidden="true" className="h-5 w-5 text-subtle" /></div><p className="mt-1 text-xs text-subtle">{monthLabel(month)} · sesuai akses akun</p>{queues.length > 0 && <p className="mt-4 text-sm font-medium text-muted"><span className="mr-2 inline-flex min-w-8 justify-center rounded-md bg-primary/10 px-2 py-1 font-bold tabular-nums text-primary-700 dark:text-primary-300">{pending}</span>voucher perlu ditindaklanjuti</p>}
        {queues.length ? <div className="mt-3 space-y-2">{queues.slice().sort((a, b) => Number(b.status === 'correction' && b.count > 0) - Number(a.status === 'correction' && a.count > 0)).map(q => <Link key={q.name} to={linkTo(q.status)} className={'group flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary ' + (q.status === 'correction' && q.count > 0 ? 'border-warning/30 bg-warning/5' : 'border-line')}><div><h3 className="text-sm font-semibold text-navy">{q.name}</h3><p className="mt-1 text-xs leading-relaxed text-subtle">{q.note}</p></div><span className="flex shrink-0 items-center gap-2"><span className={'inline-flex min-h-8 min-w-8 items-center justify-center rounded-md px-2 text-base font-bold tabular-nums ' + (q.status === 'correction' && q.count > 0 ? 'bg-warning/10 text-warning dark:text-amber-300' : 'bg-primary/10 text-primary-700 dark:text-primary-300')}>{q.count}</span><ArrowRight aria-hidden="true" className="h-4 w-4 text-subtle" /></span></Link>)}</div> : <p className="mt-6 text-sm leading-relaxed text-subtle">{detail && operations.isLoading ? 'Memuat antrean pekerjaan…' : 'Ringkasan mengikuti kewenangan akun. Pemeriksaan dan perubahan transaksi tersedia pada role yang berizin.'}</p>}
        {can('write:omzet') && <Link to={'/accounting/pendapatan/rekap?month=' + month} className="mt-4 flex items-start justify-between gap-3 rounded-input border border-line bg-surface p-3"><div><p className="text-sm font-semibold text-navy">Rekap omzet H+1</p><p className="mt-1 text-xs text-subtle">Pengajuan paling lambat 23.59 WIB pada H+1.</p></div><ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-subtle" /></Link>}
      </section>
    </div>

    <section className={panel + ' p-5 sm:p-6'} aria-labelledby="accounting-financial-heading"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="accounting-financial-heading" className="text-lg font-semibold text-navy">Ringkasan keuangan</h2><p className="mt-1 text-xs text-subtle">Cashflow {monthLabel(month)} · berdasarkan transaksi jurnal</p></div>{detail && <Link to="/accounting/kas-bank/cashflow" className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300">Buka laporan cashflow <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>}</div>
      {periods.isLoading || (activePeriod && report.isLoading) ? <LoadingState label="Memuat dashboard Accounting..." /> : periods.error || report.error ? <ErrorState description={(periods.error ?? report.error)!.message} onRetry={() => { void periods.refetch(); if (activePeriod) void report.refetch(); }} /> : report.data && activePeriod ? <section className="mt-5 grid gap-5 sm:grid-cols-3" aria-label="Ringkasan cashflow">{[{ label: 'Penerimaan tercatat', value: report.data.kpis.total_revenue }, { label: 'Beban tercatat', value: report.data.kpis.total_expenses }, { label: 'Saldo akhir cashflow', value: report.data.kpis.ending_cash_balance }].map(k => <article key={k.label} className="border-l-2 border-primary-200 pl-4"><h3 className="text-xs text-subtle">{k.label}</h3><p className="mt-2 break-words text-xl font-semibold text-navy tabular-nums">{formatRupiah(k.value)}</p></article>)}</section> : <div className="mt-5 rounded-input bg-surface p-4"><h3 className="text-sm font-semibold text-navy">{sortedPeriods.length ? 'Belum ada periode jurnal pada bulan ini' : 'Belum ada periode Accounting'}</h3><p className="mt-1 text-xs leading-relaxed text-subtle">Cashflow akan tersedia setelah periode dan transaksi jurnal dicatat. Voucher dan omzet tetap memiliki ringkasan tersendiri.</p>{detail && <Link to="/accounting/pembukuan/periode" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300">Lihat periode <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}</div>}
    </section>

    {detail && data && <div className="grid gap-5 lg:grid-cols-[minmax(260px,1fr)_minmax(0,1.65fr)]">
      <section className={panel + ' p-5 sm:p-6'} aria-label="Status voucher"><h2 className="text-lg font-semibold text-navy">Alur voucher</h2><p className="mt-1 text-xs text-subtle">{data.total} voucher pada bulan terpilih</p><div className="mt-5 space-y-4">{Object.entries(statusNames).map(([status, label]) => { const count = data.counts[status as keyof typeof data.counts]; return <Link key={status} to={linkTo(status)} className="block"><div className="flex justify-between gap-2 text-xs"><span className="text-muted">{label}</span><span className="font-semibold text-navy tabular-nums">{count}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary-500" style={{ width: (data.total ? count / data.total * 100 : 0) + '%' }} /></div></Link>; })}</div></section>
      <section className={panel + ' min-w-0 overflow-hidden'} aria-label="Voucher jatuh tempo"><div className="flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6"><div><h2 className="text-lg font-semibold text-navy">Jadwal realisasi</h2><p className="mt-1 text-xs text-subtle">Hingga lima voucher disetujui dengan sisa, urut jatuh tempo</p></div><Link to={linkTo('approved')} className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300">Lihat voucher <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></div>{data.due_vouchers.length ? <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><caption className="sr-only">Voucher disetujui yang belum lunas</caption><thead className="border-y border-line bg-surface text-xs text-subtle"><tr><th className="px-5 py-3 font-medium">Voucher / sumber</th><th className="px-4 py-3 font-medium">Jatuh tempo</th><th className="px-5 py-3 text-right font-medium">Sisa</th></tr></thead><tbody className="divide-y divide-line">{data.due_vouchers.map(v => <tr key={v.id}><td className="px-5 py-4"><Link className="font-medium text-primary-700 dark:text-primary-300 hover:underline" to={linkTo('approved') + '&voucher=' + v.id}>{v.source_reference}</Link><p className="mt-1 text-xs text-subtle">{v.outlet_name} · {v.source_division_code}</p></td><td className="whitespace-nowrap px-4 py-4 text-muted">{formatDate(v.due_date)}</td><td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-navy tabular-nums">{formatRupiah(v.remaining_amount)}</td></tr>)}</tbody></table></div> : <p className="px-5 pb-6 text-sm text-subtle">Tidak ada voucher disetujui dengan sisa realisasi pada bulan ini.</p>}</section>
    </div>}

    {jobs.length > 0 && <nav aria-label="Pekerjaan Accounting" className="flex flex-wrap items-center gap-2 border-t border-line pt-5"><p className="mr-2 text-xs font-semibold text-subtle">Buka modul</p>{jobs.map(item => <Link key={item.path} to={item.path} className="inline-flex min-h-10 items-center gap-2 rounded-input border border-line bg-panel px-3 text-xs font-medium text-navy hover:bg-surface">{item.label}<ArrowUpRight aria-hidden="true" className="h-3 w-3" /></Link>)}</nav>}
  </div>;
}
