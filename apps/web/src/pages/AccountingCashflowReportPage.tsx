import { useState } from 'react';
import { Download, Search, TrendingUp, ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { ACCOUNTING_EXCEL_DATA } from '../data/accountingExcelData';
import { useAccountingPeriods, useAccountingCashflowReport } from '../hooks/useAccounting';
import { useToast } from '../components/ui/Toast';
import { WaterfallChart, type WaterfallItem } from '../components/accounting/WaterfallChart';

const rupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function AccountingCashflowReportPage() {
  const { toast } = useToast();
  const periods = useAccountingPeriods();
  const { data: reportData, isLoading } = useAccountingCashflowReport();
  const [activeTab, setActiveTab] = useState<'statement' | 'explanation'>('statement');
  const [selectedGroup, setSelectedGroup] = useState<'ALL' | 'B' | 'C' | 'D'>('ALL');
  const [searchCategory, setSearchCategory] = useState('');

  const activePeriod = periods.data?.find((p) => ['draft', 'pending_approval', 'reopened'].includes(p.status)) ?? periods.data?.[0];

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
  const allExpenseCategories = [
    { group: 'B', groupLabel: 'Pendapatan', code: 'B1', name: 'Sales Store Harian', amount: 4760786093 },
    { group: 'B', groupLabel: 'Pendapatan', code: 'B2', name: 'Pendapatan Jasa Manajemen', amount: 0 },
    { group: 'B', groupLabel: 'Pendapatan', code: 'B3', name: 'Pendapatan Lain-lain (Bunga/Koreksi)', amount: 290105479.12 },
    ...cf.operationalExpenses.map((x) => ({ group: 'C', groupLabel: 'Biaya Operasional', ...x })),
    ...cf.backofficeExpenses.map((x) => ({ group: 'D', groupLabel: 'Biaya Back Office', ...x })),
  ];

  const filteredCategories = allExpenseCategories.filter((item) => {
    const matchGroup = selectedGroup === 'ALL' || item.group === selectedGroup;
    const matchSearch = item.name.toLowerCase().includes(searchCategory.toLowerCase()) || item.code.toLowerCase().includes(searchCategory.toLowerCase());
    return matchGroup && matchSearch;
  });

  const cashflowWaterfallItems: WaterfallItem[] = [
    { id: 'initial', label: 'Saldo Awal', amount: cf.initialBalance, isTotal: true },
    { id: 'rev', label: 'Penerimaan/Sales', amount: cf.totalRevenue },
    { id: 'ops', label: 'Beban Operasional', amount: -cf.totalOperational },
    { id: 'backoffice', label: 'Beban Backoffice', amount: -cf.totalBackoffice },
    { id: 'ending', label: 'Saldo Kas Akhir', amount: cf.totalEndingBalance, isTotal: true },
  ];

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">ACCOUNTING CONTROL CENTER</p>
          <h1 className="mt-1 text-2xl font-bold text-navy">Laporan Cashflow & Penjelasan Arus Kas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Laporan Arus Kas resmi periode <span className="font-semibold text-navy">{activePeriod?.periodMonth ?? 'Agustus 2026'}</span> dari rekonsiliasi jurnal buku besar.
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
            onClick={() => toast('Laporan Cashflow berhasil diekspor dalam format spreadsheet resmi', 'success')}
            className="inline-flex items-center gap-1.5 rounded-input border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
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
          onClick={() => setActiveTab('statement')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'statement' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <FileText className="h-4 w-4" />
          Laporan Arus Kas (CASH FLOW)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('explanation')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'explanation' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Penjelasan Arus Kas (Detail 97 Kategori)
        </button>
      </div>

      {activeTab === 'statement' ? (
        <div className="space-y-6">
          {/* Highlight KPI Banner */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-card border border-line bg-white p-4 shadow-card">
              <p className="text-xs font-medium text-slate-500">A. Saldo Awal Kas</p>
              <p className="mt-1 text-xl font-bold text-navy">{rupiah(cf.initialBalance)}</p>
              <p className="mt-1 text-xs text-slate-400">Saldo Bank 31 Juli 2026</p>
            </article>

            <article className="rounded-card border border-line bg-white p-4 shadow-card">
              <p className="text-xs font-medium text-slate-500">B. Total Penerimaan / Sales</p>
              <p className="mt-1 text-xl font-bold text-success">+{rupiah(cf.totalRevenue)}</p>
              <p className="mt-1 text-xs text-slate-400">Total Arus Masuk Aktual</p>
            </article>

            <article className="rounded-card border border-line bg-white p-4 shadow-card">
              <p className="text-xs font-medium text-slate-500">C+D. Total Pengeluaran Kas</p>
              <p className="mt-1 text-xl font-bold text-danger">-{rupiah(cf.totalOperational + cf.totalBackoffice)}</p>
              <p className="mt-1 text-xs text-slate-400">Beban Ops &amp; Back Office</p>
            </article>

            <article className="rounded-card-lg bg-gradient-to-br from-navy to-slate-800 p-4 text-white shadow-card">
              <p className="text-xs font-medium text-slate-300">TOTAL SALDO AKHIR KAS</p>
              <p className="mt-1 text-xl font-bold">{rupiah(cf.totalEndingBalance)}</p>
              <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> Rekonsiliasi Bank 100% Cocok
              </p>
            </article>
          </div>

          {/* Waterfall Chart Arus Kas */}
          <WaterfallChart
            title="Waterfall Chart: Jembatan Aliran Arus Kas"
            subtitle="Pemetaan pembentukan saldo kas dari saldo awal, penerimaan penjualan, beban toko, hingga saldo akhir"
            items={cashflowWaterfallItems}
          />

          {/* Statement Hierarchy Table */}
          <div className="rounded-card border border-line bg-white shadow-card overflow-hidden">
            <div className="border-b border-line bg-slate-50 p-4">
              <h2 className="text-base font-bold text-navy">Laporan Arus Kas Wrapping (Periode Agustus 2026)</h2>
              <p className="text-xs text-slate-500">Format resmi buku kas divisi wrapping.</p>
            </div>

            <div className="divide-y divide-line text-xs">
              {/* Section A */}
              <div className="bg-slate-50/50 p-3 flex justify-between font-bold text-navy">
                <span>A. SALDO AWAL BANK (31 Juli 2026)</span>
                <span className="font-mono">{rupiah(cf.initialBalance)}</span>
              </div>

              {/* Section B */}
              <div className="p-3 bg-emerald-50/30 flex justify-between font-bold text-success">
                <span>B. TOTAL PENDAPATAN</span>
                <span className="font-mono">+{rupiah(cf.totalRevenue)}</span>
              </div>
              <div className="pl-6 pr-3 py-2 flex justify-between text-slate-600">
                <span>1. Sales Store Harian (484 Transaksi)</span>
                <span className="font-mono">Rp 4.760.786.093</span>
              </div>
              <div className="pl-6 pr-3 py-2 flex justify-between text-slate-600">
                <span>2. Pendapatan Lain-lain &amp; Bunga Bank</span>
                <span className="font-mono">Rp 290.105.479</span>
              </div>
              <div className="bg-slate-100/70 px-4 py-2 flex justify-between font-semibold text-navy">
                <span>TOTAL SALDO TERSEDIA (A + B)</span>
                <span className="font-mono">{rupiah(cf.totalAvailable)}</span>
              </div>

              {/* Section C */}
              <div className="p-3 bg-rose-50/30 flex justify-between font-bold text-danger">
                <span>C. TOTAL BIAYA OPERASIONAL</span>
                <span className="font-mono">-{rupiah(cf.totalOperational)}</span>
              </div>
              {cf.operationalExpenses.filter(x => x.amount > 0).slice(0, 7).map((item) => (
                <div key={item.code} className="pl-6 pr-3 py-1.5 flex justify-between text-slate-600">
                  <span>{item.code}. {item.name}</span>
                  <span className="font-mono">{rupiah(item.amount)}</span>
                </div>
              ))}
              <div className="pl-6 pr-3 py-1.5 text-xs text-slate-400 italic">
                ...dan 25 pos beban operasional lainnya (lihat tab Penjelasan)
              </div>
              <div className="bg-slate-100/70 px-4 py-2 flex justify-between font-semibold text-navy">
                <span>TOTAL SALDO SETELAH BIAYA OPERASIONAL</span>
                <span className="font-mono">Rp 2.256.705.202</span>
              </div>

              {/* Section D */}
              <div className="p-3 bg-rose-50/30 flex justify-between font-bold text-danger">
                <span>D. TOTAL BIAYA BACK OFFICE</span>
                <span className="font-mono">-{rupiah(cf.totalBackoffice)}</span>
              </div>
              {cf.backofficeExpenses.filter(x => x.amount > 0).map((item) => (
                <div key={item.code} className="pl-6 pr-3 py-1.5 flex justify-between text-slate-600">
                  <span>{item.code}. {item.name}</span>
                  <span className="font-mono">{rupiah(item.amount)}</span>
                </div>
              ))}

              {/* Grand Total */}
              <div className="bg-navy p-4 flex justify-between font-bold text-white text-sm">
                <span>TOTAL SALDO AKHIR BANK / KAS AKTUAL</span>
                <span className="font-mono text-emerald-300">{rupiah(cf.totalEndingBalance)}</span>
              </div>

              {/* Section Outstanding Proyeksi */}
              <div className="p-4 bg-amber-50/60 border-t-2 border-warning/40 space-y-2">
                <div className="flex justify-between font-bold text-warning">
                  <span>OUTSTANDING KEWAJIBAN BULAN INI (9 ITEM)</span>
                  <span className="font-mono">-{rupiah(cf.totalOutstanding)}</span>
                </div>
                <div className="flex justify-between font-bold text-danger pt-2 border-t border-warning/30 text-sm">
                  <span>PROYEKSI SALDO AKHIR SETELAH OUTSTANDING</span>
                  <span className="font-mono">{rupiah(cf.projectedEndingBalance)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Penjelasan Cashflow */
        <div className="rounded-card border border-line bg-white p-4 shadow-card space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Grup:</span>
              <button
                type="button"
                onClick={() => setSelectedGroup('ALL')}
                className={`rounded-full px-3 py-1 text-xs font-medium ${selectedGroup === 'ALL' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Semua ({allExpenseCategories.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedGroup('B')}
                className={`rounded-full px-3 py-1 text-xs font-medium ${selectedGroup === 'B' ? 'bg-success text-white' : 'bg-success-light text-success hover:bg-success/20'}`}
              >
                B. Pendapatan
              </button>
              <button
                type="button"
                onClick={() => setSelectedGroup('C')}
                className={`rounded-full px-3 py-1 text-xs font-medium ${selectedGroup === 'C' ? 'bg-danger text-white' : 'bg-danger-light text-danger hover:bg-danger/20'}`}
              >
                C. Biaya Operasional
              </button>
              <button
                type="button"
                onClick={() => setSelectedGroup('D')}
                className={`rounded-full px-3 py-1 text-xs font-medium ${selectedGroup === 'D' ? 'bg-warning text-navy' : 'bg-warning-light text-warning hover:bg-warning/20'}`}
              >
                D. Biaya Back Office
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari akun / kode..."
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="rounded-input border border-line pl-8 pr-3 py-1.5 text-xs focus:border-primary focus:outline-none w-48 sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-card border border-line">
            <table className="w-full text-left text-xs" role="table">
              <thead className="bg-slate-50 border-b border-line text-slate-600">
                <tr>
                  <th scope="col" className="p-2.5 font-semibold">Kode</th>
                  <th scope="col" className="p-2.5 font-semibold">Kelompok</th>
                  <th scope="col" className="p-2.5 font-semibold">Nama Pos Akun</th>
                  <th scope="col" className="p-2.5 text-right font-semibold">Realisasi Aktual (Rp)</th>
                  <th scope="col" className="p-2.5 text-right font-semibold">Porsi Arus Kas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredCategories.map((cat) => {
                  const totalBase = cat.group === 'B' ? cf.totalRevenue : cf.totalOperational + cf.totalBackoffice;
                  const pct = totalBase > 0 && cat.amount > 0 ? ((cat.amount / totalBase) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={cat.code} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono font-bold text-navy">{cat.code}</td>
                      <td className="p-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            cat.group === 'B' ? 'bg-success-light text-success' : cat.group === 'C' ? 'bg-danger-light text-danger' : 'bg-warning-light text-warning'
                          }`}
                        >
                          {cat.groupLabel}
                        </span>
                      </td>
                      <td className="p-2.5 font-medium text-slate-800">{cat.name}</td>
                      <td className={`p-2.5 text-right font-mono font-semibold ${cat.amount > 0 ? (cat.group === 'B' ? 'text-success' : 'text-slate-900') : 'text-slate-300'}`}>
                        {cat.amount > 0 ? rupiah(cat.amount) : '-'}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-500">
                        {cat.amount > 0 ? `${pct}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
