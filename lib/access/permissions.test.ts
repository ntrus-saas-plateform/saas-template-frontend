import { describe, expect, it } from "vitest";
import {
  hasAnyPermission,
  hasPermission,
  isModuleEnabled,
} from "./permissions";

describe("permissions", () => {
  it("requires all permissions", () => {
    expect(
      hasPermission(["customers:read", "customers:create"], [
        "customers:read",
        "customers:create",
      ]),
    ).toBe(true);
    expect(hasPermission(["customers:read"], ["customers:create"])).toBe(false);
  });

  it("supports any-of", () => {
    expect(
      hasAnyPermission(["commerce:read"], ["customers:read", "commerce:read"]),
    ).toBe(true);
  });

  it("checks modules", () => {
    expect(isModuleEnabled({ customer: true }, "customer")).toBe(true);
    expect(isModuleEnabled({ customer: false }, "customer")).toBe(false);
  });
});
