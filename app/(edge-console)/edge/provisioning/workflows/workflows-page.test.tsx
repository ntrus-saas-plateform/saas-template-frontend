/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const listWorkflowDefinitions = vi.fn();
const createWorkflowDefinition = vi.fn();
const validateWorkflowDefinition = vi.fn();
const publishWorkflowDefinition = vi.fn();
const deprecateWorkflowDefinition = vi.fn();
const listWorkflowInstances = vi.fn();
const listWorkflowHistory = vi.fn();
const listWorkflowTasks = vi.fn();
const assignWorkflowTask = vi.fn();
const approveWorkflowTask = vi.fn();
const rejectWorkflowTask = vi.fn();
const listWorkflowWorkers = vi.fn();
const listWorkflowDeadLetters = vi.fn();
const listWorkflowSteps = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
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
    listWorkflowDefinitions: (...args: unknown[]) =>
      listWorkflowDefinitions(...args),
    getWorkflowDefinition: vi.fn(),
    createWorkflowDefinition: (...args: unknown[]) =>
      createWorkflowDefinition(...args),
    validateWorkflowDefinition: (...args: unknown[]) =>
      validateWorkflowDefinition(...args),
    publishWorkflowDefinition: (...args: unknown[]) =>
      publishWorkflowDefinition(...args),
    deprecateWorkflowDefinition: (...args: unknown[]) =>
      deprecateWorkflowDefinition(...args),
    listWorkflowInstances: (...args: unknown[]) =>
      listWorkflowInstances(...args),
    getWorkflowInstance: vi.fn(),
    createWorkflowInstance: vi.fn(),
    listWorkflowHistory: (...args: unknown[]) =>
      listWorkflowHistory(...args),
    listWorkflowSteps: (...args: unknown[]) => listWorkflowSteps(...args),
    listWorkflowAttempts: vi.fn(),
    listWorkflowCheckpoints: vi.fn(),
    listWorkflowCompensations: vi.fn(),
    startWorkflow: vi.fn(),
    pauseWorkflow: vi.fn(),
    resumeWorkflow: vi.fn(),
    cancelWorkflow: vi.fn(),
    retryWorkflow: vi.fn(),
    reconcileWorkflow: vi.fn(),
    listWorkflowTasks: (...args: unknown[]) => listWorkflowTasks(...args),
    getWorkflowTask: vi.fn(),
    assignWorkflowTask: (...args: unknown[]) => assignWorkflowTask(...args),
    approveWorkflowTask: (...args: unknown[]) => approveWorkflowTask(...args),
    rejectWorkflowTask: (...args: unknown[]) => rejectWorkflowTask(...args),
    listWorkflowWorkers: (...args: unknown[]) => listWorkflowWorkers(...args),
    listWorkflowDeadLetters: (...args: unknown[]) =>
      listWorkflowDeadLetters(...args),
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

import WorkflowOperationsPage from "./page";

const ALL_PERMS = [
  "platform:workflow:read",
  "platform:workflow:manage",
  "platform:workflow:pause",
  "platform:workflow:resume",
  "platform:workflow:cancel",
  "platform:workflow:retry",
  "platform:workflow:reconcile",
  "platform:workflow_definition:read",
  "platform:workflow_definition:manage",
  "platform:workflow_definition:publish",
  "platform:workflow_task:read",
  "platform:workflow_task:assign",
  "platform:workflow_task:approve",
  "platform:workflow_task:reject",
];

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <WorkflowOperationsPage />
    </QueryClientProvider>,
  );
}

