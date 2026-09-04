import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Building2,
  RotateCcw,
  Search,
  Layers,
  Filter,
  Check,
} from 'lucide-react';
import { DIVISIONS } from '../../config/divisions';

export type PeriodFilterOption = 'today' | '7d' | 'month' | 'ytd';

export interface StickyContextFilterBarProps {
  period?: PeriodFilterOption;
  onPeriodChange?: (period: PeriodFilterOption) => void;
  division?: string;
  onDivisionChange?: (divisionCode: string) => void;
  onResetFilters?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenDetailSheet?: () => void;
}

const PERIOD_OPTIONS: Array<{ id: PeriodFilterOption; label: string; shortLabel: string }> = [
  { id: 'today', label: 'Hari Ini', shortLabel: 'Hari Ini' },
  { id: '7d', label: '7 Hari Terakhir', shortLabel: '7 Hari' },
  { id: 'month', label: 'Bulan Ini (Sep 2026)', shortLabel: 'Bulan Ini' },
  { id: 'ytd', label: 'Tahun Berjalan (YTD)', shortLabel: 'Q3 YTD' },
];

export function StickyContextFilterBar({
  period: controlledPeriod,
  onPeriodChange,
  division: controlledDivision,
  onDivisionChange,
  onResetFilters,
  onOpenCommandPalette,
  onOpenDetailSheet,
}: StickyContextFilterBarProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Internal state fallback if uncontrolled
  const [internalPeriod, setInternalPeriod] = useState<PeriodFilterOption>(() => {
    const urlPeriod = searchParams.get('period');
    if (urlPeriod && ['today', '7d', 'month', 'ytd'].includes(urlPeriod)) {
      return urlPeriod as PeriodFilterOption;
    }
    return 'month';
  });

  const [internalDivision, setInternalDivision] = useState<string>(() => {
    return searchParams.get('divisionCode') || 'ALL';
  });

  const activePeriod = controlledPeriod ?? internalPeriod;
  const activeDivision = controlledDivision ?? internalDivision;

  // Sync state with URL params
  const handlePeriodSelect = (p: PeriodFilterOption) => {
    if (onPeriodChange) {
      onPeriodChange(p);
    } else {
      setInternalPeriod(p);
      const next = new URLSearchParams(searchParams);
      if (p !== 'month') {
        next.set('period', p);
      } else {
        next.delete('period');
      }
      setSearchParams(next);
    }
  };

  const handleDivisionChange = (div: string) => {
    if (onDivisionChange) {
      onDivisionChange(div);
    } else {
      setInternalDivision(div);
      const next = new URLSearchParams(searchParams);
      if (div && div !== 'ALL') {
        next.set('divisionCode', div);
      } else {
        next.delete('divisionCode');
      }
      setSearchParams(next);
    }
  };

  const isFiltered = activePeriod !== 'month' || (activeDivision !== 'ALL' && activeDivision !== '');

  const handleReset = () => {
    if (onResetFilters) {
      onResetFilters();
    } else {
      setInternalPeriod('month');
      setInternalDivision('ALL');
      const next = new URLSearchParams(searchParams);
      next.delete('period');
      next.delete('divisionCode');
      setSearchParams(next);
    }
  };


  const activeDivisionName =
    activeDivision === 'ALL' || !activeDivision
      ? 'Semua Divisi'
      : DIVISIONS.find((d) => d.code === activeDivision)?.name ?? activeDivision;

  const activePeriodObj = PERIOD_OPTIONS.find((p) => p.id === activePeriod) ?? PERIOD_OPTIONS[2]!;

  return (
    <nav
      aria-label="Penyaring Kontekstual"
      data-testid="sticky-context-filter-bar"
      className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-2xs px-3 sm:px-6 py-2 transition-all duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        {/* Left side: Context Pills (Period + Division) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {/* Period selector pills */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-2xs">
            <span className="hidden md:flex items-center pl-2 pr-1 text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
            </span>
            {PERIOD_OPTIONS.map((opt) => {
              const isActive = activePeriod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handlePeriodSelect(opt.id)}
                  aria-pressed={isActive}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-sky-800 shadow-xs border border-sky-200/70 ring-1 ring-sky-300/40'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  data-testid={`filter-period-${opt.id}`}
                >
                  {isActive && <Check className="h-3 w-3 text-sky-600" />}
                  <span className="hidden sm:inline">{opt.label}</span>
                  <span className="sm:hidden">{opt.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Division Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1 shadow-2xs">
            <Building2 className="h-3.5 w-3.5 text-sky-700 shrink-0" />
            <label htmlFor="sticky-division-select" className="sr-only">
              Pilih Divisi
            </label>
            <select
              id="sticky-division-select"
              value={activeDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer pr-1"
              data-testid="sticky-filter-division"
            >
              <option value="ALL">Semua Divisi (Konsolidasi)</option>
              {DIVISIONS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Active indicator & Reset button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleReset}
              title="Reset ke pengaturan default (Bulan Ini · Semua Divisi)"
              className="flex items-center gap-1 rounded-lg bg-sky-50 border border-sky-200 px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100 hover:text-sky-900 transition-colors shrink-0 active:scale-95"
              data-testid="sticky-filter-reset"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Right side: Quick Action shortcuts (Command Palette & Detail Sheet) */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Active Context Tag */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1">
            <Filter className="h-3 w-3 text-slate-400" />
            <span>Scope:</span>
            <span className="font-semibold text-sky-800">{activePeriodObj.shortLabel}</span>
            <span>·</span>
            <span className="font-semibold text-slate-700">{activeDivisionName}</span>
          </div>

          {/* Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              title="Buka Command Palette (Ctrl+K)"
              className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 px-2.5 py-1 text-xs font-medium text-sky-800 transition-all shadow-2xs active:scale-95"
              data-testid="sticky-filter-open-palette"
            >
              <Search className="h-3.5 w-3.5 text-sky-600" />
              <span className="hidden sm:inline">Perintah</span>
              <kbd className="hidden md:inline-flex items-center rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-sky-700 border border-sky-200">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Detail Sheet Trigger */}
          {onOpenDetailSheet && (
            <button
              type="button"
              onClick={onOpenDetailSheet}
              title="Buka Panel Rincian Cepat (Ctrl+D)"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-all shadow-2xs active:scale-95"
              data-testid="sticky-filter-open-sheet"
            >
              <Layers className="h-3.5 w-3.5 text-sky-700" />
              <span className="hidden sm:inline">Rincian</span>
              <kbd className="hidden md:inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 border border-slate-200">
                ⌘D
              </kbd>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
