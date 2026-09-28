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

export interface CashlessRecord {
  id: number;
  division_code?: string;
  outlet_id?: number;
  date: string;
  shift: number;
  nominal_qris: number;
  nominal_edc: number;
  total_cashless?: number;
  no_storan_finance?: string;
}

export interface LaundryRecord {
  id: number;
  division_code?: string;
  outlet_id?: number;
  date: string;
  weight_kg: number;
  cost_per_kg: number;
  total_bill: number;
  vendor_name?: string;
}

export interface PnlSupportData {
  date: string;
  revenue_cash: number;
  revenue_qris: number;
  revenue_edc: number;
  total_revenue: number;
  total_hbp: number;
  laundry_cost: number;
  gross_margin: number;
}

export interface BonusRecord {
  id: number;
  employee_name?: string;
  employee_id?: number;
  division_code: string;
  period_start: string;
  period_end: string;
  sesi_30m?: number;
  sesi_60m?: number;
  sesi_90m?: number;
  rate_30m?: number;
  rate_60m?: number;
  rate_90m?: number;
  total_treatments?: number;
  basic_bonus?: number;
  extra_bonus?: number;
  grand_total?: number;
}

// API Functions
export const adminApi = {
  // Leaves
  getLeaves: (params?: { division_code?: string; employee_id?: number | string }) =>
    api.get<LeaveRecord[]>('/admin/leaves', {
      division_code: params?.division_code,
      employee_id: params?.employee_id !== undefined ? String(params.employee_id) : undefined,
    }),

  createLeave: (data: Omit<LeaveRecord, 'id' | 'status'>) =>
    api.post<LeaveRecord>('/admin/leaves', data),

  updateLeaveStatus: (id: number, status: 'PENDING' | 'APPROVED' | 'REJECTED') =>
    api.patch<LeaveRecord>(`/admin/leaves/${id}/status`, { status }),

  // Attendance Realizations
  getAttendanceRealizations: (params?: { division_code?: string; employee_id?: number | string }) =>
    api.get<AttendanceRealization[]>('/admin/attendance-realizations', {
      division_code: params?.division_code,
      employee_id: params?.employee_id !== undefined ? String(params.employee_id) : undefined,
    }),

  createAttendanceRealization: (data: Omit<AttendanceRealization, 'id' | 'status'>) =>
    api.post<AttendanceRealization>('/admin/attendance-realizations', data),

  updateAttendanceStatus: (id: number, status: 'DRAFT' | 'SUBMITTED' | 'LOCKED') =>
    api.patch<AttendanceRealization>(`/admin/attendance-realizations/${id}/status`, { status }),

  // Therapist Revenue
  createTherapistRevenue: (data: Omit<TherapistRevenue, 'id'>) =>
    api.post<TherapistRevenue>('/admin/therapist-revenues', data),

  // Chair Usage Audit
  createChairAudit: (data: Omit<ChairUsageAudit, 'id' | 'deviation' | 'status'>) =>
    api.post<ChairUsageAudit>('/admin/chair-usage-audits', data),

  // Deposits
  getDeposits: (params?: { division_code?: string }) =>
    api.get<Deposit[]>('/admin/deposits', params),

  createDeposit: (data: Omit<Deposit, 'id' | 'status' | 'proof_file'>) =>
    api.post<Deposit>('/admin/deposits', data),

  // Stock Cards
  getStockCards: (params?: { division_code?: string }) =>
    api.get<StockCard[]>('/admin/stock-cards', params),

  createStockCard: (data: Omit<StockCard, 'id' | 'cogs'>) =>
    api.post<StockCard>('/admin/stock-cards', data),

  // Vouchers
  createVoucher: (data: Omit<Voucher, 'id' | 'voucher_no' | 'status' | 'created_by'>) =>
    api.post<Voucher>('/admin/vouchers', data),

  // Cashless
  getCashless: (params?: { division_code?: string }) =>
    api.get<CashlessRecord[]>('/admin/cashless', params),

  createCashless: (data: Omit<CashlessRecord, 'id' | 'total_cashless'>) =>
    api.post<CashlessRecord>('/admin/cashless', data),

  // Laundry
  getLaundry: (params?: { division_code?: string }) =>
    api.get<LaundryRecord[]>('/admin/laundry', params),

  createLaundry: (data: Omit<LaundryRecord, 'id' | 'total_bill'>) =>
    api.post<LaundryRecord>('/admin/laundry', data),

  // PnL Support Data
  getPnlSupport: (params?: { date?: string; division_code?: string }) =>
    api.get<PnlSupportData>('/admin/pnl-support', params),

  // Bonus Records
  getBonusRecords: (params?: { division_code?: string }) =>
    api.get<BonusRecord[]>('/admin/bonus-records', params),

  createBonusRecord: (data: Omit<BonusRecord, 'id' | 'grand_total'>) =>
    api.post<BonusRecord>('/admin/bonus-records', data),
};