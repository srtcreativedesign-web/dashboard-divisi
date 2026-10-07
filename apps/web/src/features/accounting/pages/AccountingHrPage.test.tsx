import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import AccountingHrPage from './AccountingHrPage';
import { hrApi, type HrRecord } from '../api/hr';

const auth=vi.hoisted(()=>({role:'ADMIN',divisionCode:'ACC'}));
vi.mock('../../../session/AuthContext',()=>({useAuth:()=>({user:auth})}));
vi.mock('../api/hr',()=>({hrApi:{employees:vi.fn(),createEmployee:vi.fn(),list:vi.fn(),detail:vi.fn(),create:vi.fn(),correct:vi.fn(),void:vi.fn()}}));
const record:HrRecord={id:'r',employee_id:'e',employee_code:'HR-1',employee_name:'Pegawai anonim',kind:'leave',start_date:'2026-10-06',end_date:'2026-10-07',leave_type:'Tahunan',source_days:'1.50',source_reference:'CUTI-1',approval_reference:'SETUJU-1',status:'recorded',version:2};
afterEach(()=>{cleanup();vi.resetAllMocks();});
function show(role:string, rows:HrRecord[]=[]){
  auth.role=role;auth.divisionCode='ACC';
  vi.mocked(hrApi.employees).mockResolvedValue({data:[{id:'e',code:'HR-1',name:'Pegawai anonim',is_active:true}],meta:{trace_id:'t'}});
  vi.mocked(hrApi.list).mockResolvedValue({data:{items:rows,total:rows.length,page:1,per_page:50},meta:{trace_id:'t'}});
  vi.mocked(hrApi.detail).mockResolvedValue({data:record,meta:{trace_id:'t'}});
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}})}><AccountingHrPage/></QueryClientProvider>);
}
it('Finance tidak meminta data HR dan Staff Accounting hanya membaca',async()=>{
  show('FINANCE');expect(screen.getByRole('alert')).toHaveTextContent('Akses rekap kepegawaian tidak tersedia');expect(hrApi.employees).not.toHaveBeenCalled();expect(hrApi.list).not.toHaveBeenCalled();
  cleanup();show('ACCOUNTING',[record]);await screen.findByText('CUTI-1');expect(screen.queryByRole('form',{name:'Catat rekap'})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:/^Koreksi CUTI-1$/})).not.toBeInTheDocument();expect(screen.getByRole('button',{name:/^Histori CUTI-1$/})).toBeInTheDocument();
});
it('Admin menyimpan jumlah hari sumber desimal dan mempertahankan input saat gagal',async()=>{
  vi.mocked(hrApi.create).mockRejectedValueOnce(new Error('Rentang cuti bertumpang tindih.')).mockResolvedValueOnce({data:record,meta:{trace_id:'t'}});
  show('ADMIN');await screen.findByRole('option',{name:'HR-1 — Pegawai anonim'});
  fireEvent.change(screen.getByLabelText('Pegawai'),{target:{value:'e'}});
  for(const [label,value] of [['Referensi sumber','CUTI-1'],['Jenis cuti sesuai sumber','Tahunan'],['Jumlah hari menurut sumber','1.50'],['Referensi persetujuan cuti','SETUJU-1']])fireEvent.change(screen.getByLabelText(label!),{target:{value}});
  fireEvent.submit(screen.getByRole('form',{name:'Catat rekap'}));expect(await screen.findByRole('alert')).toHaveTextContent('Rentang cuti bertumpang tindih.');expect(screen.getByLabelText('Jumlah hari menurut sumber')).toHaveValue('1.50');expect(screen.queryByText('Data berhasil disimpan.')).not.toBeInTheDocument();
  expect(hrApi.create).toHaveBeenCalledWith(expect.objectContaining({employee_id:'e',source_days:'1.50',source_reference:'CUTI-1'}));
  fireEvent.submit(screen.getByRole('form',{name:'Catat rekap'}));expect(await screen.findByText('Data berhasil disimpan.')).toBeInTheDocument();expect(screen.getByLabelText('Referensi sumber')).toHaveValue('');
});
it('koreksi membawa versi dan alasan tanpa mengganti pegawai atau referensi sumber',async()=>{
  vi.mocked(hrApi.correct).mockRejectedValue(new Error('Versi sudah berubah.'));show('ADMIN',[record]);
  fireEvent.click(await screen.findByRole('button',{name:/^Koreksi CUTI-1$/}));expect(screen.getByLabelText('Pegawai')).toBeDisabled();expect(screen.getByLabelText('Referensi sumber')).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Alasan koreksi'),{target:{value:'Jumlah hari dikoreksi sesuai sumber'}});
  fireEvent.change(screen.getByLabelText('Jumlah hari menurut sumber'),{target:{value:'1.25'}});
  fireEvent.submit(screen.getByRole('form',{name:'Koreksi rekap'}));expect(await screen.findByRole('alert')).toHaveTextContent('Versi sudah berubah.');
  expect(hrApi.correct).toHaveBeenCalledWith(record,expect.objectContaining({kind:'leave',source_days:'1.25'}),'Jumlah hari dikoreksi sesuai sumber');expect(screen.getByLabelText('Jumlah hari menurut sumber')).toHaveValue('1.25');
});
it('absensi mencatat status, jadwal dan menit dari sumber tanpa hari cuti',async()=>{
  vi.mocked(hrApi.create).mockResolvedValue({data:record,meta:{trace_id:'t'}});show('ADMIN');
  await screen.findByRole('option',{name:'HR-1 — Pegawai anonim'});fireEvent.click(screen.getByRole('button',{name:'Absensi'}));
  fireEvent.change(screen.getByLabelText('Pegawai'),{target:{value:'e'}});
  fireEvent.change(screen.getByLabelText('Referensi sumber'),{target:{value:'ABSEN-1'}});
  fireEvent.change(screen.getByLabelText('Referensi jadwal'),{target:{value:'JADWAL-1'}});
  fireEvent.change(screen.getByLabelText('Menit terlambat menurut sumber'),{target:{value:'15'}});
  fireEvent.submit(screen.getByRole('form',{name:'Catat rekap'}));await screen.findByText('Data berhasil disimpan.');
  expect(hrApi.create).toHaveBeenCalledWith(expect.objectContaining({kind:'attendance',attendance_status:'PRESENT',late_minutes:15,schedule_reference:'JADWAL-1'}));
  expect(vi.mocked(hrApi.create).mock.calls[0]?.[0]).not.toHaveProperty('source_days');
});

