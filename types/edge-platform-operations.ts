/**
 * P9 — Platform Operations & Service Management (Edge Admin Console).
 * Mirrors backend domain records (camelCase). Dates are ISO strings from the BFF.
 * Does NOT invent live health — UNAVAILABLE / UNKNOWN stay honest.
 */

export type PlatformServiceRecord = {
  id: string;
  serviceCode: string;
  serviceSlug: string;
  displayName: string;
  description: string | null;
  category: string;
  serviceType: string;
  lifecycleStatus: string;
  observationStatus: string;
  businessCriticality: string;
  technicalCriticality: string;
  environment: string;
  region: string | null;
  operationalTeam: string | null;
  serviceOwnerId: string | null;
  technicalOwnerId: string | null;
  healthCheckRef: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type ServiceDependencyRecord = {
  id: string;
  serviceId: string;
  dependsOnServiceId: string;
  dependencyType: string;
  criticality: string;
  description: string | null;
};

export type PlatformServiceDetail = {
  service: PlatformServiceRecord;
  dependencies: ServiceDependencyRecord[];
  dependents: ServiceDependencyRecord[];
};

export type ServiceCatalogListPage = {
  items: PlatformServiceRecord[];
  total: number;
};

/** P9.1 overview stub — catalog counts only; incidents/alerts may be UNAVAILABLE. */
export type OperationsOverview = {
  availability: string;
  note: string;
  catalog: { totalServices: number; observation: string };
  activeIncidents: { availability: string; integration: string };
  activeAlerts: { availability: string; integration: string };
  computedAt: string;
};

export type RegisterPlatformServiceBody = {
  serviceCode: string;
  displayName: string;
  description?: string | null;
  category?: string;
  environment?: string;
  region?: string | null;
  operationalTeam?: string | null;
  observationStatus?: string;
};

export type OperationsListPage<T> = {
  items: T[];
  total: number;
};

export type OperationsListFilter = {
  status?: string;
  serviceId?: string;
  limit?: number;
  offset?: number;
};

// --- Alerts -----------------------------------------------------------------

export type OperationalAlertRecord = {
  id: string;
  fingerprint: string;
  title: string;
  severity: string;
  status: string;
  serviceId: string | null;
  sourceSystem: string;
  environment: string | null;
  region: string | null;
  labels: Record<string, unknown>;
  annotations: Record<string, unknown>;
  incidentId: string | null;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  suppressionReason: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrenceCount: number;
  correlationId: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type IngestAlertBody = {
  fingerprint: string;
  title: string;
  severity?: string;
  status?: string;
  serviceId?: string | null;
  sourceSystem: string;
  environment?: string | null;
  region?: string | null;
  labels?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  correlationId?: string | null;
};

export type IngestAlertResult = {
  alert: OperationalAlertRecord;
  deduplicated: boolean;
};

export type AckAlertBody = {
  expectedVersion?: number;
};

export type ResolveAlertBody = {
  expectedVersion?: number;
  suppressionReason?: string | null;
};

// --- Incidents --------------------------------------------------------------

export type IncidentRecord = {
  id: string;
  incidentNumber: string;
  title: string;
  description: string | null;
  category: string;
  severity: string;
  priority: string;
  status: string;
  isMajor: boolean;
  serviceId: string | null;
  environment: string | null;
  region: string | null;
  detectionSource: string | null;
  detectedAt: string;
  acknowledgedAt: string | null;
  mitigatedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  reporterId: string | null;
  commanderId: string | null;
  assignedTeam: string | null;
  assignedTo: string | null;
  resolutionSummary: string | null;
  rootCauseRef: string | null;
  evidence: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CreateIncidentBody = {
  title: string;
  description?: string | null;
  category?: string;
  severity?: string;
  priority?: string;
  isMajor?: boolean;
  serviceId?: string | null;
  environment?: string | null;
  region?: string | null;
  detectionSource?: string | null;
  assignedTeam?: string | null;
  assignedTo?: string | null;
  evidence?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type TransitionIncidentBody = {
  toStatus: string;
  expectedVersion?: number;
  resolutionSummary?: string | null;
  commanderId?: string | null;
  assignedTo?: string | null;
  assignedTeam?: string | null;
};

export type DeclareMajorIncidentBody = {
  commanderId?: string | null;
  expectedVersion?: number;
};

// --- Problems ---------------------------------------------------------------

export type ProblemRecord = {
  id: string;
  problemNumber: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  ownerId: string | null;
  serviceId: string | null;
  rootCauseSummary: string | null;
  rootCauseConfirmed: boolean;
  rootCauseReviewerId: string | null;
  workaround: string | null;
  dueAt: string | null;
  evidence: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CreateProblemBody = {
  title: string;
  description?: string | null;
  priority?: string;
  ownerId?: string | null;
  serviceId?: string | null;
  workaround?: string | null;
  dueAt?: string | null;
  evidence?: Record<string, unknown>;
};

export type ConfirmRootCauseBody = {
  rootCauseSummary: string;
  evidence?: Record<string, unknown>;
};

export type LinkProblemIncidentBody = {
  incidentId: string;
};

// --- Changes ----------------------------------------------------------------

export type ChangeRequestRecord = {
  id: string;
  changeNumber: string;
  title: string;
  description: string | null;
  changeType: string;
  status: string;
  requesterId: string;
  ownerId: string | null;
  responsibleTeam: string | null;
  serviceId: string | null;
  environment: string | null;
  riskLevel: string;
  implementationPlan: string | null;
  validationPlan: string | null;
  rollbackPlan: string | null;
  plannedStartAt: string | null;
  plannedEndAt: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  approverId: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  outcome: string | null;
  evidence: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CreateChangeBody = {
  title: string;
  description?: string | null;
  changeType?: string;
  ownerId?: string | null;
  responsibleTeam?: string | null;
  serviceId?: string | null;
  environment?: string | null;
  riskLevel?: string;
  implementationPlan?: string | null;
  validationPlan?: string | null;
  rollbackPlan?: string | null;
  plannedStartAt?: string | null;
  plannedEndAt?: string | null;
  evidence?: Record<string, unknown>;
};

export type RejectChangeBody = {
  rejectedReason: string;
  expectedVersion?: number;
};

export type ApproveChangeBody = {
  expectedVersion?: number;
};

export type SubmitChangeBody = {
  expectedVersion?: number;
};

// --- Maintenance ------------------------------------------------------------

export type MaintenanceWindowRecord = {
  id: string;
  title: string;
  maintenanceType: string;
  status: string;
  serviceId: string | null;
  environment: string | null;
  region: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  responsibleTeam: string | null;
  reason: string;
  riskLevel: string;
  communicationPlan: string | null;
  approvedBy: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateMaintenanceBody = {
  title: string;
  maintenanceType?: string;
  status?: string;
  serviceId?: string | null;
  environment?: string | null;
  region?: string | null;
  startsAt: string;
  endsAt: string;
  timezone?: string;
  responsibleTeam?: string | null;
  reason: string;
  riskLevel?: string;
  communicationPlan?: string | null;
};

// --- Service requests -------------------------------------------------------

export type ServiceRequestRecord = {
  id: string;
  requestNumber: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  requesterId: string;
  assignedTo: string | null;
  assignedTeam: string | null;
  serviceId: string | null;
  environment: string | null;
  dueAt: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CreateServiceRequestBody = {
  category: string;
  title: string;
  description: string;
  priority?: string;
  assignedTo?: string | null;
  assignedTeam?: string | null;
  serviceId?: string | null;
  environment?: string | null;
  dueAt?: string | null;
};

// --- Tasks ------------------------------------------------------------------

export type OperationalTaskRecord = {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  assignedTeam: string | null;
  dueAt: string | null;
  relatedIncidentId: string | null;
  relatedChangeId: string | null;
  relatedServiceId: string | null;
  runbookRef: string | null;
  evidence: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOperationalTaskBody = {
  title: string;
  status?: string;
  priority?: string;
  assignedTo?: string | null;
  assignedTeam?: string | null;
  dueAt?: string | null;
  relatedIncidentId?: string | null;
  relatedChangeId?: string | null;
  relatedServiceId?: string | null;
  runbookRef?: string | null;
  evidence?: Record<string, unknown>;
};

// --- On-call ----------------------------------------------------------------

export type OnCallTeamRecord = {
  id: string;
  code: string;
  displayName: string;
  timezone: string;
  createdAt: string;
};

export type OnCallRotationRecord = {
  id: string;
  teamId: string;
  startsAt: string;
  endsAt: string;
  primaryResponderId: string;
  secondaryResponderId: string | null;
  createdAt: string;
};

export type CreateOnCallRotationBody = {
  teamId: string;
  startsAt: string;
  endsAt: string;
  primaryResponderId: string;
  secondaryResponderId?: string | null;
};

// --- SLO / capacity (Reliability) -------------------------------------------

export type SloDefinitionRecord = {
  id: string;
  serviceId: string;
  name: string;
  sliType: string;
  targetValue: number;
  windowDays: number;
  dataSourceRef: string | null;
  status: string;
  createdAt: string;
};

export type SloMeasurementRecord = {
  id: string;
  sloId: string;
  measuredValue: number;
  errorBudgetRemaining: number | null;
  windowStart: string;
  windowEnd: string;
  sourceSystem: string;
  observedAt: string;
};

export type CreateSloBody = {
  serviceId: string;
  name: string;
  sliType: string;
  targetValue: number;
  windowDays?: number;
  dataSourceRef?: string | null;
  status?: string;
};

export type RecordSloMeasurementBody = {
  measuredValue: number;
  errorBudgetRemaining?: number | null;
  windowStart: string;
  windowEnd: string;
  sourceSystem: string;
};

export type CapacityMeasurementRecord = {
  id: string;
  serviceId: string | null;
  metricName: string;
  metricValue: number;
  unit: string | null;
  thresholdWarning: number | null;
  thresholdCritical: number | null;
  sourceSystem: string;
  observedAt: string;
  createdAt: string;
};

export type RecordCapacityBody = {
  serviceId?: string | null;
  metricName: string;
  metricValue: number;
  unit?: string | null;
  thresholdWarning?: number | null;
  thresholdCritical?: number | null;
  sourceSystem: string;
  observedAt: string;
};

// --- Recovery ---------------------------------------------------------------

export type RecoveryOperationRecord = {
  id: string;
  operationType: string;
  status: string;
  serviceId: string | null;
  requesterId: string;
  approverId: string | null;
  externalEvidenceRef: string | null;
  outcome: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RequestRecoveryBody = {
  operationType: string;
  serviceId?: string | null;
  externalEvidenceRef?: string | null;
};

export type VerifyRecoveryBody = {
  externalEvidenceRef: string;
  outcome?: string | null;
};

// --- Runbooks ---------------------------------------------------------------

export type RunbookRecord = {
  id: string;
  code: string;
  title: string;
  serviceId: string | null;
  ownerId: string | null;
  currentVersion: number;
  createdAt: string;
};

// --- Status -----------------------------------------------------------------

export type StatusComponentRecord = {
  id: string;
  code: string;
  displayName: string;
  serviceId: string | null;
  publicStatus: string;
  updatedAt: string;
};

export type StatusPublicationRecord = {
  id: string;
  componentId: string;
  publicStatus: string;
  message: string;
  status: string;
  authorId: string;
  approverId: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type PublishStatusBody = {
  componentId: string;
  publicStatus: string;
  message: string;
};

export type ApproveStatusPublicationBody = {
  approved: boolean;
};

// --- Risks / exceptions -----------------------------------------------------

export type OperationalRiskRecord = {
  id: string;
  title: string;
  category: string;
  serviceId: string | null;
  probability: string;
  impact: string;
  status: string;
  ownerId: string | null;
  mitigationPlan: string | null;
  dueAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type OperationalExceptionRecord = {
  id: string;
  title: string;
  scope: string;
  justification: string;
  status: string;
  ownerId: string;
  approverId: string | null;
  expiresAt: string;
  compensatingControls: string | null;
  createdAt: string;
};

// --- Automation -------------------------------------------------------------

export type AutomationDefinitionRecord = {
  id: string;
  code: string;
  title: string;
  triggerType: string;
  definition: Record<string, unknown>;
  destructive: boolean;
  requiresApproval: boolean;
  status: string;
  createdAt: string;
};

export type AutomationExecutionRecord = {
  id: string;
  automationId: string;
  status: string;
  requestedBy: string;
  approvedBy: string | null;
  idempotencyKey: string;
  result: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type RequestAutomationExecutionBody = {
  automationId: string;
  idempotencyKey: string;
};

export type ApproveAutomationExecutionBody = {
  approved: boolean;
};

export type ExecuteAutomationBody = {
  result?: Record<string, unknown>;
};

// --- Analytics --------------------------------------------------------------

export type OperationsAnalytics = {
  availability: "PARTIAL" | "AVAILABLE" | "UNAVAILABLE" | string;
  catalog: { totalServices: number };
  alerts: { activeCount: number; totalCount: number };
  incidents: { openCount: number; majorCount: number; totalCount: number };
  changes: { openCount: number; totalCount: number };
  maintenance: { scheduledCount: number; totalCount: number };
  monitoringIntegrations: Array<{
    code: string;
    providerType: string;
    status: string;
    availability: "AVAILABLE" | "UNAVAILABLE" | "DEGRADED" | "NOT_CONFIGURED" | string;
  }>;
  computedAt: string;
  note?: string;
};
