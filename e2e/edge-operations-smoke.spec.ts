import { test, expect } from "@playwright/test";

test.describe("Okapi Edge operations console (P9 smoke)", () => {
  test("anonymous /edge/operations shows Edge sign-in gate", async ({ page }) => {
    await page.goto("/edge/operations");
    await expect(
      page.getByRole("heading", { name: /okapi edge/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /sign in to okapi edge/i }),
    ).toBeVisible();
  });

  test("operations overview without session is rejected", async ({ request }) => {
    const res = await request.get("/api/edge-backend/operations/overview");
    expect([401, 403]).toContain(res.status());
  });

  test("mandate aliases without session are rejected", async ({ request }) => {
    for (const path of [
      "/api/edge-backend/operations/health",
      "/api/edge-backend/operations/major-incidents",
      "/api/edge-backend/operations/releases",
      "/api/edge-backend/operations/status-pages",
      "/api/edge-backend/operations/automation",
    ]) {
      const res = await request.get(path);
      expect([401, 403]).toContain(res.status());
    }
  });

  test("alert ingest without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/operations/alerts", {
      data: {
        fingerprint: "e2e-alert-1",
        title: "e2e alert ingest attempt",
        sourceSystem: "e2e.test",
        severity: "SEV3",
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("incident create without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/operations/incidents", {
      data: {
        title: "e2e incident create attempt",
        severity: "SEV3",
        category: "AVAILABILITY",
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("change draft without CSRF is rejected", async ({ request }) => {
    const res = await request.post("/api/edge-backend/operations/changes", {
      data: {
        title: "e2e change draft attempt",
        changeType: "NORMAL",
        riskLevel: "MEDIUM",
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });
});
