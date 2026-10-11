import { AccountingQueryState } from "../../../components/accounting/AccountingStates";
import { AccountingPageHeader } from "../../../components/accounting/AccountingPageHeader";
import { useState } from "react";
import { Download, TrendingUp, FileText } from "lucide-react";
import {
  useAccountingPeriods,
  useAccountingCashflowReport,
} from "../../../hooks/useAccounting";
import { useToast } from "../../../components/ui/Toast";
import { WaterfallChart } from "../../../components/accounting/WaterfallChart";
import type { WaterfallItem } from "../../../components/accounting/WaterfallChart";
import { exportToExcel, exportToPDF } from "../../../utils/exportTools";
import type { ColumnDef } from "../../../utils/exportTools";

import { CashflowStatCards } from "../../../components/accounting/cashflow/CashflowStatCards";
import { CashflowStatementTable } from "../../../components/accounting/cashflow/CashflowStatementTable";
import {
  CashflowExplanationTab,
  type ExpenseCategory,
} from "../../../components/accounting/cashflow/CashflowExplanationTab";

export default function AccountingCashflowReportPage() {
  const { toast } = useToast();
  const periods = useAccountingPeriods();
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [activeTab, setActiveTab] = useState<"statement" | "explanation">(
    "statement"
  );
  const [selectedGroup, setSelectedGroup] = useState<"ALL" | "B" | "C" | "D">(
    "ALL"
  );
  const [searchCategory, setSearchCategory] = useState("");

  const activePeriod = periods.data?.find(p => p.id === selectedPeriod) ??
    periods.data?.find((p) =>
      ["draft", "pending_approval", "reopened"].includes(p.status)
    ) ?? periods.data?.[0];

  const isSimulation = activePeriod?.notes?.includes('UAT / SIMULASI') ?? false;
  const exportTitle = `Laporan Arus Kas ${activePeriod?.periodMonth.slice(0, 7) ?? ''}${isSimulation ? ' — UAT / SIMULASI' : ''}`;
  const exportFilename = `Cashflow_${isSimulation ? 'UAT_' : ''}${activePeriod?.periodMonth.slice(0, 7) ?? 'Report'}`;

  const report = useAccountingCashflowReport({ period_month: activePeriod?.periodMonth.slice(0, 10) });
  const { data: reportData, isLoading } = report;
  const cf = reportData?.kpis
    ? {
        initialBalance: reportData.kpis.initial_cash_balance,
        totalRevenue: reportData.kpis.total_revenue,
        totalOperational: reportData.kpis.total_operational_expenses,
        totalBackoffice: reportData.kpis.total_backoffice_expenses,
        totalEndingBalance: reportData.kpis.ending_cash_balance,
        totalAvailable: reportData.kpis.total_available,
        totalOutstanding: reportData.kpis.total_active_outstanding,
        projectedEndingBalance: reportData.kpis.projected_ending_balance,
        operationalExpenses: reportData.breakdown.operational,
        backofficeExpenses: reportData.breakdown.backoffice,
      }
    : {
        initialBalance: 0,
        totalRevenue: 0,
        totalOperational: 0,
        totalBackoffice: 0,
        totalEndingBalance: 0,
        totalAvailable: 0,
        totalOutstanding: 0,
        projectedEndingBalance: 0,
        operationalExpenses: [],
        backofficeExpenses: [],
      };

  const allExpenseCategories: ExpenseCategory[] = [
    ...(reportData?.breakdown.revenue ?? []).map(item => ({ ...item, group: "B", groupLabel: "Pendapatan" })),
    ...cf.operationalExpenses.map((x) => ({
      group: "C",
      groupLabel: "Biaya Operasional",
      ...x,
    })),
    ...cf.backofficeExpenses.map((x) => ({
      group: "D",
      groupLabel: "Biaya Back Office",
      ...x,
    })),
  ];

  const cashflowWaterfallItems: WaterfallItem[] = [
    {
      id: "initial",
      label: "Saldo Awal",
      amount: cf.initialBalance,
      isTotal: true,
    },
    { id: "rev", label: "Penerimaan/Sales", amount: cf.totalRevenue },
    { id: "ops", label: "Beban Operasional", amount: -cf.totalOperational },
    {
      id: "backoffice",
      label: "Beban Backoffice",
      amount: -cf.totalBackoffice,
    },
    {
      id: "ending",
      label: "Saldo Kas Akhir",
      amount: cf.totalEndingBalance,
      isTotal: true,
    },
  ];

  const exportColumns: ColumnDef[] = [
    { header: "Kode", key: "code" },
    { header: "Keterangan", key: "name" },
    { header: "Nominal", key: "amount" },
  ];

  const handleExportPDF = () => {
    exportToPDF({
      title: exportTitle,
      filename: exportFilename,
      columns: exportColumns,
      data: allExpenseCategories,
    });
    toast("Laporan Cashflow berhasil diekspor dalam format PDF", "success");
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: exportTitle,
      filename: exportFilename,
      columns: exportColumns,
      data: allExpenseCategories,
    });
    toast("Laporan Cashflow berhasil diekspor dalam format Excel", "success");
  };

  return (
    <section className="space-y-6 animate-fade-in-up">
      <AccountingPageHeader area="Laporan & Analisis · Arus Kas" title="Laporan cashflow" description={`Arus kas ${reportData?.period.period_month ? new Date(reportData.period.period_month.slice(0, 10) + 'T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'periode aktif'} dari jurnal kas yang tercatat.${isLoading ? ' Memuat data terbaru…' : ''}`} actions={<div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!reportData || isLoading || Boolean(report.error)}
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-input border border-line bg-panel px-3 py-2 text-xs font-semibold text-muted hover:bg-surface shadow-sm transition-colors"
          >
            <FileText className="h-4 w-4 text-subtle" />
            PDF
          </button>
          <button
            type="button"
            disabled={!reportData || isLoading || Boolean(report.error)}
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-input border border-line bg-panel px-3 py-2 text-xs font-semibold text-muted hover:bg-surface shadow-sm transition-colors"
          >
            <Download className="h-4 w-4 text-subtle" />
            Ekspor Excel
          </button>
        </div>} />

      <label className="flex flex-wrap items-center gap-3 text-sm font-medium">Periode laporan
        <select aria-label="Periode laporan" value={activePeriod?.id ?? ''} onChange={event => setSelectedPeriod(event.target.value)} className="rounded-lg border border-line bg-panel px-3 py-2">
          {(periods.data ?? []).map(period => <option key={period.id} value={period.id}>{new Date(period.periodMonth.slice(0, 10) + 'T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</option>)}
        </select>
      </label>
      <AccountingQueryState loading={isLoading || periods.isLoading} error={report.error || periods.error} empty={!reportData} retry={() => { void report.refetch(); void periods.refetch(); }}>
      {isSimulation && <p role="note" className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">Data UAT / SIMULASI untuk pengujian. Periode masih draf dan saldo bank belum diverifikasi; angka ini bukan laporan keuangan perusahaan.</p>}
      {/* Tabs */}
      <div className="flex border-b border-line">
        <button
          type="button"
          onClick={() => setActiveTab("statement")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "statement"
              ? "border-primary text-primary dark:text-primary-300"
              : "border-transparent text-subtle hover:text-navy"
          }`}
        >
          <FileText className="h-4 w-4" />
          Ringkasan arus kas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("explanation")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "explanation"
              ? "border-primary text-primary dark:text-primary-300"
              : "border-transparent text-subtle hover:text-navy"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Rincian kategori
        </button>
      </div>

      {activeTab === "statement" ? (
        <div className="space-y-6">
          <CashflowStatCards
            isReconciled={reportData?.kpis.is_reconciled}
            initialBalance={cf.initialBalance}
            totalRevenue={cf.totalRevenue}
            totalOperational={cf.totalOperational}
            totalBackoffice={cf.totalBackoffice}
            totalEndingBalance={cf.totalEndingBalance}
          />

          <WaterfallChart
            title="Waterfall Chart: Jembatan Aliran Arus Kas"
            subtitle="Pemetaan pembentukan saldo kas dari saldo awal, penerimaan penjualan, beban toko, hingga saldo akhir"
            items={cashflowWaterfallItems}
          />

          <CashflowStatementTable
            initialBalance={cf.initialBalance}
            totalRevenue={cf.totalRevenue}
            totalAvailable={cf.totalAvailable}
            totalOperational={cf.totalOperational}
            totalBackoffice={cf.totalBackoffice}
            totalEndingBalance={cf.totalEndingBalance}
            totalOutstanding={cf.totalOutstanding}
            projectedEndingBalance={cf.projectedEndingBalance}
            revenueItems={reportData?.breakdown.revenue ?? []}
            operationalExpenses={cf.operationalExpenses}
            backofficeExpenses={cf.backofficeExpenses}
          />
        </div>
      ) : (
        <CashflowExplanationTab
          categories={allExpenseCategories}
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          searchCategory={searchCategory}
          setSearchCategory={setSearchCategory}
        />
      )}
      </AccountingQueryState>
    </section>
  );
}
