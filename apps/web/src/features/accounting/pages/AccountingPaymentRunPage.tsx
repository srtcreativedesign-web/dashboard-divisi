import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarClock, CheckCircle2, CircleDollarSign, RefreshCw, Search, ShieldCheck, TriangleAlert, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { voucherApi, type VoucherRecord } from '../../../api/vouchers';
import { Button } from '../../../components/ui/Button';
import { AccountingPageHeader } from '../../../components/accounting/AccountingPageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../../components/states';
import { dashboardApi } from '../api/dashboard';
import { formatDate, formatRupiah } from '../ui/format';

type PaymentFilter = 'OPEN' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
const currentMonth = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7);
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const field = 'min-h-11 rounded-input border border-line bg-panel px-3 text-sm text-navy outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100';
const paymentNames = { UNPAID: 'Belum direalisasi', PARTIAL: 'Sebagian', PAID: 'Lunas' } as const;
const priorityNames = { URGENT: 'Mendesak', NORMAL: 'Normal', SCHEDULED: 'Terjadwal' } as const;

const paymentStatus = (record: VoucherRecord) => record.payment_summary?.status ?? 'UNPAID';
const remaining = (record: VoucherRecord) => record.payment_summary?.remaining_amount ?? record.amount;
const isOverdue = (record: VoucherRecord) => paymentStatus(record) !== 'PAID' && record.due_date < today();

