import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NumericFormat } from 'react-number-format';
import { z } from 'zod';
import type { AccAccount, AccOutstandingItem } from '../../../api/accounting';
import { DetailSheet } from '../../ui/DetailSheet';

const schema = z.object({ amount: z.number().positive('Nominal harus lebih dari 0'), payment_date: z.string().min(1, 'Tanggal realisasi wajib diisi'), account_id: z.string().min(1, 'Rekening kas/bank wajib dipilih'), notes: z.string().trim().min(10, 'Catatan minimal 10 karakter').max(500) });
type Values = z.infer<typeof schema>;
interface Props { isOpen: boolean; onClose: () => void; onSubmit: (id: string, payload: Values & { version: number }) => Promise<void>; item: AccOutstandingItem | null; accounts: AccAccount[]; isLoading: boolean }
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const fieldClass = 'mt-1.5 w-full rounded-input border border-line bg-panel px-3 py-2.5 text-sm text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

export function OutstandingPayDrawer({ isOpen, onClose, onSubmit, item, accounts, isLoading }: Props) {
  const { control, register, handleSubmit, reset, setError, setValue, watch, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { amount: 0, payment_date: new Date().toISOString().slice(0, 10), account_id: '', notes: '' } });
  const amount = watch('amount');
  useEffect(() => { if (isOpen && item) reset({ amount: item.remaining_amount, payment_date: new Date().toISOString().slice(0, 10), account_id: '', notes: '' }); }, [isOpen, item, reset]);
  if (!item) return null;
  const submit = async (values: Values) => { if (values.amount > item.remaining_amount) { setError('amount', { message: `Maksimal ${money(item.remaining_amount)}` }); return; } await onSubmit(item.id, { ...values, version: item.version }); onClose(); };
  const receivable = item.direction === 'RECEIVABLE';
  return <DetailSheet isOpen={isOpen} onClose={onClose} title={receivable ? 'Catat penerimaan piutang' : 'Catat pembayaran hutang'} subtitle={`${item.code} · versi ${item.version}`} size="md" footer={<div className="flex w-full justify-end gap-2"><button type="button" onClick={onClose} disabled={isSubmitting || isLoading} className="rounded-input border border-line bg-panel px-4 py-2 text-sm font-semibold text-muted">Batal</button><button type="submit" form="outstanding-pay-form" disabled={isSubmitting || isLoading || !accounts.length} className="rounded-input bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting || isLoading ? 'Memproses…' : receivable ? 'Catat penerimaan' : 'Catat pembayaran'}</button></div>}>
    <div className="mb-5 rounded-xl border border-line bg-surface p-4"><p className="text-xs uppercase tracking-wider text-subtle">{item.counterparty_name || 'Pihak belum dicatat'}</p><p className="mt-1 font-semibold text-navy">{item.description}</p><div className="mt-3 flex items-end justify-between gap-4"><span className="text-xs text-subtle">Sisa belum direalisasi</span><strong className="text-lg tabular-nums text-navy">{money(item.remaining_amount)}</strong></div></div>
    <form id="outstanding-pay-form" onSubmit={handleSubmit(submit)} className="space-y-4">
      <label className="block text-sm font-semibold text-muted">Nominal<Controller name="amount" control={control} render={({ field: { value, onChange } }) => <NumericFormat value={value || ''} thousandSeparator="." decimalSeparator="," prefix="Rp " allowNegative={false} decimalScale={0} onValueChange={values => onChange(values.floatValue ?? 0)} className={fieldClass} />} />{errors.amount && <span className="mt-1 block text-xs text-danger">{errors.amount.message}</span>}<button type="button" onClick={() => setValue('amount', item.remaining_amount)} className={`mt-2 rounded-full px-3 py-1 text-xs font-semibold ${amount === item.remaining_amount ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>Realisasi seluruh sisa</button></label>
      <label className="block text-sm font-semibold text-muted">{receivable ? 'Rekening penerimaan' : 'Rekening sumber pembayaran'}<select {...register('account_id')} className={fieldClass}><option value="">Pilih rekening aktif</option>{accounts.filter(account => account.isActive).map(account => <option key={account.id} value={account.id}>{account.code} · {account.displayName}</option>)}</select>{errors.account_id && <span className="mt-1 block text-xs text-danger">{errors.account_id.message}</span>}</label>
      <label className="block text-sm font-semibold text-muted">Tanggal realisasi<input type="date" {...register('payment_date')} className={fieldClass} />{errors.payment_date && <span className="mt-1 block text-xs text-danger">{errors.payment_date.message}</span>}</label>
      <label className="block text-sm font-semibold text-muted">Catatan dan referensi<textarea {...register('notes')} rows={3} className={fieldClass} placeholder="Tuliskan nomor transfer, kuitansi, atau keterangan realisasi" />{errors.notes && <span className="mt-1 block text-xs text-danger">{errors.notes.message}</span>}</label>
    </form>
  </DetailSheet>;
}
