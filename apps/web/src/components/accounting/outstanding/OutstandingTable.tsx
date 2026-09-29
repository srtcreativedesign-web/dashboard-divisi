import { ArrowUpRight, Check, Clock, SearchX, X, XCircle } from "lucide-react";
import { AntiSlopEmptyState } from "../../ui/AntiSlopEmptyState";
import { useTableNavigation } from "../../../hooks/useTableNavigation";

interface OutstandingItem {
  id: string;
  code: string;
  description: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  category: string;
}

interface OutstandingTableProps {
  items: OutstandingItem[];
  onPay: (item: OutstandingItem) => void;
  onCancel: (item: OutstandingItem) => void;
}

const rupiah = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

export function OutstandingTable({
  items,
  onPay,
  onCancel,
}: OutstandingTableProps) {
  const { focusedIndex, containerRef } = useTableNavigation(items.length);

  return (
    <div className="overflow-x-auto" ref={containerRef}>
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-surface/60 text-[11px] font-semibold text-slate-500 uppercase border-b border-line">
          <tr>
            <th className="px-4 py-3">Kode</th>
            <th className="px-4 py-3">Deskripsi Kewajiban</th>
            <th className="px-4 py-3">Jatuh Tempo</th>
            <th className="px-4 py-3 text-right">Nominal Awal</th>
            <th className="px-4 py-3 text-right">Terbayar</th>
            <th className="px-4 py-3 text-right">Sisa Tagihan</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-0">
                <AntiSlopEmptyState
                  title="Data Kosong"
                  description="Tidak ada data kewajiban atau outstanding yang sesuai dengan filter saat ini."
                  icon={<SearchX className="h-8 w-8 text-slate-400" strokeWidth={1.5} />}
                  className="border-0 rounded-none bg-transparent"
                />
              </td>
            </tr>
          ) : (
            items.map((it, idx) => (
              <tr 
                key={it.id} 
                className={`transition ${idx === focusedIndex ? 'bg-primary-light/40' : 'hover:bg-slate-50/80'}`}
              >
                <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                  {it.code}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-navy">{it.description}</p>
                  <p className="text-[10px] text-slate-400">{it.category}</p>
                </td>
                <td className="px-4 py-3 font-mono text-slate-600">
                  {it.dueDate}
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">
                  {rupiah(it.amount)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-success">
                  {it.paidAmount > 0 ? rupiah(it.paidAmount) : "-"}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                  {it.remainingAmount > 0 ? rupiah(it.remainingAmount) : "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      it.status === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : it.status === "partial"
                        ? "bg-primary-light text-primary-dark"
                        : it.status === "cancelled"
                        ? "bg-slate-200 text-slate-600 line-through"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {it.status === "paid" ? (
                      <>
                        <Check className="h-3 w-3" /> Lunas
                      </>
                    ) : it.status === "partial" ? (
                      <>
                        <ArrowUpRight className="h-3 w-3" /> Sebagian
                      </>
                    ) : it.status === "cancelled" ? (
                      <>
                        <XCircle className="h-3 w-3" /> Batal
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" /> Belum Bayar
                      </>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {it.status !== "paid" && it.status !== "cancelled" && (
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPay(it)}
                        className="rounded bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary hover:text-white transition cursor-pointer"
                      >
                        Bayar
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel(it)}
                        title="Batalkan kewajiban"
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
