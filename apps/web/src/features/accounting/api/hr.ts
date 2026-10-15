import { api } from '../../../api/client';

export type AttendanceStatus='PRESENT'|'ABSENT'|'LEAVE'|'SICK'|'OFF';
export interface HrRecord {
  id:string;
  employee_id:string;
  employee_code:string;
  employee_name:string;
  kind:'leave'|'attendance';
  start_date:string;
  end_date:string;
  leave_type?:string|null;
  source_days?:string|null;
  approval_reference?:string|null;
  attendance_status?:AttendanceStatus|null;
  schedule_reference?:string|null;
  late_minutes?:number|null;
  source_reference:string;
  status:'recorded'|'voided';
  version:number;
  created_at:string;
  updated_at:string;
  source?:{mode:'read_only';system:'attendance_api'};
}
export interface HrList {
  items:HrRecord[];
  total:number;
  page:number;
  per_page:number;
  source:{mode:'read_only';system:'attendance_api'};
}

export const hrApi={
  list:(kind:'leave'|'attendance',month:string,page:number)=>api.get<HrList>('/accounting/hr/recaps',{kind,month,page:String(page)}),
  detail:(id:string)=>api.get<HrRecord>(`/accounting/hr/recaps/${id}`),
};
