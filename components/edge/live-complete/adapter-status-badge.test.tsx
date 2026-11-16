/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AdapterStatusBadge,
  LiveCompleteAdapterStatusBadge,
} from "./adapter-status-badge";

const getLiveCompleteLabStatus = vi.fn();

vi.mock("@/lib/api/edge", () => ({
  edgeApi: {
    getLiveCompleteLabStatus: (...args: unknown[]) =>
      getLiveCompleteLabStatus(...args),
  },
}));

function wrap(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe("AdapterStatusBadge", () => {
  it("renders LIVE / PARTIAL / UNAVAILABLE labels", () => {
    const { rerender } = render(<AdapterStatusBadge status="LIVE" />);
    expect(screen.getByText("LIVE")).toBeTruthy();

    rerender(<AdapterStatusBadge status="PARTIAL" />);
    expect(screen.getByText("PARTIAL")).toBeTruthy();

    rerender(<AdapterStatusBadge status="UNAVAILABLE" label="Offline" />);
    expect(screen.getByText("Offline")).toBeTruthy();
  });

  it("exposes setup tip for UNAVAILABLE", () => {
    render(<AdapterStatusBadge status="UNAVAILABLE" />);
    const tip = screen.getByTitle(/BILLING_PAYMENT_ADAPTER=sandbox/i);
    expect(tip).toBeTruthy();
  });
});

describe("LiveCompleteAdapterStatusBadge", () => {
  it("shows LIVE when API returns LIVE", async () => {
    getLiveCompleteLabStatus.mockResolvedValueOnce({
      paymentAdapter: "sandbox",
      provisioningAdapter: "durable",
      bbControlConfigured: true,
      mode: "LIVE",
      note: "All good",
    });
    wrap(<LiveCompleteAdapterStatusBadge />);
    expect(await screen.findByText("LIVE")).toBeTruthy();
    expect(screen.getByTitle("All good")).toBeTruthy();
  });

  it("falls back to UNAVAILABLE on API error", async () => {
    getLiveCompleteLabStatus.mockRejectedValueOnce(new Error("down"));
    wrap(<LiveCompleteAdapterStatusBadge />);
    expect(await screen.findByText("UNAVAILABLE")).toBeTruthy();
    expect(
      screen.getByTitle(/BILLING_PAYMENT_ADAPTER=sandbox/i),
    ).toBeTruthy();
  });
});
