import { useEffect, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ArrowRight, FilePlus2, Inbox, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { omzetApi } from '../../../api/omzet';
import { voucherApi } from '../../../api/vouchers';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { formatDate, formatRupiah } from './format';
import { ErrorState, LoadingState } from '../../../components/states';

type Queue = { id: string; kind: 'omzet' | 'voucher'; status: string; label: string; action: string; capability: string };
const queues: Queue[] = [
  { id: 'omzet-correction', kind: 'omzet', status: 'correction', label: 'Omzet perlu koreksi', action: 'Perbaiki rekap', capability: 'write:omzet' },
  { id: 'voucher-correction', kind: 'voucher', status: 'correction', label: 'Voucher perlu koreksi', action: 'Perbaiki voucher', capability: 'write:voucher' },
  { id: 'omzet-draft', kind: 'omzet', status: 'draft', label: 'Draf omzet', action: 'Lengkapi rekap', capability: 'write:omzet' },
  { id: 'voucher-draft', kind: 'voucher', status: 'draft', label: 'Draf voucher', action: 'Lengkapi voucher', capability: 'write:voucher' },
  { id: 'omzet-submitted', kind: 'omzet', status: 'submitted', label: 'Periksa omzet', action: 'Periksa rekap', capability: 'validate:omzet' },
  { id: 'voucher-submitted', kind: 'voucher', status: 'submitted', label: 'Periksa voucher', action: 'Periksa voucher', capability: 'validate:voucher' },
  { id: 'omzet-pending', kind: 'omzet', status: 'pending_approval', label: 'Keputusan selisih omzet', action: 'Tinjau selisih', capability: 'approve:omzet' },
  { id: 'voucher-pending', kind: 'voucher', status: 'pending_approval', label: 'Persetujuan voucher', action: 'Tinjau voucher', capability: 'approve:voucher' },
  { id: 'voucher-approved', kind: 'voucher', status: 'approved', label: 'Voucher disetujui', action: 'Lihat realisasi', capability: 'execute:payment' },
];
const base = (kind: Queue['kind']) => kind === 'omzet' ? '/accounting/pendapatan/rekap' : '/accounting/pengeluaran/voucher';
export function AccountingActionDesk({ month }: { month: string }) {
  const { user } = useAuth();
  const can = (capability: string) => Boolean(user && hasCapability(user.role, capability, user.divisionCode));
  const available = queues.filter(queue => can('view:acc_detail') && can(queue.capability));
  const [selected, setSelected] = useState('');
  const [page, setPage] = useState(1);
  const active = available.find(queue => queue.id === selected) ?? available[0];
  const results = useQueries({ queries: available.map(queue => ({
    queryKey: ['accounting-desk', user?.id, user?.role, user?.divisionCode, month, queue.id, queue.id === active?.id ? page : 1],
    queryFn: async () => {
      const filters = { month, outlet_id: '', status: queue.status, page: String(queue.id === active?.id ? page : 1) };
      if (queue.kind === 'omzet') {
        const { data } = await omzetApi.list(filters);
        return { ...data, items: data.items.map(record => ({ id: record.id, reference: record.source_reference, outlet: record.outlet_name, division: record.source_division_code, date: record.business_date, amount: record.outlet_amount, context: 'Shift ' + record.shift, note: record.review_notes || record.decision_notes || record.notes, detail: 'rekap', payment: '' })) };
      }
      const { data } = await voucherApi.list({ ...filters, type: '' });
      return { ...data, items: data.items.map(record => ({ id: record.id, reference: record.source_reference || record.voucher_no, outlet: record.outlet_name, division: record.source_division_code, date: record.voucher_date, amount: record.amount, context: record.entity_name, note: record.review_notes || record.decision_notes || record.description, detail: 'voucher', payment: record.payment_summary?.status === 'PAID' ? 'Lunas' : record.payment_summary?.status === 'PARTIAL' ? 'Sebagian dibayar' : 'Belum dibayar' })) };
    },
    enabled: /^20\d{2}-(0[1-9]|1[0-2])$/.test(month),
  })) });
  const preferred = results.every(query => !query.isLoading) ? available[results.findIndex(query => (query.data?.total ?? 0) > 0)]?.id : undefined;
  useEffect(() => { if (!selected && preferred) setSelected(preferred); }, [selected, preferred]);
  const result = results[available.findIndex(queue => queue.id === active?.id)];
  if (!active) return null;
  const register = '/accounting/dokumen/register?' + new URLSearchParams({ month, kind: active.kind, status: active.status === 'approved' ? 'done' : active.status });
  return <section aria-label="Meja kerja Accounting" className="overflow-hidden rounded-xl border border-line bg-panel shadow-sm">
    <header className="flex flex-wrap items-start justify-between gap-4 px-5 py-5 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-700 dark:text-primary-300">Pekerjaan · {month}</p><h2 className="mt-1 text-xl font-bold tracking-tight text-navy">Dokumen yang perlu Anda kerjakan</h2><p className="mt-2 text-xs leading-relaxed text-subtle">Pilih antrean, baca konteksnya, lalu buka dokumen untuk menyelesaikan tindakan.</p></div><div className="flex flex-wrap gap-2">{can('write:omzet') && <Link to={'/accounting/pendapatan/rekap?new=1&month=' + month} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-700 px-3 text-xs font-semibold text-white hover:bg-primary-800"><FilePlus2 aria-hidden="true" className="h-4 w-4" />Buat rekap omzet</Link>}{can('write:voucher') && <Link to={'/accounting/pengeluaran/voucher?new=1&month=' + month} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold hover:bg-surface">Buat voucher</Link>}<button type="button" aria-label="Muat ulang meja kerja" onClick={() => results.forEach(query => { void query.refetch(); })} className="flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-xs font-medium hover:bg-surface"><RefreshCw aria-hidden="true" className="h-4 w-4" />Muat ulang</button></div></header>
    <div aria-label="Pilihan antrean" className="flex flex-wrap gap-1 border-y border-line bg-surface px-3 py-2 sm:px-5">{available.map((queue,index) => <button key={queue.id} type="button" aria-pressed={active.id === queue.id} onClick={() => { setSelected(queue.id); setPage(1); }} className={'inline-flex min-h-11 items-center gap-3 rounded-lg px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-primary ' + (active.id === queue.id ? 'bg-panel text-primary-700 shadow-sm dark:text-primary-300' : 'text-subtle hover:bg-panel')}><span>{queue.label}</span><span className="rounded-md bg-surface-2 px-2 py-0.5 tabular-nums">{results[index]?.isError ? 'Gagal' : results[index]?.data?.total ?? '…'}</span></button>)}</div>
    {result?.isLoading ? <LoadingState label="Memuat dokumen pekerjaan…" /> : result?.error ? <ErrorState description={result.error.message} onRetry={() => { void result.refetch(); }} /> : result?.data ? <>
      {result.data.items.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm md:min-w-[720px]"><caption className="sr-only">Dokumen {active.label}</caption><thead className="hidden md:table-header-group border-b border-line text-[10px] uppercase tracking-wider text-subtle"><tr>{['Dokumen & sumber', 'Outlet', 'Tanggal dokumen', 'Nominal', 'Tindakan'].map(label => <th key={label} scope="col" className={'px-5 py-3 font-semibold ' + (label === 'Nominal' ? 'text-right' : '')}>{label}</th>)}</tr></thead><tbody className="block divide-y divide-line md:table-row-group">{result.data.items.map(record => <tr key={record.id} className="grid grid-cols-2 align-top hover:bg-surface md:table-row"><td className="col-span-2 block px-5 py-4 md:table-cell md:max-w-80"><p className="break-words font-semibold text-navy">{record.reference}</p><p className="mt-1 text-xs text-subtle">{record.context}</p>{record.note && active.status !== 'correction' && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-subtle">{record.note}</p>}{active.status === 'correction' && <p className="mt-2 text-xs text-danger dark:text-red-300">{record.note || 'Baca catatan koreksi pada detail dokumen.'}</p>}{active.status === 'approved' && <p className="mt-2 text-xs font-medium text-muted">{record.payment} · persetujuan terpisah dari realisasi</p>}</td><td className="block px-5 py-3 md:table-cell md:py-4"><p className="font-medium">{record.outlet}</p><p className="mt-1 text-xs text-subtle">{record.division}</p></td><td className="block px-5 py-3 text-muted md:table-cell md:whitespace-nowrap md:py-4"><span className="mb-1 block text-[10px] uppercase text-subtle md:hidden">Tanggal dokumen</span>{formatDate(record.date)}</td><td className="col-span-2 block px-5 py-3 font-semibold tabular-nums md:table-cell md:whitespace-nowrap md:py-4 md:text-right"><span className="mb-1 block text-[10px] font-normal uppercase text-subtle md:hidden">Nominal</span>{formatRupiah(record.amount)}</td><td className="col-span-2 block px-5 py-3 md:table-cell md:whitespace-nowrap"><Link to={base(active.kind) + '?' + new URLSearchParams({ month, [record.detail]: record.id })} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 text-xs font-semibold text-primary-800 hover:bg-primary-100 dark:border-primary-900 dark:bg-primary-950 dark:text-primary-200">{active.action}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link></td></tr>)}</tbody></table></div> : <div className="flex flex-col items-center px-6 py-9 text-center"><Inbox aria-hidden="true" className="mb-3 h-7 w-7 text-subtle" /><h3 className="text-sm font-semibold">Antrean ini belum memiliki dokumen</h3><p className="mt-2 max-w-md text-xs leading-relaxed text-subtle">Pilih antrean lain atau ubah periode. Ini belum menunjukkan kelengkapan laporan seluruh outlet.</p><Link to={register} className="mt-4 text-xs font-semibold text-primary-700 dark:text-primary-300">Lihat semua dokumen →</Link></div>}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3 text-xs text-subtle"><span>{result.data.total} dokumen · halaman {result.data.current_page} dari {result.data.last_page}</span><div className="flex flex-wrap items-center gap-2"><button type="button" disabled={page <= 1 || result.isFetching} onClick={() => setPage(value => value - 1)} className="min-h-10 rounded-lg border border-line px-3 disabled:opacity-40">Sebelumnya</button><button type="button" disabled={page >= result.data.last_page || result.isFetching} onClick={() => setPage(value => value + 1)} className="min-h-10 rounded-lg border border-line px-3 disabled:opacity-40">Berikutnya</button><Link to={register} className="inline-flex min-h-10 items-center gap-1 px-2 font-semibold text-primary-700 dark:text-primary-300">Register lengkap<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link></div></footer>
    </> : null}
  </section>;
}
