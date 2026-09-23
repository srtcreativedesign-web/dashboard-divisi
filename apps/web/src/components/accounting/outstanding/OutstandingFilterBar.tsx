import { Search } from "lucide-react";

interface OutstandingFilterBarProps {
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  search: string;
  setSearch: (val: string) => void;
}

const STATUS_FILTERS = [
  { id: "all", label: "Semua" },
  { id: "unpaid", label: "Belum Bayar" },
  { id: "partial", label: "Sebagian" },
  { id: "paid", label: "Lunas" },
  { id: "cancelled", label: "Dibatalkan" },
];

export function OutstandingFilterBar({
  filterStatus,
  setFilterStatus,
  search,
  setSearch,
}: OutstandingFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase mr-1">
          Status:
        </span>
        {STATUS_FILTERS.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => setFilterStatus(st.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filterStatus === st.id
                ? "bg-navy text-white shadow-sm"
                : "bg-surface text-slate-600 hover:bg-slate-200"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari deskripsi / kode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-card border border-line pl-9 pr-3 py-1.5 text-xs text-navy focus:border-primary focus:outline-none bg-slate-50/50"
        />
      </div>
    </div>
  );
}
