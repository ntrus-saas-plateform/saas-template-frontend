/**
 * P7.10 — Technical Readiness & Activation Gate types (Edge Admin Console).
 * Mirrors backend domain records (migration 105). Dates are ISO strings.
 * Technical ACTIVE ≠ commercial Subscription.ACTIVE — never invent ACTIVE client-side.
 */

export type ReadinessEvaluationStatus =
  | "PENDING"
  | "EVALUATING"
  | "READY"
  | "NOT_READY"
  | "BLOCKED"
  | "FAILED"
  | "SUPERSEDED"
  | "EXPIRED";

export type ReadinessCheckPhase =
  | "P71_AUTH"
  | "P75_PRODUCT_CONTROL"
  | "P76_INFRA"
  | "P77_KEYCLOAK"
  | "P78_CONFIGURATION"
  | "P78_ENTITLEMENTS"
  | "P79_EXPERIENCE"
  | "AGGREGATE"
  | "OTHER";

export type ReadinessCheckStatus =
  | "PENDING"
  | "PASSED"
  | "FAILED"
  | "SKIPPED"
  | "BLOCKED"
  | "ERROR";

export type ActivationRecordStatus =
  | "PENDING"
  | "EVALUATING"
  | "READY_FOR_ACTIVATION"
  | "ACTIVATING"
  | "ACTIVE"
  | "FAILED"
  | "BLOCKED"
  | "SUPERSEDED";

export type TenantReadinessEvaluation = {
  id: string;
  tenantId: string;
  productId: string;
  subscriptionId: string | null;
  accountId: string | null;
  provisioningRequestId: string;
  authorizationRowId: string | null;
  authorizationVersion: number | null;
  evaluationStatus: ReadinessEvaluationStatus | string;
  workflowId: string | null;
  overallScore: number | null;
  blockingCodes: string[];
  summary: Record<string, unknown>;
  evaluatedAt: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ReadinessCheck = {
  id: string;
  evaluationId: string;
  tenantId: string;
  checkCode: string;
  checkPhase: ReadinessCheckPhase | string;
  checkStatus: ReadinessCheckStatus | string;
  required: boolean;
  message: string | null;
  evidenceRef: string | null;
  details: Record<string, unknown>;
  checkedAt: string | null;
  createdAt: string;
};

export type ActivationRecord = {
  id: string;
  tenantId: string;
  productId: string;
  subscriptionId: string | null;
  accountId: string | null;
  provisioningRequestId: string;
  authorizationRowId: string;
  authorizationVersion: number;
  readinessEvaluationId: string | null;
  activationStatus: ActivationRecordStatus | string;
  workflowId: string | null;
  activatedAt: string | null;
  p5SignalEmittedAt: string | null;
  p5SignalEventId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ActivationRun = {
  id: string;
  activationRecordId: string;
  evaluationId: string | null;
  tenantId: string;
  productId: string;
  operation: string;
  workflowId: string | null;
  outcome: string;
  errorCode: string | null;
  errorMessage: string | null;
  observedState: Record<string, unknown>;
  evidence: Record<string, unknown>;
  startedAt: string;
  finishedAt: string | null;
  performedBy: string | null;
  correlationId: string | null;
  createdAt: string;
};

export type ActivationEvidence = {
  id: string;
  activationRecordId: string | null;
  evaluationId: string | null;
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

export type ReadinessEvaluationDetail = {
  evaluation: TenantReadinessEvaluation;
  checks: ReadinessCheck[];
  evidence: ActivationEvidence[];
};

export type ActivationRecordDetail = {
  record: ActivationRecord;
  runs: ActivationRun[];
  evidence: ActivationEvidence[];
};

export type ActivationListPage<T> = {
  items: T[];
  total: number;
};
