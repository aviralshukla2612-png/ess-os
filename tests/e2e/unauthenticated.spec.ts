import { test, expect } from '@playwright/test';

test.describe('Unauthenticated Access Controls', () => {
  const protectedRoutes = [
    '/ess-crm/owner',
    '/ess-crm/finance',
    '/ess-crm/attendance',
    '/ess-crm/leads',
    '/ess-crm/clients',
    '/ess-crm/projects',
    '/ess-crm/employees'
  ];

  test('Anonymous user should be redirected to login for protected routes', async ({ page }) => {
    for (const route of protectedRoutes) {
      await page.goto(route);
      // The middleware returns a redirect to /ess-crm/login, which renders the login page.
      // Alternatively, NextAuth returns a 401. Let's wait for the URL to eventually match login.
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('Anonymous user is ALLOWED to access valid client portal token route', async ({ page }) => {
    // The global setup created a portal token: 'test-portal-token-123'
    await page.goto('/ess-crm/portal/test-portal-token-123');
    // Ensure we do NOT get redirected to login
    await expect(page).not.toHaveURL(/.*\/login/);
    // Ensure the portal dashboard actually loads by looking for the explicit UI element
    await expect(page.locator('text=ESS CLIENT PORTAL')).toBeVisible();
    await expect(page.locator('text=Test Project')).toBeVisible();
  });

  test('Anonymous user is denied (404/redirect) for INVALID client portal token', async ({ page }) => {
    await page.goto('/ess-crm/portal/invalid-token-456');
    // Should ideally show a 404 since next/navigation notFound() is used
    await expect(page.locator('text=This page could not be found')).toBeVisible();
  });
});
