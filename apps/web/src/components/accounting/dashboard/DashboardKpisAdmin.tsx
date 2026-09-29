import { FileWarning, Clock, BookOpenText } from "lucide-react";
import type { AccSummary } from "../../../api/accounting";

interface DashboardKpisAdminProps {
  summary: AccSummary | null | undefined;
  activeOutstandingCount: number;
  totalTransactions: number;
}

export function DashboardKpisAdmin({
  summary,
  activeOutstandingCount,
  totalTransactions,
}: DashboardKpisAdminProps) {
  const isSummaryReady = Boolean(summary);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Jurnal Tanpa Bukti */}
      <article className="group relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger-light text-danger">
            <FileWarning className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Jurnal Tanpa Bukti
            </p>
            <p className="mt-0.5 text-xl font-bold text-navy">
              {isSummaryReady ? summary!.missingAttachmentCount : 0} Dokumen
            </p>
          </div>
        </div>
      </article>

      {/* Outstanding Payable Items */}
      <article className="group relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning-light text-warning">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Antrean Pembayaran
            </p>
            <p className="mt-0.5 text-xl font-bold text-navy">
              {activeOutstandingCount} Tagihan
            </p>
          </div>
        </div>
      </article>

      {/* Transaksi Aktif */}
      <article className="group relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
            <BookOpenText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Transaksi
            </p>
            <p className="mt-0.5 text-xl font-bold text-navy">
              {totalTransactions} Entri
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
