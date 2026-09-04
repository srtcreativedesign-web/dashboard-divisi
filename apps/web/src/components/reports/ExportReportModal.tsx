import { useEffect, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Printer,
  FileCode,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  Calendar,
  Building2,
  Check,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import {
  generateCsvBlob,
  downloadBlob,
  getExportDataset,
  formatCurrencyIDR,
} from './exportUtils';

export type ExportDatasetType = 'executive' | 'divisions' | 'outstanding' | 'cashflow' | 'reconciliation';
export type ExportFormatType = 'csv' | 'print' | 'json';

export interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDataset?: ExportDatasetType;
  initialFormat?: ExportFormatType;
  activePeriod?: string;
  activeDivision?: string;
}

const DATASETS: Array<{
  id: ExportDatasetType;
  title: string;
  desc: string;
  icon: React.ElementType;
  recordCount: string;
}> = [
  {
    id: 'executive',
    title: 'Ringkasan Eksekutif & KPI Konsolidasi',
    desc: 'Omzet MTD, Gross Profit, margin laba, dan pencapaian target',
    icon: Sparkles,
    recordCount: '5 Metrik Utama',
  },
  {
    id: 'divisions',
    title: 'Rekapitulasi Kinerja 7 Divisi Ritel',
    desc: 'Omzet harian, bulanan, target, dan ranking performa per divisi',
    icon: Building2,
    recordCount: '7 Divisi Operasional',
  },
  {
    id: 'outstanding',
    title: 'Distribusi Aging Bucket Piutang (AR)',
    desc: 'Pengelompokan 4 interval umur penagihan & analisis profil risiko',
    icon: Layers,
    recordCount: '76 Faktur Tagihan',
  },
  {
    id: 'cashflow',
    title: 'Laporan Arus Kas Waterfall Bridge',
    desc: 'Aliran dana masuk, beban operasional, dan saldo kas neto',
    icon: FileSpreadsheet,
    recordCount: '7 Pos Arus Kas',
  },
  {
    id: 'reconciliation',
    title: 'Hasil Audit Rekonsiliasi 31 Rekening Bank',
    desc: 'Pencocokan saldo buku besar vs mutasi rekening koran (100% klop)',
    icon: ShieldCheck,
    recordCount: '31 Rekening Mitra',
  },
];

