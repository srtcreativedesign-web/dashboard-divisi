import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  User,
  Building2,
  ArrowRight,
  ShieldAlert,
  Check,
} from 'lucide-react';
import {
  ApprovalRequest,
  CATEGORY_METADATA,
  PRIORITY_METADATA,
  STATUS_METADATA,
} from './approvalTypes';

interface ApprovalReviewModalProps {
  request: ApprovalRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (requestId: string, note?: string) => void;
  onReject: (requestId: string, reason: string) => void;
  canReview?: boolean;
}

export function ApprovalReviewModal({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
  canReview = true,
}: ApprovalReviewModalProps) {
  const [decisionMode, setDecisionMode] = useState<'view' | 'approve' | 'reject'>('view');
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDecisionMode('view');
      setApprovalNote('');
      setRejectionReason('');
      setValidationError(null);
      setIsProcessing(false);
    }
  }, [isOpen, request]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !request) return null;

  const categoryInfo = CATEGORY_METADATA[request.category];
  const priorityInfo = PRIORITY_METADATA[request.priority];
  const statusInfo = STATUS_METADATA[request.status];

  const handleApproveSubmit = () => {
    setIsProcessing(true);
    onApprove(request.id, approvalNote.trim() || undefined);
    setIsProcessing(false);
    onClose();
  };

  const handleRejectSubmit = () => {
    const trimmed = rejectionReason.trim();
    if (trimmed.length < 5) {
      setValidationError('Alasan penolakan wajib diisi minimal 5 karakter.');
      return;
    }
    setValidationError(null);
    setIsProcessing(true);
    onReject(request.id, trimmed);
    setIsProcessing(false);
    onClose();
  };

  const isPending = request.status === 'pending_review';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-review-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500">
                  {request.referenceNo}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryInfo.badgeClass}`}
                >
                  {categoryInfo.label}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityInfo.badgeClass}`}
                >
                  Prioritas {priorityInfo.label}
                </span>
              </div>
              <h2
                id="approval-review-title"
                className="text-base font-bold text-navy mt-0.5 line-clamp-1"
              >
                {request.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Diajukan pada: <strong>{request.submittedAt}</strong></span>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}
            >
              {statusInfo.label}
            </span>
          </div>

          {/* Submitter & Division Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
              <User className="w-4 h-4 text-sky-600 mt-0.5" />
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Pengaju (Maker)</span>
                <p className="text-xs font-bold text-navy">{request.requesterName}</p>
                <p className="text-[11px] text-slate-500">{request.requesterRole}</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
              <Building2 className="w-4 h-4 text-sky-600 mt-0.5" />
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Divisi Operasional</span>
                <p className="text-xs font-bold text-navy">{request.divisionName} ({request.divisionCode})</p>
                <p className="text-[11px] text-slate-500">Nilai Paparan: Rp {request.amount.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Deskripsi Pengajuan
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100">
              {request.description}
            </p>
          </div>

          {/* Threshold Alert Warning Banner (If Breached) */}
          {request.thresholdBreached && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-800">
                  Peringatan Ambang Batas Risiko Finansial
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  {request.thresholdBreachDetails ||
                    'Transaksi ini melampaui aturan ambang batas toleransi sistem (Fase 7) dan memerlukan otorisasi Checker.'}
                </p>
              </div>
            </div>
          )}

          {/* Side-by-Side Diff View */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Perbandingan Data (Diff Comparison)</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Baseline Semula vs Nilai Pengajuan
              </span>
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Parameter / Akun</th>
                    <th className="py-2.5 px-3">Data Semula</th>
                    <th className="py-2.5 px-3">Data Pengajuan</th>
                    <th className="py-2.5 px-3">Selisih Deviasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {request.diffFields.map((diff, idx) => (
                    <tr
                      key={idx}
                      className={diff.isChanged ? 'bg-sky-50/40' : 'bg-white'}
                    >
                      <td className="py-2 px-3 font-medium text-slate-700">
                        {diff.label}
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-mono">
                        {diff.originalValue}
                      </td>
                      <td className="py-2 px-3 text-navy font-bold font-mono">
                        {diff.proposedValue}
                      </td>
                      <td className="py-2 px-3">
                        {diff.diffText ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded">
                            <ArrowRight className="w-3 h-3" />
                            {diff.diffText}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Sama</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Previous Review History (if already reviewed) */}
          {!isPending && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="text-xs font-bold text-slate-700">
                Riwayat Keputusan Checker
              </h4>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  Peninjau: <strong>{request.reviewerName}</strong> ({request.reviewerRole})
                </p>
                <p>Waktu Keputusan: {request.reviewedAt}</p>
                {request.approvalNote && (
                  <p className="text-emerald-700 font-medium">
                    Catatan Persetujuan: &ldquo;{request.approvalNote}&rdquo;
                  </p>
                )}
                {request.rejectionReason && (
                  <p className="text-rose-700 font-medium">
                    Alasan Penolakan: &ldquo;{request.rejectionReason}&rdquo;
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Decision Modes (Approve / Reject Form) */}
          {isPending && canReview && (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              {decisionMode === 'approve' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 animate-in fade-in">
                  <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Konfirmasi Persetujuan Transaksi
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Anda akan menyetujui transaksi ini sebagai Checker resmi. Data akan disinkronkan ke sistem dan pengaju akan mendapatkan pemberitahuan.
                  </p>
                  <div>
                    <label
                      htmlFor="approval-note-input"
                      className="block text-[11px] font-semibold text-emerald-900 mb-1"
                    >
                      Catatan Persetujuan (Opsional)
                    </label>
                    <input
                      id="approval-note-input"
                      type="text"
                      value={approvalNote}
                      onChange={(e) => setApprovalNote(e.target.value)}
                      placeholder="Contoh: Dokumen bukti lengkap dan valid."
                      className="w-full text-xs px-3 py-2 bg-white border border-emerald-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {decisionMode === 'reject' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2 animate-in fade-in">
                  <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Permohonan Perbaikan / Penolakan Transaksi
                  </h4>
                  <p className="text-xs text-rose-700">
                    Harap berikan alasan penolakan yang jelas agar staf/admin divisi dapat melakukan revisi perbaikan.
                  </p>
                  <div>
                    <label
                      htmlFor="rejection-reason-input"
                      className="block text-[11px] font-semibold text-rose-900 mb-1"
                    >
                      Alasan Penolakan <span className="text-rose-600">* (Wajib, min 5 karakter)</span>
                    </label>
                    <textarea
                      id="rejection-reason-input"
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => {
                        setRejectionReason(e.target.value);
                        if (e.target.value.trim().length >= 5) {
                          setValidationError(null);
                        }
                      }}
                      placeholder="Tuliskan alasan penolakan secara spesifik..."
                      className="w-full text-xs px-3 py-2 bg-white border border-rose-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      data-testid="rejection-reason-textarea"
                    />
                    {validationError && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1">
                        {validationError}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Tutup
          </button>

          {isPending && canReview ? (
            <div className="flex items-center gap-2">
              {decisionMode === 'view' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setDecisionMode('reject')}
                    className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
                    data-testid="btn-reject-mode"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak / Minta Revisi
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionMode('approve')}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    data-testid="btn-approve-mode"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Setujui Transaksi
                  </button>
                </>
              ) : decisionMode === 'approve' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setDecisionMode('view')}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleApproveSubmit}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    data-testid="btn-confirm-approve"
                  >
                    <Check className="w-4 h-4" />
                    Konfirmasi Setujui
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setDecisionMode('view')}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing || rejectionReason.trim().length < 5}
                    onClick={handleRejectSubmit}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    data-testid="btn-confirm-reject"
                  >
                    <XCircle className="w-4 h-4" />
                    Kirim Penolakan
                  </button>
                </>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              {canReview ? 'Pengajuan telah diputuskan' : 'Hanya-baca (Read-only)'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
