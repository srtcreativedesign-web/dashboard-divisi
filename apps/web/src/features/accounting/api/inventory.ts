import { api } from '../../../api/client';

export type InventoryKind='RECEIPT'|'ISSUE'|'TRANSFER'|'STOCK_COUNT';
export interface InventoryItem {id:string;sku:string;name:string;unit:string;minimum_stock:string;active:boolean}
export interface InventoryLocation {id:string;code:string;name:string;kind:'WAREHOUSE'|'OUTLET';active:boolean}
export interface InventoryBalance {id:string;item_id:string;location_id:string;quantity:string;sku:string;item_name:string;unit:string;minimum_stock:string;location_code:string;location_name:string}
export interface InventoryLine {id:string;item_id:string;quantity:string|null;counted_quantity:string|null;sku:string;item_name:string;unit:string}
export interface PurchaseVoucher {id:string;voucher_no:string;voucher_date:string;due_date:string;entity_name:string;source_reference:string;amount:string;outlet_name:string;source_division_code:string;receipt_count:number;posted_receipt_count:number}
export interface InventoryDocument {id:string;document_number:string;kind:InventoryKind;source_location_id:string|null;destination_location_id:string|null;source_location_name:string|null;destination_location_name:string|null;voucher_id:string|null;voucher_no:string|null;voucher_entity_name:string|null;voucher_source_reference:string|null;voucher_amount:string|null;business_date:string;reference:string;notes:string|null;status:'draft'|'submitted'|'approved'|'correction';created_by:string;review_note:string|null;version:number;lines:InventoryLine[]}
export interface InventoryCatalog {items:InventoryItem[];locations:InventoryLocation[];balances:InventoryBalance[]}
export const inventoryApi={
 catalog:()=>api.get<InventoryCatalog>('/accounting/inventory/catalog'),
 documents:(month:string)=>api.get<{items:InventoryDocument[];month:string}>('/accounting/inventory/documents',{month}),
 purchaseVouchers:(month:string)=>api.get<PurchaseVoucher[]>('/accounting/inventory/purchase-vouchers',{month}),
 createItem:(data:{sku:string;name:string;unit:string;minimum_stock:string})=>api.post<InventoryItem>('/accounting/inventory/items',data),
 createLocation:(data:{code:string;name:string;kind:string})=>api.post<InventoryLocation>('/accounting/inventory/locations',data),
 createDocument:(data:unknown)=>api.post<InventoryDocument>('/accounting/inventory/documents',data),
 updateDocument:(doc:InventoryDocument,data:unknown)=>api.put<InventoryDocument>(`/accounting/inventory/documents/${doc.id}`,{...(data as object),version:doc.version}),
 transition:(doc:InventoryDocument,action:'submit'|'approve'|'correction',note?:string)=>api.post<InventoryDocument>(`/accounting/inventory/documents/${doc.id}/${action}`,{version:doc.version,note}),
};
