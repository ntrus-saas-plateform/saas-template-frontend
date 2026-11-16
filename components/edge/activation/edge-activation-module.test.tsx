/** @vitest-environment jsdom */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const listActivationEvaluations = vi.fn();
const getActivationEvaluation = vi.fn();
const createActivationEvaluation = vi.fn();
const evaluateActivationEvaluation = vi.fn();
const listActivationRecords = vi.fn();
const getActivationRecord = vi.fn();
const createActivationRecord = vi.fn();
const evaluateActivationRecord = vi.fn();
const activateActivationRecord = vi.fn();
const listActivationRuns = vi.fn();
const listActivationEvidence = vi.fn();

vi.mock("@/lib/api/edge", () => ({
  EdgeApiError: class EdgeApiError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  edgeApi: {
    listActivationEvaluations: (...args: unknown[]) =>
      listActivationEvaluations(...args),
    getActivationEvaluation: (...args: unknown[]) =>
      getActivationEvaluation(...args),
    createActivationEvaluation: (...args: unknown[]) =>
      createActivationEvaluation(...args),
    evaluateActivationEvaluation: (...args: unknown[]) =>
      evaluateActivationEvaluation(...args),
    listActivationRecords: (...args: unknown[]) =>
      listActivationRecords(...args),
    getActivationRecord: (...args: unknown[]) => getActivationRecord(...args),
    createActivationRecord: (...args: unknown[]) =>
      createActivationRecord(...args),
    evaluateActivationRecord: (...args: unknown[]) =>
      evaluateActivationRecord(...args),
    activateActivationRecord: (...args: unknown[]) =>
      activateActivationRecord(...args),
    listActivationRuns: (...args: unknown[]) => listActivationRuns(...args),
    listActivationEvidence: (...args: unknown[]) =>
      listActivationEvidence(...args),
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

import { EdgeActivationModule } from "./edge-activation-module";

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

const ALL_PERMS = [
  "platform:activation:read",
  "platform:activation:evaluate",
  "platform:activation:activate",
  "platform:activation:history:read",
];

const EVALUATION = {
  id: "eval-1",
  tenantId: "tenant-1",
  productId: "product-1",
  subscriptionId: null,
  accountId: null,
  provisioningRequestId: "prov-1",
  authorizationRowId: "auth-1",
  authorizationVersion: 1,
  evaluationStatus: "PENDING",
  workflowId: null,
  overallScore: null,
  blockingCodes: [],
  summary: {},
  evaluatedAt: null,
  expiresAt: null,
  metadata: {},
  createdBy: "tester",
  updatedBy: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  version: 1,
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
      <EdgeActivationModule />
    </QueryClientProvider>,
  );
}

describe("EdgeActivationModule (P7.10 console)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];
    listActivationEvaluations.mockResolvedValue({
      data: { items: [EVALUATION], total: 1 },
    });
    getActivationEvaluation.mockResolvedValue({
      data: {
        evaluation: EVALUATION,
        checks: [
          {
            id: "chk-1",
            evaluationId: "eval-1",
            tenantId: "tenant-1",
            checkCode: "auth.p71_revalidated",
            checkPhase: "P71_AUTH",
            checkStatus: "PENDING",
            required: true,
            message: null,
            evidenceRef: null,
            details: {},
            checkedAt: null,
            createdAt: "2026-11-01T00:00:00.000Z",
          },
        ],
        evidence: [],
      },
    });
    listActivationRecords.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    getActivationRecord.mockResolvedValue({ data: null });
    listActivationRuns.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listActivationEvidence.mockResolvedValue({
      data: { items: [], total: 0 },
    });
  });

  it("shows the forbidden state without platform:activation:read", async () => {
    platformState.permissions = [];
    renderModule();
    expect(await screen.findByText("Access restricted")).toBeTruthy();
  });

  it("renders evaluations module when permitted without inventing ACTIVE", async () => {
    renderModule();
    expect(await screen.findByTestId("act-module")).toBeTruthy();
    expect(
      await screen.findByLabelText("Choisir une évaluation"),
    ).toBeTruthy();
    expect(listActivationEvaluations).toHaveBeenCalled();
    expect(screen.queryByTestId("act-eval-status")).toBeNull();
    expect(screen.queryByText("ACTIVE")).toBeNull();
  });

  it("shows evaluation detail with check badges from API status only", async () => {
    renderModule();
    fireEvent.click(await screen.findByLabelText("Choisir une évaluation"));
    const option = await screen.findByRole("option", {
      name: /tenant-1 — PENDING/,
    });
    fireEvent.click(option);

    expect(await screen.findByTestId("act-eval-detail")).toBeTruthy();
    const status = screen.getByTestId("act-eval-status").textContent?.trim();
    expect(status).toBe("PENDING");
    expect(status).not.toBe("ACTIVE");
    expect(screen.getByTestId("act-checks")).toBeTruthy();
    expect(screen.getByTestId("act-check-auth.p71_revalidated")).toBeTruthy();
    expect(getActivationEvaluation).toHaveBeenCalledWith("eval-1");
  });
});

