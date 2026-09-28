import { api } from "./client";

export interface LeaveRecord {
  id: number;
  employee_id: number;
  employee_name?: string;
  division_code: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_taken: number;
  status: string;
  notes?: string;
}

export interface AttendanceRealization {
  id: number;
  employee_id: number;
  division_code: string;
  period_start: string;
  period_end: string;
  days_scheduled: number;
  days_present: number;
  days_absent: number;
  days_leave: number;
  days_sick: number;
  minutes_late: number;
  status: string;
}

export interface TherapistRevenue {
  id: number;
  division_code: string;
  outlet_id: number;
  employee_id: number;
  date: string;
  shift: number;
  treatments_count: number;
  revenue_share: number;
  tips: number;
}

export interface ChairUsageAudit {
  id: number;
  division_code: string;
  outlet_id: number;
  date: string;
  chair_no: number;
  counter_start: number;
  counter_end: number;
  cctv_used: number;
  pos_used: number;
  deviation: number;
  status: string;
  notes?: string;
}

export interface Deposit {
  id: number;
  division_code: string;
  outlet_id: number;
  date: string;
  shift: number;
  cash_collected: number;
  cash_deposited: number;
  bank_destination: string;
  proof_file?: string;
  status: string;
}

export interface StockCard {
  id: number;
  division_code: string;
  outlet_id: number;
  item_name: string;
  date: string;
  qty_initial: number;
  qty_in: number;
  qty_out: number;
  qty_actual: number;
  unit_cost: number;
  cogs: number;
}

export interface Voucher {
  id: number;
  division_code: string;
  voucher_no: string;
  type: 'BILLING' | 'PURCHASING';
  entity_name: string;
  amount: number;
  description?: string;
  status: string;
  created_by: number;
}

export interface BonusRecord {
  id: number;
  employee_id: number;
  division_code: string;
  period_start: string;
  period_end: string;
  total_treatments: number;
  basic_bonus: number;
  extra_bonus: number;
  grand_total: number;
}

// API Functions
export const adminApi = {
  // Leaves
  getLeaves: (params?: { division_code?: string; employee_id?: number }) =>
    api.get<LeaveRecord[]>('/admin/leaves', params),

  createLeave: (data: Omit<LeaveRecord, 'id' | 'status'>) =>
    api.post<LeaveRecord>('/admin/leaves', data),

  // Attendance Realizations
  createAttendanceRealization: (data: Omit<AttendanceRealization, 'id' | 'status'>) =>
    api.post<AttendanceRealization>('/admin/attendance-realizations', data),

  // Therapist Revenue
  createTherapistRevenue: (data: Omit<TherapistRevenue, 'id'>) =>
    api.post<TherapistRevenue>('/admin/therapist-revenues', data),

  // Chair Usage Audit
  createChairAudit: (data: Omit<ChairUsageAudit, 'id' | 'deviation' | 'status'>) =>
    api.post<ChairUsageAudit>('/admin/chair-usage-audits', data),

  // Deposits
  createDeposit: (data: Omit<Deposit, 'id' | 'status' | 'proof_file'>) =>
    api.post<Deposit>('/admin/deposits', data),

  // Stock Cards
  createStockCard: (data: Omit<StockCard, 'id' | 'cogs'>) =>
    api.post<StockCard>('/admin/stock-cards', data),

  // Vouchers
  createVoucher: (data: Omit<Voucher, 'id' | 'voucher_no' | 'status' | 'created_by'>) =>
    api.post<Voucher>('/admin/vouchers', data),

  // Bonus Records
  createBonusRecord: (data: Omit<BonusRecord, 'id' | 'grand_total'>) =>
    api.post<BonusRecord>('/admin/bonus-records', data),
};