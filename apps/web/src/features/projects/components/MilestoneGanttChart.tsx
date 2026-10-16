import { useMemo } from 'react';

export interface GanttMilestoneItem {
  title: string;
  weight?: number;
  actual?: number;
  status?: string;
  start_date?: string | null;
  due_date?: string | null;
  completion_date?: string | null;
  projectName?: string;
  projectCode?: string;
}

interface MilestoneGanttChartProps {
  milestones: GanttMilestoneItem[];
  defaultStart?: string;
  defaultEnd?: string;
}

export function MilestoneGanttChart({ milestones, defaultStart, defaultEnd }: MilestoneGanttChartProps) {
  const { timelineStart, timelineEnd, totalDays, items } = useMemo(() => {
    if (!milestones.length) {
      return { timelineStart: new Date(), timelineEnd: new Date(), totalDays: 1, items: [] };
    }

    const parseDate = (d?: string | null) => (d ? new Date(d) : null);

    let minTime = Infinity;
    let maxTime = -Infinity;

    if (defaultStart) minTime = Math.min(minTime, new Date(defaultStart).getTime());
    if (defaultEnd) maxTime = Math.max(maxTime, new Date(defaultEnd).getTime());

    milestones.forEach((m) => {
      const s = parseDate(m.start_date);
      const e = parseDate(m.due_date);
      if (s && !isNaN(s.getTime())) minTime = Math.min(minTime, s.getTime());
      if (e && !isNaN(e.getTime())) maxTime = Math.max(maxTime, e.getTime());
    });

    if (minTime === Infinity || maxTime === -Infinity || minTime >= maxTime) {
      const now = new Date();
      minTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      maxTime = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
    }

    // Buffer 2 days at each end
    const startObj = new Date(minTime - 2 * 86400000);
    const endObj = new Date(maxTime + 2 * 86400000);
    const totalDurationMs = endObj.getTime() - startObj.getTime();
    const days = Math.max(1, Math.ceil(totalDurationMs / 86400000));

    const processed = milestones.map((m) => {
      const s = parseDate(m.start_date) || new Date(minTime);
      const e = parseDate(m.due_date) || new Date(s.getTime() + 7 * 86400000);

      const startOffsetMs = Math.max(0, s.getTime() - startObj.getTime());
      const durationMs = Math.max(86400000, e.getTime() - s.getTime());

      const leftPct = Math.min(96, Math.max(0, (startOffsetMs / totalDurationMs) * 100));
      const widthPct = Math.max(4, Math.min(100 - leftPct, (durationMs / totalDurationMs) * 100));

      return {
        ...m,
        leftPct,
        widthPct,
        startDateFormatted: s.toISOString().slice(0, 10),
        dueDateFormatted: e.toISOString().slice(0, 10),
        progress: typeof m.actual === 'number' ? m.actual : parseFloat(String(m.actual || 0)),
        weight: typeof m.weight === 'number' ? m.weight : parseFloat(String(m.weight || 0)),
      };
    });

    return {
      timelineStart: startObj,
      timelineEnd: endObj,
      totalDays: days,
      items: processed,
    };
  }, [milestones, defaultStart, defaultEnd]);

  if (!milestones.length) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        Belum ada milestone tahapan pekerjaan terdaftar.
      </div>
    );
  }

  // Generate date markers (up to 6 columns)
  const markerCount = 5;
  const markers = Array.from({ length: markerCount }, (_, i) => {
    const fraction = i / (markerCount - 1);
    const time = timelineStart.getTime() + fraction * (timelineEnd.getTime() - timelineStart.getTime());
    const date = new Date(time);
    return {
      label: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      pct: fraction * 100,
    };
  });

  return (
    <div className="space-y-3" data-testid="milestone-gantt-chart">
      {/* Gantt Container */}
      <div className="overflow-x-auto rounded-card border border-line bg-white">
        <div className="min-w-[700px]">
          {/* Header Row */}
          <div className="grid grid-cols-12 border-b border-line bg-slate-50/80 py-2.5 px-3 text-xs font-semibold text-slate-600">
            <div className="col-span-5 sm:col-span-4">Pekerjaan & Milestone</div>
            <div className="col-span-7 sm:col-span-8 relative flex items-center justify-between">
              {markers.map((m, idx) => (
                <span
                  key={idx}
                  className="text-[10px] text-slate-500 font-medium"
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Milestone Bars */}
          <div className="divide-y divide-line/60">
            {items.map((item, idx) => {
              const isComplete = item.status === 'completed' || item.progress >= 100;
              const isInProgress = item.status === 'in_progress';

              return (
                <div key={idx} className="grid grid-cols-12 items-center py-2 px-3 hover:bg-slate-50/70 text-xs">
                  {/* Left Column: Milestone Info */}
                  <div className="col-span-5 sm:col-span-4 pr-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-navy truncate" title={item.title}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {item.weight > 0 ? `(${item.weight}%)` : ''}
                      </span>
                    </div>
                    {item.projectName && (
                      <span className="text-[10px] text-slate-500 block truncate">
                        {item.projectName}
                      </span>
                    )}
                  </div>

                  {/* Right Column: Timeline Track */}
                  <div className="col-span-7 sm:col-span-8 relative h-7 flex items-center bg-slate-50/50 rounded overflow-hidden">
                    {/* Background Grid Lines */}
                    {markers.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className="absolute top-0 bottom-0 border-l border-slate-200/50"
                        style={{ left: `${m.pct}%` }}
                      />
                    ))}

                    {/* Milestone Bar */}
                    <div
                      className={`absolute h-5 rounded border text-[10px] flex items-center justify-between px-2 font-medium overflow-hidden shadow-sm transition-all ${
                        isComplete
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : isInProgress
                          ? 'bg-sky-100 border-sky-300 text-sky-800'
                          : 'bg-amber-100 border-amber-300 text-amber-800'
                      }`}
                      style={{
                        left: `${item.leftPct}%`,
                        width: `${item.widthPct}%`,
                      }}
                      title={`${item.title}: ${item.startDateFormatted} s/d ${item.dueDateFormatted} (${item.progress.toFixed(0)}%)`}
                    >
                      {/* Inner Progress Fill */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 opacity-40 transition-all ${
                          isComplete ? 'bg-emerald-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                      />

                      <span className="relative z-10 truncate text-[10px]">
                        {item.startDateFormatted} - {item.dueDateFormatted}
                      </span>
                      <span className="relative z-10 shrink-0 font-bold ml-1 text-[10px]">
                        {item.progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500 px-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
          <span>Selesai (100%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-sky-500" />
          <span>Sedang Berjalan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-amber-500" />
          <span>Menunggu / Tertunda</span>
        </div>
      </div>
    </div>
  );
}
