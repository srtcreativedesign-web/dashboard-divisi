import { useState, useEffect, useRef } from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin, AlignLeft, Tag, Layers, Trash2 } from 'lucide-react';
import type { CalendarEvent, EventCategory, EventDivision, EventStatus } from '../../types/calendar';
import { CATEGORY_CONFIG, DIVISION_OPTIONS } from '../../types/calendar';
import { Button } from '../ui/Button';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    date: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    isAllDay: boolean;
    category: EventCategory;
    division: EventDivision;
    location?: string;
    description?: string;
    status: EventStatus;
  }) => void;
  onDelete?: (id: string) => void;
  initialEvent?: CalendarEvent | null;
  initialDate?: string;
  defaultDivision?: EventDivision;
}

export function EventFormModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialEvent,
  initialDate,
  defaultDivision = 'ALL',
}: EventFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState<EventCategory>('meeting');
  const [division, setDivision] = useState<EventDivision>(defaultDivision);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<EventStatus>('scheduled');
  const [error, setError] = useState<string | null>(null);

  // Sync state when opening modal
  useEffect(() => {
    if (isOpen) {
      if (initialEvent) {
        setTitle(initialEvent.title);
        setDate(initialEvent.date);
        setEndDate(initialEvent.endDate || '');
        setIsAllDay(initialEvent.isAllDay);
        setStartTime(initialEvent.startTime || '09:00');
        setEndTime(initialEvent.endTime || '10:00');
        setCategory(initialEvent.category);
        setDivision(initialEvent.division);
        setLocation(initialEvent.location || '');
        setDescription(initialEvent.description || '');
        setStatus(initialEvent.status);
      } else {
        const todayStr = initialDate || new Date().toISOString().slice(0, 10);
        setTitle('');
        setDate(todayStr);
        setEndDate('');
        setIsAllDay(false);
        setStartTime('09:00');
        setEndTime('10:00');
        setCategory('meeting');
        setDivision(defaultDivision);
        setLocation('');
        setDescription('');
        setStatus('scheduled');
      }
      setError(null);
    }
  }, [isOpen, initialEvent, initialDate, defaultDivision]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    } else if (!isOpen && dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Nama atau judul jadwal wajib diisi.');
      return;
    }
    if (!date) {
      setError('Tanggal pelaksanaan wajib ditentukan.');
      return;
    }

    onSave({
      title: title.trim(),
      date,
      endDate: endDate || undefined,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      isAllDay,
      category,
      division,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      status,
    });
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="backdrop:bg-slate-900/40 backdrop:backdrop-blur-xs m-auto w-full max-w-lg rounded-2xl border border-line bg-panel p-0 text-navy shadow-xl open:animate-in open:fade-in-90 open:zoom-in-95"
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h2 className="text-base font-bold text-navy">
            {initialEvent ? 'Ubah Jadwal Kegiatan' : 'Tambah Jadwal Kegiatan'}
          </h2>
          <p className="text-xs text-subtle">
            {initialEvent ? 'Perbarui informasi agenda kalender' : 'Jadwalkan rapat, target, atau kegiatan operasional'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-surface hover:text-navy transition-colors"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        {error && (
          <div className="p-3 text-xs rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Judul Kegiatan / Agenda <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Rapat Mingguan Koordinasi Proyek"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-line bg-surface text-navy focus:border-primary-500 focus:outline-none transition-colors"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
              Tanggal <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-line bg-surface text-navy focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
              Tanggal Selesai (Opsional)
            </label>
            <input
              type="date"
              value={endDate}
              min={date}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-line bg-surface text-navy focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="all-day-checkbox"
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
            className="h-4 w-4 rounded border-line text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="all-day-checkbox" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            Sepanjang hari (All Day)
          </label>
        </div>

        {!isAllDay && (
          <div className="grid grid-cols-2 gap-3 bg-surface p-3 rounded-lg border border-line">
            <div>
              <label className="block text-[11px] font-semibold text-subtle mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Jam Mulai
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-line bg-panel text-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-subtle mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Jam Selesai
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-line bg-panel text-navy focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              Kategori Agenda
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-line bg-surface text-navy focus:border-primary-500 focus:outline-none"
            >
              {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_CONFIG[cat].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              Divisi Terkait
            </label>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value as EventDivision)}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-line bg-surface text-navy focus:border-primary-500 focus:outline-none"
            >
              {DIVISION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            Lokasi / Tempat (Opsional)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ruang Rapat A / Google Meet / Kantor Cabang"
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-line bg-surface text-navy focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
            <AlignLeft className="h-3.5 w-3.5 text-slate-400" />
            Catatan / Deskripsi (Opsional)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detail pokok pembahasan, peserta, atau instruksi kerja..."
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-line bg-surface text-navy focus:border-primary-500 focus:outline-none"
          />
        </div>

        {initialEvent && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Status Jadwal
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('scheduled')}
                className={`px-3 py-1.5 text-xs rounded-md border font-medium transition-colors ${
                  status === 'scheduled'
                    ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                    : 'border-line bg-surface text-subtle hover:bg-panel'
                }`}
              >
                Terjadwal
              </button>
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`px-3 py-1.5 text-xs rounded-md border font-medium transition-colors ${
                  status === 'completed'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-line bg-surface text-subtle hover:bg-panel'
                }`}
              >
                Selesai
              </button>
              <button
                type="button"
                onClick={() => setStatus('cancelled')}
                className={`px-3 py-1.5 text-xs rounded-md border font-medium transition-colors ${
                  status === 'cancelled'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'border-line bg-surface text-subtle hover:bg-panel'
                }`}
              >
                Dibatalkan
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-line">
          {initialEvent && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Yakin ingin menghapus agenda kegiatan ini?')) {
                  onDelete(initialEvent.id);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-danger hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {initialEvent ? 'Simpan Perubahan' : 'Tambah ke Kalender'}
            </Button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
