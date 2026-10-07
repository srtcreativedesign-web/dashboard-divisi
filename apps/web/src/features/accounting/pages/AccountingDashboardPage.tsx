import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Banknote, CalendarDays, ChartNoAxesCombined, ClipboardCheck, Clock3, FileText, Receipt, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { accountingApi } from '../../../api/accounting';
import { ACCOUNTING_MENU_ITEMS } from '../../../config/menus';
import { ErrorState, LoadingState } from '../../../components/states';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { formatRupiah } from '../ui/format';

const monthLabel = (month: string) => new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month.slice(0, 7)}-01T00:00:00Z`));
const workDetails = {
  '/accounting/omzet': { icon: ChartNoAxesCombined, caption: 'PENDAPATAN OUTLET', description: 'Catat omzet tiap shift dan periksa kesesuaian pembayarannya.', footnote: 'Batas pengajuan H+1 · 23.59 WIB' },
  '/accounting/vouchers': { icon: FileText, caption: 'TAGIHAN & PEMBELIAN', description: 'Siapkan tagihan, lengkapi bukti, dan ikuti proses persetujuan.', footnote: 'Draf → pemeriksaan → persetujuan' },
  '/accounting/setoran': { icon: Wallet, caption: 'PENERIMAAN DANA', description: 'Cocokkan setoran outlet dengan dana yang benar-benar diterima.', footnote: 'Pencatatan dan pencocokan setoran' },
  '/accounting/kepegawaian': { icon: Users, caption: 'ADMINISTRASI TIM', description: 'Kelola rekap cuti dan realisasi absensi dari laporan manual.', footnote: 'Cuti dan kehadiran dalam satu tempat' },
};

export default function AccountingDashboardPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('');
  const can = (capability: string) => Boolean(user && hasCapability(user.role, capability, user.divisionCode));
  const canReadDetail = can('view:acc_detail');
  const periods = useQuery({ queryKey: ['accounting', 'dashboard-periods'], queryFn: async () => (await accountingApi.periods()).data });
  const sortedPeriods = periods.data?.slice().sort((a, b) => b.periodMonth.localeCompare(a.periodMonth)) ?? [];
  const activePeriod = sortedPeriods.find(period => period.periodMonth === selectedMonth) ?? sortedPeriods[0];
  const report = useQuery({
    queryKey: ['accounting', 'dashboard-cashflow-summary', activePeriod?.periodMonth],
    enabled: Boolean(activePeriod),
    queryFn: async () => (await accountingApi.cashflowSummary({ period_month: activePeriod!.periodMonth.slice(0, 7) })).data,
  });
  const loading = periods.isLoading || Boolean(activePeriod && report.isLoading);
  const error = periods.error ?? report.error;
  const jobs = ACCOUNTING_MENU_ITEMS.filter(item => item.group === 'Pekerjaan harian' && item.capability && can(item.capability));
  const metrics = report.data ? [
    { label: 'Penerimaan tercatat', value: report.data.kpis.total_revenue, icon: Banknote, note: 'Penerimaan pada periode terpilih' },
    { label: 'Beban tercatat', value: report.data.kpis.total_expenses, icon: Receipt, note: 'Beban pada periode terpilih' },
    { label: 'Saldo akhir cashflow', value: report.data.kpis.ending_cash_balance, icon: Wallet, note: 'Saldo berdasarkan laporan cashflow' },
  ] : [];

  return <div className="space-y-7 pb-6">
    <header className="overflow-hidden rounded-card-lg bg-navy text-white">
      <div className="flex flex-col justify-between gap-6 p-6 sm:p-8 lg:flex-row lg:items-center">
        <div className="max-w-xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-200"><span className="h-px w-6 bg-primary-300" aria-hidden="true" />Keuangan & administrasi</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard Accounting</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">Ruang kerja tim pusat lintas divisi. Mulai pekerjaan harian dan pantau keuangan dari satu tempat.</p>
        </div>
        <div className="flex shrink-0 items-start gap-3 border-t border-white/15 pt-5 lg:max-w-64 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <CalendarDays aria-hidden="true" className="mt-0.5 h-5 w-5 text-primary-200" />
          <div><p className="text-xs text-slate-300">Periode ringkasan</p><p className="mt-1 text-base font-semibold">{activePeriod ? monthLabel(activePeriod.periodMonth) : loading ? 'Memuat periode…' : error ? 'Belum dapat dimuat' : 'Belum ada periode'}</p><p className="mt-1 text-xs leading-relaxed text-slate-300">Berdasarkan periode yang tercatat di sistem.</p></div>
        </div>
      </div>
    </header>

    <section aria-labelledby="accounting-financial-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="accounting-financial-heading" className="text-lg font-semibold text-navy">Ringkasan keuangan</h2><p className="mt-1 text-sm text-subtle">Cashflow periode {activePeriod ? monthLabel(activePeriod.periodMonth) : 'yang tersedia'}.</p></div>
        {sortedPeriods.length > 0 && <label className="flex items-center gap-2 text-sm text-muted">Periode
          <select aria-label="Periode ringkasan" className="min-h-10 rounded-input border border-line bg-panel px-3 py-2 text-sm font-medium text-navy" value={activePeriod?.periodMonth ?? ''} onChange={event => setSelectedMonth(event.target.value)}>
            {sortedPeriods.map(period => <option key={period.id} value={period.periodMonth}>{monthLabel(period.periodMonth)}</option>)}
          </select>
        </label>}
      </div>
      {loading ? <LoadingState label="Memuat dashboard Accounting..." /> : error ? (
        <ErrorState description={error.message} onRetry={() => { void periods.refetch(); if (activePeriod) void report.refetch(); }} />
      ) : metrics.length ? (
        <section className="grid gap-4 md:grid-cols-3" aria-label="Ringkasan cashflow">
          {metrics.map((metric, index) => <article key={metric.label} className={`min-w-0 rounded-card-lg border bg-panel p-5 ${index === 2 ? 'border-primary-200 shadow-card' : 'border-line'}`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-card bg-surface-2 text-primary-700 dark:text-primary-300"><metric.icon aria-hidden="true" className="h-5 w-5" /></span>
            <h3 className="mt-5 text-sm text-muted">{metric.label}</h3><p className="mt-2 break-words text-xl font-semibold tracking-tight text-navy tabular-nums xl:text-2xl">{formatRupiah(metric.value)}</p><p className="mt-3 border-t border-line pt-3 text-xs text-subtle">{metric.note}</p>
          </article>)}
        </section>
      ) : (
        <div className="flex flex-col items-start gap-5 rounded-card-lg border border-line bg-panel p-6 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card-lg bg-surface-2 text-primary-700 dark:text-primary-300"><ChartNoAxesCombined aria-hidden="true" className="h-7 w-7" /></span>
          <div className="flex-1"><h3 className="font-semibold text-navy">Belum ada periode Accounting</h3><p className="mt-1 max-w-xl text-sm leading-relaxed text-subtle">Ringkasan akan muncul setelah periode dan transaksi dicatat. Anda tetap dapat membuka pekerjaan harian di bawah.</p></div>
          {canReadDetail && <Link to="/accounting/periode" className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-input border border-line px-4 py-2 text-sm font-semibold text-navy hover:bg-surface">Lihat periode <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}
        </div>
      )}
    </section>

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      {jobs.length > 0 ? <section aria-label="Pekerjaan Accounting" className="space-y-4">
        <div><h2 className="text-lg font-semibold text-navy">Pekerjaan harian</h2><p className="mt-1 text-sm text-subtle">Pilih pekerjaan yang ingin Anda lanjutkan.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map(item => {
            const detail = workDetails[item.path as keyof typeof workDetails];
            const Icon = detail?.icon ?? FileText;
            return <Link key={item.path} to={item.path} className="group flex min-w-0 flex-col rounded-card-lg border border-line bg-panel p-5 transition-colors hover:border-primary-300 hover:bg-primary-50/40 focus-visible:outline-2 focus-visible:outline-primary">
              <div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-card bg-surface text-primary-700 dark:text-primary-300"><Icon aria-hidden="true" className="h-5 w-5" /></span><ArrowRight aria-hidden="true" className="h-4 w-4 text-slate-400 group-hover:text-primary-700" /></div>
              <p className="mt-5 text-[10px] font-semibold tracking-[0.12em] text-subtle">{detail?.caption}</p><h3 className="mt-1 text-base font-semibold text-navy">{item.label}</h3>
              <p className="mb-5 mt-2 text-sm leading-relaxed text-subtle">{detail?.description}</p><p className="mt-auto border-t border-line pt-3 text-xs font-medium text-primary-700 dark:text-primary-300">{detail?.footnote}</p>
            </Link>;
          })}
        </div>
      </section> : <section className="rounded-card-lg border border-line bg-panel p-6"><ClipboardCheck aria-hidden="true" className="h-6 w-6 text-primary-700 dark:text-primary-300" /><h2 className="mt-3 font-semibold text-navy">Ringkasan untuk peran Anda</h2><p className="mt-2 text-sm leading-relaxed text-subtle">Akun Anda memiliki akses ringkasan. Detail transaksi dan rekening mengikuti kewenangan Accounting.</p></section>}

      <aside className="space-y-4 xl:pt-[60px]" aria-label="Panduan Accounting">
        {canReadDetail && <section className="rounded-card-lg border border-primary-200 bg-primary-50 p-5">
          <Clock3 aria-hidden="true" className="h-5 w-5 text-primary-700 dark:text-primary-300" /><h2 className="mt-3 font-semibold text-navy">Ingat batas rekap H+1</h2><p className="mt-2 text-sm leading-relaxed text-muted">Pengajuan omzet dilakukan pada hari berikutnya, paling lambat <strong className="text-navy">23.59 WIB</strong>.</p><p className="mt-3 text-xs leading-relaxed text-subtle">Periksa outlet, shift, dan rincian pembayaran sebelum mengajukan.</p>
        </section>}
        {canReadDetail && <section className="rounded-card-lg border border-line bg-panel p-5"><p className="text-xs font-semibold uppercase tracking-wider text-subtle">Laporan</p><h2 className="mt-2 font-semibold text-navy">Telusuri arus kas</h2><p className="mt-2 text-sm leading-relaxed text-subtle">Buka rincian penerimaan dan beban untuk pemeriksaan lebih lanjut.</p><Link to="/accounting/cashflow" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300 hover:underline">Buka laporan cashflow <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></section>}
      </aside>
    </div>
  </div>;
}
