import React, { useState } from 'react';
import { ProjectPageLayout } from '../../../layout/ProjectPageLayout';
import { CheckCircle2, Clock } from 'lucide-react';
import { projectApi } from '../../../api/projects';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';

export default function ProjectProgressPage() {
  const { user } = useAuth();
  const canManage = Boolean(user && hasCapability(user.role, 'manage:projects', user.divisionCode));
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', weight_percentage: 0, due_date: '' });
  const [submittingMilestone, setSubmittingMilestone] = useState(false);

  return (
    <ProjectPageLayout
      title="Progres Proyek"
      description="Pantau progres fisik dan milestone pekerjaan."
    >
      {(project, refreshProject) => {
        const handleAddMilestone = async (e: React.FormEvent) => {
          e.preventDefault();
          try {
            setSubmittingMilestone(true);
            await projectApi.addMilestone(project.id, milestoneForm);
            await refreshProject();
            setShowMilestoneModal(false);
            setMilestoneForm({ title: '', weight_percentage: 0, due_date: '' });
          } catch {
      alert('Gagal menambah termin/milestone');
          } finally {
            setSubmittingMilestone(false);
          }
        };

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Informasi Proyek</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Nilai Kontrak</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">Rp {parseFloat(project.contract_value.toString()).toLocaleString('id-ID')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Tanggal Mulai</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{project.start_date ? new Date(project.start_date).toLocaleDateString('id-ID') : '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Tenggat Waktu</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{project.end_date ? new Date(project.end_date).toLocaleDateString('id-ID') : '-'}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Milestone Progress</h3>
                {canManage && <button
                  onClick={() => setShowMilestoneModal(true)}
                  className="text-sm font-semibold text-primary-600 hover:text-primary-500"
                >
                  + Tambah Milestone
                </button>}
              </div>
              {project.milestones && project.milestones.length > 0 ? (
                <div className="space-y-4">
                  {project.milestones.map((ms) => (
                    <div key={ms.id} className="flex items-center gap-3">
                      {ms.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{ms.title}</div>
                        <div className="text-xs text-slate-500">{ms.weight_percentage}% Bobot Pekerjaan</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic">Belum ada milestone tercatat.</div>
              )}
            </div>

            {/* Milestone Modal */}
            {canManage && showMilestoneModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tambah Milestone</h3>
                    <button onClick={() => setShowMilestoneModal(false)} className="text-slate-400 hover:text-slate-500">&times;</button>
                  </div>
                  <form onSubmit={handleAddMilestone} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama milestone</label>
                      <input required type="text" value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500" placeholder="Misal: Pemasangan tahap pertama" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bobot pekerjaan (%)</label>
                      <input required type="number" min="0" max="100" value={milestoneForm.weight_percentage} onChange={(e) => setMilestoneForm({ ...milestoneForm, weight_percentage: parseFloat(e.target.value) })} className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tanggal Jatuh Tempo (Opsional)</label>
                      <input type="date" value={milestoneForm.due_date} onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })} className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                      <button type="button" onClick={() => setShowMilestoneModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                        Batal
                      </button>
                      <button type="submit" disabled={submittingMilestone} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                        {submittingMilestone ? 'Menyimpan...' : 'Simpan'}
                      </button>
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
