import { api } from './client';

export const revenueApi = {
  daily: (params?: Record<string, string | undefined>) => api.get<unknown>('/revenue/daily', params),
  mtd: (params?: Record<string, string | undefined>) => api.get<unknown>('/revenue/mtd', params),
  tenants: (params?: Record<string, string | undefined>) => api.get<unknown>('/revenue/tenants', params),
  createDaily: (payload: Record<string, unknown>) => api.post<unknown>('/revenue/daily', payload),
  batchUpload: (file: File, extra?: Record<string, string>) => {
    const form = new FormData();
    form.append('file', file);
    if (extra?.divisionCode) form.append('divisionCode', extra.divisionCode);
    if (extra?.period) form.append('period', extra.period);
    return api.upload<unknown>('/revenue/batch-upload', form);
  },
  transactions: (params?: Record<string, string | undefined>) => api.get<unknown>('/reports/transactions', params),
  reconciliation: (params?: Record<string, string | undefined>) => api.get<unknown>('/reports/reconciliation', params),
};
