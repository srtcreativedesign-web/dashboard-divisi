import { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Download,
  X,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileSpreadsheet,
  Calendar,
  Lock,
} from 'lucide-react';
import { INITIAL_AUDIT_LOGS, type AuditLogItem } from './notificationTypes';
import { generateCsvBlob, downloadBlob } from '../reports/exportUtils';

export interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs?: AuditLogItem[];
}

export function AuditLogModal({
  isOpen,
  onClose,
  auditLogs = INITIAL_AUDIT_LOGS,
}: AuditLogModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'warning' | 'error'>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (statusFilter !== 'all' && log.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        log.user.toLowerCase().includes(q) ||
        log.role.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.traceId.toLowerCase().includes(q) ||
        log.ipAddress.toLowerCase().includes(q)
      );
    });
  }, [auditLogs, searchQuery, statusFilter]);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    setIsExporting(true);
    try {
      const headers = ['Waktu', 'Pengguna', 'Role', 'Aksi Dilakukan', 'Modul / Target', 'Alamat IP', 'Trace ID', 'Status'];
      const rows = filteredLogs.map((log) => [
        log.timestamp,
        log.user,
        log.role,
        log.action,
        log.target,
        log.ipAddress,
        log.traceId,
        log.status.toUpperCase(),
      ]);

      const blob = generateCsvBlob(headers, rows, {
        title: 'Jejak Audit & Histori Keamanan Sistem',
        generatedBy: 'Administrator Final Dashboard',
        generatedAt: new Date().toLocaleString('id-ID'),
      });

      downloadBlob(blob, `Audit_Trail_Log_${Date.now()}.csv`);
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  const renderStatusBadge = (status: AuditLogItem['status']) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Berhasil
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" /> Warning
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="h-3 w-3" /> Gagal
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      data-testid="audit-log-modal"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        data-testid="audit-log-modal-container"
      >
        {/* Top Accent Gradient Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0c4a6e] via-[#0284c7] to-[#89b4e1] shrink-0" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-line/70 px-5 py-4 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0c4a6e] to-[#0284c7] text-white shadow-md ring-1 ring-white/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 id="audit-modal-title" className="text-base font-bold text-navy tracking-tight">
                Pusat Jejak Audit & Keamanan Sistem
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span>Histori aksi operasional, mutasi finansial, ekspor data, dan otentikasi.</span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <Lock className="h-3 w-3" /> Immutable Ledger
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela audit trail"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/80 hover:text-slate-700 transition-colors"
            data-testid="audit-close-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search, Filter & Export Action Toolbar */}
        <div className="px-5 py-3 border-b border-line bg-white flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pengguna, aksi, modul, trace ID, atau IP..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-navy placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                data-testid="audit-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter status audit"
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
                data-testid="audit-status-select"
              >
                <option value="all">Semua Status</option>
                <option value="success">Hanya Berhasil</option>
                <option value="warning">Peringatan</option>
                <option value="error">Gagal</option>
              </select>
            </div>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting || filteredLogs.length === 0}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs hover:shadow-sm transition-all cursor-pointer shrink-0"
            data-testid="audit-export-btn"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExporting ? 'Memproses...' : 'Unduh Log (CSV)'}</span>
          </button>
        </div>

        {/* Audit Log Table Content */}
        <div className="flex-1 overflow-y-auto min-h-[250px] p-5">
          {filteredLogs.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-testid="audit-empty-state"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <Search className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-navy">Tidak ada catatan audit yang cocok</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Coba sesuaikan kata kunci pencarian atau bersihkan filter status untuk melihat log aktivitas lainnya.
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="mt-3 text-xs font-semibold text-sky-600 hover:text-sky-800 underline"
                >
                  Reset Pencarian & Filter
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-line overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-line bg-slate-50/80 text-slate-500 font-semibold text-[11px]">
                    <th className="py-2.5 px-3.5">Waktu & Trace ID</th>
                    <th className="py-2.5 px-3.5">Pengguna & Peran</th>
                    <th className="py-2.5 px-3.5">Aksi & Modul</th>
                    <th className="py-2.5 px-3.5">Alamat IP & Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 bg-white">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-sky-50/40 transition-colors"
                      data-testid={`audit-row-${log.id}`}
                    >
                      {/* Timestamp & Trace ID */}
                      <td className="py-3 px-3.5 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-navy font-medium">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{log.timestamp}</span>
                        </div>
                        <div className="mt-1">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {log.traceId}
                          </span>
                        </div>
                      </td>

                      {/* User & Role */}
                      <td className="py-3 px-3.5 align-top">
                        <p className="font-semibold text-navy">{log.user}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                          {log.role}
                        </span>
                      </td>

                      {/* Action & Target */}
                      <td className="py-3 px-3.5 align-top">
                        <p className="font-medium text-slate-800 leading-snug">{log.action}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <span className="text-slate-300">target:</span>
                          <span className="text-slate-600">{log.target}</span>
                        </p>
                      </td>

                      {/* IP & Status */}
                      <td className="py-3 px-3.5 align-top whitespace-nowrap">
                        <div>{renderStatusBadge(log.status)}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          {log.ipAddress}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-line/70 px-5 py-3 bg-slate-50/70 shrink-0">
          <div className="text-[11px] text-slate-500">
            Menampilkan <strong className="text-navy">{filteredLogs.length}</strong> dari{' '}
            <strong>{auditLogs.length}</strong> entri log kepatuhan sistem.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer shadow-2xs"
            data-testid="audit-footer-close-btn"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
