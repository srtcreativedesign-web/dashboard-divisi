import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SessionProvider } from '../session/SessionContext';
import { AuthProvider } from '../session/AuthContext';
import { AppLayout } from './AppLayout';

describe('Pengujian Tampilan & Perilaku Navbar dan Sidebar Multi-Device', () => {
  afterEach(() => {
    localStorage.clear();
    cleanup();
    document.body.style.overflow = '';
  });

  const renderLayout = (initialPath = '/dashboard') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <SessionProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<div data-testid="page-content">Halaman Dashboard</div>} />
                <Route path="/laporan-harian" element={<div data-testid="page-content">Halaman Laporan Harian</div>} />
              </Route>
            </Routes>
          </SessionProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
  };

  describe('1. Desktop Viewport (lg: >= 1024px)', () => {
    it('merender sidebar desktop default lebar (w-64) dengan navbar lengkap', () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

      const { container } = renderLayout();

      // Sidebar desktop hadir dengan class responsif lg:flex dan lebar default w-64
      const desktopSidebar = container.querySelector('aside.lg\\:flex');
      expect(desktopSidebar).toBeInTheDocument();
      expect(desktopSidebar).toHaveClass('w-64');
      expect(desktopSidebar).toHaveClass('from-[#0c4a6e]');

      // Konten utama memiliki margin kiri lg:ml-64
      const mainContainer = desktopSidebar?.nextElementSibling;
      expect(mainContainer).toHaveClass('lg:ml-64');

      // Header navbar memiliki garis aksen warna gradient di atas
      const topAccentLine = container.querySelector('header .bg-gradient-to-r');
      expect(topAccentLine).toBeInTheDocument();

      // Navbar desktop memiliki tombol collapse toggle
      const navbarToggle = screen.getByRole('button', { name: /Kecilkan sidebar \(navbar\)/i });
      expect(navbarToggle).toBeInTheDocument();
      expect(navbarToggle).toHaveClass('hidden', 'lg:flex');

      // Pill role dan scope hadir di desktop
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('WRAP')).toBeInTheDocument();
    });

    it('mendukung buka-tutup (collapse/expand) pada desktop via tombol sidebar dan navbar', () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

      const { container } = renderLayout();
      const desktopSidebar = container.querySelector('aside.lg\\:flex');
      const mainContainer = desktopSidebar?.nextElementSibling;

      // 1. Klik tombol ciutkan di header sidebar
      const collapseBtn = screen.getByRole('button', { name: /^Kecilkan sidebar$/i });
      fireEvent.click(collapseBtn);

      // Verifikasi sidebar menciut menjadi w-20 dan konten bergeser ke lg:ml-20
      expect(desktopSidebar).toHaveClass('w-20');
      expect(desktopSidebar).not.toHaveClass('w-64');
      expect(mainContainer).toHaveClass('lg:ml-20');
      expect(localStorage.getItem('dashboard-divisi.sidebar-collapsed')).toBe('true');

      // Tombol logout compact icon-only aktif saat collapsed
      const compactLogout = screen.getByRole('button', { name: /Keluar/i });
      expect(compactLogout).toBeInTheDocument();

      // 2. Klik tombol perbesar di navbar
      const expandBtnNavbar = screen.getByRole('button', { name: /Perbesar sidebar \(navbar\)/i });
      fireEvent.click(expandBtnNavbar);

      // Verifikasi sidebar kembali ke w-64 dan konten ke lg:ml-64
      expect(desktopSidebar).toHaveClass('w-64');
      expect(mainContainer).toHaveClass('lg:ml-64');
      expect(localStorage.getItem('dashboard-divisi.sidebar-collapsed')).toBe('false');

      // 3. Toggle via keyboard shortcut Ctrl+B
      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
      expect(desktopSidebar).toHaveClass('w-20');
      expect(localStorage.getItem('dashboard-divisi.sidebar-collapsed')).toBe('true');
    });
  });

  describe('2. Tablet Viewport (768px - 1023px) & Mobile Viewport (< 768px)', () => {
    it('menyediakan tombol hamburger menu dan navigasi quick-menu horizontal responsif', () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

      renderLayout();

      // Tombol hamburger mobile/tablet hadir di header
      const hamburgerBtn = screen.getByRole('button', { name: /Buka menu/i });
      expect(hamburgerBtn).toBeInTheDocument();
      expect(hamburgerBtn).toHaveClass('lg:hidden');

      // Navigasi horizontal quick menu hadir untuk layar tablet & mobile
      const mobileNav = screen.getByRole('navigation', { name: /Navigasi mobile/i });
      expect(mobileNav).toBeInTheDocument();
      expect(mobileNav.parentElement).toHaveClass('lg:hidden');
    });

    it('dapat membuka drawer mobile saat hamburger diklik dan mengunci scroll body', () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

      renderLayout();

      // Awalnya drawer belum terbuka
      expect(screen.queryByRole('navigation', { name: /Navigasi drawer/i })).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe('');

      // Klik tombol hamburger
      const hamburgerBtn = screen.getByRole('button', { name: /Buka menu/i });
      fireEvent.click(hamburgerBtn);

      // Drawer terbuka
      const drawerNav = screen.getByRole('navigation', { name: /Navigasi drawer/i });
      expect(drawerNav).toBeInTheDocument();
      expect(document.body.style.overflow).toBe('hidden');

      // Tombol tutup (X) ada di dalam drawer
      expect(screen.getByRole('button', { name: /Tutup menu/i })).toBeInTheDocument();
    });

    it('menutup drawer mobile ketika tombol tutup (X) diklik', () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

      renderLayout();

      // Buka drawer
      fireEvent.click(screen.getByRole('button', { name: /Buka menu/i }));
      expect(screen.getByRole('navigation', { name: /Navigasi drawer/i })).toBeInTheDocument();

      // Klik tombol tutup
      fireEvent.click(screen.getByRole('button', { name: /Tutup menu/i }));

      // Drawer tertutup dan overflow body pulih
      expect(screen.queryByRole('navigation', { name: /Navigasi drawer/i })).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe('');
    });

    it('menutup drawer mobile ketika overlay backdrop diklik', () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

      const { container } = renderLayout();

      // Buka drawer
      fireEvent.click(screen.getByRole('button', { name: /Buka menu/i }));

      // Klik backdrop overlay
      const backdrop = container.querySelector('.fixed.inset-0.z-50 > div.absolute.inset-0');
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);

      // Drawer tertutup
      expect(screen.queryByRole('navigation', { name: /Navigasi drawer/i })).not.toBeInTheDocument();
    });

    it('menutup drawer mobile ketika tombol keyboard Escape ditekan', () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

      renderLayout();

      // Buka drawer
      fireEvent.click(screen.getByRole('button', { name: /Buka menu/i }));
      expect(screen.getByRole('navigation', { name: /Navigasi drawer/i })).toBeInTheDocument();

      // Tekan tombol Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      // Drawer tertutup
      expect(screen.queryByRole('navigation', { name: /Navigasi drawer/i })).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe('');
    });

    it('menutup drawer mobile secara otomatis ketika tautan menu diklik', () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

      renderLayout();

      // Buka drawer
      fireEvent.click(screen.getByRole('button', { name: /Buka menu/i }));
      const drawerNav = screen.getByRole('navigation', { name: /Navigasi drawer/i });

      // Klik link di dalam drawer
      const menuLink = drawerNav.querySelector('a[href="/laporan-harian"]');
      expect(menuLink).toBeInTheDocument();
      fireEvent.click(menuLink!);

      // Drawer tertutup
      expect(screen.queryByRole('navigation', { name: /Navigasi drawer/i })).not.toBeInTheDocument();
    });
  });
});
