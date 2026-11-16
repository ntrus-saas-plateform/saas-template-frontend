import { test, expect } from "@playwright/test";

test.describe("Okapi Edge acquisition console (P10 smoke)", () => {
  test("anonymous /edge/acquisition shows Edge sign-in gate", async ({ page }) => {
    await page.goto("/edge/acquisition");
    await expect(
      page.getByRole("heading", { name: /okapi edge/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /sign in to okapi edge/i }),
    ).toBeVisible();
  });

  test("acquisition overview without session is rejected", async ({ request }) => {
    const res = await request.get("/api/edge-backend/acquisition/overview");
    expect([401, 403]).toContain(res.status());
  });

  test("product create without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/acquisition/products", {
      data: {
        productId: "00000000-0000-4000-8000-000000000001",
        code: "e2e-acq",
        slug: "e2e-acq",
        title: "e2e acquisition product attempt",
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("checkout create without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/acquisition/checkout", {
      data: {
        prospectId: "00000000-0000-4000-8000-000000000099",
        idempotencyKey: "e2e-acq-checkout-csrf",
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("public /acquire page loads Okapi heading", async ({ page }) => {
    await page.goto("/acquire");
    await expect(page.getByTestId("acquire-discovery")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", {
        name: /Choisissez le produit adapté/i,
      }),
    ).toBeVisible();
  });

  test("public /acquire/checkout/fake-id loads without card fields", async ({
    page,
  }) => {
    await page.goto("/acquire/checkout/fake-id");
    await expect(page.getByTestId("acquire-checkout")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: /Revue checkout/i }),
    ).toBeVisible();
    await expect(page.getByText(/Aucun champ carte/i)).toBeVisible();
    await expect(page.locator('input[type="credit-card"]')).toHaveCount(0);
    await expect(page.locator('input[name*="card" i]')).toHaveCount(0);
    await expect(page.locator('input[autocomplete="cc-number"]')).toHaveCount(0);
  });
});
