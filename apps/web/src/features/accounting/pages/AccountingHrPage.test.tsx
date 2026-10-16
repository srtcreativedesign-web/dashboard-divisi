import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import AccountingHrPage from './AccountingHrPage';
import { hrApi, type HrRecord } from '../api/hr';

const auth=vi.hoisted(()=>({role:'ADMIN',divisionCode:'ACC'}));
vi.mock('../../../session/AuthContext',()=>({useAuth:()=>({user:auth})}));
vi.mock('../api/hr',()=>({hrApi:{list:vi.fn(),detail:vi.fn()}}));
const base:HrRecord={id:'attendance-1',employee_id:'employee-1',employee_code:'EMP-001',employee_name:'Pegawai anonim',kind:'attendance',start_date:'2026-10-06',end_date:'2026-10-06',attendance_status:'PRESENT',schedule_reference:'SHIFT-PAGI',late_minutes:15,source_reference:'ATT-001',status:'recorded',version:1,created_at:'2026-10-06T08:00:00+07:00',updated_at:'2026-10-06T09:00:00+07:00'};
const attendance:HrRecord[]=[base,{...base,id:'attendance-2',employee_id:'employee-2',employee_code:'EMP-002',employee_name:'Pegawai sakit',attendance_status:'SICK',late_minutes:0,source_reference:'ATT-002'},{...base,id:'attendance-3',employee_id:'employee-3',employee_code:'EMP-003',employee_name:'Pegawai cuti',attendance_status:'LEAVE',late_minutes:0,source_reference:'ATT-003'}];
const leave:HrRecord={...base,id:'leave-1',kind:'leave',start_date:'2026-10-10',end_date:'2026-10-12',attendance_status:null,schedule_reference:null,late_minutes:null,leave_type:'Tahunan',source_days:'3.00',approval_reference:'LEAVE-SOURCE-001',source_reference:'CUTI-001'};

function envelope(items:HrRecord[]){return {data:{items,total:items.length,page:1,per_page:50,source:{mode:'read_only' as const,system:'attendance_api' as const}},meta:{trace_id:'test'}};}
function show(role='ADMIN'){
 auth.role=role;auth.divisionCode='ACC';
 vi.mocked(hrApi.list).mockImplementation(async(kind)=>envelope(kind==='leave'?[leave]:attendance));
 vi.mocked(hrApi.detail).mockResolvedValue({data:{...base,source:{mode:'read_only',system:'attendance_api'}},meta:{trace_id:'test'}});
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}})}><AccountingHrPage/></QueryClientProvider>);
}
afterEach(()=>{cleanup();vi.resetAllMocks();});

it('menolak role di luar pembaca Accounting tanpa meminta data',()=>{
 show('FINANCE');expect(screen.getByRole('alert')).toHaveTextContent('Akses rekap kehadiran tidak tersedia');expect(hrApi.list).not.toHaveBeenCalled();
});

it('menjelaskan batas read-only dan tidak menyediakan input atau approval HR',async()=>{
 show();expect(await screen.findByText('ERP tidak memproses pengajuan kepegawaian')).toBeInTheDocument();expect(screen.getByText(/hanya menampilkan data yang diterima melalui integrasi API/)).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:/catat/i})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:/koreksi/i})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:/setujui/i})).not.toBeInTheDocument();
});

it('meringkas hadir, sakit, cuti, dan terlambat dari data sumber',async()=>{
 show();await screen.findByText('ATT-001');const summary=screen.getByRole('region',{name:'Ringkasan kehadiran'});expect(within(summary).getByText('Hadir')).toBeInTheDocument();expect(within(summary).getByText('Sakit')).toBeInTheDocument();expect(within(summary).getByText('Cuti')).toBeInTheDocument();expect(within(summary).getByText('Terlambat')).toBeInTheDocument();expect(within(summary).getAllByText('1')).toHaveLength(4);
});

it('memisahkan riwayat cuti dari absensi harian',async()=>{
 show();await screen.findByText('ATT-001');fireEvent.click(screen.getByRole('button',{name:/Riwayat cuti/}));expect(await screen.findByText('CUTI-001')).toBeInTheDocument();expect(screen.getByText('Tahunan')).toBeInTheDocument();expect(hrApi.list).toHaveBeenLastCalledWith('leave',expect.any(String),1);
});

it('memfilter rekap berdasarkan pegawai, referensi, dan status sumber',async()=>{
 show();await screen.findByText('ATT-001');
 fireEvent.change(screen.getByLabelText('Cari rekap kehadiran'),{target:{value:'Pegawai sakit'}});
 expect(screen.getByText('ATT-002')).toBeInTheDocument();expect(screen.queryByText('ATT-001')).not.toBeInTheDocument();expect(screen.getByText('1 dari 3 catatan')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Status rekap kehadiran'),{target:{value:'PRESENT'}});
 expect(screen.getByText('Rekap tidak ditemukan')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Cari rekap kehadiran'),{target:{value:''}});
 expect(screen.getByText('ATT-001')).toBeInTheDocument();expect(screen.queryByText('ATT-002')).not.toBeInTheDocument();
});

it('detail hanya menampilkan hasil sumber dan arahan koreksi di sistem absensi',async()=>{
 show();fireEvent.click(await screen.findByRole('button',{name:'Buka ATT-001'}));expect(await screen.findByText('Data dari sistem sumber')).toBeInTheDocument();expect(screen.getByText('Tidak dapat diubah dari ERP')).toBeInTheDocument();expect(screen.getByText(/perbaikan dilakukan pada sistem absensi kantor/)).toBeInTheDocument();expect(screen.queryByText('Histori perubahan')).not.toBeInTheDocument();
});

it('menyediakan retry ketika rekap sumber gagal dimuat',async()=>{
 auth.role='ACCOUNTING';auth.divisionCode='ACC';
 vi.mocked(hrApi.list).mockRejectedValueOnce(new Error('Rekap sumber belum tersedia')).mockResolvedValue(envelope(attendance));
 vi.mocked(hrApi.detail).mockResolvedValue({data:{...base,source:{mode:'read_only',system:'attendance_api'}},meta:{trace_id:'test'}});
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}})}><AccountingHrPage/></QueryClientProvider>);
 expect(await screen.findByRole('alert')).toHaveTextContent('Rekap sumber belum tersedia');
 fireEvent.click(screen.getByRole('button',{name:'Coba Lagi'}));
 expect(await screen.findByText('ATT-001')).toBeInTheDocument();
 expect(hrApi.list).toHaveBeenCalledTimes(2);
});
