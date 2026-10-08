import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import ProjectListPage from './ProjectListPage';
import { projectApi } from '../../../api/projects';
import type { PaginatedResponse, Project } from '../../../types/project';

const identity = vi.hoisted(() => ({ role: 'ADMIN', divisionCode: 'PROJECT' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: identity }) }));
vi.mock('../../../api/projects', () => ({ projectApi: { getProjects: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const project = (name: string): Project => ({ id: 1, division_code: 'PROJECT', name, contract_value: '9999999999999.99', status: 'planning', created_at: '', updated_at: '' });
const response = (name: string, page=1, last=1) => ({ data: [project(name)], current_page: page, last_page: last } as PaginatedResponse<Project>);
function show(role='ADMIN', division='PROJECT') { identity.role=role; identity.divisionCode=division; render(<MemoryRouter><ProjectListPage/></MemoryRouter>); }

it('mengabaikan respons pencarian lama yang selesai setelah hasil terbaru', async () => {
 let old!: (value: PaginatedResponse<Project>) => void;
 vi.mocked(projectApi.getProjects).mockImplementationOnce(() => new Promise(resolve => { old=resolve; })).mockResolvedValueOnce(response('Proyek terbaru'));
 show(); fireEvent.change(screen.getByLabelText('Cari proyek'), { target: { value: 'terbaru' } });
 expect(await screen.findByText('Proyek terbaru')).toBeInTheDocument();
 await act(async () => { old(response('Proyek lama')); });
 expect(screen.queryByText('Proyek lama')).not.toBeInTheDocument();
 expect(screen.getByText('Proyek terbaru')).toBeInTheDocument();
 expect(screen.getAllByText('Rp 9.999.999.999.999,99').length).toBeGreaterThan(0);
 expect(screen.getByRole('link',{name:'Detail proyek Proyek terbaru'})).toHaveAttribute('href','/projects/1');
});
it('pagination mengirim halaman dan filter baru kembali ke halaman pertama', async () => {
 vi.mocked(projectApi.getProjects).mockResolvedValueOnce(response('Halaman satu',1,2)).mockResolvedValueOnce(response('Halaman dua',2,2)).mockResolvedValueOnce(response('Hasil filter'));
 show(); await screen.findByText('Halaman satu'); fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));
 await screen.findByText('Halaman dua'); expect(projectApi.getProjects).toHaveBeenLastCalledWith(expect.objectContaining({page:2,per_page:50}));
 fireEvent.change(screen.getByLabelText('Status proyek'),{target:{value:'completed'}}); await screen.findByText('Hasil filter');
 expect(projectApi.getProjects).toHaveBeenLastCalledWith(expect.objectContaining({page:1,status:'completed'}));
 expect(screen.getByRole('button',{name:'Berikutnya'})).toBeDisabled();
});
it('error dapat dicoba ulang tanpa menampilkan angka ringkasan data lama', async () => {
 vi.mocked(projectApi.getProjects).mockRejectedValueOnce(new Error('Layanan tidak tersedia')).mockResolvedValueOnce(response('Pulih'));
 show(); expect(await screen.findByRole('alert')).toHaveTextContent('Layanan tidak tersedia');
 expect(screen.getAllByText('—')).toHaveLength(2);
 fireEvent.click(screen.getByRole('button',{name:'Coba lagi'})); await screen.findByText('Pulih');
 await waitFor(()=>expect(projectApi.getProjects).toHaveBeenCalledTimes(2));
});
it('akun Accounting tidak meminta data Project dan reader tidak melihat form tulis',async()=>{
 show('ADMIN','ACC'); expect(screen.getByRole('alert')).toHaveTextContent('Akses proyek tidak tersedia'); expect(projectApi.getProjects).not.toHaveBeenCalled();
 cleanup(); vi.mocked(projectApi.getProjects).mockResolvedValue(response('Dibaca')); show('LEADER'); await screen.findByText('Dibaca');
 expect(screen.queryByRole('button',{name:'Proyek Baru'})).not.toBeInTheDocument();
});
