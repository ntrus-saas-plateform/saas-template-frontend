import { describe, expect, it } from "vitest";
import {
  isRegistrySection,
  nextRegistryStatuses,
  redactSecureConfigRef,
  registryTransitionNeedsReason,
  unwrapEdgeData,
  unwrapRegistryList,
} from "./registry";

describe("registry helpers", () => {
  it("redacts secureConfigRef when present", () => {
    expect(redactSecureConfigRef(null)).toBe("—");
    expect(redactSecureConfigRef("")).toBe("—");
    expect(redactSecureConfigRef("vault://secret/abc")).toBe(
      "•••••••• (ref present)",
    );
  });

  it("unwraps nested edge data and list pages", () => {
    expect(unwrapEdgeData<{ id: string }>({ data: { id: "1" } })).toEqual({
      id: "1",
    });
    expect(
      unwrapRegistryList({ data: { items: [{ id: "a" }], total: 1 } }),
    ).toEqual({ items: [{ id: "a" }], total: 1 });
    expect(unwrapRegistryList({ data: [{ id: "a" }] })).toEqual({
      items: [{ id: "a" }],
      total: 1,
    });
  });

  it("lists next statuses and reason requirements", () => {
    expect(nextRegistryStatuses("product", "CERTIFIED")).toEqual([
      "SUSPENDED",
      "DEPRECATED",
    ]);
    expect(registryTransitionNeedsReason("product", "SUSPENDED")).toBe(true);
    expect(registryTransitionNeedsReason("version", "PUBLISHED")).toBe(false);
  });

  it("validates registry sections", () => {
    expect(isRegistrySection("products")).toBe(true);
    expect(isRegistrySection("tenants")).toBe(false);
  });
});
