import { test, expect } from "@playwright/test";

test.describe("BFF auth hard gates", () => {
  test("anonymous deep link shows sign-in, not app data", async ({ page }) => {
    await page.goto("/identity/organizations");
    await expect(page.locator("body")).toBeVisible();
    // Sign-in CTA or workspace title — never authenticated CRM chrome alone
    const login = page.getByRole("button", { name: /login/i });
    const welcome = page.getByText(/workspace/i);
    await expect(login.or(welcome).first()).toBeVisible({ timeout: 15_000 });
  });

  test("mutating backend proxy without CSRF is rejected", async ({
    request,
  }) => {
    const res = await request.post("/api/backend/platform/organizations/switch", {
      data: { organizationId: "00000000-0000-4000-8000-000000000001" },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("logout POST without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/auth/logout");
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("session endpoint issues CSRF cookie", async ({ request }) => {
    const res = await request.get("/api/auth/session");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(typeof json?.data?.csrfToken).toBe("string");
    expect(json.data.csrfToken.length).toBeGreaterThanOrEqual(32);
    const setCookie = res.headers()["set-cookie"] ?? "";
    expect(setCookie.toLowerCase()).toContain("edge_csrf=");
  });

  test("bootstrap unauthenticated returns 401", async ({ request }) => {
    const res = await request.get("/api/bootstrap");
    expect(res.status()).toBe(401);
  });
});
