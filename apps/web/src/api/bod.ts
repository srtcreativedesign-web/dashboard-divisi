import { api } from './client';

export interface BodOverviewItem {
  divisionCode: string;
  divisionName: string;
  revenue: { gross: number | null; source: string; freshness: string };
  target: { value: number; achievement: number; source: string };
  performance: { score: number; level: string; source: string };
  workforce: { count: number; risk: string; source: string };
  period: { from: string; to: string };
  drillDown: { href: string };
}

export interface ExecutiveItem {
  divisionCode: string;
  divisionName: string;
  metrics: { kpiCode: string; value: unknown; compatible: boolean }[];
  compatibleDivisions: Record<string, string[]>;
}

export interface PnlComparisonData {
  period: string;
  entities: {
    id: string;
    name: string;
    netProfit: number;
    grossProfit: number;
    netRevenue: number;
  }[];
}

export interface BodReportMetric {
  id?: string;
  category: 'FINANCIAL' | 'PROGRESS' | 'VOLUME' | string;
  metric_key: string;
  metric_label: string;
  metric_value: number;
  unit: string;
  display_order: number;
}

export interface BodReportBreakdown {
  id?: string;
  entity_code: string;
  entity_name: string;
  figures: Record<string, number | string>;
  display_order: number;
}

export interface BodDivisionReportItem {
  id: string;
  division_code: string;
  period_start: string;
  period_end: string;
  status: 'PENDING' | 'REVISION' | 'SUBMITTED' | 'ACKNOWLEDGED' | string;
  submitted_by?: string | null;
  submitted_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  notes?: string | null;
  metrics: BodReportMetric[];
  breakdowns?: BodReportBreakdown[];
  submitter?: { id: string; name: string; email: string } | null;
  reviewer?: { id: string; name: string; email: string } | null;
  acknowledger?: { id: string; name: string; email: string } | null;
}

export interface ProjectReportPreview {
  id?: string;
  division_code: string;
  period_start: string;
  period_end: string;
  is_already_submitted: boolean;
  status: 'PENDING' | 'REVISION' | 'SUBMITTED' | 'ACKNOWLEDGED' | string;
  submitted_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  reviewer_name?: string | null;
  acknowledged_at?: string | null;
  notes?: string | null;
  metrics: BodReportMetric[];
  breakdowns: BodReportBreakdown[];
}

export const bodApi = {
  overview: (from?: string, to?: string) => api.get<BodOverviewItem[]>('/bod/overview', { from, to }),
  executive: () => api.get<ExecutiveItem[]>('/bod/executive-read-model'),
  kpiCompatibility: (a: string, b: string, kpi: string) => api.get<{ divisionA: string; divisionB: string; kpiCode: string; compatible: boolean }>('/bod/kpi-compatibility', { a, b, kpi }),
  divisionConfigs: () => api.get<{ divisionCode: string; divisionName: string; enabledModules: string[]; enabledKpis: string[]; isActive: boolean }[]>('/division-configs'),
  pnlComparison: (year?: number, divisions?: string[], outlets?: string[], periodType?: 'monthly' | 'daily', month?: number) => {
    const params: Record<string, string> = { year: year?.toString() ?? '' };
    if (periodType) params.periodType = periodType;
    if (month) params.month = month.toString();
    if (divisions) divisions.forEach((d, i) => params[`divisions[${i}]`] = d);
    if (outlets) outlets.forEach((o, i) => params[`outlets[${i}]`] = o);
    return api.get<PnlComparisonData[]>('/bod/pnl-comparison', params);
  },
  getReports: (division?: string, status?: string) =>
    api.get<{ data: BodDivisionReportItem[]; current_page: number; total: number }>('/bod/reports', {
      division,
      status,
    }),
  getReportDetail: (id: string) => api.get<BodDivisionReportItem>(`/bod/reports/${id}`),
  acknowledgeReport: (id: string) => api.post<BodDivisionReportItem>(`/bod/reports/${id}/acknowledge`),
};
