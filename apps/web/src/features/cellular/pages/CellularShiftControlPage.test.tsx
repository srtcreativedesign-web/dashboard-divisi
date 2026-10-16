import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cellularApi, type ShiftControl } from '../api';
import CellularShiftControlPage from './CellularShiftControlPage';

const session = vi.hoisted(() => ({ role: 'LEADER', divisionCode: 'CELL' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: session }) }));
const response = <T,>(data:T) => ({data,meta:{trace_id:'shift-test'}});
const row = (status:ShiftControl['status']):ShiftControl => ({id:`row-${status}`,outlet_id:'outlet-1',outlet_name:'Data Cellular T3',business_date:'2026-10-10',shift_code:'SHIFT-1',pic_name:'Budi',due_at:'2026-10-10T16:59:00Z',priority:'high',checklist:{handover_complete:true,stock_count_complete:true,payment_channels_ready:true,closing_matched:false},issue_summary:'Selisih closing',status,review_note:null,completed_checks:3,total_checks:4,is_overdue:false,created_by:'leader-1',version:2});
function page(){const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});return render(<QueryClientProvider client={client}><CellularShiftControlPage/></QueryClientProvider>);}

describe('Kontrol Shift Cellular',()=>{
  beforeEach(()=>{session.role='LEADER';vi.spyOn(cellularApi,'outlets').mockResolvedValue(response([{id:'outlet-1',code:'T3',name:'Data Cellular T3'}]));vi.spyOn(cellularApi,'shiftControls').mockResolvedValue(response([row('draft'),row('submitted'),row('reviewed'),row('escalated')]));vi.spyOn(cellularApi,'saveShiftControl').mockResolvedValue(response(row('draft')));vi.spyOn(cellularApi,'transitionShiftControl').mockResolvedValue(response(row('submitted')));});
  afterEach(()=>{cleanup();vi.restoreAllMocks();});
  it('memberi Leader form checklist aksesibel dan tindakan pengajuan',async()=>{const user=userEvent.setup();page();expect(await screen.findByRole('heading',{name:'Kontrol Shift Outlet'})).toBeInTheDocument();const trigger=screen.getByRole('button',{name:'Kontrol baru'});await user.click(trigger);expect(screen.getByRole('dialog',{name:'Checklist shift baru'})).toBeInTheDocument();expect(screen.getByLabelText('Outlet')).toHaveFocus();await user.click(screen.getByRole('button',{name:'Tutup panel'}));expect(trigger).toHaveFocus();expect(screen.getByRole('button',{name:'Ajukan ke SPV'})).toBeInTheDocument();});
  it('membuka rincian checklist dan mengembalikan fokus ke baris sumber',async()=>{const user=userEvent.setup();page();await screen.findByRole('heading',{name:'Kontrol Shift Outlet'});const trigger=screen.getAllByRole('button',{name:'Buka detail Data Cellular T3 SHIFT-1'})[0]!;await user.click(trigger);const dialog=screen.getByRole('dialog',{name:'Detail kontrol shift'});expect(dialog).toHaveTextContent('Hitung stok selesai');expect(dialog).toHaveTextContent('Selisih closing');await user.click(screen.getByRole('button',{name:'Tutup panel'}));expect(trigger).toHaveFocus();});
  it.each([['SPV','Verifikasi'],['HEAD_OPS','Selesaikan'],['MANAGER','Putuskan selesai']])('menampilkan tindakan %s yang tepat',async(role,label)=>{session.role=role;page();await screen.findByRole('heading',{name:'Kontrol Shift Outlet'});expect(screen.getByRole('button',{name:label})).toBeInTheDocument();});
});
