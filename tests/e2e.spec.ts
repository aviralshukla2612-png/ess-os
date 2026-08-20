import { test, expect } from "@playwright/test";

test.describe("MDZ OS — Full-Stack API & UI E2E Test Suite", () => {
  test("1. Verify /api/auth/login with valid user credentials", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: {
        email: "owner@mdzcompany.com",
        password: "demo123",
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.session.name).toBe("Rahul MDZ");
    expect(body.session.activeRole).toBe("OWNER");
  });

  test("2. Verify GET /api/leads returns database leads", async ({ request }) => {
    const res = await request.get("/api/leads");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test("3. Verify POST /api/leads creates a new prospect lead in DB", async ({ request }) => {
    const res = await request.post("/api/leads", {
      data: {
        clientName: "Playwright Automation Corp",
        contactPerson: "E2E Bot",
        email: "e2e@playwright.dev",
        phone: "+91 99999 00000",
        leadValue: 500000,
        stage: "NEW",
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.clientName).toBe("Playwright Automation Corp");
  });

  test("4. Verify GET /api/clients returns clients list", async ({ request }) => {
    const res = await request.get("/api/clients");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("5. Verify GET /api/projects returns projects list", async ({ request }) => {
    const res = await request.get("/api/projects");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("6. Verify GET /api/employees returns employee workforce list", async ({ request }) => {
    const res = await request.get("/api/employees");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("7. Verify GET /api/finance returns invoice registers & financial metrics", async ({ request }) => {
    const res = await request.get("/api/finance");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.metrics).toBeDefined();
    expect(body.data.metrics.totalBilling).toBeGreaterThan(0);
  });
});
