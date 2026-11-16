/**
 * P7.8 — Configuration & Entitlement Deployment types (Edge Admin Console).
 * Mirrors backend domain records (migration 103). Dates are ISO strings.
 * NEVER contains plaintext secrets — only vault refs / redacted payloads.
 */

export type ConfigurationSchemaStatus =
  | "DRAFT"
  | "ACTIVE"
  | "DEPRECATED"
  | "RETIRED";

export type ConfigurationTemplateStatus =
  | "DRAFT"
  | "VALIDATED"
  | "PUBLISHED"
  | "DEPRECATED"
  | "RETIRED";

export type ConfigurationBundleStatus =
  | "DRAFT"
  | "VALIDATED"
  | "PUBLISHED"
  | "DEPRECATED"
  | "RETIRED";

export type VersionRecordStatus =
  | "DRAFT"
  | "VALIDATED"
  | "PUBLISHED"
  | "SUPERSEDED";

export type AssignmentStatus =
  | "ASSIGNED"
  | "DEPLOYING"
  | "DEPLOYED"
  | "FAILED"
  | "ROLLBACK_PENDING"
  | "ROLLED_BACK"
  | "SUPERSEDED";

export type EntitlementDeploymentStatus =
  | "PENDING"
  | "VALIDATING"
  | "DEPLOYING"
  | "DEPLOYED"
  | "SUSPENDED"
  | "REVOKED"
  | "FAILED"
  | "SUPERSEDED";

export type DeploymentStrategy =
  | "ATOMIC"
  | "ROLLING"
  | "CANARY"
  | "BLUE_GREEN"
  | "STAGED";

export type DeploymentOperation =
  | "DEPLOY"
  | "ROLLBACK"
  | "RECONCILE"
  | "SUSPEND_ENTITLEMENT"
  | "REVOKE_ENTITLEMENT"
  | "VALIDATE";

export type DeploymentRunOutcome =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "PARTIAL"
  | "ROLLED_BACK"
  | "SKIPPED";

export type ConfigurationDriftStatus =
  | "NONE"
  | "DETECTED"
  | "REMEDIATING"
  | "RESOLVED"
  | "UNKNOWN";

export type ConfigurationSchemaRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productId: string | null;
  schemaVersion: number;
  jsonSchema: Record<string, unknown>;
  checksum: string;
  status: ConfigurationSchemaStatus | string;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ConfigurationTemplateRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productId: string | null;
  schemaId: string;
  runtimeProfileCode: string | null;
  deploymentProfileCode: string | null;
  templateStatus: ConfigurationTemplateStatus | string;
  latestVersion: number;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ConfigurationTemplateVersionRecord = {
  id: string;
  templateId: string;
  versionNumber: number;
  payload: Record<string, unknown>;
  checksum: string;
  status: VersionRecordStatus | string;
  publishedAt: string | null;
  createdBy: string;
  createdAt: string;
};

export type ConfigurationBundleRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productId: string | null;
  bundleStatus: ConfigurationBundleStatus | string;
  latestVersion: number;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ConfigurationBundleVersionRecord = {
  id: string;
  bundleId: string;
  versionNumber: number;
  templateRefs: Array<{ templateId: string; versionNumber: number }>;
  dependencyRefs: string[];
  payload: Record<string, unknown>;
  checksum: string;
  status: VersionRecordStatus | string;
  rolloutPolicy: Record<string, unknown>;
  publishedAt: string | null;
  createdBy: string;
  createdAt: string;
};

export type TenantConfigurationAssignmentRecord = {
  id: string;
  tenantId: string;
  productId: string;
  subscriptionId: string | null;
  accountId: string | null;
  bundleId: string;
  bundleVersion: number;
  bundleChecksum: string;
  assignmentStatus: AssignmentStatus | string;
  desiredConfig: Record<string, unknown>;
  appliedConfig: Record<string, unknown>;
  appliedChecksum: string | null;
  entitlementSnapshotRef: string | null;
  entitlementVersion: string | null;
  authorizationRowId: string | null;
  authorizationVersion: number | null;
  provisioningRequestId: string | null;
  workflowId: string | null;
  deploymentStrategy: DeploymentStrategy | string;
  driftStatus: ConfigurationDriftStatus | string;
  lastDeployedAt: string | null;
  lastReconciledAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type EntitlementDeploymentRecord = {
  id: string;
  assignmentId: string;
  tenantId: string;
  productId: string;
  subscriptionId: string | null;
  entitlementSnapshotRef: string;
  entitlementVersion: string;
  payloadDigest: string;
  capabilities: Record<string, unknown>;
  featureFlags: Record<string, unknown>;
  quotas: Record<string, unknown>;
  limits: Record<string, unknown>;
  deploymentStatus: EntitlementDeploymentStatus | string;
  source: string;
  workflowId: string | null;
  evidence: Record<string, unknown>;
  deployedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ConfigurationDeploymentRunRecord = {
  id: string;
  assignmentId: string;
  tenantId: string;
  productId: string;
  operation: DeploymentOperation | string;
  strategy: string;
  workflowId: string | null;
  fromBundleVersion: number | null;
  toBundleVersion: number | null;
  outcome: DeploymentRunOutcome | string;
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

export type ConfigurationEvidenceRecord = {
  id: string;
  assignmentId: string | null;
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

export type TenantConfigurationAssignmentDetail = {
  assignment: TenantConfigurationAssignmentRecord;
  runs: ConfigurationDeploymentRunRecord[];
  evidence: ConfigurationEvidenceRecord[];
  entitlements: EntitlementDeploymentRecord[];
};

export type ConfigurationListPage<T> = {
  items: T[];
  total: number;
};
