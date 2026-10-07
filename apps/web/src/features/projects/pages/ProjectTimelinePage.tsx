import React from 'react';
import { ProjectPageLayout } from '../../../layout/ProjectPageLayout';
import { Button } from '../../../components/ui/Button';
import { BarChart } from '../../../components/charts';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  Hourglass,
} from 'lucide-react';

export default function ProjectTimelinePage() {
  return (
    <ProjectPageLayout
      title="Time Plan & Linimasa Proyek"
      description="Visualisasi kurva jadwal waktu pengerjaan, pelacakan deviasi target milestone, dan estimasi waktu serah terima."
    >
      {(project) => {
        const milestones = project.milestones || [];
        const startDate = project.start_date ? new Date(project.start_date) : null;
        const endDate = project.end_date ? new Date(project.end_date) : null;
        const now = new Date();

        // Calculate Days Duration & Remaining
        let totalDurationDays = 0;
        let elapsedDays = 0;
        let remainingDays = 0;

        if (startDate && endDate) {
          totalDurationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
          elapsedDays = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
          remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));
        }

        const timeProgress = totalDurationDays > 0 ? Math.min(100, Math.round((elapsedDays / totalDurationDays) * 100)) : 0;

        return (
          <div className="space-y-6">
            {/* KPI STATS ROW */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-card border border-line bg-panel p-5 shadow-card">
                <p className="text-[11px] font-bold text-subtle uppercase tracking-wider">Tanggal Mulai SPK</p>
                <h3 className="mt-1.5 text-xl font-bold text-navy">
                  {startDate ? startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Kickoff pelaksanaan fisik</p>
              </div>

              <div className="rounded-card border border-line bg-panel p-5 shadow-card">
                <p className="text-[11px] font-bold text-subtle uppercase tracking-wider">Target Serah Terima</p>
                <h3 className="mt-1.5 text-xl font-bold text-navy">
                  {endDate ? endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Target serah terima (BAST)</p>
              </div>

              <div className="rounded-card border border-line bg-panel p-5 shadow-card">
                <p className="text-[11px] font-bold text-subtle uppercase tracking-wider">Durasi Kalender</p>
                <h3 className="mt-1.5 text-2xl font-bold text-primary-600 dark:text-primary-300">
                  {totalDurationDays > 0 ? `${totalDurationDays} Hari` : '-'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Berjalan {elapsedDays} hari ({timeProgress}% waktu)
                </p>
              </div>

              <div className="rounded-card border border-line bg-panel p-5 shadow-card flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-subtle uppercase tracking-wider">Sisa Waktu Pelaksanaan</p>
                  <h3 className={`mt-1.5 text-2xl font-bold ${remainingDays < 14 ? 'text-warning dark:text-amber-300' : 'text-success dark:text-emerald-300'}`}>
                    {totalDurationDays > 0 ? `${remainingDays} Hari` : '-'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {remainingDays === 0 ? 'Masa konstruksi berakhir' : 'Menuju target penyelesaian'}
                  </p>
                </div>
                <div className="h-11 w-11 rounded-input bg-surface border border-line flex items-center justify-center text-primary-600 dark:text-primary-300">
                  <Hourglass className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* OVERALL TIMELINE PROGRESS BAR */}
            <div className="rounded-card-lg border border-line bg-panel p-6 shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-navy">Distribusi Waktu Proyek (Waktu Kalender vs Target)</h3>
                  <p className="text-xs text-subtle">Persentase konsumsi waktu pelaksanaan proyek terhadap jadwal kontrak</p>
                </div>
                <span className="font-mono text-xs font-bold text-primary-600 dark:text-primary-300 bg-primary-50 px-2.5 py-1 rounded-input border border-primary-200">
                  {timeProgress}% WAKTU TERPAKAI
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="w-full h-3 bg-surface border border-line rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      timeProgress >= 100 ? 'bg-danger' : 'bg-primary-600'
                    }`}
                    style={{ width: `${timeProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>Mulai: {startDate ? startDate.toLocaleDateString('id-ID') : '-'}</span>
                  <span>Target Selesai: {endDate ? endDate.toLocaleDateString('id-ID') : '-'}</span>
                </div>
              </div>
            </div>

            {/* MILESTONE SCHEDULE TABLE */}
            <div className="overflow-hidden rounded-card border border-line bg-panel shadow-card">
              <div className="p-4 border-b border-line bg-surface">
                <h3 className="text-sm font-bold text-navy">Jadwal Tahapan Milestone</h3>
                <p className="text-xs text-subtle">Rencana target selesai vs realisasi aktual per tahapan</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface text-muted font-semibold border-b border-line">
                    <tr>
                      <th className="px-5 py-3.5 w-12 text-center">Tahap</th>
                      <th className="px-5 py-3.5">Uraian Milestone Pekerjaan</th>
                      <th className="px-5 py-3.5 text-center">Bobot</th>
                      <th className="px-5 py-3.5 text-center">Rencana Selesai</th>
                      <th className="px-5 py-3.5 text-center">Realisasi Selesai</th>
                      <th className="px-5 py-3.5 text-center">Status Jadwal</th>
                      <th className="px-5 py-3.5 text-right">Progres Fisik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {milestones.length > 0 ? (
                      milestones.map((ms, idx) => {
                        const actual = ms.actual_percentage || 0;
                        const dueDate = ms.due_date ? new Date(ms.due_date) : null;
                        const isOverdue = dueDate && dueDate < now && actual < 100;
                        const isDone = actual >= 100 || ms.status === 'completed';

                        return (
                          <tr key={ms.id} className="hover:bg-surface/80 transition-colors">
                            <td className="px-5 py-3.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                            <td className="px-5 py-3.5">
                              <p className="font-bold text-navy">{ms.title}</p>
                            </td>
                            <td className="px-5 py-3.5 text-center font-bold text-navy">
                              {ms.weight_percentage}%
                            </td>
                            <td className="px-5 py-3.5 text-center text-muted font-medium">
                              {dueDate ? dueDate.toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td className="px-5 py-3.5 text-center text-muted font-medium">
                              {ms.completion_date ? new Date(ms.completion_date).toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {isDone ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-success-light text-success dark:text-emerald-300 border border-success/30">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Tepat Waktu
                                </span>
                              ) : isOverdue ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-danger-light text-danger dark:text-red-300 border border-danger/30">
                                  <AlertTriangle className="h-3 w-3" />
                                  Terlambat
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-primary-50 text-primary-700 dark:text-primary-300 border border-primary-200">
                                  <Clock className="h-3 w-3" />
                                  Dalam Jadwal
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-navy">
                              {ms.actual_percentage || 0}%
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-subtle">
                          <Calendar className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-muted">Belum ada tahapan jadwal terdaftar</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Tambahkan milestone di menu Tahapan & Progres untuk memvisualisasikan linimasa.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* VISUAL STEPPER TIMELINE */}
            <div className="rounded-card-lg border border-line bg-panel shadow-card p-6">
              <h3 className="text-sm font-bold text-navy mb-4">Urutan Kronologis Tahapan Milestone</h3>
              <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
                {milestones.length > 0 ? (
                  milestones.map((ms, idx) => {
                    const actual = ms.actual_percentage || 0;
                    const isDone = actual >= 100 || ms.status === 'completed';
                    const isInProgress = !isDone && (actual > 0 || ms.status === 'in_progress');

                    return (
                      <div key={ms.id} className="relative flex items-start gap-4">
                        <div
                          className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isDone
                              ? 'bg-success border-success text-white'
                              : isInProgress
                              ? 'bg-primary-600 border-primary-600 text-white animate-pulse'
                              : 'bg-panel border-line text-slate-400'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-xs text-navy">{ms.title}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-input bg-surface border border-line text-muted">
                              Bobot: {ms.weight_percentage}%
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              Progres: {ms.actual_percentage || 0}%
                            </span>
                          </div>
                          <p className="text-xs text-subtle">
                            Target Jatuh Tempo:{' '}
                            <span className="font-medium text-muted">
                              {ms.due_date ? new Date(ms.due_date).toLocaleDateString('id-ID') : 'Belum diatur'}
                            </span>
                          </p>
                          {ms.notes && <p className="text-[11px] text-slate-400 italic">{ms.notes}</p>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ada linimasa tahapan.</p>
                )}
              </div>
            </div>
          </div>
        );
      }}
    </ProjectPageLayout>
  );
}
