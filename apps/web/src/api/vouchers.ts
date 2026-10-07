import { api, downloadFile } from './client';
import type { OmzetOutlet } from './omzet';

export type VoucherStatus = 'draft' | 'submitted' | 'correction' | 'pending_approval' | 'approved';
export interface VoucherInput {
  type: 'BILLING' | 'PURCHASING' | 'OPERATIONAL';
  company_name?: string | null;
  priority?: 'URGENT' | 'NORMAL' | 'SCHEDULED';
  payment_method?: 'CASH' | 'BANK' | 'UNDECIDED';
  bank_name?: string | null;
  bank_account_holder?: string | null;
  bank_account?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  tax_invoice_number?: string | null;
  billing_period?: string | null;
  delivery_reference?: string | null;
  outlet_id: string;
  voucher_date: string;
  due_date: string;
  entity_name: string;
  source_reference: string;
  amount: string;
  description: string;
}
export interface VoucherRecord extends VoucherInput {
  payment_summary?: { paid_amount: string; remaining_amount: string; status: 'UNPAID' | 'PARTIAL' | 'PAID' };
  payments?: VoucherPayment[];
  bank_account_masked?: string | null;
  created_at?: string;
  reviewed_at?: string | null;
  approved_at?: string | null;
  attachments?: VoucherAttachment[];
  id: string;
  voucher_no: string;
  outlet_name: string;
  source_division_code: string;
  status: VoucherStatus;
  version: number;
  created_by: string;
  reviewed_by: string | null;
  approved_by: string | null;
  review_notes: string | null;
  decision_notes: string | null;
  events: Array<{ id: number; action: string; actor_role: string; created_at: string; metadata: { version: number; status: VoucherStatus; reason?: string | null; snapshot: VoucherInput } }>;
}
export interface VoucherList { items: VoucherRecord[]; total: number; current_page: number; last_page: number }
export interface VoucherAttachment { id: string; original_name: string; mime_type: string; size_bytes: number; sha256: string; uploaded_by: string; created_at: string }
export interface VoucherPaymentInput { paid_date: string; amount: string; method: 'CASH' | 'BANK'; reference: string; notes: string }
export interface VoucherPayment extends VoucherPaymentInput { id: string; status: 'recorded' | 'voided'; created_by: string; created_at: string; original_name: string; voided_at?: string | null; void_reason?: string | null }
const base = '/accounting/vouchers';
export const voucherApi = {
  recordPayment: (record: VoucherRecord, input: VoucherPaymentInput, file: File) => {
    const form = new FormData(); form.append('version',String(record.version)); form.append('file',file);
    Object.entries(input).forEach(([key,value]) => form.append(key,value));
    return api.upload<VoucherRecord>(base+'/'+record.id+'/payments',form);
  },
  voidPayment: (record: VoucherRecord, payment: VoucherPayment, reason: string) => api.post<VoucherRecord>(base+'/'+record.id+'/payments/'+payment.id+'/void',{version:record.version,reason}),
  downloadPayment: async (record: VoucherRecord, payment: VoucherPayment) => {
    const blob=await downloadFile(base+'/'+record.id+'/payments/'+payment.id+'/download');
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=payment.original_name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },
  attach: (record: VoucherRecord, file: File) => {
    const form = new FormData(); form.append('version', String(record.version)); form.append('file', file);
    return api.upload<VoucherRecord>(base + '/' + record.id + '/attachments', form);
  },
  downloadAttachment: async (record: VoucherRecord, attachment: VoucherAttachment) => {
    const blob = await downloadFile(base + '/' + record.id + '/attachments/' + attachment.id + '/download');
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = attachment.original_name; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  outlets: () => api.get<OmzetOutlet[]>(base + '/outlets'),
  list: (filters: { month: string; status: string; type: string; outlet_id: string; page: string }) => api.get<VoucherList>(base, filters),
  detail: (id: string) => api.get<VoucherRecord>(base + '/' + id),
  save: (input: VoucherInput, record?: { id: string; version: number }) => record
    ? api.put<VoucherRecord>(base + '/' + record.id, { ...input, version: record.version })
    : api.post<VoucherRecord>(base, input),
  action: (record: VoucherRecord, action: 'submit' | 'review' | 'decide', data: { decision?: 'validate' | 'return' | 'approve' | 'reject'; reason?: string } = {}) =>
    api.post<VoucherRecord>(base + '/' + record.id + '/' + action, { version: record.version, ...data }),
};
