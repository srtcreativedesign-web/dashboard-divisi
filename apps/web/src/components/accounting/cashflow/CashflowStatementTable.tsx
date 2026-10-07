interface ExpenseItem {
  code: string;
  name: string;
  amount: number;
}

interface CashflowStatementTableProps {
  initialBalance: number;
  totalRevenue: number;
  totalAvailable: number;
  totalOperational: number;
  totalBackoffice: number;
  totalEndingBalance: number;
  totalOutstanding: number;
  projectedEndingBalance: number;
  revenueItems: readonly ExpenseItem[];
  operationalExpenses: readonly ExpenseItem[];
  backofficeExpenses: readonly ExpenseItem[];
}

const rupiah = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

export function CashflowStatementTable({
  initialBalance,
  totalRevenue,
  totalAvailable,
  totalOperational,
  totalBackoffice,
  totalEndingBalance,
  totalOutstanding,
  projectedEndingBalance,
  revenueItems,
  operationalExpenses,
  backofficeExpenses,
}: CashflowStatementTableProps) {
  const balanceAfterOps = totalAvailable - totalOperational;

  return (
    <div className="rounded-card border border-line bg-panel shadow-card overflow-hidden">
      <div className="border-b border-line bg-surface p-4">
        <h2 className="text-base font-bold text-navy">
          Laporan Arus Kas Accounting
        </h2>
        <p className="text-xs text-subtle">
          Rincian penerimaan dan pengeluaran dari jurnal periode terpilih.
        </p>
      </div>

      <div className="divide-y divide-line text-xs">
        {/* Section A */}
        <div className="bg-surface p-3 flex justify-between font-bold text-navy">
          <span>A. SALDO AWAL BANK</span>
          <span className="font-mono">{rupiah(initialBalance)}</span>
        </div>

        {/* Section B */}
        <div className="p-3 bg-success/10 flex justify-between font-bold text-success dark:text-emerald-300">
          <span>B. TOTAL PENDAPATAN</span>
          <span className="font-mono">+{rupiah(totalRevenue)}</span>
        </div>
        {revenueItems.map(item => (
          <div key={item.code} className="pl-6 pr-3 py-2 flex justify-between gap-4 text-muted">
            <span>{item.code}. {item.name}</span>
            <span className="font-mono whitespace-nowrap">{rupiah(item.amount)}</span>
          </div>
        ))}
        <div className="bg-surface px-4 py-2 flex justify-between font-semibold text-navy">
          <span>TOTAL SALDO TERSEDIA (A + B)</span>
          <span className="font-mono">{rupiah(totalAvailable)}</span>
        </div>

        {/* Section C */}
        <div className="p-3 bg-danger/10 flex justify-between font-bold text-danger dark:text-rose-300">
          <span>C. TOTAL BIAYA OPERASIONAL</span>
          <span className="font-mono">-{rupiah(totalOperational)}</span>
        </div>
        {operationalExpenses
          .map((item) => (
            <div
              key={item.code}
              className="pl-6 pr-3 py-1.5 flex justify-between text-muted"
            >
              <span>
                {item.code}. {item.name}
              </span>
              <span className="font-mono">{rupiah(item.amount)}</span>
            </div>
          ))}
        <div className="bg-surface px-4 py-2 flex justify-between font-semibold text-navy">
          <span>TOTAL SALDO SETELAH BIAYA OPERASIONAL</span>
          <span className="font-mono">{rupiah(balanceAfterOps)}</span>
        </div>

        {/* Section D */}
        <div className="p-3 bg-danger/10 flex justify-between font-bold text-danger dark:text-rose-300">
          <span>D. TOTAL BIAYA BACK OFFICE</span>
          <span className="font-mono">-{rupiah(totalBackoffice)}</span>
        </div>
        {backofficeExpenses
          .map((item) => (
            <div
              key={item.code}
              className="pl-6 pr-3 py-1.5 flex justify-between text-muted"
            >
              <span>
                {item.code}. {item.name}
              </span>
              <span className="font-mono">{rupiah(item.amount)}</span>
            </div>
          ))}

        {/* Grand Total */}
        <div className="bg-surface p-4 flex justify-between font-bold text-navy text-sm">
          <span>TOTAL SALDO AKHIR BANK / KAS AKTUAL</span>
          <span className="font-mono text-emerald-300">
            {rupiah(totalEndingBalance)}
          </span>
        </div>

        {/* Section Outstanding Proyeksi */}
        <div className="p-4 bg-warning/10 border-t-2 border-warning/40 space-y-2">
          <div className="flex justify-between font-bold text-warning dark:text-amber-300">
            <span>OUTSTANDING KEWAJIBAN BULAN INI</span>
            <span className="font-mono">-{rupiah(totalOutstanding)}</span>
          </div>
          <div className="flex justify-between font-bold text-danger dark:text-rose-300 pt-2 border-t border-warning/30 text-sm">
            <span>PROYEKSI SALDO AKHIR SETELAH OUTSTANDING</span>
            <span className="font-mono">{rupiah(projectedEndingBalance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
