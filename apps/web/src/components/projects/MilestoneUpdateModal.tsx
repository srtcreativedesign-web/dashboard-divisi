import React, { useState, useEffect } from 'react';
import { Project, ProjectMilestone } from '../../types/project';
import { projectApi } from '../../api/projects';
import { X, CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface MilestoneUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  milestone: ProjectMilestone;
  onSuccess: (updatedMilestone: ProjectMilestone) => void;
}

export function MilestoneUpdateModal({
  isOpen,
  onClose,
  project,
  milestone,
  onSuccess,
}: MilestoneUpdateModalProps) {
  const [status, setStatus] = useState<string>(milestone.status || 'pending');
  const [notes, setNotes] = useState<string>(milestone.notes || '');
  const [completionDate, setCompletionDate] = useState<string>(
    milestone.completion_date || ''
  );
  const [actualPercentage, setActualPercentage] = useState<number>(
    milestone.actual_percentage ?? (milestone.status === 'completed' ? 100 : 0)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus(milestone.status || 'pending');
      setNotes(milestone.notes || '');
      setCompletionDate(milestone.completion_date || '');
      setActualPercentage(
        milestone.actual_percentage ?? (milestone.status === 'completed' ? 100 : 0)
      );
      setError(null);
    }
  }, [isOpen, milestone]);

  if (!isOpen) return null;

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (newStatus === 'completed') {
      if (!completionDate) {
        setCompletionDate(new Date().toISOString().split('T')[0] || '');
      }
      if (actualPercentage < 100) {
        setActualPercentage(100);
      }
    } else if (newStatus === 'pending') {
      setCompletionDate('');
      if (actualPercentage > 0) {
        setActualPercentage(0);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const updated = await projectApi.updateMilestone(project.id, milestone.id, {
        status,
        notes: notes.trim(),
        completion_date: status === 'completed' ? (completionDate || new Date().toISOString().split('T')[0]) : undefined,
        actual_percentage: actualPercentage,
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui status tahapan milestone.');
    } finally {
      setSubmitting(false);
    }
  };

  const getQuickNotes = () => {
    const title = milestone.title.toUpperCase();
    if (title.includes('SURVEI')) {
      return ['Survei lokasi', 'Menunggu izin akses', 'Survei teknis selesai'];
    }
    if (title.includes('IZIN')) {
      return ['Disetujui', 'Proses pengajuan K3', 'Menunggu permit'];
    }
    if (title.includes('RAB')) {
      return ['Penyusunan RAB', 'Disetujui Klien', 'Revisi Harga'];
    }
    if (title.includes('PAYMENT')) {
      return ['Dibayar DP / Termin 1', 'Menunggu invoice', 'Lunas'];
    }
    if (title.includes('EXECUTION')) {
      return ['Pelaksanaan fisik', 'Progres 50%', 'Selesai & BAST'];
    }
    return ['Selesai sesuai target', 'Dalam proses pengerjaan', 'Tertunda'];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-card-lg bg-white border border-line shadow-card-hover overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-surface">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-slate-500 bg-white border border-line px-1.5 py-0.5 rounded">
                {project.project_code || `PRJ-${project.id}`}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                Pembaruan Tahapan
              </span>
            </div>
            <h3 className="text-base font-bold text-navy mt-1">
              {milestone.title}
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-sm mt-0.5">
              {project.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-input p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-card bg-danger-light p-3.5 border border-danger/30 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
              <p className="text-xs text-danger font-medium">{error}</p>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
              Status Tahapan
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleStatusChange('pending')}
                className={`flex flex-col items-center justify-center p-3 rounded-card border text-center transition-all ${
                  status === 'pending'
                    ? 'border-slate-400 bg-slate-100 text-slate-900 shadow-xs'
                    : 'border-line bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className="h-5 w-5 text-slate-500 mb-1" />
                <span className="text-xs font-bold">Belum Dimulai</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Pending</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('in_progress')}
                className={`flex flex-col items-center justify-center p-3 rounded-card border text-center transition-all ${
                  status === 'in_progress'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-xs ring-1 ring-blue-400'
                    : 'border-line bg-white text-slate-600 hover:bg-blue-50/50'
                }`}
              >
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin mb-1" />
                <span className="text-xs font-bold">Sedang Berjalan</span>
                <span className="text-[10px] text-blue-600 mt-0.5">In Progress</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('completed')}
                className={`flex flex-col items-center justify-center p-3 rounded-card border text-center transition-all ${
                  status === 'completed'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-400'
                    : 'border-line bg-white text-slate-600 hover:bg-emerald-50/50'
                }`}
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mb-1" />
                <span className="text-xs font-bold">Selesai</span>
                <span className="text-[10px] text-emerald-600 mt-0.5">Completed</span>
              </button>
            </div>
          </div>

          {/* Subtext / Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider">
                Keterangan / Teks Tahapan
              </label>
              <span className="text-[11px] text-slate-400">
                Tampil langsung di kotak tahapan
              </span>
            </div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Survei lokasi, Disetujui, Total RAB..."
              className="w-full rounded-input border border-line bg-surface px-3 py-2 text-xs text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {getQuickNotes().map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setNotes(quick)}
                  className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[10px] font-medium text-slate-600 border border-slate-200 transition-colors"
                >
                  + {quick}
                </button>
              ))}
            </div>
          </div>

          {/* Date and Percentage Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full rounded-input border border-line bg-surface px-3 py-2 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                Progres Tahap (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={actualPercentage}
                onChange={(e) => setActualPercentage(Number(e.target.value))}
                className="w-full rounded-input border border-line bg-surface px-3 py-2 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
