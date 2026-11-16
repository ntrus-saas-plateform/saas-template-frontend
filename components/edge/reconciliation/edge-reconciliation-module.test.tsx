/** @vitest-environment jsdom */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const listReconciliationRuns = vi.fn();
const getReconciliationRun = vi.fn();
const createReconciliationRun = vi.fn();
const observeReconciliationRun = vi.fn();
const remediateReconciliationRun = vi.fn();
const decideReconciliationRemediation = vi.fn();
const listReconciliationPolicies = vi.fn();
const createReconciliationPolicy = vi.fn();
const quarantineReconciliationFinding = vi.fn();
const listReconciliationEvidence = vi.fn();
const listReconciliationWaivers = vi.fn();

vi.mock("@/lib/api/edge", () => ({
  EdgeApiError: class EdgeApiError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  edgeApi: {
    listReconciliationRuns: (...args: unknown[]) => listReconciliationRuns(...args),
    getReconciliationRun: (...args: unknown[]) => getReconciliationRun(...args),
    createReconciliationRun: (...args: unknown[]) => createReconciliationRun(...args),
    observeReconciliationRun: (...args: unknown[]) => observeReconciliationRun(...args),
    remediateReconciliationRun: (...args: unknown[]) =>
      remediateReconciliationRun(...args),
    decideReconciliationRemediation: (...args: unknown[]) =>
      decideReconciliationRemediation(...args),
    listReconciliationPolicies: (...args: unknown[]) =>
      listReconciliationPolicies(...args),
    createReconciliationPolicy: (...args: unknown[]) =>
      createReconciliationPolicy(...args),
    quarantineReconciliationFinding: (...args: unknown[]) =>
      quarantineReconciliationFinding(...args),
    listReconciliationEvidence: (...args: unknown[]) =>
      listReconciliationEvidence(...args),
    listReconciliationWaivers: (...args: unknown[]) =>
      listReconciliationWaivers(...args),
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

import { EdgeReconciliationModule } from "./edge-reconciliation-module";

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

const ALL_PERMS = [
  "platform:reconciliation:read",
  "platform:reconciliation:run",
  "platform:reconciliation:remediate",
  "platform:reconciliation:approve",
  "platform:reconciliation:quarantine",
  "platform:reconciliation:history:read",
];

const RUN = {
  id: "recon-1",
  tenantId: "tenant-1",
  productId: "product-1",
  providerCode: null,
  policyId: null,
  triggerKind: "MANUAL",
  runStatus: "PARTIAL",
  provisioningRequestId: null,
  authorizationRowId: null,
  authorizationVersion: null,
  workflowId: null,
  desiredSnapshot: {},
  observedSnapshot: { providerUnreachable: true },
  summary: {},
  driftCount: 1,
  startedAt: "2026-11-01T00:00:00.000Z",
  finishedAt: null,
  performedBy: "tester",
  correlationId: null,
  metadata: { providerUnreachable: true },
  createdAt: "2026-11-01T00:00:00.000Z",
};

function renderModule() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <EdgeReconciliationModule />
    </QueryClientProvider>,
  );
}

describe("EdgeReconciliationModule (P7.13 console)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];
    listReconciliationRuns.mockResolvedValue({
      data: { items: [RUN], total: 1 },
    });
    getReconciliationRun.mockResolvedValue({
      data: {
        run: RUN,
        findings: [
          {
            id: "f1",
            runId: "recon-1",
            tenantId: "tenant-1",
            productId: "product-1",
            findingCode: "UNKNOWN:DB:db-1",
            resourceType: "DB",
            resourceRef: "db-1",
            severity: "HIGH",
            findingStatus: "OPEN",
            observationClass: "UNKNOWN",
            desiredState: {},
            observedState: { providerUnreachable: true },
            lastKnownState: {},
            autoRemediateEligible: false,
            message: "Provider unreachable — UNKNOWN",
            details: { neverTreatAsDeleted: true },
            createdAt: "2026-11-01T00:00:00.000Z",
            updatedAt: "2026-11-01T00:00:00.000Z",
          },
        ],
        remediations: [
          {
            id: "rm1",
            findingId: "f1",
            runId: "recon-1",
            tenantId: "tenant-1",
            remediationStatus: "WAITING_APPROVAL",
            plan: { action: "QUARANTINE_OR_REOBSERVE" },
            workflowId: null,
            reversible: true,
            approvedBy: null,
            approvedAt: null,
            executedAt: null,
            evidence: {},
            errorCode: "UNKNOWN_STATE",
            errorMessage: "requires human",
            createdBy: "tester",
            createdAt: "2026-11-01T00:00:00.000Z",
            updatedAt: "2026-11-01T00:00:00.000Z",
          },
        ],
        evidence: [],
      },
    });
    listReconciliationPolicies.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listReconciliationEvidence.mockResolvedValue({ data: [] });
    listReconciliationWaivers.mockResolvedValue({ data: [] });
  });

  it("shows the forbidden state without platform:reconciliation:read", async () => {
    platformState.permissions = [];
    renderModule();
    expect(await screen.findByText("Access restricted")).toBeTruthy();
  });

  it("renders reconciliation module when permitted without inventing REMEDIATED", async () => {
    renderModule();
    expect(await screen.findByTestId("recon-module")).toBeTruthy();
    expect(
      await screen.findByLabelText("Choisir un run de réconciliation"),
    ).toBeTruthy();
    expect(listReconciliationRuns).toHaveBeenCalled();
    expect(screen.queryByTestId("recon-run-status")).toBeNull();
    expect(screen.queryByText("REMEDIATED")).toBeNull();
  });

  it("shows run detail with UNKNOWN finding and never treats as deleted", async () => {
    renderModule();
    fireEvent.click(
      await screen.findByLabelText("Choisir un run de réconciliation"),
    );
    const option = await screen.findByRole("option", {
      name: /recon-1|PARTIAL/,
    });
    fireEvent.click(option);

    expect(await screen.findByTestId("recon-run-detail")).toBeTruthy();
    const status = screen.getByTestId("recon-run-status").textContent?.trim();
    expect(status).toBe("PARTIAL");
    expect(status).not.toBe("REMEDIATED");
    expect(screen.getByText("UNKNOWN")).toBeTruthy();
    expect(screen.getByTestId("recon-observe")).toBeTruthy();
    expect(screen.getByTestId("recon-remediate")).toBeTruthy();
    expect(getReconciliationRun).toHaveBeenCalledWith("recon-1");
    expect(
      screen.getByText(/jamais traité comme deleted/i),
    ).toBeTruthy();
  });
});
