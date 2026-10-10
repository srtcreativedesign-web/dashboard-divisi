import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cellularApi } from '../api';
import CellularAccountingControlPage from './CellularAccountingControlPage';

const response=<T,>(data:T)=>({data,meta:{trace_id:'accounting-cell-test'}});
function page(){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});return render(<QueryClientProvider client={client}><CellularAccountingControlPage/></QueryClientProvider>);}
describe('Kontrol Accounting Cellular',()=>{
  beforeEach(()=>{
    vi.spyOn(cellularApi,'dailyClosings').mockResolvedValue(response([{id:'c1',outlet_id:'o1',business_date:'2026-10-08',shift_code:'SHIFT-1',system_sales:'1000000.00',cash:'0',qris:'1000000.00',edc:'0',transfer:'0',difference:'0.00',source_reference:'CLOSE-1',status:'approved',review_note:null,version:3}]));
    vi.spyOn(cellularApi,'settlementSources').mockResolvedValue(response([{daily_closing_id:'c1',outlet_id:'o1',outlet_name:'Data Cellular T3',business_date:'2026-10-08',shift_code:'SHIFT-1',channel:'qris',expected:'1000000.00',submitted:'600000.00',reconciled:'600000.00',remaining:'400000.00'}]));
    vi.spyOn(cellularApi,'shiftControls').mockResolvedValue(response([]));vi.spyOn(cellularApi,'sales').mockResolvedValue(response([{id:'s1',outlet_id:'o1',outlet_name:'Data Cellular T3',product_name:'Perdana 10GB',business_date:'2026-10-08',quantity:1,unit_price:'1000000.00',total_amount:'1000000.00',source_reference:'SALE-1',status:'posted',version:1,void_reason:null}]));vi.spyOn(cellularApi,'stock').mockResolvedValue(response([]));
  });
  afterEach(()=>{cleanup();vi.restoreAllMocks();});
  it('menyatukan closing, settlement, dan status kesiapan tanpa angka PNL semu',async()=>{page();expect(await screen.findByRole('heading',{name:'Kontrol Accounting Cellular'})).toBeInTheDocument();expect(screen.getAllByText(/400\.000/).length).toBeGreaterThan(0);expect(screen.getAllByText('Perlu tindak lanjut').length).toBeGreaterThan(0);expect(screen.getByRole('heading',{name:'Batas kebijakan PNL/HPP'})).toBeInTheDocument();});
});
