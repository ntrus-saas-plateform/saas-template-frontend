import { test, expect } from "@playwright/test";
import {
  edgeAuthEnabled,
  edgeAuthSkipReason,
} from "./fixtures/edge-auth";

/**
 * P6 billing scenarios.
 *
 * Unauthenticated: CSRF/auth contract checks always run.
 * Authenticated UI flows require EDGE_E2E_AUTH=1 + edge-auth-setup storage
 * state (project chromium-edge-auth).
 */

const csrfEndpoints = [
  {
    name: "A billing account create",
    path: "/api/edge-backend/billing/accounts",
  },
  {
    name: "B draft invoice from subscription",
    path: "/api/edge-backend/billing/invoices/draft-from-subscription",
  },
  {
    name: "C invoice issue",
    path: "/api/edge-backend/billing/invoices/00000000-0000-4000-8000-000000000001/issue",
  },
  {
    name: "D payment intent",
    path: "/api/edge-backend/billing/payments/intents",
  },
  {
    name: "E payment confirm",
    path: "/api/edge-backend/billing/payments/intents/00000000-0000-4000-8000-000000000001/confirm",
  },
  {
    name: "F reconciliation run",
    path: "/api/edge-backend/billing/reconciliation/runs",
  },
  {
    name: "G financial export",
    path: "/api/edge-backend/billing/exports",
  },
  {
    name: "H process-due schedules",
    path: "/api/edge-backend/billing/schedules/process-due",
  },
  {
    name: "I mark overdue",
    path: "/api/edge-backend/billing/invoices/mark-overdue",
  },
] as const;

test.describe("P6 billing scenarios (CSRF contract)", () => {
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

test.describe("P6 billing scenarios (authenticated UI)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!edgeAuthEnabled, edgeAuthSkipReason());
    test.skip(
      testInfo.project.name !== "chromium-edge-auth",
      "Authenticated UI runs only on chromium-edge-auth project",
    );
  });

  test("A — billing hub brand + overview tab", async ({ page }) => {
    await page.goto("/edge/billing");
    await expect(
      page.getByRole("heading", { name: /okapi edge billing/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/billing & financial operations/i),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^overview$/i }),
    ).toBeVisible();
  });

  test("B — recognized revenue policy label present", async ({ page }) => {
    await page.goto("/edge/billing");
    await expect(
      page.getByText(/recognized \(/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("C — accounts, invoices, portal link", async ({ page }) => {
    await page.goto("/edge/billing");
    await expect(page.getByRole("button", { name: /^accounts$/i })).toBeVisible();
    await page.getByRole("button", { name: /^accounts$/i }).click();
    await expect(
      page.getByText(/create billing account/i),
    ).toBeVisible();

    await page.getByRole("button", { name: /^invoices$/i }).click();
    await expect(
      page.getByText(/draft invoice from subscription/i),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /open customer billing portal/i }),
    ).toBeVisible();
  });

  test("D — portal page loads", async ({ page }) => {
    await page.goto("/edge/billing/portal");
    await expect(
      page.getByRole("heading", { name: /billing portal/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
