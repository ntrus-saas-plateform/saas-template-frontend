/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  WorkflowCountCard,
  WorkflowDependencyGraph,
  WorkflowFilters,
  WorkflowForbidden,
  WorkflowLoading,
  WorkflowPagination,
  WorkflowStatusBadge,
} from "./shared";
import {
  aggregateDashboardCounts,
  isPublishedImmutable,
  redactSecretRef,
  redactWorkflowMetadata,
} from "@/lib/edge/workflow";

describe("workflow shared UI", () => {
  it("paginates with previous/next and disables at bounds", () => {
    const onOffsetChange = vi.fn();
    const { rerender } = render(
      <WorkflowPagination
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
      <WorkflowPagination
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
      <WorkflowFilters
        q=""
        status=""
        statusOptions={["RUNNING", "FAILED", "WAITING_APPROVAL"]}
        onQChange={onQChange}
        onStatusChange={onStatusChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Search workflows"), {
      target: { value: "wf" },
    });
    expect(onQChange).toHaveBeenCalledWith("wf");
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "FAILED" },
    });
    expect(onStatusChange).toHaveBeenCalledWith("FAILED");
  });

  it("shows status badges, count cards and dependency graph", () => {
    const { rerender } = render(<WorkflowStatusBadge status="RUNNING" />);
    expect(screen.getByText("RUNNING")).toBeTruthy();
    rerender(<WorkflowStatusBadge status="WAITING_APPROVAL" />);
    expect(screen.getByText("WAITING_APPROVAL")).toBeTruthy();
    rerender(<WorkflowStatusBadge status="FAILED" />);
    expect(screen.getByText("FAILED")).toBeTruthy();

    rerender(<WorkflowCountCard label="Active" count={3} />);
    expect(screen.getByLabelText("Active: 3")).toBeTruthy();

    rerender(
      <WorkflowDependencyGraph
        steps={[
          { key: "a", type: "HANDLER", handlerKey: "noop:checkpoint" },
          {
            key: "b",
            type: "HANDLER",
            handlerKey: "noop:approve",
            dependsOn: ["a"],
          },
        ]}
      />,
    );
    expect(screen.getByLabelText("Dependency graph")).toBeTruthy();
    expect(screen.getByText("a")).toBeTruthy();
    expect(screen.getByText(/← a/)).toBeTruthy();
  });

  it("renders loading and forbidden states", () => {
    const { rerender } = render(
      <WorkflowLoading label="Loading workflows…" />,
    );
    expect(screen.getByLabelText("Loading workflows…")).toBeTruthy();
    rerender(
      <WorkflowForbidden description="Missing platform:workflow:read" />,
    );
    expect(screen.getByText(/Missing platform:workflow:read/)).toBeTruthy();
  });

  it("redacts secrets and marks published definitions immutable", () => {
    expect(redactSecretRef("vault://secret/x")).toBe("•••••••• (ref present)");
    const redacted = redactWorkflowMetadata({
      region: "eu-west",
      apiToken: "super-secret",
      note: "vault://secret/x",
    });
    expect(redacted.region).toBe("eu-west");
    expect(redacted.apiToken).toBe("•••••••• (ref present)");
    expect(JSON.stringify(redacted)).not.toContain("super-secret");
    expect(isPublishedImmutable("PUBLISHED")).toBe(true);
    expect(isPublishedImmutable("DRAFT")).toBe(false);
  });

  it("aggregates dashboard counts without inventing executions", () => {
    const counts = aggregateDashboardCounts(
      [
        { state: "RUNNING" },
        { state: "WAITING_APPROVAL" },
        { state: "RETRY_PENDING" },
        { state: "FAILED" },
        { state: "COMPENSATING" },
        { state: "TIMED_OUT" },
        { state: "REQUIRES_INTERVENTION" },
      ],
      2,
    );
    expect(counts.running).toBe(1);
    expect(counts.waitingApproval).toBe(1);
    expect(counts.retryPending).toBe(1);
    expect(counts.failed).toBe(1);
    expect(counts.compensating).toBe(1);
    expect(counts.timedOut).toBe(1);
    expect(counts.deadLetter).toBe(3);
    expect(counts.active).toBeGreaterThan(0);
  });
});
