import React from 'react';
import { ProjectPageLayout } from '../../layout/ProjectPageLayout';

export default function ProjectTimelinePage() {
  return (
    <ProjectPageLayout
      title="Time Plan Proyek"
      description="Visualisasi kalender dan linimasa waktu pengerjaan."
    >
      {(project) => (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Time Plan & Linimasa</h3>
          </div>
          {project.start_date && project.end_date ? (
            <div className="space-y-6">
              <div className="flex justify-between text-sm font-medium text-slate-500">
                <span>Mulai: {new Date(project.start_date).toLocaleDateString()}</span>
                <span>Selesai: {new Date(project.end_date).toLocaleDateString()}</span>
              </div>
              
              <div className="relative w-full h-8 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-primary-500/20 w-full" />
                <div 
                  className="absolute top-0 left-0 h-full bg-primary-500 rounded-full transition-all" 
                  style={{ 
                    width: project.status === 'completed' ? '100%' : 
                           project.status === 'planning' ? '10%' : '50%' 
                  }} 
                />
              </div>
              
              <div className="mt-8">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Milestone Timeline</h4>
                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6">
                  {project.milestones && project.milestones.length > 0 ? (
                    project.milestones.map((ms, i) => (
                      <div key={ms.id} className="relative pl-6">
                        <div className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 ${ms.payment_status ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900 dark:text-white">{ms.title}</p>
                          <span className="text-xs text-slate-500">Termin {i + 1} ({ms.weight_percentage}%)</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">Status Pembayaran: {ms.payment_status ? 'Lunas' : 'Tertunda'}</p>
                      </div>
                    ))
                  ) : (
                    <p className="pl-6 text-sm text-slate-500">Belum ada termin.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-sm text-slate-500">
              Data tanggal mulai dan selesai proyek belum diatur.
            </div>
          )}
        </div>
      )}
    </ProjectPageLayout>
  );
}
