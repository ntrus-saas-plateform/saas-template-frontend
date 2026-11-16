/** @vitest-environment jsdom */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const listLifecycleRecords = vi.fn();
const getLifecycleRecord = vi.fn();
const createLifecycleRecord = vi.fn();
const suspendLifecycleRecord = vi.fn();
const resumeLifecycleRecord = vi.fn();
const deprovisionLifecycleRecord = vi.fn();
const listLifecycleRuns = vi.fn();
const listLifecycleEvidence = vi.fn();

vi.mock("@/lib/api/edge", () => ({
  EdgeApiError: class EdgeApiError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  edgeApi: {
    listLifecycleRecords: (...args: unknown[]) => listLifecycleRecords(...args),
    getLifecycleRecord: (...args: unknown[]) => getLifecycleRecord(...args),
    createLifecycleRecord: (...args: unknown[]) => createLifecycleRecord(...args),
    suspendLifecycleRecord: (...args: unknown[]) =>
      suspendLifecycleRecord(...args),
    resumeLifecycleRecord: (...args: unknown[]) => resumeLifecycleRecord(...args),
    deprovisionLifecycleRecord: (...args: unknown[]) =>
      deprovisionLifecycleRecord(...args),
    listLifecycleRuns: (...args: unknown[]) => listLifecycleRuns(...args),
    listLifecycleEvidence: (...args: unknown[]) =>
      listLifecycleEvidence(...args),
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

import { EdgeLifecycleModule } from "./edge-lifecycle-module";

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

const ALL_PERMS = [
  "platform:lifecycle:read",
  "platform:lifecycle:suspend",
  "platform:lifecycle:resume",
  "platform:lifecycle:deprovision",
  "platform:lifecycle:history:read",
];

const RECORD = {
  id: "lc-1",
  tenantId: "tenant-1",
  productId: "product-1",
  subscriptionId: null,
  accountId: null,
  provisioningRequestId: "prov-1",
  authorizationRowId: "auth-1",
  authorizationVersion: 1,
  activationRecordId: "act-1",
  lifecycleStatus: "ACTIVE",
  workflowId: null,
  deletionProtection: true,
  retentionPolicyRef: null,
  exportEvidenceRef: null,
  lastSuspendedAt: null,
  lastResumedAt: null,
  deprovisionedAt: null,
  failureCode: null,
  failureMessage: null,
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
      <EdgeLifecycleModule />
    </QueryClientProvider>,
  );
}

describe("EdgeLifecycleModule (P7.11 console)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];
    listLifecycleRecords.mockResolvedValue({
      data: { items: [RECORD], total: 1 },
    });
    getLifecycleRecord.mockResolvedValue({
      data: { record: RECORD, runs: [], evidence: [] },
    });
    listLifecycleRuns.mockResolvedValue({ data: { items: [], total: 0 } });
    listLifecycleEvidence.mockResolvedValue({
      data: { items: [], total: 0 },
    });
  });

  it("shows the forbidden state without platform:lifecycle:read", async () => {
    platformState.permissions = [];
    renderModule();
    expect(await screen.findByText("Access restricted")).toBeTruthy();
  });

  it("renders lifecycle module when permitted without inventing SUSPENDED", async () => {
    renderModule();
    expect(await screen.findByTestId("lc-module")).toBeTruthy();
    expect(
      await screen.findByLabelText("Choisir un record lifecycle"),
    ).toBeTruthy();
    expect(listLifecycleRecords).toHaveBeenCalled();
    expect(screen.queryByTestId("lc-record-status")).toBeNull();
    expect(screen.queryByText("SUSPENDED")).toBeNull();
  });

  it("shows record detail with API status only and suspend control", async () => {
    renderModule();
    fireEvent.click(await screen.findByLabelText("Choisir un record lifecycle"));
    const option = await screen.findByRole("option", {
      name: /tenant-1 — ACTIVE/,
    });
    fireEvent.click(option);

    expect(await screen.findByTestId("lc-record-detail")).toBeTruthy();
    const status = screen.getByTestId("lc-record-status").textContent?.trim();
    expect(status).toBe("ACTIVE");
    expect(status).not.toBe("SUSPENDED");
    expect(screen.getByTestId("lc-suspend")).toBeTruthy();
    expect(getLifecycleRecord).toHaveBeenCalledWith("lc-1");
  });
});
