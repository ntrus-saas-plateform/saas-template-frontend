import { describe, expect, it } from "vitest";
import { hasAnyEdgePermission, hasEdgePermission } from "./permissions";

describe("edge permissions", () => {
  it("requires all listed permissions", () => {
    expect(
      hasEdgePermission(
        ["platform:verticals:read", "workspace:switch"],
        ["platform:verticals:read", "workspace:switch"],
      ),
    ).toBe(true);
    expect(
      hasEdgePermission(["platform:verticals:read"], "workspace:switch"),
    ).toBe(false);
  });

  it("supports wildcard grants", () => {
    expect(
      hasEdgePermission(["platform:verticals:*"], "platform:verticals:read"),
    ).toBe(true);
    expect(hasEdgePermission(["*"], "audit:read")).toBe(true);
  });

  it("supports any-of checks", () => {
    expect(
      hasAnyEdgePermission(
        ["security:sessions:read"],
        ["audit:read", "security:sessions:read"],
      ),
    ).toBe(true);
  });

  it("denies when permission list is empty", () => {
    expect(hasEdgePermission([], "audit:read")).toBe(false);
    expect(hasEdgePermission(undefined, "audit:read")).toBe(false);
  });
});
