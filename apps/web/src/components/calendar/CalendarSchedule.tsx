import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  RotateCcw,
} from 'lucide-react';
import type { CalendarEvent, EventCategory, EventDivision } from '../../types/calendar';
import { CATEGORY_CONFIG, DIVISION_OPTIONS } from '../../types/calendar';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { EventFormModal } from './EventFormModal';
import { EventDetailModal } from './EventDetailModal';
import { Button } from '../ui/Button';

interface CalendarScheduleProps {
  initialDivision?: EventDivision;
  embedded?: boolean;
}

const DAYS_OF_WEEK = [
  { short: 'Sen', full: 'Senin' },
  { short: 'Sel', full: 'Selasa' },
  { short: 'Rab', full: 'Rabu' },
  { short: 'Kam', full: 'Kamis' },
  { short: 'Jum', full: 'Jumat' },
  { short: 'Sab', full: 'Sabtu' },
  { short: 'Min', full: 'Minggu' },
];

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function CalendarSchedule({ initialDivision = 'ALL', embedded = false }: CalendarScheduleProps) {
  const { events, addEvent, updateEvent, deleteEvent, toggleStatus, resetToDefaults } = useCalendarEvents();

  // Navigation State
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth()); // 0-11
  const todayDateStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);

  // Filters & View Mode
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<EventDivision>(initialDivision);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formDate, setFormDate] = useState<string | undefined>(undefined);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayDateStr);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Category filter
      if (selectedCategory !== 'ALL' && evt.category !== selectedCategory) {
        return false;
      }
      // Division filter
      if (selectedDivision !== 'ALL' && evt.division !== 'ALL' && evt.division !== selectedDivision) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(query);
        const matchLoc = evt.location?.toLowerCase().includes(query);
        const matchDesc = evt.description?.toLowerCase().includes(query);
        if (!matchTitle && !matchLoc && !matchDesc) return false;
      }
      return true;
    });
  }, [events, selectedCategory, selectedDivision, searchQuery]);

  // Calendar Grid Matrix Generation
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // Sunday is 0, Monday is 1 ... Saturday is 6
    // Shift so Monday is 0 and Sunday is 6:
    const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: CalendarEvent[];
    }[] = [];

    // Previous month filler days
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayEvents = filteredEvents.filter((e) => {
        if (e.endDate) {
          return dateStr >= e.date && dateStr <= e.endDate;
        }
        return e.date === dateStr;
      });

      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayDateStr,
        events: dayEvents,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayEvents = filteredEvents.filter((e) => {
        if (e.endDate) {
          return dateStr >= e.date && dateStr <= e.endDate;
        }
        return e.date === dateStr;
      });

      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayDateStr,
        events: dayEvents,
      });
    }

    // Next month filler days to complete rows (35 or 42 cells)
    const totalCells = cells.length > 35 ? 42 : 35;
    const remainingDays = totalCells - cells.length;
    for (let dayNum = 1; dayNum <= remainingDays; dayNum++) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayEvents = filteredEvents.filter((e) => {
        if (e.endDate) {
          return dateStr >= e.date && dateStr <= e.endDate;
        }
        return e.date === dateStr;
      });

      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayDateStr,
        events: dayEvents,
      });
    }

    return cells;
  }, [currentYear, currentMonth, filteredEvents, todayDateStr]);

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    return filteredEvents.filter((e) => {
      if (e.endDate) {
        return selectedDate >= e.date && selectedDate <= e.endDate;
      }
      return e.date === selectedDate;
    });
  }, [filteredEvents, selectedDate]);

  // Format date helper
  const formatSelectedDateTitle = (dateStr: string) => {
    try {
      const parts = dateStr.split('-').map(Number);
      const y = parts[0];
      const m = parts[1];
      const d = parts[2];
      if (y !== undefined && m !== undefined && d !== undefined && !isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleOpenAddEvent = (targetDate?: string) => {
    setEditingEvent(null);
    setFormDate(targetDate || selectedDate || todayDateStr);
    setIsFormOpen(true);
  };

  const handleEditEvent = (evt: CalendarEvent) => {
    setEditingEvent(evt);
    setFormDate(evt.date);
    setIsFormOpen(true);
  };

  return (
    <div className={`space-y-4 ${embedded ? '' : 'p-1'}`}>
      {/* TOOLBAR & CONTROLS */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-panel p-4 rounded-xl border border-line shadow-card">
        {/* Navigation & Month Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-line bg-surface p-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Bulan sebelumnya"
              className="p-1.5 rounded-md hover:bg-panel text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-panel rounded-md transition-colors"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Bulan berikutnya"
              className="p-1.5 rounded-md hover:bg-panel text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-navy tracking-tight min-w-[180px]">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
        </div>

        {/* Filters, View Toggle, and Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative min-w-[160px] sm:min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kegiatan..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-line bg-surface text-navy placeholder:text-slate-400 focus:outline-none focus:border-primary-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-line bg-surface text-navy focus:outline-none"
          >
            <option value="ALL">Semua Kategori</option>
            {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_CONFIG[cat].label}
              </option>
            ))}
          </select>

          {/* Division Filter */}
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value as EventDivision)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-line bg-surface text-navy focus:outline-none"
          >
            {DIVISION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-line bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-panel shadow-xs text-primary-700 dark:text-primary-300'
                  : 'text-subtle hover:text-navy'
              }`}
            >
              Kalender
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-panel shadow-xs text-primary-700 dark:text-primary-300'
                  : 'text-subtle hover:text-navy'
              }`}
            >
              Agenda
            </button>
          </div>

          {/* Add Event Button */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleOpenAddEvent()}
            className="shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Jadwal</span>
          </Button>
        </div>
      </div>

      {/* MAIN VIEW CONTENT */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {/* CALENDAR MONTH GRID (3 Cols on Desktop) */}
          <div className="lg:col-span-3 rounded-xl border border-line bg-panel overflow-hidden shadow-card">
            {/* Day Header Row */}
            <div className="grid grid-cols-7 border-b border-line bg-surface text-center">
              {DAYS_OF_WEEK.map((day, idx) => (
                <div
                  key={day.short}
                  className={`py-2.5 text-xs font-bold uppercase tracking-wider ${
                    idx >= 5 ? 'text-rose-500/80 dark:text-rose-400/80' : 'text-subtle'
                  }`}
                >
                  <span className="hidden sm:inline">{day.full}</span>
                  <span className="sm:hidden">{day.short}</span>
                </div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-line bg-line/20">
              {calendarCells.map((cell) => {
                const isSelected = cell.dateStr === selectedDate;
                const isCurrent = cell.isCurrentMonth;
                const hasEvents = cell.events.length > 0;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    onDoubleClick={() => handleOpenAddEvent(cell.dateStr)}
                    className={`group relative min-h-[96px] sm:min-h-[110px] p-1.5 sm:p-2 bg-panel transition-all cursor-pointer flex flex-col justify-between ${
                      !isCurrent ? 'bg-surface/50 text-slate-400 dark:text-slate-500' : ''
                    } ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50/20 dark:bg-primary-950/20 z-10' : 'hover:bg-surface/60'}`}
                  >
                    {/* Top Row: Date Number and Quick Add Button */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`inline-flex items-center justify-center text-xs font-semibold ${
                          cell.isToday
                            ? 'h-6 w-6 rounded-full bg-primary-600 text-white font-bold shadow-xs'
                            : isCurrent
                            ? 'text-navy'
                            : 'text-slate-400'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Quick Add Button on Hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddEvent(cell.dateStr);
                        }}
                        title={`Tambah jadwal pada ${cell.dateStr}`}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900 text-primary-600 dark:text-primary-300 transition-opacity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Events List in Cell */}
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {cell.events.slice(0, 3).map((evt) => {
                        const meta = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.general;
                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingEvent(evt);
                            }}
                            className={`group/evt flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium border truncate transition-all hover:scale-[1.02] shadow-2xs ${meta.badgeBg} ${meta.badgeText} ${meta.borderBg} ${
                              evt.status === 'completed' ? 'line-through opacity-60' : ''
                            }`}
                            title={`${evt.isAllDay ? 'Seharian' : evt.startTime} - ${evt.title}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${meta.dotColor}`} />
                            {!evt.isAllDay && evt.startTime && (
                              <span className="shrink-0 font-mono text-[9px] opacity-75">{evt.startTime}</span>
                            )}
                            <span className="truncate">{evt.title}</span>
                          </div>
                        );
                      })}

                      {cell.events.length > 3 && (
                        <div className="text-[10px] font-bold text-primary-600 dark:text-primary-400 pl-1">
                          +{cell.events.length - 3} agenda lagi
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDE PANEL: SELECTED DATE AGENDA DETAIL (1 Col on Desktop) */}
          <div className="rounded-xl border border-line bg-panel p-4 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Agenda Tanggal</p>
                <h3 className="text-sm font-bold text-navy mt-0.5">{formatSelectedDateTitle(selectedDate)}</h3>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleOpenAddEvent(selectedDate)}
                title="Tambah jadwal pada tanggal ini"
                className="h-8 px-2.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs">Tambah</span>
              </Button>
            </div>

            {selectedDateEvents.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CalendarIcon className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5] mb-2" />
                <p className="text-xs font-medium">Belum ada agenda pada tanggal ini</p>
                <button
                  type="button"
                  onClick={() => handleOpenAddEvent(selectedDate)}
                  className="mt-2 text-xs font-semibold text-primary-600 hover:underline"
                >
                  + Tambahkan agenda sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {selectedDateEvents.map((evt) => {
                  const meta = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.general;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setViewingEvent(evt)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-xs hover:border-primary-300 bg-surface ${
                        evt.status === 'completed' ? 'opacity-70' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${meta.badgeBg} ${meta.badgeText} ${meta.borderBg}`}
                        >
                          <span className={`h-1 w-1 rounded-full ${meta.dotColor}`} />
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-semibold text-subtle bg-panel px-1.5 py-0.5 rounded border border-line">
                          {evt.division}
                        </span>
                      </div>

                      <h4
                        className={`text-xs font-bold text-navy mt-2 leading-snug ${
                          evt.status === 'completed' ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {evt.title}
                      </h4>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>
                            {evt.isAllDay ? 'Sepanjang Hari' : `${evt.startTime || '00:00'} - ${evt.endTime || 'Selesai'}`}
                          </span>
                        </div>
                        {evt.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span className="truncate max-w-[140px]">{evt.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-line flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(evt.id);
                          }}
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-600 transition-colors"
                        >
                          <CheckCircle2
                            className={`h-3.5 w-3.5 ${
                              evt.status === 'completed' ? 'text-emerald-600 fill-emerald-100' : ''
                            }`}
                          />
                          <span>{evt.status === 'completed' ? 'Selesai' : 'Tandai Selesai'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(evt);
                          }}
                          className="text-primary-600 hover:underline font-semibold"
                        >
                          Ubah
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* LIST / AGENDA VIEW */
        <div className="rounded-xl border border-line bg-panel p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-sm font-bold text-navy">Daftar Seluruh Agenda Mendatang</h3>
              <p className="text-xs text-subtle">
                Menampilkan {filteredEvents.length} kegiatan terjadwal berdasarkan filter terpilih
              </p>
            </div>
            <button
              type="button"
              onClick={resetToDefaults}
              className="text-xs text-subtle hover:text-navy inline-flex items-center gap-1"
              title="Reset ke contoh kegiatan default"
            >
              <RotateCcw className="h-3 w-3" /> Reset Contoh Jadwal
            </button>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CalendarIcon className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5] mb-2" />
              <p className="text-sm font-medium">Tidak ada kegiatan yang cocok dengan kriteria pencarian</p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleOpenAddEvent()}
                className="mt-3"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Agenda Baru
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {filteredEvents
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((evt) => {
                  const meta = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.general;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setViewingEvent(evt)}
                      className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface/60 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="min-w-[90px] text-left">
                          <p className="text-xs font-bold text-navy font-mono">{evt.date}</p>
                          <p className="text-[11px] text-slate-400">
                            {evt.isAllDay ? 'Seharian' : `${evt.startTime || '00:00'}`}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${meta.badgeBg} ${meta.badgeText} ${meta.borderBg}`}
                            >
                              <span className={`h-1 w-1 rounded-full ${meta.dotColor}`} />
                              {meta.label}
                            </span>
                            <span className="text-[10px] font-semibold text-subtle bg-surface px-1.5 py-0.5 rounded border border-line">
                              {evt.division}
                            </span>
                          </div>
                          <h4
                            className={`text-sm font-semibold text-navy ${
                              evt.status === 'completed' ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {evt.title}
                          </h4>
                          {evt.location && (
                            <p className="text-xs text-subtle flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" /> {evt.location}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(evt.id);
                          }}
                        >
                          <CheckCircle2
                            className={`h-4 w-4 ${
                              evt.status === 'completed' ? 'text-emerald-600 fill-emerald-100' : 'text-slate-400'
                            }`}
                          />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(evt);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* EVENT FORM MODAL */}
      <EventFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialEvent={editingEvent}
        initialDate={formDate}
        defaultDivision={selectedDivision !== 'ALL' ? selectedDivision : 'ALL'}
        onSave={(data) => {
          if (editingEvent) {
            updateEvent(editingEvent.id, data);
          } else {
            addEvent(data);
          }
        }}
        onDelete={(id) => deleteEvent(id)}
      />

      {/* EVENT DETAIL MODAL */}
      <EventDetailModal
        event={viewingEvent}
        isOpen={!!viewingEvent}
        onClose={() => setViewingEvent(null)}
        onEdit={(evt) => handleEditEvent(evt)}
        onDelete={(id) => deleteEvent(id)}
        onToggleStatus={(id) => toggleStatus(id)}
      />
    </div>
  );
}
