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
};

export type TenantManagementListPage<T> = {
  items: T[];
  total: number;
};