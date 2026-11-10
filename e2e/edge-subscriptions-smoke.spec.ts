import { test, expect } from "@playwright/test";

test.describe("Okapi Edge subscriptions console (P5 smoke)", () => {
  test("anonymous /edge/subscriptions shows Edge sign-in gate", async ({
    page,
  }) => {
    await page.goto("/edge/subscriptions");
    await expect(
      page.getByRole("heading", { name: /okapi edge/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /sign in to okapi edge/i }),
    ).toBeVisible();
  });

  test("subscription create without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/subscriptions", {
      data: {
        accountId: "00000000-0000-4000-8000-000000000001",
        productId: "00000000-0000-4000-8000-000000000002",
        currency: "USD",
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("subscription activate without CSRF is rejected", async ({ request }) => {
    const res = await request.post(
      "/api/edge-backend/subscriptions/00000000-0000-4000-8000-000000000001/activate",
      {
        data: {},
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("subscription suspend without CSRF is rejected", async ({ request }) => {
    const res = await request.post(
      "/api/edge-backend/subscriptions/00000000-0000-4000-8000-000000000001/suspend",
      {
        data: { reason: "E2E" },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });
});
