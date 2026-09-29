import { CheckCircle2, WalletCards } from "lucide-react";
import { AccountingQueryState } from "../../components/accounting/AccountingStates";
import {
  useAccountingPeriods,
  useAccountingSummary,
  useAccountingOutstandings,
  useAccountingTransactions,
} from "../../hooks/useAccounting";
import { useAuth } from "../../session/AuthContext";

import { DashboardKpisManager } from "../../components/accounting/dashboard/DashboardKpisManager";
import { DashboardKpisAdmin } from "../../components/accounting/dashboard/DashboardKpisAdmin";
import { DashboardRecentTransactions } from "../../components/accounting/dashboard/DashboardRecentTransactions";
import { DashboardQuickActions } from "../../components/accounting/dashboard/DashboardQuickActions";

export default function AccountingDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const periods = useAccountingPeriods();
  const active =
    periods.data?.find((p) =>
      ["draft", "pending_approval", "reopened"].includes(p.status),
    ) ?? periods.data?.[0];

  const periodId = active?.id ?? "";

  const summary = useAccountingSummary(periodId);
  const outstandings = useAccountingOutstandings({ period_id: periodId });
  const transactions = useAccountingTransactions(periodId);

  const txs = (transactions.data?.data ?? []).slice(0, 5); // Take 5 recent transactions

  return (
    <section className="space-y-6 animate-fade-in-up">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
              <WalletCards className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold tracking-wider text-primary uppercase">
              ACCOUNTING CONTROL CENTER {user?.role ? `- ${user.role}` : ""}
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-navy">
            Dashboard Accounting
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {!isAdmin
              ? "Ringkasan posisi kas aktual, tagihan berjalan, dan kesiapan laporan keuangan."
              : "Ringkasan operasional harian, kelengkapan bukti jurnal, dan antrean data."}
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
            {/* Period Status Card - Shared */}
            <div className="rounded-card-lg bg-gradient-to-r from-navy via-slate-800 to-slate-900 p-5 sm:p-6 text-white shadow-card relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 blur-xl">
                <WalletCards className="h-64 w-64 -translate-y-16 translate-x-16" />
              </div>
              <div className="relative z-10 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Periode Akuntansi Aktif
                  </p>
                  <h2 className="mt-1 text-3xl font-bold">
                    {active.periodMonth}
                  </h2>
                </div>
                <div className="mt-4 sm:mt-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {active.status.replaceAll("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <AccountingQueryState
              loading={summary.isLoading || outstandings.isLoading}
              error={summary.error || outstandings.error}
              empty={!summary.data}
              retry={() => {
                void summary.refetch();
                void outstandings.refetch();
              }}
            >
              {!isAdmin ? (
                <DashboardKpisManager
                  summary={summary.data}
                  activeOutstanding={
                    outstandings.data?.kpis?.total_active_outstanding ?? 0
                  }
                />
              ) : (
                <DashboardKpisAdmin
                  summary={summary.data}
                  activeOutstandingCount={
                    outstandings.data?.kpis?.active_items_count ?? 0
                  }
                  totalTransactions={transactions.data?.meta?.total ?? 0}
                />
              )}

              {/* Main Split Content - Shared layout, different content */}
              <div className="grid gap-6 lg:grid-cols-3">
                <DashboardRecentTransactions
                  transactions={txs}
                  isAdmin={isAdmin}
                />
                
                <DashboardQuickActions
                  isAdmin={isAdmin}
                  summary={summary.data}
                />
              </div>
            </AccountingQueryState>
          </div>
        )}
      </AccountingQueryState>
    </section>
  );
}
