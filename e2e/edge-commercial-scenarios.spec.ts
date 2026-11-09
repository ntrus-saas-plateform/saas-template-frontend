import { test, expect } from "@playwright/test";
import {
  edgeAuthEnabled,
  edgeAuthSkipReason,
} from "./fixtures/edge-auth";

/**
 * P2 scenarios A–F.
 *
 * Unauthenticated: CSRF/auth contract checks always run.
 * Authenticated full UI flows require EDGE_E2E_AUTH=1 + edge-auth-setup storage
 * state (project chromium-edge-auth). Domain/DB coverage lives in
 * saas-templates-backend/test/integration/edge-commercial-scenarios.spec.ts.
 */

const csrfEndpoints = [
  {
    name: "A publish plan",
    path: "/api/edge-backend/commercial/plans/00000000-0000-4000-8000-000000000001/publish",
  },
  {
    name: "B readiness evaluate",
    path: "/api/edge-backend/commercial/offers/PLAN/00000000-0000-4000-8000-000000000001/readiness",
  },
  {
    name: "C price-book entry",
    path: "/api/edge-backend/commercial/price-books/00000000-0000-4000-8000-000000000001/entries",
  },
  {
    name: "D enterprise publish",
    path: "/api/edge-backend/commercial/enterprise-templates/00000000-0000-4000-8000-000000000001/publish",
  },
  {
    name: "E addon publish",
    path: "/api/edge-backend/commercial/addons/00000000-0000-4000-8000-000000000001/publish",
  },
  {
    name: "F package publish",
    path: "/api/edge-backend/commercial/packages/00000000-0000-4000-8000-000000000001/publish",
  },
] as const;

test.describe("P2 commercial scenarios A–F (CSRF contract)", () => {
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

test.describe("P2 commercial scenarios A–F (authenticated UI)", () => {
  test.beforeEach(({ }, testInfo) => {
    test.skip(!edgeAuthEnabled, edgeAuthSkipReason());
    test.skip(
      testInfo.project.name !== "chromium-edge-auth",
      "Authenticated UI runs only on chromium-edge-auth project",
    );
  });

  test("A — commercial hub exposes offer builders", async ({ page }) => {
    await page.goto("/edge/commercial");
    await expect(page.getByRole("button", { name: /packages/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /pricing/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /enterprise/i })).toBeVisible();
  });

  test("B — invalid offer surfaces readiness blockers in UI", async ({
    page,
  }) => {
    await page.goto("/edge/commercial");
    await page.getByRole("button", { name: /^plans$/i }).click();
    await expect(page.getByText(/publication requires commercial readiness/i)).toBeVisible();
  });

  test("C — pricing tab has price book + entry builders", async ({ page }) => {
    await page.goto("/edge/commercial");
    await page.getByRole("button", { name: /pricing/i }).click();
    await expect(
      page.getByRole("heading", { name: /create price book/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /add price entry/i }),
    ).toBeVisible();
  });

  test("D — enterprise template builder requires deployment mode", async ({
    page,
  }) => {
    await page.goto("/edge/commercial");
    await page.getByRole("button", { name: /enterprise/i }).click();
    await expect(
      page.getByRole("heading", { name: /create enterprise template/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder(/deployment mode/i)).toBeVisible();
  });

  test("E — vertical-scoped product selector is present", async ({ page }) => {
    await page.goto("/edge/commercial");
    await expect(page.locator("select").first()).toBeVisible();
  });

  test("F — plan detail exposes readiness + publish", async ({ page }) => {
    await page.goto("/edge/commercial");
    await page.getByRole("button", { name: /^plans$/i }).click();
    const open = page.getByRole("link", { name: /^open$/i }).first();
    if ((await open.count()) === 0) {
      test.skip(true, "No published/draft plans in fixture");
      return;
    }
    await open.click();
    await expect(
      page.getByRole("heading", { name: /commercial readiness/i }),
    ).toBeVisible();
  });
});
