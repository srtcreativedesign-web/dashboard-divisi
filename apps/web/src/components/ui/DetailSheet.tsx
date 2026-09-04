import { useEffect } from 'react';
import { X, Layers } from 'lucide-react';

export interface DetailSheetBadge {
  text: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export interface DetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: DetailSheetBadge;
  icon?: React.ElementType;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-3xl',
};

const BADGE_CLASSES: Record<NonNullable<DetailSheetBadge['variant']>, string> = {
  primary: 'bg-primary-50 text-primary-800 border-primary-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-800 border-rose-200',
  info: 'bg-sky-50 text-sky-800 border-sky-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function DetailSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  icon: Icon = Layers,
  children,
  footer,
  size = 'md',
}: DetailSheetProps) {
  // Lock body scroll and register Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const badgeVariant = badge?.variant ?? 'primary';
  const badgeClass = BADGE_CLASSES[badgeVariant];

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      data-testid="detail-sheet-root"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
        data-testid="detail-sheet-backdrop"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-sheet-title"
          className={`w-screen ${sizeClass} flex flex-col bg-white shadow-2xl border-l border-sky-200/80 ring-1 ring-black/5 animate-in slide-in-from-right duration-250 ease-out`}
          data-testid="detail-sheet-panel"
        >
          {/* Top accent gradient bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary-600 via-sky-500 to-sage shrink-0" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-line/70 px-5 py-4 bg-slate-50/50 shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 text-sky-700 border border-sky-200 shadow-2xs">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2
                    id="detail-sheet-title"
                    className="text-base font-bold text-navy tracking-tight leading-snug truncate"
                  >
                    {title}
                  </h2>
                  {badge && (
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}
                      data-testid="detail-sheet-badge"
                    >
                      {badge.text}
                    </span>
                  )}
                </div>
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup panel rincian"
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              data-testid="detail-sheet-close-btn"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div
            className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-200"
            data-testid="detail-sheet-content"
          >
            {children}
          </div>

          {/* Pinned Footer */}
          <div
            className="border-t border-line/60 bg-slate-50/80 px-5 py-3.5 flex items-center justify-end gap-2.5 shrink-0"
            data-testid="detail-sheet-footer"
          >
            {footer ? (
              footer
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all"
                data-testid="detail-sheet-default-close-btn"
              >
                Tutup
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
