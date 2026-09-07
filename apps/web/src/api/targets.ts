import { api } from './client';

export const targetsApi = {
  currentMonth: (params?: Record<string, string | undefined>) => api.get<unknown>('/targets/current-month', params),
  runRate: (params?: Record<string, string | undefined>) => api.get<unknown>('/targets/run-rate', params),
  upsert: (payload: Record<string, unknown>) => api.post<unknown>('/targets/tenant', payload),
  approve: (id: string) => api.post<unknown>(`/targets/${id}/approve`),
  returnTarget: (id: string, note: string) => api.post<unknown>(`/targets/${id}/return`, { note }),
};
