import { describe, expect, it } from "vitest";
import {
  filterPublicPresentations,
  isCommerciallyPresentable,
} from "./public-acquisition";

describe("isCommerciallyPresentable", () => {
  it("accepts beachhead / controlled values only", () => {
    expect(isCommerciallyPresentable("AVAILABLE")).toBe(true);
    expect(isCommerciallyPresentable("CONTROLLED_ROLLOUT")).toBe(true);
  });

  it("rejects PLANNED scaffolding (INTERNAL_ONLY)", () => {
    expect(isCommerciallyPresentable("INTERNAL_ONLY")).toBe(false);
    expect(isCommerciallyPresentable("UNAVAILABLE")).toBe(false);
    expect(isCommerciallyPresentable(null)).toBe(false);
  });
});

describe("filterPublicPresentations", () => {
  it("keeps PUBLISHED only", () => {
    const out = filterPublicPresentations([
      { status: "PUBLISHED", id: "a" },
      { status: "DRAFT", id: "b" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("a");
  });
});