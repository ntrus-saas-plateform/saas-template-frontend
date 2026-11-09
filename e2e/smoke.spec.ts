import { test, expect } from "@playwright/test";

test.describe("Shell smoke", () => {
  test("home responds", async ({ page }) => {
    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(
      res?.ok() ||
        res?.status() === 200 ||
        res?.status() === 307 ||
        res?.status() === 302,
    ).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("organizations route loads shell chrome or auth", async ({ page }) => {
    await page.goto("/identity/organizations", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("body")).toBeVisible();
    expect(page.url()).toContain("/identity/organizations");
    // Local e2e often has ERP Keycloak unconfigured; never leak org data tables.
    await expect(page.getByRole("table")).toHaveCount(0);
  });
});
