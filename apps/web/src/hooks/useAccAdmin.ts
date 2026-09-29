/**
 * React Query hooks: Acc Admin Operasional
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  accAdminApi,
  type StoranPayload,
  type CashlessPayload,
  type LaundryPayload,
  type StokPayload,
  type UtilisasiPayload,
  type KomisiPayload,
} from '../api/accAdmin';

export const accAdminKeys = {
  all: ['acc-admin'] as const,
  dashboard: ['acc-admin', 'dashboard'] as const,
  storan: ['acc-admin', 'storan'] as const,
  cashless: ['acc-admin', 'cashless'] as const,
  laundry: ['acc-admin', 'laundry'] as const,
  stok: ['acc-admin', 'stok'] as const,
  utilisasi: ['acc-admin', 'utilisasi'] as const,
  komisi: ['acc-admin', 'komisi'] as const,
};

export function useAccAdminDashboard() {
  return useQuery({
    queryKey: accAdminKeys.dashboard,
    queryFn: async () => (await accAdminApi.dashboard()).data,
  });
}

export function useAccAdminStoran() {
  return useQuery({
    queryKey: accAdminKeys.storan,
    queryFn: async () => (await accAdminApi.getStoran()).data,
  });
}

export function useAccAdminCashless() {
  return useQuery({
    queryKey: accAdminKeys.cashless,
    queryFn: async () => (await accAdminApi.getCashless()).data,
  });
}

export function useAccAdminLaundry() {
  return useQuery({
    queryKey: accAdminKeys.laundry,
    queryFn: async () => (await accAdminApi.getLaundry()).data,
  });
}

export function useAccAdminStok() {
  return useQuery({
    queryKey: accAdminKeys.stok,
    queryFn: async () => (await accAdminApi.getStok()).data,
  });
}

export function useAccAdminUtilisasi() {
  return useQuery({
    queryKey: accAdminKeys.utilisasi,
    queryFn: async () => (await accAdminApi.getUtilisasi()).data,
  });
}

export function useAccAdminKomisi() {
  return useQuery({
    queryKey: accAdminKeys.komisi,
    queryFn: async () => (await accAdminApi.getKomisi()).data,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

function useInvalidate(...keys: readonly (readonly string[])[]) {
  const qc = useQueryClient();
  return () => keys.forEach(k => void qc.invalidateQueries({ queryKey: k }));
}

export function useSaveStoran() {
  const invalidate = useInvalidate(accAdminKeys.storan, accAdminKeys.dashboard);
  return useMutation({
    mutationFn: (p: StoranPayload) => accAdminApi.saveStoran(p),
    onSuccess: invalidate,
  });
}

export function useSaveCashless() {
  const invalidate = useInvalidate(accAdminKeys.cashless, accAdminKeys.dashboard);
  return useMutation({
    mutationFn: (p: CashlessPayload) => accAdminApi.saveCashless(p),
    onSuccess: invalidate,
  });
}

export function useSaveLaundry() {
  const invalidate = useInvalidate(accAdminKeys.laundry, accAdminKeys.dashboard);
  return useMutation({
    mutationFn: (p: LaundryPayload) => accAdminApi.saveLaundry(p),
    onSuccess: invalidate,
  });
}

export function useSaveStok() {
  const invalidate = useInvalidate(accAdminKeys.stok, accAdminKeys.dashboard);
  return useMutation({
    mutationFn: (p: StokPayload) => accAdminApi.saveStok(p),
    onSuccess: invalidate,
  });
}

export function useSaveUtilisasi() {
  const invalidate = useInvalidate(accAdminKeys.utilisasi, accAdminKeys.dashboard);
  return useMutation({
    mutationFn: (p: UtilisasiPayload) => accAdminApi.saveUtilisasi(p),
    onSuccess: invalidate,
  });
}

export function useHitungKomisi() {
  const invalidate = useInvalidate(accAdminKeys.komisi, accAdminKeys.dashboard);
  return useMutation({
    mutationFn: (p: KomisiPayload) => accAdminApi.hitungKomisi(p),
    onSuccess: invalidate,
  });
}
