import React from 'react';
import { Clock, ShieldCheck, AlertTriangle, Flame, RotateCcw, Filter } from 'lucide-react';

export type AgingBucketId = 'bucket_0_30' | 'bucket_31_60' | 'bucket_61_90' | 'bucket_over_90';

export interface AgingBucketItem {
  id: string;
  amount?: number;
  remainingAmount: number;
  dueDate: string;
  status: string;
  [key: string]: any;
}

export interface AgingBucketBarProps {
  items: AgingBucketItem[];
  selectedBucket: AgingBucketId | null;
  onSelectBucket: (bucketId: AgingBucketId | null) => void;
  referenceDate?: string;
}

const rupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);

export function getDaysPastDue(dueDateStr: string, refDateStr: string = '2026-09-01'): number {
  try {
    const due = new Date(dueDateStr).getTime();
    const ref = new Date(refDateStr).getTime();
    const diffDays = Math.floor((ref - due) / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  } catch {
    return 0;
  }
}

export function getItemBucket(
  item: AgingBucketItem,
  refDateStr: string = '2026-09-01'
): AgingBucketId {
  const days = getDaysPastDue(item.dueDate, refDateStr);
  if (days <= 30) return 'bucket_0_30';
  if (days <= 60) return 'bucket_31_60';
  if (days <= 90) return 'bucket_61_90';
  return 'bucket_over_90';
}

interface BucketMeta {
  id: AgingBucketId;
  label: string;
  rangeLabel: string;
  statusLabel: string;
  color: string;
  barColor: string;
  textColor: string;
  borderColor: string;
  bgActive: string;
  icon: React.ComponentType<{ className?: string }>;
}

const BUCKET_DEFINITIONS: BucketMeta[] = [
  {
    id: 'bucket_0_30',
    label: '0 - 30 Hari',
    rangeLabel: 'Lancar',
    statusLabel: 'Kategori Lancar / Normal',
    color: '#0284c7',
    barColor: 'bg-sky-500',
    textColor: 'text-sky-800',
    borderColor: 'border-sky-300',
    bgActive: 'bg-sky-50/80',
    icon: ShieldCheck,
  },
  {
    id: 'bucket_31_60',
    label: '31 - 60 Hari',
    rangeLabel: 'Perhatian',
    statusLabel: 'Mulai Jatuh Tempo',
    color: '#f59e0b',
    barColor: 'bg-amber-500',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-300',
    bgActive: 'bg-amber-50/80',
    icon: Clock,
  },
  {
    id: 'bucket_61_90',
    label: '61 - 90 Hari',
    rangeLabel: 'Peringatan',
    statusLabel: 'Peringatan Penagihan',
    color: '#f97316',
    barColor: 'bg-orange-500',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
    bgActive: 'bg-orange-50/80',
    icon: AlertTriangle,
  },
  {
    id: 'bucket_over_90',
    label: '> 90 Hari',
    rangeLabel: 'Kritis',
    statusLabel: 'Overdue / Kritis',
    color: '#e11d48',
    barColor: 'bg-rose-500',
    textColor: 'text-rose-800',
    borderColor: 'border-rose-300',
    bgActive: 'bg-rose-50/80',
    icon: Flame,
  },
];

export function AgingBucketBar({
  items,
  selectedBucket,
  onSelectBucket,
  referenceDate = '2026-09-01',
}: AgingBucketBarProps) {
  // Hanya hitung kewajiban aktif yang belum lunas dan belum dibatalkan
  const activeItems = items.filter(
    (x) => x.status !== 'paid' && x.status !== 'cancelled'
  );
  const totalActiveOutstanding = activeItems.reduce(
    (sum, x) => sum + x.remainingAmount,
    0
  );

  // Kalkulasi agregat per bucket
  const bucketStats = BUCKET_DEFINITIONS.map((def) => {
    const bucketItems = activeItems.filter(
      (item) => getItemBucket(item, referenceDate) === def.id
    );
    const amount = bucketItems.reduce((sum, item) => sum + item.remainingAmount, 0);
    const count = bucketItems.length;
    const percentage =
      totalActiveOutstanding > 0 ? (amount / totalActiveOutstanding) * 100 : 0;

    return {
      ...def,
      count,
      amount,
      percentage,
    };
  });

  return (
    <section
      className="rounded-card-lg border border-line/60 bg-white/95 backdrop-blur-md p-5 shadow-xs"
      data-testid="aging-bucket-bar-section"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-navy flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-600" />
              Aging Bucket Distribution Bar (Distribusi Umur Tagihan)
            </h3>
            <span className="rounded-pill bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 border border-primary-200">
              Analisis Piutang &amp; Hutang
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-600 font-medium">
            Pemetaan kewajiban aktif per interval usia jatuh tempo terhadap tanggal acuan{' '}
            <span className="font-semibold text-navy">{referenceDate}</span>
          </p>
        </div>

        {selectedBucket && (
          <button
            type="button"
            onClick={() => onSelectBucket(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700 hover:bg-primary-100 transition-colors self-start sm:self-auto shadow-2xs"
            data-testid="reset-bucket-filter"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Tampilkan Semua Bucket
          </button>
        )}
      </div>

      {/* Stacked Horizontal Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-600 font-medium">
            Proporsi Nominal Outstanding:
          </span>
          <span className="font-black text-navy">
            Total: {rupiah(totalActiveOutstanding)}
          </span>
        </div>

        <div
          className="relative flex h-4 w-full overflow-hidden rounded-pill bg-slate-100 p-0.5 shadow-inner"
          role="progressbar"
          aria-label="Distribusi umur penagihan outstanding"
        >
          {bucketStats.map((b) => {
            if (b.percentage === 0) return null;
            const isSelected = selectedBucket === b.id;
            return (
              <div
                key={b.id}
                onClick={() => onSelectBucket(isSelected ? null : b.id)}
                style={{ width: `${b.percentage}%` }}
                className={`h-full ${b.barColor} transition-all duration-300 cursor-pointer first:rounded-l-pill last:rounded-r-pill ${
                  isSelected ? 'ring-2 ring-navy ring-offset-1 z-10 brightness-110' : 'hover:opacity-90'
                }`}
                title={`${b.label}: ${rupiah(b.amount)} (${b.percentage.toFixed(1)}%)`}
                data-testid={`bar-segment-${b.id}`}
              />
            );
          })}
        </div>
      </div>

      {/* 4 Interactive Bucket Cards */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {bucketStats.map((b) => {
          const isSelected = selectedBucket === b.id;
          const IconComponent = b.icon;

          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBucket(isSelected ? null : b.id)}
              className={`rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? `${b.bgActive} ${b.borderColor} ring-2 ring-primary/40 shadow-sm`
                  : 'bg-white border-line/60 hover:border-slate-300 hover:shadow-2xs'
              }`}
              data-testid={`bucket-card-${b.id}`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy">
                  <IconComponent className={`h-4 w-4 ${b.textColor}`} />
                  {b.label}
                </span>
                <span
                  className={`rounded-pill px-2 py-0.5 text-[10px] font-bold border ${
                    isSelected
                      ? 'bg-navy text-white border-navy'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isSelected ? 'Filter Aktif' : b.rangeLabel}
                </span>
              </div>

              <div className="mt-2.5">
                <p className="text-lg font-black text-navy">{rupiah(b.amount)}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>{b.count} Dokumen</span>
                  <span className={`font-bold ${b.textColor}`}>
                    {b.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
