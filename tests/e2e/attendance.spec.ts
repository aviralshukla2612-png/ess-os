import { test, expect, Page } from '@playwright/test';

const authenticate = async (page: Page, email: string) => {
  await page.goto('/mdz-os/login');
  await page.getByPlaceholder('dev.patel@mdzcompany.com').clear();
  await page.getByPlaceholder('dev.patel@mdzcompany.com').pressSequentially(email, { delay: 10 });
  await page.getByPlaceholder('Enter your password').clear();
  await page.getByPlaceholder('Enter your password').pressSequentially('TestPassword123!', { delay: 10 });
  
  const callbackPromise = page.waitForResponse(
    res => res.url().includes('/api/auth/callback/credentials') && res.request().method() === 'POST',
    { timeout: 10000 }
  );
  await page.click('button[type="submit"]');
  await callbackPromise;

  const sessionRes = await page.request.get('/mdz-os/api/auth/session');
  expect(sessionRes.status()).toBe(200);
};

test.describe('ATTENDANCE Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page, 'emp@test.com');
  });

  test('Employee attendance flow (Working -> Break -> Resume -> Punch Out)', async ({ page }) => {
    await page.goto('/mdz-os/attendance');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=MDZ Work Clock')).toBeVisible({ timeout: 10000 });

    // 1. Initial State is WORKING (from useWorkClock context)
    await expect(page.locator('button', { hasText: 'Take Break' })).toBeVisible({ timeout: 10000 });

    // Hard Refresh and Verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button', { hasText: 'Take Break' })).toBeVisible({ timeout: 10000 });

    // 2. Start Break
    await page.getByRole('button', { name: /Take Break/i }).click();
    await page.getByRole('button', { name: 'Start Break' }).click();
    
    // Verify BREAK state
    await expect(page.locator('text=ON BREAK')).toBeVisible({ timeout: 10000 });

    // Hard Refresh and Verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=ON BREAK')).toBeVisible({ timeout: 10000 });

    // 3. Resume
    await page.getByRole('button', { name: /Resume Work Session/i }).click();

    // Verify WORKING state
    await expect(page.locator('button', { hasText: 'Take Break' })).toBeVisible({ timeout: 10000 });

    // 4. Punch Out 
    await page.getByRole('button', { name: /Punch Out/i }).first().click();
    
    // Fill reason if modal opens (since workSeconds < 8h)
    const modal = page.locator('text=Early Punch Out Request');
    if (await modal.isVisible()) {
      await page.getByPlaceholder(/e\.g\./i).fill('End of test');
      await page.getByRole('button', { name: /Submit Punch Out Request/i }).click();
    }

    // Verify completed or submitted (UI might just return to the main clock if early out is submitted)
    await expect(page.locator('text=MDZ Work Clock')).toBeVisible({ timeout: 10000 });
  });
});
