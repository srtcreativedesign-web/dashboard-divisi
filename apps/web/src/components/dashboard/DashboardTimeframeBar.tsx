import React from 'react';
import { Calendar } from 'lucide-react';
import { type PeriodFilterOption } from '../filters/StickyContextFilterBar';

export interface DashboardTimeframeBarProps {
  activePeriod: PeriodFilterOption;
  periodLabel: string;
  onPeriodChange: (period: PeriodFilterOption) => void;
}

const TIMEFRAME_OPTIONS: Array<{ key: PeriodFilterOption; label: string }> = [
  { key: 'today', label: 'Hari Ini' },
  { key: '7d', label: '7 Hari' },
  { key: 'month', label: 'Bulan Ini' },
  { key: 'ytd', label: 'Setahun (YTD)' },
];

export function DashboardTimeframeBar({
  activePeriod,
  periodLabel,
  onPeriodChange,
}: DashboardTimeframeBarProps) {
  return (
    <section
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/95 backdrop-blur-md p-4 rounded-card-lg border border-line/60 shadow-xs"
      data-testid="dashboard-timeframe-bar"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary-700">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rentang Waktu Laporan</span>
            <span className="rounded-pill bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200">
              Data Riil
            </span>
          </div>
          <p className="text-sm font-bold text-navy" data-testid="dashboard-active-period-label">
            {periodLabel}
          </p>
        </div>
      </div>

      {/* Timeframe Switcher Tabs */}
      <div
        className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto"
        role="group"
        aria-label="Pilih Rentang Waktu Dashboard"
      >
        {TIMEFRAME_OPTIONS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onPeriodChange(p.key)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activePeriod === p.key
                ? 'bg-white text-navy shadow-xs border border-line/40'
                : 'text-slate-600 font-medium hover:text-navy hover:bg-white/50'
            }`}
            data-testid={`timeframe-tab-${p.key}`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </section>
  );
}
