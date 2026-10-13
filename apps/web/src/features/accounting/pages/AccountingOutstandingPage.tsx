import { useMemo, useState } from 'react';
import { Plus, Search, ShieldCheck } from 'lucide-react';
import type { AccOutstandingItem } from '../../../api/accounting';
import { AccountingPageHeader } from '../../../components/accounting/AccountingPageHeader';
import { AccountingQueryState } from '../../../components/accounting/AccountingStates';
import { AgingBucketBar, getItemBucket, type AgingBucketId } from '../../../components/accounting/AgingBucketBar';
import { OutstandingCreateDrawer, type OutstandingCreateValues } from '../../../components/accounting/outstanding/OutstandingCreateDrawer';
import { OutstandingKpiCards } from '../../../components/accounting/outstanding/OutstandingKpiCards';
import { OutstandingPayDrawer } from '../../../components/accounting/outstanding/OutstandingPayDrawer';
import { OutstandingTable } from '../../../components/accounting/outstanding/OutstandingTable';
import { DetailSheet } from '../../../components/ui/DetailSheet';
import { useToast } from '../../../components/ui/Toast';
import { useAccountingAccounts, useAccountingCategories, useAccountingOutstandings, useAccountingPeriods, useOutstandingMutations } from '../../../hooks/useAccounting';
import { hasCapability } from '../../../session/capability';
import { useAuth } from '../../../session/AuthContext';

