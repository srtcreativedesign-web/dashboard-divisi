import { api } from './client';

export interface TenantRecordDto {
  id: string;
  name: string;
  division: 'WRAP' | 'CELL' | 'REFL' | 'MINI' | 'FNB' | 'MC' | 'ACC';
  category: string;
  location: string;
  monthlyRevenue: number;
  monthlyTarget: number;
  status: 'Over Target' | 'On Track' | 'Action Needed';
  growth: number;
  synced_at?: string;
}

export interface SobatStatusDto {
  provider: string;
  configured: boolean;
  status: 'CONFIGURED' | 'UNCONFIGURED';
  base_url: string | null;
  has_api_key: boolean;
  has_company_id: boolean;
  last_sync: string | null;
  scheduler: string;
}

export interface SobatSyncResultDto {
  provider: string;
  source: string;
  division_code?: string | null;
  total_tenants: number;
  synced_at: string;
  tenants: TenantRecordDto[];
}

export const sobathrApi = {
  getStatus: () => api.get<SobatStatusDto>('/sobathr/status'),
  syncTenants: (divisionCode?: string) =>
    api.post<SobatSyncResultDto>('/sobathr/sync-tenants', divisionCode ? { division_code: divisionCode } : {}),
};
