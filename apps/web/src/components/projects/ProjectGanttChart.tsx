import React from 'react';
import { Project, ProjectMilestone } from '../../types/project';

const MS_DAY = 86400000;

function parseDate(value?: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00`) : null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayDiff(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_DAY);
}

interface GanttTask {
  id: number;
  title: string;
  weight: number;
  progress: number;
  status: string;
  start: Date;
  end: Date;
}

function milestoneProgress(ms: ProjectMilestone): number {
  return ms.actual_percentage ?? (ms.status === 'completed' ? 100 : 0);
}

function resolveTasks(project: Project): GanttTask[] {
  const projectStart = parseDate(project.start_date);
  const projectEnd = parseDate(project.end_date);
  const tasks: GanttTask[] = [];

  (project.milestones || []).forEach((ms) => {
    const start = parseDate(ms.start_date) ?? projectStart ?? parseDate(ms.due_date);
    const end = parseDate(ms.due_date) ?? projectEnd ?? start;
    if (!start || !end) return;
    tasks.push({
      id: ms.id,
      title: ms.title,
      weight: ms.weight_percentage ?? 0,
      progress: milestoneProgress(ms),
      status: ms.status || 'pending',
      start,
      end,
    });
  });

  return tasks;
}

interface BarMeta {
  color: string;
  label: string;
}

function barMeta(task: GanttTask, week: number): BarMeta {
  if (task.status === 'completed' || task.progress >= 100) {
    return { color: 'bg-success', label: 'Selesai' };
  }
  if (dayDiff(task.end, startOfDay(new Date())) > 0) {
    return { color: 'bg-danger', label: 'Terlambat' };
  }
  if (dayDiff(task.end, startOfDay(new Date())) > -week) {
    return { color: 'bg-warning', label: 'Mendekati deadline' };
  }
  if (task.status === 'in_progress' || task.progress > 0) {
    return { color: 'bg-primary-600', label: 'Berjalan' };
  }
  return { color: 'bg-slate-400', label: 'Belum mulai' };
}

interface ProjectGanttChartProps {
  project: Project;
}

export function ProjectGanttChart({ project }: ProjectGanttChartProps) {
  const today = startOfDay(new Date());
  const tasks = resolveTasks(project);

  if (tasks.length === 0) {
    return (
      <div className="rounded-card-lg border border-line bg-panel shadow-card p-8 text-center text-sm text-subtle">
        Belum ada tahapan berjadwal untuk ditampilkan. Tambahkan milestone dengan tanggal mulai/selesai untuk
        memvisualisasikan linimasa.
      </div>
    );
  }

  let min = tasks[0]!.start;
  let max = tasks[0]!.end;
  tasks.forEach((task) => {
    if (task.start < min) min = task.start;
    if (task.end > max) max = task.end;
  });
  min = new Date(min.getTime() - 2 * MS_DAY);
  max = new Date(max.getTime() + 3 * MS_DAY);

  const totalDays = Math.max(1, dayDiff(min, max));
  const pctOf = (d: Date) => Math.max(0, Math.min(100, (dayDiff(min, d) / totalDays) * 100));
  const todayPct = pctOf(today);

  const days: Date[] = [];
  for (let i = 0; i <= totalDays; i += 1) {
    days.push(new Date(min.getTime() + i * MS_DAY));
  }
  const dayLabels = days.filter(
    (d, i) => i === 0 || i === days.length - 1 || d.getDate() === 1 || d.getDate() % 5 === 0
  );

  const dayGrid = (show: boolean) =>
    `repeating-linear-gradient(to right, transparent 0, transparent calc(100% / ${days.length} - 1px), ${
      show ? 'var(--color-line)' : 'transparent'
    } calc(100% / ${days.length})`;

  return (
    <div className="rounded-card-lg border border-line bg-panel shadow-card overflow-hidden">
      <div className="p-5 pb-3 border-b border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-navy">Linimasa Gantt Tahapan</h3>
            <p className="text-xs text-subtle mt-0.5">
              Rentang {tasks.length} tahapan — bar menjangkau dari tanggal mulai sampai target selesai
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted font-medium">
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-sm bg-success inline-block" /> Selesai
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-sm bg-primary-600 inline-block" /> Berjalan
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-sm bg-warning inline-block" /> Deadline ≤ 7 hari
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-sm bg-danger inline-block" /> Terlambat
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-0.5 bg-navy" /> Deadline
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[960px]">
          {/* Header */}
          <div className="grid grid-cols-[minmax(260px,320px)_1fr] border-b border-line bg-surface/60 text-[11px] font-bold text-muted">
            <div className="px-4 py-3">Tahapan Pekerjaan</div>
            <div
              className="relative px-3 py-3 h-10"
              style={{
                background: dayGrid(true),
              }}
            >
              <div className="flex justify-between text-[10px] gap-2 overflow-hidden whitespace-nowrap">
                {dayLabels.map((d) => (
                  <span key={d.toISOString()}>{`${d.getDate()} ${d.toLocaleDateString('id-ID', { month: 'short' })}`}</span>
                ))}
              </div>
            </div>
          </div>

          {tasks.map((task) => {
            const meta = barMeta(task, 7);
            const left = pctOf(task.start);
            const width = Math.min(100 - left, Math.max(1.5, (dayDiff(task.start, task.end) + 1) / totalDays * 100));
            const deadline = pctOf(task.end);
            const showLabel = width >= 7;
            const done = task.progress >= 100;

            return (
              <div key={task.id} className="grid grid-cols-[minmax(260px,320px)_1fr] items-stretch border-b border-line last:border-b-0">
                <div className="px-4 py-3.5 min-w-0">
                  <p className="text-xs font-bold text-navy truncate" title={task.title}>{task.title}</p>
                  <p className="text-[11px] text-subtle mt-0.5 truncate">
                    {task.start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} —{' '}
                    {task.end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted bg-surface border border-line px-1.5 py-0.5 rounded-input">
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.color}`} />
                      {meta.label}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{task.weight}% bobot</span>
                  </div>
                </div>
                <div
                  className="relative px-0 h-14 self-center"
                  style={{
                    background: dayGrid(false),
                  }}
                >
                  <div
                    className="absolute top-0 bottom-0 w-px bg-danger/70 z-10"
                    style={{ left: `${todayPct}%` }}
                    title="Hari ini"
                  />
                  <div className="absolute top-0.5 bottom-0.5 w-px bg-navy z-10" style={{ left: `${deadline}%` }} />
                  <div
                    className={`absolute top-3.5 h-7 rounded-md z-20 overflow-hidden whitespace-nowrap flex items-center px-2 text-[10px] font-bold text-white ${meta.color}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${task.title}: ${task.progress}%`}
                    aria-label={`${task.title}, progres ${task.progress}%`}
                  >
                    {done && <i className="absolute inset-0 bg-white/10" />}
                    {showLabel ? (
                      <span className="relative z-10">{task.progress}%</span>
                    ) : (
                      <span className="relative z-10 w-full h-full" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}