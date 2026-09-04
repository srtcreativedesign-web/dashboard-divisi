import type { ReactNode } from 'react';

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Memuat data...' }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 p-10 text-center"
    >
      <div
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary"
      />
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  title = 'Belum ada data',
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line bg-white p-10 text-center"
    >
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs text-slate-500">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  traceId?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Gagal memuat data',
  description = 'Periksa koneksi Anda lalu coba lagi.',
  traceId,
  onRetry,
}: ErrorStateProps) {
  const isAuth = title.includes('Token') || description?.includes('Token') || description?.includes('401');
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-card border border-danger/30 bg-white p-10 text-center"
    >
      <p className="text-sm font-medium text-danger">{title}</p>
      <p className="max-w-sm text-xs text-slate-500">{description}</p>
      {traceId && (
        <p className="flex items-center gap-2 max-w-sm text-xs font-mono text-slate-400">
          trace_id: {traceId}
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(traceId)}
            className="rounded border border-line px-1.5 py-0.5 text-xs hover:bg-surface"
          >
            Copy
          </button>
        </p>
      )}
      {isAuth ? (
        <a href="/login" className="rounded-input bg-navy px-4 py-2 text-sm text-white">
          Masuk — sesi habis
        </a>
      ) : onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-input bg-primary-700 hover:bg-primary-800 px-4 py-2 text-sm text-white font-medium transition-colors"
        >
          Coba Lagi
        </button>
      ) : null}
    </div>
  );
}

interface NoAccessStateProps {
  title?: string;
  description?: string;
}

export function NoAccessState({
  title = 'Akses ditolak',
  description = 'Role Anda tidak memiliki izin untuk membuka halaman ini.',
}: NoAccessStateProps) {
  return (
    <div
      role="alert"
      data-testid="no-access"
      className="flex flex-col items-center gap-2 rounded-card border border-warning/30 bg-white p-10 text-center"
    >
      <p className="text-sm font-medium text-warning">{title}</p>
      <p className="max-w-sm text-xs text-slate-500">{description}</p>
    </div>
  );
}
