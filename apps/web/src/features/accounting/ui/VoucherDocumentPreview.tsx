import type { VoucherRecord } from '../../../api/vouchers';
import { formatRupiah } from '../../../utils/format';
import { voucherDocumentRows, voucherTerbilang, voucherStatusNames } from './voucherDocument';

export function VoucherDocument({ record }: { record: VoucherRecord }) {
  return <article aria-label="Pratinjau voucher pengeluaran" className="space-y-5 rounded-xl border border-line bg-panel p-5 sm:p-7">
    <header className="border-b border-line pb-4"><p className="text-xs font-semibold uppercase tracking-wider text-subtle">Dokumen pengajuan internal</p><h3 className="mt-2 text-xl font-bold">Voucher Pengajuan Pengeluaran</h3><p className="mt-2 inline-block rounded bg-surface px-3 py-1 text-xs font-bold">{voucherStatusNames[record.status]} · Versi {record.version}</p></header>
    <dl className="grid gap-3 sm:grid-cols-2">{voucherDocumentRows(record).map(([label,value])=><div key={label}><dt className="text-xs text-subtle">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>)}</dl>
    <section className="rounded-lg border border-line p-4"><h4 className="font-semibold">Uraian pengeluaran</h4><p className="mt-2 whitespace-pre-wrap text-sm">{record.description}</p><p className="mt-4 text-2xl font-bold tabular-nums">{formatRupiah(record.amount)}</p><p className="mt-2 text-sm text-muted">Terbilang: {voucherTerbilang(record.amount)}</p></section>
    <div className="grid gap-3 sm:grid-cols-3">{[['Dibuat Admin',record.created_at],['Diperiksa Accounting',record.reviewed_at],['Disetujui Manager',record.approved_at]].map(([label,time])=><div key={label} className="rounded-lg border border-line p-3"><p className="text-xs font-semibold">{label}</p><p className="mt-2 text-xs text-subtle">{time || 'Belum tercatat'}</p></div>)}</div>
    <p className="border-t border-line pt-4 text-xs text-subtle">Voucher ini merupakan pengajuan pengeluaran. Persetujuan belum menyatakan dana telah dibayar. Jejak sistem bukan tanda tangan elektronik.</p>
  </article>;
}
