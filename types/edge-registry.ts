/** P7.2 Product / Platform / Runtime Registry types (Edge Admin Console). */

export type RegistryLifecycleStatus =
  | "DRAFT"
  | "VALIDATING"
  | "CERTIFIED"
  | "SUSPENDED"
  | "DEPRECATED"
  | "RETIRED";

export type CertificationStatus =
  | "UNCERTIFIED"
  | "PENDING"
  | "CERTIFIED"
  | "REVOKED";

export type TechnicalVersionStatus =
  | "DRAFT"
  | "VALIDATING"
  | "PUBLISHED"
  | "DEPRECATED"
  | "RETIRED";

export type PlatformType =
  | "SHARED_SAAS_PLATFORM"
  | "DEDICATED_PLATFORM"
  | "PRIVATE_PLATFORM"
  | "ON_PREMISE_PLATFORM";

export type PlatformOperationalStatus =
  | "DRAFT"
  | "VALIDATING"
  | "ACTIVE"
  | "SUSPENDED"
  | "DEPRECATED"
  | "RETIRED";

export type RuntimeEnvironmentType =
  | "DEVELOPMENT"
  | "TEST"
  | "STAGING"
  | "PRODUCTION";

export type EnvironmentStatus =
  | "DRAFT"
  | "VALIDATING"
  | "ACTIVE"
  | "SUSPENDED"
  | "DEPRECATED"
  | "RETIRED";

export type DeploymentProfileCode =
  | "SHARED_SAAS"
  | "DEDICATED_DATA"
  | "DEDICATED_RUNTIME"
  | "PRIVATE_CLOUD"
  | "ON_PREMISE";

export type ProfileStatus =
  | "DRAFT"
  | "VALIDATING"
  | "ACTIVE"
  | "SUSPENDED"
  | "DEPRECATED"
  | "RETIRED";

export type ControlContractStatus =
  | "DRAFT"
  | "VALIDATING"
  | "CERTIFIED"
  | "PUBLISHED"
  | "DEPRECATED"
  | "RETIRED";

export type CompatibilityResult =
  | "COMPATIBLE"
  | "INCOMPATIBLE"
  | "REQUIRES_REVIEW";

export type RegistryResourceType =
  | "PRODUCT_REGISTRY"
  | "PRODUCT_TECHNICAL_VERSION"
  | "PRODUCT_PLATFORM"
  | "RUNTIME_ENVIRONMENT"
  | "DEPLOYMENT_PROFILE"
  | "PRODUCT_CONTROL_CONTRACT"
  | "COMPATIBILITY_EVALUATION";

export type RegistryListPage<T> = {
  items: T[];
  total: number;
};

export type RegistryListQuery = {
  limit?: number;
  offset?: number;
  status?: string;
  q?: string;
};

