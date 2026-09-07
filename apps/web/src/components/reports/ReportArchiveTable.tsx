import { useState } from 'react';
import {
  FileText,
  Download,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { generateCsvBlob, downloadBlob, getExportDataset } from './exportUtils';

export interface ArchivedReportItem {
  id: string;
  name: string;
  category: string;
  period: string;
  format: 'XLSX' | 'PDF' | 'JSON';
  size: string;
  generatedAt: string;
  generatedBy: string;
  checksum: string;
}

const ARCHIVED_REPORTS: ArchivedReportItem[] = [
  {
    id: 'arc-001',
    name: 'Executive_Summary_MTD_Sep2026.xlsx',
    category: 'Ringkasan Eksekutif',
    period: '01 Sep - 04 Sep 2026',
    format: 'XLSX',
    size: '148 KB',
    generatedAt: '04 Sep 2026, 21:00',
    generatedBy: 'Cron Scheduler (Flash Daily)',
    checksum: 'SHA256: 8f4a...91bc',
  },
  {
    id: 'arc-002',
    name: 'Rekapitulasi_Aging_Piutang_Minggu_36.xlsx',
    category: 'Aging Outstanding AR',
    period: 'Minggu ke-36 (Sep 2026)',
    format: 'XLSX',
    size: '235 KB',
    generatedAt: '01 Sep 2026, 08:00',
    generatedBy: 'Cron Scheduler (Weekly AR)',
    checksum: 'SHA256: d3b1...55fa',
  },
  {
    id: 'arc-003',
    name: 'Laporan_Rekonsiliasi_31_Rekening_Bank.xlsx',
    category: 'Rekonsiliasi Bank',
    period: 'Agustus 2026 (Penutupan)',
    format: 'XLSX',
    size: '312 KB',
    generatedAt: '31 Agu 2026, 18:30',
    generatedBy: 'Supervisor Akuntansi',
    checksum: 'SHA256: e29c...10aa',
  },
  {
    id: 'arc-004',
    name: 'Cashflow_Waterfall_Konsolidasi_Agustus.pdf',
    category: 'Arus Kas & PnL',
    period: '01 Agu - 31 Agu 2026',
    format: 'PDF',
    size: '580 KB',
    generatedAt: '31 Agu 2026, 17:00',
    generatedBy: 'BOD Executive Portal',
    checksum: 'SHA256: 44bf...8312',
  },
  {
    id: 'arc-005',
    name: 'Kinerja_7_Divisi_Ritel_Mingguan.xlsx',
    category: 'Divisi Operasional',
    period: 'Minggu ke-35 (Agu 2026)',
    format: 'XLSX',
    size: '190 KB',
    generatedAt: '25 Agu 2026, 08:00',
    generatedBy: 'Cron Scheduler (Weekly)',
    checksum: 'SHA256: 77c0...fe9a',
  },
];

export function ReportArchiveTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filteredItems = ARCHIVED_REPORTS.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.period.toLowerCase().includes(q) ||
      item.generatedBy.toLowerCase().includes(q)
    );
  });

  const handleRedownload = (item: ArchivedReportItem) => {
    setDownloadingId(item.id);
    setTimeout(() => {
      // Create actual re-download using corresponding dataset
      const dsType = item.category.toLowerCase().includes('eksekutif')
        ? 'executive'
        : item.category.toLowerCase().includes('aging')
        ? 'outstanding'
        : item.category.toLowerCase().includes('rekonsiliasi')
        ? 'reconciliation'
        : item.category.toLowerCase().includes('arus kas')
        ? 'cashflow'
        : 'divisions';

      const dataset = getExportDataset(dsType);
      const blob = generateCsvBlob(dataset.headers, dataset.rows, {
        title: item.name,
        period: item.period,
        generatedBy: item.generatedBy,
        generatedAt: item.generatedAt,
      });
      downloadBlob(blob, item.name.replace('.pdf', '.csv').replace('.xlsx', '.csv'));
      setDownloadingId(null);
    }, 400);
  };

  return (
    <div className="space-y-3" data-testid="report-archive-table-container">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-card-lg border border-line/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-navy">Arsip Laporan & Jejak Audit Unduhan</h3>
            <span className="rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 border border-emerald-200">
              Integritas Data Terverifikasi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar berkas historis yang telah diterbitkan dan siap diunduh ulang tanpa kalkulasi ulang
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama berkas, periode..."
            aria-label="Cari arsip laporan"
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white transition-all"
            data-testid="archive-search-input"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-card-lg border border-line/60 bg-white shadow-xs">
        <table className="w-full text-left text-xs" data-testid="report-archive-table">
          <thead className="bg-slate-50/80 border-b border-line/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama Berkas Laporan</th>
              <th className="px-4 py-3">Format & Ukuran</th>
              <th className="px-4 py-3">Periode Data</th>
              <th className="px-4 py-3">Diterbitkan Oleh</th>
              <th className="px-4 py-3 text-center">Status Audit</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Tidak ada dokumen arsip yang cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isDownloading = downloadingId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-navy">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700 border border-sky-200/60">
                          {item.format === 'XLSX' ? (
                            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-rose-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-tight">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.checksum}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      <span className="font-semibold text-slate-800">{item.format}</span> · {item.size}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {item.period}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      <p className="leading-tight">{item.generatedBy}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.generatedAt}</p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Sah
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRedownload(item)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-800 transition-all active:scale-95 disabled:opacity-50"
                        data-testid={`redownload-btn-${item.id}`}
                      >
                        <Download className="h-3 w-3" />
                        <span>{isDownloading ? 'Mengunduh...' : 'Unduh Ulang'}</span>
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
  );
}
