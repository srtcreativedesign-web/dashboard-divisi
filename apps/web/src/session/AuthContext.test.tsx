import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi } from '../api/auth';
import { queryClient } from '../api/queryClient';

function SessionView() {
  const { user, login, logout, error } = useAuth();
  return <><span>{user?.name ?? 'Keluar'}</span><button onClick={() => { void logout().catch(() => undefined); }}>Logout</button><button onClick={() => { void login('uji@anonim.test', 'fixture').catch(() => undefined); }}>Login lain</button>{error && <p role="alert">{error}</p>}</>;
}
describe('Kejujuran status logout', () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); queryClient.clear(); });
  function show() {
    vi.spyOn(authApi, 'me').mockResolvedValue({ data: { id: '1', name: 'Admin Uji', email: 'admin@uji.test', role: 'ADMIN', divisionCode: 'ACC' }, meta: { trace_id: 'test' } });
    render(<AuthProvider><SessionView /></AuthProvider>);
  }
  it('mempertahankan pengguna dan memberi pesan ketika server gagal menutup sesi', async () => {
    vi.spyOn(authApi, 'logout').mockRejectedValue(new Error('unavailable'));
    show();
    await screen.findByText('Admin Uji');
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await screen.findByRole('alert');
    expect(screen.getByText('Admin Uji')).toBeInTheDocument();
    expect(screen.queryByText('Keluar')).not.toBeInTheDocument();
  });
  it('membersihkan cache data saat login pengguna lain dan logout berhasil', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({ data: { accessToken: '', user: { id: '2', name: 'Head Ops Uji', email: 'uji@anonim.test', role: 'HEAD_OPS', divisionCode: 'ACC' } }, meta: { trace_id: 'test' } });
    vi.spyOn(authApi, 'logout').mockResolvedValue({ data: { message: 'Sesi ditutup' }, meta: { trace_id: 'test' } });
    show();
    await screen.findByText('Admin Uji');
    queryClient.setQueryData(['private-voucher'], { nominal: 123 });
    fireEvent.click(screen.getByRole('button', { name: 'Login lain' }));
    await screen.findByText('Head Ops Uji');
    expect(queryClient.getQueryData(['private-voucher'])).toBeUndefined();
    queryClient.setQueryData(['private-voucher'], { nominal: 456 });
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await screen.findByText('Keluar');
    expect(queryClient.getQueryData(['private-voucher'])).toBeUndefined();
  });
  it('menghapus token browser lama saat memuat sesi cookie', async () => {
    localStorage.setItem('access_token', 'legacy-token');
    show();
    await screen.findByText('Admin Uji');
    await waitFor(() => expect(localStorage.getItem('access_token')).toBeNull());
  });
});
