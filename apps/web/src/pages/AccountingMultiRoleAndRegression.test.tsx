import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';

describe('Accounting Multi-Role E2E & Retail Divisions Regression', () => {
  afterEach(() => {
    localStorage.clear();
    cleanup();
    window.history.pushState({}, '', '/');
  });

  describe('1. Role Admin ACC (Operasional)', () => {
    beforeEach(() => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'ACC');
    });

    it('Admin ACC melihat seluruh menu navigasi operasional Accounting', async () => {
      window.history.pushState({}, '', '/accounting');
      render(<App />);

      const nav = await screen.findByRole('navigation', { name: /Navigasi utama/i });
      expect(within(nav).getByText(/Dashboard Accounting/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Jurnal Aktual/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Impor Transaksi/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Outstanding/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Laporan Cashflow/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Rekonsiliasi Bank/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Periode/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Master Data/i)).toBeInTheDocument();

      // Memastikan menu retail generik tidak bercampur di navigasi ACC
      expect(within(nav).queryByText(/Rincian Omset Tenant/i)).not.toBeInTheDocument();
      expect(within(nav).queryByText(/Format Budgeting/i)).not.toBeInTheDocument();
    });

    it('Admin ACC dapat membuka halaman Impor Transaksi', async () => {
      window.history.pushState({}, '', '/accounting/impor');
      render(<App />);
      expect(await screen.findByRole('heading', { name: /Impor Transaksi Accounting/i })).toBeInTheDocument();
      expect(screen.getByText(/Pilih Berkas Excel/i)).toBeInTheDocument();
    });

    it('Admin ACC dapat membuka halaman Outstanding', async () => {
      window.history.pushState({}, '', '/accounting/outstanding');
      render(<App />);
      expect(await screen.findByRole('heading', { name: /Outstanding Accounting/i })).toBeInTheDocument();
      expect(screen.getByText(/Catat Kewajiban Baru/i)).toBeInTheDocument();
    });

    it('Admin ACC dapat membuka halaman Rekonsiliasi Bank', async () => {
      window.history.pushState({}, '', '/accounting/rekonsiliasi');
      render(<App />);
      expect(await screen.findByRole('heading', { name: /Saldo Akhir Bank/i })).toBeInTheDocument();
    });
  });

  describe('2. Role Manager ACC (Supervisi & Audit)', () => {
    beforeEach(() => {
      localStorage.setItem('dashboard-divisi.role-demo', 'MANAGER');
      localStorage.setItem('dashboard-divisi.division-demo', 'ACC');
    });

    it('Manager ACC melihat navigasi supervisi Accounting', async () => {
      window.history.pushState({}, '', '/accounting');
      render(<App />);

      const nav = await screen.findByRole('navigation', { name: /Navigasi utama/i });
      expect(within(nav).getByText(/Dashboard Accounting/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Rekonsiliasi Bank/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Laporan Cashflow/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Periode/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Master Data/i)).toBeInTheDocument();
    });

    it('Manager ACC dapat mengakses halaman Laporan Cashflow', async () => {
      window.history.pushState({}, '', '/accounting/cashflow');
      render(<App />);
      expect(await screen.findByRole('heading', { name: /Laporan Cashflow & Penjelasan Arus Kas/i })).toBeInTheDocument();
    });

    it('Manager ACC dapat mengakses halaman Periode', async () => {
      window.history.pushState({}, '', '/accounting/periode');
      render(<App />);
      expect(await screen.findByRole('heading', { name: /Periode Accounting/i })).toBeInTheDocument();
    });
  });

  describe('3. Role BOD (Executive Read-Only)', () => {
    beforeEach(() => {
      localStorage.setItem('dashboard-divisi.role-demo', 'BOD');
      localStorage.removeItem('dashboard-divisi.division-demo');
    });

    it('BOD melihat menu eksekutif dan TIDAK melihat menu mutasi Accounting', async () => {
      window.history.pushState({}, '', '/dashboard');
      render(<App />);

      const nav = await screen.findByRole('navigation', { name: /Navigasi utama/i });
      expect(within(nav).getByText(/Dashboard/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Report Harian/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Rincian Omset Tenant/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Format Budgeting/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Cashflow/i)).toBeInTheDocument();
      expect(within(nav).getByText(/PNL/i)).toBeInTheDocument();

      // Menu accounting operasional tidak muncul di sidebar BOD
      expect(within(nav).queryByText(/Jurnal Aktual/i)).not.toBeInTheDocument();
      expect(within(nav).queryByText(/Impor Transaksi/i)).not.toBeInTheDocument();
      expect(within(nav).queryByText(/Master Data/i)).not.toBeInTheDocument();
    });

    it('BOD ditolak saat mengakses langsung rute mutasi jurnal', async () => {
      window.history.pushState({}, '', '/accounting/jurnal');
      render(<App />);
      expect(await screen.findByTestId('no-access')).toBeInTheDocument();
      expect(screen.getByText(/Role BOD tidak memiliki izin view:acc_journal/i)).toBeInTheDocument();
    });

    it('BOD ditolak saat mengakses langsung rute master data', async () => {
      window.history.pushState({}, '', '/accounting/master');
      render(<App />);
      expect(await screen.findByTestId('no-access')).toBeInTheDocument();
      expect(screen.getByText(/Role BOD tidak memiliki izin view:acc_master/i)).toBeInTheDocument();
    });
  });

  describe('4. Regresi 7 Divisi Retail (Wrapping, Cellular, FnB, dll.)', () => {
    it('Manager Wrapping tidak melihat menu Accounting dan rute operasional retail tetap jalan', async () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'MANAGER');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');
      window.history.pushState({}, '', '/dashboard');
      render(<App />);

      expect(await screen.findByRole('heading', { name: /Selamat Datang/i })).toBeInTheDocument();
      const nav = screen.getByRole('navigation', { name: /Navigasi utama/i });
      expect(within(nav).getByText(/Rincian Omset Tenant/i)).toBeInTheDocument();
      expect(within(nav).getByText(/Format Budgeting/i)).toBeInTheDocument();

      // Tidak ada menu accounting
      expect(within(nav).queryByText(/Jurnal Aktual/i)).not.toBeInTheDocument();
      expect(within(nav).queryByText(/Rekonsiliasi Bank/i)).not.toBeInTheDocument();
    });

    it('Admin Cellular ditolak oleh RouteGuard saat mencoba membuka /accounting/outstanding', async () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'CELL');
      window.history.pushState({}, '', '/accounting/outstanding');
      render(<App />);

      expect(await screen.findByTestId('no-access')).toBeInTheDocument();
      expect(screen.getByText(/tidak memiliki izin view:acc_report/i)).toBeInTheDocument();
    });

    it('Pengguna retail dapat membuka halaman Cashflow ritel reguler tanpa kendala', async () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'MANAGER');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');
      window.history.pushState({}, '', '/cashflow');
      render(<App />);

      expect(await screen.findByRole('heading', { name: /Cashflow Divisi/i })).toBeInTheDocument();
      const nav = screen.getByRole('navigation', { name: /Navigasi utama/i });
      expect(within(nav).getByText(/Cashflow/i)).toBeInTheDocument();
    });

    it('Pengguna retail dapat membuka halaman Format Budgeting reguler tanpa kendala', async () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');
      window.history.pushState({}, '', '/budgeting');
      render(<App />);

      expect(await screen.findByRole('heading', { name: /Format Budgeting/i })).toBeInTheDocument();
    });
  });
});
