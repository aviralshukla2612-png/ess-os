import { test, expect } from '@playwright/test';

test.describe('Employee Management Feature (Post-Audit)', () => {
  // Wait for 1s between test setups to avoid rapid DB locks on SQLite
  test.beforeEach(async () => {
    await new Promise(r => setTimeout(r, 1000));
  });

  test('Anonymous users are denied access to API', async ({ request }) => {
    const res = await request.post('/mdz-os/api/employees', {
      data: { name: 'Test', email: 'test@mdzcompany.com', password: '123' }
    });
    // Middleware might redirect to login, which causes a 307/302, or if it doesn't match API, next-auth might return 401
    // The main thing is they don't get 200
    expect(res.status()).not.toBe(200);
  });

  test('SALES cannot access employee API', async ({ page }) => {
    // login as sales
    await page.goto('/mdz-os/login');
    await page.getByPlaceholder('e.g. dev.patel@mdzcompany.com or EMP-004').fill('karan.sales@mdzcompany.com');
    await page.getByPlaceholder('Enter your password').fill('password123');
    const callbackDone1 = page.waitForResponse(r => r.url().includes('/api/auth/callback/credentials') && r.request().method() === 'POST');
    await page.click('button[type="submit"]');
    await callbackDone1;
    await page.waitForURL(url => !url.toString().includes('login'));

    // try to post directly using the authenticated page context
    const res = await page.request.post('/mdz-os/api/employees', {
      data: { name: 'Test', email: 'test_sales@mdzcompany.com', password: '123' }
    });
    // The requireRole("OWNER") check should return 403
    expect(res.status()).toBe(403);
  });

  test('EMPLOYEE cannot access employee API', async ({ page }) => {
    await page.goto('/mdz-os/login');
    await page.getByPlaceholder('e.g. dev.patel@mdzcompany.com or EMP-004').fill('dev.patel@mdzcompany.com');
    await page.getByPlaceholder('Enter your password').fill('password123');
    const callbackDone2 = page.waitForResponse(r => r.url().includes('/api/auth/callback/credentials') && r.request().method() === 'POST');
    await page.click('button[type="submit"]');
    await callbackDone2;
    await page.waitForURL(url => !url.toString().includes('login'));

    const res = await page.request.post('/mdz-os/api/employees', {
      data: { name: 'Test', email: 'test_emp@mdzcompany.com', password: '123' }
    });
    expect(res.status()).toBe(403);
  });

  test('OWNER can manage employees and role escalation is blocked', async ({ page }) => {
    // Login as owner
    await page.goto('/mdz-os/login');
    await page.getByPlaceholder('e.g. dev.patel@mdzcompany.com or EMP-004').fill('owner@mdzcompany.com');
    await page.getByPlaceholder('Enter your password').fill('password123');
    const callbackDone3 = page.waitForResponse(r => r.url().includes('/api/auth/callback/credentials') && r.request().method() === 'POST');
    await page.click('button[type="submit"]');
    await callbackDone3;
    await page.waitForURL(url => !url.toString().includes('login'));

    const email = `new_emp_${Date.now()}@mdzcompany.com`;
    
    // 1. Role escalation prevention via direct API call (simulating malicious frontend)
    const escalatedResponse = await page.request.post('/mdz-os/api/employees', {
      data: {
        name: 'Hacker',
        email: email,
        password: 'password123',
        designation: 'Developer',
        role: 'OWNER' // Attempting to escalate
      }
    });
    expect(escalatedResponse.status()).toBe(200);
    const json = await escalatedResponse.json();
    
    // Server must force EMPLOYEE role
    expect(json.data.user.activeRole).toBe('EMPLOYEE');
    
    // 2. Duplicate email fails with 409
    const dupResponse = await page.request.post('/mdz-os/api/employees', {
      data: { name: 'Hacker2', email: email, password: 'password123' }
    });
    expect(dupResponse.status()).toBe(409);

    // 3. OWNER can view employee in UI
    await page.goto('/mdz-os/employees');
    await expect(page.locator(`text=${email}`)).toBeVisible();
    
    // 4. Edit / Deactivate via API
    const empId = json.data.id;
    const editResponse = await page.request.patch(`/mdz-os/api/employees/${empId}`, {
      data: { salaryMonthly: 90000, isActive: false, status: 'INACTIVE' }
    });
    expect(editResponse.status()).toBe(200);
    const editJson = await editResponse.json();
    expect(editJson.data.salaryMonthly).toBe(90000);
    expect(editJson.data.status).toBe('INACTIVE');
    expect(editJson.data.user.isActive).toBe(false);
  });
});
