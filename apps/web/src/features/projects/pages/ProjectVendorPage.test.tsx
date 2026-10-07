import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProjectVendorPage from './ProjectVendorPage';
import { vendorApi } from '../../../api/projects';

const state = vi.hoisted(() => ({ role: 'ADMIN' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role: state.role, divisionCode: 'PROJECT' } }) }));
vi.mock('../../../api/projects', () => ({ vendorApi: { getVendors: vi.fn(), createVendor: vi.fn(), updateVendor: vi.fn() } }));
const vendor = { id: 1, name: 'Vendor anonim', category: 'Material', contact_person: 'Kontak privat', phone: '000', email: 'anonim@example.test', created_at: '', updated_at: '' };

beforeEach(() => { vi.resetAllMocks(); state.role = 'ADMIN'; vi.mocked(vendorApi.getVendors).mockResolvedValue({ data: [vendor] } as Awaited<ReturnType<typeof vendorApi.getVendors>>); });
afterEach(cleanup);

describe('Direktori dan perubahan vendor Project', () => {
  it('pembaca melihat direktori tanpa kontak dan tombol mutasi; BOD tetap hanya membaca', async () => {
    for (const role of ['HEAD_OPS', 'SPV', 'LEADER', 'ADMIN_GUDANG', 'ACCOUNTING', 'FINANCE', 'BOD']) {
      state.role = role;
      render(<ProjectVendorPage />);
      await screen.findByText('Vendor anonim');
      expect(screen.queryByRole('button', { name: /Tambah Vendor/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Edit Vendor anonim' })).not.toBeInTheDocument();
      if (role !== 'BOD') expect(screen.queryByText('Kontak privat')).not.toBeInTheDocument();
      cleanup();
    }
  });
  it('Admin menambah dan mengedit vendor melalui API lalu memuat ulang daftar', async () => {
    vi.mocked(vendorApi.createVendor).mockResolvedValue(vendor);
    vi.mocked(vendorApi.updateVendor).mockResolvedValue(vendor);
    render(<ProjectVendorPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Tambah Vendor/ }));
    fireEvent.change(screen.getByLabelText('Nama vendor'), { target: { value: 'Vendor baru' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'baru@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan vendor' }));
    await screen.findByText('Data vendor berhasil disimpan.');
    expect(vendorApi.createVendor).toHaveBeenCalledWith({ name: 'Vendor baru', category: '', contact_person: '', phone: '', email: 'baru@example.test' });
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Vendor anonim' }));
    expect(screen.getByLabelText('Nama kontak')).toHaveValue('Kontak privat');
    fireEvent.change(screen.getByLabelText('Kategori'), { target: { value: 'Jasa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan vendor' }));
    await screen.findByRole('status');
    expect(vendorApi.updateVendor).toHaveBeenCalledWith(1, expect.objectContaining({ category: 'Jasa' }));
    expect(vendorApi.getVendors).toHaveBeenCalledTimes(3);
  });
  it('gagal menyimpan mempertahankan input dan dapat dicoba lagi', async () => {
    vi.mocked(vendorApi.createVendor).mockRejectedValueOnce(new Error('Tidak dapat menyimpan')).mockResolvedValue(vendor);
    render(<ProjectVendorPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Tambah Vendor/ }));
    fireEvent.change(screen.getByLabelText('Nama vendor'), { target: { value: 'Vendor tertunda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan vendor' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tidak dapat menyimpan');
    expect(screen.getByLabelText('Nama vendor')).toHaveValue('Vendor tertunda');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Simpan vendor' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Simpan vendor' }));
    await screen.findByRole('status');
    expect(vendorApi.createVendor).toHaveBeenCalledTimes(2);
  });
});

