import { edgeApi } from "@/lib/api/edge";
import type {
  AssignWorkflowTaskInput,
  CreateWorkflowDefinitionInput,
  CreateWorkflowInstanceInput,
  DecideWorkflowTaskInput,
  RejectWorkflowTaskInput,
  RetryWorkflowInput,
  WorkflowDashboardCounts,
  WorkflowDefinitionSnapshot,
  WorkflowListQuery,
  WorkflowReasonInput,
} from "@/types/edge-workflow";

type BadgeTone = "default" | "danger" | "success" | "warning" | "info";

const SENSITIVE_KEY =
  /secret|password|token|credential|apikey|api_key|private.?key|secure.?config/i;

/** Unwrap edgeApi / edgeRequest payloads that nest under `.data`. */
export function unwrapEdgeData<T>(payload: unknown): T | undefined {
  if (payload == null) return undefined;
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function unwrapWorkflowList<T>(payload: unknown): {
  items: T[];
  total: number;
} {
  const raw = unwrapEdgeData<{ items?: T[]; total?: number } | T[]>(payload);
  if (Array.isArray(raw)) return { items: raw, total: raw.length };
  if (raw && typeof raw === "object" && Array.isArray(raw.items)) {
    return { items: raw.items, total: Number(raw.total ?? raw.items.length) };
  }
  return { items: [], total: 0 };
}

export function redactSecretRef(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  return "•••••••• (ref present)";
}

export function redactWorkflowMetadata(
  meta: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!meta) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = redactSecretRef(
        typeof value === "string" ? value : "present",
      );
      continue;
    }
    if (typeof value === "string" && /vault:\/\/|password=|token=/i.test(value)) {
      out[key] = redactSecretRef(value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function workflowErrMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Request failed";
}

export function workflowStatusTone(status: string): BadgeTone {
  switch (status) {
    case "SUCCEEDED":
    case "PUBLISHED":
    case "APPROVED":
    case "COMPLETED":
    case "COMPENSATED":
    case "ACTIVE":
      return "success";
    case "RUNNING":
    case "READY":
    case "CLAIMED":
    case "CREATED":
    case "VALIDATED":
    case "ASSIGNED":
    case "IN_PROGRESS":
    case "OPEN":
      return "info";
    case "WAITING":
    case "WAITING_APPROVAL":
    case "RETRY_PENDING":
    case "PAUSED":
    case "DRAFT":
    case "COMPENSATING":
    case "COMPENSATION_PENDING":
    case "CANCEL_REQUESTED":
    case "REQUIRES_INTERVENTION":
    case "DRAINING":
      return "warning";
    case "FAILED":
    case "COMPENSATION_FAILED":
    case "REJECTED":
    case "CANCELLED":
    case "TIMED_OUT":
    case "EXPIRED":
    case "RETIRED":
    case "REVOKED":
    case "OFFLINE":
      return "danger";
    case "DEPRECATED":
    case "SKIPPED":
      return "default";
    default:
      return "info";
  }
}

export function isPublishedImmutable(status: string): boolean {
  return (
    status === "PUBLISHED" ||
    status === "DEPRECATED" ||
    status === "RETIRED"
  );
}

export function canApproveRejectTask(status: string): boolean {
  return status === "OPEN" || status === "ASSIGNED" || status === "IN_PROGRESS";
}

/** Default draft snapshot using only P7.4 noop handlers (no P7.5+). */
export function defaultDraftSnapshot(): WorkflowDefinitionSnapshot {
  return {
    steps: [
      {
        key: "checkpoint",
        type: "HANDLER",
        handlerKey: "noop:checkpoint",
      },
      {
        key: "approve",
        type: "HANDLER",
        handlerKey: "noop:approve",
        dependsOn: ["checkpoint"],
        requiresApproval: true,
      },
    ],
    graph: {
      edges: [{ from: "checkpoint", to: "approve" }],
    },
    retryDefaults: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30_000,
      multiplier: 2,
      jitterRatio: 0.1,
    },
    timeoutDefaultsMs: 60_000,
    compensationPolicy: "COMPENSATE",
  };
}

export function emptyDashboardCounts(): WorkflowDashboardCounts {
  return {
    active: 0,
    running: 0,
    waitingApproval: 0,
    retryPending: 0,
    failed: 0,
    compensating: 0,
    deadLetter: 0,
    timedOut: 0,
  };
}

export const WORKFLOW_INSTANCE_STATUS_OPTIONS = [
  "CREATED",
  "READY",
  "RUNNING",
  "WAITING",
  "WAITING_APPROVAL",
  "COMPENSATING",
  "COMPENSATION_FAILED",
  "RETRY_PENDING",
  "PAUSED",
  "SUCCEEDED",
  "FAILED",
  "CANCEL_REQUESTED",
  "CANCELLED",
  "TIMED_OUT",
  "REQUIRES_INTERVENTION",
] as const;

