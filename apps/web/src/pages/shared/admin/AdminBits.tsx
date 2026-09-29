import type { ReactNode } from 'react';

// Wrapper label+kontrol. Dipakai di seluruh form Admin Divisi supaya
// jarak & tipografi konsisten (sebelumnya tiap field tulis ulang className).
export function AdminField({ label, span, children }: { label: string; span?: string; children: ReactNode }) {
  return (
    <label className={`space-y-1 ${span ?? ''}`}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-300',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
} as const;

export type BadgeTone = keyof typeof TONES;

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${TONES[tone]}`}>{children}</span>;
}

export function toneForLeave(status: string): BadgeTone {
  if (status === 'APPROVED') return 'green';
  if (status === 'REJECTED') return 'red';
  return 'amber';
}

export function toneForAttendance(status: string): BadgeTone {
  if (status === 'LOCKED') return 'slate';
  if (status === 'SUBMITTED') return 'blue';
  return 'slate';
}

export const today = () => new Date().toISOString().slice(0, 10);
export const monthStart = () => new Date().toISOString().slice(0, 8) + '01';
export const rupiah = (n: number | null | undefined) => (n ?? 0).toLocaleString('id-ID');
