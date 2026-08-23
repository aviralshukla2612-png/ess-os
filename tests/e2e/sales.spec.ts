import { test, expect, Page } from '@playwright/test';

const authenticateAsSales = async (page: Page) => {
  await page.goto('/mdz-os/login');
  await page.getByPlaceholder('dev.patel@mdzcompany.com').clear();
  await page.getByPlaceholder('dev.patel@mdzcompany.com').pressSequentially('sales@test.com', { delay: 10 });
  await page.getByPlaceholder('Enter your password').clear();
  await page.getByPlaceholder('Enter your password').pressSequentially('TestPassword123!', { delay: 10 });
  
  const callbackDone = page.waitForResponse(
    r => r.url().includes('/api/auth/callback/credentials') && r.request().method() === 'POST',
    { timeout: 15000 }
  );
  await page.click('button[type="submit"]');
  await callbackDone;

  const sessionRes = await page.request.get('/mdz-os/api/auth/session');
  const session = await sessionRes.json();
  expect(session?.user?.role).toBe('SALES');
};

test.describe('SALES E2E Access', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateAsSales(page);
  });

  const allowedRoutes = [
    { url: '/mdz-os/leads', text: 'Sales CRM' },
    { url: '/mdz-os/clients', text: 'Client Directory' },
    { url: '/mdz-os/projects', text: 'Projects' } 
  ];

  for (const route of allowedRoutes) {
    test(`SALES can access allowed route ${route.url}`, async ({ page }) => {
      const res = await page.goto(route.url);
      expect(res?.status(), `Expected ${route.url} to not return 4xx`).toBeLessThan(400);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('Application Error');
    });
  }

  const forbiddenRoutes = [
    '/mdz-os/owner',
    '/mdz-os/finance',
    '/mdz-os/employees',
    '/mdz-os/audit'
  ];

  for (const route of forbiddenRoutes) {
    test(`SALES is denied access to ${route}`, async ({ page }) => {
      await page.goto(route);
      // Middleware redirects to login
      await page.waitForURL(/.*login/, { timeout: 10000 });
    });
  }
});
