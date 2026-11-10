/** P7.5 Product Control Integration types (Edge Admin Console). */

export type ProductControlEndpointStatus =
  | "PENDING_VALIDATION"
  | "VALIDATING"
  | "ACTIVE"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "QUARANTINED"
  | "REVOKED";

export type ProductControlAuthProfile =
  | "OAUTH2_CC"
  | "MTLS"
  | "OAUTH2_CC_MTLS"
  | "HMAC_SIGNED"
  | "CUSTOM";

export type NegotiatedContractStatus =
  | "DISCOVERED"
  | "VALIDATING"
  | "COMPATIBLE"
  | "INCOMPATIBLE"
  | "DEPRECATED"
  | "REVOKED";

export type ControlExchangeStatus =
  | "CREATED"
  | "QUEUED"
  | "SENDING"
  | "SENT"
  | "ACKNOWLEDGED"
  | "SUCCEEDED"
  | "FAILED"
  | "RETRY_PENDING"
  | "UNKNOWN_OUTCOME"
  | "RECONCILIATION_REQUIRED"
  | "RECONCILED"
  | "CANCELLED";

export type ExchangeReconciliationStatus =
  | "NONE"
  | "REQUIRED"
  | "IN_PROGRESS"
  | "RECONCILED"
  | "ABANDONED";

export type HealthCheckResult =
  | "HEALTHY"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "UNKNOWN";

export type CredentialBindingStatus =
  | "ACTIVE"
  | "ROTATING"
  | "REVOKED"
  | "EXPIRED";

export type ProductControlListPage<T> = {
  items: T[];
  total: number;
};

export type ProductControlListQuery = {
  limit?: number;
  offset?: number;
  status?: string;
  q?: string;
  productId?: string;
  platformId?: string;
  endpointId?: string;
};

export type ProductControlEndpointRecord = {
  id: string;
  productRegistryId: string;
  productId: string;
  platformId: string;
  environmentId: string | null;
  deploymentProfileId: string | null;
  registryContractId: string | null;
  code: string;
  baseUrl: string;
  apiVersion: string;
  contractVersion: string;
  authProfile: ProductControlAuthProfile | string;
  /** Opaque handle only — never plaintext secrets. */
  credentialRef: string;
  allowedScopes: unknown[];
  status: ProductControlEndpointStatus | string;
  contractFingerprint: string | null;
  identityFingerprint: string | null;
  registrationSource: string;
  lastHandshakeAt: string | null;
  lastHandshakeStatus: string | null;
  lastHandshakeError: string | null;
  lastHealthCheckAt: string | null;
  lastHealthStatus: string | null;
  metadata: Record<string, unknown>;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NegotiatedContractRecord = {
  id: string;
  endpointId: string;
  contractVersion: string;
  fingerprint: string;
  schemaSnapshot: Record<string, unknown>;
  supportedVersions: unknown[];
  status: NegotiatedContractStatus | string;
  discoveredAt: string;
  validatedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ProductControlCapabilityRecord = {
  id: string;
  endpointId: string;
  capabilityCode: string;
  declaredAt: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ControlExchangeRecord = {
  id: string;
  productId: string;
  endpointId: string;
  workflowId: string | null;
  stepId: string | null;
  operationCode: string;
  contractVersion: string;
  requestId: string;
  correlationId: string;
  causationId: string | null;
  idempotencyKey: string;
  requestDigest: string | null;
  responseDigest: string | null;
  requestTimestamp: string;
  responseTimestamp: string | null;
  status: ControlExchangeStatus | string;
  attemptCount: number;
  httpStatus: number | null;
  errorClassification: string | null;
  durationMs: number | null;
  retryEligible: boolean;
  reconciliationStatus: ExchangeReconciliationStatus | string;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  diagnostics: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductControlHealthCheckRecord = {
  id: string;
  endpointId: string;
  checkedAt: string;
  result: HealthCheckResult | string;
  latencyMs: number | null;
  httpStatus: number | null;
  errorClassification: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

export type CredentialBindingRecord = {
  id: string;
  endpointId: string;
  /** Opaque handle only — never plaintext secrets. */
  credentialRef: string;
  authProfile: string;
  status: CredentialBindingStatus | string;
  boundAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ProductControlHistoryEntry = {
  id: string;
  resourceType: string;
  resourceId: string;
  fromStatus: string | null;
  toStatus: string | null;
  action: string;
  reason: string | null;
  actorId: string;
  details: Record<string, unknown>;
  createdAt: string;
};

export type RegisterProductControlEndpointInput = {
  productRegistryId: string;
  productId: string;
  platformId: string;
  environmentId?: string | null;
  code: string;
  baseUrl: string;
  contractVersion: string;
  authProfile: string;
  /** Opaque credential reference — never a secret value. */
  credentialRef: string;
  allowedScopes?: unknown[];
  registryContractId?: string | null;
  deploymentProfileId?: string | null;
};

export type PatchProductControlEndpointInput = {
  expectedVersion: number;
  baseUrl?: string;
  contractVersion?: string;
  authProfile?: string;
  credentialRef?: string;
  allowedScopes?: unknown[];
  metadata?: Record<string, unknown>;
};

export type QuarantineProductControlEndpointInput = {
  reason: string;
};

export type ProductControlOverviewCounts = {
  endpoints: number;
  active: number;
  degraded: number;
  quarantined: number;
  failedExchanges: number;
  reconciliationRequired: number;
};
