export type EventCategory = 'meeting' | 'deadline' | 'project' | 'operational' | 'leave' | 'general';
export type EventDivision = 'ALL' | 'ACC' | 'PROJECT' | 'CELL' | 'BOD';
export type EventStatus = 'scheduled' | 'completed' | 'cancelled';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD for multi-day events
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  isAllDay: boolean;
  category: EventCategory;
  division: EventDivision;
  location?: string;
  description?: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryMeta {
  label: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  borderBg: string;
}

export const CATEGORY_CONFIG: Record<EventCategory, CategoryMeta> = {
  meeting: {
    label: 'Rapat / Koordinasi',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
    dotColor: 'bg-blue-500',
    borderBg: 'border-blue-200 dark:border-blue-800',
  },
  deadline: {
    label: 'Target & Batas Waktu',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    dotColor: 'bg-rose-500',
    borderBg: 'border-rose-200 dark:border-rose-800',
  },
  project: {
    label: 'Proyek & Lapangan',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    dotColor: 'bg-amber-500',
    borderBg: 'border-amber-200 dark:border-amber-800',
  },
  operational: {
    label: 'Operasional Rutin',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
    borderBg: 'border-emerald-200 dark:border-emerald-800',
  },
  leave: {
    label: 'Cuti / Hari Libur',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
    badgeText: 'text-purple-700 dark:text-purple-300',
    dotColor: 'bg-purple-500',
    borderBg: 'border-purple-200 dark:border-purple-800',
  },
  general: {
    label: 'Kegiatan Umum',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    dotColor: 'bg-slate-500',
    borderBg: 'border-slate-200 dark:border-slate-700',
  },
};

export const DIVISION_OPTIONS: { value: EventDivision; label: string }[] = [
  { value: 'ALL', label: 'Semua Divisi' },
  { value: 'BOD', label: 'BOD / Eksekutif' },
  { value: 'ACC', label: 'Accounting & Finance' },
  { value: 'PROJECT', label: 'Manajemen Proyek' },
  { value: 'CELL', label: 'Cellular & Retail' },
];
