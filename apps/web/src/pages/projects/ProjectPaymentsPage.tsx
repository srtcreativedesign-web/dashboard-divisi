import React from 'react';
import { ProjectPageLayout } from '../../layout/ProjectPageLayout';
import { projectApi } from '../../api/projects';

export default function ProjectPaymentsPage() {
  return (
    <ProjectPageLayout
      title="Progres Pembayaran"
      description="Pantau status pelunasan setiap termin proyek."
    >
      {(project, refreshProject) => (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Status Pembayaran Termin</h3>
          <div className="space-y-6">
            {project.milestones && project.milestones.length > 0 ? (
              project.milestones.map((ms) => (
                <div key={ms.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{ms.title}</div>
                    <div className="text-sm text-slate-500">
                      Bobot Tagihan: <span className="font-medium text-slate-700 dark:text-slate-300">{ms.weight_percentage}%</span> dari kontrak
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ms.payment_status ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                      {ms.payment_status ? 'LUNAS' : 'BELUM LUNAS'}
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await projectApi.togglePayment(project.id, ms.id, !ms.payment_status);
                          await refreshProject();
                        } catch (e) {
                          alert('Gagal update status pembayaran');
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${ms.payment_status ? 'bg-green-500' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ms.payment_status ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
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
