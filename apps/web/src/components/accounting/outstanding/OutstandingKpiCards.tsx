const rupiah = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

interface OutstandingKpiCardsProps {
  kpis: {
    total_active_outstanding: number;
    total_paid: number;
    actual_cash_balance: number;
    projected_ending_balance: number;
  };
  activeItemsCount: number;
}

export function OutstandingKpiCards({
  kpis,
  activeItemsCount,
}: OutstandingKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-card-lg border border-line bg-white p-5 shadow-glass">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Total Outstanding Aktif
        </p>
        <p className="mt-2 text-2xl font-bold text-warning-dark">
          {rupiah(kpis.total_active_outstanding)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {activeItemsCount} item kewajiban operasional
        </p>
      </div>

      <div className="rounded-card-lg border border-line bg-white p-5 shadow-glass">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Total Realisasi Bayar
        </p>
        <p className="mt-2 text-2xl font-bold text-success">
          {rupiah(kpis.total_paid)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Tertaut ke transaksi jurnal
        </p>
      </div>

      <div className="rounded-card-lg border border-line bg-white p-5 shadow-glass">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Saldo Kas Aktual (Buku)
        </p>
        <p className="mt-2 text-2xl font-bold text-navy">
          {rupiah(kpis.actual_cash_balance)}
        </p>
        <p className="mt-1 text-xs text-slate-500">Bulan Berjalan</p>
      </div>

      <div className="rounded-card-lg border border-line bg-white p-5 shadow-glass bg-rose-50/50 border-rose-200">
        <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
          Proyeksi Saldo Setelah Outstanding
        </p>
        <p className="mt-2 text-2xl font-bold text-rose-600">
          {rupiah(kpis.projected_ending_balance)}
        </p>
        <p className="mt-1 text-xs text-rose-600/80">
          Saldo Kas - Total Outstanding
        </p>
      </div>
    </div>
  );
}
