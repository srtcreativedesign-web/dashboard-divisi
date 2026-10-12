import { hasCapability } from '../../../session/capability';
import { useEffect, useState } from "react";
import type { AccTransaction, TransactionPayload } from "../../../api/accounting";
import { accountingApi } from "../../../api/accounting";
import { ApiException } from "../../../api/client";
import {
  AccountingQueryState,
  LockedNotice,
} from "../../../components/accounting/AccountingStates";
import { useToast } from "../../../components/ui/Toast";
import {
  useAccountingAccounts,
  useAccountingCategories,
  useAccountingPeriods,
  useAccountingTransactions,
  useAccountingSummary,
  useTransactionMutations,
} from "../../../hooks/useAccounting";
import { useAuth } from "../../../session/AuthContext";
import { AlertTriangle, ArrowRight, FileCheck2, Plus, Scale, WalletCards } from "lucide-react";

import { JournalTable } from "../../../components/accounting/JournalTable";
import { JournalFormDrawer } from "../../../components/accounting/JournalFormDrawer";
import { JournalFilterBar } from "../../../components/accounting/JournalFilterBar";
import { AccountingPageHeader } from "../../../components/accounting/AccountingPageHeader";
import { DetailSheet } from "../../../components/ui/DetailSheet";
import { Link } from "react-router-dom";
import { formatRupiah } from "../../../utils/format";

