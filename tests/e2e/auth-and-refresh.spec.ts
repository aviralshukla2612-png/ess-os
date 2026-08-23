/**
 * 4.10 — Full Role-Based E2E Tests (auth-and-refresh.spec.ts)
 *
 * Covers:
 *   - OWNER / SALES / EMPLOYEE login and session verification
 *   - Role-specific page access (direct URL + hard refresh)
 *   - Role boundary enforcement (denied routes)
 *   - Logout (session invalidation)
 *   - Anonymous access denied to all protected routes
 *
 * Architecture note (documented, not fixed):
 *   login.tsx does router.push("/owner") after signIn — hardcoded regardless of
 *   role. SALES and EMPLOYEE are redirected back to /login by middleware when
 *   they attempt to reach /owner. Their credentials and sessions ARE valid;
 *   only the post-login destination is role-inappropriate.
 *   This is recorded as a UX/logic gap (⚠️ not a P0 blocker).
 */

import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Submit credentials via the login form and wait for the NextAuth
 * credentials callback to respond (session cookie is issued at that point).
 * Authentication is then verified through GET /api/auth/session.
 *
 * Does NOT depend on automatic post-login navigation, because login.tsx
 * currently hardcodes router.push("/owner") which fails for non-OWNER roles.
 */
const authenticate = async (
  page: Page,
  email: string,
  password = 'TestPassword123!'
): Promise<{ role: string; userId: string }> => {
  await page.goto('/mdz-os/login');

  // pressSequentially triggers React onChange (fill() can bypass synthetic events)
  await page.getByPlaceholder('dev.patel@mdzcompany.com').clear();
  await page.getByPlaceholder('dev.patel@mdzcompany.com').pressSequentially(email, { delay: 30 });
  await page.getByPlaceholder('Enter your password').clear();
  await page.getByPlaceholder('Enter your password').pressSequentially(password, { delay: 30 });

  // Wait for the credentials callback response — this is when the session cookie is issued
  const callbackDone = page.waitForResponse(
    r => r.url().includes('/api/auth/callback/credentials') && r.request().method() === 'POST',
    { timeout: 15000 }
  );
  await page.click('button[type="submit"]');
  await callbackDone;

  // Authoritative server-side session check via the API
  const sessionRes = await page.request.get('/mdz-os/api/auth/session');
  expect(sessionRes.status(), 'Session API should return 200').toBe(200);
  const session = await sessionRes.json();
  expect(session?.user?.email, `Session must contain email for ${email}`).toBe(email);
  expect(session?.user?.role, 'Session must contain a role').toBeTruthy();

  return { role: session.user.role, userId: session.user.id };
};

