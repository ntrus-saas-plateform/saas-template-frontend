import { describe, expect, it } from "vitest";
import { matchRouteAccess } from "@/lib/access/route-access";
import { rateLimit } from "@/lib/bff/rate-limit";

describe("matchRouteAccess", () => {
  it("gates admin paths as platformAdmin", () => {
    expect(matchRouteAccess("/admin/reconciliation")?.platformAdmin).toBe(true);
  });

  it("requires users:read for the user directory", () => {
    expect(matchRouteAccess("/identity/users/abc")?.permission).toBe(
      "users:read",
    );
  });

  it("gates live app routes by permission", () => {
    expect(matchRouteAccess("/identity/organizations")?.permission).toBe(
      "organizations:read",
    );
    expect(matchRouteAccess("/identity/users/abc")?.permission).toBe(
      "users:read",
    );
    expect(matchRouteAccess("/admin/tenants")?.platformAdmin).toBe(true);
    expect(matchRouteAccess("/inventory")).toBeNull();
    expect(matchRouteAccess("/accounting")).toBeNull();
    expect(matchRouteAccess("/hr")).toBeNull();
  });

  it("allows home, profile, and invite accept without extra perm", () => {
    expect(matchRouteAccess("/")).toBeNull();
    expect(matchRouteAccess("/settings/profile")).toBeNull();
    expect(matchRouteAccess("/invite")).toBeNull();
  });
});

describe("rateLimit", () => {
  it("allows under limit then blocks", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 2, 60_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
});
