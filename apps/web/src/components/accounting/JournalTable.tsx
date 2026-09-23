import type { AccTransaction } from "../../api/accounting";
import { ChevronLeft, ChevronRight, FileUp, FileDown, Edit2, XCircle } from "lucide-react";
import { useTableNavigation } from "../../hooks/useTableNavigation";

const money = (v: number | string) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(v));

interface JournalTableProps {
  transactions: AccTransaction[];
  canWrite: boolean;
  onEdit: (tx: AccTransaction) => void;
  onCancel: (tx: AccTransaction) => void;
  onUpload: (tx: AccTransaction, file?: File) => void;
  onDownload: (tx: AccTransaction, attachmentId: string, fileName: string) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalEntries: number;
}

export function JournalTable({
  transactions,
  canWrite,
  onEdit,
  onCancel,
  onUpload,
  onDownload,
  page,
  setPage,
  totalPages,
  totalEntries,
}: JournalTableProps) {
  const { focusedIndex, containerRef } = useTableNavigation(transactions.length);

  return (
    <div className="rounded-card border border-line bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto" ref={containerRef}>
        <table className="min-w-[900px] w-full text-left text-sm relative">
          <thead>
            <tr className="border-b border-line bg-surface">
              <th className="p-3 font-semibold text-slate-700 sticky left-0 z-10 bg-surface shadow-[1px_0_0_0_#e2e8f0]">Tanggal</th>
              <th className="font-semibold text-slate-700">Deskripsi</th>
              <th className="text-right font-semibold text-slate-700">Debit</th>
              <th className="text-right font-semibold text-slate-700">Kredit</th>
              <th className="text-right font-semibold text-slate-700">Saldo</th>
              <th className="font-semibold text-slate-700">Bukti</th>
              <th className="font-semibold text-slate-700 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr
                key={tx.id}
                className={`border-b border-line transition-colors ${
                  idx === focusedIndex ? "bg-primary-light/40" : "hover:bg-slate-50"
                } ${tx.isCancelled ? "opacity-50 bg-slate-50/50" : ""}`}
              >
                <td className={`p-3 whitespace-nowrap sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0] ${idx === focusedIndex ? "bg-[#f2f8fc]" : "bg-white"}`}>
                  {tx.transactionDate.slice(0, 10)}
                </td>
                <td className="max-w-xs truncate">
                  {tx.description}
                  {tx.isCancelled && (
                    <span className="ml-2 inline-flex items-center rounded-md bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                      Dibatalkan
                    </span>
                  )}
                  {tx.referenceNo && (
                    <div className="text-xs text-slate-400 mt-0.5">Ref: {tx.referenceNo}</div>
                  )}
                </td>
                <td className="text-right font-mono text-emerald-600">{money(tx.debitAmount)}</td>
                <td className="text-right font-mono text-rose-600">{money(tx.creditAmount)}</td>
                <td className="text-right font-mono font-medium text-navy">
                  {money(tx.runningBalance ?? 0)}
                </td>
                <td>
                  <div className="flex flex-col gap-1 items-start">
                    {tx.attachments?.map((a) => (
                      <button
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        key={a.id}
                        onClick={() => onDownload(tx, a.id, a.fileName)}
                        title={a.fileName}
                      >
                        <FileDown className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{a.fileName}</span>
                      </button>
                    ))}
                    {canWrite && !tx.isCancelled && (
                      <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors mt-1">
                        <FileUp className="h-3 w-3" />
                        <span>Unggah</span>
                        <input
                          aria-label={`Unggah bukti ${tx.description}`}
                          className="sr-only"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => onUpload(tx, e.target.files?.[0])}
                        />
                      </label>
                    )}
                  </div>
                </td>
                <td className="text-center">
                  <div className="flex justify-center items-center gap-2">
                    {canWrite && !tx.isCancelled && (
                      <>
                        <button
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-sky-50 rounded-md transition-colors"
                          onClick={() => onEdit(tx)}
                          title="Edit Jurnal"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-slate-400 hover:text-danger hover:bg-rose-50 rounded-md transition-colors"
                          onClick={() => onCancel(tx)}
                          title="Batalkan Jurnal"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="flex flex-col md:hidden divide-y divide-line">
        {transactions.map((tx) => (
          <div key={tx.id} className={`p-4 flex flex-col gap-3 ${tx.isCancelled ? "opacity-50" : ""}`}>
            <div className="flex justify-between items-start">
              <div className="font-semibold text-navy text-sm">
                {tx.description}
                {tx.isCancelled && <span className="ml-2 text-xs text-danger font-medium">Dibatalkan</span>}
              </div>
              <div className="text-xs text-slate-500">{tx.transactionDate.slice(0, 10)}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-surface rounded-md p-2">
                <div className="text-xs text-slate-500">Debit</div>
                <div className="font-mono text-emerald-600">{money(tx.debitAmount)}</div>
              </div>
              <div className="bg-surface rounded-md p-2">
                <div className="text-xs text-slate-500">Kredit</div>
                <div className="font-mono text-rose-600">{money(tx.creditAmount)}</div>
              </div>
              <div className="col-span-2 bg-slate-50 rounded-md p-2 border border-slate-100">
                <div className="text-xs text-slate-500">Saldo Akhir</div>
                <div className="font-mono font-semibold text-navy">{money(tx.runningBalance ?? 0)}</div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-1">
              <div className="flex flex-wrap gap-2 text-xs">
                {tx.attachments?.map((a) => (
                  <button className="text-primary hover:underline flex items-center gap-1" key={a.id} onClick={() => onDownload(tx, a.id, a.fileName)}>
                    <FileDown className="h-3 w-3" /> {a.fileName}
                  </button>
                ))}
                {canWrite && !tx.isCancelled && (
                  <label className="cursor-pointer text-slate-500 hover:text-primary font-medium flex items-center gap-1">
                    <FileUp className="h-3 w-3" /> Tambah Bukti
                    <input className="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => onUpload(tx, e.target.files?.[0])} />
                  </label>
                )}
              </div>
              
              {canWrite && !tx.isCancelled && (
                <div className="flex gap-3 text-xs">
                  <button className="text-primary font-medium" onClick={() => onEdit(tx)}>Edit</button>
                  <button className="text-danger font-medium" onClick={() => onCancel(tx)}>Batal</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between border-t border-line bg-surface/50 px-4 py-3 sm:px-6">
          <div className="hidden sm:block">
            <p className="text-sm text-slate-700">
              Menampilkan <span className="font-medium">{totalEntries}</span> hasil
            </p>
          </div>
          <div className="flex flex-1 justify-between sm:justify-end gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-offset-0"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Sebel.
            </button>
            <div className="flex items-center px-4 text-sm font-medium text-slate-700">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-offset-0"
            >
              Lanjut
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
