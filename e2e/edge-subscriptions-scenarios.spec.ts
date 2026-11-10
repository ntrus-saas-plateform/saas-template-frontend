import { test, expect } from "@playwright/test";
import {
  edgeAuthEnabled,
  edgeAuthSkipReason,
} from "./fixtures/edge-auth";

/**
 * P5 subscription scenarios A–F.
 *
 * Unauthenticated: CSRF/auth contract checks always run.
 * Authenticated UI flows require EDGE_E2E_AUTH=1 + edge-auth-setup storage
 * state (project chromium-edge-auth).
 */

const csrfEndpoints = [
  {
    name: "A subscription create",
    path: "/api/edge-backend/subscriptions",
  },
  {
    name: "B from-handoff create",
    path: "/api/edge-backend/subscriptions/from-handoff",
  },
  {
    name: "C activate",
    path: "/api/edge-backend/subscriptions/00000000-0000-4000-8000-000000000001/activate",
  },
  {
    name: "D suspend",
    path: "/api/edge-backend/subscriptions/00000000-0000-4000-8000-000000000001/suspend",
  },
  {
    name: "E renewal create",
    path: "/api/edge-backend/subscriptions/00000000-0000-4000-8000-000000000001/renewals",
  },
  {
    name: "F entitlements publish",
    path: "/api/edge-backend/subscriptions/00000000-0000-4000-8000-000000000001/entitlements/publish",
  },
] as const;

test.describe("P5 subscriptions scenarios A–F (CSRF contract)", () => {
  for (const ep of csrfEndpoints) {
    test(`${ep.name} without CSRF is rejected`, async ({ request }) => {
      const res = await request.post(ep.path, {
        data: {},
        headers: { "Content-Type": "application/json" },
      });
      expect(res.status()).toBe(403);
      const json = await res.json();
      expect(json?.error?.code).toBe("CSRF_REJECTED");
    });
  }
});

test.describe("P5 subscriptions scenarios A–F (authenticated UI)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!edgeAuthEnabled, edgeAuthSkipReason());
    test.skip(
      testInfo.project.name !== "chromium-edge-auth",
      "Authenticated UI runs only on chromium-edge-auth project",
    );
  });

  test("A — subscriptions hub brand", async ({ page }) => {
    await page.goto("/edge/subscriptions");
    await expect(
      page.getByRole("heading", { name: /okapi edge subscriptions/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/subscription & contract lifecycle/i),
    ).toBeVisible();
  });

  test("B — registry + renewals tabs", async ({ page }) => {
    await page.goto("/edge/subscriptions");
    await expect(page.getByRole("button", { name: /^registry$/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^renewals$/i }),
    ).toBeVisible();
  });

  test("C — trials + entitlements tabs", async ({ page }) => {
    await page.goto("/edge/subscriptions");
    await expect(page.getByRole("button", { name: /^trials$/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^entitlements$/i }),
    ).toBeVisible();
  });

  test("D — registry tab exposes create draft", async ({ page }) => {
    await page.goto("/edge/subscriptions");
    await page.getByRole("button", { name: /^registry$/i }).click();
    await expect(page.getByText(/create draft/i).first()).toBeVisible();
  });

  test("E — provisioning + billing tabs present", async ({ page }) => {
    await page.goto("/edge/subscriptions");
    await expect(
      page.getByRole("button", { name: /^provisioning$/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^billing$/i })).toBeVisible();
  });

  test("F — subscription workspace route loads shell", async ({ page }) => {
    await page.goto(
      "/edge/subscriptions/00000000-0000-4000-8000-000000000001",
    );
    await expect(
      page.getByRole("link", { name: /subscriptions console/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("G — workspace shows activation gate labels", async ({ page }) => {
    await page.goto(
      "/edge/subscriptions/00000000-0000-4000-8000-000000000001",
    );
    await expect(
      page.getByText(/commercial validated/i).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/provisioning confirmed/i).first()).toBeVisible();
    await expect(page.getByText(/billing confirmed/i).first()).toBeVisible();
  });

  test("H — registry create draft heading", async ({ page }) => {
    await page.goto("/edge/subscriptions");
    await page.getByRole("button", { name: /^registry$/i }).click();
    await expect(
      page.getByRole("heading", { name: /create draft subscription/i }),
    ).toBeVisible();
  });
});
