import { test, expect } from "@playwright/test";
import {
  edgeAuthEnabled,
  edgeAuthSkipReason,
} from "./fixtures/edge-auth";

/**
 * P4 sales scenarios A–F.
 *
 * Unauthenticated: CSRF/auth contract checks always run.
 * Authenticated UI flows require EDGE_E2E_AUTH=1 + edge-auth-setup storage
 * state (project chromium-edge-auth).
 */

const csrfEndpoints = [
  {
    name: "A account create",
    path: "/api/edge-backend/sales/accounts",
  },
  {
    name: "B opportunity create",
    path: "/api/edge-backend/sales/opportunities",
  },
  {
    name: "C quote create",
    path: "/api/edge-backend/sales/quotes",
  },
  {
    name: "D contract transition",
    path: "/api/edge-backend/sales/contracts/00000000-0000-4000-8000-000000000001/transitions",
  },
  {
    name: "E handoff request",
    path: "/api/edge-backend/sales/orders/00000000-0000-4000-8000-000000000001/handoff",
  },
  {
    name: "F export",
    path: "/api/edge-backend/sales/exports",
  },
] as const;

test.describe("P4 sales scenarios A–F (CSRF contract)", () => {
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

test.describe("P4 sales scenarios A–F (authenticated UI)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!edgeAuthEnabled, edgeAuthSkipReason());
    test.skip(
      testInfo.project.name !== "chromium-edge-auth",
      "Authenticated UI runs only on chromium-edge-auth project",
    );
  });

  test("A — sales hub brand + global search", async ({ page }) => {
    await page.goto("/edge/sales");
    await expect(
      page.getByRole("heading", { name: /okapi edge sales/i }),
    ).toBeVisible();
    await expect(
      page.getByPlaceholder(/global search/i),
    ).toBeVisible();
  });

  test("B — accounts / opportunities / quotes tabs", async ({ page }) => {
    await page.goto("/edge/sales");
    await expect(page.getByRole("button", { name: /^accounts$/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^opportunities$/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^quotes$/i })).toBeVisible();
  });

  test("C — proposals + consulting + governance tabs", async ({ page }) => {
    await page.goto("/edge/sales");
    await expect(page.getByRole("button", { name: /^proposals$/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^consulting$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^governance$/i }),
    ).toBeVisible();
  });

  test("D — accounts tab exposes create account", async ({ page }) => {
    await page.goto("/edge/sales");
    await page.getByRole("button", { name: /^accounts$/i }).click();
    await expect(page.getByText(/create account/i).first()).toBeVisible();
  });

  test("E — contracts + orders tabs present", async ({ page }) => {
    await page.goto("/edge/sales");
    await expect(page.getByRole("button", { name: /^contracts$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^orders$/i })).toBeVisible();
  });

  test("F — opportunity workspace route loads shell", async ({ page }) => {
    await page.goto(
      "/edge/sales/opportunities/00000000-0000-4000-8000-000000000001",
    );
    await expect(
      page.getByRole("link", { name: /sales console/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