const editableStatuses = ['draft', 'reopened', 'needs_correction'];
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export default function AccountingOutstandingPage() {
  const { user } = useAuth(); const { toast } = useToast();
  const periods = useAccountingPeriods(); const categories = useAccountingCategories(); const accounts = useAccountingAccounts();
  const [periodId, setPeriodId] = useState(''); const [direction, setDirection] = useState<'ALL' | 'PAYABLE' | 'RECEIVABLE'>('ALL'); const [status, setStatus] = useState('all'); const [search, setSearch] = useState(''); const [bucket, setBucket] = useState<AgingBucketId | null>(null);
  const [createOpen, setCreateOpen] = useState(false); const [settleItem, setSettleItem] = useState<AccOutstandingItem | null>(null); const [cancelItem, setCancelItem] = useState<AccOutstandingItem | null>(null); const [cancelReason, setCancelReason] = useState('');
  const activePeriod = periods.data?.find(period => period.id === periodId) ?? periods.data?.[0];
  const query = useAccountingOutstandings({ period_id: activePeriod?.id, direction: direction === 'ALL' ? undefined : direction, status: status === 'all' ? undefined : status, search: search || undefined });
  const mutations = useOutstandingMutations();
  const canCreateDocument = hasCapability(user?.role ?? '', 'write:acc_outstanding', user?.divisionCode);
  const canSettle = hasCapability(user?.role ?? '', 'execute:payment', user?.divisionCode);
  const canCancel = hasCapability(user?.role ?? '', 'manage:acc_period', user?.divisionCode);
  const canCreate = canCreateDocument && editableStatuses.includes(activePeriod?.status ?? '');
  const items = query.data?.items ?? [];
  const agingItems = useMemo(() => items.map(item => ({ ...item, remainingAmount: item.remaining_amount, dueDate: item.due_date })), [items]);
  const visible = useMemo(() => bucket ? items.filter(item => getItemBucket({ ...item, remainingAmount: item.remaining_amount, dueDate: item.due_date }) === bucket) : items, [bucket, items]);
  const editablePeriods = (periods.data ?? []).filter(period => editableStatuses.includes(period.status));

  const create = async (values: OutstandingCreateValues) => { try { await mutations.create.mutateAsync(values); toast(`${values.direction === 'PAYABLE' ? 'Hutang' : 'Piutang'} ${money(values.amount)} berhasil dicatat`, 'success'); } catch (error) { toast(error instanceof Error ? error.message : 'Gagal menyimpan dokumen', 'error'); throw error; } };
  const settle = async (id: string, payload: { amount: number; payment_date: string; notes: string; account_id: string; version: number }) => { try { await mutations.pay.mutateAsync({ id, payload }); toast('Realisasi berhasil dicatat', 'success'); } catch (error) { toast(error instanceof Error ? error.message : 'Gagal mencatat realisasi', 'error'); throw error; } };
  const cancel = async () => { if (!cancelItem || cancelReason.trim().length < 10) return; try { await mutations.cancel.mutateAsync({ id: cancelItem.id, reason: cancelReason.trim(), version: cancelItem.version }); toast('Dokumen dibatalkan dan tetap tersimpan di audit trail', 'success'); setCancelItem(null); setCancelReason(''); } catch (error) { toast(error instanceof Error ? error.message : 'Gagal membatalkan dokumen', 'error'); } };

  return <section className="space-y-6 pb-10">
    <AccountingPageHeader area="Pembukuan · Hutang Piutang" title="Kendali hutang & piutang" description="Pantau kewajiban yang harus dibayar, tagihan yang harus diterima, jatuh tempo, dan dampaknya terhadap proyeksi kas." actions={<div className="flex items-center gap-2"><span className="hidden items-center gap-1 rounded-lg border border-line bg-panel px-3 py-2 text-xs font-semibold text-muted sm:inline-flex"><ShieldCheck className="h-4 w-4 text-primary" />{canCreateDocument ? 'Pencatat dokumen' : canSettle ? 'Realisasi Finance' : canCancel ? 'Kontrol Manager' : 'Hanya baca'}</span>{canCreate && <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-input bg-primary px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Dokumen baru</button>}</div>} />
    <div className="grid gap-4 rounded-card-lg border border-line bg-panel p-4 md:grid-cols-[1fr_auto_auto]"><label className="text-xs font-bold uppercase tracking-wider text-subtle">Periode<select value={activePeriod?.id ?? ''} onChange={event => { setPeriodId(event.target.value); setBucket(null); }} className="mt-2 w-full rounded-input border border-line bg-panel px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-navy">{(periods.data ?? []).map(period => <option key={period.id} value={period.id}>{period.periodMonth.slice(0, 7)} · {period.status}</option>)}</select></label><div><p className="text-xs font-bold uppercase tracking-wider text-subtle">Jenis</p><div className="mt-2 flex rounded-lg bg-surface p-1">{(['ALL', 'PAYABLE', 'RECEIVABLE'] as const).map(value => <button key={value} type="button" onClick={() => { setDirection(value); setBucket(null); }} className={`rounded-md px-3 py-2 text-xs font-semibold ${direction === value ? 'bg-panel text-navy shadow-sm' : 'text-subtle'}`}>{value === 'ALL' ? 'Semua' : value === 'PAYABLE' ? 'Hutang' : 'Piutang'}</button>)}</div></div><div><p className="text-xs font-bold uppercase tracking-wider text-subtle">Status</p><select value={status} onChange={event => setStatus(event.target.value)} className="mt-2 rounded-input border border-line bg-panel px-3 py-2.5 text-sm text-navy"><option value="all">Semua status</option><option value="unpaid">Belum realisasi</option><option value="partial">Sebagian</option><option value="paid">Lunas</option><option value="cancelled">Dibatalkan</option></select></div></div>
    <AccountingQueryState loading={query.isLoading || periods.isLoading} error={query.error || periods.error} empty={!query.data} retry={() => { void query.refetch(); void periods.refetch(); }}>
      {query.data && <OutstandingKpiCards kpis={query.data.kpis} />}
      <div className="rounded-card-lg border border-line bg-panel p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold text-navy">Prioritas berdasarkan jatuh tempo</h2><p className="mt-1 text-xs text-subtle">Pilih kelompok umur untuk menyaring register di bawah.</p></div><div className="relative w-full md:w-72"><Search className="absolute left-3 top-3 h-4 w-4 text-subtle" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari kode, pihak, atau uraian" className="w-full rounded-input border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-navy" /></div></div><div className="mt-4"><AgingBucketBar items={agingItems} selectedBucket={bucket} onSelectBucket={setBucket} /></div></div>
      <div className="overflow-hidden rounded-card-lg border border-line bg-panel"><div className="border-b border-line px-5 py-4"><h2 className="font-bold text-navy">Register dokumen</h2><p className="mt-1 text-xs text-subtle">{visible.length} dokumen sesuai filter · tindakan mengikuti kewenangan role.</p></div><OutstandingTable items={visible} canSettle={canSettle} canCancel={canCancel} onSettle={setSettleItem} onCancel={item => { setCancelItem(item); setCancelReason(''); }} /></div>
    </AccountingQueryState>
    <OutstandingCreateDrawer isOpen={createOpen} onClose={() => setCreateOpen(false)} onSubmit={create} isLoading={mutations.create.isPending} periods={editablePeriods} categories={categories.data ?? []} defaultPeriodId={editablePeriods.some(period => period.id === activePeriod?.id) ? activePeriod?.id : editablePeriods[0]?.id} />
    <OutstandingPayDrawer isOpen={Boolean(settleItem)} onClose={() => setSettleItem(null)} onSubmit={settle} item={settleItem} accounts={accounts.data ?? []} isLoading={mutations.pay.isPending} />
    <DetailSheet isOpen={Boolean(cancelItem)} onClose={() => setCancelItem(null)} title="Batalkan dokumen" subtitle={cancelItem ? `${cancelItem.code} · ${cancelItem.counterparty_name || cancelItem.description}` : ''} size="sm" footer={<div className="flex w-full justify-end gap-2"><button type="button" onClick={() => setCancelItem(null)} className="rounded-input border border-line px-4 py-2 text-sm font-semibold">Kembali</button><button type="button" disabled={cancelReason.trim().length < 10 || mutations.cancel.isPending} onClick={() => void cancel()} className="rounded-input bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Batalkan dokumen</button></div>}><p className="text-sm leading-relaxed text-muted">Pembatalan tidak menghapus histori. Jelaskan alasan agar pemeriksa memahami perubahan.</p><label className="mt-4 block text-sm font-semibold text-muted">Alasan pembatalan<textarea value={cancelReason} onChange={event => setCancelReason(event.target.value)} rows={4} className="mt-1.5 w-full rounded-input border border-line bg-panel px-3 py-2 text-sm text-navy" placeholder="Minimal 10 karakter" /></label></DetailSheet>
  </section>;
}
