/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  RegistryFilters,
  RegistryPagination,
  RegistryStatusBadge,
  RegistryTransitionForm,
} from "./shared";
import { redactSecureConfigRef } from "@/lib/edge/registry";

describe("registry shared UI", () => {
  it("paginates with previous/next and disables at bounds", () => {
    const onOffsetChange = vi.fn();
    const { rerender } = render(
      <RegistryPagination
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
      <RegistryPagination
        offset={40}
        limit={20}
        total={45}
        onOffsetChange={onOffsetChange}
      />,
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onOffsetChange).toHaveBeenCalledWith(20);
  });

  it("renders search and status filters", () => {
    const onQChange = vi.fn();
    const onStatusChange = vi.fn();
    render(
      <RegistryFilters
        q=""
        status=""
        statusOptions={["DRAFT", "CERTIFIED", "DEPRECATED"]}
        onQChange={onQChange}
        onStatusChange={onStatusChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Search registry"), {
      target: { value: "crm" },
    });
    expect(onQChange).toHaveBeenCalledWith("crm");
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "DEPRECATED" },
    });
    expect(onStatusChange).toHaveBeenCalledWith("DEPRECATED");
  });

  it("shows compatibility result badges", () => {
    const { rerender } = render(<RegistryStatusBadge status="COMPATIBLE" />);
    expect(screen.getByText("COMPATIBLE")).toBeTruthy();
    rerender(<RegistryStatusBadge status="INCOMPATIBLE" />);
    expect(screen.getByText("INCOMPATIBLE")).toBeTruthy();
    rerender(<RegistryStatusBadge status="REQUIRES_REVIEW" />);
    expect(screen.getByText("REQUIRES_REVIEW")).toBeTruthy();
  });

  it("supports certification and deprecation transitions with reason gating", () => {
    const onSubmit = vi.fn();
    render(
      <RegistryTransitionForm
        kind="product"
        currentStatus="CERTIFIED"
        toStatus="DEPRECATED"
        reason=""
        onToStatusChange={vi.fn()}
        onReasonChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByLabelText("Target status")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Apply transition" }),
    ).toBeDisabled();
    expect(screen.getByPlaceholderText("Reason (required)")).toBeTruthy();
  });

  it("never exposes raw secureConfigRef values via redaction helper", () => {
    expect(redactSecureConfigRef("vault://secret/prod-db-password")).toBe(
      "•••••••• (ref present)",
    );
    expect(redactSecureConfigRef("token=super-secret")).toBe(
      "•••••••• (ref present)",
    );
  });
});