export const WORKFLOW_DEFINITION_STATUS_OPTIONS = [
  "DRAFT",
  "VALIDATED",
  "PUBLISHED",
  "DEPRECATED",
  "RETIRED",
] as const;

export const WORKFLOW_TASK_STATUS_OPTIONS = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "EXPIRED",
  "CANCELLED",
] as const;

export const WORKER_STATUS_OPTIONS = [
  "ACTIVE",
  "DRAINING",
  "OFFLINE",
  "REVOKED",
] as const;

const ACTIVE_STATES = new Set([
  "CREATED",
  "READY",
  "RUNNING",
  "WAITING",
  "WAITING_APPROVAL",
  "COMPENSATING",
  "RETRY_PENDING",
  "PAUSED",
  "CANCEL_REQUESTED",
  "REQUIRES_INTERVENTION",
]);

/** Aggregate dashboard counts from a page of instances (+ optional dead-letter total). */
export function aggregateDashboardCounts(
  instances: Array<{ state: string }>,
  deadLetterTotal = 0,
): WorkflowDashboardCounts {
  const counts = emptyDashboardCounts();
  counts.deadLetter = deadLetterTotal;
  for (const row of instances) {
    const s = row.state;
    if (ACTIVE_STATES.has(s)) counts.active += 1;
    if (s === "RUNNING") counts.running += 1;
    if (s === "WAITING_APPROVAL") counts.waitingApproval += 1;
    if (s === "RETRY_PENDING") counts.retryPending += 1;
    if (s === "FAILED" || s === "COMPENSATION_FAILED") counts.failed += 1;
    if (s === "COMPENSATING" || s === "COMPENSATION_FAILED") {
      counts.compensating += 1;
    }
    if (s === "TIMED_OUT") counts.timedOut += 1;
    if (s === "REQUIRES_INTERVENTION") counts.deadLetter += 1;
  }
  return counts;
}

export function newIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `idem-${Date.now()}`;
}

/** Typed Workflow Operations API client (BFF via edgeApi / same auth+CSRF). */
export const workflowApi = {
  listDefinitions: (opts?: WorkflowListQuery) =>
    edgeApi.listWorkflowDefinitions(opts),
  getDefinition: (id: string) => edgeApi.getWorkflowDefinition(id),
  createDefinition: (body: CreateWorkflowDefinitionInput) =>
    edgeApi.createWorkflowDefinition(body),
  validateDefinition: (id: string) => edgeApi.validateWorkflowDefinition(id),
  publishDefinition: (id: string) => edgeApi.publishWorkflowDefinition(id),
  deprecateDefinition: (id: string, body?: WorkflowReasonInput) =>
    edgeApi.deprecateWorkflowDefinition(id, body),

  listInstances: (opts?: WorkflowListQuery) =>
    edgeApi.listWorkflowInstances(opts),
  getInstance: (id: string) => edgeApi.getWorkflowInstance(id),
  createInstance: (body: CreateWorkflowInstanceInput) =>
    edgeApi.createWorkflowInstance(body),
  listHistory: (id: string, opts?: WorkflowListQuery) =>
    edgeApi.listWorkflowHistory(id, opts),
  listSteps: (id: string) => edgeApi.listWorkflowSteps(id),
  listAttempts: (id: string) => edgeApi.listWorkflowAttempts(id),
  listCheckpoints: (id: string) => edgeApi.listWorkflowCheckpoints(id),
  listCompensations: (id: string) => edgeApi.listWorkflowCompensations(id),

  start: (id: string) => edgeApi.startWorkflow(id),
  pause: (id: string, body?: WorkflowReasonInput) =>
    edgeApi.pauseWorkflow(id, body),
  resume: (id: string) => edgeApi.resumeWorkflow(id),
  cancel: (id: string, body?: WorkflowReasonInput) =>
    edgeApi.cancelWorkflow(id, body),
  retry: (id: string, body?: RetryWorkflowInput) =>
    edgeApi.retryWorkflow(id, body),
  reconcile: (id: string) => edgeApi.reconcileWorkflow(id),

  listTasks: (opts?: WorkflowListQuery) => edgeApi.listWorkflowTasks(opts),
  getTask: (id: string) => edgeApi.getWorkflowTask(id),
  assignTask: (id: string, body: AssignWorkflowTaskInput) =>
    edgeApi.assignWorkflowTask(id, body),
  approveTask: (id: string, body?: DecideWorkflowTaskInput) =>
    edgeApi.approveWorkflowTask(id, body),
  rejectTask: (id: string, body: RejectWorkflowTaskInput) =>
    edgeApi.rejectWorkflowTask(id, body),

  listWorkers: (opts?: WorkflowListQuery) => edgeApi.listWorkflowWorkers(opts),
  listDeadLetters: (opts?: WorkflowListQuery) =>
    edgeApi.listWorkflowDeadLetters(opts),
};
