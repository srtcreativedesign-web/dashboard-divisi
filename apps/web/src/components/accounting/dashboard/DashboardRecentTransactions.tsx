import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ArrowDownLeft, ShieldAlert } from "lucide-react";
import type { AccTransaction } from "../../../api/accounting";

interface DashboardRecentTransactionsProps {
  transactions: AccTransaction[];
  isAdmin: boolean;
}

const rupiah = (v: number | string = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(v));

export function DashboardRecentTransactions({
  transactions,
  isAdmin,
}: DashboardRecentTransactionsProps) {
  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-navy text-lg">
          {isAdmin ? "Entri Jurnal Terakhir" : "Jurnal Terakhir"}
        </h3>
        <Link
          to="/accounting/jurnal"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="rounded-card border border-line bg-white shadow-sm overflow-hidden divide-y divide-line">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  Number(tx.creditAmount) > 0
                    ? "bg-rose-50 text-rose-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {Number(tx.creditAmount) > 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownLeft className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="font-semibold text-navy text-sm line-clamp-1">
                  {tx.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 font-mono">
                    {tx.transactionDate.slice(0, 10)}
                  </span>
                  {tx.isCancelled && (
                    <span className="rounded bg-danger-light px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                      BATAL
                    </span>
                  )}
                  {(!tx.attachments || tx.attachments.length === 0) &&
                    !tx.isCancelled && (
                      <span className="rounded bg-warning-light px-1.5 py-0.5 text-[10px] font-semibold text-warning flex items-center gap-0.5">
                        <ShieldAlert className="h-2.5 w-2.5" /> NO FILE
                      </span>
                    )}
                </div>
              </div>
            </div>
            {!isAdmin && (
              <div className="text-right">
                <p
                  className={`font-mono font-bold ${
                    Number(tx.creditAmount) > 0
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }`}
                >
                  {Number(tx.creditAmount) > 0 ? "-" : "+"}
                  {rupiah(
                    Number(tx.creditAmount) > 0
                      ? Number(tx.creditAmount)
                      : Number(tx.debitAmount),
                  )}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Bal: {rupiah(tx.runningBalance ?? 0)}
                </p>
              </div>
            )}
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">
            Belum ada transaksi di periode ini.
          </div>
        )}
      </div>
    </div>
  );
}