// ---------------------------------------------------------------------------
// OWNER
// ---------------------------------------------------------------------------
test.describe('OWNER role', () => {
  test('login → /owner navigation (documents hardcoded redirect)', async ({ page }) => {
    await authenticate(page, 'owner@test.com');
    // OWNER gets /owner successfully — the hardcoded redirect works for this role
    await page.waitForURL(/\/mdz-os\/owner/, { timeout: 10000 });
  });

  test('direct URL access to /finance', async ({ page }) => {
    await authenticate(page, 'owner@test.com');
    const res = await page.goto('/mdz-os/finance');
    expect(res?.status(), '/finance must not return 4xx for OWNER').toBeLessThan(400);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Total Contracted Revenue')).toBeVisible({ timeout: 10000 });
  });

  test('hard refresh on /finance preserves session', async ({ page }) => {
    await authenticate(page, 'owner@test.com');
    await page.goto('/mdz-os/finance');
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Total Contracted Revenue')).toBeVisible({ timeout: 10000 });

    // Playwright context can read HttpOnly cookies (unlike JS document.cookie)
    const cookies = await page.context().cookies();
    expect(cookies.find(c => c.name === 'next-auth.session-token'),
      'Session cookie must persist after hard refresh').toBeTruthy();
  });

  test('logout invalidates session', async ({ page }) => {
    await authenticate(page, 'owner@test.com');
    await page.goto('/mdz-os/finance');
    await page.waitForLoadState('networkidle');

    // "Logout Session" button is in the profile dropdown in the header
    // Try direct click first; if not visible, open the profile menu first
    const logoutBtn = page.getByRole('button', { name: /logout session/i });
    const isVisible = await logoutBtn.isVisible().catch(() => false);
    if (!isVisible) {
      // Click the profile/avatar area to open dropdown
      await page.locator('header').getByRole('button').last().click();
      await page.waitForTimeout(300);
    }
    await logoutBtn.click({ timeout: 5000 });

    // After logout, must redirect to /login
    await page.waitForURL(/.*login/, { timeout: 10000 });

    // Session API must return no user after logout
    const sessionAfter = await page.request.get('/mdz-os/api/auth/session');
    const data = await sessionAfter.json();
    expect(data?.user, 'Session must be empty after logout').toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// SALES
// ---------------------------------------------------------------------------
test.describe('SALES role', () => {
  test('authentication succeeds — documents ⚠️ hardcoded /owner redirect', async ({ page }) => {
    const { role } = await authenticate(page, 'sales@test.com');
    expect(role).toBe('SALES');
    // SALES should now go to /sales
    await page.waitForURL(/\/mdz-os\/sales/, { timeout: 10000 });
  });

  test('direct URL access to /leads (allowed)', async ({ page }) => {
    await authenticate(page, 'sales@test.com');
    const res = await page.goto('/mdz-os/leads');
    expect(res?.status(), '/leads must not return 4xx for SALES').toBeLessThan(400);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/mdz-os\/leads/);
    await expect(page.locator('text=Sales CRM')).toBeVisible({ timeout: 10000 });
  });

  test('hard refresh on /leads preserves session', async ({ page }) => {
    await authenticate(page, 'sales@test.com');
    await page.goto('/mdz-os/leads');
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Sales CRM')).toBeVisible({ timeout: 10000 });
  });

  test('role boundary: /finance denied → redirected to /login', async ({ page }) => {
    await authenticate(page, 'sales@test.com');
    await page.goto('/mdz-os/finance');
    await page.waitForURL(/.*login/, { timeout: 10000 });
  });

  test('role boundary: /employees denied → redirected to /login', async ({ page }) => {
    await authenticate(page, 'sales@test.com');
    await page.goto('/mdz-os/employees');
    await page.waitForURL(/.*login/, { timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// EMPLOYEE
// ---------------------------------------------------------------------------
test.describe('EMPLOYEE role', () => {
  test('authentication succeeds — documents ⚠️ hardcoded /owner redirect', async ({ page }) => {
    const { role } = await authenticate(page, 'emp@test.com');
    expect(role).toBe('EMPLOYEE');
    await page.waitForURL(/\/mdz-os\/attendance/, { timeout: 10000 });
  });

  test('direct URL access to /attendance (allowed)', async ({ page }) => {
    await authenticate(page, 'emp@test.com');
    const res = await page.goto('/mdz-os/attendance');
    expect(res?.status(), '/attendance must not return 4xx for EMPLOYEE').toBeLessThan(400);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/mdz-os\/attendance/);
    await expect(page.locator('text=MDZ Work Clock')).toBeVisible({ timeout: 10000 });
  });

  test('hard refresh on /attendance preserves session', async ({ page }) => {
    await authenticate(page, 'emp@test.com');
    await page.goto('/mdz-os/attendance');
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=MDZ Work Clock')).toBeVisible({ timeout: 10000 });
  });

  test('role boundary: /finance denied → redirected to /login', async ({ page }) => {
    await authenticate(page, 'emp@test.com');
    await page.goto('/mdz-os/finance');
    await page.waitForURL(/.*login/, { timeout: 10000 });
  });

  test('role boundary: /leads denied → redirected to /login', async ({ page }) => {
    await authenticate(page, 'emp@test.com');
    await page.goto('/mdz-os/leads');
    await page.waitForURL(/.*login/, { timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Anonymous (unauthenticated)
// ---------------------------------------------------------------------------
test.describe('Anonymous access', () => {
  const protectedRoutes = [
    '/mdz-os/owner',
    '/mdz-os/finance',
    '/mdz-os/leads',
    '/mdz-os/clients',
    '/mdz-os/projects',
    '/mdz-os/employees',
    '/mdz-os/attendance',
  ];

  for (const route of protectedRoutes) {
    test(`${route} → denied, redirected to /login`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL(/.*login/, { timeout: 10000 });
    });
  }

  test('/portal/[valid-token] → ALLOWED (client portal is public)', async ({ page }) => {
    const res = await page.goto('/mdz-os/portal/test-portal-token-123');
    // Portal must not redirect to login — it is intentionally public
    expect(page.url()).not.toMatch(/.*login/);
    expect(res?.status()).not.toBe(302);
  });
});
