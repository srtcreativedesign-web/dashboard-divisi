import { test, expect } from '@playwright/test';

test.describe('E2E Verification Suite - Dashboard Divisi', () => {

  test('1. Validasi Login Form: Pesan validasi inline dan penanganan error', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/login');
    await expect(page.locator('#login-email')).toBeVisible();

    // Submit form kosong
    await page.click('button[type="submit"]');
    await expect(page.locator('#email-error')).toContainText('Email wajib diisi');

    // Email salah format
    await page.fill('#login-email', 'bukan-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('#email-error')).toContainText('Format email tidak valid');

    // Password salah
    await page.fill('#login-email', 'bod1@dashboard.test');
    await page.fill('#login-password', 'WrongPassword!');
    await page.click('button[type="submit"]');
    await expect(page.locator('#login-error')).toBeVisible();

    // Pastikan tidak ada unhandled JS crash
    expect(consoleErrors.filter(e => !e.includes('401') && !e.includes('Failed to load resource'))).toHaveLength(0);
  });

  test('2. Skenario BOD: Login, Quick Role, Dashboard dan Navigasi Lintas Modul', async ({ page }) => {
    await page.goto('/login');

    // Quick role BOD
    await page.getByRole('button', { name: /Gunakan akun BOD/i }).click();
    await expect(page.locator('#login-email')).toHaveValue('bod1@dashboard.test');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    // Tunggu navigasi dashboard
    await expect(page).toHaveURL(/\/dashboard|\/projects|\/accounting|\/cellular/);

    // Buka modul Projects
    await page.goto('/projects/list');
    await expect(page.getByRole('heading', { name: /Daftar Semua Proyek/i })).toBeVisible();

    // Verifikasi tombol Detail pada baris proyek atau tombol Tambah Proyek Baru
    await expect(page.getByRole('button', { name: /Tambah Proyek Baru/i })).toBeVisible();

    // Buka modul Accounting
    await page.goto('/accounting');
    await expect(page.locator('body')).not.toContainText('500 Server Error');

    // Buka modul Cellular
    await page.goto('/cellular');
    await expect(page.locator('body')).not.toContainText('500 Server Error');
  });

  test('3. Skenario Manager Project: Akses domain terisolasi Project', async ({ page }) => {
    await page.goto('/login');

    // Quick role Manager Project
    await page.getByRole('button', { name: /Gunakan akun Manager Project/i }).click();
    await expect(page.locator('#login-email')).toHaveValue('manager.project@dashboard.test');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    // Pastikan diarahkan ke workspace /projects
    await expect(page).toHaveURL(/\/projects/);

    // Kunjungi halaman daftar proyek
    await page.goto('/projects/list');
    await expect(page.getByRole('heading', { name: /Daftar Semua Proyek/i })).toBeVisible();
  });

  test('4. Skenario Manager Cellular: Akses domain terisolasi Cellular', async ({ page }) => {
    await page.goto('/login');

    // Quick role Manager Cellular
    await page.getByRole('button', { name: /Gunakan akun Manager Cellular/i }).click();
    await expect(page.locator('#login-email')).toHaveValue('manager.cell@dashboard.test');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    // Pastikan masuk ke /cellular
    await expect(page).toHaveURL(/\/cellular/);
  });
});
