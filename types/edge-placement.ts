/** P7.3 Placement & Capacity types (Edge Admin Console). */

export type PlacementRequestStatus =
  | "PENDING"
  | "EVALUATING"
  | "PLACED"
  | "REQUIRES_REVIEW"
  | "NO_CAPACITY"
  | "NO_COMPATIBLE_TARGET"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED"
  | "SUPERSEDED";

export type PlacementDecisionStatus = PlacementRequestStatus;

export type CapacityResourceType =
  | "CPU"
  | "MEMORY"
  | "STORAGE"
  | "DATABASE"
  | "CONNECTION"
  | "TENANT_SLOT"
  | "RUNTIME_INSTANCE"
  | "BANDWIDTH";

export type CapacityMeasurementSource = "DECLARED" | "OBSERVED";

export type CapacityInventoryStatus =
  | "ACTIVE"
  | "STALE"
  | "SUSPENDED"
  | "RETIRED";

export type CapacityReservationStatus =
  | "HELD"
  | "COMMITTED"
  | "RELEASED"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED";

export type PlacementPolicyStatus =
  | "DRAFT"
  | "ACTIVE"
  | "DEPRECATED"
  | "RETIRED";

export type CapacityRequirements = Partial<
  Record<CapacityResourceType | string, number>
>;

export type PlacementListPage<T> = {
  items: T[];
  total: number;
};

export type PlacementListQuery = {
  limit?: number;
  offset?: number;
  status?: string;
  q?: string;
};

