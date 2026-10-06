import { useQuery } from '@tanstack/react-query';
import { Banknote, Wallet, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { accountingApi } from '../../../api/accounting';
import { ACCOUNTING_MENU_ITEMS } from '../../../config/menus';
import { EmptyState, ErrorState, LoadingState } from '../../../components/states';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';

const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
export default function AccountingDashboardPage() {
  const { user } = useAuth();
  const canReadDetail = Boolean(user && hasCapability(user.role, 'view:acc_detail', user.divisionCode));
  const periods = useQuery({ queryKey: ['accounting', 'dashboard-periods'], queryFn: async () => (await accountingApi.periods()).data });
  const latest = periods.data?.slice().sort((a,b) => b.periodMonth.localeCompare(a.periodMonth))[0];
  const report = useQuery({ queryKey: ['accounting', 'dashboard-cashflow-summary', latest?.periodMonth], enabled: Boolean(latest), queryFn: async () => (await accountingApi.cashflowSummary({ period_month: latest!.periodMonth.slice(0,7) })).data });
  if (periods.isLoading || (latest && report.isLoading)) return <LoadingState label="Memuat dashboard Accounting..." />;
  const error = periods.error ?? report.error;
  if (error) return <ErrorState description={error.message} onRetry={() => { void periods.refetch(); if (latest) void report.refetch(); }} />;
  const metrics = report.data ? [
    { label: 'Penerimaan tercatat', value: report.data.kpis.total_revenue, icon: Banknote },
    { label: 'Beban tercatat', value: report.data.kpis.total_expenses, icon: Receipt },
    { label: 'Saldo akhir cashflow', value: report.data.kpis.ending_cash_balance, icon: Wallet },
  ] : [];
  return <div className="space-y-6">
    <section className="rounded-card-lg border border-line bg-white p-6 shadow-card">
      <h1 className="text-2xl font-semibold text-navy">Dashboard Accounting</h1>
      <p className="mt-2 text-sm text-slate-500">Tim pusat lintas divisi. Ringkasan cashflow berdasarkan transaksi periode {latest?.periodMonth.slice(0,7) ?? 'yang tersedia'}.</p>
    </section>
    {metrics.length ? <section className="grid gap-4 md:grid-cols-3" aria-label="Ringkasan cashflow">
      {metrics.map(metric => <article key={metric.label} className="rounded-card-lg border border-line bg-white p-5 shadow-card">
        <metric.icon aria-hidden="true" className="h-5 w-5 text-primary" /><p className="mt-4 text-sm text-slate-500">{metric.label}</p><p className="mt-2 text-2xl font-semibold text-navy">{rupiah(metric.value)}</p>
      </article>)}
    </section> : <EmptyState title="Belum ada periode Accounting" description="Ringkasan akan muncul setelah periode dan transaksi dicatat." />}
    {user && ACCOUNTING_MENU_ITEMS.some(item => item.group === 'Pekerjaan harian' && item.capability && hasCapability(user.role,item.capability,user.divisionCode)) && <section aria-label="Pekerjaan Accounting" className="space-y-3">
      <h2 className="text-lg font-semibold">Pekerjaan harian</h2><div className="grid gap-3 sm:grid-cols-2">
      {ACCOUNTING_MENU_ITEMS.filter(item => item.group === 'Pekerjaan harian' && item.capability && hasCapability(user.role,item.capability,user.divisionCode)).map(item => <Link key={item.path} to={item.path} className="rounded-card border border-line bg-white p-4 transition-colors hover:border-primary-300 focus-visible:outline-2 focus-visible:outline-primary">
        <span className="font-semibold text-navy">{item.label}</span><p className="mt-1 text-sm text-slate-500">{({'/accounting/omzet':'Rekap per outlet dan shift; pengajuan sampai akhir H+1.','/accounting/vouchers':'Tagihan dan pembelian melalui pemeriksaan serta persetujuan.','/accounting/setoran':'Cocokkan setoran dengan penerimaan dana aktual.','/accounting/kepegawaian':'Catat cuti dan realisasi absensi dari sumber manual.'} as Record<string,string>)[item.path]}</p>
      </Link>)}
      </div></section>}
    {canReadDetail ? <Link to="/accounting/cashflow" className="inline-flex rounded-input border border-line bg-white px-4 py-2 text-sm font-medium">Buka laporan cashflow</Link> : <p className="text-sm text-slate-500">Akun Anda memiliki akses ringkasan. Detail transaksi dan rekening mengikuti kewenangan Accounting.</p>}
  </div>;
}
