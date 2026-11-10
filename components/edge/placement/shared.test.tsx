/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  CapacityFreshnessBadge,
  CapacityMeter,
  PlacementFilters,
  PlacementForbidden,
  PlacementLoading,
  PlacementPagination,
  PlacementStatusBadge,
} from "./shared";
import {
  redactPlacementMetadata,
  redactSecretRef,
} from "@/lib/edge/placement";

describe("placement shared UI", () => {
  it("paginates with previous/next and disables at bounds", () => {
    const onOffsetChange = vi.fn();
    const { rerender } = render(
      <PlacementPagination
        offset={0}
        limit={20}
        total={45}
        onOffsetChange={onOffsetChange}
      />,
    );
    expect(screen.getByText("1–20 of 45")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onOffsetChange).toHaveBeenCalledWith(20);

    rerender(
      <PlacementPagination
        offset={40}
        limit={20}
        total={45}
        onOffsetChange={onOffsetChange}
      />,
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("renders search and status filters", () => {
    const onQChange = vi.fn();
    const onStatusChange = vi.fn();
    render(
      <PlacementFilters
        q=""
        status=""
        statusOptions={["PENDING", "PLACED", "NO_CAPACITY"]}
        onQChange={onQChange}
        onStatusChange={onStatusChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Search placement"), {
      target: { value: "req" },
    });
    expect(onQChange).toHaveBeenCalledWith("req");
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "NO_CAPACITY" },
    });
    expect(onStatusChange).toHaveBeenCalledWith("NO_CAPACITY");
  });

  it("shows placement status badges and capacity meter", () => {
    const { rerender } = render(<PlacementStatusBadge status="PLACED" />);
    expect(screen.getByText("PLACED")).toBeTruthy();
    rerender(<PlacementStatusBadge status="REQUIRES_REVIEW" />);
    expect(screen.getByText("REQUIRES_REVIEW")).toBeTruthy();
    rerender(<PlacementStatusBadge status="NO_CAPACITY" />);
    expect(screen.getByText("NO_CAPACITY")).toBeTruthy();

    rerender(
      <CapacityMeter
        totalCapacity={100}
        reservedCapacity={20}
        allocatedCapacity={30}
        availableCapacity={50}
        label="CPU pool"
      />,
    );
    expect(screen.getByLabelText("CPU pool")).toBeTruthy();
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(screen.getByText(/50%/)).toBeTruthy();
  });

  it("shows freshness badge without inventing operational data", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    const { rerender } = render(
      <CapacityFreshnessBadge validUntil={future} capacityStatus="ACTIVE" />,
    );
    expect(screen.getByText("FRESH")).toBeTruthy();
    rerender(
      <CapacityFreshnessBadge validUntil={past} capacityStatus="STALE" />,
    );
    expect(screen.getByText("STALE/EXPIRED")).toBeTruthy();
  });

  it("renders loading and forbidden states", () => {
    const { rerender } = render(<PlacementLoading label="Loading placement…" />);
    expect(screen.getByLabelText("Loading placement…")).toBeTruthy();
    rerender(
      <PlacementForbidden description="Missing platform:placement:read" />,
    );
    expect(screen.getByText(/Missing platform:placement:read/)).toBeTruthy();
  });

  it("redacts secrets and never exposes vault/password values", () => {
    expect(redactSecretRef("vault://secret/db-password")).toBe(
      "•••••••• (ref present)",
    );
    const redacted = redactPlacementMetadata({
      region: "eu-west",
      apiToken: "super-secret-token",
      note: "vault://secret/x",
    });
    expect(redacted.region).toBe("eu-west");
    expect(redacted.apiToken).toBe("•••••••• (ref present)");
    expect(redacted.note).toBe("•••••••• (ref present)");
    expect(JSON.stringify(redacted)).not.toContain("super-secret-token");
    expect(JSON.stringify(redacted)).not.toContain("vault://");
  });
});
