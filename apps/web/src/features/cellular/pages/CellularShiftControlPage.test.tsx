import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
  it('memberi Leader form checklist dan tindakan pengajuan',async()=>{page();expect(await screen.findByRole('heading',{name:'Kontrol Shift Outlet'})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Kontrol baru'}));expect(screen.getByRole('heading',{name:'Checklist shift baru'})).toBeInTheDocument();expect(screen.getByRole('button',{name:'Ajukan ke SPV'})).toBeInTheDocument();});
  it.each([['SPV','Verifikasi'],['HEAD_OPS','Selesaikan'],['MANAGER','Putuskan selesai']])('menampilkan tindakan %s yang tepat',async(role,label)=>{session.role=role;page();await screen.findByRole('heading',{name:'Kontrol Shift Outlet'});expect(screen.getByRole('button',{name:label})).toBeInTheDocument();});
});
