/**
 * P8 — Advanced Tenant Management & Governance (Edge Admin Console).
 * Mirrors backend domain records. Dates are ISO strings from the BFF.
 * Does NOT invent HEALTHY — health/status badges reflect API values only.
 */

export type TenantRegistryRecord = {
  id: string;
  productTenantId: string;
  tenantCode: string;
  tenantSlug: string;
  displayName: string;
  legalNameRef: string | null;
  productId: string;
  productCode: string | null;
  accountId: string | null;
  subscriptionId: string | null;
  classification: string;
  segment: string | null;
  deploymentProfile: string | null;
  environmentClassification: string;
  region: string | null;
  administrativeStatus: string;
  technicalStatus: string;
  governanceStatus: string;
  healthStatus: string;
  riskLevel: string;
  platformTenantRef: string | null;
  provisioningRequestId: string | null;
  activationRecordId: string | null;
  lifecycleRecordId: string | null;
  internalOwnerId: string | null;
  operationalTeam: string | null;
  supportClassification: string | null;
  locale: string | null;
  timezone: string | null;
  defaultLanguage: string | null;
  dataResidencyRef: string | null;
  retentionPolicyRef: string | null;
  securityPolicyRef: string | null;
  legalHold: boolean;
  deletionProtection: boolean;
  lastAdminActivityAt: string | null;
  lastSyncedAt: string | null;
  technicalObservedAt: string | null;
  healthObservedAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type TenantTagRecord = {
  id: string;
  tenantRegistryId: string;
  tagKey: string;
  tagValue: string;
  createdBy: string;
  createdAt: string;
};

export type TenantNoteRecord = {
  id: string;
  tenantRegistryId: string;
  noteType: string;
  body: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type LifecycleRequestRecord = {
  id: string;
  tenantRegistryId: string;
  productTenantId: string;
  requestType: string;
  status: string;
  justification: string;
  riskAssessment: string | null;
  requestedBy: string;
  approverId: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  p7WorkflowId: string | null;
  p7LifecycleRecordId: string | null;
  p5SubscriptionId: string | null;
  correlationId: string | null;
  idempotencyKey: string;
  evidence: Record<string, unknown>;
  result: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ExceptionRecord = {
  id: string;
  tenantRegistryId: string;
  productTenantId: string;
  exceptionType: string;
  status: string;
  description: string;
  businessJustification: string;
  riskAssessment: string | null;
  scope: Record<string, unknown>;
  conditions: Record<string, unknown>;
  evidence: Record<string, unknown>;
  requesterId: string;
  approverId: string | null;
  startsAt: string;
  expiresAt: string;
  approvedAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  correlationId: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ReconciliationFindingRecord = {
  id: string;
  runId: string;
  tenantRegistryId: string | null;
  productTenantId: string | null;
  findingType: string;
  severity: string;
  status: string;
  description: string;
  recommendedAction: string | null;
  evidence: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ActivityEventRecord = {
  id: string;
  tenantRegistryId: string | null;
  productTenantId: string | null;
  eventType: string;
  action: string;
  actorId: string | null;
  actorType: string;
  source: string;
  outcome: string;
  reason: string | null;
  correlationId: string | null;
  causationId: string | null;
  beforeRef: Record<string, unknown> | null;
  afterRef: Record<string, unknown> | null;
  evidenceRef: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

export type TenantPortfolioMetrics = {
  total: number;
  active: number;
  provisioning: number;
  suspended: number;
  degraded: number;
  pendingReview: number;
  exceptionsActive: number;
  reconciliationOpen: number;
  byProduct: Array<{
    productId: string;
    productCode: string | null;
    count: number;
  }>;
  byRegion: Array<{ region: string; count: number }>;
  byClassification: Array<{ classification: string; count: number }>;
  byAdministrativeStatus: Array<{ status: string; count: number }>;
  computedAt: string;
};

export type AvailabilityProjection = "AVAILABLE" | "PARTIAL" | "UNAVAILABLE" | "UNKNOWN";

export type Tenant360Overview = {
  registry: TenantRegistryRecord;
  tags: TenantTagRecord[];
  notes: TenantNoteRecord[];
  commercial: {
    accountId: string | null;
    subscriptionId: string | null;
    productId: string;
    source: string;
    syncedAt: string | null;
    availability: "AVAILABLE" | "PARTIAL" | "UNAVAILABLE";
  };
  technical: {
    technicalStatus: string;
    lifecycleRecordId: string | null;
    activationRecordId: string | null;
    provisioningRequestId: string | null;
    observedAt: string | null;
    freshness: "FRESH" | "STALE" | "UNKNOWN";
    source: string;
  };
  health: {
    status: string;
    observedAt: string | null;
    freshness: "FRESH" | "STALE" | "UNKNOWN";
  };
  openExceptions: number;
  pendingLifecycleRequests: number;
  openFindings: number;
  resources?: {
    availability: AvailabilityProjection;
    items?: Array<Record<string, unknown>>;
    source?: string;
    observedAt?: string | null;
  };
  applications?: {
    availability: AvailabilityProjection;
    items?: Array<Record<string, unknown>>;
    source?: string;
    observedAt?: string | null;
  };
  configuration?: {
    availability: AvailabilityProjection;
    items?: Array<Record<string, unknown>>;
    source?: string;
    observedAt?: string | null;
  };
  timeline?: Array<{
    id: string;
    label: string;
    occurredAt: string;
    source?: string;
    details?: Record<string, unknown>;
  }>;
  risk?: {
    level: string;
    assessedAt: string | null;
    availability: AvailabilityProjection;
    ruleVersion?: string | null;
  };
  latestHealthSnapshot?: TenantHealthSnapshotRecord | null;
};

export type MigrationRequestRecord = {
  id: string;
  tenantRegistryId: string;
  productTenantId: string;
  migrationType: string;
  status: string;
  justification: string;
  impactAssessment: string | null;
  compatibilityAssessment: string | null;
  dataResidencyReview: string | null;
  downtimeAssessment: string | null;
  targetRef: Record<string, unknown>;
  scheduleAt: string | null;
  requestedBy: string;
  approverId: string | null;
  approvedAt: string | null;
  p7WorkflowId: string | null;
  evidence: Record<string, unknown>;
  result: Record<string, unknown>;
  correlationId: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type RecoveryRequestRecord = {
  id: string;
  tenantRegistryId: string;
  productTenantId: string;
  recoveryType: string;
  status: string;
  priority: string;
  scope: Record<string, unknown>;
  backupRef: string | null;
  restorePointRef: string | null;
  justification: string;
  rpoAssessment: string | null;
  rtoMeasurement: string | null;
  requestedBy: string;
  approverId: string | null;
  approvedAt: string | null;
  p7WorkflowId: string | null;
  evidence: Record<string, unknown>;
  result: Record<string, unknown>;
  correlationId: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type TerminationRequestRecord = {
  id: string;
  tenantRegistryId: string;
  productTenantId: string;
  status: string;
  justification: string;
  contractualCheck: Record<string, unknown>;
  financialCheck: Record<string, unknown>;
  retentionEvaluation: Record<string, unknown>;
  legalHold: boolean;
  dataExportRef: string | null;
  graceUntil: string | null;
  requestedBy: string;
  approverId: string | null;
  approvedAt: string | null;
  p7WorkflowId: string | null;
  evidence: Record<string, unknown>;
  result: Record<string, unknown>;
  correlationId: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ReconciliationRunRecord = {
  id: string;
  mode: string;
  status: string;
  scope: Record<string, unknown>;
  summary: Record<string, unknown>;
  startedBy: string;
  startedAt: string;
  finishedAt: string | null;
  correlationId: string | null;
  createdAt: string;
};

export type TenantHealthSnapshotRecord = {
  id: string;
  tenantRegistryId: string;
  productTenantId: string;
  overallStatus: string;
  indicators: Record<string, unknown>;
  sourceSystem: string;
  observedAt: string;
  staleAfter: string;
  createdAt: string;
};

export type TenantRiskAssessmentRecord = {
  id: string;
  tenantRegistryId: string;
  productTenantId: string;
  riskLevel: string;
  score: number | null;
  ruleVersion: string;
  inputs: Record<string, unknown>;
  result: Record<string, unknown>;
  evidenceRefs: unknown[];
  reviewerId: string | null;
  evaluatedAt: string;
  createdAt: string;
};

export type TenantBulkOperationRecord = {
  id: string;
  operationType: string;
  status: string;
  previewCount: number;
  filter: Record<string, unknown>;
  payload: Record<string, unknown>;
  results: unknown[];
  requestedBy: string;
  approverId: string | null;
  correlationId: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
};

export type TenantPoliciesPatch = {
  expectedVersion: number;
  deletionProtection?: boolean;
  dataResidencyRef?: string | null;
  retentionPolicyRef?: string | null;
  securityPolicyRef?: string | null;
  correlationId?: string;
};

export type TenantLegalHoldUpdate = {
  expectedVersion: number;
  legalHold: boolean;
  justification: string;
  correlationId?: string;
};

export type LegalHoldChangeRequestRecord = {
  id: string;
  tenantRegistryId: string;
  action: "RAISE" | "LIFT";
  status: string;
  justification: string;
  requestedBy: string;
  approverId: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  correlationId: string | null;
  idempotencyKey: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type RequestLegalHoldChangeBody = {
  action: "RAISE" | "LIFT";
  justification: string;
  idempotencyKey: string;
  correlationId?: string;
};

export type TenantManagementListPage<T> = {
  items: T[];
  total: number;
};