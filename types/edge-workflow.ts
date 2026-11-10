/** P7.4 Durable Workflow types (Edge Admin Console). */

export type WorkflowDefinitionStatus =
  | "DRAFT"
  | "VALIDATED"
  | "PUBLISHED"
  | "DEPRECATED"
  | "RETIRED";

export type WorkflowInstanceState =
  | "CREATED"
  | "READY"
  | "RUNNING"
  | "WAITING"
  | "WAITING_APPROVAL"
  | "COMPENSATING"
  | "COMPENSATION_FAILED"
  | "RETRY_PENDING"
  | "PAUSED"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCEL_REQUESTED"
  | "CANCELLED"
  | "TIMED_OUT"
  | "REQUIRES_INTERVENTION";

export type WorkflowStepStatus =
  | "PENDING"
  | "READY"
  | "CLAIMED"
  | "RUNNING"
  | "WAITING"
  | "WAITING_APPROVAL"
  | "SUCCEEDED"
  | "FAILED"
  | "RETRY_PENDING"
  | "COMPENSATION_PENDING"
  | "COMPENSATING"
  | "COMPENSATED"
  | "SKIPPED"
  | "CANCELLED"
  | "TIMED_OUT";

export type HumanTaskStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export type HumanTaskType =
  | "APPROVAL"
  | "REVIEW"
  | "MANUAL_ACTION"
  | "EXCEPTION_RESOLUTION"
  | "COMPENSATION_INTERVENTION";

export type CompensationStatus =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "SKIPPED"
  | "CANCELLED";

export type WorkerRegistryStatus =
  | "ACTIVE"
  | "DRAINING"
  | "OFFLINE"
  | "REVOKED";

export type DeadLetterStatus = "OPEN" | "RESOLVED";

export type WorkflowListPage<T> = {
  items: T[];
  total: number;
};

export type WorkflowListQuery = {
  limit?: number;
  offset?: number;
  status?: string;
  q?: string;
  workflowId?: string;
};

export type WorkflowStepDefinition = {
  key: string;
  type: string;
  handlerKey: string;
  dependsOn?: string[];
  maxAttempts?: number;
  timeoutMs?: number;
  compensationHandlerKey?: string | null;
  requiresApproval?: boolean;
  failurePolicy?: string;
};

export type WorkflowDefinitionSnapshot = {
  steps: WorkflowStepDefinition[];
  graph?: { edges?: Array<{ from: string; to: string }> };
  retryDefaults?: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    multiplier?: number;
    jitterRatio?: number;
  };
  timeoutDefaultsMs?: number;
  compensationPolicy?: string;
  approvalRequirements?: Record<string, unknown>;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  deadlineMs?: number | null;
};

export type WorkflowDefinitionRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  domain: string;
  definitionStatus: WorkflowDefinitionStatus | string;
  securityClassification: string | null;
  createdBy: string | null;
  approvedBy: string | null;
  publishedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowDefinitionVersionRecord = {
  id: string;
  definitionId: string;
  versionNumber: number;
  snapshot: WorkflowDefinitionSnapshot;
  status: WorkflowDefinitionStatus | string;
  publishedAt: string | null;
  createdAt: string;
};

