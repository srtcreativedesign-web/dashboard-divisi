import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { NumericFormat } from "react-number-format";
import { DetailSheet } from "../ui/DetailSheet";
import type { AccTransaction, TransactionPayload } from "../../api/accounting";

const journalSchema = z.object({
  account_id: z.string().min(1, "Rekening wajib dipilih"),
  category_id: z.string().min(1, "Kategori wajib dipilih"),
  transaction_date: z.string().min(1, "Tanggal wajib diisi"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  reference_no: z.string().optional(),
  debit_amount: z.number().min(0, "Debit minimal 0"),
  credit_amount: z.number().min(0, "Kredit minimal 0"),
}).refine(
  (data) => {
    const isDebit = data.debit_amount > 0;
    const isCredit = data.credit_amount > 0;
    // Exactly one must be greater than zero
    return (isDebit && !isCredit) || (!isDebit && isCredit);
  },
  {
    message: "Isi tepat satu nilai debit atau kredit",
    path: ["debit_amount"], // Attaching error to debit_amount for simplicity
  }
);

type JournalFormValues = z.infer<typeof journalSchema>;

interface JournalFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionPayload) => Promise<void>;
  editingTx: AccTransaction | null;
  periodId: string;
  accounts: { id: string; code: string; displayName: string; isActive: boolean }[];
  categories: { id: string; code: string; name: string; isActive: boolean }[];
  isLoading: boolean;
}

export function JournalFormDrawer({
  isOpen,
  onClose,
  onSubmit,
  editingTx,
  periodId,
  accounts,
  categories,
  isLoading,
}: JournalFormDrawerProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      account_id: "",
      category_id: "",
      transaction_date: new Date().toISOString().slice(0, 10),
      description: "",
      reference_no: "",
      debit_amount: 0,
      credit_amount: 0,
    },
  });

  useEffect(() => {
    if (editingTx) {
      reset({
        account_id: editingTx.accountId,
        category_id: editingTx.categoryId,
        transaction_date: editingTx.transactionDate.slice(0, 10),
        description: editingTx.description,
        reference_no: editingTx.referenceNo ?? "",
        debit_amount: Number(editingTx.debitAmount),
        credit_amount: Number(editingTx.creditAmount),
      });
    } else {
      reset({
        account_id: "",
        category_id: "",
        transaction_date: new Date().toISOString().slice(0, 10),
        description: "",
        reference_no: "",
        debit_amount: 0,
        credit_amount: 0,
      });
    }
  }, [editingTx, reset, isOpen]);

  const handleFormSubmit = async (values: JournalFormValues) => {
    await onSubmit({
      ...values,
      period_id: periodId,
      is_draft: true,
      version: editingTx?.version,
    });
  };

  return (
    <DetailSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingTx ? "Edit Jurnal" : "Jurnal Baru"}
      subtitle={editingTx ? "Perbarui entri yang sudah ada." : "Tambahkan entri pencatatan baru."}
      size="md"
      footer={
        <div className="flex w-full justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isLoading}
            className="rounded-input border px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="journal-form"
            disabled={isSubmitting || isLoading}
            className="rounded-input bg-primary px-4 py-2 text-white disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSubmitting || isLoading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      }
    >
      <form id="journal-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Tanggal</label>
          <input
            type="date"
            {...register("transaction_date")}
            className="mt-1 w-full rounded-input border border-line p-2 text-sm"
          />
          {errors.transaction_date && <p className="mt-1 text-xs text-danger">{errors.transaction_date.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Referensi</label>
          <input
            type="text"
            placeholder="Opsional"
            {...register("reference_no")}
            className="mt-1 w-full rounded-input border border-line p-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Rekening</label>
          <select
            {...register("account_id")}
            className="mt-1 w-full rounded-input border border-line p-2 text-sm"
          >
            <option value="">Pilih rekening</option>
            {accounts.filter((x) => x.isActive).map((x) => (
              <option value={x.id} key={x.id}>
                {x.code} · {x.displayName}
              </option>
            ))}
          </select>
          {errors.account_id && <p className="mt-1 text-xs text-danger">{errors.account_id.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Kategori</label>
          <select
            {...register("category_id")}
            className="mt-1 w-full rounded-input border border-line p-2 text-sm"
          >
            <option value="">Pilih kategori</option>
            {categories.filter((x) => x.isActive).map((x) => (
              <option value={x.id} key={x.id}>
                {x.code} · {x.name}
              </option>
            ))}
          </select>
          {errors.category_id && <p className="mt-1 text-xs text-danger">{errors.category_id.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Debit (Rp)</label>
          <Controller
            name="debit_amount"
            control={control}
            render={({ field: { onChange, value } }) => (
              <NumericFormat
                value={value === 0 ? "" : value}
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                allowNegative={false}
                onValueChange={(values) => {
                  onChange(values.floatValue || 0);
                }}
                className="mt-1 w-full rounded-input border border-line p-2 text-sm"
                placeholder="Rp 0"
              />
            )}
          />
          {errors.debit_amount && <p className="mt-1 text-xs text-danger">{errors.debit_amount.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Kredit (Rp)</label>
          <Controller
            name="credit_amount"
            control={control}
            render={({ field: { onChange, value } }) => (
              <NumericFormat
                value={value === 0 ? "" : value}
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp "
                allowNegative={false}
                onValueChange={(values) => {
                  onChange(values.floatValue || 0);
                }}
                className="mt-1 w-full rounded-input border border-line p-2 text-sm"
                placeholder="Rp 0"
              />
            )}
          />
          {errors.credit_amount && <p className="mt-1 text-xs text-danger">{errors.credit_amount.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Deskripsi</label>
          <textarea
            {...register("description")}
            rows={3}
            className="mt-1 w-full rounded-input border border-line p-2 text-sm"
            placeholder="Masukkan keterangan jurnal..."
          />
          {errors.description && <p className="mt-1 text-xs text-danger">{errors.description.message}</p>}
        </div>
      </form>
    </DetailSheet>
  );
}
