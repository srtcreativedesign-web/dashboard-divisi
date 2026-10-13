import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, Clock, RefreshCw, ShieldCheck } from 'lucide-react';
import { accountingApi, type AccPeriod } from '../../../api/accounting';
import { AccountingPageHeader } from '../../../components/accounting/AccountingPageHeader';
import { AccountingQueryState } from '../../../components/accounting/AccountingStates';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useToast } from '../../../components/ui/Toast';
import { useAccountingPeriods } from '../../../hooks/useAccounting';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';

const statusLabels: Record<string, string> = {
  draft: 'Draf', pending_approval: 'Menunggu persetujuan', needs_correction: 'Perlu koreksi',
  approved: 'Disetujui', closed: 'Ditutup', reopened: 'Dibuka kembali',
};
const formatPeriod = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const panel = 'rounded-card-lg border border-line bg-panel';

export default function AccountingPeriodsPage() {
  const periods = useAccountingPeriods();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const canSubmit = hasCapability(user?.role ?? '', 'submit:acc_period', user?.divisionCode);
  const canManage = hasCapability(user?.role ?? '', 'manage:acc_period', user?.divisionCode);

  useEffect(() => {
    if (!selectedId && periods.data?.[0]) setSelectedId(periods.data[0].id);
    if (selectedId && periods.data && !periods.data.some(period => period.id === selectedId)) setSelectedId(periods.data[0]?.id ?? '');
  }, [periods.data, selectedId]);

  const selected = periods.data?.find(period => period.id === selectedId);
  const readiness = useQuery({
    queryKey: ['accounting', 'period-readiness', selectedId],
    queryFn: async () => (await accountingApi.periodReadiness(selectedId)).data,
    enabled: Boolean(selectedId),
  });
  const counts = useMemo(() => ({
    pending: periods.data?.filter(period => period.status === 'pending_approval').length ?? 0,
    correction: periods.data?.filter(period => ['needs_correction', 'reopened'].includes(period.status)).length ?? 0,
    closed: periods.data?.filter(period => period.status === 'closed').length ?? 0,
  }), [periods.data]);

  const runTransition = async (period: AccPeriod, status: string, requireReason = false) => {
    const reason = notes.trim();
    if (requireReason && reason.length < 10) {
      toast('Catatan minimal 10 karakter diperlukan untuk keputusan ini.', 'error');
      return;
    }
    setBusy(true);
    try {
      await accountingApi.transitionPeriod(period.id, status, reason || undefined);
      setNotes('');
      await periods.refetch();
      await readiness.refetch();
      toast('Status periode berhasil diperbarui.', 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Status periode gagal diperbarui.', 'error');
    } finally { setBusy(false); }
  };

  return <section className="space-y-6 pb-12">
    <AccountingPageHeader area="Pembukuan · Kontrol Periode" title="Periode & penutupan" description="Pantau kesiapan jurnal dan rekonsiliasi, teruskan pekerjaan ke penanggung jawab berikutnya, lalu kunci periode dengan jejak keputusan." actions={<Button variant="secondary" disabled={periods.isFetching} onClick={() => void periods.refetch()}><RefreshCw className="h-4 w-4" />Muat ulang</Button>} />

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan periode">
      {[
        { label: 'Total periode', value: periods.data?.length ?? 0, icon: CalendarDays, hint: 'Siklus Accounting tercatat' },
        { label: 'Menunggu Manager', value: counts.pending, icon: Clock, hint: 'Perlu keputusan' },
        { label: 'Perlu koreksi', value: counts.correction, icon: CircleAlert, hint: 'Kembali ke penyusun' },
        { label: 'Sudah ditutup', value: counts.closed, icon: CheckCircle2, hint: 'Transaksi dikunci' },
      ].map(({ label, value, icon: Icon, hint }) => <Card key={label} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-subtle">{label}</p><p className="mt-2 text-2xl font-black text-navy">{value}</p><p className="mt-1 text-xs text-subtle">{hint}</p></div><span className="rounded-card bg-primary-50 p-2.5 text-primary-700 dark:bg-primary-950 dark:text-primary-300"><Icon className="h-5 w-5" /></span></div></Card>)}
    </section>

    <AccountingQueryState loading={periods.isLoading} error={periods.error} empty={!periods.data?.length} retry={() => void periods.refetch()} emptyTitle="Belum ada periode Accounting">
      <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.7fr)]">
        <section className={panel + ' overflow-hidden'} aria-label="Daftar periode">
          <div className="border-b border-line p-4"><h2 className="font-semibold text-navy">Daftar periode</h2><p className="mt-1 text-xs text-subtle">Pilih bulan untuk melihat kesiapan dan tindakan.</p></div>
          <div className="divide-y divide-line">{periods.data?.map(period => <button key={period.id} type="button" onClick={() => { setSelectedId(period.id); setNotes(''); }} className={`flex w-full items-center justify-between gap-3 p-4 text-left transition ${selectedId === period.id ? 'bg-primary-50/70 dark:bg-primary-950/40' : 'hover:bg-surface'}`}><span><strong className="block text-sm text-navy">{formatPeriod(period.periodMonth)}</strong><span className="mt-1 block text-xs text-subtle">{statusLabels[period.status] ?? period.status} · versi {period.version}</span></span><ChevronRight className="h-4 w-4 text-subtle" /></button>)}</div>
        </section>

        {selected && <section className="space-y-5">
          <div className={panel + ' p-5'}><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3"><span className="rounded-card bg-primary-50 p-3 text-primary-700 dark:bg-primary-950 dark:text-primary-300"><CalendarClock className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-subtle">Periode dipilih</p><h2 className="mt-1 text-xl font-bold text-navy">{formatPeriod(selected.periodMonth)}</h2><p className="mt-1 text-sm text-subtle">{selected.notes || 'Belum ada catatan keputusan.'}</p></div></div><span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-navy">{statusLabels[selected.status] ?? selected.status}</span></div></div>

          <AccountingQueryState loading={readiness.isLoading} error={readiness.error} empty={!readiness.data} retry={() => void readiness.refetch()} emptyTitle="Kesiapan belum tersedia">
            {readiness.data && <>
              <section className="grid gap-3 sm:grid-cols-3" aria-label="Angka kesiapan periode">
                <Card className="p-4"><p className="text-xs text-subtle">Jurnal aktif</p><p className="mt-2 text-xl font-bold text-navy">{readiness.data.transactionCount}</p></Card>
                <Card className="p-4"><p className="text-xs text-subtle">Saldo kas buku</p><p className="mt-2 text-lg font-bold text-navy">{rupiah(readiness.data.cashBalance)}</p></Card>
                <Card className="p-4"><p className="text-xs text-subtle">Selisih bank</p><p className={`mt-2 text-lg font-bold ${readiness.data.variance > 1 ? 'text-danger dark:text-red-300' : 'text-navy'}`}>{rupiah(readiness.data.variance)}</p></Card>
              </section>
              <section className={panel + ' p-5'}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-navy">Checklist kesiapan</h2><p className="mt-1 text-xs text-subtle">Status berasal dari jurnal, lampiran, saldo rekening, dan rekonsiliasi periode ini.</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${readiness.data.readyForClose ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'}`}>{readiness.data.readyForClose ? 'Siap ditutup' : 'Masih ada pengecualian'}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{readiness.data.checks.map(check => <article key={check.code} className="flex gap-3 rounded-card border border-line bg-surface/60 p-3">{check.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}<div><h3 className="text-sm font-semibold text-navy">{check.label}</h3><p className="mt-1 text-xs leading-relaxed text-subtle">{check.message}</p></div></article>)}</div></section>
            </>}
          </AccountingQueryState>

          {(canSubmit || canManage) && <section className={panel + ' p-5'}><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary-700 dark:text-primary-300" /><h2 className="font-semibold text-navy">Tindakan dan penanggung jawab</h2></div><p className="mt-2 text-sm text-subtle">Admin menyiapkan dan mengajukan. Manager memutuskan koreksi, persetujuan, penutupan, serta pembukaan kembali.</p><label className="mt-4 block text-xs font-semibold text-navy">Catatan keputusan<textarea value={notes} onChange={event => setNotes(event.target.value)} rows={3} maxLength={500} placeholder="Wajib minimal 10 karakter untuk koreksi, penutupan, atau pembukaan kembali" className="mt-2 block w-full rounded-input border border-line bg-panel p-3 text-sm font-normal" /></label><div className="mt-4 flex flex-wrap gap-2">
            {canSubmit && selected.status === 'draft' && <Button disabled={busy || !readiness.data?.readyForSubmission} onClick={() => void runTransition(selected, 'pending_approval')}>Ajukan ke Manager</Button>}
            {canSubmit && selected.status === 'needs_correction' && <Button disabled={busy} onClick={() => void runTransition(selected, 'draft')}>Mulai koreksi</Button>}
            {canManage && selected.status === 'pending_approval' && <><Button disabled={busy} variant="secondary" onClick={() => void runTransition(selected, 'needs_correction', true)}>Minta koreksi</Button><Button disabled={busy} onClick={() => void runTransition(selected, 'approved')}>Setujui periode</Button></>}
            {canManage && selected.status === 'approved' && <><Button disabled={busy} variant="secondary" onClick={() => void runTransition(selected, 'needs_correction', true)}>Kembalikan untuk koreksi</Button><Button disabled={busy || !readiness.data?.readyForClose} onClick={() => void runTransition(selected, 'closed', true)}>Tutup dan kunci</Button></>}
            {canManage && selected.status === 'closed' && <Button disabled={busy} variant="secondary" onClick={() => void runTransition(selected, 'reopened', true)}>Buka kembali</Button>}
            {canManage && selected.status === 'reopened' && <Button disabled={busy} onClick={() => void runTransition(selected, 'draft')}>Aktifkan periode koreksi</Button>}
            {selected.status === 'closed' && !canManage && <p className="text-sm text-subtle">Periode terkunci. Hubungi Manager jika diperlukan koreksi.</p>}
          </div>{readiness.data && !readiness.data.readyForClose && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">Selesaikan pengecualian pada checklist sebelum penutupan. Tombol tidak aktif selama syarat teknis belum terpenuhi.</p>}</section>}
        </section>}
      </div>
    </AccountingQueryState>
  </section>;
}
