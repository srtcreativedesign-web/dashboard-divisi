import { Link, MemoryRouter } from 'react-router-dom';
import { render,screen,fireEvent,cleanup } from '@testing-library/react';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import { beforeEach,afterEach,it,expect,vi } from 'vitest';
import AccountingDepositsPage from './AccountingDepositsPage';
import { depositsApi,type Deposit,type DepositSource } from '../api/deposits';
vi.mock('../api/deposits',()=>({depositsApi:{list:vi.fn(),sources:vi.fn(),detail:vi.fn(),create:vi.fn(),receive:vi.fn(),void:vi.fn()}}));
let role='ADMIN';vi.mock('../../../session/AuthContext',()=>({useAuth:()=>({user:{id:'actor',role,divisionCode:'ACC'}})}));
const r:Deposit={id:'d',omzet_id:'o',outlet_name:'Outlet anonim',business_date:'2026-10-05',shift:'1',deposit_date:'2026-10-06',channel:'cash',amount:'500.25',received_amount:'200.10',remaining_amount:'300.15',destination:'Tujuan anonim',source_reference:'SETOR-1',evidence_reference:'BUKTI-1',status:'recorded',version:2,created_by:'admin',receipts:[{id:'r',amount:'200.10',received_date:'2026-10-06',evidence_reference:'BANK-1',status:'recorded',created_by:'actor'}],events:[]};
const source:DepositSource={id:'o',outlet_name:'Outlet anonim',business_date:'2026-10-05',shift:'1',source_reference:'OMZ-1',cash_available:'500.25',qris_available:'0.00',edc_available:'0.00',transfer_available:'0.00',other_available:'0.00'};
beforeEach(()=>vi.resetAllMocks());afterEach(cleanup);
const traceId='11111111-1111-4111-8111-111111111111';
function showTrace(id:string){render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}})}><MemoryRouter initialEntries={[`/accounting/kas-bank/setoran?omzet_id=${id}`]}><AccountingDepositsPage/><Link to="/accounting/kas-bank/setoran?omzet_id=22222222-2222-4222-8222-222222222222">Sumber lain</Link></MemoryRouter></QueryClientProvider>);}

