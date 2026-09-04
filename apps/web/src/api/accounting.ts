import { api, downloadFile } from './client';

export interface AccPeriod { id: string; periodMonth: string; status: string; notes?: string; version: number }
export interface AccCategory { id: string; code: string; name: string; parent?: string; isActive: boolean; requiresOutlet: boolean }
export interface AccAccount { id: string; code: string; displayName: string; type: string; isActive: boolean; outletIds?: string[] }
export interface AccAttachment { id: string; fileName: string; fileSize: number; mimeType: string }
export interface AccTransaction { id: string; periodId: string; accountId: string; categoryId: string; outletId?: string; transactionDate: string; description: string; referenceNo?: string; debitAmount: number | string; creditAmount: number | string; runningBalance?: number | string; isDraft: boolean; isCancelled: boolean; cancellationReason?: string; version: number; attachments?: AccAttachment[] }
export interface AccSummary { totalDebit: number | string; totalCredit: number | string; runningBalance: number | string; missingAttachmentCount: number; isReadyForSubmission: boolean }

export interface TransactionPayload { period_id: string; account_id: string; category_id: string; outlet_id?: string; transaction_date: string; description: string; reference_no?: string; debit_amount: number; credit_amount: number; is_draft: boolean; version?: number }
export interface CategoryPayload { code: string; name: string; parent?: string; requires_outlet?: boolean }
export interface AccountPayload { code: string; display_name: string; type: string; outlet_ids?: string[] }

// Outstanding
export interface AccOutstandingItem {
  id: string;
  code: string;
  description: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled';
  category_name?: string;
  account_name?: string;
  outlet_name?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at?: string;
  payments?: { id: string; payment_date: string; amount: number; notes?: string }[];
}

export interface AccOutstandingResponse {
  kpis: {
    total_active_outstanding: number;
    total_paid: number;
    total_items_count: number;
    active_items_count: number;
    actual_cash_balance: number;
    projected_ending_balance: number;
  };
  items: AccOutstandingItem[];
}

// Reconciliation
export interface AccBankItem {
  id: string;
  number: number;
  account_id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  outlet_name: string;
  jul_balance: number;
  aug_balance: number;
  mutation: number;
  is_verified: boolean;
  verified_at?: string;
}

export interface AccReconciliationResponse {
  period?: { id: string; period_month: string; status: string; notes?: string };
  summary: {
    total_bank_accounts: number;
    total_bank_jul: number;
    total_bank_aug: number;
    total_mutation: number;
    cashflow_ending_balance: number;
    variance: number;
    is_matched: boolean;
    unattached_transactions_count: number;
  };
  items: AccBankItem[];
}

// Import
export interface AccImportRow {
  row_number: number;
  status: 'VALID' | 'WARNING' | 'ERROR' | 'DUPLICATE';
  date: string;
  category_code: string;
  original_category?: string;
  category_id?: string;
  account_id?: string;
  account_name?: string;
  reference_no?: string;
  description: string;
  debit: number;
  credit: number;
  errors: string[];
  warnings: string[];
}

export interface AccImportPreviewResponse {
  summary: {
    total_rows: number;
    valid_rows: number;
    warning_rows: number;
    error_rows: number;
    duplicate_candidates: number;
    total_debit: number;
    total_credit: number;
    can_commit: boolean;
  };
  rows: AccImportRow[];
}

// Cashflow Report
export interface AccCashflowReportResponse {
  period: { period_month: string; status: string };
  kpis: {
    initial_cash_balance: number;
    total_revenue: number;
    total_available: number;
    total_operational_expenses: number;
    total_backoffice_expenses: number;
    total_expenses: number;
    ending_cash_balance: number;
    total_bank_ending_balance: number;
    reconciliation_variance: number;
    is_reconciled: boolean;
    total_active_outstanding: number;
    projected_ending_balance: number;
  };
  breakdown: {
    revenue: { code: string; name: string; amount: number }[];
    operational: { code: string; name: string; amount: number }[];
    backoffice: { code: string; name: string; amount: number }[];
  };
}

const base = '/accounting';