export type PlacementRequestRecord = {
  id: string;
  idempotencyKey: string;
  correlationId: string;
  causationId: string | null;
  provisioningRequestId: string;
  authorizationRowId: string;
  authorizationId: string;
  authorizationVersion: number;
  accountId: string;
  subscriptionId: string;
  productId: string;
  productTenantId: string | null;
  productRegistryId: string;
  technicalVersionId: string;
  platformId: string | null;
  contractId: string;
  deploymentProfileId: string;
  requestedEnvironmentType: string;
  requestedDeploymentModel: string;
  requestedRegion: string | null;
  dataResidencyConstraints: Record<string, unknown>;
  securityClassification: string | null;
  availabilityRequirements: Record<string, unknown>;
  recoveryRequirements: Record<string, unknown>;
  capacityRequirements: CapacityRequirements;
  requestStatus: PlacementRequestStatus | string;
  actorId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PlacementDecisionRecord = {
  id: string;
  placementRequestId: string;
  decisionStatus: PlacementDecisionStatus | string;
  selectedPlatformId: string | null;
  selectedEnvironmentId: string | null;
  selectedProfileId: string | null;
  selectedRegion: string | null;
  selectedTechnicalVersionId: string | null;
  selectedContractId: string | null;
  selectedContractVersion: string | null;
  capacityReservationId: string | null;
  algorithmName: string;
  algorithmVersion: string;
  policyId: string | null;
  policyVersion: number | null;
  evaluationSnapshot: Record<string, unknown>;
  scoringBreakdown: Record<string, unknown>;
  policyEvaluationSnapshot: Record<string, unknown>;
  rejectionSummary: string | null;
  decidedAt: string | null;
  expiresAt: string | null;
  actorId: string | null;
  correlationId: string;
  idempotencyKey: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type PlacementCandidateEvaluation = {
  id: string;
  decisionId: string;
  placementRequestId: string;
  platformId: string;
  environmentId: string;
  profileId: string;
  rank: number | null;
  passedHardConstraints: boolean;
  hardConstraintFailures: string[];
  compatibilityResult: string | null;
  score: number | null;
  scoringBreakdown: Record<string, unknown>;
  capacitySnapshot: Record<string, unknown>;
  excluded: boolean;
  exclusionReason: string | null;
  createdAt: string;
};

export type CapacityInventoryRecord = {
  id: string;
  platformId: string;
  environmentId: string;
  resourceType: CapacityResourceType | string;
  unit: string;
  totalCapacity: number;
  unavailableCapacity: number;
  reservedCapacity: number;
  allocatedCapacity: number;
  availableCapacity: number;
  measurementSource: CapacityMeasurementSource | string;
  measuredAt: string;
  validUntil: string;
  capacityStatus: CapacityInventoryStatus | string;
  version: number;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CapacityReservationRecord = {
  id: string;
  placementRequestId: string;
  placementDecisionId: string | null;
  platformId: string;
  environmentId: string;
  resourceQuantities: CapacityRequirements;
  reservationStatus: CapacityReservationStatus | string;
  idempotencyKey: string;
  expiresAt: string;
  releasedAt: string | null;
  releaseReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

export type PlacementPolicyRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  policyVersion: number;
  scope: Record<string, unknown>;
  hardConstraints: Record<string, unknown>;
  scoringWeights: Record<string, unknown>;
  algorithmVersion: string;
  policyStatus: PlacementPolicyStatus | string;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlacementHistoryEntry = {
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

export type CreatePlacementRequestInput = {
  idempotencyKey: string;
  provisioningRequestId: string;
  productRegistryId: string;
  technicalVersionId: string;
  contractId: string;
  deploymentProfileId: string;
  requestedEnvironmentType: string;
  requestedDeploymentModel: string;
  platformId?: string;
  requestedRegion?: string;
  dataResidencyConstraints?: Record<string, unknown>;
  securityClassification?: string;
  availabilityRequirements?: Record<string, unknown>;
  recoveryRequirements?: Record<string, unknown>;
  capacityRequirements?: CapacityRequirements;
  causationId?: string;
  metadata?: Record<string, unknown>;
};

export type EvaluatePlacementInput = {
  policyCode?: string;
  idempotencyKey?: string;
  holdTtlMs?: number;
};

export type ConfirmPlacementInput = {
  decisionId?: string;
};

export type CancelPlacementInput = {
  reason?: string;
};

export type ReEvaluatePlacementInput = {
  idempotencyKey: string;
  policyCode?: string;
};

export type EvaluatePlacementResult = {
  decision: PlacementDecisionRecord;
  candidates: PlacementCandidateEvaluation[];
};

export type UpsertCapacityInventoryInput = {
  platformId: string;
  environmentId: string;
  resourceType: CapacityResourceType | string;
  unit: string;
  totalCapacity: number;
  unavailableCapacity?: number;
  measurementSource?: CapacityMeasurementSource | string;
  measuredAt?: string;
  validUntil: string;
  capacityStatus?: CapacityInventoryStatus | string;
  metadata?: Record<string, unknown>;
};

export type PatchCapacityInventoryInput = {
  expectedVersion: number;
  totalCapacity?: number;
  unavailableCapacity?: number;
  unit?: string;
  measuredAt?: string;
  validUntil?: string;
  capacityStatus?: CapacityInventoryStatus | string;
  metadata?: Record<string, unknown>;
};

export type ReleaseReservationInput = {
  expectedVersion: number;
  reason?: string;
};

export type CreatePlacementPolicyInput = {
  code: string;
  name: string;
  description?: string;
  policyVersion?: number;
  scope?: Record<string, unknown>;
  hardConstraints?: Record<string, unknown>;
  scoringWeights?: Record<string, unknown>;
  algorithmVersion?: string;
  policyStatus?: PlacementPolicyStatus | string;
};

export type PatchPlacementPolicyInput = {
  expectedVersion: number;
  name?: string;
  description?: string;
  scope?: Record<string, unknown>;
  hardConstraints?: Record<string, unknown>;
  scoringWeights?: Record<string, unknown>;
  algorithmVersion?: string;
  policyStatus?: PlacementPolicyStatus | string;
  policyVersion?: number;
};

export type CapacityInventoryQuery = PlacementListQuery & {
  platformId?: string;
  environmentId?: string;
  resourceType?: string;
};

export type CapacityReservationsQuery = PlacementListQuery & {
  placementRequestId?: string;
  environmentId?: string;
};

export type PlacementHistoryQuery = PlacementListQuery & {
  resourceType?: string;
  resourceId?: string;
};
