import { ShieldCheck } from "lucide-react";

interface CashflowStatCardsProps {
  isReconciled?: boolean;
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
  isReconciled,
  initialBalance,
  totalRevenue,
  totalOperational,
  totalBackoffice,
  totalEndingBalance,
}: CashflowStatCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article className="rounded-card border border-line bg-panel p-4 shadow-card">
        <p className="text-xs font-medium text-subtle">A. Saldo Awal Kas</p>
        <p className="mt-1 text-xl font-bold text-navy">
          {rupiah(initialBalance)}
        </p>
        <p className="mt-1 text-xs text-subtle">Saldo Bank Awal Periode</p>
      </article>

      <article className="rounded-card border border-line bg-panel p-4 shadow-card">
        <p className="text-xs font-medium text-subtle">
          B. Total Penerimaan / Sales
        </p>
        <p className="mt-1 text-xl font-bold text-success dark:text-emerald-300">
          +{rupiah(totalRevenue)}
        </p>
        <p className="mt-1 text-xs text-subtle">Total Arus Masuk Aktual</p>
      </article>

      <article className="rounded-card border border-line bg-panel p-4 shadow-card">
        <p className="text-xs font-medium text-subtle">
          C+D. Total Pengeluaran Kas
        </p>
        <p className="mt-1 text-xl font-bold text-danger dark:text-rose-300">
          -{rupiah(totalOperational + totalBackoffice)}
        </p>
        <p className="mt-1 text-xs text-subtle">
          Beban Ops &amp; Back Office
        </p>
      </article>

      <article className="rounded-card-lg border border-primary/30 bg-primary/10 p-4 text-navy shadow-card">
        <p className="text-xs font-medium text-muted">
          TOTAL SALDO AKHIR KAS
        </p>
        <p className="mt-1 text-xl font-bold">{rupiah(totalEndingBalance)}</p>
        <p className="mt-1 text-xs text-muted flex items-center gap-1 font-medium">
          <ShieldCheck className="h-3.5 w-3.5" /> {isReconciled ? 'Saldo bank sesuai' : 'Perlu rekonsiliasi bank'}
        </p>
      </article>
    </div>
  );
}
