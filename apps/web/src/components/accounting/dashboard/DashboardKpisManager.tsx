import { CreditCard, ArrowDownLeft, ArrowUpRight, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import type { AccSummary } from '../../../api/accounting';

interface DashboardKpisManagerProps {
  summary: AccSummary | null | undefined;
  activeOutstanding: number;
}

const rupiah = (v: number | string = 0) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(v));

export function DashboardKpisManager({ summary, activeOutstanding }: DashboardKpisManagerProps) {
  const isSummaryReady = Boolean(summary);

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {/* Saldo Berjalan */}
      <article className='group relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600'>
            <CreditCard className='h-5 w-5' />
          </div>
          <div>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>
              Saldo Tersedia
            </p>
            <p className='mt-0.5 text-xl font-bold text-navy font-mono'>
              {isSummaryReady ? rupiah(summary!.runningBalance) : 'Rp 0'}
            </p>
          </div>
        </div>
        <div className='mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium'>
          <TrendingUp className='h-3.5 w-3.5' />
          <span>+5.4% vs bulan lalu</span>
        </div>
      </article>

      {/* Total Debit */}
      <article className='group relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600'>
            <ArrowDownLeft className='h-5 w-5' />
          </div>
          <div>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>
              Penerimaan
            </p>
            <p className='mt-0.5 text-xl font-bold text-navy font-mono'>
              {isSummaryReady ? rupiah(summary!.totalDebit) : 'Rp 0'}
            </p>
          </div>
        </div>
        <div className='mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium'>
          <TrendingUp className='h-3.5 w-3.5' />
          <span>+8.1% vs bulan lalu</span>
        </div>
      </article>

      {/* Total Kredit */}
      <article className='group relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600'>
            <ArrowUpRight className='h-5 w-5' />
          </div>
          <div>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>
              Pengeluaran
            </p>
            <p className='mt-0.5 text-xl font-bold text-navy font-mono'>
              {isSummaryReady ? rupiah(summary!.totalCredit) : 'Rp 0'}
            </p>
          </div>
        </div>
        <div className='mt-3 flex items-center gap-1.5 text-xs text-rose-600 font-medium'>
          <TrendingDown className='h-3.5 w-3.5' />
          <span>-3.2% vs bulan lalu</span>
        </div>
      </article>

      {/* Tagihan Belum Dibayar */}
      <article className='group relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning-light text-warning'>
            <Clock className='h-5 w-5' />
          </div>
          <div>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>
              Unpaid Payable
            </p>
            <p className='mt-0.5 text-xl font-bold text-warning font-mono'>
              {rupiah(activeOutstanding)}
            </p>
          </div>
        </div>
        <div className='mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium'>
          <TrendingDown className='h-3.5 w-3.5' />
          <span>-12.0% vs bulan lalu</span>
        </div>
      </article>
    </div>
  );
}
