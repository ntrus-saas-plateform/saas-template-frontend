/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ProductControlCountCard,
  ProductControlFilters,
  ProductControlForbidden,
  ProductControlLoading,
  ProductControlPagination,
  ProductControlStatusBadge,
} from "./shared";
import {
  aggregateOverviewCounts,
  canMutateEndpoint,
  needsReconciliation,
  redactProductControlMetadata,
  redactSecretRef,
} from "@/lib/edge/product-control";

describe("product control shared UI", () => {
  it("paginates with previous/next and disables at bounds", () => {
    const onOffsetChange = vi.fn();
    const { rerender } = render(
      <ProductControlPagination
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
      <ProductControlPagination
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
      <ProductControlFilters
        q=""
        status=""
        statusOptions={["ACTIVE", "QUARANTINED", "FAILED"]}
        onQChange={onQChange}
        onStatusChange={onStatusChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Search product control"), {
      target: { value: "pc" },
    });
    expect(onQChange).toHaveBeenCalledWith("pc");
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "QUARANTINED" },
    });
    expect(onStatusChange).toHaveBeenCalledWith("QUARANTINED");
  });

  it("shows status badges and count cards", () => {
    const { rerender } = render(<ProductControlStatusBadge status="ACTIVE" />);
    expect(screen.getByText("ACTIVE")).toBeTruthy();
    rerender(<ProductControlStatusBadge status="QUARANTINED" />);
    expect(screen.getByText("QUARANTINED")).toBeTruthy();
    rerender(<ProductControlStatusBadge status="RECONCILIATION_REQUIRED" />);
    expect(screen.getByText("RECONCILIATION_REQUIRED")).toBeTruthy();

    rerender(<ProductControlCountCard label="Endpoints" count={4} />);
    expect(screen.getByLabelText("Endpoints: 4")).toBeTruthy();
  });

  it("renders loading and forbidden states", () => {
    const { rerender } = render(
      <ProductControlLoading label="Loading product control…" />,
    );
    expect(screen.getByLabelText("Loading product control…")).toBeTruthy();
    rerender(
      <ProductControlForbidden description="Missing platform:product_control:read" />,
    );
    expect(
      screen.getByText(/Missing platform:product_control:read/),
    ).toBeTruthy();
  });

  it("redacts secrets and gates quarantined mutations", () => {
    expect(redactSecretRef("vault://secret/x")).toBe("•••••••• (ref present)");
    const redacted = redactProductControlMetadata({
      region: "eu-west",
      apiToken: "super-secret",
      note: "vault://secret/x",
    });
    expect(redacted.region).toBe("eu-west");
    expect(redacted.apiToken).toBe("•••••••• (ref present)");
    expect(JSON.stringify(redacted)).not.toContain("super-secret");
    expect(canMutateEndpoint("ACTIVE")).toBe(true);
    expect(canMutateEndpoint("QUARANTINED")).toBe(false);
    expect(needsReconciliation("UNKNOWN_OUTCOME")).toBe(true);
    expect(needsReconciliation("SUCCEEDED", "NONE")).toBe(false);
  });

  it("aggregates overview counts", () => {
    const counts = aggregateOverviewCounts(
      [
        { status: "ACTIVE" },
        { status: "DEGRADED" },
        { status: "QUARANTINED" },
        { status: "REVOKED" },
      ],
      [
        { status: "FAILED" },
        { status: "UNKNOWN_OUTCOME", reconciliationStatus: "REQUIRED" },
        { status: "SUCCEEDED", reconciliationStatus: "NONE" },
      ],
    );
    expect(counts.endpoints).toBe(4);
    expect(counts.active).toBe(1);
    expect(counts.degraded).toBe(1);
    expect(counts.quarantined).toBe(2);
    expect(counts.failedExchanges).toBe(1);
    expect(counts.reconciliationRequired).toBe(1);
  });
});
