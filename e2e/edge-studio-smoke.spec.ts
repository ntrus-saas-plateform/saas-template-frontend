import { test, expect, type Page } from "@playwright/test";
import {
  edgeAuthEnabled,
  edgeAuthSkipReason,
} from "./fixtures/edge-auth";

/**
 * Phase 7 — Edge studio smoke (section rails).
 *
 * Anonymous: deep-link `?section=` URLs still hit EdgeAuthGate (sign-in).
 * Authenticated (EDGE_E2E_AUTH=1 + chromium-edge-auth): shell + section rail
 * + settled work zone (loading cleared → empty/error/forbidden/content).
 */

const STUDIO_SECTION_PATHS = [
  {
    name: "sales pipeline",
    path: "/edge/sales?section=pipeline",
    sectionLabel: /^pipeline$/i,
  },
  {
    name: "operations incidents",
    path: "/edge/operations?section=incidents",
    sectionLabel: /^incidents$/i,
  },
  {
    name: "billing accounts",
    path: "/edge/billing?section=accounts",
    sectionLabel: /^accounts$/i,
  },
  {
    name: "backends registry",
    path: "/edge/backends?section=registry",
    sectionLabel: /^registry$/i,
  },
  {
    name: "administrators directory",
    path: "/edge/administrators?section=directory",
    sectionLabel: /^directory$/i,
  },
  {
    name: "security sessions",
    path: "/edge/security?section=sessions",
    sectionLabel: /^sessions$/i,
  },
] as const;

async function expectAnonymousSignInGate(page: Page, path: string) {
  await page.goto(path);
  await expect(
    page.getByRole("heading", { name: /okapi edge/i }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("button", { name: /sign in to okapi edge/i }),
  ).toBeVisible();
  await expect(page.locator("[data-studio-shell]")).toHaveCount(0);
  await expect(page.getByText(/current organization/i)).toHaveCount(0);
}

async function expectStudioSectionRail(
  page: Page,
  path: string,
  sectionLabel: RegExp,
) {
  await page.goto(path);
  await expect(page.locator("[data-studio-shell]")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId("edge-studio-section-nav")).toBeVisible();
  await expect(page.getByTestId("edge-studio-main")).toBeVisible();

  const sectionBtn = page
    .getByRole("navigation", { name: /studio sections/i })
    .getByRole("button", { name: sectionLabel });
  await expect(sectionBtn).toHaveAttribute("aria-current", "page");

  // Work zone settles out of EdgeLoadingState (aria-busy) into empty/error/forbidden/content.
  await expect(
    page.getByTestId("edge-studio-main").locator('[aria-busy="true"]'),
  ).toHaveCount(0, { timeout: 25_000 });
}

test.describe("Okapi Edge studio smoke (anonymous section deep-links)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-edge-auth",
      "Anonymous sign-in gate is only checkable without a stored session",
    );
  });

  for (const row of STUDIO_SECTION_PATHS) {
    test(`anonymous ${row.name} shows Edge sign-in gate`, async ({ page }) => {
      await expectAnonymousSignInGate(page, row.path);
    });
  }
});

test.describe("Okapi Edge studio smoke (authenticated section rails)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!edgeAuthEnabled, edgeAuthSkipReason());
    test.skip(
      testInfo.project.name !== "chromium-edge-auth",
      "Authenticated studio rails run only on chromium-edge-auth project",
    );
  });

  for (const row of STUDIO_SECTION_PATHS) {
    test(`auth ${row.name} renders studio shell + active section`, async ({
      page,
    }) => {
      await expectStudioSectionRail(page, row.path, row.sectionLabel);
    });
  }
});
