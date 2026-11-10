/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const getWorkflowInstance = vi.fn();
const listWorkflowHistory = vi.fn();
const listWorkflowSteps = vi.fn();
const listWorkflowAttempts = vi.fn();
const listWorkflowCheckpoints = vi.fn();
const listWorkflowCompensations = vi.fn();
const pauseWorkflow = vi.fn();
const resumeWorkflow = vi.fn();
const cancelWorkflow = vi.fn();
const retryWorkflow = vi.fn();
const reconcileWorkflow = vi.fn();
const startWorkflow = vi.fn();

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
  useParams: () => ({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }),
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
    getWorkflowInstance: (...args: unknown[]) => getWorkflowInstance(...args),
    listWorkflowHistory: (...args: unknown[]) => listWorkflowHistory(...args),
    listWorkflowSteps: (...args: unknown[]) => listWorkflowSteps(...args),
    listWorkflowAttempts: (...args: unknown[]) =>
      listWorkflowAttempts(...args),
    listWorkflowCheckpoints: (...args: unknown[]) =>
      listWorkflowCheckpoints(...args),
    listWorkflowCompensations: (...args: unknown[]) =>
      listWorkflowCompensations(...args),
    pauseWorkflow: (...args: unknown[]) => pauseWorkflow(...args),
    resumeWorkflow: (...args: unknown[]) => resumeWorkflow(...args),
    cancelWorkflow: (...args: unknown[]) => cancelWorkflow(...args),
    retryWorkflow: (...args: unknown[]) => retryWorkflow(...args),
    reconcileWorkflow: (...args: unknown[]) => reconcileWorkflow(...args),
    startWorkflow: (...args: unknown[]) => startWorkflow(...args),
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

import WorkflowInstanceDetailPage from "./page";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <WorkflowInstanceDetailPage />
    </QueryClientProvider>,
  );
}

const ALL_PERMS = [
  "platform:workflow:read",
  "platform:workflow:manage",
  "platform:workflow:pause",
  "platform:workflow:resume",
  "platform:workflow:cancel",
  "platform:workflow:retry",
  "platform:workflow:reconcile",
];