export default function AccountingPaymentRunPage() {
  const [month, setMonth] = useState(currentMonth);
  const [outlet, setOutlet] = useState('');
  const [filter, setFilter] = useState<PaymentFilter>('OPEN');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const operations = useQuery({ queryKey: ['accounting', 'payment-run', 'summary', month], queryFn: async () => (await dashboardApi.operations(month)).data });
  const directory = useQuery({ queryKey: ['vouchers', 'outlets'], queryFn: async () => (await voucherApi.outlets()).data });
  const vouchers = useQuery({ queryKey: ['accounting', 'payment-run', month, outlet, page], queryFn: async () => (await voucherApi.list({ month, outlet_id: outlet, status: 'approved', type: '', page: String(page) })).data });
  const rows = useMemo(() => (vouchers.data?.items ?? []).filter(record => {
    const status = paymentStatus(record);
    const matchesFilter = filter === 'OPEN' ? status !== 'PAID' : filter === 'OVERDUE' ? isOverdue(record) : status === filter;
    const needle = search.trim().toLowerCase();
    return matchesFilter && (!needle || `${record.voucher_no} ${record.source_reference} ${record.entity_name} ${record.outlet_name}`.toLowerCase().includes(needle));
  }).sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)) || a.due_date.localeCompare(b.due_date)), [filter, search, vouchers.data]);
  const failure = operations.error ?? directory.error ?? vouchers.error;
  const refresh = () => { void operations.refetch(); void directory.refetch(); void vouchers.refetch(); };

  return <div className="space-y-6 pb-10 animate-fade-in">
    <AccountingPageHeader area="Tagihan & Pembayaran · Finance" title="Payment Run" description="Susun prioritas voucher disetujui, pantau jatuh tempo dan sisa, lalu catat realisasi beserta bukti pada dokumen sumber." actions={<><label className="text-xs font-semibold text-subtle">Periode<input aria-label="Periode payment run" type="month" className={`${field} mt-1 block`} value={month} onChange={event => { setMonth(event.target.value); setPage(1); }} /></label><Button variant="secondary" onClick={refresh}><RefreshCw aria-hidden="true" className="h-4 w-4" />Muat ulang</Button></>} />

    {operations.isLoading ? <LoadingState label="Menyusun ringkasan payment run…" /> : operations.error ? <ErrorState title="Ringkasan pembayaran gagal dimuat" description={operations.error.message} onRetry={() => void operations.refetch()} /> : operations.data && <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan payment run">
      <Metric label="Disetujui" value={formatRupiah(operations.data.approved_amount)} note={`${operations.data.counts.approved} voucher`} icon={<ShieldCheck />} primary />
      <Metric label="Sudah direalisasi" value={formatRupiah(operations.data.paid_amount)} note={`${operations.data.paid_count} voucher lunas`} icon={<CheckCircle2 />} />
      <Metric label="Sisa payment run" value={formatRupiah(operations.data.remaining_amount)} note={`${operations.data.unpaid_count} voucher masih terbuka`} icon={<WalletCards />} />
      <Metric label="Lewat jatuh tempo" value={String(operations.data.overdue_count)} note="Perlu diprioritaskan Finance" icon={<TriangleAlert />} danger={operations.data.overdue_count > 0} />
    </section>}

    <section className="rounded-card border border-primary-200 bg-primary-50/60 p-5 dark:border-primary-800 dark:bg-primary-950/30" aria-label="Batas fungsi payment run">
      <div className="flex gap-3"><CircleDollarSign aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary-700 dark:text-primary-300" /><div><h2 className="font-bold text-navy">Payment Run adalah daftar kerja realisasi</h2><p className="mt-1 text-sm leading-6 text-subtle">ERP mencatat pembayaran yang sudah dilakukan melalui kanal perusahaan dan mewajibkan bukti. Halaman ini tidak mengirim dana atau menyatakan saldo bank telah terverifikasi.</p></div></div>
    </section>

    <section className="overflow-hidden rounded-card border border-line bg-panel shadow-card" aria-label="Daftar payment run">
      <div className="grid gap-3 border-b border-line p-5 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto]">
        <label className="text-xs font-semibold text-subtle">Outlet<select aria-label="Outlet payment run" className={`${field} mt-1 w-full`} value={outlet} onChange={event => { setOutlet(event.target.value); setPage(1); }}><option value="">Semua outlet dalam akses Anda</option>{directory.data?.map(item => <option key={item.id} value={item.id}>{item.name} · {item.divisionCode}</option>)}</select></label>
        <label className="relative text-xs font-semibold text-subtle">Cari dokumen<Search aria-hidden="true" className="absolute bottom-3 left-3 h-4 w-4 text-muted" /><input aria-label="Cari payment run" className={`${field} mt-1 w-full pl-9`} placeholder="Voucher, penerima, referensi" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <div className="flex items-end"><span className="inline-flex min-h-11 items-center rounded-input bg-surface px-3 text-xs font-semibold text-subtle"><CalendarClock aria-hidden="true" className="mr-2 h-4 w-4" />Urut risiko & jatuh tempo</span></div>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-line bg-surface p-2" aria-label="Filter status pembayaran">{(['OPEN','UNPAID','PARTIAL','PAID','OVERDUE'] as PaymentFilter[]).map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-10 rounded-input px-3 text-xs font-semibold ${filter === value ? 'bg-panel text-primary-700 shadow-sm dark:text-primary-300' : 'text-subtle hover:bg-panel'}`}>{value === 'OPEN' ? 'Perlu realisasi' : value === 'OVERDUE' ? 'Lewat jatuh tempo' : paymentNames[value]}</button>)}</div>
      {failure ? <ErrorState title="Payment run gagal dimuat" description={failure.message} onRetry={refresh} /> : vouchers.isLoading || directory.isLoading ? <LoadingState label="Memuat voucher disetujui…" /> : rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-sm"><caption className="sr-only">Voucher disetujui untuk realisasi Finance</caption><thead className="border-b border-line bg-surface text-[10px] uppercase tracking-wider text-subtle"><tr><th className="px-5 py-3">Prioritas</th><th>Voucher / sumber</th><th>Penerima / outlet</th><th>Jatuh tempo</th><th className="text-right">Nominal</th><th className="text-right">Sisa</th><th>Status</th><th className="pr-5">Tindakan</th></tr></thead><tbody className="divide-y divide-line">{rows.map(record => <PaymentRow key={record.id} record={record} month={month} />)}</tbody></table></div> : <EmptyState title="Tidak ada voucher pada filter ini" description="Ubah status, pencarian, outlet, atau periode. Antrean kosong tidak membuktikan tidak ada kewajiban pada periode lain." />}
      {vouchers.data && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-xs text-subtle"><span>{vouchers.data.total} voucher disetujui · halaman {vouchers.data.current_page} dari {vouchers.data.last_page}</span><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page <= 1 || vouchers.isFetching} onClick={() => setPage(value => value - 1)}>Sebelumnya</Button><Button size="sm" variant="secondary" disabled={page >= vouchers.data.last_page || vouchers.isFetching} onClick={() => setPage(value => value + 1)}>Berikutnya</Button></div></footer>}
    </section>
  </div>;
}

function PaymentRow({ record, month }: { record: VoucherRecord; month: string }) {
  const status = paymentStatus(record); const overdue = isOverdue(record); const priority = record.priority ?? 'NORMAL';
  return <tr className="align-top hover:bg-surface/60"><td className="px-5 py-4"><span className={`rounded-pill px-2.5 py-1 text-xs font-bold ${priority === 'URGENT' ? 'bg-danger-light text-danger' : priority === 'SCHEDULED' ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'bg-surface text-subtle'}`}>{priorityNames[priority]}</span></td><td className="py-4"><p className="font-semibold text-navy">{record.voucher_no}</p><p className="mt-1 max-w-56 break-words text-xs text-subtle">{record.source_reference}</p></td><td className="py-4"><p className="font-medium text-navy">{record.entity_name}</p><p className="mt-1 text-xs text-subtle">{record.outlet_name} · {record.source_division_code}</p></td><td className="py-4"><p className={overdue ? 'font-bold text-danger' : 'text-navy'}>{formatDate(record.due_date)}</p><p className="mt-1 text-xs text-subtle">{overdue ? 'Lewat jatuh tempo' : 'Dalam jadwal'}</p></td><td className="py-4 text-right font-semibold tabular-nums text-navy">{formatRupiah(record.amount)}</td><td className={`py-4 text-right font-bold tabular-nums ${status === 'PAID' ? 'text-success' : 'text-danger'}`}>{formatRupiah(remaining(record))}</td><td className="py-4"><span className={`rounded-pill px-2.5 py-1 text-xs font-bold ${status === 'PAID' ? 'bg-success-light text-success' : status === 'PARTIAL' ? 'bg-warning-light text-warning-dark' : 'bg-surface text-subtle'}`}>{paymentNames[status]}</span><p className="mt-2 text-[11px] text-subtle">Rencana {record.payment_method === 'BANK' ? 'Bank' : record.payment_method === 'CASH' ? 'Tunai' : 'Belum ditentukan'}</p></td><td className="pr-5 pt-3"><Link to={`/accounting/pengeluaran/voucher?month=${month}&status=approved&voucher=${record.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-input px-3 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950">{status === 'PAID' ? 'Lihat histori' : 'Catat realisasi'}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></td></tr>;
}

function Metric({ label, value, note, icon, primary, danger }: { label: string; value: string; note: string; icon: React.ReactNode; primary?: boolean; danger?: boolean }) {
  return <article className={`rounded-card border p-5 shadow-card ${primary ? 'border-primary-600 bg-gradient-to-br from-primary-600 to-primary-800 text-white' : 'border-line bg-panel'}`}><div className="flex items-start justify-between gap-3"><div><p className={`text-xs font-semibold uppercase tracking-wider ${primary ? 'text-primary-100' : 'text-subtle'}`}>{label}</p><p className={`mt-2 text-xl font-bold ${primary ? 'text-white' : danger ? 'text-danger' : 'text-navy'}`}>{value}</p></div><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-input [&>svg]:h-5 [&>svg]:w-5 ${primary ? 'bg-white/15' : 'border border-line bg-surface text-primary-600'}`}>{icon}</span></div><p className={`mt-3 text-xs ${primary ? 'text-primary-100' : 'text-subtle'}`}>{note}</p></article>;
}
