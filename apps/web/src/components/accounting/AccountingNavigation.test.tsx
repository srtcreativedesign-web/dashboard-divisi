import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountingNavigation } from './AccountingNavigation';

afterEach(cleanup);
const mount = (role: string, route = '/accounting/dokumen/register', compact = false, divisionCode = 'ACC') => render(<MemoryRouter initialEntries={[route]}><AccountingNavigation user={{ id: 'test', name: 'Pengguna anonim', email: 'test@example.invalid', role, divisionCode }} compact={compact} onNavigate={vi.fn()} /></MemoryRouter>);
describe('Submenu Accounting menurut role dan scope', () => {
  it('Admin mendapat pengajuan tanpa pemeriksaan/persetujuan/realisasi', () => {
    mount('ADMIN');
    expect(screen.getByRole('link', { name: 'Draf & Koreksi Saya' })).toHaveAttribute('href', '/accounting/dokumen/pengajuan');
    for (const name of ['Antrean Pemeriksaan', 'Keputusan Menunggu', 'Realisasi Menunggu']) expect(screen.queryByRole('link', { name })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Operasional Pendukung' }));
    expect(screen.getByRole('link', { name: 'Cuti & Absensi' })).toBeInTheDocument();
  });
  it.each([['ACCOUNTING', 'Antrean Pemeriksaan'], ['MANAGER', 'Keputusan Menunggu'], ['FINANCE', 'Realisasi Menunggu']])('%s mendapat submenu tugasnya', (role, name) => {
    mount(role); expect(screen.getByRole('link', { name })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Draf & Koreksi Saya' })).not.toBeInTheDocument();
  });
  it('Finance FIN dapat mengakses ACC tetapi tidak HR atau sumber Cellular', () => {
    mount('FINANCE', '/accounting/dokumen/realisasi', false, 'FIN');
    expect(screen.getByRole('link', { name: 'Realisasi Menunggu' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Operasional Pendukung' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Data & Integrasi' }));
    expect(screen.queryByRole('link', { name: 'Sumber Laporan Cellular' })).not.toBeInTheDocument();
  });
  it.each(['HEAD_OPS', 'SPV', 'LEADER', 'ADMIN_GUDANG'])('%s hanya mendapat dashboard sesuai policy', role => {
    mount(role); expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Dashboard Accounting' })).toBeInTheDocument();
  });
  it('grup aktif terbuka dan bisa ditutup serta sidebar kecil tetap dapat dinavigasi', () => {
    mount('ACCOUNTING', '/accounting/kas-bank/setoran');
    expect(screen.getByRole('button', { name: 'Penerimaan Harian' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Setoran Outlet' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Penerimaan Harian' }));
    expect(screen.queryByRole('link', { name: 'Setoran Outlet' })).not.toBeInTheDocument();
    cleanup(); mount('ACCOUNTING', '/accounting', true);
    expect(screen.getByRole('link', { name: 'Jurnal Transaksi' })).toHaveAttribute('title', 'Jurnal Transaksi');
  });
});
