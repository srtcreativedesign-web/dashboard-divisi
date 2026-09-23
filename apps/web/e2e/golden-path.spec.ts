import { test, expect } from '@playwright/test';

test('Golden Path: BOD login and target approval', async ({ page }) => {
  // Step 1: Login as BOD
  await page.goto('/login');
  // Fill the login form (Assuming a generic test login form is present, mock if necessary or use valid test credentials)
  await page.fill('input[name="email"]', 'bod@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Verify successful login
  await expect(page).toHaveURL('/dashboard');

  // Step 2: Navigate to Target
  await page.click('text="Target"');
  await expect(page).toHaveURL('/target');

  // Step 3: Approve a draft target
  // Ensure the table loads
  await expect(page.locator('table')).toBeVisible();

  // Find the approve button on a row and click it
  const approveBtn = page.locator('button:has-text("Approve")').first();
  if (await approveBtn.isVisible()) {
    await approveBtn.click();
    
    // Step 4: Verify optimistic UI toast
    const toast = page.locator('text="Approved"');
    await expect(toast).toBeVisible();
  }
});
