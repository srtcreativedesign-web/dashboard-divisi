import React, { useState } from 'react';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { ProjectPageLayout } from '../../../layout/ProjectPageLayout';
import { projectApi } from '../../../api/projects';

export default function ProjectPaymentsPage() {
  const { user } = useAuth();
  const canManage = !!user && hasCapability(user.role, 'manage:projects', user.divisionCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <ProjectPageLayout
      title="Progres Pembayaran"
      description="Penandaan administratif milestone; belum merupakan bukti tagihan, penerimaan uang, atau jurnal Accounting."
    >
      {(project, refreshProject) => (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Penandaan administratif termin</h3>
          <div className="space-y-6">
            {project.milestones && project.milestones.length > 0 ? (
              project.milestones.map((ms) => (
                <div key={ms.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{ms.title}</div>
                    <div className="text-sm text-slate-500">
                      Bobot milestone: <span className="font-medium text-slate-700 dark:text-slate-300">{ms.weight_percentage}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ms.payment_status ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                      {ms.payment_status ? 'Ditandai selesai secara administratif' : 'Belum ditandai selesai'}
                    </span>
                    <>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}{canManage && <button
                      aria-label={`Ubah penandaan administratif ${ms.title}`}
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true); setError('');
                        try {
                          await projectApi.togglePayment(project.id, ms.id, !ms.payment_status);
                          await refreshProject();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Gagal mengubah penandaan administratif');
                        } finally { setBusy(false); }
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${ms.payment_status ? 'bg-green-500' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ms.payment_status ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>}</>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 italic">Belum ada termin tagihan / milestone.</div>
            )}
          </div>
        </div>
      )}
    </ProjectPageLayout>
  );
}
