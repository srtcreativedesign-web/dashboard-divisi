import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App, { queryClient } from '../../../App';

afterEach(() => { cleanup(); queryClient.clear(); localStorage.clear(); history.pushState({}, '', '/'); });
function open(role: string, division: string | null, route: string) {
  localStorage.setItem('dashboard-divisi.role-demo', role);
  if (division) localStorage.setItem('dashboard-divisi.division-demo', division);
  history.pushState({}, '', route);
  render(<App />);
}
describe('Navigasi dan batas akses Accounting', () => {
  it('menyimpan tema pilihan dan mengikuti perubahan tema dari tab lain', async () => {
    open('ACCOUNTING', 'ACC', '/accounting');
    fireEvent.click(await screen.findByRole('button', { name: 'Gunakan tema gelap' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('dashboard-divisi.dark-mode')).toBe('true');
    fireEvent(window, new StorageEvent('storage', { key: 'dashboard-divisi.dark-mode', newValue: 'false' }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Gunakan tema gelap' })).toBeInTheDocument();
  });
  it('Staff Accounting melihat menu laporan sesuai pekerjaannya', async () => {
    open('ACCOUNTING', 'ACC', '/accounting');
    const nav = await screen.findByRole('navigation', { name: 'Navigasi Accounting' });
    fireEvent.click(within(nav).getByRole('button', { name: 'Pembukuan & Kontrol' }));
    expect(within(nav).getByRole('link', { name: 'Catatan Transaksi' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Hutang & Piutang' })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Dashboard Proyek' })).not.toBeInTheDocument();
  });
  it('Manager Cellular tidak dapat membuka jurnal Accounting', async () => {
    open('MANAGER', 'CELL', '/accounting/pembukuan/transaksi');
    expect(await screen.findByText(/tidak memiliki izin view:acc_journal/)).toBeInTheDocument();
  });
  it('BOD tetap membaca laporan dan tidak memperoleh akses master', async () => {
    open('BOD', null, '/accounting/pembukuan/master');
    expect(await screen.findByText(/tidak memiliki izin view:acc_master/)).toBeInTheDocument();
  });
});
