import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  accountingApi,
  type TransactionPayload,
  type CategoryPayload,
  type AccountPayload,
  type AccOutstandingResponse,
  type AccReconciliationResponse,
  type AccCashflowReportResponse,
  type AccImportPreviewResponse,
} from '../api/accounting';

export const accountingKeys = {
  all: ['accounting'] as const,
  periods: ['accounting', 'periods'] as const,
  categories: ['accounting', 'categories'] as const,
  accounts: ['accounting', 'accounts'] as const,
  outstandings: ['accounting', 'outstandings'] as const,
  reconciliations: ['accounting', 'reconciliations'] as const,
  cashflowReport: ['accounting', 'cashflow-report'] as const,
};

export function useAccountingPeriods() {
  return useQuery({
    queryKey: accountingKeys.periods,
    queryFn: async () => (await accountingApi.periods()).data,
  });
}

export function useAccountingCategories() {
  return useQuery({
    queryKey: accountingKeys.categories,
    queryFn: async () => (await accountingApi.categories()).data,
  });
}

export function useAccountingAccounts() {
  return useQuery({
    queryKey: accountingKeys.accounts,
    queryFn: async () => (await accountingApi.accounts()).data,
  });
}

export function useAccountingTransactions(periodId: string, search = '') {
  return useQuery({
    queryKey: ['accounting', 'transactions', periodId, search],
    queryFn: async () => (await accountingApi.transactions({ period_id: periodId, search })).data,
    enabled: Boolean(periodId),
  });
}

export function useAccountingSummary(periodId: string) {
  return useQuery({
    queryKey: ['accounting', 'summary', periodId],
    queryFn: async () => (await accountingApi.summary(periodId)).data,
    enabled: Boolean(periodId),
  });
}

export function useTransactionMutations() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: accountingKeys.all });
  return {
    create: useMutation({ mutationFn: (p: TransactionPayload) => accountingApi.createTransaction(p), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: TransactionPayload }) => accountingApi.updateTransaction(id, payload), onSuccess: refresh }),
    cancel: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => accountingApi.cancelTransaction(id, reason), onSuccess: refresh }),
    upload: useMutation({ mutationFn: ({ id, file }: { id: string; file: File }) => accountingApi.uploadAttachment(id, file), onSuccess: refresh }),
  };
}

export function useCategoryMutations() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: accountingKeys.all });
  return {
    create: useMutation({ mutationFn: (p: CategoryPayload) => accountingApi.createCategory(p), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<CategoryPayload> }) => accountingApi.updateCategory(id, payload), onSuccess: refresh }),
    deactivate: useMutation({ mutationFn: (id: string) => accountingApi.deactivateCategory(id), onSuccess: refresh }),
  };
}

export function useAccountMutations() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: accountingKeys.all });
  return {
    create: useMutation({ mutationFn: (p: AccountPayload) => accountingApi.createAccount(p), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<AccountPayload> }) => accountingApi.updateAccount(id, payload), onSuccess: refresh }),
    deactivate: useMutation({ mutationFn: (id: string) => accountingApi.deactivateAccount(id), onSuccess: refresh }),
  };
}

// Outstandings hooks
export function useAccountingOutstandings(params?: { period_id?: string; status?: string; search?: string }) {
  return useQuery<AccOutstandingResponse>({
    queryKey: ['accounting', 'outstandings', params],
    queryFn: async () => (await accountingApi.outstandings(params)).data,
  });
}

export function useOutstandingMutations() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: ['accounting', 'outstandings'] });
  return {
    create: useMutation({
      mutationFn: (p: { description: string; amount: number; due_date?: string; category_name?: string; period_id?: string; account_id?: string }) =>
        accountingApi.createOutstanding(p),
      onSuccess: refresh,
    }),
    pay: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: { amount: number; payment_date?: string; notes?: string; account_id?: string } }) =>
        accountingApi.payOutstanding(id, payload),
      onSuccess: refresh,
    }),
    cancel: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        accountingApi.cancelOutstanding(id, reason),
      onSuccess: refresh,
    }),
  };
}

// Reconciliations hooks
export function useAccountingReconciliations(params?: { period_id?: string; bank_name?: string; search?: string }) {
  return useQuery<AccReconciliationResponse>({
    queryKey: ['accounting', 'reconciliations', params],
    queryFn: async () => (await accountingApi.reconciliations(params)).data,
  });
}

export function useReconciliationMutations() {
  const client = useQueryClient();
  const refresh = () => {
    client.invalidateQueries({ queryKey: ['accounting', 'reconciliations'] });
    client.invalidateQueries({ queryKey: accountingKeys.periods });
  };
  return {
    submit: useMutation({
      mutationFn: (p: { period_id: string; notes?: string }) => accountingApi.submitReconciliation(p),
      onSuccess: refresh,
    }),
    approve: useMutation({
      mutationFn: (p: { period_id: string; notes?: string }) => accountingApi.approveReconciliation(p),
      onSuccess: refresh,
    }),
    close: useMutation({
      mutationFn: (p: { period_id: string; notes?: string }) => accountingApi.closeReconciliation(p),
      onSuccess: refresh,
    }),
    reopen: useMutation({
      mutationFn: (p: { period_id: string; notes: string }) => accountingApi.reopenReconciliation(p),
      onSuccess: refresh,
    }),
  };
}

// Cashflow Report hook
export function useAccountingCashflowReport(params?: { period_month?: string }) {
  return useQuery<AccCashflowReportResponse>({
    queryKey: ['accounting', 'cashflow-report', params],
    queryFn: async () => (await accountingApi.cashflowReport(params)).data,
  });
}

// Import hooks
export function useImportMutations() {
  const client = useQueryClient();
  return {
    preview: useMutation<{ data: AccImportPreviewResponse }, Error, FormData | { period_id?: string; rows: unknown[] }>({
      mutationFn: async (payload) => await accountingApi.previewImport(payload),
    }),
    commit: useMutation({
      mutationFn: (payload: { period_id?: string; rows: unknown[] }) =>
        accountingApi.commitImport(payload),
      onSuccess: () => {
        client.invalidateQueries({ queryKey: accountingKeys.all });
      },
    }),
  };
}
