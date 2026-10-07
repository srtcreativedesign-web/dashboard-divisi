import { useEffect, useRef } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  isOpen,
  title,
  description,
  variant = 'info',
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const variants = {
    danger: 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-md hover:-translate-y-0.5 transition-all',
    warning: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:-translate-y-0.5 transition-all',
    info: 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-md hover:-translate-y-0.5 transition-all',
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancel}
      className="backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm m-auto rounded-2xl shadow-xl border border-slate-200/60 bg-white p-0 overflow-hidden open:animate-in open:fade-in-90 open:zoom-in-95"
    >
      <div className="w-[400px] max-w-full p-6">
        <div className="flex items-start gap-4">
          {variant === 'danger' || variant === 'warning' ? (
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          ) : (
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600">
              <Info className="w-5 h-5" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${variants[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </dialog>
  );
}
