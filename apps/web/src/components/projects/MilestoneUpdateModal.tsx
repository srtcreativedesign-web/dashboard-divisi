import React, { useState } from 'react';
import { ProjectMilestone } from '../../types/project';
import { X, Calendar, Percent, CheckCircle, AlertCircle, FileText } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Pembaruan Progres Milestone
            </h3>
            <p className="text-xs text-slate-500">Sesuaikan persentase realisasi, jadwal, dan catatan kendala lapangan</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Nama Tahapan / Milestone
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
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
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 pr-8"
                />
                <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
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
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 pr-8 font-semibold text-primary-600 dark:text-primary-400"
                />
                <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Status Pengerjaan
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="pending">Menunggu (Pending)</option>
              <option value="in_progress">Sedang Berjalan (In Progress)</option>
              <option value="review">Peninjauan / Inspeksi (Review)</option>
              <option value="completed">Selesai 100% (Completed)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Target Selesai (Due Date)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Realisasi Selesai (Aktual)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Catatan Kendala & Lapangan
            </label>
            <textarea
              rows={3}
              placeholder="Catatan inspeksi fisik, kendala cuaca, ketersediaan material, atau approval klien..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
