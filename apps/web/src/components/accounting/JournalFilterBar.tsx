import { Search, Calendar } from "lucide-react";
import type { AccPeriod } from "../../api/accounting";

interface JournalFilterBarProps {
  disabled?: boolean;
  periods: AccPeriod[];
  periodId: string;
  setPeriodId: (val: string) => void;
  search: string;
  setSearch: (val: string) => void;
}

export function JournalFilterBar({
  disabled = false,
  periods,
  periodId,
  setPeriodId,
  search,
  setSearch,
}: JournalFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 rounded-card border border-line bg-panel p-4 shadow-sm items-center">
      <div className="flex-1 w-full">
        <label className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1 block">
          Periode Akuntansi
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            aria-label="Periode"
            disabled={disabled}
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="w-full rounded-input border border-line py-2 pl-9 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary appearance-none bg-surface/50"
          >
            {periods.map((p) => (
              <option value={p.id} key={p.id}>
                {p.periodMonth} · {p.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 w-full">
        <label className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1 block">
          Cari Jurnal
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            aria-label="Cari jurnal"
            maxLength={255}
            disabled={disabled}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ketik deskripsi atau nomor referensi..."
            className="w-full rounded-input border border-line py-2 pl-9 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50"
          />
        </div>
      </div>

    </div>
  );
}
