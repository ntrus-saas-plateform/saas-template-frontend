import { test, expect } from "@playwright/test";

test.describe("Okapi Edge billing console (P6 smoke)", () => {
  test("anonymous /edge/billing shows Edge sign-in gate", async ({ page }) => {
    await page.goto("/edge/billing");
    await expect(
      page.getByRole("heading", { name: /okapi edge/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /sign in to okapi edge/i }),
    ).toBeVisible();
  });

  test("billing account create without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/billing/accounts", {
      data: {
        commercialAccountId: "00000000-0000-4000-8000-000000000001",
        currency: "USD",
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("draft invoice without CSRF is rejected", async ({ request }) => {
    const res = await request.post(
      "/api/edge-backend/billing/invoices/draft-from-subscription",
      {
        data: {
          subscriptionId: "00000000-0000-4000-8000-000000000001",
        },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("payment intent without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/billing/payments/intents", {
      data: {
        billingAccountId: "00000000-0000-4000-8000-000000000001",
        amount: "100.00",
        currency: "USD",
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });
});
