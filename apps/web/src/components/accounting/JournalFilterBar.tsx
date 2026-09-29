import { Search, Filter, Calendar } from "lucide-react";
import type { AccPeriod } from "../../api/accounting";

interface JournalFilterBarProps {
  periods: AccPeriod[];
  periodId: string;
  setPeriodId: (val: string) => void;
  search: string;
  setSearch: (val: string) => void;
}

export function JournalFilterBar({
  periods,
  periodId,
  setPeriodId,
  search,
  setSearch,
}: JournalFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 rounded-card border border-line bg-white p-4 shadow-sm items-center">
      <div className="flex-1 w-full">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
          Periode Akuntansi
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            aria-label="Periode"
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="w-full rounded-input border border-line py-2 pl-9 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary appearance-none bg-slate-50/50"
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
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
          Cari Jurnal
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ketik deskripsi atau nomor referensi..."
            className="w-full rounded-input border border-line py-2 pl-9 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary bg-slate-50/50"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-end mt-5 sm:mt-0">
        <button className="flex items-center gap-2 rounded-input border border-line bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors h-[38px]">
          <Filter className="h-4 w-4 text-slate-400" />
          Filter Lanjutan
        </button>
      </div>
    </div>
  );
}