export const accountingApi = {
  periods: () => api.get<AccPeriod[]>(`${base}/periods`),
  categories: () => api.get<AccCategory[]>(`${base}/categories`, { per_page: '100' }),
  accounts: () => api.get<AccAccount[]>(`${base}/accounts`, { per_page: '100' }),
  transactions: (filters: Record<string, string | undefined>) => api.get<AccTransaction[]>(`${base}/transactions`, filters),
  summary: (periodId: string) => api.get<AccSummary>(`${base}/transactions/summary`, { period_id: periodId }),
  createTransaction: (payload: TransactionPayload) => api.post<AccTransaction>(`${base}/transactions`, payload),
  updateTransaction: (id: string, payload: TransactionPayload) => api.put<AccTransaction>(`${base}/transactions/${id}`, payload),
  cancelTransaction: (id: string, reason: string) => api.post<AccTransaction>(`${base}/transactions/${id}/cancel`, { cancellation_reason: reason }),
  transitionPeriod: (id: string, status: string, notes?: string) => api.post<AccPeriod>(`${base}/periods/${id}/transition`, { status, notes }),
  createCategory: (payload: CategoryPayload) => api.post<AccCategory>(`${base}/categories`, payload),
  updateCategory: (id: string, payload: Partial<CategoryPayload>) => api.patch<AccCategory>(`${base}/categories/${id}`, payload),
  deactivateCategory: (id: string) => api.post<AccCategory>(`${base}/categories/${id}/deactivate`, {}),
  createAccount: (payload: AccountPayload) => api.post<AccAccount>(`${base}/accounts`, payload),
  updateAccount: (id: string, payload: Partial<AccountPayload>) => api.patch<AccAccount>(`${base}/accounts/${id}`, payload),
  deactivateAccount: (id: string) => api.post<AccAccount>(`${base}/accounts/${id}/deactivate`, {}),
  uploadAttachment: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.upload<AccAttachment>(`${base}/transactions/${id}/attachments`, form);
  },
  downloadAttachment: (id: string, attachmentId: string) => downloadFile(`${base}/transactions/${id}/attachments/${attachmentId}/download`),

  // Outstanding API
  outstandings: (params?: { period_id?: string; status?: string; search?: string }) =>
    api.get<AccOutstandingResponse>(`${base}/outstandings`, params),
  createOutstanding: (payload: { description: string; amount: number; due_date?: string; category_name?: string; period_id?: string; account_id?: string }) =>
    api.post<AccOutstandingItem>(`${base}/outstandings`, payload),
  payOutstanding: (id: string, payload: { amount: number; payment_date?: string; notes?: string; account_id?: string }) =>
    api.post<{ outstanding: AccOutstandingItem }>(`${base}/outstandings/${id}/pay`, payload),
  cancelOutstanding: (id: string, reason: string) =>
    api.post<AccOutstandingItem>(`${base}/outstandings/${id}/cancel`, { reason }),

  // Reconciliation API
  reconciliations: (params?: { period_id?: string; bank_name?: string; search?: string }) =>
    api.get<AccReconciliationResponse>(`${base}/reconciliations`, params),
  submitReconciliation: (payload: { period_id: string; notes?: string }) =>
    api.post<AccPeriod>(`${base}/reconciliations/submit`, payload),
  approveReconciliation: (payload: { period_id: string; notes?: string }) =>
    api.post<AccPeriod>(`${base}/reconciliations/approve`, payload),
  closeReconciliation: (payload: { period_id: string; notes?: string }) =>
    api.post<AccPeriod>(`${base}/reconciliations/close`, payload),
  reopenReconciliation: (payload: { period_id: string; notes: string }) =>
    api.post<AccPeriod>(`${base}/reconciliations/reopen`, payload),

  // Import API
  previewImport: (payload: FormData | { period_id?: string; rows: unknown[] }) => {
    if (payload instanceof FormData) {
      return api.upload<AccImportPreviewResponse>(`${base}/import/preview`, payload);
    }
    return api.post<AccImportPreviewResponse>(`${base}/import/preview`, payload);
  },
  commitImport: (payload: { period_id?: string; rows: unknown[] }) =>
    api.post<{ batch_id: string; inserted_count: number }>(`${base}/import/commit`, payload),

  // Cashflow Report API
  cashflowReport: (params?: { period_month?: string }) =>
    api.get<AccCashflowReportResponse>(`${base}/cashflow/report`, params),
};