it('pencarian terbaru tidak ditimpa respons vendor lama', async () => {
 let old!: (value: Awaited<ReturnType<typeof vendorApi.getVendors>>) => void;
 vi.mocked(vendorApi.getVendors).mockReset().mockImplementationOnce(()=>new Promise(resolve=>{old=resolve;})).mockResolvedValueOnce({data:[{...vendor,name:'Vendor terbaru'}]} as Awaited<ReturnType<typeof vendorApi.getVendors>>);
 state.role='ADMIN'; render(<ProjectVendorPage/>);fireEvent.change(screen.getByLabelText('Cari vendor'),{target:{value:'terbaru'}});
 await screen.findByText('Vendor terbaru');await act(async()=>{old({data:[vendor]} as Awaited<ReturnType<typeof vendorApi.getVendors>>);});
 expect(screen.queryByText('Vendor anonim')).not.toBeInTheDocument();expect(screen.getByText('Vendor terbaru')).toBeInTheDocument();
});
it('pagination mengirim halaman dan pencarian kembali ke halaman pertama',async()=>{
 state.role='ADMIN';vi.mocked(vendorApi.getVendors).mockReset().mockResolvedValueOnce({data:[vendor],last_page:2,total:51} as Awaited<ReturnType<typeof vendorApi.getVendors>>).mockResolvedValueOnce({data:[{...vendor,name:'Vendor kedua'}],last_page:2,total:51} as Awaited<ReturnType<typeof vendorApi.getVendors>>).mockResolvedValueOnce({data:[vendor],last_page:1,total:1} as Awaited<ReturnType<typeof vendorApi.getVendors>>);
 render(<ProjectVendorPage/>);await screen.findByText('Vendor anonim');fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('Vendor kedua');
 expect(vendorApi.getVendors).toHaveBeenLastCalledWith({search:undefined,page:2,per_page:50});fireEvent.change(screen.getByLabelText('Cari vendor'),{target:{value:'anonim'}});await screen.findByText('Vendor anonim');
 expect(vendorApi.getVendors).toHaveBeenLastCalledWith({search:'anonim',page:1,per_page:50});expect(screen.getByRole('button',{name:'Berikutnya'})).toBeDisabled();
});
it('simpan berhasil tetapi reload gagal tetap menyatakan vendor tersimpan tanpa membuat duplikat',async()=>{
 state.role='ADMIN';vi.mocked(vendorApi.getVendors).mockReset().mockResolvedValueOnce({data:[vendor]} as Awaited<ReturnType<typeof vendorApi.getVendors>>).mockRejectedValueOnce(new Error('Daftar tidak tersedia')).mockResolvedValueOnce({data:[vendor]} as Awaited<ReturnType<typeof vendorApi.getVendors>>);
 vi.mocked(vendorApi.createVendor).mockResolvedValue(vendor);render(<ProjectVendorPage/>);await screen.findByText('Vendor anonim');fireEvent.click(screen.getByRole('button',{name:/Tambah Vendor/}));fireEvent.change(screen.getByLabelText('Nama vendor'),{target:{value:'Vendor baru'}});fireEvent.click(screen.getByRole('button',{name:'Simpan vendor'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Daftar tidak tersedia');expect(screen.getByText('Data vendor berhasil disimpan.')).toBeInTheDocument();expect(screen.queryByRole('form',{name:'Tambah vendor'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Coba Lagi'}));await screen.findByText('Vendor anonim');expect(vendorApi.createVendor).toHaveBeenCalledOnce();
});
it('form dan pencarian terkunci selama simpan dan submit ulang ditolak',async()=>{
 state.role='ADMIN';vi.mocked(vendorApi.getVendors).mockReset().mockResolvedValue({data:[vendor]} as Awaited<ReturnType<typeof vendorApi.getVendors>>);vi.mocked(vendorApi.createVendor).mockReset().mockImplementation(()=>new Promise(()=>{}));
 render(<ProjectVendorPage/>);await screen.findByText('Vendor anonim');fireEvent.click(screen.getByRole('button',{name:/Tambah Vendor/}));fireEvent.change(screen.getByLabelText('Nama vendor'),{target:{value:'Vendor baru'}});
 const form=screen.getByRole('form',{name:'Tambah vendor'});fireEvent.submit(form);await waitFor(()=>expect(screen.getByLabelText('Cari vendor')).toBeDisabled());expect(screen.getByLabelText('Nama vendor')).toBeDisabled();fireEvent.submit(form);expect(vendorApi.createVendor).toHaveBeenCalledOnce();
});
it('role yang tidak dikenal tidak meminta direktori vendor',()=>{
 state.role='UNKNOWN';vi.mocked(vendorApi.getVendors).mockReset();render(<ProjectVendorPage/>);expect(screen.getByRole('alert')).toHaveTextContent('Akses direktori vendor tidak tersedia');expect(vendorApi.getVendors).not.toHaveBeenCalled();
});
it('halaman menjadi kosong tetap menyediakan navigasi kembali',async()=>{
 state.role='ADMIN';vi.mocked(vendorApi.getVendors).mockReset().mockResolvedValueOnce({data:[vendor],last_page:2,total:51} as Awaited<ReturnType<typeof vendorApi.getVendors>>).mockResolvedValueOnce({data:[],last_page:1,total:1,current_page:2,first_page_url:'',from:0,last_page_url:'',links:[],next_page_url:null,path:'/vendors',per_page:50,prev_page_url:'/vendors?page=1',to:0}).mockResolvedValueOnce({data:[vendor],last_page:1,total:1} as Awaited<ReturnType<typeof vendorApi.getVendors>>);
 render(<ProjectVendorPage/>);await screen.findByText('Vendor anonim');fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('Tidak ada vendor');expect(screen.getByRole('button',{name:'Sebelumnya'})).toBeEnabled();fireEvent.click(screen.getByRole('button',{name:'Sebelumnya'}));await screen.findByText('Vendor anonim');
});
