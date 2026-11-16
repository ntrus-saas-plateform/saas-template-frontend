import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EdgeOperationsModule } from "./edge-operations-module";

vi.mock("@/providers/edge-session-provider", () => ({
  useEdgeSession: () => ({
    permissions: [
      "platform:service_catalog:read",
      "platform:service_catalog:manage",
      "platform:operations:overview:read",
    ],
  }),
}));

vi.mock("@/lib/api/edge", () => ({
  edgeApi: {
    getOperationsOverview: vi.fn().mockResolvedValue({
      data: {
        availability: "PARTIAL",
        note: "catalog only",
        catalog: { totalServices: 0, observation: "CONFIGURED_REGISTRY_ONLY" },
        activeIncidents: { availability: "UNAVAILABLE", integration: "P9_INCIDENT" },
        activeAlerts: { availability: "UNAVAILABLE", integration: "P9_ALERT" },
        computedAt: new Date().toISOString(),
      },
    }),
    listPlatformServices: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    registerPlatformService: vi.fn(),
  },
}));

describe("EdgeOperationsModule", () => {
  it("renders operations overview and empty catalog", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <EdgeOperationsModule />
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId("edge-operations-module")).toBeInTheDocument();
    expect(await screen.findByText(/Operations overview/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/No platform services registered/i),
    ).toBeInTheDocument();
  });
});
