import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { NumericFormat } from "react-number-format";
import { DetailSheet } from "../../ui/DetailSheet";

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

const paySchema = z.object({
  amount: z.number().min(1, "Nominal pembayaran harus > 0"),
  payment_date: z.string().min(1, "Tanggal bayar wajib diisi"),
  bank: z.string().min(1, "Sumber rekening wajib dipilih"),
});

type PayFormValues = z.infer<typeof paySchema>;

interface OutstandingPayDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, payload: { amount: number; payment_date: string; notes: string }) => Promise<void>;
  item: OutstandingItem | null;
  isLoading: boolean;
}

const rupiah = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

export function OutstandingPayDrawer({
  isOpen,
  onClose,
  onSubmit,
  item,
  isLoading,
}: OutstandingPayDrawerProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PayFormValues>({
    resolver: zodResolver(paySchema),
    defaultValues: {
      amount: 0,
      payment_date: new Date().toISOString().slice(0, 10),
      bank: "155-00-1485895-8 (MANDIRI PIONER)",
    },
  });

  const amountVal = watch("amount");

  useEffect(() => {
    if (isOpen && item) {
      reset({
        amount: item.remainingAmount,
        payment_date: new Date().toISOString().slice(0, 10),
        bank: "155-00-1485895-8 (MANDIRI PIONER)",
      });
    }
  }, [isOpen, item, reset]);

  const handleFormSubmit = async (values: PayFormValues) => {
    if (!item) return;
    if (values.amount > item.remainingAmount) {
      // Manual error, or we could add refine to schema if we passed the remaining amount to it.
      alert(`Nominal melebihi sisa tagihan (${rupiah(item.remainingAmount)})`);
      return;
    }

    await onSubmit(item.id, {
      amount: values.amount,
      payment_date: values.payment_date,
      notes: `Realisasi via ${values.bank}`,
    });
    onClose();
  };

  if (!item) return null;

  return (
    <DetailSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Realisasi Pembayaran"
      subtitle={item.code}
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
            form="outstanding-pay-form"
            disabled={isSubmitting || isLoading}
            className="rounded-input bg-emerald-600 px-4 py-2 text-white disabled:opacity-50 transition-colors cursor-pointer text-sm font-medium shadow-sm hover:bg-emerald-700"
          >
            {isSubmitting || isLoading ? "Memproses..." : "Konfirmasi Bayar"}
          </button>
        </div>
      }
    >
      <div className="mb-6 rounded-card bg-surface p-4 text-sm space-y-1.5 border border-line">
        <p className="text-slate-600">Kewajiban: <span className="font-semibold text-navy">{item.description}</span></p>
        <p className="text-slate-600">Sisa Tagihan: <span className="font-bold text-rose-600 font-mono text-base">{rupiah(item.remainingAmount)}</span></p>
      </div>

      <form id="outstanding-pay-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Nominal Pembayaran (Rp)</label>
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
                  const num = values.floatValue || 0;
                  if (num <= item.remainingAmount) {
                    onChange(num);
                  }
                }}
                className="mt-1 w-full rounded-input border border-line p-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary font-bold text-navy"
                placeholder="Rp 0"
              />
            )}
          />
          {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>}
          
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setValue("amount", item.remainingAmount)}
              className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                amountVal === item.remainingAmount ? "bg-primary text-white" : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
              }`}
            >
              Bayar Lunas ({rupiah(item.remainingAmount)})
            </button>
            {item.remainingAmount > 10000000 && (
              <button
                type="button"
                onClick={() => setValue("amount", item.remainingAmount / 2)}
                className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                  amountVal === item.remainingAmount / 2 ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                }`}
              >
                Bayar 50%
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Sumber Rekening Bank Operasional</label>
          <select
            {...register("bank")}
            className="mt-1 w-full rounded-input border border-line p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono bg-white text-navy"
          >
            <option value="155-00-1485895-8 (MANDIRI PIONER)">155-00-1485895-8 (MANDIRI PIONER T1C)</option>
            <option value="551-0480491 (BCA PIONER)">551-0480491 (BCA PIONER T1C)</option>
            <option value="155-00-1511537-4 (MANDIRI ROBUSTPACK)">155-00-1511537-4 (MANDIRI ROBUSTPACK T3B)</option>
            <option value="155-00-1268016-4 (MANDIRI ROBUSTPACK T2F)">155-00-1268016-4 (MANDIRI ROBUSTPACK T2F)</option>
            <option value="155-00-1302784-5 (MANDIRI FIRST SECURE)">155-00-1302784-5 (MANDIRI FIRST SECURE T2E)</option>
          </select>
          {errors.bank && <p className="mt-1 text-xs text-danger">{errors.bank.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Tanggal Bayar</label>
          <input
            type="date"
            {...register("payment_date")}
            className="mt-1 w-full rounded-input border border-line p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {errors.payment_date && <p className="mt-1 text-xs text-danger">{errors.payment_date.message}</p>}
        </div>
      </form>
    </DetailSheet>
  );
}