it('penelusuran per sumber memakai konteks server lintas bulan dan dapat kembali ke daftar biasa',async()=>{
 role='ADMIN';vi.mocked(depositsApi.list).mockResolvedValue({data:{items:[],total:0,page:1,source:{id:traceId,outlet_name:'Outlet lintas bulan',business_date:'2026-09-29',shift:'1',source_reference:'OMZ-TRACE'}},meta:{trace_id:'t'}});
 vi.mocked(depositsApi.sources).mockResolvedValue({data:{items:[],total:0,page:1},meta:{trace_id:'t'}});
 showTrace(traceId);
 expect(await screen.findByText(/referensi OMZ-TRACE/)).toBeInTheDocument();
 expect(depositsApi.list).toHaveBeenCalledWith(expect.any(String),1,traceId);
 expect(depositsApi.sources).not.toHaveBeenCalled();
 expect(screen.queryByLabelText('Bulan tanggal setoran')).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Buat setoran'})).not.toBeInTheDocument();
 expect(screen.getByText(/Semua tanggal setoran untuk sumber ini/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('link',{name:'Semua setoran'}));
 await screen.findByLabelText('Bulan tanggal setoran');
 expect(screen.getByRole('button',{name:'Buat setoran'})).toBeInTheDocument();
});

it('ID sumber malformed tidak meminta daftar atau data sumber',()=>{
 role='ADMIN';showTrace('invalid');
 expect(screen.getByRole('alert')).toHaveTextContent('ID sumber omzet tidak valid');
 expect(depositsApi.list).not.toHaveBeenCalled();expect(depositsApi.sources).not.toHaveBeenCalled();
});

it('mengganti sumber menutup panel detail dari sumber sebelumnya',async()=>{
 role='ACCOUNTING';vi.mocked(depositsApi.list).mockResolvedValue({data:{items:[r],total:1,page:1},meta:{trace_id:'t'}});
 vi.mocked(depositsApi.detail).mockResolvedValue({data:r,meta:{trace_id:'t'}});
 showTrace(traceId);
 fireEvent.click(await screen.findByRole('button',{name:/Outlet anonim/}));
 await screen.findByText('Detail — SETOR-1');
 fireEvent.click(screen.getByRole('link',{name:'Sumber lain'}));
 expect(screen.queryByText('Detail — SETOR-1')).not.toBeInTheDocument();
});
function show(as:string,rows:Deposit[]=[],sourceRows:DepositSource[]=[source]){role=as;vi.mocked(depositsApi.list).mockResolvedValue({data:{items:rows,total:rows.length,page:1},meta:{trace_id:'t'}});vi.mocked(depositsApi.sources).mockResolvedValue({data:{items:sourceRows,total:sourceRows.length,page:1},meta:{trace_id:'t'}});vi.mocked(depositsApi.detail).mockResolvedValue({data:r,meta:{trace_id:'t'}});render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}})}><MemoryRouter><AccountingDepositsPage/></MemoryRouter></QueryClientProvider>);}
it('role tanpa akses tidak meminta data, Accounting hanya membaca',async()=>{show('HEAD_OPS');expect(screen.getByRole('alert')).toHaveTextContent('Akses rekap setoran tidak tersedia');expect(depositsApi.list).not.toHaveBeenCalled();expect(depositsApi.sources).not.toHaveBeenCalled();cleanup();show('ACCOUNTING',[r]);fireEvent.click(await screen.findByRole('button',{name:/Outlet anonim/}));await screen.findByText('Detail — SETOR-1');expect(screen.queryByRole('form',{name:'Catat setoran'})).not.toBeInTheDocument();expect(screen.queryByRole('form',{name:'Catat penerimaan'})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Batalkan catatan penerimaan'})).not.toBeInTheDocument();});
it('Admin memakai sumber tervalidasi dan nominal string; kegagalan mempertahankan input',async()=>{vi.mocked(depositsApi.create).mockRejectedValue(new Error('Alokasi melebihi sumber'));show('ADMIN');fireEvent.click(screen.getByRole('button',{name:'Buat setoran'}));await screen.findByRole('option',{name:/OMZ-1/});fireEvent.change(screen.getByLabelText('Omzet tervalidasi'),{target:{value:'o'}});fireEvent.change(screen.getByLabelText('Kanal pembayaran'),{target:{value:'cash'}});for(const [label,value] of [['Nominal setoran (Rp, titik untuk desimal)','500.25'],['Rekening/lokasi tujuan sesuai sumber','Tujuan anonim'],['Referensi sumber setoran unik','SETOR-1'],['Referensi dokumen bukti setoran','BUKTI-1']])fireEvent.change(screen.getByLabelText(label!),{target:{value}});expect((screen.getByLabelText('Nominal setoran (Rp, titik untuk desimal)') as HTMLInputElement).checkValidity()).toBe(true);fireEvent.submit(screen.getByRole('form',{name:'Catat setoran'}));expect(await screen.findByRole('alert')).toHaveTextContent('Alokasi melebihi sumber');expect(screen.getByLabelText('Nominal setoran (Rp, titik untuk desimal)')).toHaveValue('500.25');expect(depositsApi.create).toHaveBeenCalledWith(expect.objectContaining({omzet_id:'o',channel:'cash',amount:'500.25'}));});
it('Finance mencatat penerimaan dengan versi dan pembatalan membutuhkan alasan',async()=>{vi.mocked(depositsApi.receive).mockResolvedValue({data:{...r,version:3},meta:{trace_id:'t'}});vi.mocked(depositsApi.void).mockRejectedValue(new Error('Versi usang'));show('FINANCE',[r]);vi.mocked(depositsApi.detail).mockResolvedValueOnce({data:r,meta:{trace_id:'t'}}).mockResolvedValue({data:{...r,version:3},meta:{trace_id:'t'}});fireEvent.click(await screen.findByRole('button',{name:/Outlet anonim/}));await screen.findByRole('form',{name:'Catat penerimaan'});fireEvent.change(screen.getByLabelText('Nominal diterima (Rp)'),{target:{value:'300.15'}});fireEvent.change(screen.getByLabelText('Referensi bukti penerimaan unik'),{target:{value:'BANK-2'}});fireEvent.submit(screen.getByRole('form',{name:'Catat penerimaan'}));await screen.findByText('Catatan disimpan beserta histori.');expect(depositsApi.receive).toHaveBeenCalledWith(r,expect.objectContaining({amount:'300.15',evidence_reference:'BANK-2'}));fireEvent.click(screen.getByRole('button',{name:'Batalkan catatan penerimaan'}));fireEvent.change(screen.getByLabelText('Alasan pembatalan'),{target:{value:'Sumber penerimaan salah dicatat'}});fireEvent.submit(screen.getByRole('form',{name:'Batalkan catatan'}));expect(await screen.findByRole('alert')).toHaveTextContent('Versi usang');expect(screen.getByLabelText('Alasan pembatalan')).toHaveValue('Sumber penerimaan salah dicatat');expect(depositsApi.void).toHaveBeenCalledWith({...r,version:3},'Sumber penerimaan salah dicatat','r');});

it('sumber kosong memberi arahan tanpa formulir yang tidak dapat disimpan',async()=>{show('ADMIN',[],[]);fireEvent.click(screen.getByRole('button',{name:'Buat setoran'}));expect(await screen.findByRole('link',{name:'Buka Rekap Omzet'})).toHaveAttribute('href','/accounting/pendapatan/rekap');expect(screen.queryByRole('form',{name:'Catat setoran'})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Simpan setoran'})).not.toBeInTheDocument();});
