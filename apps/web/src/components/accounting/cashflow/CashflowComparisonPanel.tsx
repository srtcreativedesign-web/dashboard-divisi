import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { AccCashflowReportResponse } from '../../../api/accounting';

const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const monthLabel = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

export function CashflowComparisonPanel({ comparison, currentPeriod }: { comparison: NonNullable<AccCashflowReportResponse['comparison']>; currentPeriod: string }) {
  const rows = [
    ['Penerimaan', comparison.metrics.total_revenue],
    ['Pengeluaran', comparison.metrics.total_expenses],
    ['Saldo akhir', comparison.metrics.ending_cash_balance],
    ['Proyeksi setelah AP/AR', comparison.metrics.projected_ending_balance],
  ] as const;

  return <section className="rounded-card-lg border border-line bg-panel p-5" aria-labelledby="cashflow-comparison-title">
    <div><p className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">Analisis periode</p><h2 id="cashflow-comparison-title" className="mt-1 text-lg font-bold text-navy">Perubahan dari {monthLabel(comparison.previous_period_month)}</h2><p className="mt-1 text-xs text-subtle">Dibandingkan dengan {monthLabel(currentPeriod)} berdasarkan jurnal posted pada masing-masing periode.</p></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{rows.map(([label, metric]) => {
      const Icon = metric.delta > 0 ? ArrowUpRight : metric.delta < 0 ? ArrowDownRight : Minus;
      return <article key={label} className="rounded-card border border-line bg-surface/60 p-4"><p className="text-xs text-subtle">{label}</p><p className="mt-2 text-lg font-bold text-navy">{rupiah(metric.current)}</p><p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${metric.delta > 0 ? 'text-emerald-700 dark:text-emerald-300' : metric.delta < 0 ? 'text-red-700 dark:text-red-300' : 'text-subtle'}`}><Icon className="h-3.5 w-3.5" />{rupiah(metric.delta)}{metric.delta_percentage === null ? ' · basis nol' : ` · ${Math.abs(metric.delta_percentage).toLocaleString('id-ID')}%`}</p></article>;
    })}</div>
    <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-y border-line bg-surface text-xs text-subtle"><tr><th className="px-3 py-2.5">Pos terbesar berubah</th><th className="px-3 py-2.5 text-right">Periode lalu</th><th className="px-3 py-2.5 text-right">Periode ini</th><th className="px-3 py-2.5 text-right">Perubahan</th></tr></thead><tbody className="divide-y divide-line">{comparison.top_category_movements.map(item => <tr key={item.code}><td className="px-3 py-3"><strong className="text-navy">{item.code}</strong><span className="ml-2 text-subtle">{item.name}</span></td><td className="px-3 py-3 text-right tabular-nums">{rupiah(item.previous)}</td><td className="px-3 py-3 text-right tabular-nums">{rupiah(item.current)}</td><td className={`px-3 py-3 text-right font-semibold tabular-nums ${item.delta < 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{rupiah(item.delta)}</td></tr>)}</tbody></table></div>
  </section>;
}
