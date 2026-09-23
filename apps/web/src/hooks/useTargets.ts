import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { targetsApi } from '../api/targets';
import { useAuth } from '../session/AuthContext';

export function useTargetsCurrent(params?: Record<string, string | undefined>) {
  const { user, loading } = useAuth();
  return useQuery({ queryKey: ['targets', 'current', params, user?.id], queryFn: () => targetsApi.currentMonth(params).then((r) => r.data), enabled: !loading && !!user, staleTime: 2 * 60 * 1000 });
}
export function useTargetsRunRate(params?: Record<string, string | undefined>) {
  const { user, loading } = useAuth();
  return useQuery({ queryKey: ['targets', 'runRate', params, user?.id], queryFn: () => targetsApi.runRate(params).then((r) => r.data), enabled: !loading && !!user, staleTime: 2 * 60 * 1000 });
}
export function useUpsertTarget() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (payload: Record<string, unknown>) => targetsApi.upsert(payload).then((r) => r.data), onSuccess: () => void qc.invalidateQueries({ queryKey: ['targets'] }) });
}
export function useApproveTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => targetsApi.approve(id).then((r) => r.data),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['targets', 'current'] });
      const previous = qc.getQueriesData({ queryKey: ['targets', 'current'] });
      qc.setQueriesData({ queryKey: ['targets', 'current'] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: any) => (t.id === id ? { ...t, status: 'approved' } : t));
      });
      return { previous };
    },
    onError: (err, vars, ctx) => {
      ctx?.previous?.forEach(([key, val]) => {
        qc.setQueryData(key, val);
      });
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['targets'] }),
  });
}
export function useReturnTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => targetsApi.returnTarget(id, note).then((r) => r.data),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ['targets', 'current'] });
      const previous = qc.getQueriesData({ queryKey: ['targets', 'current'] });
      qc.setQueriesData({ queryKey: ['targets', 'current'] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: any) => (t.id === id ? { ...t, status: 'needs_revision' } : t));
      });
      return { previous };
    },
    onError: (err, vars, ctx) => {
      ctx?.previous?.forEach(([key, val]) => {
        qc.setQueryData(key, val);
      });
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['targets'] }),
  });
}
