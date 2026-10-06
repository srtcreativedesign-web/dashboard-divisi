import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProjectCreateForm } from './ProjectCreateForm';
import { projectApi } from '../../api/projects';

vi.mock('../../api/projects', () => ({ projectApi: { createProject: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
describe('Pembuatan proyek', () => {
  it('mengirim nominal sebagai desimal dan baru memuat ulang setelah simpan sukses', async () => {
    vi.mocked(projectApi.createProject).mockResolvedValue({ id: 1 } as Awaited<ReturnType<typeof projectApi.createProject>>);
    const created = vi.fn().mockResolvedValue(undefined);
    render(<ProjectCreateForm onCreated={created} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nama proyek'), { target: { value: 'Proyek anonim' } });
    fireEvent.change(screen.getByLabelText('Nilai kontrak (Rp)'), { target: { value: '1000.50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan proyek' }));
    await waitFor(() => expect(created).toHaveBeenCalledOnce());
    expect(projectApi.createProject).toHaveBeenCalledWith(expect.objectContaining({ name: 'Proyek anonim', contract_value: '1000.50', status: 'planning' }));
  });
  it('error mempertahankan input dan tidak mengklaim proyek tersimpan', async () => {
    vi.mocked(projectApi.createProject).mockRejectedValue(new Error('Tanggal salah'));
    const created = vi.fn();
    render(<ProjectCreateForm onCreated={created} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nama proyek'), { target: { value: 'Proyek tertunda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan proyek' }));
    await screen.findByText('Tanggal salah');
    expect(screen.getByLabelText('Nama proyek')).toHaveValue('Proyek tertunda');
    expect(created).not.toHaveBeenCalled();
  });
});
