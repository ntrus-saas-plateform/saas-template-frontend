export type EdgeAdministrator = {
  id: string;
  email?: string;
  displayName?: string;
  status?: string;
  externalIdentityId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type EdgeVertical = {
  id: string;
  code?: string;
  name?: string;
  status?: string;
  slug?: string;
  description?: string | null;
};

export type EdgeMembership = {
  id: string;
  administratorId?: string;
  verticalId: string;
  status?: string;
};

export type EdgeWorkspaceOption = {
  membership: EdgeMembership;
  vertical: EdgeVertical;
};

export type EdgeActiveWorkspace = {
  session?: {
    id?: string;
    verticalId?: string;
    membershipId?: string;
    expiresAt?: string;
  };
  vertical?: EdgeVertical;
  membership?: EdgeMembership;
  administrator?: EdgeAdministrator;
};

export type EdgeBootstrapPayload = {
  me: EdgeAdministrator;
  workspaces: EdgeWorkspaceOption[];
  activeWorkspace: EdgeActiveWorkspace | null;
  permissions: string[];
  activeVerticalId: string | null;
  hasWorkspaceSession: boolean;
};

/** Product lifecycle statuses from Edge catalog API. */
export type EdgeProductLifecycleStatus =
  | "DRAFT"
  | "CONFIGURING"
  | "TECHNICAL_VALIDATION"
  | "READY_FOR_PUBLICATION"
  | "PUBLISHED"
  | "DEPRECATED"
  | "RETIRED"
  | "ARCHIVED";

export type EdgeCommercialAvailability =
  | "UNAVAILABLE"
  | "INTERNAL_ONLY"
  | "BETA"
  | "CONTROLLED_ROLLOUT"
  | "AVAILABLE"
  | "DEPRECATED";

export type EdgeProduct = {
  id: string;
  code: string;
  slug: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  verticalId: string;
  productType?: string | null;
  lifecycleStatus: EdgeProductLifecycleStatus;
  technicalStatus?: string | null;
  commercialAvailability?: EdgeCommercialAvailability;
  defaultVersionId?: string | null;
  iconRef?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  rowVersion?: number;
};

export type EdgeProductVersionStatus =
  | "DRAFT"
  | "CONFIGURING"
  | "VALIDATION"
  | "VALIDATED"
  | "PUBLISHED"
  | "DEPRECATED"
  | "RETIRED"
  | "ARCHIVED";

export type EdgeProductReleaseType =
  | "MAJOR"
  | "MINOR"
  | "PATCH"
  | "HOTFIX"
  | "SECURITY"
  | "LTS";

export type EdgeProductVersion = {
  id: string;
  productId: string;
  version: string;
  releaseName?: string | null;
  description?: string | null;
  status: EdgeProductVersionStatus;
  releaseType: EdgeProductReleaseType;
  apiCompatibility?: string | null;
  eventCompatibility?: string | null;
  minimumBackendVersion?: string | null;
  releaseDate?: string | null;
  effectiveFrom?: string | null;
  deprecatedAt?: string | null;
  retiredAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  createdBy?: string | null;
};

export type EdgeMarketSegment = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  verticalId: string;
  parentSegmentId?: string | null;
  status?: string;
  version?: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type EdgeBusinessProfile = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  verticalId: string;
  segmentId?: string | null;
  status?: string;
  version?: number;
  attributesSchema?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type EdgeOperatingModel = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  dimension?: string | null;
  verticalId?: string | null;
  status?: string;
  version?: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type EdgeCapability = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  technicalStatus?: string | null;
  commercialAvailability?: string | null;
  ownerRef?: string | null;
  version?: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type EdgeProductCapabilityMapping = {
  id: string;
  productId: string;
  productVersionId?: string | null;
  capabilityId: string;
  classification: string;
  technicalStatus?: string | null;
  commercialAvailability?: string | null;
  restrictions?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type EdgeProductBackendBinding = {
  id: string;
  productId: string;
  productVersionId?: string | null;
  backendId: string;
  bindingType: string;
  deploymentMode?: string | null;
  compatibilityStatus?: string | null;
  effectiveFrom?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export type EdgeBackend = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  backendType?: string | null;
  lifecycleStatus?: string;
  deploymentModes?: readonly unknown[];
  supportedProtocols?: readonly unknown[];
  supportedApiVersions?: readonly unknown[];
  supportedEventVersions?: readonly unknown[];
  securityProfile?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type EdgeReadinessResult =
  | "NOT_READY"
  | "NEEDS_REVIEW"
  | "READY"
  | "BLOCKED";

export type EdgeReadinessCheck = {
  code: string;
  passed: boolean;
  message: string;
};

export type EdgeReadinessEvaluation = {
  id: string;
  productId: string;
  productVersionId: string;
  profileId?: string | null;
  result: EdgeReadinessResult;
  checks?: readonly EdgeReadinessCheck[];
  blockers?: readonly string[];
  warnings?: readonly string[];
  triggeredBy?: string | null;
  createdAt?: string;
};

export type EdgeProductCompatibility = {
  id: string;
  productId: string;
  productVersionId?: string | null;
  targetType: string;
  targetId: string;
  status: string;
  justification?: string | null;
  restrictions?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
  validatedBy?: string | null;
  validatedAt?: string | null;
  createdAt?: string;
};

export type CreateEdgeProductInput = {
  code: string;
  slug: string;
  name: string;
  verticalId: string;
  shortDescription?: string | null;
  description?: string | null;
  productType?: string | null;
  technicalStatus?: string | null;
  commercialAvailability?: EdgeCommercialAvailability;
  iconRef?: string | null;
  metadata?: Record<string, unknown>;
};

export type UpdateEdgeProductInput = {
  name?: string;
  shortDescription?: string | null;
  description?: string | null;
  productType?: string | null;
  technicalStatus?: string | null;
  commercialAvailability?: EdgeCommercialAvailability;
  iconRef?: string | null;
  metadata?: Record<string, unknown>;
};

export type CreateEdgeProductVersionInput = {
  version: string;
  releaseType: EdgeProductReleaseType;
  releaseName?: string | null;
  description?: string | null;
  apiCompatibility?: string | null;
  eventCompatibility?: string | null;
  minimumBackendVersion?: string | null;
  metadata?: Record<string, unknown>;
};

export type CreateEdgeMarketSegmentInput = {
  code: string;
  name: string;
  verticalId: string;
  description?: string | null;
  parentSegmentId?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
};

export type EvaluateEdgeReadinessInput = {
  productVersionId: string;
  profileId?: string | null;
  profileCode?: string | null;
};

export type PublishEdgeProductInput = {
  productVersionId: string;
  profileId?: string | null;
  approvalRefs?: readonly unknown[];
};

export type EdgeCommercialMarket = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  verticalId: string;
  geographicScope: string | null;
  marketStatus: string;
  researchStatus: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type EdgeIcpDefinition = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  verticalId: string;
  productId: string;
  status: string;
  version: number;
  attributes?: Record<string, unknown>;
  scoring?: Record<string, unknown>;
};

export type EdgeSolutionPackage = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productId: string;
  verticalId: string;
  status: string;
  version: number;
};

export type EdgeCommercialPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productId: string;
  verticalId: string;
  planTier: string;
  solutionPackageId: string | null;
  status: string;
  version: number;
};

export type EdgeCommercialAddon = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productId: string;
  addonType: string;
  status: string;
  version: number;
};

export type EdgePriceBook = {
  id: string;
  code: string;
  name: string;
  productId: string;
  currency: string;
  geographicScope: string | null;
  status: string;
  version: number;
};

export type EdgePricingUnit = {
  id: string;
  code: string;
  name: string;
};

export type EdgeCommercialReadinessEvaluation = {
  id: string;
  offerType: string;
  offerId: string;
  productId: string;
  result: string;
  checks: unknown[];
  blockers: unknown[];
  warnings: unknown[];
  createdAt?: string;
};

export type EdgeCommercialMarketsPage = {
  items: EdgeCommercialMarket[];
  total: number;
};
