import { useState } from 'react';
import { FileText, Download, Filter, CheckCircle2, CreditCard, Layers, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ExportReportModal, type ExportFormatType } from '../components/reports/ExportReportModal';
import { ScheduledReportManager } from '../components/reports/ScheduledReportManager';
import { ReportArchiveTable } from '../components/reports/ReportArchiveTable';

interface DivisionSummary {
  code: string;
  name: string;
  omsetHariIni: number;
  omsetBulanIni: number;
  targetBulanIni: number;
  achievementPct: number;
  status: 'Over Target' | 'On Track' | 'Action Needed';
}

const DIVISION_REPORTS: DivisionSummary[] = [
  { code: 'WRAP', name: 'Divisi Wrap & Accessories', omsetHariIni: 45000000, omsetBulanIni: 262500000, targetBulanIni: 1200000000, achievementPct: 21.8, status: 'On Track' },
  { code: 'MC', name: 'Divisi Money Changer & Forex', omsetHariIni: 89000000, omsetBulanIni: 540000000, targetBulanIni: 2000000000, achievementPct: 27.0, status: 'Over Target' },
  { code: 'LOGISTICS', name: 'Divisi Logistik & Distribusi', omsetHariIni: 32000000, omsetBulanIni: 195000000, targetBulanIni: 800000000, achievementPct: 24.3, status: 'On Track' },
  { code: 'RETAIL', name: 'Divisi Mart & Retail', omsetHariIni: 55000000, omsetBulanIni: 310000000, targetBulanIni: 1500000000, achievementPct: 20.6, status: 'On Track' },
  { code: 'FNB', name: 'Divisi Food & Beverage', omsetHariIni: 78000000, omsetBulanIni: 420000000, targetBulanIni: 1800000000, achievementPct: 23.3, status: 'On Track' },
  { code: 'SERVICES', name: 'Divisi Jasa & Cleaning', omsetHariIni: 18000000, omsetBulanIni: 110000000, targetBulanIni: 600000000, achievementPct: 18.3, status: 'Action Needed' },
  { code: 'ENTERTAIN', name: 'Divisi Hiburan & Event', omsetHariIni: 95000000, omsetBulanIni: 620000000, targetBulanIni: 2200000000, achievementPct: 28.1, status: 'Over Target' },
];

