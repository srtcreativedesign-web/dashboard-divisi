import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

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

const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl', xl: 'max-w-3xl', full: 'max-w-none' };

export function DetailSheet({ isOpen, onClose, title, subtitle, badge, icon: Icon, children, footer, size = 'md' }: DetailSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!isOpen || !dialog) return;
    const overflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    return () => {
      if (typeof dialog.close === 'function') dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [isOpen]);
  if (!isOpen) return null;
  return createPortal(
    <dialog ref={ref} aria-labelledby={titleId} aria-describedby={subtitle ? descriptionId : undefined}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      className={`fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-dvh w-full border-0 bg-white dark:bg-slate-900 p-0 text-navy shadow-2xl backdrop:bg-slate-950/40 ${widths[size]}`}>
      <div className="flex h-full flex-col">
        <header className="flex items-start gap-3 border-b border-line p-5 sm:p-6">
          {Icon && <Icon className="mt-0.5 h-5 w-5 text-primary" />}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
            {subtitle && <p id={descriptionId} className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            {badge && <span className="mt-2 inline-block rounded bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs">{badge.text}</span>}
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup panel" className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer && <footer className="border-t border-line bg-slate-50 dark:bg-slate-800 p-5 sm:px-6">{footer}</footer>}
      </div>
    </dialog>, document.body
  );
}
