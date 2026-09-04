type StatusTone = 'success' | 'warning' | 'danger' | 'primary';

const STATUS_TONES: Record<string, StatusTone> = {
  Aktif: 'success',
  Approved: 'success',
  Efektif: 'success',
  Enforced: 'success',
  Fresh: 'success',
  Match: 'success',
  Mapped: 'success',
  Normal: 'success',
  Posted: 'success',
  Ready: 'success',
  Selesai: 'success',
  Submitted: 'success',
  Valid: 'success',
  Validated: 'success',
  Warning: 'warning',
  Review: 'warning',
  Draft: 'warning',
  Monitor: 'warning',
  Processing: 'warning',
  Stale: 'warning',
  'Need review': 'warning',
  'Needs evidence': 'warning',
  'Needs note': 'warning',
  Menunggu: 'warning',
  Rendah: 'warning',
  'Action needed': 'danger',
  Blocked: 'danger',
  Fail: 'danger',
  Nonaktif: 'danger',
  Returned: 'danger',
  Audit: 'primary',
  'BOD only': 'primary',
  Guarded: 'primary',
  Masked: 'primary',
  Mock: 'primary',
  Partial: 'primary',
  Restricted: 'primary',
};

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  primary: 'bg-primary-100 text-primary-800',
};

export function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? 'warning';
  return <span className={`rounded-input px-2 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>{status}</span>;
}
