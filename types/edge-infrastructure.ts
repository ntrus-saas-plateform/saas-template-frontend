export type InfrastructureProviderRecord = {
  id: string;
  code: string;
  name: string;
  providerVersion: string;
  providerKind: string;
  operationalStatus: string;
  capabilities: Record<string, unknown>;
  supportedRegions: string[];
  supportedResourceTypes: string[];
  supportedDatabaseEngines: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ResourcePlanRecord = {
  id: string;
  tenantId: string;
  productId: string;
  subscriptionId: string | null;
  authorizationId: string | null;
  placementDecisionId: string | null;
  reservationId: string | null;
  providerId: string;
  region: string;
  databaseEngine: string;
  databaseTopology: string;
  planFingerprint: string;
  status: string;
  currentVersion: number;
  workflowId: string | null;
  validationErrors: unknown[];
  securityClassification: string;
  createdAt: string;
  updatedAt: string;
};

export type InfrastructureResourceRecord = {
  id: string;
  planId: string;
  tenantId: string;
  productId: string;
  providerId: string;
  resourceType: string;
  providerResourceId: string | null;
  environment: string;
  region: string;
  status: string;
  healthStatus: string;
  driftStatus: string;
  deletionProtection: boolean;
  configurationFingerprint: string | null;
  workflowId: string | null;
  lastReconciledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DatabaseResourceRecord = {
  id: string;
  resourceId: string;
  planId: string;
  tenantId: string;
  productId: string;
  databaseEngine: string;
  engineVersion: string | null;
  providerId: string;
  databaseName: string;
  endpointRef: string | null;
  credentialRef: string | null;
  isolationVerified: boolean;
  connectivityVerified: boolean;
  leastPrivilegeVerified: boolean;
  tlsRequired: boolean;
  publicEndpoint: boolean;
  status: string;
  workflowId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResourceBackupRecord = {
  id: string;
  resourceId: string;
  databaseResourceId: string | null;
  providerBackupId: string | null;
  backupType: string;
  status: string;
  integrityVerified: boolean;
  restorableVerified: boolean;
  encrypted: boolean;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
};

export type ResourceHistoryRecord = {
  id: string;
  resourceType: string;
  resourceId: string;
  fromStatus: string | null;
  toStatus: string | null;
  action: string;
  reason: string | null;
  actorId: string;
  createdAt: string;
};