export type WorkflowInstanceRecord = {
  id: string;
  definitionId: string;
  definitionVersion: number;
  definitionSnapshot: WorkflowDefinitionSnapshot;
  workflowType: string;
  businessReference: string | null;
  provisioningRequestId: string | null;
  placementDecisionId: string | null;
  authorizationRowId: string | null;
  authorizationId: string | null;
  authorizationVersion: number | null;
  accountId: string | null;
  productId: string | null;
  subscriptionId: string | null;
  correlationId: string;
  causationId: string | null;
  idempotencyKey: string;
  inputSnapshot: Record<string, unknown>;
  state: WorkflowInstanceState | string;
  currentStepKey: string | null;
  startedAt: string | null;
  completedAt: string | null;
  deadlineAt: string | null;
  cancellationReason: string | null;
  failureDetails: Record<string, unknown>;
  initiatingActor: string | null;
  executionContext: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowStepRecord = {
  id: string;
  workflowId: string;
  stepKey: string;
  stepType: string;
  handlerKey: string;
  dependsOn: string[];
  inputSnapshot: Record<string, unknown>;
  outputSnapshot: Record<string, unknown>;
  status: WorkflowStepStatus | string;
  attemptCount: number;
  maxAttempts: number;
  idempotencyKey: string;
  ownerWorkerId: string | null;
  leaseExpiresAt: string | null;
  fencingToken: number;
  startedAt: string | null;
  finishedAt: string | null;
  timeoutAt: string | null;
  errorClass: string | null;
  nextRetryAt: string | null;
  compensationHandlerKey: string | null;
  executionOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowAttemptRecord = {
  id: string;
  stepId: string;
  attemptNumber: number;
  workerId: string;
  fencingToken: number;
  startedAt: string;
  endedAt: string | null;
  result: string | null;
  errorClass: string | null;
  retryClassification: string | null;
  durationMs: number | null;
  correlationId: string | null;
  diagnostics: Record<string, unknown>;
  createdAt: string;
};

export type WorkflowCheckpointRecord = {
  id: string;
  workflowId: string;
  stepId: string | null;
  sequence: number;
  definitionVersion: number;
  stateSnapshot: Record<string, unknown>;
  outputRef: string | null;
  integrityHash: string | null;
  createdAt: string;
};

export type WorkflowCompensationRecord = {
  id: string;
  stepId: string;
  workflowId: string;
  handlerKey: string;
  input: Record<string, unknown>;
  status: CompensationStatus | string;
  attempts: number;
  timeoutAt: string | null;
  result: Record<string, unknown>;
  failureDetails: Record<string, unknown>;
  executionOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowHumanTaskRecord = {
  id: string;
  workflowId: string;
  stepId: string | null;
  taskType: HumanTaskType | string;
  requiredPermission: string;
  assignee: string | null;
  dueAt: string | null;
  contextSnapshot: Record<string, unknown>;
  instructions: string | null;
  decision: string | null;
  decisionReason: string | null;
  actorId: string | null;
  status: HumanTaskStatus | string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowHistoryEntry = {
  id: string;
  resourceType: string;
  resourceId: string;
  workflowId: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  action: string;
  reason: string | null;
  actorId: string;
  details: Record<string, unknown>;
  createdAt: string;
};

export type WorkflowDeadLetterRecord = {
  id: string;
  workflowId: string;
  stepId: string | null;
  reason: string;
  payload: Record<string, unknown>;
  status: DeadLetterStatus | string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

export type WorkflowWorkerRecord = {
  id: string;
  workerId: string;
  identity: string;
  workerVersion: string;
  status: WorkerRegistryStatus | string;
  lastHeartbeatAt: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkflowDefinitionInput = {
  code: string;
  name: string;
  description?: string;
  domain?: string;
  securityClassification?: string;
  snapshot: WorkflowDefinitionSnapshot;
};

export type CreateWorkflowInstanceInput = {
  idempotencyKey?: string;
  definitionId: string;
  workflowType: string;
  inputSnapshot?: Record<string, unknown>;
  provisioningRequestId?: string;
  placementDecisionId?: string;
  businessReference?: string;
  causationId?: string;
};

export type WorkflowReasonInput = {
  reason?: string;
};

export type RetryWorkflowInput = {
  stepId?: string;
};

export type AssignWorkflowTaskInput = {
  assignee: string;
};

export type DecideWorkflowTaskInput = {
  reason?: string;
};

export type RejectWorkflowTaskInput = {
  reason: string;
};

export type WorkflowDashboardCounts = {
  active: number;
  running: number;
  waitingApproval: number;
  retryPending: number;
  failed: number;
  compensating: number;
  deadLetter: number;
  timedOut: number;
};
