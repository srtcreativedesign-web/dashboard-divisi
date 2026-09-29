import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { NumericFormat } from "react-number-format";
import { DetailSheet } from "../../ui/DetailSheet";

const outstandingSchema = z.object({
  description: z.string().min(1, "Deskripsi wajib diisi"),
  amount: z.number().min(1, "Nominal wajib diisi dan > 0"),
  due_date: z.string().min(1, "Jatuh tempo wajib diisi"),
  category_name: z.string().min(1, "Kategori wajib dipilih"),
});

type OutstandingFormValues = z.infer<typeof outstandingSchema>;

interface OutstandingCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OutstandingFormValues) => Promise<void>;
  isLoading: boolean;
}

export function OutstandingCreateDrawer({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: OutstandingCreateDrawerProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OutstandingFormValues>({
    resolver: zodResolver(outstandingSchema),
    defaultValues: {
      description: "",
      amount: 0,
      due_date: new Date().toISOString().slice(0, 10),
      category_name: "Operasional Wrapping",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        description: "",
        amount: 0,
        due_date: new Date().toISOString().slice(0, 10),
        category_name: "Operasional Wrapping",
      });
    }
  }, [isOpen, reset]);

  const handleFormSubmit = async (values: OutstandingFormValues) => {
    await onSubmit(values);
    onClose();
  };

  return (
    <DetailSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Kewajiban Baru"
      subtitle="Tambahkan entri tagihan atau hutang operasional yang belum terbayar."
      size="md"
      footer={
        <div className="flex w-full justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isLoading}
            className="rounded-input border px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer text-sm font-medium"
          >
            Batal
          </button>
          <button
            type="submit"
            form="outstanding-create-form"
            disabled={isSubmitting || isLoading}
            className="rounded-input bg-primary px-4 py-2 text-white disabled:opacity-50 transition-colors cursor-pointer text-sm font-medium shadow-sm"
          >
            {isSubmitting || isLoading ? "Menyimpan..." : "Simpan Kewajiban"}
          </button>
        </div>
      }
    >
      <form id="outstanding-create-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Deskripsi Tagihan / Vendor</label>
          <input
            type="text"
            placeholder="Contoh: TAGIHAN LISTRIK BANDARA T3"
            {...register("description")}
            className="mt-1 w-full rounded-input border border-line p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {errors.description && <p className="mt-1 text-xs text-danger">{errors.description.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Nominal Tagihan (Rp)</label>
          <Controller
            name="amount"
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
                className="mt-1 w-full rounded-input border border-line p-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Rp 0"
              />
            )}
          />
          {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Jatuh Tempo</label>
          <input
            type="date"
            {...register("due_date")}
            className="mt-1 w-full rounded-input border border-line p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {errors.due_date && <p className="mt-1 text-xs text-danger">{errors.due_date.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Kategori Beban</label>
          <select
            {...register("category_name")}
            className="mt-1 w-full rounded-input border border-line p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary bg-white"
          >
            <option value="Operasional Wrapping">Operasional Wrapping</option>
            <option value="Biaya Sewa & Gudang">Biaya Sewa & Gudang</option>
            <option value="Gaji & Tunjangan">Gaji & Tunjangan</option>
            <option value="Back Office">Back Office</option>
          </select>
          {errors.category_name && <p className="mt-1 text-xs text-danger">{errors.category_name.message}</p>}
        </div>
      </form>
    </DetailSheet>
  );
}
