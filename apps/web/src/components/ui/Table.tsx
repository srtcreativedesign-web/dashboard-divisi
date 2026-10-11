import type { ReactNode } from 'react';

export function TableWrap({ children, minWidth = '720px' }: { children: ReactNode; minWidth?: string }) {
  return <div role="region" aria-label="Tabel data, geser untuk melihat semua kolom" tabIndex={0} className="max-w-full overflow-x-auto rounded-card border border-line"><table className={`w-full text-left text-sm`} style={{ minWidth }}>{children}</table></div>;
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-surface text-subtle">{children}</thead>;
}
