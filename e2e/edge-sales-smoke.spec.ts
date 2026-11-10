import { test, expect } from "@playwright/test";

test.describe("Okapi Edge sales console (P4 smoke)", () => {
  test("anonymous /edge/sales shows Edge sign-in gate", async ({ page }) => {
    await page.goto("/edge/sales");
    await expect(
      page.getByRole("heading", { name: /okapi edge/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /sign in to okapi edge/i }),
    ).toBeVisible();
  });

  test("sales account create without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/sales/accounts", {
      data: { legalName: "E2E Corp" },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("sales quote create without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/sales/quotes", {
      data: {
        opportunityId: "00000000-0000-4000-8000-000000000001",
        lines: [
          {
            lineNumber: 1,
            description: "Plan",
            quantity: 1,
            unitPrice: 100,
          },
        ],
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("sales handoff without CSRF is rejected", async ({ request }) => {
    const res = await request.post(
      "/api/edge-backend/sales/orders/00000000-0000-4000-8000-000000000001/handoff",
      {
        data: { requireContract: true },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("sales export without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/sales/exports", {
      data: { entityType: "ACCOUNT", format: "JSON" },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });
});
