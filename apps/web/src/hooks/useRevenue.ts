import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { revenueApi } from '../api/revenue';
import { useAuth } from '../session/AuthContext';

export function useRevenueDaily(params?: Record<string, string | undefined>) {
  const { user, loading } = useAuth();
  return useQuery({ queryKey: ['revenue', 'daily', params, user?.id], queryFn: () => revenueApi.daily(params).then((r) => r.data), enabled: !loading && !!user, staleTime: 2 * 60 * 1000 });
}
export function useRevenueMtd(params?: Record<string, string | undefined>) {
  const { user, loading } = useAuth();
  return useQuery({ queryKey: ['revenue', 'mtd', params, user?.id], queryFn: () => revenueApi.mtd(params).then((r) => r.data), enabled: !loading && !!user, staleTime: 2 * 60 * 1000 });
}
export function useBatchUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, divisionCode, period }: { file: File; divisionCode?: string; period?: string }) =>
      revenueApi.batchUpload(file, { divisionCode: divisionCode ?? '', period: period ?? '' } as Record<string, string>).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['revenue'] }),
  });
}
