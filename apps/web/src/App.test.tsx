import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App, { queryClient } from './App';

afterEach(() => { cleanup(); queryClient.clear(); localStorage.clear(); history.pushState({}, '', '/'); });
describe('Workspace tiga modul MVP', () => {
  it('meminta login ketika belum terautentikasi', async () => {
    render(<App />);
    expect(await screen.findByLabelText(/Alamat Email/i)).toBeInTheDocument();
  });
  it('menampilkan tiga modul untuk BOD tanpa menu retail lama dan tanpa kalender jadwal', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'BOD');
    history.pushState({}, '', '/dashboard');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Workspace ERP' })).toBeInTheDocument();
    const modules = screen.getByRole('region', { name: 'Modul ERP' });
    const moduleLinks = within(modules).getAllByRole('link');
    expect(moduleLinks).toHaveLength(3);
    expect(within(modules).getByRole('heading', { name: 'Accounting' })).toBeInTheDocument();
    expect(within(modules).getByRole('heading', { name: 'Project' })).toBeInTheDocument();
    expect(within(modules).getByRole('heading', { name: 'Cellular' })).toBeInTheDocument();
    expect(screen.queryByText('Wrapping')).not.toBeInTheDocument();

    // Pastikan link modul bagi BOD mengarah ke laporan divisi, bukan dashboard operasional menyeluruh
    const projectLink = moduleLinks.find(link => link.getAttribute('href') === '/projects/report-to-bod');
    expect(projectLink).toBeDefined();

    // Pastikan tidak ada menu Kalender Jadwal untuk BOD
    expect(screen.queryByText('Kalender Jadwal')).not.toBeInTheDocument();
  });

  it('mempertahankan menu navigasi di sidebar dan menyediakan tombol kembali ketika BOD masuk ke laporan divisi', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'BOD');
    history.pushState({}, '', '/projects/report-to-bod');
    render(<App />);

    // Navigasi utama di sidebar harus tetap ada dan lengkap
    const nav = await screen.findByRole('navigation', { name: 'Navigasi utama' });
    expect(within(nav).getByText('Workspace ERP')).toBeInTheDocument();
    expect(within(nav).getByText('Laporan Accounting')).toBeInTheDocument();
    expect(within(nav).getByText('Laporan Project')).toBeInTheDocument();
    expect(within(nav).getByText('Laporan Cellular')).toBeInTheDocument();

    // Tersedia tombol Kembali ke Dashboard di header
    expect(screen.getByRole('link', { name: /Kembali ke Dashboard/i })).toHaveAttribute('href', '/dashboard');
  });
});
