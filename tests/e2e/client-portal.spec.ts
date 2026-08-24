import { test, expect } from '@playwright/test';

test.describe('CLIENT PORTAL E2E', () => {
  test('Anonymous user can access valid portal token', async ({ page }) => {
    // Assuming a valid token is seeded. From global setup, usually 'test-portal-token-123'
    const res = await page.goto('/mdz-crm/portal/test-portal-token-123');
    
    // Portal must not redirect to login
    expect(page.url()).not.toMatch(/.*login/);
    expect(res?.status()).toBe(200);

    // Some portal content should be visible (could check specific client/project names if known)
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Application Error');
  });

  test('Invalid portal token denies access', async ({ page }) => {
    const res = await page.goto('/mdz-crm/portal/invalid-token-abc');
    
    // Can redirect to login or show 404/403. Either way, should not reveal project data.
    const text = await page.locator('body').innerText();
    expect(text).not.toContain('Total Contracted Revenue');
  });
});
