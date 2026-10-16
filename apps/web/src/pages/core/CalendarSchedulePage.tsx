import { useMemo } from 'react';
import { CalendarSchedule } from '../../components/calendar/CalendarSchedule';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import type { EventDivision } from '../../types/calendar';

interface CalendarSchedulePageProps {
  defaultDivision?: EventDivision;
}

export default function CalendarSchedulePage({ defaultDivision = 'ALL' }: CalendarSchedulePageProps) {
  const { events } = useCalendarEvents();

  // Quick Stats
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const stats = useMemo(() => {
    const todayEvents = events.filter((e) => e.date === todayStr);
    const completedEvents = events.filter((e) => e.status === 'completed');
    const meetingEvents = events.filter((e) => e.category === 'meeting');
    const deadlineEvents = events.filter((e) => e.category === 'deadline');

    return {
      total: events.length,
      today: todayEvents.length,
      completed: completedEvents.length,
      meetings: meetingEvents.length,
      deadlines: deadlineEvents.length,
    };
  }, [events, todayStr]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-subtle mb-1">
            <span>Workspace ERP</span>
            <span>/</span>
            <span className="text-navy font-medium">Kalender Jadwal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            Kalender Jadwal & Agenda
          </h1>
          <p className="text-xs text-subtle mt-0.5">
            Manajemen agenda kegiatan divisi, target deadline, jadwal pelaksanaan proyek, dan koordinasi operasional.
          </p>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-line bg-panel p-4 shadow-card">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-[11px] font-bold uppercase tracking-wider">Agenda Hari Ini</span>
            <CalendarIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-2xl font-bold text-navy mt-1.5">{stats.today}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Kegiatan aktif pada tanggal hari ini</p>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4 shadow-card">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rapat & Koordinasi</span>
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-navy mt-1.5">{stats.meetings}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Jadwal meeting terdaftar</p>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4 shadow-card">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-[11px] font-bold uppercase tracking-wider">Batas Waktu / Deadline</span>
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-2xl font-bold text-navy mt-1.5">{stats.deadlines}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Target & penutupan periode</p>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4 shadow-card">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-[11px] font-bold uppercase tracking-wider">Telah Selesai</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-navy mt-1.5">{stats.completed}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Dari total {stats.total} agenda tercatat</p>
        </div>
      </div>

      {/* CALENDAR MAIN INTERFACE */}
      <CalendarSchedule initialDivision={defaultDivision} />
    </div>
  );
}
