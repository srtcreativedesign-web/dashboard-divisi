import { AlertTriangle, CheckCircle2, CircleDollarSign, CopyCheck, RefreshCw, XCircle } from 'lucide-react';
import { KPICard, KPICardGrid } from '../../ui/primitives';

interface Props { totalRows: number; validCount: number; normalizedCount: number; warningCount: number; duplicateCount: number; errorCount: number; totalDebit: number; totalCredit: number }
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export function ImportSummaryCards({ totalRows, validCount, normalizedCount, warningCount, duplicateCount, errorCount, totalDebit, totalCredit }: Props) {
  return <div className="space-y-4">
    <KPICardGrid columns={4}>
      <KPICard label="Baris terbaca" value={totalRows} note={`${validCount} valid tanpa perubahan`} icon={<CheckCircle2 />} />
      <KPICard label="Dinormalisasi" value={normalizedCount} note="Dipetakan ke kode master" icon={<RefreshCw />} />
      <KPICard label="Perlu telaah" value={warningCount + duplicateCount} note={`${duplicateCount} kandidat duplikat`} icon={duplicateCount ? <CopyCheck /> : <AlertTriangle />} />
      <KPICard label="Baris error" value={errorCount} note={errorCount ? 'Menghalangi commit batch' : 'Tidak ada penghalang'} icon={errorCount ? <XCircle /> : <CheckCircle2 />} />
    </KPICardGrid>
    <div className="grid gap-3 rounded-card-lg border border-line bg-panel p-4 shadow-card sm:grid-cols-2"><div className="flex items-center gap-3"><span className="rounded-card bg-success-light p-2 text-success"><CircleDollarSign className="h-5 w-5" /></span><div><p className="text-xs text-subtle">Total debit sumber</p><p className="font-bold tabular-nums text-navy">{rupiah(totalDebit)}</p></div></div><div className="flex items-center gap-3 sm:border-l sm:border-line sm:pl-4"><span className="rounded-card bg-danger-light p-2 text-danger"><CircleDollarSign className="h-5 w-5" /></span><div><p className="text-xs text-subtle">Total kredit sumber</p><p className="font-bold tabular-nums text-navy">{rupiah(totalCredit)}</p></div></div></div>
  </div>;
}
