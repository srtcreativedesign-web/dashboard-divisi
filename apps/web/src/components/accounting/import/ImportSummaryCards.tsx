interface ImportSummaryCardsProps {
  totalRows: number;
  validCount: number;
  normalizedCount: number;
  warnCount: number;
  totalDebit: number;
  totalCredit: number;
}

const rupiah = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

export function ImportSummaryCards({
  totalRows,
  validCount,
  normalizedCount,
  warnCount,
  totalDebit,
  totalCredit,
}: ImportSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      <div className="rounded-card border border-line bg-white p-3 shadow-sm">
        <p className="text-[11px] font-semibold text-slate-500 uppercase">
          Total Baris
        </p>
        <p className="mt-1 text-xl font-bold text-navy">{totalRows}</p>
      </div>
      <div className="rounded-card border border-line bg-white p-3 shadow-sm">
        <p className="text-[11px] font-semibold text-slate-500 uppercase">
          Valid Langsung
        </p>
        <p className="mt-1 text-xl font-bold text-emerald-600">
          {validCount}
        </p>
      </div>
      <div className="rounded-card border border-line bg-white p-3 shadow-sm">
        <p className="text-[11px] font-semibold text-slate-500 uppercase">
          Dinormalisasi
        </p>
        <p className="mt-1 text-xl font-bold text-primary">
          {normalizedCount}
        </p>
      </div>
      <div className="rounded-card border border-line bg-white p-3 shadow-sm">
        <p className="text-[11px] font-semibold text-slate-500 uppercase">
          Kandidat Duplikat
        </p>
        <p className="mt-1 text-xl font-bold text-amber-600">{warnCount}</p>
      </div>
      <div className="rounded-card border border-line bg-white p-3 shadow-sm">
        <p className="text-[11px] font-semibold text-slate-500 uppercase">
          Total Debit
        </p>
        <p className="mt-1 text-sm font-bold text-emerald-600 font-mono">
          {rupiah(totalDebit)}
        </p>
      </div>
      <div className="rounded-card border border-line bg-white p-3 shadow-sm">
        <p className="text-[11px] font-semibold text-slate-500 uppercase">
          Total Kredit
        </p>
        <p className="mt-1 text-sm font-bold text-rose-600 font-mono">
          {rupiah(totalCredit)}
        </p>
      </div>
    </div>
  );
}
