/**
 * SOP 1B: hooks org real BE — mengganti getMockOutlets.
 * Source: GET /org/divisions + GET /org/outlets?divisionCode=WRAP (Laravel OrgReadModelService, scope server-side).
 * Fallback ke DIVISIONS statis bila BE belum terjangkau / test (setupTests mock).
 */
import { useQuery } from '@tanstack/react-query';

import { api } from '../api/client';
import { DIVISIONS, getRealOutlets } from '../config/divisions';
import type { DivisionCode } from '../config/divisions';

interface Division {
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

interface Outlet {
  code: string;
  name: string;
  divisionId: string;
  isActive: boolean;
}

export function useOrgDivisions() {
  return useQuery({
    queryKey: ['org', 'divisions'],
    queryFn: async () => {
      const res = await api.get<Division[]>('/org/divisions');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    // Fallback placeholder agar UI tetap render walau offline/test
    placeholderData: DIVISIONS.map((d, i) => ({ code: d.code, name: d.name, isActive: true, sortOrder: i })) as Division[],
  });
}

export function useOrgOutlets(divisionCode?: string) {
  return useQuery({
    queryKey: ['org', 'outlets', divisionCode ?? 'all'],
    queryFn: async () => {
      const res = await api.get<Outlet[]>('/org/outlets', divisionCode ? { divisionCode } : undefined);
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: getRealOutlets(divisionCode).map((o) => ({
      code: o.code,
      name: o.name,
      divisionId: o.divisionCode,
      isActive: true,
    })),
  });
}

export function isDivisionCodeReal(value: string): value is DivisionCode {
  return DIVISIONS.some((d) => d.code === value);
}
