import { test, expect } from "@playwright/test";

test.describe("Okapi Edge commercial console (P2 smoke)", () => {
  test("anonymous /edge/commercial shows Edge sign-in gate", async ({
    page,
  }) => {
    await page.goto("/edge/commercial");
    await expect(
      page.getByRole("heading", { name: /okapi edge/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /sign in to okapi edge/i }),
    ).toBeVisible();
    await expect(page.getByText(/current organization/i)).toHaveCount(0);
  });

  test("commercial pricing preview without CSRF is rejected", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/edge-backend/commercial/pricing/preview",
      {
        data: {
          baseAmount: "10.00",
          currency: "USD",
          quantity: 1,
          modelType: "FLAT_FEE",
        },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("commercial plan publish without CSRF is rejected", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/edge-backend/commercial/plans/00000000-0000-4000-8000-000000000001/publish",
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
