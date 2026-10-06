import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Receipt,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  Calendar,
  AlertCircle,
  Building2,
  PieChart
} from 'lucide-react';
import { Project, ProjectRab, ProjectExpense, ProjectInvoice, FinancialSummary, ProjectVendor } from '../../types/project';
import { projectApi, vendorApi } from '../../api/projects';
import { LoadingState, EmptyState } from '../states';
import { Button } from '../ui/Button';

interface ProjectCostControlProps {
  project: Project;
  onRefresh: () => void;
}

export function ProjectCostControl({ project, onRefresh }: ProjectCostControlProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'rab' | 'expenses' | 'invoices'>('overview');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [rabs, setRabs] = useState<ProjectRab[]>([]);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [invoices, setInvoices] = useState<ProjectInvoice[]>([]);
  const [vendors, setVendors] = useState<ProjectVendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddRabModal, setShowAddRabModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<ProjectInvoice | null>(null);

  // Form States
  const [rabForm, setRabForm] = useState({
    item_name: '',
    category: 'material',
    volume: 1,
    unit: 'ls',
    unit_price: 0,
  });

  const [expenseForm, setExpenseForm] = useState({
    item_name: '',
    category: 'material',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    project_rab_id: '',
    project_vendor_id: '',
    notes: '',
  });
  const [expenseReceiptFile, setExpenseReceiptFile] = useState<File | null>(null);

  const [invoiceForm, setInvoiceForm] = useState({
    term_name: '',
    amount: '',
    due_date: '',
    project_milestone_id: '',
    notes: '',
  });

  const [payForm, setPayForm] = useState({
    paid_date: new Date().toISOString().split('T')[0],
    payment_reference: '',
    notes: '',
  });

  const [actionLoading, setActionLoading] = useState(false);

  const loadAllFinancialData = async () => {
    try {
      setLoading(true);
      const [sumData, rabData, expData, invData] = await Promise.all([
        projectApi.getFinancialSummary(project.id).catch(() => null),
        projectApi.getRab(project.id).catch(() => []),
        projectApi.getExpenses(project.id).catch(() => []),
        projectApi.getInvoices(project.id).catch(() => []),
      ]);

      setSummary(sumData);
      setRabs(rabData);
      setExpenses(expData);
      setInvoices(invData);
    } catch (err) {
      console.error('Failed to load financial data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllFinancialData();
    // Load vendors for dropdown
    vendorApi.getVendors({ per_page: 100 })
      .then(res => setVendors(res.data))
      .catch(() => {});
  }, [project.id]);

  const formatCurrency = (val: number | undefined | null) => {
    if (val === undefined || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Submit RAB
  const handleCreateRab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await projectApi.addRab(project.id, {
        item_name: rabForm.item_name,
        category: rabForm.category,
        volume: Number(rabForm.volume),
        unit: rabForm.unit,
        unit_price: Number(rabForm.unit_price),
      });
      setShowAddRabModal(false);
      setRabForm({ item_name: '', category: 'material', volume: 1, unit: 'ls', unit_price: 0 });
      await loadAllFinancialData();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan item RAB');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRab = async (rabId: number) => {
    if (!confirm('Yakin ingin menghapus item RAB ini?')) return;
    try {
      await projectApi.deleteRab(project.id, rabId);
      await loadAllFinancialData();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus RAB');
    }
  };

  // Submit Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const fd = new FormData();
      fd.append('item_name', expenseForm.item_name);
      fd.append('category', expenseForm.category);
      fd.append('amount', expenseForm.amount);
      fd.append('expense_date', expenseForm.expense_date || '');
      if (expenseForm.project_rab_id) fd.append('project_rab_id', expenseForm.project_rab_id);
      if (expenseForm.project_vendor_id) fd.append('project_vendor_id', expenseForm.project_vendor_id);
      if (expenseForm.notes) fd.append('notes', expenseForm.notes);
      if (expenseReceiptFile) fd.append('receipt', expenseReceiptFile);

      await projectApi.addExpense(project.id, fd);
      setShowAddExpenseModal(false);
      setExpenseForm({
        item_name: '',
        category: 'material',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        project_rab_id: '',
        project_vendor_id: '',
        notes: '',
      });
      setExpenseReceiptFile(null);
      await loadAllFinancialData();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal mencatat pengeluaran');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Hapus pencatatan pengeluaran ini?')) return;
    try {
      await projectApi.deleteExpense(project.id, expenseId);
      await loadAllFinancialData();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pengeluaran');
    }
  };

  // Submit Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await projectApi.addInvoice(project.id, {
        term_name: invoiceForm.term_name,
        amount: Number(invoiceForm.amount),
        due_date: invoiceForm.due_date || null,
        project_milestone_id: invoiceForm.project_milestone_id ? Number(invoiceForm.project_milestone_id) : null,
        notes: invoiceForm.notes,
        status: 'invoiced',
      });
      setShowAddInvoiceModal(false);
      setInvoiceForm({
        term_name: '',
        amount: '',
        due_date: '',
        project_milestone_id: '',
        notes: '',
      });
      await loadAllFinancialData();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat tagihan termin');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Payment Settlement
  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    try {
      setActionLoading(true);
      await projectApi.markInvoicePaid(project.id, payingInvoice.id, {
        paid_date: payForm.paid_date,
        payment_reference: payForm.payment_reference,
        notes: payForm.notes,
      });
      setPayingInvoice(null);
      await loadAllFinancialData();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal mencatat pelunasan termin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!confirm('Hapus faktur termin ini?')) return;
    try {
      await projectApi.deleteInvoice(project.id, invoiceId);
      await loadAllFinancialData();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus termin');
    }
  };

  if (loading) {
    return <LoadingState label="Memuat modul kontrol biaya dan RAB..." />;
  }

  const contractVal = summary?.contract_value || project.contract_value || 0;
  const rabBudget = summary?.total_rab_budget || 0;
  const actualExpense = summary?.total_actual_expense || 0;
  const variance = summary?.budget_variance || (rabBudget - actualExpense);
  const absorption = summary?.budget_absorption_percentage || (rabBudget > 0 ? (actualExpense / rabBudget) * 100 : 0);
  const grossProfit = summary?.realized_gross_profit || (contractVal - actualExpense);
  const marginPct = summary?.realized_margin_percentage || (contractVal > 0 ? (grossProfit / contractVal) * 100 : 0);
  const invoicedVal = summary?.invoiced_amount || 0;
  const paidVal = summary?.paid_amount || 0;
  const outstandingVal = summary?.outstanding_receivable || 0;
  const overBudgetItems = summary?.over_budget_items || [];

  return (
    <div className="space-y-6">
      {/* SUB TABS NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line dark:border-line/20 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-input text-xs font-semibold transition-all ${
              activeSubTab === 'overview'
                ? 'bg-primary text-white shadow-card'
                : 'text-slate-600 dark:text-slate-400 hover:bg-surface dark:hover:bg-navy/40'
            }`}
          >
            <PieChart className="h-4 w-4" />
            Ikhtisar & Deviasi
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('rab')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-input text-xs font-semibold transition-all ${
              activeSubTab === 'rab'
                ? 'bg-primary text-white shadow-card'
                : 'text-slate-600 dark:text-slate-400 hover:bg-surface dark:hover:bg-navy/40'
            }`}
          >
            <FileText className="h-4 w-4" />
            RAB Proyek ({rabs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('expenses')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-input text-xs font-semibold transition-all ${
              activeSubTab === 'expenses'
                ? 'bg-primary text-white shadow-card'
                : 'text-slate-600 dark:text-slate-400 hover:bg-surface dark:hover:bg-navy/40'
            }`}
          >
            <Receipt className="h-4 w-4" />
            Realisasi Pengeluaran ({expenses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('invoices')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-input text-xs font-semibold transition-all ${
              activeSubTab === 'invoices'
                ? 'bg-primary text-white shadow-card'
                : 'text-slate-600 dark:text-slate-400 hover:bg-surface dark:hover:bg-navy/40'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Termin Invoicing ({invoices.length})
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'rab' && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowAddRabModal(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Item RAB
            </Button>
          )}
          {activeSubTab === 'expenses' && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowAddExpenseModal(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Catat Pengeluaran
            </Button>
          )}
          {activeSubTab === 'invoices' && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowAddInvoiceModal(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Terbitkan Termin
            </Button>
          )}
        </div>
      </div>

      {/* OVER BUDGET WARNING BANNER */}
      {overBudgetItems.length > 0 && (
        <div className="p-4 rounded-card-lg bg-warning-light/50 border border-warning/30 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-warning">
              Peringatan Dini: Terdapat {overBudgetItems.length} Item Melebihi Anggaran (Over-Budget)
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              Realisasi biaya lapangan telah melebihi alokasi plafon RAB yang direncanakan. Harap lakukan tinjauan efisiensi atau addendum anggaran.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {overBudgetItems.map(item => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-semibold bg-danger-light text-danger border border-danger/30"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{item.item_name}:</span>
                  <span className="font-bold text-danger">+{formatCurrency(item.overrun)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 1. OVERVIEW & DEVIASI TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nilai Kontrak */}
            <div className="p-5 rounded-card-lg border border-line dark:border-line/20 bg-white dark:bg-navy-light shadow-card flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nilai Kontrak</p>
                <h3 className="text-xl font-bold text-navy dark:text-white mt-1">
                  {formatCurrency(contractVal)}
                </h3>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Klien: {project.client_name || '-'}</span>
              </div>
            </div>

            {/* Total Anggaran RAB */}
            <div className="p-5 rounded-card-lg border border-line dark:border-line/20 bg-white dark:bg-navy-light shadow-card flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pagu Anggaran RAB</p>
                <h3 className="text-xl font-bold text-primary mt-1">
                  {formatCurrency(rabBudget)}
                </h3>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{rabs.length} item pekerjaan</span>
                <span>{contractVal > 0 ? `${((rabBudget / contractVal) * 100).toFixed(1)}% Kontrak` : ''}</span>
              </div>
            </div>

            {/* Realisasi Biaya Lapangan */}
            <div className="p-5 rounded-card-lg border border-line dark:border-line/20 bg-white dark:bg-navy-light shadow-card flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Realisasi Lapangan</p>
                <h3 className="text-xl font-bold text-success mt-1">
                  {formatCurrency(actualExpense)}
                </h3>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500">Penyerapan Anggaran</span>
                  <span className="font-semibold text-navy dark:text-slate-300">{absorption.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-2 dark:bg-navy/80 rounded-pill overflow-hidden">
                  <div
                    className={`h-full rounded-pill transition-all duration-500 ${
                      absorption > 100 ? 'bg-danger' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(absorption, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Laba Kotor & Margin */}
            <div className="p-5 rounded-card-lg border border-line dark:border-line/20 bg-white dark:bg-navy-light shadow-card flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Proyeksi Laba Riil</p>
                <h3 className={`text-xl font-bold mt-1 ${grossProfit >= 0 ? 'text-navy dark:text-white' : 'text-danger'}`}>
                  {formatCurrency(grossProfit)}
                </h3>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-500">Margin Keuntungan:</span>
                <span className={`font-semibold ${marginPct >= 15 ? 'text-success' : 'text-warning'}`}>
                  {marginPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* CASHFLOW & TERMIN SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-card border border-line dark:border-line/20 bg-surface dark:bg-navy/40">
              <p className="text-xs text-slate-500 font-medium">Total Termin Difakturkan</p>
              <p className="text-lg font-bold text-navy dark:text-white mt-1">{formatCurrency(invoicedVal)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {contractVal > 0 ? `${((invoicedVal / contractVal) * 100).toFixed(1)}% dari nilai kontrak` : '-'}
              </p>
            </div>
            <div className="p-4 rounded-card border border-success/30 bg-success-light/40">
              <p className="text-xs text-success font-medium">Pembayaran Diterima (Lunas)</p>
              <p className="text-lg font-bold text-success mt-1">{formatCurrency(paidVal)}</p>
              <p className="text-[11px] text-success/80 mt-0.5">
                {invoicedVal > 0 ? `${((paidVal / invoicedVal) * 100).toFixed(1)}% tertagih` : '-'}
              </p>
            </div>
            <div className="p-4 rounded-card border border-warning/30 bg-warning-light/40">
              <p className="text-xs text-warning font-medium">Piutang Berjalan (Outstanding)</p>
              <p className="text-lg font-bold text-warning mt-1">{formatCurrency(outstandingVal)}</p>
              <p className="text-[11px] text-warning/80 mt-0.5">Sisa tagihan menunggu pelunasan klien</p>
            </div>
          </div>

          {/* CATEGORY BREAKDOWN TABLE */}
          <div className="border border-line dark:border-line/20 rounded-card-lg overflow-hidden bg-white dark:bg-navy-light shadow-card">
            <div className="px-5 py-4 border-b border-line dark:border-line/20 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-navy dark:text-white">
                  Analisis Penyerapan Anggaran per Kategori Biaya
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Komparasi alokasi RAB terhadap pengeluaran aktual di lapangan
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface dark:bg-navy/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-line dark:border-line/20">
                  <tr>
                    <th className="px-5 py-3.5">Kategori Pekerjaan</th>
                    <th className="px-5 py-3.5 text-right">Alokasi RAB</th>
                    <th className="px-5 py-3.5 text-right">Realisasi Aktual</th>
                    <th className="px-5 py-3.5 text-right">Deviasi (Sisa)</th>
                    <th className="px-5 py-3.5 text-center">Penyerapan (%)</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line dark:divide-line/20">
                  {(!summary?.category_breakdown || summary.category_breakdown.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        Belum ada data alokasi RAB atau pengeluaran untuk dianalisis.
                      </td>
                    </tr>
                  ) : (
                    summary.category_breakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface/50 dark:hover:bg-navy/30 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-navy dark:text-white capitalize">
                          {row.category}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(row.budget)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-navy dark:text-white">
                          {formatCurrency(row.actual)}
                        </td>
                        <td className={`px-5 py-3.5 text-right font-semibold ${row.variance < 0 ? 'text-danger' : 'text-success'}`}>
                          {formatCurrency(row.variance)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="font-semibold text-navy dark:text-slate-300">
                            {row.absorption_percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {row.is_over_budget ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-danger-light text-danger border border-danger/30">
                              Over Budget
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-success-light text-success border border-success/30">
                              Sesuai Anggaran
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB RAB (RENCANA ANGGARAN BIAYA) */}
      {activeSubTab === 'rab' && (
        <div className="space-y-4">
          <div className="border border-line dark:border-line/20 rounded-card-lg overflow-hidden bg-white dark:bg-navy-light shadow-card">
            <div className="px-5 py-4 border-b border-line dark:border-line/20 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-navy dark:text-white">
                  Rencana Anggaran Biaya (RAB) Proyek
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar pos anggaran acuan biaya operasional & material proyek
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowAddRabModal(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Pos RAB
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface dark:bg-navy/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-line dark:border-line/20">
                  <tr>
                    <th className="px-5 py-3.5">Item Pekerjaan</th>
                    <th className="px-5 py-3.5">Kategori</th>
                    <th className="px-5 py-3.5 text-center">Volume</th>
                    <th className="px-5 py-3.5 text-right">Harga Satuan</th>
                    <th className="px-5 py-3.5 text-right">Total RAB</th>
                    <th className="px-5 py-3.5 text-right">Realisasi Lapangan</th>
                    <th className="px-5 py-3.5 text-right">Sisa Saldo</th>
                    <th className="px-5 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line dark:divide-line/20">
                  {rabs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                        Belum ada item RAB. Silakan tambahkan item anggaran proyek pertama Anda.
                      </td>
                    </tr>
                  ) : (
                    rabs.map((item) => {
                      const actual = Number(item.expenses_sum_amount || 0);
                      const budget = Number(item.total_price);
                      const rem = budget - actual;
                      const isOver = actual > budget;

                      return (
                        <tr key={item.id} className="hover:bg-surface/50 dark:hover:bg-navy/30 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-navy dark:text-white">
                            {item.item_name}
                          </td>
                          <td className="px-5 py-3.5 capitalize text-slate-600 dark:text-slate-400">
                            <span className="inline-block px-2 py-0.5 rounded-input text-[10px] bg-surface dark:bg-navy/40 border border-line dark:border-line/20">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-400">
                            {item.volume} {item.unit || ''}
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-600 dark:text-slate-400">
                            {formatCurrency(Number(item.unit_price))}
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-navy dark:text-white">
                            {formatCurrency(budget)}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-slate-800 dark:text-slate-300">
                            {formatCurrency(actual)}
                          </td>
                          <td className={`px-5 py-3.5 text-right font-bold ${isOver ? 'text-danger' : 'text-success'}`}>
                            {formatCurrency(rem)}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRab(item.id)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1"
                              title="Hapus Pos RAB"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB REALISASI PENGELUARAN (ACTUAL EXPENSES) */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-4">
          <div className="border border-line dark:border-line/20 rounded-card-lg overflow-hidden bg-white dark:bg-navy-light shadow-card">
            <div className="px-5 py-4 border-b border-line dark:border-line/20 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-navy dark:text-white">
                  Buku Pengeluaran Riil Lapangan
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catatan pembelanjaan material, upah tukang, dan operasional dengan bukti struk/kuitansi
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowAddExpenseModal(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Catat Pengeluaran
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface dark:bg-navy/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-line dark:border-line/20">
                  <tr>
                    <th className="px-5 py-3.5">Tanggal</th>
                    <th className="px-5 py-3.5">Deskripsi Biaya</th>
                    <th className="px-5 py-3.5">Kategori</th>
                    <th className="px-5 py-3.5">Pos RAB Terkait</th>
                    <th className="px-5 py-3.5">Vendor / Suplier</th>
                    <th className="px-5 py-3.5 text-right">Nominal</th>
                    <th className="px-5 py-3.5 text-center">Bukti Nota</th>
                    <th className="px-5 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line dark:divide-line/20">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                        Belum ada catatan pengeluaran lapangan.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-surface/50 dark:hover:bg-navy/30 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                          {exp.expense_date}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-navy dark:text-white">{exp.item_name}</p>
                          {exp.notes && <p className="text-[11px] text-slate-400 mt-0.5">{exp.notes}</p>}
                        </td>
                        <td className="px-5 py-3.5 capitalize text-slate-600 dark:text-slate-400">
                          <span className="inline-block px-2 py-0.5 rounded-input text-[10px] bg-surface dark:bg-navy/40 border border-line dark:border-line/20">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                          {exp.rab ? exp.rab.item_name : <span className="text-slate-400 italic">Non-RAB</span>}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                          {exp.vendor ? exp.vendor.name : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-navy dark:text-white">
                          {formatCurrency(Number(exp.amount))}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {exp.receipt_path ? (
                            <a
                              href={`/storage/${exp.receipt_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                            >
                              <Receipt className="h-3.5 w-3.5" />
                              Lihat
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                            title="Hapus Biaya"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB TERMIN INVOICING */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          <div className="border border-line dark:border-line/20 rounded-card-lg overflow-hidden bg-white dark:bg-navy-light shadow-card">
            <div className="px-5 py-4 border-b border-line dark:border-line/20 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-navy dark:text-white">
                  Jadwal & Penagihan Termin Proyek (Invoicing)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pelacakan tagihan termin kepada klien beserta status settlement pembayaran
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowAddInvoiceModal(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Terbitkan Termin
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface dark:bg-navy/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-line dark:border-line/20">
                  <tr>
                    <th className="px-5 py-3.5">No Invoice</th>
                    <th className="px-5 py-3.5">Tahap Termin</th>
                    <th className="px-5 py-3.5">Milestone Terkait</th>
                    <th className="px-5 py-3.5 text-right">Nominal Tagihan</th>
                    <th className="px-5 py-3.5">Jatuh Tempo</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Aksi / Pelunasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line dark:divide-line/20">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                        Belum ada jadwal termin penagihan.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-surface/50 dark:hover:bg-navy/30 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-navy dark:text-white">
                          {inv.invoice_number}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-navy dark:text-white">{inv.term_name}</p>
                          {inv.payment_reference && (
                            <p className="text-[10px] text-slate-400 mt-0.5">Ref: {inv.payment_reference}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                          {inv.milestone ? (
                            <span className="flex items-center gap-1 font-medium text-navy dark:text-slate-300">
                              {inv.milestone.title} ({inv.milestone.weight_percentage}%)
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Umum</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-navy dark:text-white">
                          {formatCurrency(Number(inv.amount))}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                          {inv.due_date || '-'}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {inv.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-success-light text-success border border-success/30">
                              <CheckCircle2 className="h-3 w-3" /> Lunas
                            </span>
                          ) : inv.status === 'overdue' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-danger-light text-danger border border-danger/30">
                              <AlertCircle className="h-3 w-3" /> Jatuh Tempo
                            </span>
                          ) : inv.status === 'invoiced' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-surface-2 text-primary border border-primary/30">
                              <Clock className="h-3 w-3" /> Difakturkan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-surface text-slate-700 border border-line">
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {inv.status !== 'paid' && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setPayingInvoice(inv);
                                  setPayForm({
                                    paid_date: new Date().toISOString().split('T')[0],
                                    payment_reference: '',
                                    notes: '',
                                  });
                                }}
                                className="!py-1 !px-2.5 text-[11px] text-success border-success/30 hover:bg-success-light"
                              >
                                <Check className="h-3 w-3" />
                                Catat Bayar
                              </Button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="text-slate-400 hover:text-danger transition-colors p-1"
                              title="Hapus Invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH ITEM RAB */}
      {showAddRabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-card-lg bg-white dark:bg-navy-light p-6 shadow-card-hover border border-line dark:border-line/20">
            <h3 className="text-base font-bold text-navy dark:text-white">Tambah Pos Anggaran (RAB)</h3>
            <form onSubmit={handleCreateRab} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                  Nama Item Pekerjaan *
                </label>
                <input
                  type="text"
                  required
                  value={rabForm.item_name}
                  onChange={e => setRabForm({ ...rabForm, item_name: e.target.value })}
                  placeholder="Misal: Pengecoran Plat Lantai 2"
                  className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={rabForm.category}
                    onChange={e => setRabForm({ ...rabForm, category: e.target.value })}
                    className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <option value="material">Material & Bahan</option>
                    <option value="labor">Upah Tenaga Kerja</option>
                    <option value="equipment">Alat Berat / Rental</option>
                    <option value="subcon">Subkontraktor</option>
                    <option value="operational">Operasional Lapangan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                    Satuan Unit
                  </label>
                  <input
                    type="text"
                    value={rabForm.unit}
                    onChange={e => setRabForm({ ...rabForm, unit: e.target.value })}
                    placeholder="m2, m3, sak, ls"
                    className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                    Volume *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={rabForm.volume}
                    onChange={e => setRabForm({ ...rabForm, volume: Number(e.target.value) })}
                    className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                    Harga Satuan (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={rabForm.unit_price}
                    onChange={e => setRabForm({ ...rabForm, unit_price: Number(e.target.value) })}
                    className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="p-3 rounded-card bg-surface-2 text-xs flex justify-between items-center text-primary border border-primary/20 font-medium">
                <span>Total Estimasi Pagu RAB:</span>
                <span className="font-bold text-sm">
                  {formatCurrency(rabForm.volume * rabForm.unit_price)}
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line dark:border-line/20">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddRabModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Pos RAB'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATAT PENGELUARAN */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-card-lg bg-white dark:bg-navy-light p-6 shadow-card-hover border border-line dark:border-line/20">
            <h3 className="text-base font-bold text-navy dark:text-white">Catat Pengeluaran Riil Lapangan</h3>
            <form onSubmit={handleCreateExpense} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                  Deskripsi / Nama Item *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.item_name}
                  onChange={e => setExpenseForm({ ...expenseForm, item_name: e.target.value })}
                  placeholder="Misal: Pembelian Besi 10mm & Kawat Bendrat"
                  className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                    Nominal Biaya (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                    Tanggal Pengeluaran *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expense_date}
                    onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                    className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <option value="material">Material & Bahan</option>
                    <option value="labor">Upah Tenaga Kerja</option>
                    <option value="equipment">Alat Berat / Rental</option>
                    <option value="subcon">Subkontraktor</option>
                    <option value="operational">Operasional Lapangan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                    Alokasikan ke Pos RAB
                  </label>
                  <select
                    value={expenseForm.project_rab_id}
                    onChange={e => setExpenseForm({ ...expenseForm, project_rab_id: e.target.value })}
                    className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <option value="">-- Non Pos RAB (Biaya Tambahan) --</option>
                    {rabs.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.item_name} (Pagu: {formatCurrency(Number(r.total_price))})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                    Pemasok / Vendor
                  </label>
                  <select
                    value={expenseForm.project_vendor_id}
                    onChange={e => setExpenseForm({ ...expenseForm, project_vendor_id: e.target.value })}
                    className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <option value="">-- Pilih Vendor (Opsional) --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.category || 'Vendor'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                    Unggah Bukti Struk / Nota
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => setExpenseReceiptFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-input file:border-0 file:text-xs file:font-semibold file:bg-surface-2 file:text-primary hover:file:bg-primary-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                  Catatan / Keterangan Nota
                </label>
                <textarea
                  rows={2}
                  value={expenseForm.notes}
                  onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="No kwitansi, penerima uang, atau rincian spesifik..."
                  className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line dark:border-line/20">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddExpenseModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Menyimpan...' : 'Catat Pengeluaran'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TERBITKAN TERMIN INVOICE */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-card-lg bg-white dark:bg-navy-light p-6 shadow-card-hover border border-line dark:border-line/20">
            <h3 className="text-base font-bold text-navy dark:text-white">Terbitkan Tagihan Termin Proyek</h3>
            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                  Nama Tahap Termin *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceForm.term_name}
                  onChange={e => setInvoiceForm({ ...invoiceForm, term_name: e.target.value })}
                  placeholder="Misal: Termin 1 (Uang Muka 20%)"
                  className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                    Nominal Tagihan (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={invoiceForm.amount}
                    onChange={e => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={e => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                  Hubungkan dengan Milestone Fisik
                </label>
                <select
                  value={invoiceForm.project_milestone_id}
                  onChange={e => setInvoiceForm({ ...invoiceForm, project_milestone_id: e.target.value })}
                  className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="">-- Tanpa Milestone Terikat --</option>
                  {project.milestones?.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title} (Bobot: {m.weight_percentage}%)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Saat pembayaran termin dicatat lunas, status pembayaran milestone terkait otomatis aktif.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                  Catatan Rekening / Info Pembayaran
                </label>
                <textarea
                  rows={2}
                  value={invoiceForm.notes}
                  onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  placeholder="Keterangan nomor rekening transfer dan ketentuan pembayaran..."
                  className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line dark:border-line/20">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddInvoiceModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Menerbitkan...' : 'Terbitkan Termin'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATAT PELUNASAN (SETTLEMENT) */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-card-lg bg-white dark:bg-navy-light p-6 shadow-card-hover border border-line dark:border-line/20">
            <h3 className="text-base font-bold text-navy dark:text-white">Konfirmasi Pelunasan Termin</h3>
            <p className="text-xs text-slate-500 mt-1">
              {payingInvoice.term_name} - <span className="font-bold text-navy dark:text-white">{formatCurrency(Number(payingInvoice.amount))}</span>
            </p>

            <form onSubmit={handleSettlePayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                  Tanggal Masuk Pembayaran *
                </label>
                <input
                  type="date"
                  required
                  value={payForm.paid_date}
                  onChange={e => setPayForm({ ...payForm, paid_date: e.target.value })}
                  className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                  Nomor Referensi Bank / Bukti Transfer
                </label>
                <input
                  type="text"
                  value={payForm.payment_reference}
                  onChange={e => setPayForm({ ...payForm, payment_reference: e.target.value })}
                  placeholder="Misal: TRF-BCA-928374928"
                  className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={payForm.notes}
                  onChange={e => setPayForm({ ...payForm, notes: e.target.value })}
                  placeholder="Keterangan rekonsiliasi atau mutasi..."
                  className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line dark:border-line/20">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPayingInvoice(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Menyimpan...' : 'Konfirmasi Pelunasan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