const PAYMENT_METHODS = [
  { method: 'QRIS Statis & Dinamis', amount: 980000000, count: 12450, share: 39.8 },
  { method: 'EDC Bank Mandiri & BCA', amount: 850000000, count: 6820, share: 34.5 },
  { method: 'Transfer Bank Langsung', amount: 420000000, count: 1150, share: 17.0 },
  { method: 'Cash / Tunai Kasir', amount: 212500000, count: 4320, share: 8.7 },
];

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'pembayaran' | 'rekonsiliasi' | 'export'>('ringkasan');
  const [selectedDiv, setSelectedDiv] = useState('SEMUA');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportInitialFormat, setExportInitialFormat] = useState<ExportFormatType>('csv');

  const filteredDivisions = selectedDiv === 'SEMUA' ? DIVISION_REPORTS : DIVISION_REPORTS.filter(d => d.code === selectedDiv);

  const totalOmsetBulanIni = DIVISION_REPORTS.reduce((a, b) => a + b.omsetBulanIni, 0);
  const totalTargetBulanIni = DIVISION_REPORTS.reduce((a, b) => a + b.targetBulanIni, 0);
  const totalPct = Math.round((totalOmsetBulanIni / totalTargetBulanIni) * 100);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-card-lg border border-line/40 bg-gradient-to-r from-navy via-[#0f172a] to-navy p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-xs font-semibold text-primary-light backdrop-blur-md">
              <FileText className="h-3.5 w-3.5" /> Pusat Detail Laporan & Audit
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">Detail Laporan Divisi</h1>
            <p className="mt-1 text-sm text-slate-300">
              Konsolidasi laporan performa 7 divisi, metode pembayaran, rekonsiliasi kasir & bank.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setExportInitialFormat('print');
              setExportModalOpen(true);
            }}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            data-testid="header-download-pdf-btn"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download Laporan (.PDF)
          </Button>
        </div>
      </section>

      {/* KPI Cards Summary */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Omset Agregat Bulanan</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">Rp {totalOmsetBulanIni.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-slate-500">Dari Target Rp {(totalTargetBulanIni / 1000000000).toFixed(1)}M ({totalPct}%)</p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Status Rekonsiliasi Bank</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xl font-bold text-success">100% Balanced</p>
          <p className="mt-1 text-xs text-slate-500">Variance Kasir vs Bank: Rp 0</p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Transaksi Terdaftar</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-info/10 text-info">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">24.740 Transaksi</p>
          <p className="mt-1 text-xs text-info font-bold">Terverifikasi Otomatis</p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Divisi Aktif Monitoring</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-navy/10 text-navy">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">7 Divisi</p>
          <p className="mt-1 text-xs text-slate-500">Operasional Normal</p>
        </article>
      </section>

      {/* Tabs Control */}
      <section className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/40 pb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('ringkasan')}
              className={`rounded-card px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'ringkasan' ? 'bg-navy text-white shadow-md' : 'bg-surface text-slate-600 hover:bg-slate-200'
              }`}
            >
              Ringkasan 7 Divisi
            </button>
            <button
              onClick={() => setActiveTab('pembayaran')}
              className={`rounded-card px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'pembayaran' ? 'bg-navy text-white shadow-md' : 'bg-surface text-slate-600 hover:bg-slate-200'
              }`}
            >
              Metode Pembayaran
            </button>
            <button
              onClick={() => setActiveTab('rekonsiliasi')}
              className={`rounded-card px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'rekonsiliasi' ? 'bg-navy text-white shadow-md' : 'bg-surface text-slate-600 hover:bg-slate-200'
              }`}
            >
              Rekonsiliasi Bank
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`rounded-card px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'export' ? 'bg-navy text-white shadow-md' : 'bg-surface text-slate-600 hover:bg-slate-200'
              }`}
            >
              Export Center
            </button>
          </div>

          {activeTab === 'ringkasan' && (
            <div className="flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium text-slate-600">Filter Divisi:</span>
              <select
                value={selectedDiv}
                onChange={(e) => setSelectedDiv(e.target.value)}
                className="bg-transparent font-bold text-navy focus:outline-none"
              >
                <option value="SEMUA">Semua Divisi</option>
                {DIVISION_REPORTS.map(d => (
                  <option key={d.code} value={d.code}>{d.code}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Ringkasan 7 Divisi */}
        {activeTab === 'ringkasan' && (
          <div className="mt-6 overflow-x-auto rounded-card-lg border border-line/40">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Kode & Nama Divisi</th>
                  <th className="px-4 py-3.5 text-right">Omset Hari Ini</th>
                  <th className="px-4 py-3.5 text-right">Omset s/d Bulan Ini</th>
                  <th className="px-4 py-3.5 text-right">Target Bulanan</th>
                  <th className="px-4 py-3.5 text-center">% Target</th>
                  <th className="px-4 py-3.5 text-center">Status Performansi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 font-medium">
                {filteredDivisions.map((item) => (
                  <tr key={item.code} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-navy">{item.code}</p>
                      <p className="text-xs text-slate-500">{item.name}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-navy">
                      Rp {item.omsetHariIni.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-navy">
                      Rp {item.omsetBulanIni.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                      Rp {item.targetBulanIni.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-navy">
                      {item.achievementPct}%
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-bold ${
                        item.status === 'Over Target' ? 'bg-success-light text-success' : item.status === 'On Track' ? 'bg-info/10 text-info' : 'bg-warning-light text-warning'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Metode Pembayaran */}
        {activeTab === 'pembayaran' && (
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-bold text-navy">Breakdown Kanal & Metode Pembayaran</h3>
            <div className="overflow-x-auto rounded-card-lg border border-line/40">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Metode Pembayaran</th>
                    <th className="px-4 py-3.5 text-right">Volume Transaksi</th>
                    <th className="px-4 py-3.5 text-right">Total Nominal (Rp)</th>
                    <th className="px-4 py-3.5 text-center">Pangsa / Share (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40 font-medium">
                  {PAYMENT_METHODS.map((pm) => (
                    <tr key={pm.method} className="hover:bg-surface/50">
                      <td className="px-4 py-3.5 font-bold text-navy">{pm.method}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-700">{pm.count.toLocaleString('id-ID')} Tx</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-navy">Rp {pm.amount.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-primary">{pm.share}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Rekonsiliasi Bank */}
        {activeTab === 'rekonsiliasi' && (
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-bold text-navy">Status Audit Rekonsiliasi Kasir vs Bank</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-card-lg border border-line/40 bg-surface/30 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Total Pencatatan Kasir</p>
                <p className="mt-2 text-xl font-bold font-mono text-navy">Rp 2.462.500.000</p>
                <p className="mt-1 text-xs text-slate-500">Dari 7 sistem POS kasir</p>
              </div>
              <div className="rounded-card-lg border border-line/40 bg-surface/30 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Total Mutasi Masuk Bank</p>
                <p className="mt-2 text-xl font-bold font-mono text-navy">Rp 2.462.500.000</p>
                <p className="mt-1 text-xs text-slate-500">Bank Mandiri & BCA</p>
              </div>
              <div className="rounded-card-lg border border-success/30 bg-success-light/30 p-4">
                <p className="text-xs font-semibold uppercase text-success">Variance (Selisih Audit)</p>
                <p className="mt-2 text-xl font-bold font-mono text-success">Rp 0 (Balanced)</p>
                <p className="mt-1 text-xs text-success/80 font-medium">Audit Selesai Tanpa Selisih</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Export Center & Automated Reports */}
        {activeTab === 'export' && (
          <div className="mt-6 space-y-6">
            {/* Quick Export Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-card-lg border border-line/60 p-5 bg-white shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-navy">Ekspor Dataset & Rekapitulasi (.XLSX/.CSV)</h4>
                  <p className="text-xs text-slate-500 mt-1">Unduh seluruh ringkasan data, omzet harian, dan mutasi rekonsiliasi</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setExportInitialFormat('csv');
                    setExportModalOpen(true);
                  }}
                  data-testid="tab-export-excel-btn"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Buka Modal Ekspor
                </Button>
              </div>

              <div className="rounded-card-lg border border-line/60 p-5 bg-white shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-navy">Cetak Laporan Eksekutif (.PDF)</h4>
                  <p className="text-xs text-slate-500 mt-1">Format cetak A4/Letter standar audit untuk Dewan Direksi & Stakeholders</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setExportInitialFormat('print');
                    setExportModalOpen(true);
                  }}
                  data-testid="tab-export-pdf-btn"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Cetak PDF
                </Button>
              </div>
            </div>

            {/* Automated Scheduled Report Manager */}
            <ScheduledReportManager />

            {/* Report Archive & Download Audit Trail */}
            <ReportArchiveTable />
          </div>
        )}
      </section>

      {/* Universal Export Report Modal */}
      <ExportReportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        initialFormat={exportInitialFormat}
        activeDivision={selectedDiv}
      />
    </div>
  );
}
