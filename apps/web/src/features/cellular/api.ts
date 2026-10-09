import { api } from '../../api/client';

export interface Product { id: string; sku: string; name: string; kind: 'SIM_CARD' | 'ACCESSORY'; provider: string | null; variant: string | null }
export interface Outlet { id: string; code: string; name: string }
export interface Stock { id: string; outlet_id: string; product_id: string; sku: string; name: string; quantity: number; version: number }
export interface Movement { id: string; outlet_id: string; sku: string; name: string; quantity_delta: number; quantity_after: number; kind: string; created_at: string }
export interface Sale { id: string; outlet_id: string; outlet_name: string; product_name: string; business_date: string; quantity: number; unit_price: string; total_amount: string; source_reference: string; status: 'posted' | 'voided'; version: number; void_reason: string | null }
export interface DailyClosing { id: string; outlet_id: string; business_date: string; shift_code: string; system_sales: string; cash: string; qris: string; edc: string; transfer: string; difference: string; source_reference: string; status: 'draft' | 'submitted' | 'validated' | 'approved' | 'correction'; review_note: string | null; version: number }
export interface SettlementSource { daily_closing_id: string; outlet_id: string; outlet_name: string; business_date: string; shift_code: string; channel: 'cash' | 'qris' | 'edc' | 'transfer'; expected: string; submitted: string; reconciled: string; remaining: string }
export interface Settlement { id: string; daily_closing_id: string; outlet_id: string; outlet_name: string; business_date: string; shift_code: string; channel: SettlementSource['channel']; settlement_date: string; gross: string; fee: string; net: string; destination: string; reference: string; status: 'draft' | 'submitted' | 'reconciled' | 'correction'; review_note: string | null; created_by: string; version: number }
export const cellularApi = {
  products: () => api.get<Product[]>('/cellular/products'),
  outlets: () => api.get<Outlet[]>('/cellular/outlets'),
  stock: () => api.get<Stock[]>('/cellular/stock'),
  movements: () => api.get<Movement[]>('/cellular/movements'),
  sales: (month: string) => api.get<Sale[]>('/cellular/sales', { month }),
  createProduct: (data: { sku: string; name: string; kind: string; provider: string | null; variant: string | null }) => api.post<Product>('/cellular/products', data),
  adjust: (data: { product_id: string; outlet_id: string; quantity_delta: number; reference: string; reason: string }) => api.post<Stock[]>('/cellular/stock', data),
  sell: (data: { product_id: string; outlet_id: string; business_date: string; quantity: number; unit_price: string; reference: string }) => api.post<Sale[]>('/cellular/sales', data),
  voidSale: (sale: Sale, reason: string) => api.post<Sale[]>(`/cellular/sales/${sale.id}/void`, { version: sale.version, reason }),
  dailyClosings: (month: string) => api.get<DailyClosing[]>('/cellular/daily-closings', { month }),
  saveDailyClosing: (data: { outlet_id: string; business_date: string; shift_code: string; cash: string; qris: string; edc: string; transfer: string; source_reference: string }) => api.post<DailyClosing>('/cellular/daily-closings', data),
  transitionDailyClosing: (row: DailyClosing, action: 'submit' | 'validate' | 'approve' | 'correction', note?: string) => api.post<DailyClosing>(`/cellular/daily-closings/${row.id}/${action}`, { version: row.version, note }),
  settlementSources: (month: string) => api.get<SettlementSource[]>('/cellular/settlements/sources', { month }),
  settlements: (month: string) => api.get<Settlement[]>('/cellular/settlements', { month }),
  saveSettlement: (data: { id?: string; version?: number; daily_closing_id: string; channel: SettlementSource['channel']; settlement_date: string; gross: string; fee: string; destination: string; reference: string }) => api.post<Settlement>('/cellular/settlements', data),
  transitionSettlement: (row: Settlement, action: 'submit' | 'reconcile' | 'correction', note?: string) => api.post<Settlement>(`/cellular/settlements/${row.id}/${action}`, { version: row.version, note }),
};
