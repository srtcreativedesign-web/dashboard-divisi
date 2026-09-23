import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface AntiSlopEmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function AntiSlopEmptyState({
  title = 'Tidak Ada Data',
  description = 'Saat ini belum ada data yang tersedia untuk ditampilkan.',
  icon,
  action,
  className = '',
}: AntiSlopEmptyStateProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center shadow-sm ${className}`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
        {icon ?? <Inbox className="h-8 w-8 text-slate-400" strokeWidth={1.5} />}
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <p className="max-w-sm text-sm text-slate-500">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
