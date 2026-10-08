import React, { useState } from 'react';
import { X, Building2, MapPin } from 'lucide-react';
import { projectApi } from '../../api/projects';
import { Project } from '../../types/project';
import { Button } from '../ui/Button';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
  initialClassification?: 'new' | 'maintenance';
}

export function CreateProjectModal({ isOpen, onClose, onSuccess, initialClassification = 'new' }: CreateProjectModalProps) {
  const [form, setForm] = useState({
    name: '',
    project_code: '',
    client_name: '',
    location: '',
    contract_value: '',
    classification: initialClassification,
    status: 'planning',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setForm(prev => ({
        ...prev,
        classification: initialClassification,
      }));
    }
  }, [isOpen, initialClassification]);

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
        classification: form.classification,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-card-lg bg-white dark:bg-navy-light shadow-card-hover border border-line dark:border-line/20 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line dark:border-line/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-card bg-surface-2 text-primary border border-primary/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy dark:text-white">Tambah Proyek Baru</h3>
              <p className="text-xs text-slate-500">Inisialisasi kontrak proyek konstruksi atau jasa divisi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-input text-slate-400 hover:text-navy hover:bg-surface dark:hover:text-white dark:hover:bg-navy/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-card bg-danger-light text-danger text-xs border border-danger/30 font-medium">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                Nama Proyek *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Misal: Pembangunan Gedung Lab Komputer"
                className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                Kode Proyek
              </label>
              <input
                type="text"
                value={form.project_code}
                onChange={e => setForm({ ...form, project_code: e.target.value })}
                placeholder="PRJ-2026-005"
                className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary uppercase transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                Klien / Pemberi Tugas *
              </label>
              <input
                type="text"
                required
                value={form.client_name}
                onChange={e => setForm({ ...form, client_name: e.target.value })}
                placeholder="PT Maju Bersama / Dinas PUPR"
                className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                Lokasi Pelaksanaan
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="Jakarta Barat / Surabaya"
                  className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 pl-9 pr-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                Nilai Kontrak (Rp) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={form.contract_value}
                onChange={e => setForm({ ...form, contract_value: e.target.value })}
                placeholder="500000000"
                className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                Klasifikasi Proyek *
              </label>
              <select
                value={form.classification}
                onChange={e => setForm({ ...form, classification: e.target.value as 'new' | 'maintenance' })}
                className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
              >
                <option value="new">Proyek Baru</option>
                <option value="maintenance">Proyek Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                Status Awal
              </label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
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
              <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
                className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
                Tenggat Selesai
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
                className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy dark:text-slate-200 mb-1">
              Deskripsi & Lingkup Pekerjaan
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Rincian lingkup pekerjaan, spesifikasi, dan target proyek..."
              className="w-full rounded-input border border-line dark:border-line/20 bg-white dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-line dark:border-line/20">
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
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : 'Buat Proyek'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
