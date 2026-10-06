import { cleanup, render, screen, within } from '@testing-library/react';
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
  it('Staff Accounting melihat menu laporan sesuai pekerjaannya', async () => {
    open('ACCOUNTING', 'ACC', '/accounting');
    const nav = await screen.findByRole('navigation', { name: 'Navigasi utama' });
    expect(within(nav).getByRole('link', { name: 'Jurnal Transaksi' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Hutang & Piutang' })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Dashboard Proyek' })).not.toBeInTheDocument();
  });
  it('Manager Cellular tidak dapat membuka jurnal Accounting', async () => {
    open('MANAGER', 'CELL', '/accounting/jurnal');
    expect(await screen.findByText(/tidak memiliki izin view:acc_journal/)).toBeInTheDocument();
  });
  it('BOD tetap membaca laporan dan tidak memperoleh akses master', async () => {
    open('BOD', null, '/accounting/master');
    expect(await screen.findByText(/tidak memiliki izin view:acc_master/)).toBeInTheDocument();
  });
});