describe("WorkflowOperationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];

    listWorkflowInstances.mockResolvedValue({
      data: {
        items: [
          {
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            definitionId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            definitionVersion: 1,
            definitionSnapshot: { steps: [] },
            workflowType: "provisioning.demo",
            state: "RUNNING",
            provisioningRequestId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
            placementDecisionId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
            initiatingActor: "admin",
            updatedAt: "2026-01-02T00:00:00.000Z",
          },
          {
            id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            definitionId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            definitionVersion: 1,
            definitionSnapshot: { steps: [] },
            workflowType: "provisioning.demo",
            state: "WAITING_APPROVAL",
            provisioningRequestId: null,
            placementDecisionId: null,
            initiatingActor: "admin",
            updatedAt: "2026-01-03T00:00:00.000Z",
          },
          {
            id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
            definitionId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            definitionVersion: 1,
            definitionSnapshot: { steps: [] },
            workflowType: "provisioning.demo",
            state: "FAILED",
            provisioningRequestId: null,
            placementDecisionId: null,
            initiatingActor: "admin",
            updatedAt: "2026-01-04T00:00:00.000Z",
          },
        ],
        total: 3,
      },
    });
    listWorkflowDeadLetters.mockResolvedValue({
      data: { items: [], total: 1 },
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
    listWorkflowDefinitions.mockResolvedValue({
      data: {
        items: [
          {
            id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            code: "demo-flow",
            name: "Demo Flow",
            description: null,
            domain: "provisioning",
            definitionStatus: "DRAFT",
            securityClassification: null,
            createdBy: "admin",
            approvedBy: null,
            publishedAt: null,
            version: 1,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            code: "published-flow",
            name: "Published Flow",
            description: null,
            domain: "provisioning",
            definitionStatus: "PUBLISHED",
            securityClassification: null,
            createdBy: "admin",
            approvedBy: "admin",
            publishedAt: "2026-01-01T00:00:00.000Z",
            version: 2,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        total: 2,
      },
    });
    createWorkflowDefinition.mockResolvedValue({
      data: {
        definition: {
          id: "new-def",
          code: "NEW",
          name: "New",
          definitionStatus: "DRAFT",
          version: 1,
        },
      },
    });
    validateWorkflowDefinition.mockResolvedValue({
      data: { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", definitionStatus: "VALIDATED" },
    });
    publishWorkflowDefinition.mockResolvedValue({
      data: {
        definition: {
          id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          definitionStatus: "PUBLISHED",
        },
      },
    });
    deprecateWorkflowDefinition.mockResolvedValue({
      data: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", definitionStatus: "DEPRECATED" },
    });
    listWorkflowTasks.mockResolvedValue({
      data: {
        items: [
          {
            id: "tttttttt-tttt-4ttt-8ttt-tttttttttttt",
            workflowId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            stepId: null,
            taskType: "APPROVAL",
            requiredPermission: "platform:workflow_task:approve",
            assignee: null,
            dueAt: null,
            contextSnapshot: { apiToken: "secret" },
            instructions: "Approve step",
            decision: null,
            decisionReason: null,
            actorId: null,
            status: "OPEN",
            version: 1,
            createdAt: "2026-01-02T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
          },
        ],
        total: 1,
      },
    });
    assignWorkflowTask.mockResolvedValue({ data: { id: "tttttttt-tttt-4ttt-8ttt-tttttttttttt", status: "ASSIGNED" } });
    approveWorkflowTask.mockResolvedValue({ data: { id: "tttttttt-tttt-4ttt-8ttt-tttttttttttt", status: "APPROVED" } });
    rejectWorkflowTask.mockResolvedValue({ data: { id: "tttttttt-tttt-4ttt-8ttt-tttttttttttt", status: "REJECTED" } });
    listWorkflowWorkers.mockResolvedValue({
      data: {
        items: [
          {
            id: "w1",
            workerId: "worker-1",
            identity: "edge-worker-a",
            workerVersion: "1.0.0",
            status: "ACTIVE",
            lastHeartbeatAt: "2026-01-02T00:00:00.000Z",
            metadata: { region: "eu", secretToken: "nope" },
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
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
          handlerKey: "noop:checkpoint",
          status: "CLAIMED",
          ownerWorkerId: "worker-1",
          leaseExpiresAt: "2099-01-01T00:00:00.000Z",
          attemptCount: 1,
          maxAttempts: 3,
        },
      ],
    });
  });

  it("shows loading then forbidden without permissions", () => {
    platformState.permissions = [];
    renderPage();
    expect(
      screen.getByText(/requires platform:workflow:read/i),
    ).toBeTruthy();
  });

  it("loads dashboard counts and recent activity", async () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Workflow Operations" }),
    ).toBeTruthy();
    await waitFor(() => {
      expect(listWorkflowInstances).toHaveBeenCalled();
      expect(screen.getByLabelText(/Running: 1/i)).toBeTruthy();
    });
    expect(screen.getByLabelText(/Waiting approval: 1/i)).toBeTruthy();
    expect(screen.getByLabelText(/Failed: 1/i)).toBeTruthy();
    expect(screen.getByText("Recent activity")).toBeTruthy();
  });

  it("shows empty dashboard when no instances", async () => {
    listWorkflowInstances.mockResolvedValue({ data: { items: [], total: 0 } });
    listWorkflowDeadLetters.mockResolvedValue({ data: { items: [], total: 0 } });
    renderPage();
    expect(await screen.findByText("No workflow activity")).toBeTruthy();
  });

  it("handles dashboard API errors", async () => {
    listWorkflowInstances.mockRejectedValue(new Error("boom"));
    renderPage();
    expect(await screen.findByText("boom")).toBeTruthy();
  });

  it("lists definitions, creates draft, validates and publishes", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Definitions" }));
    await waitFor(() => expect(listWorkflowDefinitions).toHaveBeenCalled());
    expect(await screen.findByText("Demo Flow")).toBeTruthy();
    expect(screen.getByText("read-only")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Definition code"), {
      target: { value: "NEW" },
    });
    fireEvent.change(screen.getByLabelText("Definition name"), {
      target: { value: "New flow" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
    await waitFor(() => {
      expect(createWorkflowDefinition).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "NEW",
          name: "New flow",
          snapshot: expect.objectContaining({
            steps: expect.any(Array),
          }),
        }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Validate" }));
    await waitFor(() => expect(validateWorkflowDefinition).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    await waitFor(() => expect(publishWorkflowDefinition).toHaveBeenCalled());
  });

  it("hides create draft without manage permission and shows immutable publish", async () => {
    platformState.permissions = [
      "platform:workflow_definition:read",
      "platform:workflow:read",
    ];
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Definitions" }));
    await waitFor(() => expect(listWorkflowDefinitions).toHaveBeenCalled());
    expect(screen.queryByLabelText("Create draft definition")).toBeNull();
    expect(screen.queryByRole("button", { name: "Publish" })).toBeNull();
  });

  it("lists instances with filters", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Instances" }));
    await waitFor(() => expect(listWorkflowInstances).toHaveBeenCalled());
    expect(
      (await screen.findAllByText("provisioning.demo")).length,
    ).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "FAILED" },
    });
    await waitFor(() => {
      expect(listWorkflowInstances).toHaveBeenCalledWith(
        expect.objectContaining({ status: "FAILED", offset: 0 }),
      );
    });
  });

  it("approves and rejects tasks with reason gating", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Tasks" }));
    await waitFor(() => expect(listWorkflowTasks).toHaveBeenCalled());
    expect(await screen.findByText("APPROVAL")).toBeTruthy();

    const rejectBtn = screen.getByRole("button", { name: "Reject" });
    expect(rejectBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Reason for/), {
      target: { value: "Not ready" },
    });
    expect(rejectBtn).not.toBeDisabled();
    fireEvent.click(rejectBtn);
    await waitFor(() => {
      expect(rejectWorkflowTask).toHaveBeenCalledWith(
        "tttttttt-tttt-4ttt-8ttt-tttttttttttt",
        { reason: "Not ready" },
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => {
      expect(approveWorkflowTask).toHaveBeenCalled();
    });
  });

  it("shows workers without leaking secrets", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Workers" }));
    await waitFor(() => expect(listWorkflowWorkers).toHaveBeenCalled());
    expect(await screen.findByText("edge-worker-a")).toBeTruthy();
    expect(screen.getByText(/•••••••• \(ref present\)/)).toBeTruthy();
    expect(screen.queryByText("nope")).toBeNull();
    expect(screen.getByText("Current leases")).toBeTruthy();
  });
});
