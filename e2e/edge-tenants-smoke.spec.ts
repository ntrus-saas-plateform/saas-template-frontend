import { test, expect } from "@playwright/test";

test.describe("Okapi Edge tenants console (P8 smoke)", () => {
  test("anonymous /edge/tenants shows Edge sign-in gate", async ({ page }) => {
    await page.goto("/edge/tenants");
    await expect(
      page.getByRole("heading", { name: /okapi edge/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /sign in to okapi edge/i }),
    ).toBeVisible();
  });

  test("tenant registry search without CSRF is rejected", async ({ request }) => {
    const res = await request.get("/api/edge-backend/tenants?limit=10");
    expect([401, 403]).toContain(res.status());
  });

  test("legal-hold raise without CSRF is rejected", async ({ request }) => {
    const res = await request.post(
      "/api/edge-backend/tenants/00000000-0000-4000-8000-000000000001/legal-hold-requests",
      {
        data: {
          action: "RAISE",
          justification: "e2e legal hold raise attempt",
          idempotencyKey: "e2e-lh-raise-1",
        },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("deprovision authorization without CSRF is rejected", async ({ request }) => {
    const res = await request.post(
      "/api/edge-backend/tenants/00000000-0000-4000-8000-000000000001/deprovision-authorization",
      {
        data: {
          expectedVersion: 1,
          authorized: true,
          confirmed: true,
          justification: "e2e deprovision authorize",
        },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("lifecycle approve without CSRF is rejected", async ({ request }) => {
    const res = await request.post(
      "/api/edge-backend/tenant-management/lifecycle-requests/00000000-0000-4000-8000-000000000001/approve",
      {
        data: {},
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });
});
