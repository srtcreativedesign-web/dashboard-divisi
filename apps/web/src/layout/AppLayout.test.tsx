import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SessionProvider } from '../session/SessionContext';
import { AuthProvider } from '../session/AuthContext';
import { AppLayout } from './AppLayout';

describe('ORG-06 Menu per capability', () => {
  afterEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('ADMIN melihat menu omzet dan target, tapi tidak penilaian', () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
    localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <SessionProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<div>child</div>} />
              </Route>
            </Routes>
          </SessionProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Report Harian').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rincian Omset Tenant').length).toBeGreaterThan(0);
  });

  it('BOD melihat laporan', () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'BOD');

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <SessionProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<div>child</div>} />
              </Route>
            </Routes>
          </SessionProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Detail Laporan').length).toBeGreaterThan(0);
  });

  it('dapat collapse dan expand sidebar dengan tombol toggle dan shortcut Ctrl+B', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
    localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <SessionProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<div>child</div>} />
              </Route>
            </Routes>
          </SessionProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    // Default: expanded (w-64)
    const sidebar = container.querySelector('aside.lg\\:flex');
    expect(sidebar).toHaveClass('w-64');
    expect(sidebar).not.toHaveClass('w-20');

    // Klik tombol kecilkan sidebar di header sidebar
    const collapseBtn = screen.getByRole('button', { name: /^Kecilkan sidebar$/i });
    fireEvent.click(collapseBtn);

    // Sekarang collapsed (w-20)
    expect(sidebar).toHaveClass('w-20');
    expect(sidebar).not.toHaveClass('w-64');
    expect(localStorage.getItem('dashboard-divisi.sidebar-collapsed')).toBe('true');

    // Klik tombol perbesar sidebar di navbar
    const expandBtnNavbar = screen.getByRole('button', { name: /Perbesar sidebar \(navbar\)/i });
    fireEvent.click(expandBtnNavbar);

    // Sekarang kembali expanded (w-64)
    expect(sidebar).toHaveClass('w-64');
    expect(localStorage.getItem('dashboard-divisi.sidebar-collapsed')).toBe('false');

    // Test shortcut Ctrl+B
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(sidebar).toHaveClass('w-20');
    expect(localStorage.getItem('dashboard-divisi.sidebar-collapsed')).toBe('true');
  });
});


