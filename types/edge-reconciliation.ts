/**
 * P7.13 — Reconciliation & Operational Governance types (Edge Admin Console).
 * Mirrors backend domain records (migration 109; 108=P8). Dates are ISO strings.
 * UNKNOWN ≠ deleted. Status badges reflect API state only — never invent REMEDIATED.
 */

export type ReconciliationRunStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "PARTIAL"
  | "CANCELLED"
  | "WAITING_APPROVAL";

export type ObservationClass =
  | "DRIFT"
  | "MISSING"
  | "UNEXPECTED"
  | "UNKNOWN"
  | "CONFLICT";

export type FindingStatus =
  | "OPEN"
  | "REMEDIATING"
  | "REMEDIATED"
  | "QUARANTINED"
  | "WAIVED"
  | "FALSE_POSITIVE"
  | "EXPIRED";

export type RemediationStatus =
  | "PENDING"
  | "APPROVED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "REJECTED"
  | "CANCELLED"
  | "WAITING_APPROVAL";

export type ReconciliationPolicy = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  scope: string;
  autoRemediate: boolean;
  requireApproval: boolean;
  policyStatus: string;
  rules: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ReconciliationRun = {
  id: string;
  tenantId: string | null;
  productId: string | null;
  providerCode: string | null;
  policyId: string | null;
  triggerKind: string;
  runStatus: ReconciliationRunStatus | string;
  provisioningRequestId: string | null;
  authorizationRowId: string | null;
  authorizationVersion: number | null;
  workflowId: string | null;
  desiredSnapshot: Record<string, unknown>;
  observedSnapshot: Record<string, unknown>;
  summary: Record<string, unknown>;
  driftCount: number;
  startedAt: string;
  finishedAt: string | null;
  performedBy: string | null;
  correlationId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ReconciliationFinding = {
  id: string;
  runId: string;
  tenantId: string | null;
  productId: string | null;
  findingCode: string;
  resourceType: string;
  resourceRef: string | null;
  severity: string;
  findingStatus: FindingStatus | string;
  observationClass: ObservationClass | string;
  desiredState: Record<string, unknown>;
  observedState: Record<string, unknown>;
  lastKnownState: Record<string, unknown>;
  autoRemediateEligible: boolean;
  message: string | null;
  details: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ReconciliationRemediation = {
  id: string;
  findingId: string;
  runId: string;
  tenantId: string | null;
  remediationStatus: RemediationStatus | string;
  plan: Record<string, unknown>;
  workflowId: string | null;
  reversible: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  executedAt: string | null;
  evidence: Record<string, unknown>;
  errorCode: string | null;
  errorMessage: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ReconciliationWaiver = {
  id: string;
  findingId: string | null;
  tenantId: string | null;
  productId: string | null;
  waiverCode: string;
  reason: string;
  waiverStatus: string;
  expiresAt: string;
  createdBy: string;
  revokedBy: string | null;
  revokedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ReconciliationEvidence = {
  id: string;
  runId: string | null;
  findingId: string | null;
  remediationId: string | null;
  tenantId: string | null;
  workflowId: string | null;
  stepKey: string | null;
  operation: string;
  outcome: string;
  evidence: Record<string, unknown>;
  errorCode: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  performedBy: string | null;
  createdAt: string;
};

export type ReconciliationRunDetail = {
  run: ReconciliationRun;
  findings: ReconciliationFinding[];
  remediations: ReconciliationRemediation[];
  evidence: ReconciliationEvidence[];
};

export type ReconciliationListPage<T> = {
  items: T[];
  total: number;
};
