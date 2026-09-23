import { ShieldCheck } from "lucide-react";

interface ImportCommitBarProps {
  activePeriodMonth: string;
  onReset: () => void;
  onCommit: () => Promise<void>;
  isCommitted: boolean;
  hasErrors: boolean;
  isPending: boolean;
  stagedRowsCount: number;
}

export function ImportCommitBar({
  activePeriodMonth,
  onReset,
  onCommit,
  isCommitted,
  hasErrors,
  isPending,
  stagedRowsCount,
}: ImportCommitBarProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-line bg-surface/30 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold text-navy">
          Siap commit ke periode{" "}
          <span className="text-primary">{activePeriodMonth}</span>
        </p>
        <p className="text-[11px] text-slate-500">
          Transaksi commit bersifat all-or-nothing. Jika terjadi galat sistem,
          seluruh batch dibatalkan.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="rounded-card border border-line bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-surface cursor-pointer transition"
        >
          Batalkan Staging
        </button>
        <button
          type="button"
          disabled={isCommitted || hasErrors || isPending}
          onClick={onCommit}
          className={`inline-flex items-center gap-2 rounded-card px-5 py-2 text-xs font-semibold text-white shadow transition ${
            isCommitted
              ? "bg-emerald-600 cursor-default"
              : hasErrors
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-primary hover:bg-primary-dark cursor-pointer"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          {isCommitted
            ? "✓ Berhasil Di-commit"
            : isPending
            ? "Menyimpan ke Database..."
            : `Commit ${stagedRowsCount} Transaksi`}
        </button>
      </div>
    </div>
  );
}
