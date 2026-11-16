/**
 * P7.11 — Tenant Technical Lifecycle types (Edge Admin Console).
 * Mirrors backend domain records (migration 106). Dates are ISO strings.
 * Does NOT invent SUSPENDED/DEPROVISIONED client-side — status from API only.
 * Technical lifecycle ≠ commercial Subscription status / business IAM.
 */

export type LifecycleStatus =
  | "ACTIVE"
  | "SUSPENDING"
  | "SUSPENDED"
  | "RESUMING"
  | "MIGRATING"
  | "ARCHIVING"
  | "ARCHIVED"
  | "RESTORING"
  | "DEPROVISIONING"
  | "DEPROVISIONED"
  | "DATA_PURGED"
  | "FAILED";

export type TenantLifecycleRecord = {
  id: string;
  tenantId: string;
  productId: string;
  subscriptionId: string | null;
  accountId: string | null;
  provisioningRequestId: string;
  authorizationRowId: string;
  authorizationVersion: number;
  activationRecordId: string;
  lifecycleStatus: LifecycleStatus | string;
  workflowId: string | null;
  deletionProtection: boolean;
  retentionPolicyRef: string | null;
  exportEvidenceRef: string | null;
  lastSuspendedAt: string | null;
  lastResumedAt: string | null;
  deprovisionedAt: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type LifecycleRun = {
  id: string;
  lifecycleRecordId: string;
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

export type LifecycleEvidence = {
  id: string;
  lifecycleRecordId: string | null;
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

export type LifecycleRecordDetail = {
  record: TenantLifecycleRecord;
  runs: LifecycleRun[];
  evidence: LifecycleEvidence[];
};

export type LifecycleListPage<T> = {
  items: T[];
  total: number;
};