export type ProductRegistryRecord = {
  id: string;
  productId: string;
  code: string;
  name: string;
  description: string | null;
  verticalCategory: string | null;
  registryStatus: RegistryLifecycleStatus | string;
  certificationStatus: CertificationStatus | string;
  provisionable: boolean;
  technicalConstraints: Record<string, unknown>;
  declaredCapabilities: unknown[];
  compatiblePlatformIds: string[];
  compatibleEnvironmentIds: string[];
  compatibleProfileIds: string[];
  compatibleContractIds: string[];
  metadata: Record<string, unknown>;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductTechnicalVersion = {
  id: string;
  productRegistryId: string;
  technicalVersion: string;
  releaseChannel: string;
  versionStatus: TechnicalVersionStatus | string;
  compatibleContractVersions: unknown[];
  compatibleProfileCodes: unknown[];
  compatibleRuntimeTypes: unknown[];
  schemaCompatibility: Record<string, unknown>;
  apiCompatibility: Record<string, unknown>;
  availableFrom: string | null;
  supportEndsAt: string | null;
  certificationMetadata: Record<string, unknown>;
  changeSummary: string | null;
  immutableAfterPublish: boolean;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductPlatform = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  platformType: PlatformType | string;
  businessBackendId: string | null;
  allowedProductIds: string[];
  supportedEnvironmentTypes: unknown[];
  supportedProfileCodes: unknown[];
  connectivityReference: string | null;
  /** Opaque handle only — never plaintext secrets. */
  secureConfigRef: string | null;
  integrationProtocolVersion: string | null;
  controlContractVersion: string | null;
  certificationStatus: CertificationStatus | string;
  operationalStatus: PlatformOperationalStatus | string;
  declaredCapabilities: unknown[];
  constraints: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RuntimeEnvironment = {
  id: string;
  platformId: string;
  code: string;
  name: string;
  environmentType: RuntimeEnvironmentType | string;
  region: string | null;
  geoZone: string | null;
  securityClassification: string | null;
  dataClassification: string | null;
  availableCapabilities: unknown[];
  dataResidencyConstraints: Record<string, unknown>;
  backupPolicy: Record<string, unknown>;
  availabilityPolicy: Record<string, unknown>;
  allowedProfileCodes: unknown[];
  environmentStatus: EnvironmentStatus | string;
  governanceMetadata: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeploymentProfile = {
  id: string;
  code: DeploymentProfileCode | string;
  name: string;
  description: string | null;
  technicalRequirements: Record<string, unknown>;
  securityRequirements: Record<string, unknown>;
  isolationModel: string;
  connectivityModel: string;
  networkConstraints: Record<string, unknown>;
  dataResidencyConstraints: Record<string, unknown>;
  backupRequirements: Record<string, unknown>;
  availabilityRequirements: Record<string, unknown>;
  disasterRecoveryRequirements: Record<string, unknown>;
  compatibleProductIds: string[];
  compatiblePlatformTypes: unknown[];
  compatibleEnvironmentTypes: unknown[];
  certificationStatus: CertificationStatus | string;
  profileStatus: ProfileStatus | string;
  profileVersion: number;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductControlContract = {
  id: string;
  productId: string;
  platformId: string;
  contractCode: string;
  contractVersion: string;
  schemaVersion: string;
  supportedCapabilities: unknown[];
  supportedControlOperations: unknown[];
  connectivityModel: string;
  s2sAuthPolicy: Record<string, unknown>;
  signatureRequirements: Record<string, unknown>;
  publishedEvents: unknown[];
  consumedEvents: unknown[];
  backwardCompatible: boolean;
  forwardCompatible: boolean;
  versioningPolicy: Record<string, unknown>;
  effectiveFrom: string | null;
  deprecatedAt: string | null;
  contractStatus: ControlContractStatus | string;
  certificationEvidence: Record<string, unknown>;
  immutable: boolean;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompatibilityEvaluation = {
  id: string;
  correlationId: string;
  productRegistryId: string | null;
  technicalVersionId: string | null;
  platformId: string | null;
  environmentId: string | null;
  profileId: string | null;
  contractId: string | null;
  result: CompatibilityResult | string;
  rulesApplied: string[];
  reasons: string[];
  examinedRefs: Record<string, unknown>;
  evaluatedBy: string | null;
  evaluatedAt: string;
  createdAt: string;
};

export type RegistryHistoryEntry = {
  id: string;
  resourceType: RegistryResourceType | string;
  resourceId: string;
  fromStatus: string | null;
  toStatus: string | null;
  action: string;
  reason: string | null;
  actorId: string;
  details: Record<string, unknown>;
  createdAt: string;
};

export type CreateProductRegistryInput = {
  productId: string;
  code: string;
  name: string;
  description?: string | null;
  verticalCategory?: string | null;
  technicalConstraints?: Record<string, unknown>;
  declaredCapabilities?: unknown[];
  compatiblePlatformIds?: string[];
  compatibleEnvironmentIds?: string[];
  compatibleProfileIds?: string[];
  compatibleContractIds?: string[];
  metadata?: Record<string, unknown>;
};

export type UpdateProductRegistryInput = Partial<
  Omit<CreateProductRegistryInput, "productId" | "code">
> & {
  expectedVersion?: number;
};

export type CreateTechnicalVersionInput = {
  technicalVersion: string;
  releaseChannel: string;
  changeSummary?: string | null;
  compatibleContractVersions?: unknown[];
  compatibleProfileCodes?: unknown[];
  compatibleRuntimeTypes?: unknown[];
  schemaCompatibility?: Record<string, unknown>;
  apiCompatibility?: Record<string, unknown>;
  availableFrom?: string | null;
  supportEndsAt?: string | null;
  metadata?: Record<string, unknown>;
};

export type CreatePlatformInput = {
  code: string;
  name: string;
  description?: string | null;
  platformType: PlatformType | string;
  businessBackendId?: string | null;
  allowedProductIds?: string[];
  supportedEnvironmentTypes?: unknown[];
  supportedProfileCodes?: unknown[];
  connectivityReference?: string | null;
  /** Opaque reference handle — not a secret value. */
  secureConfigRef?: string | null;
  integrationProtocolVersion?: string | null;
  controlContractVersion?: string | null;
  declaredCapabilities?: unknown[];
  constraints?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type UpdatePlatformInput = Partial<Omit<CreatePlatformInput, "code">> & {
  expectedVersion?: number;
};

export type CreateEnvironmentInput = {
  platformId: string;
  code: string;
  name: string;
  environmentType: RuntimeEnvironmentType | string;
  region?: string | null;
  geoZone?: string | null;
  securityClassification?: string | null;
  dataClassification?: string | null;
  availableCapabilities?: unknown[];
  allowedProfileCodes?: unknown[];
  metadata?: Record<string, unknown>;
};

export type UpdateEnvironmentInput = Partial<
  Omit<CreateEnvironmentInput, "platformId" | "code">
> & {
  expectedVersion?: number;
};

export type UpdateProfileInput = {
  name?: string;
  description?: string | null;
  isolationModel?: string;
  connectivityModel?: string;
  technicalRequirements?: Record<string, unknown>;
  securityRequirements?: Record<string, unknown>;
  compatibleProductIds?: string[];
  metadata?: Record<string, unknown>;
};

export type CreateControlContractInput = {
  productId: string;
  platformId: string;
  contractCode: string;
  contractVersion: string;
  schemaVersion: string;
  connectivityModel: string;
  supportedCapabilities?: unknown[];
  supportedControlOperations?: unknown[];
  backwardCompatible?: boolean;
  forwardCompatible?: boolean;
  metadata?: Record<string, unknown>;
};

export type UpdateControlContractInput = Partial<
  Omit<
    CreateControlContractInput,
    "productId" | "platformId" | "contractCode" | "contractVersion"
  >
>;

export type EvaluateCompatibilityInput = {
  productRegistryId: string;
  technicalVersionId: string;
  platformId: string;
  environmentId: string;
  profileId: string;
  contractId: string;
};

export type RegistryTransitionInput = {
  toStatus: string;
  reason?: string;
};
