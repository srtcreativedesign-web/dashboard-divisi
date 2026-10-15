import { test, expect } from '@playwright/test';

test.describe('E2E Dashboard Divisi Flow', () => {
  test('Login BOD, verifikasi redirect dashboard, dan navigasi modul', async ({ page }) => {
    // 1. Kunjungi halaman Login
    await page.goto('/login');
    await expect(page).toHaveTitle(/Dashboard/i);

    // 2. Klik tombol Quick Role BOD
    const bodQuickBtn = page.getByRole('button', { name: /Gunakan akun BOD/i });
    if (await bodQuickBtn.isVisible()) {
      await bodQuickBtn.click();
      await expect(page.locator('#login-email')).toHaveValue('bod1@dashboard.test');
    } else {
      await page.fill('#login-email', 'bod1@dashboard.test');
    }

    // 3. Masukkan kata sandi testing
    await page.fill('#login-password', 'Password123!');

    // 4. Submit login
    await page.click('button[type="submit"]');

    // 5. Verifikasi berhasil masuk ke dashboard
    await expect(page).toHaveURL(/\/dashboard|\/projects|\/accounting|\/cellular/);

    // 6. Navigasi ke Modul Proyek
    await page.goto('/projects/list');
    await expect(page.locator('h1, h2, table').first()).toBeVisible();

    // 7. Navigasi ke Modul Accounting
    await page.goto('/accounting');
    await expect(page.locator('body')).not.toContainText('500 Server Error');
  });
});
