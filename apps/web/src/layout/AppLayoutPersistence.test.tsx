import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SessionProvider } from '../session/SessionContext';
import { AuthProvider } from '../session/AuthContext';
import { AppLayout } from './AppLayout';

describe('Pengujian Persistensi State Sidebar Menggunakan localStorage Saat Page Refresh', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
    localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  const renderLayout = () => {
    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <SessionProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<div data-testid="page-content">Konten Dashboard</div>} />
              </Route>
            </Routes>
          </SessionProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
  };

  it('1. Memuat langsung dalam status menciut (w-20) jika localStorage bernilai "true"', () => {
    localStorage.setItem('dashboard-divisi.sidebar-collapsed', 'true');

    const { container } = renderLayout();
    const sidebar = container.querySelector('aside.lg\\:flex');
    const mainContent = sidebar?.nextElementSibling;

    // Sidebar langsung berukuran w-20 tanpa perlu interaksi pengguna
    expect(sidebar).toHaveClass('w-20');
    expect(sidebar).not.toHaveClass('w-64');
    expect(mainContent).toHaveClass('lg:ml-20');

    // Tombol di header menampilkan ikon dan label untuk perbesar sidebar
    const expandBtnNavbar = screen.getByRole('button', { name: /Perbesar sidebar \(navbar\)/i });
    expect(expandBtnNavbar).toBeInTheDocument();

    // Mode logout compact aktif
    expect(screen.getByRole('button', { name: /Keluar/i })).toBeInTheDocument();
  });

  it('2. Memuat langsung dalam status terbuka penuh (w-64) jika localStorage bernilai "false"', () => {
    localStorage.setItem('dashboard-divisi.sidebar-collapsed', 'false');

    const { container } = renderLayout();
    const sidebar = container.querySelector('aside.lg\\:flex');
    const mainContent = sidebar?.nextElementSibling;

    // Sidebar langsung berukuran w-64
    expect(sidebar).toHaveClass('w-64');
    expect(sidebar).not.toHaveClass('w-20');
    expect(mainContent).toHaveClass('lg:ml-64');

    // Tombol di header menampilkan ikon dan label untuk kecilkan sidebar
    const collapseBtnNavbar = screen.getByRole('button', { name: /Kecilkan sidebar \(navbar\)/i });
    expect(collapseBtnNavbar).toBeInTheDocument();
  });

  it('3. Menerapkan nilai default terbuka (w-64) jika kunci localStorage belum pernah disetel', () => {
    // Memastikan kunci belum ada di localStorage
    expect(localStorage.getItem('dashboard-divisi.sidebar-collapsed')).toBeNull();

    const { container } = renderLayout();
    const sidebar = container.querySelector('aside.lg\\:flex');
    const mainContent = sidebar?.nextElementSibling;

    // Default aman adalah expanded (w-64)
    expect(sidebar).toHaveClass('w-64');
    expect(mainContent).toHaveClass('lg:ml-64');
  });

  it('4. Menerapkan fallback aman terbuka (w-64) jika localStorage memuat nilai korup atau tidak valid', () => {
    localStorage.setItem('dashboard-divisi.sidebar-collapsed', 'invalid_random_string');

    const { container } = renderLayout();
    const sidebar = container.querySelector('aside.lg\\:flex');

    // Fallback aman ke w-64
    expect(sidebar).toHaveClass('w-64');
    expect(sidebar).not.toHaveClass('w-20');
  });

  it('5. Mempertahankan status sidebar melintasi siklus unmount dan remount penuh (Simulasi Page Refresh)', () => {
    // Tahap A: Halaman pertama kali dimuat (Expanded)
    let view = renderLayout();
    let sidebar = view.container.querySelector('aside.lg\\:flex');
    let mainContent = sidebar?.nextElementSibling;
    expect(sidebar).toHaveClass('w-64');

    // Tahap B: Pengguna menciutkan sidebar melalui tombol toggle
    const collapseBtn = screen.getByRole('button', { name: /^Kecilkan sidebar$/i });
    fireEvent.click(collapseBtn);

    expect(sidebar).toHaveClass('w-20');
    expect(mainContent).toHaveClass('lg:ml-20');
    expect(localStorage.getItem('dashboard-divisi.sidebar-collapsed')).toBe('true');

    // Tahap C: Simulasi Refresh Halaman (Unmount komponen lalu render ulang)
    cleanup();

    view = renderLayout();
    sidebar = view.container.querySelector('aside.lg\\:flex');
    mainContent = sidebar?.nextElementSibling;

    // Setelah refresh, sidebar TERBUKTI langsung dalam status menciut (w-20)
    expect(sidebar).toHaveClass('w-20');
    expect(sidebar).not.toHaveClass('w-64');
    expect(mainContent).toHaveClass('lg:ml-20');

    // Tahap D: Pengguna memperbesar kembali sidebar melalui tombol navbar
    const expandBtnNavbar = screen.getByRole('button', { name: /Perbesar sidebar \(navbar\)/i });
    fireEvent.click(expandBtnNavbar);

    expect(sidebar).toHaveClass('w-64');
    expect(mainContent).toHaveClass('lg:ml-64');
    expect(localStorage.getItem('dashboard-divisi.sidebar-collapsed')).toBe('false');

    // Tahap E: Simulasi Refresh Halaman Kedua (Unmount dan render ulang)
    cleanup();

    view = renderLayout();
    sidebar = view.container.querySelector('aside.lg\\:flex');
    mainContent = sidebar?.nextElementSibling;

    // Setelah refresh kedua, sidebar TERBUKTI langsung dalam status terbuka penuh (w-64)
    expect(sidebar).toHaveClass('w-64');
    expect(sidebar).not.toHaveClass('w-20');
    expect(mainContent).toHaveClass('lg:ml-64');
  });

  it('6. Sinkronisasi perubahan state secara reaktif ketika terjadi StorageEvent dari tab/jendela lain', () => {
    const { container } = renderLayout();
    const sidebar = container.querySelector('aside.lg\\:flex');
    const mainContent = sidebar?.nextElementSibling;

    // Kondisi awal: expanded (w-64)
    expect(sidebar).toHaveClass('w-64');

    // Tab lain memperbarui localStorage menjadi 'true'
    fireEvent(
      window,
      new StorageEvent('storage', {
        key: 'dashboard-divisi.sidebar-collapsed',
        newValue: 'true',
      }),
    );

    // Sidebar di tab ini otomatis tersinkronisasi menjadi menciut (w-20)
    expect(sidebar).toHaveClass('w-20');
    expect(sidebar).not.toHaveClass('w-64');
    expect(mainContent).toHaveClass('lg:ml-20');

    // Tab lain memperbarui kembali menjadi 'false'
    fireEvent(
      window,
      new StorageEvent('storage', {
        key: 'dashboard-divisi.sidebar-collapsed',
        newValue: 'false',
      }),
    );

    // Sidebar kembali tersinkronisasi menjadi terbuka penuh (w-64)
    expect(sidebar).toHaveClass('w-64');
    expect(sidebar).not.toHaveClass('w-20');
    expect(mainContent).toHaveClass('lg:ml-64');
  });
});
