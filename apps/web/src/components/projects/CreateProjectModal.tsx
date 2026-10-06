import React, { useState } from 'react';
import { X, Building2, Calendar, DollarSign, MapPin, FileText } from 'lucide-react';
import { projectApi } from '../../api/projects';
import { Project } from '../../types/project';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [form, setForm] = useState({
    name: '',
    project_code: '',
    client_name: '',
    location: '',
    contract_value: '',
    status: 'planning',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      const res = await projectApi.createProject({
        name: form.name,
        project_code: form.project_code || undefined,
        client_name: form.client_name || undefined,
        location: form.location || undefined,
        contract_value: Number(form.contract_value) || 0,
        status: form.status as any,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        description: form.description || undefined,
      });
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat proyek baru');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tambah Proyek Baru</h3>
              <p className="text-xs text-slate-500">Inisialisasi kontrak proyek konstruksi atau jasa divisi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Proyek *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Misal: Pembangunan Gedung Lab Komputer"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kode Proyek
              </label>
              <input
                type="text"
                value={form.project_code}
                onChange={e => setForm({ ...form, project_code: e.target.value })}
                placeholder="PRJ-2026-005"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Klien / Pemberi Tugas *
              </label>
              <input
                type="text"
                required
                value={form.client_name}
                onChange={e => setForm({ ...form, client_name: e.target.value })}
                placeholder="PT Maju Bersama / Dinas PUPR"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lokasi Pelaksanaan
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="Jakarta Barat / Surabaya"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nilai Kontrak (Rp) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={form.contract_value}
                onChange={e => setForm({ ...form, contract_value: e.target.value })}
                placeholder="500000000"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Awal
              </label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="planning">Planning (Perencanaan)</option>
                <option value="in_progress">In Progress (Berjalan)</option>
                <option value="on_hold">On Hold (Ditunda)</option>
                <option value="completed">Completed (Selesai)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tenggat Selesai
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deskripsi & Lingkup Pekerjaan
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Rincian lingkup pekerjaan, spesifikasi, dan target proyek..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {submitting ? 'Menyimpan...' : 'Buat Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
