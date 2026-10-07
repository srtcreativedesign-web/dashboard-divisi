import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProjectVendorPage from './ProjectVendorPage';
import { vendorApi } from '../../../api/projects';

const state = vi.hoisted(() => ({ role: 'ADMIN' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role: state.role, divisionCode: 'PROJECT' } }) }));
vi.mock('../../../api/projects', () => ({ vendorApi: { getVendors: vi.fn(), createVendor: vi.fn(), updateVendor: vi.fn() } }));
const vendor = { id: 1, name: 'Vendor anonim', category: 'Material', contact_person: 'Kontak privat', phone: '000', email: 'anonim@example.test', created_at: '', updated_at: '' };

describe('Direktori dan perubahan vendor Project', () => {
  beforeEach(() => { vi.resetAllMocks(); state.role = 'ADMIN'; vi.mocked(vendorApi.getVendors).mockResolvedValue({ data: [vendor] } as Awaited<ReturnType<typeof vendorApi.getVendors>>); });
  afterEach(cleanup);
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
    await screen.findByRole('status');
    expect(vendorApi.createVendor).toHaveBeenCalledWith({ name: 'Vendor baru', category: '', contact_person: '', phone: '', email: 'baru@example.test' });
    fireEvent.click(screen.getByRole('button', { name: 'Edit Vendor anonim' }));
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
