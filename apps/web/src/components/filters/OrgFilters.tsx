import { useSearchParams } from 'react-router-dom';

import { DIVISIONS } from '../../config/divisions';
import { useOrgDivisions, useOrgOutlets } from '../../hooks/useOrg';

export function useOrgFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const periodFrom = searchParams.get('from') ?? '';
  const periodTo = searchParams.get('to') ?? '';
  const divisionCode = searchParams.get('divisionCode') ?? '';
  const outletCode = searchParams.get('outletCode') ?? '';

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearAll = () => setSearchParams(new URLSearchParams());

  return {
    periodFrom,
    periodTo,
    divisionCode,
    outletCode,
    setFilter,
    clearAll,
    searchParams,
  };
}

export function OrgFilters() {
  const { periodFrom, periodTo, divisionCode, outletCode, setFilter, clearAll } = useOrgFilters();
  const divisionsQ = useOrgDivisions();
  const outletsQ = useOrgOutlets(divisionCode || undefined);
  // BE real → fallback DIVISIONS statis; outlet real → fallback mock 2 outlet per divisi (placeholderData)
  const divisions = divisionsQ.data ?? DIVISIONS.map((d, i) => ({ code: d.code, name: d.name, isActive: true, sortOrder: i }));
  const outlets = outletsQ.data ?? [];

  return (
    <div className="grid gap-3 p-4 rounded-card-lg border border-line/60 bg-white shadow-card lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
        <span className="uppercase tracking-wider text-slate-400">Periode Dari</span>
        <input
          type="date"
          value={periodFrom}
          onChange={(e) => setFilter('from', e.target.value)}
          className="rounded-input border border-line bg-white px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          data-testid="filter-from"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
        <span className="uppercase tracking-wider text-slate-400">Periode Sampai</span>
        <input
          type="date"
          value={periodTo}
          onChange={(e) => setFilter('to', e.target.value)}
          className="rounded-input border border-line bg-white px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          data-testid="filter-to"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
        <span className="uppercase tracking-wider text-slate-400">Divisi</span>
        <select
          value={divisionCode}
          onChange={(e) => {
            setFilter('divisionCode', e.target.value);
            setFilter('outletCode', ''); // reset outlet when divisi change
          }}
          className="rounded-input border border-line bg-white px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          data-testid="filter-division"
        >
          <option value="">Semua (BOD)</option>
          {divisions.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
        <span className="uppercase tracking-wider text-slate-400">Outlet</span>
        <select
          value={outletCode}
          onChange={(e) => setFilter('outletCode', e.target.value)}
          className="rounded-input border border-line bg-white px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
          data-testid="filter-outlet"
          disabled={!divisionCode}
        >
          <option value="">Semua</option>
          {outlets.map((o) => (
            <option key={o.code} value={o.code}>
              {o.code}
            </option>
          ))}
        </select>
      </label>
      <button onClick={clearAll} className="h-[38px] rounded-input border border-line bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-surface transition-colors" data-testid="filter-clear">
        Clear
      </button>
    </div>
  );
}
