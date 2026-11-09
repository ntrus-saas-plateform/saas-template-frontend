import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

/**
 * Builds an Edge BFF storage state via Keycloak login (PKCE through /api/edge-auth/login).
 *
 * Required when EDGE_E2E_AUTH=1:
 *   EDGE_E2E_USERNAME / EDGE_E2E_PASSWORD
 * Optional:
 *   EDGE_E2E_STORAGE_STATE (default e2e/.auth/edge-user.json)
 */
const authEnabled = process.env.EDGE_E2E_AUTH === "1";
const storagePath =
  process.env.EDGE_E2E_STORAGE_STATE ??
  path.join("e2e", ".auth", "edge-user.json");

setup.describe.configure({ mode: "serial" });

setup("authenticate Edge admin via Keycloak", async ({ page }) => {
  setup.skip(
    !authEnabled,
    "EDGE_E2E_AUTH!=1 — skip storage-state bootstrap",
  );

  const username = process.env.EDGE_E2E_USERNAME?.trim();
  const password = process.env.EDGE_E2E_PASSWORD?.trim();
  if (!username || !password) {
    throw new Error(
      "EDGE_E2E_AUTH=1 requires EDGE_E2E_USERNAME and EDGE_E2E_PASSWORD",
    );
  }

  fs.mkdirSync(path.dirname(storagePath), { recursive: true });

  await page.goto("/api/edge-auth/login");

  // Keycloak login form (edge-admin realm)
  await page.locator("#username, input[name='username']").first().fill(username);
  await page.locator("#password, input[name='password']").first().fill(password);
  await page
    .locator("#kc-login, button[type='submit'], input[type='submit']")
    .first()
    .click();

  // Callback lands back on the Edge app with session cookie set.
  await page.waitForURL(/\/edge(\/|$)/, { timeout: 60_000 }).catch(async () => {
    // Some deployments redirect to / after callback — accept either.
    await page.goto("/edge");
  });

  const session = await page.request.get("/api/edge-auth/session");
  expect(session.ok()).toBeTruthy();
  const body = await session.json();
  expect(body?.data?.authenticated).toBe(true);

  await page.context().storageState({ path: storagePath });
});
