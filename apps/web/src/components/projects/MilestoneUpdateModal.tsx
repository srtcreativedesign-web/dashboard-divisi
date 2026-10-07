import React, { useState } from 'react';
import { ProjectMilestone } from '../../types/project';
import { X, Percent, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface MilestoneUpdateModalProps {
  milestone: ProjectMilestone;
  isOpen: boolean;
  onClose: () => void;
  onSave: (milestoneId: number, data: Partial<ProjectMilestone>) => Promise<void>;
}

export const MilestoneUpdateModal: React.FC<MilestoneUpdateModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(milestone.title);
  const [weightPercentage, setWeightPercentage] = useState(milestone.weight_percentage);
  const [actualPercentage, setActualPercentage] = useState(milestone.actual_percentage ?? 0);
  const [status, setStatus] = useState(milestone.status || 'pending');
  const [dueDate, setDueDate] = useState(milestone.due_date ? milestone.due_date.substring(0, 10) : '');
  const [completionDate, setCompletionDate] = useState(milestone.completion_date ? milestone.completion_date.substring(0, 10) : '');
  const [notes, setNotes] = useState(milestone.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onSave(milestone.id, {
        title,
        weight_percentage: Number(weightPercentage),
        actual_percentage: Number(actualPercentage),
        status,
        due_date: dueDate || undefined,
        completion_date: completionDate || undefined,
        notes: notes || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui milestone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg rounded-card-lg bg-panel dark:bg-navy-light p-6 shadow-card-hover border border-line dark:border-line/20">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line dark:border-line/20">
          <div>
            <h3 className="text-base font-bold text-navy dark:text-white">
              Pembaruan Progres Milestone
            </h3>
            <p className="text-xs text-subtle">Sesuaikan persentase realisasi, jadwal, dan catatan kendala lapangan</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-input p-1.5 text-slate-400 hover:bg-surface hover:text-navy dark:hover:bg-navy/40 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-card bg-danger-light p-3 text-xs text-danger dark:text-red-300 border border-danger/30 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-navy dark:text-slate-200 uppercase tracking-wider mb-1">
              Nama Tahapan / Milestone
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-input border border-line dark:border-line/20 bg-panel dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy dark:text-slate-200 uppercase tracking-wider mb-1">
                Bobot Rencana (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={weightPercentage}
                  onChange={(e) => setWeightPercentage(Number(e.target.value))}
                  className="w-full rounded-input border border-line dark:border-line/20 bg-panel dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pr-8 transition-all"
                />
                <Percent className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy dark:text-slate-200 uppercase tracking-wider mb-1">
                Realisasi Fisik (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={actualPercentage}
                  onChange={(e) => setActualPercentage(Number(e.target.value))}
                  className="w-full rounded-input border border-line dark:border-line/20 bg-panel dark:bg-navy/40 px-3 py-2 text-xs font-bold text-primary dark:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pr-8 transition-all"
                />
                <Percent className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-primary dark:text-primary-300" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy dark:text-slate-200 uppercase tracking-wider mb-1">
              Status Pengerjaan
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-input border border-line dark:border-line/20 bg-panel dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              <option value="pending">Menunggu (Pending)</option>
              <option value="in_progress">Sedang Berjalan (In Progress)</option>
              <option value="review">Peninjauan / Inspeksi (Review)</option>
              <option value="completed">Selesai 100% (Completed)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy dark:text-slate-200 uppercase tracking-wider mb-1">
                Target Selesai (Due Date)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-input border border-line dark:border-line/20 bg-panel dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy dark:text-slate-200 uppercase tracking-wider mb-1">
                Realisasi Selesai (Aktual)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full rounded-input border border-line dark:border-line/20 bg-panel dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy dark:text-slate-200 uppercase tracking-wider mb-1">
              Catatan Kendala & Lapangan
            </label>
            <textarea
              rows={3}
              placeholder="Catatan inspeksi fisik, kendala cuaca, ketersediaan material, atau approval klien..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-input border border-line dark:border-line/20 bg-panel dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-line dark:border-line/20">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
