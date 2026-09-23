import { Filter, Search, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react";

export interface DisplayRow {
  rowNum: number;
  date: string;
  refNo: string;
  account: string;
  rawCategory: string;
  normalizedCategory: string;
  description: string;
  debit: number;
  credit: number;
  status: "valid" | "normalized" | "duplicate_warning" | "error";
  notes: string;
}

interface ImportStagingTableProps {
  rows: DisplayRow[];
  filterStatus: "all" | "valid" | "normalized" | "duplicate_warning" | "error";
  setFilterStatus: (
    val: "all" | "valid" | "normalized" | "duplicate_warning" | "error"
  ) => void;
  search: string;
  setSearch: (val: string) => void;
  validCount: number;
  normalizedCount: number;
  warnCount: number;
}

const rupiah = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

export function ImportStagingTable({
  rows,
  filterStatus,
  setFilterStatus,
  search,
  setSearch,
  validCount,
  normalizedCount,
  warnCount,
}: ImportStagingTableProps) {
  const filteredRows = rows.filter((row) => {
    const matchStatus = filterStatus === "all" || row.status === filterStatus;
    const matchSearch =
      row.description.toLowerCase().includes(search.toLowerCase()) ||
      row.refNo.toLowerCase().includes(search.toLowerCase()) ||
      row.account.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 mr-1" />
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filterStatus === "all"
                ? "bg-navy text-white"
                : "bg-surface text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("valid")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filterStatus === "valid"
                ? "bg-emerald-600 text-white"
                : "bg-surface text-slate-600 hover:bg-slate-200"
            }`}
          >
            Valid ({validCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("normalized")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filterStatus === "normalized"
                ? "bg-primary text-white"
                : "bg-surface text-slate-600 hover:bg-slate-200"
            }`}
          >
            Dinormalisasi ({normalizedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("duplicate_warning")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filterStatus === "duplicate_warning"
                ? "bg-amber-600 text-white"
                : "bg-surface text-slate-600 hover:bg-slate-200"
            }`}
          >
            Warning Duplikat ({warnCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-card border border-line pl-9 pr-3 py-1.5 text-xs text-navy focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-surface/60 text-[11px] font-semibold text-slate-500 uppercase border-b border-line">
            <tr>
              <th className="px-4 py-3">Baris</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">No Ref</th>
              <th className="px-4 py-3">Rekening Bank</th>
              <th className="px-4 py-3">Kategori Asli &rarr; Hasil</th>
              <th className="px-4 py-3">Deskripsi Transaksi</th>
              <th className="px-4 py-3 text-right">Debit</th>
              <th className="px-4 py-3 text-right">Kredit</th>
              <th className="px-4 py-3">Status Validasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filteredRows.map((r) => (
              <tr key={r.rowNum} className="hover:bg-slate-50/80 transition">
                <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                  #{r.rowNum}
                </td>
                <td className="px-4 py-3 font-mono text-slate-700">{r.date}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                  {r.refNo}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-700">
                  {r.account}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-400">
                      {r.rawCategory}
                    </span>
                    <span className="text-slate-300">&rarr;</span>
                    <span className="font-mono font-bold text-navy bg-slate-100 px-1.5 py-0.5 rounded">
                      {r.normalizedCategory}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-navy">
                  {r.description}
                </td>
                <td className="px-4 py-3 text-right font-mono text-emerald-600">
                  {r.debit > 0 ? rupiah(r.debit) : "-"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-rose-600">
                  {r.credit > 0 ? rupiah(r.credit) : "-"}
                </td>
                <td className="px-4 py-3">
                  {r.status === "valid" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" /> Valid
                    </span>
                  )}
                  {r.status === "normalized" && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary-dark"
                      title={r.notes}
                    >
                      <RefreshCw className="h-3 w-3" /> Canonicalized
                    </span>
                  )}
                  {r.status === "duplicate_warning" && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                      title={r.notes}
                    >
                      <AlertTriangle className="h-3 w-3" /> Warning
                    </span>
                  )}
                  {r.status === "error" && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800"
                      title={r.notes}
                    >
                      Error
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
