import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Building2, Search, Lock, Check, Send, RotateCcw } from 'lucide-react';
import { ACCOUNTING_EXCEL_DATA } from '../data/accountingExcelData';
import { useAuth } from '../session/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useAccountingReconciliations, useReconciliationMutations } from '../hooks/useAccounting';
import { ReconciliationMatchGauge } from '../components/accounting/ReconciliationMatchGauge';

const rupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function AccountingReconciliationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('ALL');
  const [searchOutlet, setSearchOutlet] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  // Backend query & mutations
  const { data: serverData, isLoading } = useAccountingReconciliations({
    bank_name: selectedBankFilter !== 'ALL' ? selectedBankFilter : undefined,
    search: searchOutlet ? searchOutlet : undefined,
  });
  const reconMutations = useReconciliationMutations();

  const summary = serverData?.summary ?? {
    total_bank_accounts: ACCOUNTING_EXCEL_DATA.bankAccounts.length,
    total_bank_jul: ACCOUNTING_EXCEL_DATA.totalBankJul,
    total_bank_aug: ACCOUNTING_EXCEL_DATA.totalBankAug,
    total_mutation: ACCOUNTING_EXCEL_DATA.totalBankAug - ACCOUNTING_EXCEL_DATA.totalBankJul,
    cashflow_ending_balance: ACCOUNTING_EXCEL_DATA.cashflow.totalEndingBalance,
    variance: 0.88,
    is_matched: true,
    unattached_transactions_count: 484,
  };

  const banks = serverData?.items
    ? serverData.items.map((it) => ({
        id: it.id,
        outlet: it.outlet_name,
        accountNumber: it.account_number,
        bankName: it.bank_name,
        julBalance: it.jul_balance,
        augBalance: it.aug_balance,
        mutation: it.mutation,
      }))
    : ACCOUNTING_EXCEL_DATA.bankAccounts;

  const currentPeriod = serverData?.period ?? {
    id: 'aug-2026',
    period_month: '2026-08-01',
    status: 'draft',
    notes: 'Periode Agustus 2026',
  };

  const isManager = user?.role === 'MANAGER' || user?.role === 'SUPERADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const filteredBanks = banks.filter((b) => {
    const matchBank = selectedBankFilter === 'ALL' || b.bankName.toUpperCase() === selectedBankFilter;
    const matchSearch = b.outlet.toLowerCase().includes(searchOutlet.toLowerCase()) || b.accountNumber.includes(searchOutlet);
    return matchBank && matchSearch;
  });

  const handlePeriodAction = async (action: 'submit' | 'approve' | 'close' | 'reopen') => {
    try {
      if (action === 'submit') {
        await reconMutations.submit.mutateAsync({
          period_id: currentPeriod.id,
          notes: actionNotes || 'Pengajuan persetujuan rekonsiliasi kas',
        });
        toast('Periode berhasil diajukan ke Manager ACC untuk persetujuan.', 'success');
      } else if (action === 'approve') {
        await reconMutations.approve.mutateAsync({
          period_id: currentPeriod.id,
          notes: actionNotes || 'Disetujui oleh Manager ACC',
        });
        toast('Periode berhasil disetujui oleh Manager ACC.', 'success');
      } else if (action === 'close') {
        await reconMutations.close.mutateAsync({
          period_id: currentPeriod.id,
          notes: actionNotes || 'Periode resmi ditutup dan dikunci',
        });
        toast('Periode berhasil ditutup secara permanen di backend.', 'success');
      } else if (action === 'reopen') {
        await reconMutations.reopen.mutateAsync({
          period_id: currentPeriod.id,
          notes: actionNotes || 'Buka kembali untuk penyesuaian transaksi',
        });
        toast('Periode dibuka kembali dengan pencatatan audit log.', 'info');
      }
      setActionNotes('');
    } catch {
      toast('Gagal memperbarui status periode di backend', 'error');
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">ACCOUNTING CONTROL CENTER</p>
          <h1 className="mt-1 text-2xl font-bold text-navy">Saldo Akhir Bank &amp; Rekonsiliasi Kas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Pencocokan 31 rekening bank operasional terhadap saldo akhir buku kas per 31 Agustus 2026.
            {isLoading && <span className="ml-2 text-xs text-primary animate-pulse">(Menyinkronkan backend...)</span>}
          </p>
        </div>
      </header>

      {/* Reconciliation Match Gauge */}
      <ReconciliationMatchGauge
        totalBank={summary.total_bank_aug}
        totalCashflow={summary.cashflow_ending_balance}
        variance={summary.variance}
        isMatched={summary.is_matched}
        totalAccounts={summary.total_bank_accounts}
      />

      {/* Reconciliation Comparison Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-card border border-line bg-white p-4 shadow-card">
          <p className="text-xs font-medium text-slate-500">Total Saldo Bank (31 Rekening)</p>
          <p className="mt-1 text-xl font-bold text-navy">{rupiah(summary.total_bank_aug)}</p>
          <p className="mt-0.5 text-xs text-slate-400">Mandiri, BCA, BRI per 31 Ags 2026</p>
        </article>

        <article className="rounded-card border border-line bg-white p-4 shadow-card">
          <p className="text-xs font-medium text-slate-500">Total Saldo Akhir Cashflow (Buku)</p>
          <p className="mt-1 text-xl font-bold text-navy">{rupiah(summary.cashflow_ending_balance)}</p>
          <p className="mt-0.5 text-xs text-slate-400">Akumulasi Arus Kas Buku Besar</p>
        </article>

        <article className="rounded-card border border-line bg-white p-4 shadow-card">
          <p className="text-xs font-medium text-slate-500">Selisih Rekonsiliasi (Variance)</p>
          <p className={`mt-1 text-xl font-bold ${summary.is_matched ? 'text-emerald-600' : 'text-rose-600'}`}>
            Rp {summary.variance.toFixed(2)}
          </p>
          <p className="mt-0.5 text-xs text-emerald-600 font-medium">
            {summary.is_matched ? '✓ Klop / Rekonsiliasi Sempurna' : 'Perlu Investigasi Selisih'}
          </p>
        </article>

        <article className="rounded-card border border-line bg-navy p-4 text-white shadow-card">
          <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">STATUS KONTROL PERIODE</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-bold">{currentPeriod.period_month}</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase">
              {currentPeriod.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Kewenangan: {isAdmin ? 'Admin ACC (Entry & Submit)' : isManager ? 'Manager ACC (Approve/Close/Reopen)' : 'View Only'}
          </p>
        </article>
      </div>

      {/* Audit & Closing Checklist Section */}
      <div className="rounded-card border border-line bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold text-navy uppercase tracking-wide">Audit &amp; Kesiapan Penutupan Periode</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-card bg-emerald-50 border border-emerald-200 p-3.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-900">Rekonsiliasi Bank 100% Klop</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">Saldo buku kas cocok terhadap saldo 31 rekening koran bank.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-card bg-primary-50 border border-primary-200 p-3.5">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-primary-900">Arus Kas &amp; Outstanding Terpetakan</p>
              <p className="text-[11px] text-primary-700 mt-0.5">9 item kewajiban telah tercatat dengan proyeksi saldo jelas.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-card bg-amber-50 border border-amber-200 p-3.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900">{summary.unattached_transactions_count} Transaksi Perlu Bukti</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Lengkapi lampiran struk/invoice sebelum pengajuan resmi ditutup.</p>
            </div>
          </div>
        </div>

        {/* Workflow Approval Action Bar */}
        <div className="mt-5 flex flex-col gap-3 pt-4 border-t border-line sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Catatan persetujuan / alasan perubahan status..."
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            className="w-full sm:w-96 rounded-card border border-line px-3 py-2 text-xs text-navy focus:border-primary focus:outline-none"
          />

          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && currentPeriod.status === 'draft' && (
              <button
                type="button"
                onClick={() => void handlePeriodAction('submit')}
                disabled={reconMutations.submit.isPending}
                className="inline-flex items-center gap-1.5 rounded-card bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark transition shadow disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {reconMutations.submit.isPending ? 'Mengajukan...' : 'Ajukan Periode ke Manager'}
              </button>
            )}

            {isManager && currentPeriod.status === 'submitted' && (
              <button
                type="button"
                onClick={() => void handlePeriodAction('approve')}
                disabled={reconMutations.approve.isPending}
                className="inline-flex items-center gap-1.5 rounded-card bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                {reconMutations.approve.isPending ? 'Menyetujui...' : 'Setujui Rekonsiliasi'}
              </button>
            )}

            {isManager && currentPeriod.status === 'approved' && (
              <button
                type="button"
                onClick={() => void handlePeriodAction('close')}
                disabled={reconMutations.close.isPending}
                className="inline-flex items-center gap-1.5 rounded-card bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow disabled:opacity-50"
              >
                <Lock className="h-3.5 w-3.5" />
                {reconMutations.close.isPending ? 'Mengunci...' : 'Kunci & Tutup Buku Periode'}
              </button>
            )}

            {isManager && (currentPeriod.status === 'approved' || currentPeriod.status === 'closed') && (
              <button
                type="button"
                onClick={() => void handlePeriodAction('reopen')}
                disabled={reconMutations.reopen.isPending}
                className="inline-flex items-center gap-1.5 rounded-card border border-rose-300 text-rose-700 bg-rose-50 px-3 py-2 text-xs font-semibold hover:bg-rose-100 transition disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Buka Kembali Periode
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 31 Bank Accounts Table */}
      <div className="rounded-card border border-line bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase mr-1">BANK:</span>
            {[
              { id: 'ALL', label: `Semua (${banks.length})` },
              { id: 'MANDIRI', label: 'MANDIRI' },
              { id: 'BCA', label: 'BCA' },
              { id: 'BRI', label: 'BRI' },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setSelectedBankFilter(btn.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedBankFilter === btn.id
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-surface text-slate-600 hover:bg-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari outlet / no rekening..."
              value={searchOutlet}
              onChange={(e) => setSearchOutlet(e.target.value)}
              className="w-full rounded-card border border-line pl-9 pr-3 py-1.5 text-xs text-navy focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-surface/60 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Outlet</th>
                <th className="px-4 py-3">Nomor Rekening</th>
                <th className="px-4 py-3">Bank</th>
                <th className="px-4 py-3 text-right">Saldo 31 Juli 2026</th>
                <th className="px-4 py-3 text-right">Saldo 31 Agustus 2026</th>
                <th className="px-4 py-3 text-right">Mutasi Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredBanks.map((b, idx) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-navy flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {b.outlet}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{b.accountNumber}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${
                        b.bankName === 'MANDIRI'
                          ? 'bg-amber-100 text-amber-800'
                          : b.bankName === 'BCA'
                          ? 'bg-primary-light text-primary-dark'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {b.bankName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{rupiah(b.julBalance)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-navy">{rupiah(b.augBalance)}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-medium ${
                      b.mutation > 0 ? 'text-success' : b.mutation < 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  >
                    {b.mutation > 0 ? `+${rupiah(b.mutation)}` : rupiah(b.mutation)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-surface font-semibold text-navy border-t-2 border-line">
              <tr>
                <td colSpan={4} className="px-4 py-3 uppercase tracking-wider text-xs">Total 31 Rekening Bank Operasional</td>
                <td className="px-4 py-3 text-right font-mono">{rupiah(summary.total_bank_jul)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-primary">{rupiah(summary.total_bank_aug)}</td>
                <td className="px-4 py-3 text-right font-mono text-success">
                  +{rupiah(summary.total_mutation)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
