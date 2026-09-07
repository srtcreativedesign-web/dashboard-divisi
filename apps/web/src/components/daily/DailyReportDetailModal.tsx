import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  QrCode,
  Wallet,
  Receipt,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { DailyRecord } from '../../store/approvalStore';

export interface DailyReportDetailModalProps {
  report: DailyRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DailyReportDetailModal({ report, isOpen, onClose }: DailyReportDetailModalProps) {
  if (!isOpen || !report) return null;

  const achievementPct = report.target > 0 ? Math.round((report.revenue / report.target) * 100) : 0;
  const numCash = report.cashAmount ?? 0;
  const numEdc = report.edcAmount ?? 0;
  const numQris = report.qrisAmount ?? 0;
  const hasBreakdown = numCash > 0 || numEdc > 0 || numQris > 0;
  const numTx = report.transactionCount ?? 0;
  const avgTicket = numTx > 0 ? Math.round(report.revenue / numTx) : 0;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-report-detail-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fade-in"
      data-testid="daily-report-detail-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* Header Modal - Sticky */}
        <div className="shrink-0 px-6 py-4 border-b border-line bg-slate-50/70 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-pill bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {report.division} - {report.divisionName}
              </span>
              {report.status === 'APPROVED' && (
                <span className="inline-flex items-center gap-1 rounded-pill bg-success-light px-2.5 py-0.5 text-xs font-bold text-success border border-success/20">
                  <CheckCircle2 className="h-3 w-3" /> ACC Approved
                </span>
              )}
              {report.status === 'PENDING_REVIEW' && (
                <span className="inline-flex items-center gap-1 rounded-pill bg-warning-light px-2.5 py-0.5 text-xs font-bold text-warning border border-warning/20">
                  <Clock className="h-3 w-3" /> Pending ACC
                </span>
              )}
              {report.status === 'REJECTED' && (
                <span className="inline-flex items-center gap-1 rounded-pill bg-danger-light px-2.5 py-0.5 text-xs font-bold text-danger border border-danger/20">
                  <AlertCircle className="h-3 w-3" /> Perlu Revisi
                </span>
              )}
            </div>
            <h3 id="daily-report-detail-title" className="mt-1 text-base sm:text-lg font-black tracking-tight text-navy">
              Detail Laporan: {report.outletName ? `${report.outletName} (${report.division})` : report.divisionName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tanggal Laporan: <strong className="text-slate-700">{report.date}</strong> | Shift:{' '}
              <span className="font-semibold">{report.shift ?? 'Full Day (All Shifts)'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-card p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Tutup Detail"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* KPI Summary Banner */}
          <div className="grid gap-3 sm:grid-cols-3 rounded-card-lg bg-slate-50 p-4 border border-line">
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Realisasi Omset Kasir</p>
              <p className="mt-1 text-xl font-black font-mono text-navy">
                Rp {report.revenue.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Target Harian (RKAP)</p>
              <p className="mt-1 text-xl font-bold font-mono text-slate-600">
                Rp {report.target.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Capaian & Status</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={`text-lg font-black ${
                    achievementPct >= 100
                      ? 'text-success'
                      : achievementPct >= 80
                      ? 'text-info'
                      : 'text-warning'
                  }`}
                >
                  {achievementPct}%
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {achievementPct >= 100 ? '(Over Target)' : achievementPct >= 80 ? '(On Track)' : '(Perlu Perhatian)'}
                </span>
              </div>
            </div>
          </div>

          {/* Unit Kerja & Layanan */}
          <div className="rounded-card-lg border border-line p-4 space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Informasi Unit Outlet & Layanan
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 pt-1">
              <div>
                <span className="text-slate-500">Titik Outlet:</span>
                <p className="font-bold text-navy">
                  {report.outletCode ? `[${report.outletCode}] ` : ''}
                  {report.outletName ?? 'Konsolidasi Divisi'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Kategori Layanan:</span>
                <p className="font-semibold text-navy">
                  {report.categoryService ?? 'Operasional Umum Divisi'}
                </p>
              </div>
            </div>
          </div>

          {/* Rincian Metode Pembayaran Kasir */}
          {hasBreakdown && (
            <div className="rounded-card-lg border border-line p-4 space-y-2 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-primary" /> Rincian Metode Pembayaran Kasir
              </h4>
              <div className="grid gap-3 sm:grid-cols-3 pt-1">
                <div className="rounded-card bg-amber-50/60 border border-amber-200/60 p-2.5">
                  <div className="flex items-center gap-1 text-amber-800 font-bold">
                    <Wallet className="h-3 w-3" /> Uang Tunai (Cash)
                  </div>
                  <p className="mt-1 text-sm font-bold font-mono text-navy">
                    Rp {numCash.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="rounded-card bg-blue-50/60 border border-blue-200/60 p-2.5">
                  <div className="flex items-center gap-1 text-blue-800 font-bold">
                    <CreditCard className="h-3 w-3" /> EDC (BCA / Mandiri)
                  </div>
                  <p className="mt-1 text-sm font-bold font-mono text-navy">
                    Rp {numEdc.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="rounded-card bg-emerald-50/60 border border-emerald-200/60 p-2.5">
                  <div className="flex items-center gap-1 text-emerald-800 font-bold">
                    <QrCode className="h-3 w-3" /> QRIS & Transfer
                  </div>
                  <p className="mt-1 text-sm font-bold font-mono text-navy">
                    Rp {numQris.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Volume Transaksi & Lampiran Bukti */}
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-card-lg border border-line p-3.5 space-y-1">
              <span className="text-slate-500 flex items-center gap-1 font-bold">
                <Receipt className="h-3.5 w-3.5 text-slate-600" /> Volume Transaksi:
              </span>
              <p className="font-bold text-navy text-sm">
                {numTx > 0 ? `${numTx.toLocaleString('id-ID')} Transaksi (Struk)` : 'Tidak Tercatat'}
              </p>
              {avgTicket > 0 && (
                <p className="text-[11px] text-slate-500">
                  Rata-rata Pembelian: <strong>Rp {avgTicket.toLocaleString('id-ID')}</strong> / pax
                </p>
              )}
            </div>

            <div className="rounded-card-lg border border-line p-3.5 space-y-1">
              <span className="text-slate-500 flex items-center gap-1 font-bold">
                <Paperclip className="h-3.5 w-3.5 text-slate-600" /> Lampiran / Batch EDC:
              </span>
              <p className="font-bold text-navy text-sm font-mono truncate">
                {report.attachmentName ?? 'Belum Ada Lampiran File'}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">
                {report.attachmentName ? '✓ Bukti Kasir Siap Diaudit' : 'Verifikasi Manual'}
              </p>
            </div>
          </div>

          {/* Catatan Lapangan */}
          {report.notes && (
            <div className="rounded-card border border-line bg-slate-50/80 p-3 text-xs">
              <span className="font-bold text-slate-600">Catatan Lapangan & Operasional:</span>
              <p className="mt-1 text-slate-700 italic">&ldquo;{report.notes}&rdquo;</p>
            </div>
          )}

          {/* Audit Trail & Verifikasi */}
          <div className="rounded-card-lg border border-line bg-slate-50/50 p-4 space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5 text-primary" /> Jejak Audit Persetujuan (Audit Trail)
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 pt-1">
              <div>
                <span className="text-slate-400">Admin Pengaju:</span>
                <p className="font-bold text-navy">{report.updatedBy}</p>
                <p className="text-[10px] text-slate-400 font-mono">Waktu Submit: {report.submittedAt ?? '-'}</p>
              </div>
              <div>
                <span className="text-slate-400">Status Otorisasi:</span>
                {report.status === 'APPROVED' ? (
                  <div>
                    <p className="font-bold text-success">Disetujui oleh {report.approvedBy ?? 'Manager'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Timestamp: {report.approvedAt ?? 'Real-time'}</p>
                  </div>
                ) : report.status === 'REJECTED' ? (
                  <div>
                    <p className="font-bold text-danger">Ditolak Checker</p>
                    {report.rejectionReason && (
                      <p className="text-[11px] text-danger/90 font-medium italic mt-0.5">
                        Alasan: &ldquo;{report.rejectionReason}&rdquo;
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="font-semibold text-warning">Menunggu Otorisasi Manager</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Sticky Bottom */}
        <div className="shrink-0 px-6 py-4 border-t border-line bg-slate-50/90 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
