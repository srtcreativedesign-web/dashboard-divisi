import { useEffect, useState } from "react";
import type { AccTransaction, TransactionPayload } from "../../api/accounting";
import { accountingApi } from "../../api/accounting";
import { ApiException } from "../../api/client";
import {
  AccountingQueryState,
  LockedNotice,
} from "../../components/accounting/AccountingStates";
import { useToast } from "../../components/ui/Toast";
import {
  useAccountingAccounts,
  useAccountingCategories,
  useAccountingPeriods,
  useAccountingTransactions,
  useTransactionMutations,
} from "../../hooks/useAccounting";
import { useAuth } from "../../session/AuthContext";
import { Plus } from "lucide-react";

import { JournalTable } from "../../components/accounting/JournalTable";
import { JournalFormDrawer } from "../../components/accounting/JournalFormDrawer";
import { JournalFilterBar } from "../../components/accounting/JournalFilterBar";

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
  const mutations = useTransactionMutations();
  
  const [editingTx, setEditingTx] = useState<AccTransaction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
  const canWrite = user?.role === "ADMIN" && !locked;

  const handleEdit = (tx: AccTransaction) => {
    setEditingTx(tx);
    setIsDrawerOpen(true);
  };

  const handleCreateNew = () => {
    setEditingTx(null);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (payload: TransactionPayload) => {
    try {
      if (editingTx) {
        await mutations.update.mutateAsync({ id: editingTx.id, payload });
      } else {
        await mutations.create.mutateAsync(payload);
      }
      toast(`Jurnal berhasil ${editingTx ? "diperbarui" : "dibuat"}`, "success");
      setEditingTx(null);
    } catch (err) {
      if (err instanceof ApiException && err.code === "VERSION_CONFLICT") {
        toast("Konflik versi: Data sudah diubah pihak lain. Silakan muat ulang.", "error");
        void transactions.refetch();
      } else {
        toast(err instanceof Error ? err.message : "Jurnal gagal disimpan", "error");
      }
    }
  };

  const handleCancel = async (tx: AccTransaction) => {
    const reason = window.prompt("Alasan pembatalan (wajib):")?.trim();
    if (!reason) return;
    try {
      await mutations.cancel.mutateAsync({ id: tx.id, reason });
      toast("Jurnal dibatalkan", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Pembatalan gagal", "error");
    }
  };

  const handleUpload = async (tx: AccTransaction, file?: File) => {
    if (!file) return;
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

  return (
    <section className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Jurnal Aktual</h1>
          <p className="text-sm text-slate-600 mt-1">
            Pencatatan aktual yang deterministik dengan kontrol bukti dan versi.
          </p>
        </div>
        
        {canWrite && (
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center justify-center gap-2 rounded-input bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus className="h-4 w-4" />
            Jurnal Baru
          </button>
        )}
      </header>

      <JournalFilterBar
        periods={periods.data ?? []}
        periodId={periodId}
        setPeriodId={setPeriodId}
        search={search}
        setSearch={setSearch}
      />

      {locked && <LockedNotice />}

      <AccountingQueryState
        loading={transactions.isLoading || periods.isLoading}
        error={transactions.error || periods.error}
        empty={!transactionData.length && !search}
        retry={() => void transactions.refetch()}
      >
        <JournalTable
          transactions={transactionData}
          canWrite={canWrite}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onUpload={handleUpload}
          onDownload={handleDownload}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          totalEntries={totalEntries}
        />
      </AccountingQueryState>

      <JournalFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleSubmit}
        editingTx={editingTx}
        periodId={periodId}
        accounts={accounts.data ?? []}
        categories={categories.data ?? []}
        isLoading={mutations.create.isPending || mutations.update.isPending}
      />
    </section>
  );
}
