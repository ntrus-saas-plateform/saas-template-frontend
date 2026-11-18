import { describe, expect, it } from "vitest";
import { g11BadgeFromProduct } from "./g11-readiness";

describe("g11BadgeFromProduct", () => {
  it("marks beachhead AVAILABLE with Legal gate note", () => {
    const b = g11BadgeFromProduct({
      code: "SYNTIX_PHARMA",
      commercialAvailability: "AVAILABLE",
    });
    expect(b.tone).toBe("pass");
    expect(b.label).toMatch(/Legal/);
  });

  it("marks INTERNAL_ONLY as PARTIAL", () => {
    const b = g11BadgeFromProduct({
      code: "OKAPI_RETAIL",
      commercialAvailability: "INTERNAL_ONLY",
      metadata: { rgomRoadmapStatus: "PLANNED" },
    });
    expect(b.tone).toBe("partial");
  });
});
