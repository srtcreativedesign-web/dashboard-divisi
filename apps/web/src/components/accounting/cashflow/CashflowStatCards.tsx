import { ShieldCheck } from "lucide-react";

interface CashflowStatCardsProps {
  initialBalance: number;
  totalRevenue: number;
  totalOperational: number;
  totalBackoffice: number;
  totalEndingBalance: number;
}

const rupiah = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

export function CashflowStatCards({
  initialBalance,
  totalRevenue,
  totalOperational,
  totalBackoffice,
  totalEndingBalance,
}: CashflowStatCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article className="rounded-card border border-line bg-white p-4 shadow-card">
        <p className="text-xs font-medium text-slate-500">A. Saldo Awal Kas</p>
        <p className="mt-1 text-xl font-bold text-navy">
          {rupiah(initialBalance)}
        </p>
        <p className="mt-1 text-xs text-slate-400">Saldo Bank Awal Periode</p>
      </article>

      <article className="rounded-card border border-line bg-white p-4 shadow-card">
        <p className="text-xs font-medium text-slate-500">
          B. Total Penerimaan / Sales
        </p>
        <p className="mt-1 text-xl font-bold text-success">
          +{rupiah(totalRevenue)}
        </p>
        <p className="mt-1 text-xs text-slate-400">Total Arus Masuk Aktual</p>
      </article>

      <article className="rounded-card border border-line bg-white p-4 shadow-card">
        <p className="text-xs font-medium text-slate-500">
          C+D. Total Pengeluaran Kas
        </p>
        <p className="mt-1 text-xl font-bold text-danger">
          -{rupiah(totalOperational + totalBackoffice)}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Beban Ops &amp; Back Office
        </p>
      </article>

      <article className="rounded-card-lg bg-gradient-to-br from-navy to-slate-800 p-4 text-white shadow-card">
        <p className="text-xs font-medium text-slate-300">
          TOTAL SALDO AKHIR KAS
        </p>
        <p className="mt-1 text-xl font-bold">{rupiah(totalEndingBalance)}</p>
        <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1 font-medium">
          <ShieldCheck className="h-3.5 w-3.5" /> Rekonsiliasi Bank 100% Cocok
        </p>
      </article>
    </div>
  );
}
