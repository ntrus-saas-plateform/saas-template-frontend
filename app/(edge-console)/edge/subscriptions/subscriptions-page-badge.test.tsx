/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const getLiveCompleteLabStatus = vi.fn();
const getSubscriptionOverview = vi.fn();

vi.mock("@/lib/api/edge", () => ({
  EdgeApiError: class EdgeApiError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  edgeApi: {
    getLiveCompleteLabStatus: (...args: unknown[]) =>
      getLiveCompleteLabStatus(...args),
    getSubscriptionOverview: (...args: unknown[]) =>
      getSubscriptionOverview(...args),
    getSubscriptionPolicies: vi.fn(),
    getSubscriptionAnalytics: vi.fn(),
    listSubscriptions: vi.fn().mockResolvedValue({ items: [] }),
    listSubscriptionTrials: vi.fn().mockResolvedValue([]),
    listSubscriptionChanges: vi.fn().mockResolvedValue([]),
    listSubscriptionRenewals: vi.fn().mockResolvedValue([]),
    listSubscriptionEntitlements: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/providers/edge-platform-provider", () => ({
  useEdgePlatform: () => ({
    permissions: [
      "platform:subscriptions:read",
      "platform:subscriptions:read_analytics",
    ],
    isLoading: false,
    me: null,
    workspaces: [],
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import EdgeSubscriptionsPage from "./page";

describe("subscriptions page adapter badge smoke", () => {
  beforeEach(() => {
    getLiveCompleteLabStatus.mockReset();
    getSubscriptionOverview.mockResolvedValue({ total: 0, active: 0 });
  });

  it("renders LIVE badge from lab status API", async () => {
    getLiveCompleteLabStatus.mockResolvedValue({
      paymentAdapter: "sandbox",
      provisioningAdapter: "durable",
      bbControlConfigured: true,
      mode: "LIVE",
      note: "ready",
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <EdgeSubscriptionsPage />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Okapi Edge Subscriptions")).toBeTruthy();
    expect(await screen.findByText("LIVE")).toBeTruthy();
  });
});
