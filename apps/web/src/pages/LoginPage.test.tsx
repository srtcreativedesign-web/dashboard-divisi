import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';
import { AuthProvider } from '../session/AuthContext';
import * as authApiModule from '../api/auth';

describe('LoginPage - Glassmorphic, Quick Role Switcher, & Inline Validation', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const renderLoginPage = () => {
    return render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div data-testid="dashboard-page">Halaman Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
  };

  it('1. Merender halaman login glassmorphic lengkap dengan kartu, branding, input, dan Quick Role Switcher', () => {
    const { container } = renderLoginPage();

    // Brand logo DD dan judul utama
    expect(screen.getByText('DD')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Dashboard Divisi/i })).toBeInTheDocument();
    expect(screen.getByText(/Portal Terpadu 7 Divisi Ritel & Accounting/i)).toBeInTheDocument();

    // Input email dan password
    expect(screen.getByLabelText(/Alamat Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kata Sandi/i)).toBeInTheDocument();

    // Tombol submit
    expect(screen.getByRole('button', { name: /Masuk ke Dashboard/i })).toBeInTheDocument();

    // Quick Role Switcher chips hadir
    expect(screen.getByText(/Pilih Akun Demo Cepat/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gunakan akun BOD \(Direksi\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gunakan akun Manager ACC/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gunakan akun Admin ACC/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gunakan akun Admin Wrapping/i })).toBeInTheDocument();

    // Kartu memiliki styling glassmorphism
    const glassCard = container.querySelector('.backdrop-blur-2xl');
    expect(glassCard).toBeInTheDocument();
  });

  it('2. Quick Role Switcher mengisi field email, password, dan menyinkronkan demo role sekali klik', () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/Alamat Email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Kata Sandi/i) as HTMLInputElement;

    // Awalnya input kosong
    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');

    // Klik tombol chip demo BOD
    const bodBtn = screen.getByRole('button', { name: /Gunakan akun BOD \(Direksi\)/i });
    fireEvent.click(bodBtn);

    // Kredensial terisi otomatis
    expect(emailInput.value).toBe('bod1@dashboard.test');
    expect(passwordInput.value).toBe('Password123!');
    expect(localStorage.getItem('dashboard-divisi.role-demo')).toBe('BOD');

    // Klik tombol chip demo Manager ACC
    const managerBtn = screen.getByRole('button', { name: /Gunakan akun Manager ACC/i });
    fireEvent.click(managerBtn);

    // Kredensial berganti otomatis
    expect(emailInput.value).toBe('manager.acc@dashboard.test');
    expect(passwordInput.value).toBe('Password123!');
    expect(localStorage.getItem('dashboard-divisi.role-demo')).toBe('MANAGER');
    expect(localStorage.getItem('dashboard-divisi.division-demo')).toBe('ACC');
  });

  it('3. Toggle Show/Hide password mengubah tipe input dan aria-label secara interaktif', () => {
    renderLoginPage();

    const passwordInput = screen.getByLabelText(/Kata Sandi/i);
    const toggleBtn = screen.getByRole('button', { name: /Tampilkan password/i });

    // Awalnya tersembunyi (type="password")
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(toggleBtn).toBeInTheDocument();

    // Klik untuk menampilkan kata sandi
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /Sembunyikan password/i })).toBeInTheDocument();

    // Klik kembali untuk menyembunyikan kata sandi
    const hideBtn = screen.getByRole('button', { name: /Sembunyikan password/i });
    fireEvent.click(hideBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /Tampilkan password/i })).toBeInTheDocument();
  });

  it('4. Menampilkan validasi inline untuk email kosong dan format email yang tidak valid', () => {
    renderLoginPage();

    const submitBtn = screen.getByRole('button', { name: /Masuk ke Dashboard/i });

    // Submit tanpa mengisi apa-apa
    fireEvent.click(submitBtn);

    // Pesan error inline muncul
    expect(screen.getByText('Email wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Password wajib diisi')).toBeInTheDocument();

    // Ketik email dengan format salah
    const emailInput = screen.getByLabelText(/Alamat Email/i);
    fireEvent.change(emailInput, { target: { value: 'email-tanpa-domain' } });
    fireEvent.blur(emailInput);

    expect(screen.getByText(/Format email tidak valid/i)).toBeInTheDocument();

    // Ketik email yang benar
    fireEvent.change(emailInput, { target: { value: 'user@company.test' } });
    fireEvent.blur(emailInput);

    expect(screen.queryByText(/Format email tidak valid/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Email wajib diisi')).not.toBeInTheDocument();
  });

  it('5. Memproses login sukses dan melakukan navigasi ke halaman /dashboard', async () => {
    vi.spyOn(authApiModule.authApi, 'login').mockResolvedValueOnce({
      data: {
        accessToken: 'mock-jwt-token-12345',
        user: {
          id: '1',
          name: 'BOD 1',
          email: 'bod1@dashboard.test',
          role: 'BOD',
          divisionCode: null,
        },
      },
      meta: { trace_id: 'mock-trace-123' },
    });

    renderLoginPage();

    // Isi kredensial lewat Quick Role
    const bodBtn = screen.getByRole('button', { name: /Gunakan akun BOD \(Direksi\)/i });
    fireEvent.click(bodBtn);

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Masuk ke Dashboard/i });
    fireEvent.click(submitBtn);

    // Navigasi ke /dashboard
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
    expect(localStorage.getItem('access_token')).toBe('mock-jwt-token-12345');
  });

  it('6. Menampilkan alert error ketika autentikasi API gagal', async () => {
    vi.spyOn(authApiModule.authApi, 'login').mockRejectedValueOnce(
      new Error('Email atau kata sandi tidak sesuai'),
    );

    renderLoginPage();

    const emailInput = screen.getByLabelText(/Alamat Email/i);
    const passwordInput = screen.getByLabelText(/Kata Sandi/i);
    const submitBtn = screen.getByRole('button', { name: /Masuk ke Dashboard/i });

    fireEvent.change(emailInput, { target: { value: 'salah@company.test' } });
    fireEvent.change(passwordInput, { target: { value: 'Salah123!' } });
    fireEvent.click(submitBtn);

    // Alert error tampil dengan role="alert"
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email atau kata sandi tidak sesuai');
    });
  });
});
