/**
 * P7.9 — Product Experience Provisioning types (Edge Admin Console).
 * Mirrors backend domain records (migration 104). Dates are ISO strings.
 * NEVER contains plaintext secrets — only vault refs / redacted payloads.
 */

export type ExperienceProfileStatus =
  | "DRAFT"
  | "VALIDATED"
  | "PUBLISHED"
  | "DEPRECATED"
  | "RETIRED";

export type ApplicationKind =
  | "WEB"
  | "MOBILE"
  | "DESKTOP"
  | "POS"
  | "OPERATIONS"
  | "CUSTOMER"
  | "KIOSK"
  | "DISPLAY"
  | "DEVICE"
  | "OTHER";

export type ApplicationStatus =
  | "DRAFT"
  | "VALIDATED"
  | "PUBLISHED"
  | "DEPRECATED"
  | "RETIRED";

export type ExperienceVersionStatus =
  | "DRAFT"
  | "VALIDATED"
  | "PUBLISHED"
  | "SUPERSEDED";

export type ExperienceAssignmentStatus =
  | "ASSIGNED"
  | "PROVISIONING"
  | "READY"
  | "FAILED"
  | "DEACTIVATING"
  | "DEACTIVATED"
  | "SUPERSEDED";

export type ApplicationBindingStatus =
  | "PENDING"
  | "PROVISIONING"
  | "ACTIVE"
  | "FAILED"
  | "REVOKED";

export type ExperienceClientKind =
  | "PUBLIC"
  | "CONFIDENTIAL"
  | "SERVICE_ACCOUNT";

export type ClientRegistrationStatus =
  | "PENDING"
  | "ACTIVE"
  | "FAILED"
  | "REVOKED";

export type DomainKind = "SUBDOMAIN" | "CUSTOM";

export type DomainOwnershipStatus =
  | "PENDING"
  | "VERIFIED"
  | "FAILED"
  | "REVOKED";

export type DnsStatus =
  | "PENDING"
  | "VERIFIED"
  | "FAILED"
  | "NOT_REQUIRED";

export type TlsStatus =
  | "PENDING"
  | "PROVISIONING"
  | "ACTIVE"
  | "FAILED"
  | "EXPIRED"
  | "REVOKED";

export type RouteStatus =
  | "PENDING"
  | "ACTIVE"
  | "FAILED"
  | "DEACTIVATED";

export type DomainBindingStatus =
  | "PENDING"
  | "ACTIVE"
  | "FAILED"
  | "DEACTIVATED";

export type ExperienceDriftStatus =
  | "NONE"
  | "DETECTED"
  | "REMEDIATING"
  | "RESOLVED"
  | "UNKNOWN";

export type ExperienceProfile = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productId: string | null;
  profileStatus: ExperienceProfileStatus | string;
  compatibleRuntimeCodes: string[];
  compatibleDeploymentProfileCodes: string[];
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ExperienceApplication = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productId: string | null;
  applicationKind: ApplicationKind | string;
  experienceProfileId: string | null;
  applicationStatus: ApplicationStatus | string;
  latestVersion: number;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ExperienceApplicationVersion = {
  id: string;
  applicationId: string;
  versionNumber: number;
  productVersion: string | null;
  runtimeVersion: string | null;
  apiCompatibilityVersion: string | null;
  deploymentProfileCode: string | null;
  configurationBundleCode: string | null;
  entitlementSnapshotVersion: string | null;
  manifest: Record<string, unknown>;
  checksum: string;
  status: ExperienceVersionStatus | string;
  publishedAt: string | null;
  createdBy: string;
  createdAt: string;
};

export type TenantExperienceAssignment = {
  id: string;
  tenantId: string;
  productId: string;
  subscriptionId: string | null;
  accountId: string | null;
  experienceProfileId: string | null;
  assignmentStatus: ExperienceAssignmentStatus | string;
  authorizationRowId: string | null;
  authorizationVersion: number | null;
  provisioningRequestId: string | null;
  workflowId: string | null;
  desiredManifest: Record<string, unknown>;
  appliedManifest: Record<string, unknown>;
  appliedChecksum: string | null;
  driftStatus: ExperienceDriftStatus | string;
  lastDeployedAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type TenantApplicationBinding = {
  id: string;
  assignmentId: string;
  tenantId: string;
  applicationId: string;
  applicationVersion: number;
  bindingStatus: ApplicationBindingStatus | string;
  clientRegistrationId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ExperienceClientRegistration = {
  id: string;
  assignmentId: string;
  tenantId: string;
  applicationBindingId: string | null;
  clientId: string;
  clientKind: ExperienceClientKind | string;
  keycloakTopologyId: string | null;
  keycloakClientRef: string | null;
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  webOrigins: string[];
  audiences: string[];
  scopes: string[];
  /** Vault reference only — never a plaintext secret. */
  credentialRef: string | null;
  registrationStatus: ClientRegistrationStatus | string;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ExperienceDomainBinding = {
  id: string;
  assignmentId: string;
  tenantId: string;
  hostname: string;
  domainKind: DomainKind | string;
  ownershipStatus: DomainOwnershipStatus | string;
  ownershipToken: string | null;
  dnsStatus: DnsStatus | string;
  tlsStatus: TlsStatus | string;
  /** Vault / ACME certificate reference — never PEM plaintext. */
  certificateRef: string | null;
  routeStatus: RouteStatus | string;
  bindingStatus: DomainBindingStatus | string;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ExperienceDeploymentRun = {
  id: string;
  assignmentId: string;
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

export type ExperienceEvidence = {
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

export type TenantExperienceAssignmentDetail = {
  assignment: TenantExperienceAssignment;
  runs: ExperienceDeploymentRun[];
  evidence: ExperienceEvidence[];
  bindings: TenantApplicationBinding[];
  clients: ExperienceClientRegistration[];
  domains: ExperienceDomainBinding[];
};

export type ExperienceListPage<T> = {
  items: T[];
  total: number;
};
