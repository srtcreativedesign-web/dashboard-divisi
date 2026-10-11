import { api } from '../../../api/client';
export interface DepositSource { id:string; outlet_name:string; business_date:string; shift:string; source_reference:string; cash_available:string; qris_available:string; edc_available:string; transfer_available:string; other_available:string }
export interface DepositReceipt { id:string; amount:string; received_date:string; evidence_reference:string; status:string; created_by:string }
export interface Deposit { id:string; omzet_id:string; outlet_name:string; business_date:string; shift:string; deposit_date:string; channel:string; amount:string; received_amount:string; remaining_amount:string; destination:string; source_reference:string; evidence_reference:string; status:string; version:number; created_by:string; receipts?:DepositReceipt[]; events?:{action:string; version:number; actor_role:string; reason:string|null; created_at:string; snapshot:{amount:string;received_amount:string;remaining_amount:string;destination:string;evidence_reference:string;receipts:DepositReceipt[]}}[] }
export interface DepositInput { omzet_id:string; channel:string; deposit_date:string; amount:string; destination:string; source_reference:string; evidence_reference:string }
export interface DepositTraceSource { id:string; outlet_name:string; business_date:string; shift:string; source_reference:string }
export interface DepositReconciliation { month:string; as_of:string; total:number; page:number; items:{id:string; outlet_name:string; business_date:string; shift:string; source_reference:string; channels:{channel:string; reported_amount:string; allocated_amount:string; received_amount:string; unallocated_amount:string; remaining_amount:string}[]}[] }
export const depositsApi = {
 reconciliation:(month:string,page:number)=>api.get<DepositReconciliation>('/accounting/deposits/reconciliation',{month,page:String(page)}),
 list:(month:string,page:number,omzetId?:string)=>api.get<{items:Deposit[];total:number;page:number;source?:DepositTraceSource|null}>('/accounting/deposits',omzetId?{omzet_id:omzetId,page:String(page)}:{month,page:String(page)}),
 sources:(month:string,page:number)=>api.get<{items:DepositSource[];total:number;page:number}>('/accounting/deposits/sources',{month,page:String(page)}),
 detail:(id:string)=>api.get<Deposit>(`/accounting/deposits/${id}`),
 create:(d:DepositInput)=>api.post<Deposit>('/accounting/deposits',d),
 receive:(r:Deposit,d:{received_date:string;amount:string;evidence_reference:string})=>api.post<Deposit>(`/accounting/deposits/${r.id}/receive`,{...d,version:r.version}),
 void:(r:Deposit,reason:string,receipt?:string)=>api.post<Deposit>(`/accounting/deposits/${r.id}/${receipt?`receipts/${receipt}/void`:'void'}`,{version:r.version,reason}),
};