export function ExportReportModal({
  isOpen,
  onClose,
  initialDataset = 'executive',
  initialFormat = 'csv',
  activePeriod = 'Bulan Ini (Sep 2026)',
  activeDivision = 'Semua Divisi',
}: ExportReportModalProps) {
  const [selectedDataset, setSelectedDataset] = useState<ExportDatasetType>(initialDataset);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormatType>(initialFormat);
  const [formatCurrency, setFormatCurrency] = useState(true);
  const [includeAuditNote, setIncludeAuditNote] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastDownloadedFile, setLastDownloadedFile] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedDataset(initialDataset);
      setSelectedFormat(initialFormat);
      setIsGenerating(false);
      setProgress(0);
      setIsSuccess(false);
      setLastDownloadedFile('');
    }
  }, [isOpen, initialDataset, initialFormat]);

  // Handle keyboard ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isGenerating, onClose]);

  if (!isOpen) return null;

  const handleStartExport = () => {
    setIsGenerating(true);
    setProgress(15);
    setIsSuccess(false);

    // Simulated multi-step export pipeline
    setTimeout(() => {
      setProgress(55);
    }, 150);

    setTimeout(() => {
      setProgress(90);
    }, 300);

    setTimeout(() => {
      setProgress(100);

      const dataset = getExportDataset(selectedDataset, {
        formattedCurrency: formatCurrency,
      });

      if (selectedFormat === 'csv') {
        const blob = generateCsvBlob(dataset.headers, dataset.rows, {
          title: dataset.title,
          period: activePeriod,
          division: activeDivision,
          generatedBy: 'BOD Executive Portal',
          generatedAt: new Date().toLocaleString('id-ID'),
        });
        downloadBlob(blob, dataset.filename);
        setLastDownloadedFile(dataset.filename);
      } else if (selectedFormat === 'json') {
        const jsonContent = JSON.stringify(
          {
            title: dataset.title,
            period: activePeriod,
            division: activeDivision,
            generatedAt: new Date().toISOString(),
            headers: dataset.headers,
            data: dataset.rows,
          },
          null,
          2,
        );
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const jsonFilename = dataset.filename.replace('.csv', '.json');
        downloadBlob(blob, jsonFilename);
        setLastDownloadedFile(jsonFilename);
      } else if (selectedFormat === 'print') {
        // Print layout: trigger native window.print()
        setLastDownloadedFile(`${dataset.title} (Siap Cetak PDF)`);
        window.print();
      }

      setIsGenerating(false);
      setIsSuccess(true);
    }, 450);
  };

  const currentDatasetObj = DATASETS.find((d) => d.id === selectedDataset) ?? DATASETS[0]!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => !isGenerating && onClose()}
      data-testid="export-modal-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pusat Ekspor Data & Laporan"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-sky-200 ring-1 ring-black/5 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        data-testid="export-modal-panel"
      >
        {/* Accent top gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary-600 via-sky-500 to-sage shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/70 px-5 py-4 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy tracking-tight leading-tight">
                Pusat Ekspor Data Korporat
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi format unduhan berkas & laporan audit resmi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            aria-label="Tutup modal ekspor"
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors disabled:opacity-50"
            data-testid="export-modal-close-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
          {/* Active Context Banner */}
          <div className="flex items-center justify-between rounded-xl bg-sky-50/80 border border-sky-200/70 px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2 text-sky-900 font-medium">
              <Calendar className="h-4 w-4 text-sky-600" />
              <span>Periode: <strong>{activePeriod}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span>{activeDivision}</span>
            </div>
          </div>

          {/* Section 1: Choose Dataset */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              1. Pilih Dataset Laporan
            </label>
            <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Dataset Laporan">
              {DATASETS.map((ds) => {
                const Icon = ds.icon;
                const isSelected = selectedDataset === ds.id;
                return (
                  <button
                    key={ds.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedDataset(ds.id)}
                    className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-500 text-sky-950 ring-1 ring-sky-300 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
                    }`}
                    data-testid={`dataset-option-${ds.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight truncate">{ds.title}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{ds.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      {ds.recordCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Choose Format */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              2. Format Berkas Unduhan
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                  selectedFormat === 'csv'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
                data-testid="format-option-csv"
              >
                <FileSpreadsheet
                  className={`h-5 w-5 ${selectedFormat === 'csv' ? 'text-emerald-600' : 'text-slate-500'}`}
                />
                <div>
                  <p className="text-xs font-bold leading-tight">Excel / CSV</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">BOM UTF-8</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('print')}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                  selectedFormat === 'print'
                    ? 'bg-sky-50 border-sky-500 text-sky-900 ring-1 ring-sky-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
                data-testid="format-option-print"
              >
                <Printer
                  className={`h-5 w-5 ${selectedFormat === 'print' ? 'text-sky-600' : 'text-slate-500'}`}
                />
                <div>
                  <p className="text-xs font-bold leading-tight">Cetak PDF</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tata Letak A4</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('json')}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                  selectedFormat === 'json'
                    ? 'bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
                data-testid="format-option-json"
              >
                <FileCode
                  className={`h-5 w-5 ${selectedFormat === 'json' ? 'text-purple-600' : 'text-slate-500'}`}
                />
                <div>
                  <p className="text-xs font-bold leading-tight">Raw JSON</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Audit Log</p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Extra Options */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-2">
            <p className="text-xs font-bold text-slate-700">Opsi Kustomisasi Berkas</p>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={formatCurrency}
                onChange={(e) => setFormatCurrency(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                data-testid="opt-currency"
              />
              <span>Format nilai angka ke mata uang Rupiah (<span className="font-semibold text-slate-800">IDR</span>)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAuditNote}
                onChange={(e) => setIncludeAuditNote(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                data-testid="opt-audit"
              />
              <span>Sertakan tanda tangan digital, stempel waktu, dan metadata pembuat</span>
            </label>
          </div>

          {/* Progress / Success Banner */}
          {isGenerating && (
            <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 space-y-2 animate-in fade-in" data-testid="export-progress">
              <div className="flex items-center justify-between text-xs font-semibold text-sky-800">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" />
                  Menyiapkan & Mengompilasi Berkas...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-sky-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 transition-all duration-150 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {isSuccess && (
            <div
              className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-3 animate-in fade-in"
              data-testid="export-success-banner"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-emerald-900">Berkas Berhasil Dibuat!</p>
                <p className="text-emerald-700 truncate mt-0.5">
                  Telah disimpan sebagai: <strong className="font-mono">{lastDownloadedFile}</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line/60 bg-slate-50/80 px-5 py-3.5 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            Target Dokumen: <span className="font-semibold text-sky-800">{currentDatasetObj.title}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-all"
              data-testid="export-cancel-btn"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleStartExport}
              disabled={isGenerating}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-primary-700 hover:to-sky-700 active:scale-95 disabled:opacity-50 transition-all"
              data-testid="export-submit-btn"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>{selectedFormat === 'print' ? 'Buka Pratinjau Cetak' : 'Unduh Sekarang'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
