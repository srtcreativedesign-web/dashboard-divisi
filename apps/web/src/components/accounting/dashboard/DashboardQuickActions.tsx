import { Link } from "react-router-dom";
import {
  ArrowRight,
  LineChart,
  FileText,
  CalendarDays,
  BookOpenText,
  Clock,
  Database,
  CheckCircle2,
  FileWarning,
} from "lucide-react";
import type { AccSummary } from "../../../api/accounting";

interface DashboardQuickActionsProps {
  isAdmin: boolean;
  summary: AccSummary | null | undefined;
}

export function DashboardQuickActions({
  isAdmin,
  summary,
}: DashboardQuickActionsProps) {
  const isSummaryReady = Boolean(summary);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-navy text-lg">Menu Akses Cepat</h3>

      {isSummaryReady && (
        <div
          className={`flex gap-3 rounded-card p-4 shadow-sm border ${
            summary!.isReadyForSubmission
              ? "bg-success-light/50 border-success-light text-success"
              : "bg-warning-light/50 border-warning-light text-warning"
          }`}
        >
          {summary!.isReadyForSubmission ? (
            <CheckCircle2 className="shrink-0 h-5 w-5 mt-0.5" />
          ) : (
            <FileWarning className="shrink-0 h-5 w-5 mt-0.5" />
          )}
          <div>
            <p className="font-semibold text-sm">
              {summary!.isReadyForSubmission
                ? "Data Siap Diajukan"
                : "Peringatan Dokumen"}
            </p>
            <p className="text-xs mt-1 opacity-90 leading-relaxed">
              {summary!.isReadyForSubmission
                ? "Seluruh jurnal telah memiliki dokumen bukti. Anda dapat mengajukan periode ke manajer."
                : `Terdapat ${
                    summary!.missingAttachmentCount
                  } jurnal yang belum memiliki lampiran bukti.`}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-2.5">
        {!isAdmin ? (
          <>
            <Link
              to="/accounting/cashflow"
              className="group flex items-center justify-between rounded-card border border-line bg-white p-3.5 shadow-sm transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-50 p-2 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <LineChart className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">
                    Laporan Arus Kas
                  </p>
                  <p className="text-xs text-slate-500">
                    Analisis kas masuk & keluar
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
            </Link>

            <Link
              to="/laporan"
              className="group flex items-center justify-between rounded-card border border-line bg-white p-3.5 shadow-sm transition-all hover:border-emerald-500 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">
                    Laporan Laba Rugi
                  </p>
                  <p className="text-xs text-slate-500">
                    Kinerja finansial divisi
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </Link>

            <Link
              to="/accounting/periode"
              className="group flex items-center justify-between rounded-card border border-line bg-white p-3.5 shadow-sm transition-all hover:border-warning hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning-light p-2 text-warning group-hover:bg-warning group-hover:text-white transition-colors">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">
                    Kontrol Periode
                  </p>
                  <p className="text-xs text-slate-500">Review & tutup buku</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-warning transition-colors" />
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/accounting/jurnal"
              className="group flex items-center justify-between rounded-card border border-line bg-white p-3.5 shadow-sm transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-50 p-2 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <BookOpenText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">
                    Jurnal Buku Besar
                  </p>
                  <p className="text-xs text-slate-500">
                    Input transaksi aktual & bukti
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
            </Link>

            <Link
              to="/accounting/outstanding"
              className="group flex items-center justify-between rounded-card border border-line bg-white p-3.5 shadow-sm transition-all hover:border-warning hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning-light p-2 text-warning group-hover:bg-warning group-hover:text-white transition-colors">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">
                    Outstanding Payable
                  </p>
                  <p className="text-xs text-slate-500">
                    Proses pembayaran tagihan
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-warning transition-colors" />
            </Link>

            <Link
              to="/accounting/master"
              className="group flex items-center justify-between rounded-card border border-line bg-white p-3.5 shadow-sm transition-all hover:border-slate-400 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-600 group-hover:bg-slate-500 group-hover:text-white transition-colors">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">Master Data</p>
                  <p className="text-xs text-slate-500">
                    Kelola COA & daftar vendor
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
