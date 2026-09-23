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
  operationalExpenses,
  backofficeExpenses,
}: CashflowStatementTableProps) {
  const balanceAfterOps = totalAvailable - totalOperational;

  return (
    <div className="rounded-card border border-line bg-white shadow-card overflow-hidden">
      <div className="border-b border-line bg-slate-50 p-4">
        <h2 className="text-base font-bold text-navy">
          Laporan Arus Kas Wrapping
        </h2>
        <p className="text-xs text-slate-500">
          Format resmi buku kas divisi wrapping.
        </p>
      </div>

      <div className="divide-y divide-line text-xs">
        {/* Section A */}
        <div className="bg-slate-50/50 p-3 flex justify-between font-bold text-navy">
          <span>A. SALDO AWAL BANK</span>
          <span className="font-mono">{rupiah(initialBalance)}</span>
        </div>

        {/* Section B */}
        <div className="p-3 bg-emerald-50/30 flex justify-between font-bold text-success">
          <span>B. TOTAL PENDAPATAN</span>
          <span className="font-mono">+{rupiah(totalRevenue)}</span>
        </div>
        <div className="pl-6 pr-3 py-2 flex justify-between text-slate-600">
          <span>1. Sales Store Harian (484 Transaksi)</span>
          <span className="font-mono">Rp 4.760.786.093</span>
        </div>
        <div className="pl-6 pr-3 py-2 flex justify-between text-slate-600">
          <span>2. Pendapatan Lain-lain &amp; Bunga Bank</span>
          <span className="font-mono">Rp 290.105.479</span>
        </div>
        <div className="bg-slate-100/70 px-4 py-2 flex justify-between font-semibold text-navy">
          <span>TOTAL SALDO TERSEDIA (A + B)</span>
          <span className="font-mono">{rupiah(totalAvailable)}</span>
        </div>

        {/* Section C */}
        <div className="p-3 bg-rose-50/30 flex justify-between font-bold text-danger">
          <span>C. TOTAL BIAYA OPERASIONAL</span>
          <span className="font-mono">-{rupiah(totalOperational)}</span>
        </div>
        {operationalExpenses
          .filter((x) => x.amount > 0)
          .slice(0, 7)
          .map((item) => (
            <div
              key={item.code}
              className="pl-6 pr-3 py-1.5 flex justify-between text-slate-600"
            >
              <span>
                {item.code}. {item.name}
              </span>
              <span className="font-mono">{rupiah(item.amount)}</span>
            </div>
          ))}
        <div className="pl-6 pr-3 py-1.5 text-xs text-slate-400 italic">
          ...dan 25 pos beban operasional lainnya (lihat tab Penjelasan)
        </div>
        <div className="bg-slate-100/70 px-4 py-2 flex justify-between font-semibold text-navy">
          <span>TOTAL SALDO SETELAH BIAYA OPERASIONAL</span>
          <span className="font-mono">{rupiah(balanceAfterOps)}</span>
        </div>

        {/* Section D */}
        <div className="p-3 bg-rose-50/30 flex justify-between font-bold text-danger">
          <span>D. TOTAL BIAYA BACK OFFICE</span>
          <span className="font-mono">-{rupiah(totalBackoffice)}</span>
        </div>
        {backofficeExpenses
          .filter((x) => x.amount > 0)
          .map((item) => (
            <div
              key={item.code}
              className="pl-6 pr-3 py-1.5 flex justify-between text-slate-600"
            >
              <span>
                {item.code}. {item.name}
              </span>
              <span className="font-mono">{rupiah(item.amount)}</span>
            </div>
          ))}

        {/* Grand Total */}
        <div className="bg-navy p-4 flex justify-between font-bold text-white text-sm">
          <span>TOTAL SALDO AKHIR BANK / KAS AKTUAL</span>
          <span className="font-mono text-emerald-300">
            {rupiah(totalEndingBalance)}
          </span>
        </div>

        {/* Section Outstanding Proyeksi */}
        <div className="p-4 bg-amber-50/60 border-t-2 border-warning/40 space-y-2">
          <div className="flex justify-between font-bold text-warning">
            <span>OUTSTANDING KEWAJIBAN BULAN INI</span>
            <span className="font-mono">-{rupiah(totalOutstanding)}</span>
          </div>
          <div className="flex justify-between font-bold text-danger pt-2 border-t border-warning/30 text-sm">
            <span>PROYEKSI SALDO AKHIR SETELAH OUTSTANDING</span>
            <span className="font-mono">{rupiah(projectedEndingBalance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
