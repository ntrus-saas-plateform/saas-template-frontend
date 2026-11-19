import { test, expect } from "@playwright/test";

/**
 * P0 console surface smoke (anonymous + CSRF contracts).
 * Authenticated catalog/tenants/BB handshake remains gated by EDGE_E2E_AUTH + seed:edge-e2e.
 * Studio section deep-links: see also e2e/edge-studio-smoke.spec.ts (wired into test:e2e:p0).
 */
test.describe("Okapi Edge P0 console smoke", () => {
  for (const path of [
    "/edge/catalog",
    "/edge/markets",
    "/edge/tenants",
    "/edge/provisioning-requests",
    "/edge/provisioning/product-controls",
    "/edge/administrators",
    "/edge/security",
    "/edge/sales?section=pipeline",
    "/edge/operations?section=incidents",
    "/edge/billing?section=accounts",
  ] as const) {
    test(`anonymous ${path} shows Edge sign-in gate`, async ({ page }) => {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: /okapi edge/i }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole("button", { name: /sign in to okapi edge/i }),
      ).toBeVisible();
      await expect(page.getByText(/current organization/i)).toHaveCount(0);
      await expect(page.getByTestId("edge-studio-shell")).toHaveCount(0);
    });
  }

  test("product-control handshake without CSRF is rejected", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/edge-backend/product-controls/endpoints/00000000-0000-4000-8000-000000000001/handshake",
      {
        data: {},
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("product-control health-check without CSRF is rejected", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/edge-backend/product-controls/endpoints/00000000-0000-4000-8000-000000000001/health-check",
      {
        data: {},
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("catalog products list without session is rejected", async ({
    request,
  }) => {
    const res = await request.get("/api/edge-backend/products?limit=1");
    expect([401, 403]).toContain(res.status());
  });
});
