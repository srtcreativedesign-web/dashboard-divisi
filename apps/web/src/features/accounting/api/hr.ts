import { api } from '../../../api/client';
export interface HrEmployee { id: string; code: string; name: string; is_active: boolean }
export interface HrValues { kind: 'leave' | 'attendance'; start_date: string; end_date?: string; leave_type?: string; source_days?: string; approval_reference?: string; attendance_status?: string; schedule_reference?: string; late_minutes?: number }
export interface HrRecord extends HrValues { id: string; employee_id: string; employee_code: string; employee_name: string; source_reference: string; status: 'recorded' | 'voided'; version: number; events?: { id: string; action: string; actor_role: string; reason: string | null; created_at: string; before: HrRecord | null; after: HrRecord }[] }
export interface HrList { items: HrRecord[]; total: number; page: number; per_page: number }
export const hrApi = {
  employees: () => api.get<HrEmployee[]>('/accounting/hr/employees'),
  createEmployee: (data: { code: string; name: string; source_reference: string }) => api.post<HrEmployee>('/accounting/hr/employees',data),
  list: (kind: string, month: string, page: number) => api.get<HrList>('/accounting/hr/recaps',{kind,month,page:String(page)}),
  detail: (id: string) => api.get<HrRecord>(`/accounting/hr/recaps/${id}`),
  create: (data: HrValues & { employee_id: string; source_reference: string }) => api.post<HrRecord>('/accounting/hr/recaps',data),
  correct: (record: HrRecord, values: HrValues, reason: string) => api.put<HrRecord>(`/accounting/hr/recaps/${record.id}`,{...values,version:record.version,reason}),
  void: (record: HrRecord, reason: string) => api.post<HrRecord>(`/accounting/hr/recaps/${record.id}/void`,{version:record.version,reason}),
};