export default function AccountingJournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const periods = useAccountingPeriods();
  const [periodId, setPeriodId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  
  const accounts = useAccountingAccounts();
  const categories = useAccountingCategories();
  const transactions = useAccountingTransactions(periodId, search, page);
  const summary = useAccountingSummary(periodId);
  const mutations = useTransactionMutations();
  
  const busy = mutations.create.isPending || mutations.update.isPending || mutations.cancel.isPending || mutations.upload.isPending;

  const [editingTx, setEditingTx] = useState<AccTransaction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cancellingTx, setCancellingTx] = useState<AccTransaction | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (!periodId && periods.data?.[0]) setPeriodId(periods.data[0].id);
  }, [periodId, periods.data]);

  // Reset page when search or period changes
  useEffect(() => {
    setPage(1);
  }, [periodId, search]);

  const period = periods.data?.find((p) => p.id === periodId);
  const locked = Boolean(
    period &&
    !["draft", "reopened", "needs_correction"].includes(period.status),
  );
  const canWrite = hasCapability(user?.role ?? '', 'write:acc_transaction', user?.divisionCode) && Boolean(periodId && period) && !locked;

  const handleEdit = (tx: AccTransaction) => {
    if (!canWrite || busy) return;
    setEditingTx(tx);
    setIsDrawerOpen(true);
  };

  const handleCreateNew = () => {
    if (!canWrite || busy) return;
    setEditingTx(null);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (payload: TransactionPayload) => {
    if (!canWrite || busy || payload.period_id !== periodId) return;
    try {
      if (editingTx) {
        await mutations.update.mutateAsync({ id: editingTx.id, payload });
      } else {
        await mutations.create.mutateAsync(payload);
      }
      toast(`Jurnal berhasil ${editingTx ? "diperbarui" : "dibuat"}`, "success");
      setEditingTx(null);
      setIsDrawerOpen(false);
    } catch (err) {
      if (err instanceof ApiException && err.code === "VERSION_CONFLICT") {
        toast("Konflik versi: Data sudah diubah pihak lain. Silakan muat ulang.", "error");
        void transactions.refetch();
      } else {
        toast(err instanceof Error ? err.message : "Jurnal gagal disimpan", "error");
      }
    }
  };

  const handleCancel = (tx: AccTransaction) => {
    if (!canWrite || busy) return;
    setCancellingTx(tx);
    setCancelReason("");
  };

  const confirmCancel = async () => {
    if (!canWrite || busy || !cancellingTx || cancelReason.trim().length < 10) return;
    try {
      await mutations.cancel.mutateAsync({ id: cancellingTx.id, reason: cancelReason.trim() });
      toast("Jurnal dibatalkan", "success");
      setCancellingTx(null);
      setCancelReason("");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Pembatalan gagal", "error");
    }
  };

  const handleUpload = async (tx: AccTransaction, file?: File) => {
    if (!file || !canWrite || busy) return;
    try {
      await mutations.upload.mutateAsync({ id: tx.id, file });
      toast("Bukti berhasil diunggah", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Unggah gagal", "error");
    }
  };

  const handleDownload = async (
    tx: AccTransaction,
    attachmentId: string,
    name: string,
  ) => {
    try {
      const blob = await accountingApi.downloadAttachment(tx.id, attachmentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Unduh gagal", "error");
    }
  };

  const transactionData = transactions.data?.data ?? [];
  const meta = transactions.data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.per_page) : 0;
  const totalEntries = meta?.total ?? 0;
  const periodLabel = period ? new Date(`${period.periodMonth.slice(0, 7)}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'belum dipilih';

  return (
    <section className="space-y-6 pb-6">
      <AccountingPageHeader
        area="Pembukuan · Transaksi"
        title="Jurnal transaksi"
        description="Kelola draf pembukuan, kelengkapan bukti, dan koreksi transaksi dalam periode yang terkontrol."
        actions={canWrite ? (
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center justify-center gap-2 rounded-input bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus className="h-4 w-4" />
            Buat jurnal
          </button>
        ) : undefined}
      />

      <section aria-label="Alur pembukuan" className="rounded-card-lg border border-line bg-panel p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Alur pembukuan terkendali</p>
        <ol className="mt-4 grid gap-3 md:grid-cols-4">{['Periksa dokumen sumber', 'Buat draf jurnal', 'Lengkapi bukti', 'Ajukan periode'].map((step, index) => <li key={step} className="flex items-center gap-3 rounded-card border border-line bg-surface p-3 text-sm font-medium text-navy"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">0{index + 1}</span>{step}</li>)}</ol>
        <nav aria-label="Sumber jurnal" className="mt-4 flex flex-wrap gap-2"><Link to="/accounting/kas-bank/pencocokan" className="inline-flex min-h-10 items-center gap-2 rounded-input border border-line px-4 text-sm font-semibold text-primary-700 dark:text-primary-300">Periksa pencocokan <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link><Link to="/accounting/pengeluaran/voucher" className="inline-flex min-h-10 items-center gap-2 rounded-input border border-line px-4 text-sm font-semibold text-primary-700 dark:text-primary-300">Periksa voucher <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link><Link to="/accounting/pembukuan/periode" className="inline-flex min-h-10 items-center gap-2 rounded-input border border-line px-4 text-sm font-semibold text-primary-700 dark:text-primary-300">Kontrol periode <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></nav>
        <p className="mt-3 text-xs leading-relaxed text-subtle">Voucher dan pencocokan menjadi referensi pemeriksaan. Sistem tidak membuat jurnal otomatis dari dokumen tersebut.</p>
      </section>

      <JournalFilterBar
        periods={periods.data ?? []}
        periodId={periodId}
        disabled={busy}
        setPeriodId={value => { if (busy) return; setPeriodId(value); setPage(1); setEditingTx(null); setIsDrawerOpen(false); setCancellingTx(null); setCancelReason(""); }}
        search={search}
        setSearch={value => { setSearch(value); setPage(1); }}
      />

      {summary.data && <><section aria-label="Ringkasan jurnal periode" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Entri aktif', value: String(summary.data.totalTransactions), note: summary.data.isReadyForSubmission ? 'Siap diajukan' : 'Masih perlu dilengkapi', icon: FileCheck2, tone: 'text-primary-700 dark:text-primary-300' },
          { label: 'Total debit', value: formatRupiah(summary.data.totalDebit), note: periodLabel, icon: WalletCards, tone: 'text-emerald-700 dark:text-emerald-300' },
          { label: 'Total kredit', value: formatRupiah(summary.data.totalCredit), note: periodLabel, icon: Scale, tone: 'text-rose-700 dark:text-rose-300' },
          { label: 'Bukti belum lengkap', value: String(summary.data.missingAttachmentCount), note: summary.data.missingAttachmentCount ? 'Lengkapi sebelum pengajuan' : 'Seluruh entri memiliki bukti', icon: AlertTriangle, tone: summary.data.missingAttachmentCount ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300' },
        ].map(item => <article key={item.label} className="rounded-card-lg border border-line bg-panel p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-subtle">{item.label}</p><p className="mt-2 break-words text-2xl font-bold tabular-nums text-navy">{item.value}</p><p className="mt-2 text-xs text-subtle">{item.note}</p></div><item.icon aria-hidden="true" className={`h-5 w-5 ${item.tone}`} /></div></article>)}
      </section><section aria-label="Status periode jurnal" className="flex flex-wrap items-center justify-between gap-4 rounded-card-lg border border-line bg-panel p-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-subtle">Periode aktif</p><p className="mt-1 font-semibold text-navy">{periodLabel} · {period?.status ?? summary.data.status}</p></div><div className="text-right"><p className="text-xs text-subtle">Selisih debit − kredit</p><p className="mt-1 font-semibold tabular-nums text-navy">{formatRupiah(summary.data.netBalance)}</p></div></section></>}

      {locked && <LockedNotice />}

      <AccountingQueryState
        loading={transactions.isLoading || periods.isLoading || summary.isLoading}
        error={transactions.error || periods.error || summary.error}
        empty={!transactionData.length && !search}
        retry={() => { void periods.refetch(); void transactions.refetch(); void summary.refetch(); }}
        emptyTitle={period ? `Belum ada transaksi di periode ${period.periodMonth}` : 'Belum ada periode Accounting'}
        emptyDescription={period ? 'Pilih rekening dan kategori untuk mencatat jurnal pada periode ini.' : 'Buat periode melalui menu Periode Akuntansi sebelum mencatat jurnal.'}
        emptyAction={
          canWrite ? (
            <button
              onClick={handleCreateNew}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-input bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Plus className="h-4 w-4" />
              Buat Entri Jurnal Baru
            </button>
          ) : undefined
        }
      >
        <JournalTable
          transactions={transactionData}
          canWrite={canWrite && !busy}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onUpload={handleUpload}
          onDownload={handleDownload}
          page={page}
          setPage={value => { if (!busy) setPage(value); }}
          totalPages={totalPages}
          totalEntries={totalEntries}
        />
      </AccountingQueryState>

      <JournalFormDrawer
        key={periodId}
        isOpen={isDrawerOpen && canWrite}
        onClose={() => { if (!busy) setIsDrawerOpen(false); }}
        onSubmit={handleSubmit}
        editingTx={editingTx}
        periodId={periodId}
        periodLabel={periodLabel}
        accounts={accounts.data ?? []}
        categories={categories.data ?? []}
        isLoading={mutations.create.isPending || mutations.update.isPending}
      />
      <DetailSheet isOpen={Boolean(cancellingTx && canWrite)} onClose={() => { if (!busy) { setCancellingTx(null); setCancelReason(""); } }} title="Batalkan jurnal" subtitle="Pembatalan mempertahankan jejak transaksi dan mencatat alasan koreksi." size="md" footer={<div className="flex w-full justify-end gap-2"><button type="button" disabled={busy} onClick={() => { setCancellingTx(null); setCancelReason(""); }} className="rounded-input border border-line px-4 py-2 text-sm font-semibold">Kembali</button><button type="button" disabled={busy || cancelReason.trim().length < 10} onClick={() => void confirmCancel()} className="rounded-input bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{mutations.cancel.isPending ? 'Membatalkan...' : 'Batalkan jurnal'}</button></div>}>
        <div className="space-y-4"><div className="rounded-card border border-line bg-surface p-4"><p className="text-xs text-subtle">Entri yang dibatalkan</p><p className="mt-1 font-semibold text-navy">{cancellingTx?.description}</p><p className="mt-1 text-xs text-subtle">{cancellingTx?.referenceNo ? `Referensi ${cancellingTx.referenceNo}` : 'Tanpa nomor referensi'}</p></div><label htmlFor="journal-cancel-reason" className="block text-sm font-medium text-navy">Alasan pembatalan<textarea id="journal-cancel-reason" rows={4} maxLength={500} value={cancelReason} onChange={event => setCancelReason(event.target.value)} className="mt-2 w-full rounded-input border border-line bg-panel p-3 text-sm" placeholder="Jelaskan kesalahan dan tindak lanjut minimal 10 karakter" /></label><p className="text-xs text-subtle">{cancelReason.trim().length}/10 karakter minimum · pembatalan tidak menghapus audit trail.</p></div>
      </DetailSheet>
    </section>
  );
}
