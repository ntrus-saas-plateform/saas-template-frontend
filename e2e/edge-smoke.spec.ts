import { test, expect } from "@playwright/test";

test.describe("Okapi Edge console isolation", () => {
  test("anonymous /edge shows Edge sign-in (not ERP chrome)", async ({
    page,
  }) => {
    await page.goto("/edge");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /okapi edge/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /sign in to okapi edge/i }),
    ).toBeVisible();
    // Must not render ERP Org Switcher
    await expect(page.getByText(/current organization/i)).toHaveCount(0);
  });

  test("anonymous /edge/login shows sign-in CTA", async ({ page }) => {
    await page.goto("/edge/login");
    await expect(
      page.getByRole("button", { name: /sign in to okapi edge/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("anonymous /edge/catalog shows Edge sign-in gate", async ({ page }) => {
    await page.goto("/edge/catalog");
    await expect(
      page.getByRole("heading", { name: /okapi edge/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /sign in to okapi edge/i }),
    ).toBeVisible();
    await expect(page.getByText(/current organization/i)).toHaveCount(0);
  });

  test("mutating edge-backend without Edge CSRF is rejected", async ({
    request,
  }) => {
    const res = await request.post("/api/edge-backend/workspaces/switch", {
      data: { verticalId: "00000000-0000-4000-8000-000000000001" },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("edge session endpoint issues okapi_edge_csrf cookie", async ({
    request,
  }) => {
    const res = await request.get("/api/edge-auth/session");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(typeof json?.data?.csrfToken).toBe("string");
    expect(json.data.csrfToken.length).toBeGreaterThanOrEqual(32);
    const setCookie = res.headers()["set-cookie"] ?? "";
    const cookieNames = setCookie
      .split(/,(?=[^;]+?=)/)
      .map((part) => part.trim().split("=")[0]?.toLowerCase() ?? "");
    expect(cookieNames).toContain("okapi_edge_csrf");
    // Avoid substring false-positive: "okapi_edge_csrf" contains "edge_csrf"
    expect(cookieNames).not.toContain("edge_csrf");
  });

  test("ERP /api/auth/session remains independent", async ({ request }) => {
    const edge = await request.get("/api/edge-auth/session");
    const erp = await request.get("/api/auth/session");
    expect(edge.ok()).toBeTruthy();
    expect(erp.ok()).toBeTruthy();

    const edgeJson = await edge.json();
    const erpJson = await erp.json();
    expect(typeof edgeJson?.data?.csrfToken).toBe("string");
    expect(typeof erpJson?.data?.csrfToken).toBe("string");

    const edgeCookie = edge.headers()["set-cookie"] ?? "";
    const erpCookie = erp.headers()["set-cookie"] ?? "";
    expect(edgeCookie.toLowerCase()).toContain("okapi_edge_csrf=");
    expect(erpCookie.toLowerCase()).toContain("edge_csrf=");
  });

  test("edge-bootstrap unauthenticated returns 401", async ({ request }) => {
    const res = await request.get("/api/edge-bootstrap");
    expect(res.status()).toBe(401);
  });
});
