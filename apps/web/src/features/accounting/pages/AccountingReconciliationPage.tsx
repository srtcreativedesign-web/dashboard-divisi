import { hasCapability } from '../../../session/capability';
import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../session/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { Button } from '../../../components/ui/Button';
import { AccountingQueryState } from '../../../components/accounting/AccountingStates';
import { useAccountingReconciliations, useReconciliationMutations } from '../../../hooks/useAccounting';

const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(value);
const statusLabels: Record<string, string> = { draft: 'Draf', submitted: 'Menunggu persetujuan', approved: 'Disetujui', closed: 'Ditutup', reopened: 'Dibuka kembali' };

export default function AccountingReconciliationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bank, setBank] = useState('ALL');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const query = useAccountingReconciliations();
  const mutations = useReconciliationMutations();
  const data = query.data;
  const period = data?.period;
  const summary = data?.summary;
  const isManager = hasCapability(user?.role ?? '', 'manage:acc_period', user?.divisionCode);
  const items = (data?.items ?? []).filter(item => (bank === 'ALL' || item.bank_name === bank) && `${item.outlet_name} ${item.account_number} ${item.account_name}`.toLowerCase().includes(search.toLowerCase()));
  const action = async (type: 'submit' | 'approve' | 'close' | 'reopen') => {
    if (!period) return;
    if ((type === 'reopen' || type === 'close') && !notes.trim()) {
      toast('Isi alasan perubahan status periode terlebih dahulu.', 'error');
      return;
    }
    try {
      await mutations[type].mutateAsync({ period_id: period.id, notes: notes.trim() });
      setNotes('');
      toast('Status periode berhasil diperbarui.', 'success');
    } catch (error) { toast(error instanceof Error ? error.message : 'Status periode gagal diperbarui.', 'error'); }
  };
  const pending = Object.values(mutations).some(mutation => mutation.isPending);
  return <section className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="font-bold">Rekonsiliasi Bank</h1><p className="mt-2 text-sm text-slate-500">Bandingkan saldo rekening dengan buku kas, lalu tinjau kesiapan penutupan periode.</p></div>
      <Button variant="secondary" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw className="h-4 w-4" />Muat ulang</Button>
    </header>
    <AccountingQueryState loading={query.isLoading} error={query.error} empty={!data || !period} retry={() => void query.refetch()} emptyTitle="Belum ada periode rekonsiliasi">
      {summary && period && <>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-5 py-4">
          <div><p className="text-xs text-slate-500">Periode rekonsiliasi</p><p className="mt-1 font-semibold">{new Date(period.period_month.slice(0, 10) + 'T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p></div>
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium">{statusLabels[period.status] ?? period.status}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[['Saldo bank', summary.total_bank_aug, `${summary.total_bank_accounts} rekening`], ['Saldo buku kas', summary.cashflow_ending_balance, 'Saldo akhir jurnal'], ['Selisih', summary.variance, summary.total_bank_accounts === 0 ? 'Belum ada rekening untuk dibandingkan' : summary.is_matched ? 'Saldo sesuai' : 'Perlu ditelusuri']].map(([label, value, hint]) =>
            <article key={String(label)} className="rounded-xl border border-line bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 break-words text-xl font-semibold tabular-nums">{rupiah(Number(value))}</p><p className={`mt-2 text-xs ${label === 'Selisih' && !summary.is_matched ? 'text-danger' : 'text-slate-500'}`}>{hint}</p></article>)}
        </div>
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
            <div><h2 className="font-semibold">Daftar rekening</h2><p className="mt-1 text-xs text-slate-500">{items.length} dari {data.items.length} rekening ditampilkan</p></div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <select aria-label="Filter bank" value={bank} onChange={event => setBank(event.target.value)} className="rounded-lg border border-line bg-white px-3 text-sm"><option value="ALL">Semua bank</option>{[...new Set(data.items.map(item => item.bank_name))].map(name => <option key={name}>{name}</option>)}</select>
              <label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input aria-label="Cari rekening" value={search} onChange={event => setSearch(event.target.value)} placeholder="Outlet atau nomor rekening" className="w-full rounded-lg border border-line py-2 pl-9 pr-3 text-sm" /></label>
            </div>
          </div>
          <div role="region" aria-label="Tabel rekonsiliasi bank" tabIndex={0} className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Outlet', 'Rekening', 'Bank', 'Saldo awal', 'Saldo akhir', 'Mutasi', 'Verifikasi'].map((label, index) => <th key={label} scope="col" className={`px-4 py-3 font-medium ${index >= 3 && index <= 5 ? 'text-right' : ''}`}>{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">{items.map(item => <tr key={item.id} className="hover:bg-slate-50"><td className="px-4 py-4 font-medium">{item.outlet_name}</td><td className="px-4 py-4">{item.account_number}</td><td className="px-4 py-4 text-slate-500">{item.bank_name}</td><td className="whitespace-nowrap px-4 py-4 text-right">{rupiah(item.jul_balance)}</td><td className="whitespace-nowrap px-4 py-4 text-right font-medium">{rupiah(item.aug_balance)}</td><td className="whitespace-nowrap px-4 py-4 text-right">{rupiah(item.mutation)}</td><td className="px-4 py-4 text-xs">{item.is_verified ? 'Terverifikasi' : 'Belum diperiksa'}</td></tr>)}
                {items.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-slate-500">Tidak ada rekening yang sesuai. Ubah pencarian atau filter bank.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-semibold">Kontrol periode</h2>
          <p className="mt-2 text-sm text-slate-600">{summary.unattached_transactions_count > 0 ? `${summary.unattached_transactions_count} transaksi belum memiliki bukti. Lengkapi lampiran sebelum menutup buku.` : 'Seluruh transaksi memiliki lampiran bukti.'}</p>
          {(isManager || hasCapability(user?.role ?? '', 'submit:acc_period', user?.divisionCode)) && <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1 text-xs font-medium text-slate-600">Catatan / alasan perubahan<textarea value={notes} onChange={event => setNotes(event.target.value)} rows={2} placeholder="Jelaskan hasil pemeriksaan atau alasan pembukaan kembali" className="mt-2 block w-full rounded-lg border border-line p-3 text-sm" /></label>
            <div className="flex flex-wrap gap-2">
              {hasCapability(user?.role ?? '', 'submit:acc_period', user?.divisionCode) && period.status === 'draft' && <Button disabled={pending} onClick={() => void action('submit')}>Ajukan periode</Button>}
              {isManager && period.status === 'submitted' && <Button disabled={pending} onClick={() => void action('approve')}>Setujui rekonsiliasi</Button>}
              {isManager && period.status === 'approved' && <Button disabled={pending} onClick={() => void action('close')}>Tutup periode</Button>}
              {isManager && ['approved', 'closed'].includes(period.status) && <Button variant="secondary" disabled={pending} onClick={() => void action('reopen')}>Buka kembali</Button>}
            </div>
          </div>}
        </div>
      </>}
    </AccountingQueryState>
  </section>;
}
