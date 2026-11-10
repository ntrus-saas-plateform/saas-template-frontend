/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const getPlacementRequest = vi.fn();
const evaluatePlacementRequest = vi.fn();
const confirmPlacementRequest = vi.fn();
const cancelPlacementRequest = vi.fn();
const listCapacityReservations = vi.fn();
const getPlacementDecision = vi.fn();
const listPlacementDecisionCandidates = vi.fn();

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
  useParams: () => ({ id: "req-1" }),
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
    getPlacementRequest: (...args: unknown[]) => getPlacementRequest(...args),
    evaluatePlacementRequest: (...args: unknown[]) =>
      evaluatePlacementRequest(...args),
    confirmPlacementRequest: (...args: unknown[]) =>
      confirmPlacementRequest(...args),
    cancelPlacementRequest: (...args: unknown[]) =>
      cancelPlacementRequest(...args),
    listCapacityReservations: (...args: unknown[]) =>
      listCapacityReservations(...args),
    getPlacementDecision: (...args: unknown[]) =>
      getPlacementDecision(...args),
    listPlacementDecisionCandidates: (...args: unknown[]) =>
      listPlacementDecisionCandidates(...args),
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

import PlacementRequestDetailPage from "./page";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <PlacementRequestDetailPage />
    </QueryClientProvider>,
  );
}

describe("PlacementRequestDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [
      "platform:placement:read",
      "platform:placement:evaluate",
      "platform:placement:confirm",
      "platform:placement:cancel",
    ];
    getPlacementRequest.mockResolvedValue({
      data: {
        id: "req-1",
        provisioningRequestId: "prov-1",
        authorizationId: "auth-1",
        authorizationVersion: 1,
        accountId: "acc-1",
        subscriptionId: "sub-1",
        productRegistryId: "pr-1",
        technicalVersionId: "ver-1",
        contractId: "ct-1",
        deploymentProfileId: "pf-1",
        platformId: null,
        requestedEnvironmentType: "PRODUCTION",
        requestedDeploymentModel: "SHARED_SAAS",
        requestedRegion: null,
        capacityRequirements: { CPU: 2 },
        requestStatus: "PENDING",
        metadata: { apiToken: "leak-me", region: "eu" },
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });
    listCapacityReservations.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    evaluatePlacementRequest.mockResolvedValue({
      data: {
        decision: {
          id: "dec-1",
          placementRequestId: "req-1",
          decisionStatus: "PLACED",
          policyId: "pol-1",
          policyVersion: 2,
          algorithmName: "default",
          algorithmVersion: "1.0.0",
          selectedPlatformId: "plat-1",
          selectedEnvironmentId: "env-1",
          selectedProfileId: "pf-1",
          selectedContractId: "ct-1",
          selectedContractVersion: "1.0.0",
          capacityReservationId: "res-1",
          rejectionSummary: null,
          scoringBreakdown: { fit: 0.9, secretToken: "nope" },
        },
        candidates: [
          {
            id: "c1",
            platformId: "plat-1",
            environmentId: "env-1",
            rank: 1,
            score: 0.95,
            passedHardConstraints: true,
            excluded: false,
            hardConstraintFailures: [],
            compatibilityResult: "COMPATIBLE",
          },
          {
            id: "c2",
            platformId: "plat-2",
            environmentId: "env-2",
            rank: null,
            score: null,
            passedHardConstraints: false,
            excluded: true,
            hardConstraintFailures: ["CAPACITY_INSUFFICIENT"],
            exclusionReason: "no headroom",
            compatibilityResult: "INCOMPATIBLE",
          },
        ],
      },
    });
    confirmPlacementRequest.mockResolvedValue({ data: { id: "dec-1" } });
    cancelPlacementRequest.mockResolvedValue({
      data: { id: "req-1", requestStatus: "CANCELLED" },
    });
  });

  it("forbids without read permission", () => {
    platformState.permissions = [];
    renderPage();
    expect(screen.getByText(/requires platform:placement:read/i)).toBeTruthy();
  });

  it("loads request and redacts metadata secrets", async () => {
    renderPage();
    expect(await screen.findByText("Registry snapshot refs")).toBeTruthy();
    expect(screen.getByText("productRegistryId")).toBeTruthy();
    expect(document.body.textContent).not.toContain("leak-me");
    expect(document.body.textContent).toMatch(/ref present/);
    expect(document.body.textContent).toMatch(/"region": "eu"/);
  });

  it("displays evaluation candidates eligible and hard failures", async () => {
    renderPage();
    await screen.findByText("Registry snapshot refs");
    fireEvent.click(screen.getByRole("button", { name: "Evaluate" }));
    await waitFor(() => expect(evaluatePlacementRequest).toHaveBeenCalled());
    expect(await screen.findByText("Eligible candidates (1)")).toBeTruthy();
    expect(screen.getByText("Excluded / hard failures (1)")).toBeTruthy();
    expect(screen.getByText("CAPACITY_INSUFFICIENT")).toBeTruthy();
    expect(screen.getByText(/v2/)).toBeTruthy();
    expect(screen.queryByText("nope")).toBeNull();
  });

  it("confirms and cancels from decision panel actions", async () => {
    renderPage();
    await screen.findByText("Registry snapshot refs");
    fireEvent.click(screen.getByRole("button", { name: "Evaluate" }));
    await waitFor(() => expect(evaluatePlacementRequest).toHaveBeenCalled());
    await screen.findByText("Confirm placement");
    fireEvent.click(screen.getByRole("button", { name: "Confirm placement" }));
    await waitFor(() => {
      expect(confirmPlacementRequest).toHaveBeenCalledWith(
        "req-1",
        expect.objectContaining({ decisionId: "dec-1" }),
      );
    });
    fireEvent.change(screen.getByLabelText("Cancel reason"), {
      target: { value: "abort" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(cancelPlacementRequest).toHaveBeenCalledWith(
        "req-1",
        expect.objectContaining({ reason: "abort" }),
      );
    });
  });

  it("surfaces API errors", async () => {
    getPlacementRequest.mockRejectedValueOnce(new Error("detail boom"));
    renderPage();
    expect(await screen.findByText("detail boom")).toBeTruthy();
  });
});
