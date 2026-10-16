import { useEffect, useRef } from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin, AlignLeft, Edit, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import type { CalendarEvent } from '../../types/calendar';
import { CATEGORY_CONFIG, DIVISION_OPTIONS } from '../../types/calendar';
import { Button } from '../ui/Button';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export function EventDetailModal({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus,
}: EventDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  if (!event) return null;

  const categoryMeta = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.general;
  const divisionLabel = DIVISION_OPTIONS.find((d) => d.value === event.division)?.label || event.division;

  const formatDate = (dateStr: string) => {
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

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="backdrop:bg-slate-900/40 backdrop:backdrop-blur-xs m-auto w-full max-w-md rounded-2xl border border-line bg-panel p-0 text-navy shadow-xl open:animate-in open:fade-in-90 open:zoom-in-95"
    >
      <div className="flex items-start justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${categoryMeta.badgeBg} ${categoryMeta.badgeText} ${categoryMeta.borderBg}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${categoryMeta.dotColor}`} />
            {categoryMeta.label}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface text-subtle border border-line">
            {divisionLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-surface hover:text-navy transition-colors"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-navy leading-snug">{event.title}</h3>
          {event.status === 'completed' && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Agenda Selesai Terlaksana
            </span>
          )}
          {event.status === 'cancelled' && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
              Agenda Dibatalkan
            </span>
          )}
        </div>

        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2.5">
            <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-navy">{formatDate(event.date)}</p>
              {event.endDate && event.endDate !== event.date && (
                <p className="text-subtle">Hingga: {formatDate(event.endDate)}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              {event.isAllDay
                ? 'Sepanjang Hari'
                : `${event.startTime || '00:00'} - ${event.endTime || 'Selesai'}`}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}

          {event.description && (
            <div className="flex items-start gap-2.5 pt-2 border-t border-line">
              <AlignLeft className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-line">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Yakin ingin menghapus agenda kegiatan ini?')) {
                onDelete(event.id);
                onClose();
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-danger hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onToggleStatus(event.id)}
            >
              {event.status === 'completed' ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" /> Set Belum Selesai
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Tandai Selesai
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(event);
              }}
            >
              <Edit className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
