/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const getProductControlExchange = vi.fn();
const reconcileProductControlExchange = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/edge", () => ({
  EdgeApiError: class EdgeApiError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  edgeApi: {
    getProductControlExchange: (...args: unknown[]) =>
      getProductControlExchange(...args),
    reconcileProductControlExchange: (...args: unknown[]) =>
      reconcileProductControlExchange(...args),
  },
}));

const platformState = vi.hoisted(() => ({
  permissions: [] as string[],
  isLoading: false,
}));

vi.mock("@/providers/edge-platform-provider", () => ({
  useEdgePlatform: () => ({
    permissions: platformState.permissions,
    isLoading: platformState.isLoading,
    me: null,
    workspaces: [],
    activeWorkspace: null,
    activeVerticalId: null,
    isError: false,
    error: null,
    refetch: async () => undefined,
    switchWorkspace: async () => undefined,
  }),
}));

import ProductControlExchangeDetailPage from "./page";

const EXCHANGE = {
  id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  productId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
  endpointId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  workflowId: null,
  stepId: null,
  operationCode: "tenant.provision",
  contractVersion: "1.0.0",
  requestId: "req-1",
  correlationId: "corr-1",
  causationId: null,
  idempotencyKey: "idem-1",
  requestDigest: "sha256:req",
  responseDigest: "sha256:resp",
  requestTimestamp: "2026-01-02T00:00:00.000Z",
  responseTimestamp: "2026-01-02T00:00:01.000Z",
  status: "SUCCEEDED",
  attemptCount: 1,
  httpStatus: 200,
  errorClassification: null,
  durationMs: 120,
  retryEligible: false,
  reconciliationStatus: "NONE",
  requestPayload: { operation: "provision", secret: "should-not-leak" },
  responsePayload: { ok: true, region: "eu" },
  diagnostics: { note: "lab" },
  version: 1,
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:01.000Z",
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <ProductControlExchangeDetailPage />
    </QueryClientProvider>,
  );
}

describe("ProductControlExchangeDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = ["platform:product_control:read"];
    getProductControlExchange.mockResolvedValue({ data: EXCHANGE });
    reconcileProductControlExchange.mockResolvedValue({ data: EXCHANGE });
  });

  it("forbids without read permission", async () => {
    platformState.permissions = [];
    renderPage();
    expect(
      await screen.findByText(/platform:product_control:read/),
    ).toBeTruthy();
  });

  it("renders studio shell with overview and payload sections", async () => {
    renderPage();
    expect(await screen.findByTestId("edge-exchange-detail-studio")).toBeTruthy();
    expect(await screen.findByText("tenant.provision")).toBeTruthy();
    expect(screen.getByText("SUCCEEDED")).toBeTruthy();
    expect(screen.queryByText("should-not-leak")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Payloads" }));
    expect(await screen.findByText(/"region": "eu"/)).toBeTruthy();
    expect(screen.queryByText("should-not-leak")).toBeNull();
  });

  it("reconciles an unknown-outcome exchange when permitted", async () => {
    platformState.permissions = [
      "platform:product_control:read",
      "platform:product_control:reconcile",
    ];
    getProductControlExchange.mockResolvedValue({
      data: {
        ...EXCHANGE,
        status: "UNKNOWN_OUTCOME",
        reconciliationStatus: "REQUIRED",
      },
    });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Reconcile" }));
    await waitFor(() => {
      expect(reconcileProductControlExchange).toHaveBeenCalledWith(
        "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      );
    });
  });
});
