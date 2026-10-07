import { AccountingQueryState } from "../../../components/accounting/AccountingStates";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useToast } from "../../../components/ui/Toast";
import {
  useAccountingOutstandings,
  useOutstandingMutations,
} from "../../../hooks/useAccounting";

import {
  AgingBucketBar,
  type AgingBucketId,
  getItemBucket,
} from "../../../components/accounting/AgingBucketBar";

import { OutstandingKpiCards } from "../../../components/accounting/outstanding/OutstandingKpiCards";
import { OutstandingFilterBar } from "../../../components/accounting/outstanding/OutstandingFilterBar";
import { OutstandingTable } from "../../../components/accounting/outstanding/OutstandingTable";
import { OutstandingCreateDrawer } from "../../../components/accounting/outstanding/OutstandingCreateDrawer";
import { OutstandingPayDrawer } from "../../../components/accounting/outstanding/OutstandingPayDrawer";

interface OutstandingItem {
  id: string;
  code: string;
  description: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  category: string;
}

const rupiah = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

export default function AccountingOutstandingPage() {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedAgingBucket, setSelectedAgingBucket] =
    useState<AgingBucketId | null>(null);

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [payItem, setPayItem] = useState<OutstandingItem | null>(null);

  const query = useAccountingOutstandings({
    status: filterStatus !== "all" ? filterStatus : undefined,
    search: search ? search : undefined,
  });
  const { data: serverData, isLoading } = query;
  const mutations = useOutstandingMutations();

  const fallbackItems: OutstandingItem[] = [];

  const items: OutstandingItem[] = serverData?.items
    ? serverData.items.map((it) => ({
        id: it.id,
        code: it.code,
        description: it.description,
        amount: it.amount,
        paidAmount: it.paid_amount,
        remainingAmount: it.remaining_amount,
        dueDate: it.due_date,
        status: it.status,
        category: it.category_name ?? "Belum dikategorikan",
      }))
    : fallbackItems;

  const kpis = serverData?.kpis ?? {
    total_active_outstanding: items
      .filter((x) => x.status !== "cancelled" && x.status !== "paid")
      .reduce((sum, x) => sum + x.remainingAmount, 0),
    total_paid: items.reduce((sum, x) => sum + x.paidAmount, 0),
    actual_cash_balance: 0,
    projected_ending_balance:
      0 -
      items
        .filter((x) => x.status !== "cancelled" && x.status !== "paid")
        .reduce((sum, x) => sum + x.remainingAmount, 0),
  };

  const handleCreateSubmit = async (data: {
    description: string;
    amount: number;
    due_date: string;
    category_name: string;
  }) => {
    try {
      await mutations.create.mutateAsync({
        description: data.description.trim(),
        amount: data.amount,
        due_date: data.due_date,
        category_name: data.category_name,
      });
      toast(
        `Kewajiban "${data.description}" senilai ${rupiah(
          data.amount
        )} berhasil disimpan`,
        "success"
      );
    } catch {
      toast("Gagal menyimpan kewajiban", "error");
    }
  };

  const handlePaySubmit = async (
    id: string,
    payload: { amount: number; payment_date: string; notes: string }
  ) => {
    try {
      await mutations.pay.mutateAsync({ id, payload });
      toast(
        `Realisasi pembayaran ${rupiah(
          payload.amount
        )} berhasil dicatat`,
        "success"
      );
    } catch {
      toast("Gagal memproses pembayaran", "error");
    }
  };

  const handleCancel = async (item: OutstandingItem) => {
    if (
      !confirm(
        `Batalkan kewajiban "${item.description}"? (Akan ditandai soft-cancel)`
      )
    )
      return;
    try {
      await mutations.cancel.mutateAsync({
        id: item.id,
        reason: "Dibatalkan oleh Admin ACC",
      });
      toast("Kewajiban berhasil dibatalkan (soft-cancel)", "info");
    } catch {
      toast("Gagal membatalkan kewajiban", "error");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchStatus = filterStatus === "all" || item.status === filterStatus;
    const matchSearch =
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchBucket =
      !selectedAgingBucket || getItemBucket(item) === selectedAgingBucket;
    return matchStatus && matchSearch && matchBucket;
  });

  const activeItemsCount = items.filter(
    (x) => x.status !== "cancelled" && x.status !== "paid"
  ).length;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary dark:text-primary-300">
            ACCOUNTING CONTROL CENTER
          </p>
          <h1 className="mt-1 text-2xl font-bold text-navy">
            Hutang & Piutang
          </h1>
          <p className="mt-1 text-sm text-muted flex items-center">
            Pencatatan kewajiban belum lunas, realisasi pembayaran, dan proyeksi
            saldo kas akhir.
            {isLoading && (
              <span className="ml-2 text-xs text-primary dark:text-primary-300 animate-pulse font-medium">
                (Menyinkronkan...)
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateDrawerOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-input bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Catat Kewajiban Baru
        </button>
      </header>

      <AccountingQueryState loading={isLoading} error={query.error} empty={!serverData} retry={() => void query.refetch()}>
      <OutstandingKpiCards kpis={kpis} activeItemsCount={activeItemsCount} />

      <details className="rounded-xl border border-line bg-panel p-4"><summary className="text-sm font-semibold">Analisis umur tagihan {selectedAgingBucket ? '· filter aktif' : ''}</summary><div className="mt-4">
      <AgingBucketBar
        items={items}
        selectedBucket={selectedAgingBucket}
        onSelectBucket={setSelectedAgingBucket}
      />
      </div></details>

      <div className="rounded-card-lg border border-line bg-panel shadow-sm overflow-hidden">
        <OutstandingFilterBar
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          search={search}
          setSearch={setSearch}
        />

        <OutstandingTable
          items={filteredItems}
          onPay={setPayItem}
          onCancel={handleCancel}
        />
      </div>

      </AccountingQueryState>
      <OutstandingCreateDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={mutations.create.isPending}
      />

      <OutstandingPayDrawer
        isOpen={Boolean(payItem)}
        onClose={() => setPayItem(null)}
        onSubmit={handlePaySubmit}
        item={payItem}
        isLoading={mutations.pay.isPending}
      />
    </section>
  );
}
