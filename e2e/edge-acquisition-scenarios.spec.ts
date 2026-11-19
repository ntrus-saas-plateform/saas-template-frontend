import { test, expect } from "@playwright/test";

/**
 * P10 live browser/API scenarios (honest coverage).
 *
 * These assert frontend shells + BFF/public proxy contracts without inventing
 * backend success (empty catalogues, 404/502 when Edge API is down are OK).
 * Domain journey P10-S01…S40 remains the Vitest suite (40/40).
 */

const CARD_SELECTORS = [
  'input[type="credit-card"]',
  'input[name*="card" i]',
  'input[autocomplete="cc-number"]',
  'input[autocomplete="cc-csc"]',
  'input[autocomplete="cc-exp"]',
] as const;

async function expectNoCardFields(page: import("@playwright/test").Page) {
  for (const sel of CARD_SELECTORS) {
    await expect(page.locator(sel)).toHaveCount(0);
  }
}

test.describe("P10 acquisition live scenarios (browser + public API)", () => {
  test("P10-S01 — public discovery /acquire loads", async ({ page }) => {
    await page.goto("/acquire");
    await expect(page.getByTestId("acquire-discovery")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", {
        name: /Choisissez le produit adapté/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/Okapi/i).first(),
    ).toBeVisible();
  });

  test("P10-S02/S04 — public product route /acquire/some-slug (may be empty)", async ({
    page,
  }) => {
    await page.goto("/acquire/some-slug");
    // Either product shell or empty/error shell — both keep Okapi branding + back link.
    await expect(page.getByText(/Okapi/i).first()).toBeVisible({
      timeout: 15_000,
    });
    const product = page.getByTestId("acquire-product");
    const back = page.getByRole("link", { name: /retour/i });
    await expect(product.or(back)).toBeVisible();
  });

  test("P10-configure — /acquire/.../configure shell loads (plans BFF, no wizard public)", async ({
    page,
  }) => {
    await page.goto("/acquire/some-slug/configure");
    await expect(page.getByTestId("acquire-configure")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Okapi/i).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Configurer/i }),
    ).toBeVisible();
    await expectNoCardFields(page);
  });

  test("P10-S04/S07 — apply page loads, no card fields, honeypot/challenge UI", async ({
    page,
  }) => {
    await page.goto("/acquire/some-slug/apply");
    await expect(page.getByTestId("acquire-apply")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: /Candidature/i }),
    ).toBeVisible();
    await expectNoCardFields(page);

    // Honeypot present (hidden website field on minimal lead form).
    await expect(page.locator("#minimal-website")).toHaveCount(1);

    // Challenge UI when backend issues one; otherwise loading/absent is OK.
    const challengeInput = page.locator("#minimal-challenge");
    const challengeCount = await challengeInput.count();
    if (challengeCount > 0) {
      await expect(challengeInput).toBeVisible();
    }
  });

  test("P10-S33/S37 — portal page loads (public shell, no fake auth)", async ({
    page,
  }) => {
    await page.goto("/acquire/portal");
    await expect(page.getByTestId("acquire-portal")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: /Portail client/i }),
    ).toBeVisible();
    await expect(page.getByTestId("acquire-portal-client")).toBeVisible();
  });

  test("P10-S26/S27 — checkout page loads without card fields", async ({
    page,
  }) => {
    await page.goto("/acquire/checkout/fake-session-id");
    await expect(page.getByTestId("acquire-checkout")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: /Revue checkout/i }),
    ).toBeVisible();
    await expect(page.getByText(/Aucun champ carte/i)).toBeVisible();
    await expectNoCardFields(page);
  });

  test("P10-S12 — challenge endpoint shape or backend-down statuses", async ({
    request,
  }) => {
    const res = await request.get("/api/acquisition-public/challenge");
    // 200 when Edge API up; 404/500/502/503 when proxy/upstream unavailable.
    expect([200, 404, 500, 502, 503]).toContain(res.status());
    if (res.status() === 200) {
      const json = (await res.json()) as {
        data?: Record<string, unknown>;
        challengeId?: unknown;
        challengeToken?: unknown;
        operandA?: unknown;
        operandB?: unknown;
      };
      const body = json.data ?? json;
      expect(typeof body.challengeId).toBe("string");
      expect(String(body.challengeId).length).toBeGreaterThan(0);
      expect(typeof body.challengeToken).toBe("string");
      expect(String(body.challengeToken).length).toBeGreaterThan(0);
      expect(typeof body.operandA).toBe("number");
      expect(typeof body.operandB).toBe("number");
    }
  });

  test("P10-S07/S12 — public lead POST without challenge is rejected (4xx)", async ({
    request,
  }) => {
    const res = await request.post("/api/acquisition-public/leads", {
      data: {
        email: "e2e-no-challenge@example.com",
        sourceType: "PUBLIC_LANDING",
        sourceRef: "some-slug",
        payload: { productSlug: "some-slug" },
      },
      headers: { "Content-Type": "application/json" },
    });
    // Never invent success: no 2xx without challenge.
    expect(res.status()).toBeGreaterThanOrEqual(400);
    if (res.status() < 500) {
      // Backend reachable → business/validation rejection.
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    } else {
      // Upstream down — proxy/error surface, still not accepted.
      expect([500, 502, 503]).toContain(res.status());
    }
  });

  test("P10-S39 — public analytics POST path exists (not proxy 400)", async ({
    request,
  }) => {
    const res = await request.post("/api/acquisition-public/analytics/events", {
      data: {
        eventName: "e2e.acquisition.smoke",
        properties: { source: "playwright" },
      },
      headers: { "Content-Type": "application/json" },
    });
    // Allowed proxy path — must not be BFF path validation 400.
    expect(res.status()).not.toBe(400);
    const json = await res.json().catch(() => null);
    expect(json?.error?.code).not.toBe("VALIDATION_ERROR");
  });

  test("admin acquisition CSRF rejects product create", async ({ request }) => {
    const res = await request.post("/api/edge-backend/acquisition/products", {
      data: {
        productId: "00000000-0000-4000-8000-000000000001",
        code: "e2e-acq-scen",
        slug: "e2e-acq-scen",
        title: "e2e acquisition product attempt",
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json?.error?.code).toBe("CSRF_REJECTED");
  });

  test("anonymous /edge/acquisition shows Edge sign-in gate", async ({
    page,
  }) => {
    await page.goto("/edge/acquisition");
    await expect(
      page.getByRole("heading", { name: /okapi edge/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /sign in to okapi edge/i }),
    ).toBeVisible();
  });

  test("proxy rejects disallowed / traversal-like path", async ({ request }) => {
    // Non-allowlisted segment → proxy VALIDATION_ERROR 400.
    const disallowed = await request.get("/api/acquisition-public/secrets");
    expect(disallowed.status()).toBe(400);
    const disallowedJson = await disallowed.json();
    expect(disallowedJson?.error?.code).toBe("VALIDATION_ERROR");

    // Encoded ".." — Next often 404s before the catch-all; if it reaches the
    // proxy, expect VALIDATION_ERROR 400. Never forward as a successful path.
    const traversal = await request.get(
      "/api/acquisition-public/%2e%2e/%2e%2e/etc",
    );
    expect([400, 404]).toContain(traversal.status());
    if (traversal.status() === 400) {
      const traversalJson = await traversal.json();
      expect(traversalJson?.error?.code).toBe("VALIDATION_ERROR");
    }
  });

  test("proxy allows checkout path (not 400 invalid path)", async ({
    request,
  }) => {
    const res = await request.get(
      "/api/acquisition-public/checkout/fake-session-id",
    );
    expect(res.status()).not.toBe(400);
    // Backend may 404/500/502; proxy must still forward allowed prefix.
    expect([200, 404, 500, 502, 503]).toContain(res.status());
  });
});
