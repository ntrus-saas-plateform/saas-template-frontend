import { test, expect } from "@playwright/test";

test.describe("Shell smoke", () => {
  test("home responds", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok() || res?.status() === 200 || res?.status() === 307).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("organizations route loads shell chrome or auth", async ({ page }) => {
    await page.goto("/identity/organizations");
    await expect(page.locator("body")).toBeVisible();
  });
});
