import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sobathrApi, type SobatStatusDto, type SobatSyncResultDto } from '../api/sobathr';
import { useAuth } from '../session/AuthContext';

export function useSobatStatus() {
  const { user, loading } = useAuth();
  return useQuery<SobatStatusDto>({
    queryKey: ['sobathr', 'status', user?.id],
    queryFn: () => sobathrApi.getStatus().then((r) => r.data),
    enabled: !loading && !!user,
    staleTime: 60 * 1000,
  });
}

export function useSobatTenants(divisionCode?: string | null) {
  const { user, loading } = useAuth();
  return useQuery<SobatSyncResultDto>({
    queryKey: ['sobathr', 'tenants', user?.id, divisionCode],
    queryFn: () => sobathrApi.syncTenants(divisionCode ?? undefined).then((r) => r.data),
    enabled: !loading && !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useSobatSyncTenants() {
  const qc = useQueryClient();
  return useMutation<SobatSyncResultDto, Error, string | undefined>({
    mutationFn: (divisionCode?: string) =>
      sobathrApi.syncTenants(divisionCode).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sobathr'] });
      void qc.invalidateQueries({ queryKey: ['revenue'] });
    },
  });
}
