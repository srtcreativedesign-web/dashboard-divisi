import { useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { generateCsvBlob, downloadBlob, getExportDataset } from './exportUtils';

export interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePeriod?: string;
  activeDivision?: string;
}

export function ExportReportModal({ isOpen, onClose }: ExportReportModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = getExportDataset('executive');
    const blob = generateCsvBlob(data.headers, data.rows);
    downloadBlob(blob, data.filename);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Ekspor Laporan</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-500">
            Ekspor Ringkasan Eksekutif saat ini akan menghasilkan file CSV berisikan metrik performa utama.
          </p>
          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
