import { ArrowDownLeft, ArrowUpRight, Landmark, WalletCards } from 'lucide-react';
import type { AccOutstandingResponse } from '../../../api/accounting';

const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
export function OutstandingKpiCards({ kpis }: { kpis: AccOutstandingResponse['kpis'] }) {
  const cards = [
    { label: 'Hutang aktif', value: kpis.total_active_payable, note: 'Kas yang masih harus dibayarkan', icon: ArrowUpRight, tone: 'text-danger bg-danger/10' },
    { label: 'Piutang aktif', value: kpis.total_active_receivable, note: 'Kas yang masih harus diterima', icon: ArrowDownLeft, tone: 'text-success bg-success/10' },
    { label: 'Saldo kas buku', value: kpis.actual_cash_balance, note: 'Sebelum hutang dan piutang', icon: Landmark, tone: 'text-primary bg-primary/10' },
    { label: 'Proyeksi setelah realisasi', value: kpis.projected_ending_balance, note: 'Saldo − hutang + piutang', icon: WalletCards, tone: 'text-violet-700 bg-violet-500/10 dark:text-violet-300' },
  ];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, note, icon: Icon, tone }) => <article key={label} className="rounded-card-lg border border-line bg-panel p-5 shadow-sm"><div className={`inline-flex rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div><p className="mt-4 text-xs font-bold uppercase tracking-wider text-subtle">{label}</p><p className="mt-1 break-words text-2xl font-black tabular-nums text-navy">{money(value)}</p><p className="mt-2 text-xs text-subtle">{note}</p></article>)}</div>;
}
