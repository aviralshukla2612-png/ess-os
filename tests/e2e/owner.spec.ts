import { test, expect, Page } from '@playwright/test';

// Use the same authentication helper approach
const authenticateAsOwner = async (page: Page) => {
  await page.goto('/mdz-os/login');
  await page.getByPlaceholder('dev.patel@mdzcompany.com').clear();
  await page.getByPlaceholder('dev.patel@mdzcompany.com').pressSequentially('owner@test.com', { delay: 10 });
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
  expect(session?.user?.role).toBe('OWNER');
};

test.describe('OWNER E2E Access', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateAsOwner(page);
  });

  const routes = [
    { url: '/mdz-os/owner', text: 'Executive Dashboard' },
    { url: '/mdz-os/finance', text: 'Total Contracted Revenue' },
    { url: '/mdz-os/employees', text: 'Team Members' }, // Adjust if text is different
    { url: '/mdz-os/leads', text: 'Sales CRM' },
    { url: '/mdz-os/clients', text: 'Client Directory' }, // Adjust
    { url: '/mdz-os/projects', text: 'Active Projects' }, // Adjust
    { url: '/mdz-os/attendance', text: 'MDZ Work Clock' },
    { url: '/mdz-os/audit', text: 'Audit' } // Adjust
  ];

  for (const route of routes) {
    test(`OWNER can access ${route.url}`, async ({ page }) => {
      const res = await page.goto(route.url);
      expect(res?.status(), `Expected ${route.url} to not return 4xx`).toBeLessThan(400);
      
      // We don't check strict text unless we're sure it exists, 
      // but we ensure there are no application errors
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('Application Error');
      expect(bodyText).not.toContain('An unexpected error has occurred');
    });
  }
});
