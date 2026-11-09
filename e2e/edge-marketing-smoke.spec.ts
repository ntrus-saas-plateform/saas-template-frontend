import { test, expect } from "@playwright/test";

test.describe("Okapi Edge marketing console (P3 smoke)", () => {
  test("anonymous /edge/marketing shows Edge sign-in gate", async ({
    page,
  }) => {
    await page.goto("/edge/marketing");
    await expect(
      page.getByRole("heading", { name: /okapi edge/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /sign in to okapi edge/i }),
    ).toBeVisible();
  });

  test("marketing campaign publish without CSRF is rejected", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/edge-backend/marketing/campaigns/00000000-0000-4000-8000-000000000001/publish",
      {
        data: {},
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("marketing lead score without CSRF is rejected", async ({ request }) => {
    const res = await request.post(
      "/api/edge-backend/marketing/leads/00000000-0000-4000-8000-000000000001/score",
      {
        data: { signals: { demoRequest: true } },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("marketing delivery request without CSRF is rejected", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/edge-backend/marketing/deliveries/request",
      {
        data: {
          channelConfigId: "00000000-0000-4000-8000-000000000001",
          leadId: "00000000-0000-4000-8000-000000000002",
          purpose: "marketing_email",
          channel: "EMAIL",
          idempotencyKey: "e2e-1",
        },
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("public marketing form proxy rate-limits burst submissions", async ({
    request,
  }) => {
    const slug = "e2e-rate-limit-probe";
    let limited = 0;
    for (let i = 0; i < 35; i += 1) {
      const res = await request.post(
        `/api/marketing-public/forms/${slug}/submissions`,
        {
          data: { payload: { email: `probe-${i}@example.com` } },
          headers: { "Content-Type": "application/json" },
        },
      );
      if (res.status() === 429) {
        limited += 1;
        const json = await res.json();
        expect(json?.error?.code).toBe("RATE_LIMITED");
        break;
      }
    }
    expect(limited).toBeGreaterThan(0);
  });
});
