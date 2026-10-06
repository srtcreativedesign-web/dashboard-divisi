import { api } from '../../api/client';

export interface Product { id: string; sku: string; name: string; kind: 'SIM_CARD' | 'ACCESSORY'; provider: string | null; variant: string | null }
export interface Outlet { id: string; code: string; name: string }
export interface Stock { id: string; outlet_id: string; product_id: string; sku: string; name: string; quantity: number; version: number }
export interface Movement { id: string; outlet_id: string; sku: string; name: string; quantity_delta: number; quantity_after: number; kind: string; created_at: string }
export interface Sale { id: string; outlet_id: string; outlet_name: string; product_name: string; business_date: string; quantity: number; unit_price: string; total_amount: string; source_reference: string; status: 'posted' | 'voided'; version: number; void_reason: string | null }
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
};
