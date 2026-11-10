import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { InfraStatusBadge } from "./shared";
import {
  aggregateInfraOverview,
  redactSecretRef,
  unwrapInfraList,
} from "@/lib/edge/infrastructure";

describe("infrastructure shared", () => {
  it("renders status badge", () => {
    render(<InfraStatusBadge status="READY" />);
    expect(screen.getByText("READY")).toBeTruthy();
  });

  it("redacts credential refs", () => {
    expect(redactSecretRef("sec_abcdefghijklmnop")).toMatch(/…/);
    expect(redactSecretRef(null)).toBe("—");
  });

  it("unwraps list payloads", () => {
    expect(unwrapInfraList({ items: [{ id: "1" }], total: 1 }).total).toBe(1);
    expect(unwrapInfraList([{ id: "1" }]).items).toHaveLength(1);
  });

  it("aggregates overview counts", () => {
    const counts = aggregateInfraOverview({
      providers: [{ id: "p" } as never],
      plans: [{ id: "pl" } as never],
      resources: [
        { id: "r1", status: "FAILED", driftStatus: "DETECTED" } as never,
        { id: "r2", status: "READY", driftStatus: "NONE" } as never,
      ],
      databases: [{ id: "d1", status: "READY" } as never],
    });
    expect(counts.providers).toBe(1);
    expect(counts.readyDatabases).toBe(1);
    expect(counts.drift).toBe(1);
    expect(counts.failed).toBe(1);
  });
});