describe("WorkflowInstanceDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];

    getWorkflowInstance.mockResolvedValue({
      data: {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        definitionId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        definitionVersion: 2,
        definitionSnapshot: {
          steps: [
            { key: "checkpoint", type: "HANDLER", handlerKey: "noop:checkpoint" },
            {
              key: "approve",
              type: "HANDLER",
              handlerKey: "noop:approve",
              dependsOn: ["checkpoint"],
            },
          ],
        },
        workflowType: "provisioning.demo",
        businessReference: null,
        provisioningRequestId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
        placementDecisionId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        authorizationId: "auth-1",
        authorizationVersion: 1,
        correlationId: "corr-1",
        causationId: "cause-1",
        idempotencyKey: "idem-1",
        inputSnapshot: { apiToken: "leak", region: "eu" },
        state: "RUNNING",
        currentStepKey: "checkpoint",
        startedAt: "2026-01-02T00:00:00.000Z",
        completedAt: null,
        deadlineAt: null,
        cancellationReason: null,
        failureDetails: { secretToken: "nope" },
        initiatingActor: "admin",
        executionContext: {},
        version: 3,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    });
    listWorkflowHistory.mockResolvedValue({
      data: {
        items: [
          {
            id: "h1",
            resourceType: "WORKFLOW_INSTANCE",
            resourceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            workflowId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            fromStatus: "READY",
            toStatus: "RUNNING",
            action: "START",
            reason: null,
            actorId: "admin",
            details: {},
            createdAt: "2026-01-02T00:00:00.000Z",
          },
        ],
        total: 1,
      },
    });
    listWorkflowSteps.mockResolvedValue({
      data: [
        {
          id: "step-1",
          workflowId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          stepKey: "checkpoint",
          stepType: "HANDLER",
          handlerKey: "noop:checkpoint",
          dependsOn: [],
          inputSnapshot: {},
          outputSnapshot: {},
          status: "RUNNING",
          attemptCount: 1,
          maxAttempts: 3,
          idempotencyKey: "s1",
          ownerWorkerId: "worker-1",
          leaseExpiresAt: "2099-01-01T00:00:00.000Z",
          fencingToken: 1,
          startedAt: "2026-01-02T00:00:00.000Z",
          finishedAt: null,
          timeoutAt: null,
          errorClass: null,
          nextRetryAt: null,
          compensationHandlerKey: null,
          executionOrder: 0,
          version: 1,
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });
    listWorkflowAttempts.mockResolvedValue({
      data: [
        {
          id: "att-1",
          stepId: "step-1",
          attemptNumber: 1,
          workerId: "worker-1",
          fencingToken: 1,
          startedAt: "2026-01-02T00:00:00.000Z",
          endedAt: null,
          result: null,
          errorClass: null,
          retryClassification: null,
          durationMs: null,
          correlationId: "corr-1",
          diagnostics: {},
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });
    listWorkflowCheckpoints.mockResolvedValue({
      data: [
        {
          id: "cp-1",
          workflowId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          stepId: "step-1",
          sequence: 1,
          definitionVersion: 2,
          stateSnapshot: {},
          outputRef: null,
          integrityHash: "hash-abc",
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });
    listWorkflowCompensations.mockResolvedValue({ data: [] });
    pauseWorkflow.mockResolvedValue({
      data: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", state: "PAUSED" },
    });
    cancelWorkflow.mockResolvedValue({
      data: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", state: "CANCELLED" },
    });
    retryWorkflow.mockResolvedValue({ data: {} });
    reconcileWorkflow.mockResolvedValue({ data: {} });
    resumeWorkflow.mockResolvedValue({ data: {} });
    startWorkflow.mockResolvedValue({ data: {} });
  });

  it("forbids without read permission", () => {
    platformState.permissions = [];
    renderPage();
    expect(
      screen.getByText(/requires platform:workflow:read/i),
    ).toBeTruthy();
  });

  it("loads instance detail with timeline, steps and P7 refs", async () => {
    renderPage();
    expect(await screen.findByText("Workflow instance")).toBeTruthy();
    expect(screen.getAllByText("RUNNING").length).toBeGreaterThan(0);
    expect(screen.getByText(/pppppppp-pppp-4ppp-8ppp-pppppppppppp/)).toBeTruthy();
    expect(screen.getByText(/cccccccc-cccc-4ccc-8ccc-cccccccccccc/)).toBeTruthy();
    expect(screen.getByText("Execution timeline")).toBeTruthy();
    expect(screen.getByText("START")).toBeTruthy();
    expect(screen.getAllByText("checkpoint").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Dependency graph")).toBeTruthy();
  });

  it("redacts secrets in diagnostics", async () => {
    renderPage();
    await screen.findByText("Workflow instance");
    expect(
      screen.getAllByText(/•••••••• \(ref present\)/).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("leak")).toBeNull();
    expect(screen.queryByText("nope")).toBeNull();
  });

  it("gates pause/cancel by permission and calls APIs", async () => {
    renderPage();
    await screen.findByText("Workflow instance");
    fireEvent.change(screen.getByLabelText("Action reason"), {
      target: { value: "ops intervention" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    await waitFor(() => {
      expect(pauseWorkflow).toHaveBeenCalledWith(
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        { reason: "ops intervention" },
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(cancelWorkflow).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(retryWorkflow).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Reconcile" }));
    await waitFor(() => expect(reconcileWorkflow).toHaveBeenCalled());
  });

  it("hides pause without permission", async () => {
    platformState.permissions = ["platform:workflow:read"];
    renderPage();
    await screen.findByText("Workflow instance");
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("shows empty checkpoints/compensation and handles load error", async () => {
    listWorkflowCheckpoints.mockResolvedValue({ data: [] });
    listWorkflowCompensations.mockResolvedValue({ data: [] });
    renderPage();
    expect(await screen.findByText("No checkpoints")).toBeTruthy();
    expect(screen.getByText("No compensation records")).toBeTruthy();
  });

  it("shows error state when instance fetch fails", async () => {
    getWorkflowInstance.mockRejectedValue(new Error("not found"));
    renderPage();
    expect(await screen.findByText("not found")).toBeTruthy();
  });
});
