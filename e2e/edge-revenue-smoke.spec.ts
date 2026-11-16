import { test, expect } from "@playwright/test";

test.describe("Okapi Edge revenue console (P11 smoke)", () => {
  test("anonymous /edge/revenue shows Edge sign-in gate", async ({ page }) => {
    await page.goto("/edge/revenue");
    await expect(
      page.getByRole("heading", { name: /okapi edge/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /sign in to okapi edge/i }),
    ).toBeVisible();
  });

  test("revenue overview without session is rejected", async ({ request }) => {
    const res = await request.get("/api/edge-backend/revenue/overview");
    expect([401, 403]).toContain(res.status());
  });

  test("metric definition create without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/revenue/metrics/definitions", {
      data: {
        code: "E2E_METRIC",
        name: "e2e metric attempt",
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("MRR compute without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/revenue/mrr/compute", {
      data: {
        periodStart: "2026-11-01T00:00:00.000Z",
        periodEnd: "2026-11-30T00:00:00.000Z",
        currency: "USD",
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("leakage case create without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/revenue/leakage-cases", {
      data: {
        title: "e2e leakage",
        detectionSource: "e2e",
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });
});
