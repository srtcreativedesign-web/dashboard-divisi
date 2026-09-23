import {
  ArrowRight,
  CheckCircle2,
  FileWarning,
  WalletCards,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Clock,
  BookOpenText,
  Database,
  CalendarDays,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AccountingQueryState } from "../components/accounting/AccountingStates";
import {
  useAccountingPeriods,
  useAccountingSummary,
  useAccountingOutstandings,
  useAccountingTransactions,
} from "../hooks/useAccounting";

const rupiah = (v: number | string = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(v));

export default function AccountingDashboardPage() {
  const periods = useAccountingPeriods();
  const active =
    periods.data?.find((p) =>
      ["draft", "pending_approval", "reopened"].includes(p.status),
    ) ?? periods.data?.[0];

  const periodId = active?.id ?? "";

  const summary = useAccountingSummary(periodId);
  const outstandings = useAccountingOutstandings({ period_id: periodId });
  const transactions = useAccountingTransactions(periodId);

  const txs = (transactions.data ?? []).slice(0, 5); // Take 5 recent transactions

  const isSummaryReady = Boolean(summary.data);

  return (
    <section className="space-y-6 animate-fade-in-up">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
              <WalletCards className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold tracking-wider text-primary uppercase">
              ACCOUNTING CONTROL CENTER
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-navy">
            Dashboard Accounting
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ringkasan posisi kas aktual, tagihan berjalan, dan kesiapan jurnal buku besar.
          </p>
        </div>
      </header>

      <AccountingQueryState
        loading={periods.isLoading}
        error={periods.error}
        empty={!active}
        retry={() => void periods.refetch()}
      >
        {active && (
          <div className="grid gap-6">
            {/* Period Status Card */}
            <div className="rounded-card-lg bg-gradient-to-r from-navy via-slate-800 to-slate-900 p-5 sm:p-6 text-white shadow-card relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 blur-xl">
                <WalletCards className="h-64 w-64 -translate-y-16 translate-x-16" />
              </div>
              <div className="relative z-10 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-300">Periode Akuntansi Aktif</p>
                  <h2 className="mt-1 text-3xl font-bold">{active.periodMonth}</h2>
                </div>
                <div className="mt-4 sm:mt-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {active.status.replaceAll("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <AccountingQueryState
              loading={summary.isLoading || outstandings.isLoading}
              error={summary.error || outstandings.error}
              empty={!summary.data}
              retry={() => {
                void summary.refetch();
                void outstandings.refetch();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Saldo Berjalan */}
                <article className="group relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Saldo Tersedia</p>
                      <p className="mt-0.5 text-xl font-bold text-navy font-mono">
                        {isSummaryReady ? rupiah(summary.data!.runningBalance) : "Rp 0"}
                      </p>
                    </div>
                  </div>
                </article>

                {/* Total Debit */}
                <article className="group relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <ArrowDownLeft className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Penerimaan (Debit)</p>
                      <p className="mt-0.5 text-xl font-bold text-navy font-mono">
                        {isSummaryReady ? rupiah(summary.data!.totalDebit) : "Rp 0"}
                      </p>
                    </div>
                  </div>
                </article>

                {/* Total Kredit */}
                <article className="group relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pengeluaran (Kredit)</p>
                      <p className="mt-0.5 text-xl font-bold text-navy font-mono">
                        {isSummaryReady ? rupiah(summary.data!.totalCredit) : "Rp 0"}
                      </p>
                    </div>
                  </div>
                </article>

                {/* Tagihan Belum Dibayar (Outstanding) */}
                <article className="group relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning-light text-warning">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unpaid Outstanding</p>
                      <p className="mt-0.5 text-xl font-bold text-warning font-mono">
                        {outstandings.data ? rupiah(outstandings.data.kpis.total_active_outstanding) : "Rp 0"}
                      </p>
                    </div>
                  </div>
                  {outstandings.data && outstandings.data.kpis.active_items_count > 0 && (
                    <div className="absolute right-3 top-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning-light text-xs font-bold text-warning">
                        {outstandings.data.kpis.active_items_count}
                      </span>
                    </div>
                  )}
                </article>
              </div>

              {/* Main Split Content */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left side: Recent Transactions */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-navy text-lg">Jurnal Terakhir</h3>
                    <Link
                      to="/accounting/jurnal"
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <AccountingQueryState
                    loading={transactions.isLoading}
                    error={transactions.error}
                    empty={txs.length === 0}
                    retry={() => void transactions.refetch()}
                  >
                    <div className="rounded-card border border-line bg-white shadow-sm overflow-hidden divide-y divide-line">
                      {txs.map((tx) => (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tx.creditAmount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {tx.creditAmount > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="font-semibold text-navy text-sm line-clamp-1">{tx.description}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-500 font-mono">{tx.transactionDate.slice(0, 10)}</span>
                                {tx.isCancelled && <span className="rounded bg-danger-light px-1.5 py-0.5 text-[10px] font-semibold text-danger">BATAL</span>}
                                {(!tx.attachments || tx.attachments.length === 0) && !tx.isCancelled && <span className="rounded bg-warning-light px-1.5 py-0.5 text-[10px] font-semibold text-warning flex items-center gap-0.5"><ShieldAlert className="h-2.5 w-2.5" /> NO FILE</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-mono font-bold ${tx.creditAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {tx.creditAmount > 0 ? '-' : '+'}{rupiah(tx.creditAmount > 0 ? tx.creditAmount : tx.debitAmount)}
                            </p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              Bal: {rupiah(tx.runningBalance ?? 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccountingQueryState>
                </div>

                {/* Right side: Actions & Status */}
                <div className="space-y-4">
                  <h3 className="font-bold text-navy text-lg">Menu Akses Cepat</h3>
                  
                  {isSummaryReady && (
                    <div
                      className={`flex gap-3 rounded-card p-4 shadow-sm border ${
                        summary.data!.isReadyForSubmission 
                          ? "bg-success-light/50 border-success-light text-success" 
                          : "bg-warning-light/50 border-warning-light text-warning"
                      }`}
                    >
                      {summary.data!.isReadyForSubmission ? (
                        <CheckCircle2 className="shrink-0 h-5 w-5 mt-0.5" />
                      ) : (
                        <FileWarning className="shrink-0 h-5 w-5 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold text-sm">
                          {summary.data!.isReadyForSubmission
                            ? "Data Siap Diajukan"
                            : "Peringatan Dokumen"}
                        </p>
                        <p className="text-xs mt-1 opacity-90 leading-relaxed">
                          {summary.data!.isReadyForSubmission
                            ? "Seluruh jurnal telah memiliki dokumen bukti. Anda dapat mengajukan periode ke manajer."
                            : `Terdapat ${summary.data!.missingAttachmentCount} jurnal yang belum memiliki lampiran bukti.`}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2.5">
                    <Link
                      to="/accounting/jurnal"
                      className="group flex items-center justify-between rounded-card border border-line bg-white p-3.5 shadow-sm transition-all hover:border-primary hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary-50 p-2 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <BookOpenText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-navy">Jurnal Buku Besar</p>
                          <p className="text-xs text-slate-500">Pencatatan aktual & bukti</p>
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
                          <p className="text-sm font-semibold text-navy">Outstanding Payable</p>
                          <p className="text-xs text-slate-500">Kelola kewajiban & bayar</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-warning transition-colors" />
                    </Link>

                    <Link
                      to="/accounting/periode"
                      className="group flex items-center justify-between rounded-card border border-line bg-white p-3.5 shadow-sm transition-all hover:border-emerald-500 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-navy">Kontrol Periode</p>
                          <p className="text-xs text-slate-500">Pengajuan & tutup buku</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
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
                          <p className="text-xs text-slate-500">COA & konfigurasi akun</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </Link>
                  </div>
                </div>
              </div>
            </AccountingQueryState>
          </div>
        )}
      </AccountingQueryState>
    </section>
  );
}
