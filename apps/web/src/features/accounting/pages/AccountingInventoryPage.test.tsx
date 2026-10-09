import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { inventoryApi } from '../api/inventory';
import AccountingInventoryPage from './AccountingInventoryPage';

let session={id:'warehouse-user',role:'ADMIN_GUDANG',divisionCode:'ACC'};
vi.mock('../../../session/AuthContext',()=>({useAuth:()=>({user:session})}));
const envelope=<T,>(data:T)=>({data,meta:{trace_id:'test'}});
const catalog={items:[{id:'item',sku:'SKU-1',name:'Barang Uji',unit:'Pcs',minimum_stock:'5.000',active:true}],locations:[{id:'location',code:'GDG',name:'Gudang Uji',kind:'WAREHOUSE' as const,active:true}],balances:[{id:'balance',item_id:'item',location_id:'location',quantity:'3.000',sku:'SKU-1',item_name:'Barang Uji',unit:'Pcs',minimum_stock:'5.000',location_code:'GDG',location_name:'Gudang Uji'}]};
const document={id:'doc',document_number:'INV-UJI',kind:'ISSUE' as const,source_location_id:'location',destination_location_id:null,source_location_name:'Gudang Uji',destination_location_name:null,business_date:'2026-10-10',reference:'REQ-UJI',notes:null,status:'correction' as const,created_by:'warehouse-user',review_note:'Perbaiki jumlah barang',version:2,lines:[{id:'line',item_id:'item',quantity:'2.000',counted_quantity:null,sku:'SKU-1',item_name:'Barang Uji',unit:'Pcs'}]};
const mount=()=>render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><AccountingInventoryPage/></MemoryRouter></QueryClientProvider>);
afterEach(()=>{cleanup();vi.restoreAllMocks();session={id:'warehouse-user',role:'ADMIN_GUDANG',divisionCode:'ACC'};});

it('Admin Gudang melihat KPI, koreksi, saldo kritis, dan form yang dapat dikerjakan',async()=>{
 vi.spyOn(inventoryApi,'catalog').mockResolvedValue(envelope(catalog)); vi.spyOn(inventoryApi,'documents').mockResolvedValue(envelope({month:'2026-10',items:[document]})); mount();
 expect(await screen.findByText('INV-UJI')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button',{name:'Saldo per lokasi'})); expect(screen.getByText('Perlu restok')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button',{name:'Dokumen & persetujuan'}));
 fireEvent.click(screen.getByRole('button',{name:'Edit'})); expect(screen.getByRole('heading',{name:'Perbaiki dokumen persediaan'})).toBeInTheDocument(); expect(screen.getByDisplayValue('REQ-UJI')).toBeInTheDocument();
});

it('Manager hanya memperoleh keputusan pada dokumen submitted',async()=>{
 session={id:'manager',role:'MANAGER',divisionCode:'ACC'}; vi.spyOn(inventoryApi,'catalog').mockResolvedValue(envelope(catalog)); vi.spyOn(inventoryApi,'documents').mockResolvedValue(envelope({month:'2026-10',items:[{...document,status:'submitted',review_note:null}]})); mount();
 expect(await screen.findByRole('button',{name:'Setujui & posting'})).toBeInTheDocument(); expect(screen.getByRole('button',{name:'Minta koreksi'})).toBeInTheDocument(); expect(screen.queryByRole('button',{name:'Dokumen baru'})).not.toBeInTheDocument();
});

it('Staff Accounting mendapat keterlacakan read-only',async()=>{
 session={id:'accounting',role:'ACCOUNTING',divisionCode:'ACC'}; vi.spyOn(inventoryApi,'catalog').mockResolvedValue(envelope(catalog)); vi.spyOn(inventoryApi,'documents').mockResolvedValue(envelope({month:'2026-10',items:[document]})); mount();
 expect(await screen.findByText('INV-UJI')).toBeInTheDocument(); expect(screen.queryByRole('button',{name:'Dokumen baru'})).not.toBeInTheDocument(); expect(screen.queryByRole('button',{name:'Edit'})).not.toBeInTheDocument();
});
