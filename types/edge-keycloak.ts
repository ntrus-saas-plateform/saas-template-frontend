/**
 * P7.7 — Keycloak Topology & Identity Infrastructure types (Edge Admin Console).
 * Mirrors the backend domain records (migration 102). NEVER contains secrets:
 * only opaque credential refs are exposed.
 */

export type KeycloakTopologyType =
  | "DEDICATED_REALM"
  | "SHARED_REALM_ORGANIZATIONS"
  | "EXTERNAL_SPECIFIC";

export type KeycloakTopologyStatus =
  | "PLANNED"
  | "PENDING"
  | "PROVISIONING"
  | "CONFIGURING"
  | "VERIFYING"
  | "READY"
  | "DEGRADED"
  | "FAILED"
  | "RECONCILIATION_REQUIRED"
  | "QUARANTINED"
  | "DEPROVISIONING_PENDING"
  | "DEPROVISIONED";

export type KeycloakProviderRecord = {
  id: string;
  code: string;
  name: string;
  providerVersion: string;
  providerKind: "KEYCLOAK_MANAGED" | "KEYCLOAK_EXTERNAL" | "KEYCLOAK_HYBRID";
  operationalStatus: "ACTIVE" | "DEGRADED" | "UNAVAILABLE" | "RETIRED";
  supportedTopologyTypes: string[];
  capabilities: Record<string, unknown>;
  constraints: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type KeycloakServerRecord = {
  id: string;
  providerId: string;
  code: string;
  name: string;
  baseUrl: string;
  adminRealm: string;
  adminClientId: string;
  /** Opaque vault reference — NEVER a plaintext secret. */
  adminCredentialRef: string | null;
  tlsMode: "REQUIRED" | "OPTIONAL_INSECURE_LOCAL";
  allowPrivateNetwork: boolean;
  environment: string;
  operationalStatus: string;
  discoveredVersion: string | null;
  lastConnectivityStatus: string | null;
  lastConnectivityAt: string | null;
  metadata: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type KeycloakCapabilitiesRecord = {
  id: string;
  serverId: string;
  keycloakVersion: string | null;
  features: Record<string, unknown>;
  organizationsSupported: boolean;
  realmsSupported: boolean;
  adminApiReachable: boolean;
  discoverySource: string;
  rawEvidence: Record<string, unknown>;
  verifiedAt: string;
};

export type KeycloakTopologyRecord = {
  id: string;
  tenantId: string;
  productId: string;
  subscriptionId: string | null;
  authorizationId: string | null;
  authorizationVersion: number | null;
  placementDecisionId: string | null;
  deploymentProfileId: string | null;
  runtimeProfileId: string | null;
  providerId: string;
  serverId: string;
  topologyType: KeycloakTopologyType;
  /** Internal Edge identity — distinct from external Keycloak identifiers. */
  realmRef: string | null;
  organizationRef: string | null;
  oidcConfigurationRef: string | null;
  externalRealmId: string | null;
  externalOrganizationId: string | null;
  keycloakVersion: string | null;
  desiredConfigVersion: number;
  appliedConfigVersion: number | null;
  resourceFingerprint: string | null;
  status: KeycloakTopologyStatus;
  statusReason: string | null;
  lastHealthCheckAt: string | null;
  lastReconciliationAt: string | null;
  workflowId: string | null;
  deletionProtection: boolean;
  metadata: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type KeycloakRealmRecord = {
  id: string;
  topologyId: string;
  tenantId: string;
  realmName: string;
  externalRealmId: string | null;
  internalFingerprint: string | null;
  settings: Record<string, unknown>;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type KeycloakOrganizationRecord = {
  id: string;
  topologyId: string;
  tenantId: string;
  /** Technical Keycloak organization — NOT a business organization. */
  organizationAlias: string;
  organizationName: string;
  externalOrganizationId: string | null;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type KeycloakClientRecord = {
  id: string;
  topologyId: string;
  realmId: string;
  tenantId: string;
  clientId: string;
  clientUuid: string | null;
  clientKind: "CONFIDENTIAL" | "PUBLIC" | "SERVICE_ACCOUNT";
  ownerFunction: string;
  documentedUsage: string;
  redirectUris: string[];
  webOrigins: string[];
  scopes: string[];
  /** Opaque vault reference for the client secret. */
  secretCredentialRef: string | null;
  secretRotatedAt: string | null;
  standardFlowEnabled: boolean;
  directAccessGrantsEnabled: boolean;
  serviceAccountsEnabled: boolean;
  pkceRequired: boolean;
  complianceStatus: string;
  status: string;
  workflowId: string | null;
  evidence: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type KeycloakOidcConfigurationRecord = {
  id: string;
  topologyId: string;
  tenantId: string;
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  jwksUri: string;
  endSessionEndpoint: string | null;
  discoveryDocument: Record<string, unknown>;
  verifiedAt: string | null;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type KeycloakHealthCheckRecord = {
  id: string;
  topologyId: string | null;
  serverId: string | null;
  checkType: string;
  outcome: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
  latencyMs: number;
  details: Record<string, unknown>;
  checkedAt: string;
};

export type KeycloakReconciliationRunRecord = {
  id: string;
  topologyId: string;
  tenantId: string;
  workflowId: string | null;
  trigger: string;
  observedState: Record<string, unknown>;
  driftDetected: boolean;
  driftClassification: "NONE" | "LOW" | "MEDIUM" | "CRITICAL";
  driftDetails: unknown[];
  actionTaken: string | null;
  outcome: string;
  startedAt: string;
  completedAt: string | null;
};

export type KeycloakEvidenceRecord = {
  id: string;
  topologyId: string | null;
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
  performedAt: string;
};

export type KeycloakHistoryRecord = {
  id: string;
  resourceType: string;
  resourceId: string;
  topologyId: string | null;
  workflowId: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  action: string;
  reason: string | null;
  actorId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

/** Aggregated topology detail (GET /keycloak/topologies/:id). */
export type KeycloakTopologyDetail = {
  topology: KeycloakTopologyRecord;
  realm: KeycloakRealmRecord | null;
  organization: KeycloakOrganizationRecord | null;
  clients: KeycloakClientRecord[];
  oidc: KeycloakOidcConfigurationRecord | null;
  references: unknown[];
  health: KeycloakHealthCheckRecord[];
  reconciliations: KeycloakReconciliationRunRecord[];
  evidence: KeycloakEvidenceRecord[];
};
