import { Search } from "lucide-react";

export interface ExpenseCategory {
  group: string;
  groupLabel: string;
  code: string;
  name: string;
  amount: number;
}

interface CashflowExplanationTabProps {
  categories: ExpenseCategory[];
  selectedGroup: "ALL" | "B" | "C" | "D";
  setSelectedGroup: (val: "ALL" | "B" | "C" | "D") => void;
  searchCategory: string;
  setSearchCategory: (val: string) => void;
}

const rupiah = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

export function CashflowExplanationTab({
  categories,
  selectedGroup,
  setSelectedGroup,
  searchCategory,
  setSearchCategory,
}: CashflowExplanationTabProps) {
  const filteredCategories = categories.filter((item) => {
    const matchGroup = selectedGroup === "ALL" || item.group === selectedGroup;
    const matchSearch =
      item.name.toLowerCase().includes(searchCategory.toLowerCase()) ||
      item.code.toLowerCase().includes(searchCategory.toLowerCase());
    return matchGroup && matchSearch;
  });

  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-card space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Grup:
          </span>
          <button
            type="button"
            onClick={() => setSelectedGroup("ALL")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              selectedGroup === "ALL"
                ? "bg-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedGroup("B")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              selectedGroup === "B"
                ? "bg-success text-white"
                : "bg-success-light text-success hover:bg-success/20"
            }`}
          >
            B. Pendapatan
          </button>
          <button
            type="button"
            onClick={() => setSelectedGroup("C")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              selectedGroup === "C"
                ? "bg-danger text-white"
                : "bg-danger-light text-danger hover:bg-danger/20"
            }`}
          >
            C. Biaya Operasional
          </button>
          <button
            type="button"
            onClick={() => setSelectedGroup("D")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              selectedGroup === "D"
                ? "bg-warning text-navy"
                : "bg-warning-light text-warning hover:bg-warning/20"
            }`}
          >
            D. Biaya Back Office
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari akun / kode..."
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            className="rounded-input border border-line pl-8 pr-3 py-1.5 text-xs focus:border-primary focus:outline-none w-48 sm:w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full text-left text-xs" role="table">
          <thead className="bg-slate-50 border-b border-line text-slate-600">
            <tr>
              <th scope="col" className="p-2.5 font-semibold">
                Kode
              </th>
              <th scope="col" className="p-2.5 font-semibold">
                Kelompok
              </th>
              <th scope="col" className="p-2.5 font-semibold">
                Nama Pos Akun
              </th>
              <th scope="col" className="p-2.5 text-right font-semibold">
                Realisasi Aktual (Rp)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filteredCategories.map((cat) => (
              <tr key={cat.code} className="hover:bg-slate-50/50">
                <td className="p-2.5 font-mono font-bold text-navy">
                  {cat.code}
                </td>
                <td className="p-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      cat.group === "B"
                        ? "bg-success-light text-success"
                        : cat.group === "C"
                        ? "bg-danger-light text-danger"
                        : "bg-warning-light text-warning"
                    }`}
                  >
                    {cat.groupLabel}
                  </span>
                </td>
                <td className="p-2.5 font-medium text-slate-800">{cat.name}</td>
                <td
                  className={`p-2.5 text-right font-mono font-semibold ${
                    cat.amount > 0
                      ? cat.group === "B"
                        ? "text-success"
                        : "text-slate-900"
                      : "text-slate-300"
                  }`}
                >
                  {cat.amount > 0 ? rupiah(cat.amount) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
