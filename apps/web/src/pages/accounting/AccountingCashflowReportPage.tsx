import { useState } from "react";
import { Download, TrendingUp, FileText, Loader2 } from "lucide-react";
import { ACCOUNTING_EXCEL_DATA } from "../../data/accountingExcelData";
import {
  useAccountingPeriods,
  useAccountingCashflowReport,
} from "../../hooks/useAccounting";
import { useToast } from "../../components/ui/Toast";
import { WaterfallChart } from "../../components/accounting/WaterfallChart";
import type { WaterfallItem } from "../../components/accounting/WaterfallChart";
import { exportToExcel, exportToPDF } from "../../utils/exportTools";
import type { ColumnDef } from "../../utils/exportTools";

import { CashflowStatCards } from "../../components/accounting/cashflow/CashflowStatCards";
import { CashflowStatementTable } from "../../components/accounting/cashflow/CashflowStatementTable";
import {
  CashflowExplanationTab,
  type ExpenseCategory,
} from "../../components/accounting/cashflow/CashflowExplanationTab";

export default function AccountingCashflowReportPage() {
  const { toast } = useToast();
  const periods = useAccountingPeriods();
  const { data: reportData, isLoading } = useAccountingCashflowReport();
  const [activeTab, setActiveTab] = useState<"statement" | "explanation">(
    "statement"
  );
  const [selectedGroup, setSelectedGroup] = useState<"ALL" | "B" | "C" | "D">(
    "ALL"
  );
  const [searchCategory, setSearchCategory] = useState("");

  const activePeriod =
    periods.data?.find((p) =>
      ["draft", "pending_approval", "reopened"].includes(p.status)
    ) ?? periods.data?.[0];

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
    : ACCOUNTING_EXCEL_DATA.cashflow;

  // Gabungkan semua item untuk penjelasan cashflow
  const allExpenseCategories: ExpenseCategory[] = [
    {
      group: "B",
      groupLabel: "Pendapatan",
      code: "B1",
      name: "Sales Store Harian",
      amount: 4760786093,
    },
    {
      group: "B",
      groupLabel: "Pendapatan",
      code: "B2",
      name: "Pendapatan Jasa Manajemen",
      amount: 0,
    },
    {
      group: "B",
      groupLabel: "Pendapatan",
      code: "B3",
      name: "Pendapatan Lain-lain (Bunga/Koreksi)",
      amount: 290105479.12,
    },
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
      title: "Laporan Penjelasan Arus Kas",
      filename: "Cashflow_Report",
      columns: exportColumns,
      data: allExpenseCategories,
    });
    toast("Laporan Cashflow berhasil diekspor dalam format PDF", "success");
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: "Laporan Penjelasan Arus Kas",
      filename: "Cashflow_Report",
      columns: exportColumns,
      data: allExpenseCategories,
    });
    toast("Laporan Cashflow berhasil diekspor dalam format Excel", "success");
  };

  return (
    <section className="space-y-6 animate-fade-in-up">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            ACCOUNTING CONTROL CENTER
          </p>
          <h1 className="mt-1 text-2xl font-bold text-navy">
            Laporan Cashflow & Penjelasan Arus Kas
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Laporan Arus Kas resmi periode{" "}
            <span className="font-semibold text-navy">
              {activePeriod?.periodMonth ?? "Agustus 2026"}
            </span>{" "}
            dari rekonsiliasi jurnal buku besar.
            {isLoading && (
              <span className="inline-flex items-center gap-1 ml-2 text-xs text-primary font-medium">
                <Loader2 className="h-3 w-3 animate-spin" /> Memuat data live...
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-input border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <FileText className="h-4 w-4 text-slate-500" />
            PDF
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-input border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Ekspor Excel
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-line">
        <button
          type="button"
          onClick={() => setActiveTab("statement")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "statement"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-navy"
          }`}
        >
          <FileText className="h-4 w-4" />
          Laporan Arus Kas (CASH FLOW)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("explanation")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "explanation"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-navy"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Penjelasan Arus Kas (Detail 97 Kategori)
        </button>
      </div>

      {activeTab === "statement" ? (
        <div className="space-y-6">
          <CashflowStatCards
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
    </section>
  );
}
