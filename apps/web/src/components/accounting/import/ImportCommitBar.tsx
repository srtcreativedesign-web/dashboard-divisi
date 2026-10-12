import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '../../ui/Button';

interface Props { activePeriodMonth: string; onReset: () => void; onCommit: () => Promise<void>; isCommitted: boolean; hasErrors: boolean; isPending: boolean; stagedRowsCount: number; duplicateCount: number; duplicateAccepted: boolean; onDuplicateAccepted: (value: boolean) => void }

export function ImportCommitBar({ activePeriodMonth, onReset, onCommit, isCommitted, hasErrors, isPending, stagedRowsCount, duplicateCount, duplicateAccepted, onDuplicateAccepted }: Props) {
  const blocked = hasErrors || (duplicateCount > 0 && !duplicateAccepted);
  return <div className="border-t border-line bg-surface/40 p-4 sm:p-5">
    {duplicateCount > 0 && <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-card border border-warning/30 bg-warning-light p-3"><input type="checkbox" checked={duplicateAccepted} onChange={event => onDuplicateAccepted(event.target.checked)} disabled={isCommitted || isPending} className="mt-0.5 h-4 w-4 rounded" /><span><span className="flex items-center gap-1.5 text-xs font-bold text-warning-dark"><AlertTriangle className="h-4 w-4" />Saya sudah menelaah {duplicateCount} kandidat duplikat</span><span className="mt-1 block text-[11px] text-warning-dark">Konfirmasi ini tidak menghapus baris; seluruh baris yang lolos tetap akan dicatat.</span></span></label>}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold text-navy">Tujuan: <span className="text-primary">{activePeriodMonth}</span></p><p className="mt-1 text-[11px] text-subtle">Commit bersifat all-or-nothing. Status berhasil hanya tampil setelah server menyimpan batch.</p></div><div className="flex gap-2"><Button type="button" variant="secondary" onClick={onReset} disabled={isPending}>Batalkan staging</Button><Button type="button" disabled={isCommitted || blocked || isPending} onClick={() => void onCommit()} className="gap-2"><ShieldCheck className="h-4 w-4" />{isCommitted ? 'Berhasil dicatat' : isPending ? 'Menyimpan…' : `Commit ${stagedRowsCount} transaksi`}</Button></div></div>
  </div>;
}
