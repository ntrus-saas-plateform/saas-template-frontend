import { test, expect } from "@playwright/test";
import {
  edgeAuthEnabled,
  edgeAuthSkipReason,
} from "./fixtures/edge-auth";

/**
 * P3 marketing scenarios A–F.
 *
 * Unauthenticated: CSRF/auth contract checks always run.
 * Authenticated UI flows require EDGE_E2E_AUTH=1 + edge-auth-setup storage state
 * (project chromium-edge-auth).
 */

const csrfEndpoints = [
  {
    name: "A content approve",
    path: "/api/edge-backend/marketing/contents/00000000-0000-4000-8000-000000000001/approve",
  },
  {
    name: "B content publish",
    path: "/api/edge-backend/marketing/contents/00000000-0000-4000-8000-000000000001/publish",
  },
  {
    name: "C landing publish",
    path: "/api/edge-backend/marketing/landing-pages/00000000-0000-4000-8000-000000000001/publish",
  },
  {
    name: "D delivery request",
    path: "/api/edge-backend/marketing/deliveries/request",
  },
  {
    name: "E journey activate",
    path: "/api/edge-backend/marketing/journeys/00000000-0000-4000-8000-000000000001/activate",
  },
  {
    name: "F content studio put",
    path: "/api/edge-backend/marketing/contents/00000000-0000-4000-8000-000000000001/studio",
    method: "PUT" as const,
  },
] as const;

test.describe("P3 marketing scenarios A–F (CSRF contract)", () => {
  for (const ep of csrfEndpoints) {
    test(`${ep.name} without CSRF is rejected`, async ({ request }) => {
      const method = "method" in ep && ep.method === "PUT" ? "put" : "post";
      const res = await request[method](ep.path, {
        data: method === "put" ? { studio: { version: 1, blocks: [] } } : {},
        headers: { "Content-Type": "application/json" },
      });
      expect(res.status()).toBe(403);
      const json = await res.json();
      expect(json?.error?.code).toBe("CSRF_REJECTED");
    });
  }
});

test.describe("P3 marketing scenarios A–F (authenticated UI)", () => {
  test.beforeEach(({ }, testInfo) => {
    test.skip(!edgeAuthEnabled, edgeAuthSkipReason());
    test.skip(
      testInfo.project.name !== "chromium-edge-auth",
      "Authenticated UI runs only on chromium-edge-auth project",
    );
  });

  test("A — marketing hub exposes content + landing tabs", async ({ page }) => {
    await page.goto("/edge/marketing");
    await expect(page.getByRole("button", { name: /^content$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^landing$/i })).toBeVisible();
  });

  test("B — content studio block controls are present", async ({ page }) => {
    await page.goto("/edge/marketing");
    await page.getByRole("button", { name: /^content$/i }).click();
    await expect(
      page.getByRole("heading", { name: /create content/i }),
    ).toBeVisible();
  });

  test("C — landing studio controls are present", async ({ page }) => {
    await page.goto("/edge/marketing");
    await page.getByRole("button", { name: /^landing$/i }).click();
    await expect(
      page.getByRole("heading", { name: /create landing page/i }),
    ).toBeVisible();
  });

  test("D — channels tab documents Resend honesty", async ({ page }) => {
    await page.goto("/edge/marketing");
    await page.getByRole("button", { name: /^channels$/i }).click();
    await expect(page.getByText(/resend/i).first()).toBeVisible();
  });

  test("E — journeys tab exposes resume waits", async ({ page }) => {
    await page.goto("/edge/marketing");
    await page.getByRole("button", { name: /^journeys$/i }).click();
    await expect(
      page.getByRole("button", { name: /resume due waits/i }),
    ).toBeVisible();
  });

  test("F — attribution tab shows CAC unavailable honesty", async ({ page }) => {
    await page.goto("/edge/marketing");
    await page.getByRole("button", { name: /attribution/i }).click();
    await expect(page.getByText(/cac/i).first()).toBeVisible();
  });
});
