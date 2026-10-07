import React, { useState } from 'react';
import { ProjectPageLayout } from '../../../layout/ProjectPageLayout';
import { projectApi } from '../../../api/projects';
import { ProjectMilestone } from '../../../types/project';
import { Button } from '../../../components/ui/Button';
import { BeforeAfterGallery } from '../../../components/projects/BeforeAfterGallery';
import { DailyProgressChart } from '../../../components/projects/DailyProgressChart';
import { ProgressRing } from '../../../components/charts';
import {
  CheckCircle2,
  Clock,
  Plus,
  AlertCircle,
  Calendar,
  Layers,
  Edit3,
  Trash2,
  Camera,
  CheckSquare,
  TrendingUp,
  FileText,
} from 'lucide-react';

import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';

export default function ProjectProgressPage() {
  const { user } = useAuth();
  const canManage = Boolean(user && hasCapability(user.role, 'manage:projects', user.divisionCode));
  const [activeView, setActiveView] = useState<'table' | 'visuals'>('table');
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);

  // Form State for Add Milestone
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    weight_percentage: 0,
    due_date: '',
  });

  // Form State for Update Progress
  const [updateForm, setUpdateForm] = useState({
    actual_percentage: 0,
    status: 'pending',
    completion_date: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const getMilestoneStatusBadge = (status: string, actual: number) => {
    if (status === 'completed' || actual >= 100) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-success-light text-success border border-success/30">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Selesai 100%
        </span>
      );
    }
    if (status === 'in_progress' || actual > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-600 animate-pulse" />
          Sedang Berjalan
        </span>
      );
    }
    if (status === 'review') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-warning-light text-warning border border-warning/30">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          Dalam Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-surface text-slate-600 border border-line">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Belum Mulai
      </span>
    );
  };

  return (
    <ProjectPageLayout
      title="Progres Fisik & Jadwal Pelaksanaan"
      description="Pantau bobot milestone pekerjaan, input capaian fisik aktual di lapangan, dan kelola dokumentasi foto before-after."
    >
      {(project, refreshProject) => {
        const milestones = project.milestones || [];
        
        let cumulativeProgress = 0;
        let totalWeight = 0;
        let completedCount = 0;

        milestones.forEach((m) => {
          const weight = m.weight_percentage || 0;
          const actual = m.actual_percentage || 0;
          totalWeight += weight;
          cumulativeProgress += (actual / 100) * weight;
          if (m.status === 'completed' || actual >= 100) {
            completedCount++;
          }
        });


        cumulativeProgress = Math.min(100, Math.round(cumulativeProgress * 10) / 10);

        const milestoneChartData = milestones.map((m, idx) => ({
          label: `M${idx + 1}`,
          value: m.actual_percentage || 0,
          color: m.status === 'completed' || (m.actual_percentage || 0) >= 100 ? '#15803d' : '#0284c7',
        }));


        const handleAddMilestone = async (e: React.FormEvent) => {
          e.preventDefault();
          try {
            setSubmitting(true);
            await projectApi.addMilestone(project.id, {
              title: milestoneForm.title,
              weight_percentage: milestoneForm.weight_percentage,
              due_date: milestoneForm.due_date || null,
              actual_percentage: 0,
              status: 'pending',
            });
            await refreshProject();
            setShowAddMilestoneModal(false);
            setMilestoneForm({ title: '', weight_percentage: 0, due_date: '' });
          } catch (err: any) {
            alert(err.message || 'Gagal menambah milestone');
          } finally {
            setSubmitting(false);
          }
        };

        const handleOpenEdit = (m: ProjectMilestone) => {
          setEditingMilestone(m);
          setUpdateForm({
            actual_percentage: m.actual_percentage || 0,
            status: m.status || 'pending',
            completion_date: m.completion_date || '',
            notes: m.notes || '',
          });
        };

        const handleUpdateProgress = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!editingMilestone) return;
          try {
            setSubmitting(true);
            const isCompleted = updateForm.actual_percentage >= 100 || updateForm.status === 'completed';
            await projectApi.updateMilestone(project.id, editingMilestone.id, {
              actual_percentage: updateForm.actual_percentage,
              status: isCompleted ? 'completed' : updateForm.status,
              completion_date: updateForm.completion_date || (isCompleted ? new Date().toISOString().split('T')[0] : null),
              notes: updateForm.notes || null,
            });
            await refreshProject();
            setEditingMilestone(null);
          } catch (err: any) {
            alert(err.message || 'Gagal memperbarui progres');
          } finally {
            setSubmitting(false);
          }
        };

        const handleDeleteMilestone = async (milestoneId: number) => {
          if (!confirm('Apakah Anda yakin ingin menghapus tahapan milestone ini?')) return;
          try {
            await projectApi.deleteMilestone(project.id, milestoneId);
            await refreshProject();
          } catch (err: any) {
            alert(err.message || 'Gagal menghapus milestone');
          }
        };

        return (
          <div className="space-y-6">
            {/* KPI STATS ROW */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-card border border-line bg-white p-5 shadow-card flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Capaian Progres Fisik</p>
                  <h3 className="mt-1.5 text-2xl font-bold text-primary-600">{cumulativeProgress}%</h3>
                  <div className="mt-2 w-24 h-1.5 bg-line rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all duration-700"
                      style={{ width: `${cumulativeProgress}%` }}
                    />
                  </div>
                </div>
                <ProgressRing value={cumulativeProgress} size={48} />
              </div>

              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Bobot Milestone</p>
                <h3 className={`mt-1.5 text-2xl font-bold ${totalWeight === 100 ? 'text-success' : 'text-warning'}`}>
                  {totalWeight}%
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {totalWeight === 100 ? 'Akumulasi bobot pas 100%' : `Sisa alokasi bobot: ${100 - totalWeight}%`}
                </p>
              </div>

              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tahapan Selesai</p>
                <h3 className="mt-1.5 text-2xl font-bold text-success">{completedCount}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Dari total {milestones.length} tahapan</p>
              </div>

              <div className="rounded-card border border-line bg-white p-5 shadow-card flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Lapangan</p>
                  <h3 className="mt-1.5 text-base font-bold text-navy">
                    {cumulativeProgress >= 100 ? 'Serah Terima (BAST)' : 'Pelaksanaan Fisik'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Kondisi lapangan aktif</p>
                </div>
                <div className="h-11 w-11 rounded-input bg-surface border border-line flex items-center justify-center text-primary-600">
                  <CheckSquare className="h-5 w-5" />
                </div>
              </div>
            </div>

            <DailyProgressChart milestones={milestones} />

            {/* TAB SWITCHER & ACTION BAR */}
            <div className="rounded-card-lg border border-line bg-white p-4 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('table')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-input text-xs font-semibold transition-all ${
                    activeView === 'table'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-surface'
                  }`}
                >
                  <CheckSquare className="h-4 w-4" />
                  Tabel Pelacakan Tahapan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('visuals')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-input text-xs font-semibold transition-all ${
                    activeView === 'visuals'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-surface'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  Galeri Foto Before - After
                </button>
              </div>

              {canManage && activeView === 'table' && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowAddMilestoneModal(true)}
                  className="shrink-0 text-xs"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Milestone
                </Button>
              )}
            </div>

            {/* ACTIVE VIEW CONTENT */}
            {activeView === 'table' ? (
              /* MILESTONE DATA TABLE */
              <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface text-slate-600 font-semibold border-b border-line">
                      <tr>
                        <th className="px-5 py-3.5 w-12 text-center">No</th>
                        <th className="px-5 py-3.5">Nama Tahapan Pekerjaan</th>
                        <th className="px-5 py-3.5 text-center">Bobot</th>
                        <th className="px-5 py-3.5">Progres Aktual</th>
                        <th className="px-5 py-3.5 text-center">Target Selesai</th>
                        <th className="px-5 py-3.5 text-center">Status</th>
                        <th className="px-5 py-3.5">Catatan Lapangan & Isu</th>
                        <th className="px-5 py-3.5 text-right w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {milestones.length > 0 ? (
                        milestones.map((ms, idx) => {
                          const actual = ms.actual_percentage || 0;
                          return (
                            <tr key={ms.id} className="hover:bg-surface/80 transition-colors">
                              <td className="px-5 py-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-5 py-3.5">
                                <p className="font-bold text-navy">{ms.title}</p>
                              </td>
                              <td className="px-5 py-3.5 text-center font-bold text-navy">
                                {ms.weight_percentage}%
                              </td>
                              <td className="px-5 py-3.5 min-w-[160px]">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                                    <span>{actual}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-line rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        actual >= 100 ? 'bg-success' : 'bg-primary-600'
                                      }`}
                                      style={{ width: `${actual}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-center text-slate-600 font-medium">
                                {ms.due_date ? new Date(ms.due_date).toLocaleDateString('id-ID') : '-'}
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                {getMilestoneStatusBadge(ms.status, actual)}
                              </td>
                              <td className="px-5 py-3.5 text-slate-500 max-w-xs">
                                <p className="line-clamp-2">{ms.notes || '-'}</p>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                {canManage ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleOpenEdit(ms)}
                                      className="text-[11px]"
                                    >
                                      <Edit3 className="h-3 w-3 mr-1" />
                                      Update
                                    </Button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMilestone(ms.id)}
                                      className="p-1 rounded-input text-slate-400 hover:text-danger hover:bg-danger-light/50 transition-colors"
                                      title="Hapus Tahapan"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                            <CheckSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-slate-700">Belum ada tahapan milestone terdaftar</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Tambahkan tahapan milestone pekerjaan beserta persentase bobotnya.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* BEFORE-AFTER GALLERY EMBEDDED */
              <div className="rounded-card-lg border border-line bg-white shadow-card p-6">
                <BeforeAfterGallery projectId={project.id} milestones={project.milestones} />
              </div>
            )}

            {/* MODAL TAMBAH MILESTONE */}
            {canManage && showAddMilestoneModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-fade-in">
                <div className="bg-white rounded-card-lg shadow-xl border border-line w-full max-w-md overflow-hidden">
                  <div className="p-5 border-b border-line flex justify-between items-center bg-surface">
                    <div>
                      <h3 className="text-base font-bold text-navy">Tambah Tahapan Milestone</h3>
                      <p className="text-xs text-slate-500">Alokasikan bobot pekerjaan dari total 100%</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddMilestoneModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-lg p-1"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleAddMilestone} className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Nama Tahapan Pekerjaan <span className="text-danger">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Contoh: Pekerjaan Pondasi & Struktur Bawah"
                        value={milestoneForm.title}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                        className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Bobot Pekerjaan (%) <span className="text-danger">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          min="0.1"
                          max="100"
                          step="0.1"
                          value={milestoneForm.weight_percentage || ''}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, weight_percentage: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Target Selesai
                        </label>
                        <input
                          type="date"
                          value={milestoneForm.due_date}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                          className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-line flex justify-end gap-2.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={() => setShowAddMilestoneModal(false)}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={submitting}
                      >
                        {submitting ? 'Menyimpan...' : 'Simpan Tahapan'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL UPDATE PROGRES LAPANGAN */}
            {canManage && editingMilestone && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-fade-in">
                <div className="bg-white rounded-card-lg shadow-xl border border-line w-full max-w-md overflow-hidden">
                  <div className="p-5 border-b border-line flex justify-between items-center bg-surface">
                    <div>
                      <h3 className="text-base font-bold text-navy">Update Progres Lapangan</h3>
                      <p className="text-xs text-slate-500">{editingMilestone.title} ({editingMilestone.weight_percentage}% Bobot)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingMilestone(null)}
                      className="text-slate-400 hover:text-slate-600 text-lg p-1"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleUpdateProgress} className="p-6 space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Realisasi Progres Fisik (%)
                        </label>
                        <span className="font-bold text-primary-600 text-sm">{updateForm.actual_percentage}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={updateForm.actual_percentage}
                        onChange={(e) => setUpdateForm({ ...updateForm, actual_percentage: parseInt(e.target.value) || 0 })}
                        className="w-full accent-primary-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                        <span>0% (Belum Mulai)</span>
                        <span>50% (Sedang Berjalan)</span>
                        <span>100% (Selesai Penuh)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Status Tahapan
                        </label>
                        <select
                          value={updateForm.status}
                          onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                          className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review Mandor/BOD</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Tanggal Selesai Riil
                        </label>
                        <input
                          type="date"
                          value={updateForm.completion_date}
                          onChange={(e) => setUpdateForm({ ...updateForm, completion_date: e.target.value })}
                          className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Catatan Progres / Kendala Lapangan
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Catat kondisi cuaca, kendala material, kehadiran tukang..."
                        value={updateForm.notes}
                        onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                        className="w-full rounded-input border border-line p-3 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    <div className="pt-4 border-t border-line flex justify-end gap-2.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={() => setEditingMilestone(null)}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={submitting}
                      >
                        {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </ProjectPageLayout>
  );
}
