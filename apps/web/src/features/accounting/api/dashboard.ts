import { api } from '../../../api/client';

export interface DashboardOperations {
  month: string; as_of: string; total: number;
  counts: { draft: number; correction: number; submitted: number; pending_approval: number; approved: number };
  approved_amount: string; paid_amount: string; remaining_amount: string;
  unpaid_count: number; partial_count: number; paid_count: number; overdue_count: number;
  due_vouchers: Array<{ id: string; source_reference: string; outlet_name: string; source_division_code: string; due_date: string; remaining_amount: string }>;
}
export const dashboardApi = {
  operations: (month: string) => api.get<DashboardOperations>('/accounting/dashboard/operations', { month }),
};