it('perubahan bulan membersihkan koreksi, pembatalan dan histori sebelumnya',async()=>{
 show('ADMIN',[record]); fireEvent.click(await screen.findByRole('button',{name:'Histori CUTI-1'}));
 fireEvent.click(screen.getByRole('button',{name:'Koreksi CUTI-1'})); fireEvent.click(screen.getByRole('button',{name:'Batalkan rekap CUTI-1'}));
 expect(screen.getByRole('form',{name:'Koreksi rekap'})).toBeInTheDocument(); expect(screen.getByText('Histori rekap')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Bulan rekap'),{target:{value:'2026-09'}});
 expect(screen.queryByRole('form',{name:'Koreksi rekap'})).not.toBeInTheDocument(); expect(screen.queryByRole('form',{name:'Batalkan rekap'})).not.toBeInTheDocument();
 expect(screen.queryByText('Histori rekap')).not.toBeInTheDocument(); expect(screen.getByLabelText('Referensi sumber')).toHaveValue(''); expect(hrApi.void).not.toHaveBeenCalled();
});
it('histori bisa ditutup tanpa mengubah rekap',async()=>{
 show('ACCOUNTING',[record]); fireEvent.click(await screen.findByRole('button',{name:'Histori CUTI-1'}));
 fireEvent.click(screen.getByRole('button',{name:'Tutup histori'})); expect(screen.queryByText('Histori rekap')).not.toBeInTheDocument(); expect(hrApi.correct).not.toHaveBeenCalled();
});
it('filter bulan dikunci selama koreksi berlangsung',async()=>{
 vi.mocked(hrApi.correct).mockImplementation(()=>new Promise(()=>{}));show('ADMIN',[record]);fireEvent.click(await screen.findByRole('button',{name:'Koreksi CUTI-1'}));
 fireEvent.change(screen.getByLabelText('Alasan koreksi'),{target:{value:'Koreksi sumber yang diverifikasi'}}); fireEvent.submit(screen.getByRole('form',{name:'Koreksi rekap'}));
 for(const button of await screen.findAllByRole('button',{name:'Menyimpan...'})) expect(button).toBeDisabled(); expect(screen.getByLabelText('Bulan rekap')).toBeDisabled();expect(screen.getByRole('button',{name:'Absensi'})).toBeDisabled();
});
