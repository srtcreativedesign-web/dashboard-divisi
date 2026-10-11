import type { ReactNode } from 'react';

type DivisionPageHeaderProps = {
  division: string;
  descriptor: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function DivisionPageHeader({ division, descriptor, title, description, actions }: DivisionPageHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-input border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-700 dark:border-primary-900 dark:bg-primary-950 dark:text-primary-300">
            {division}
          </span>
          <span aria-hidden="true" className="text-xs text-slate-300 dark:text-slate-600">&bull;</span>
          <span className="text-xs font-medium text-subtle">{descriptor}</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">{title}</h1>
        <p className="mt-0.5 max-w-3xl text-xs leading-relaxed text-subtle sm:text-sm">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div> : null}
    </header>
  );
}
