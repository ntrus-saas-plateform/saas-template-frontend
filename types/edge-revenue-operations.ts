/**
 * P11 — SaaS Business & Revenue Operations.
 * Mirrors backend domain (camelCase). Dates are ISO strings from the BFF.
 * Never invent financial amounts — honor dataQuality UNAVAILABLE.
 */

export type DataQuality = "MEASURED" | "ESTIMATED" | "UNAVAILABLE";

export type MetricDefinitionStatus = "DRAFT" | "PUBLISHED" | "DEPRECATED";

export type CurrencyTreatment = "NATIVE" | "CONVERT_TO_REPORTING" | "UNITLESS";

export type TimeBasis =
  | "PERIOD_END"
  | "PERIOD_START"
  | "PERIOD_AVERAGE"
  | "POINT_IN_TIME"
  | "TRAILING";

export type ForecastStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "PUBLISHED"
  | "SUPERSEDED"
  | "ARCHIVED";

export type ForecastScenarioType =
  | "BASE"
  | "UPSIDE"
  | "DOWNSIDE"
  | "STRESS"
  | "CUSTOM";

export type LeakageCaseStatus =
  | "DETECTED"
  | "TRIAGED"
  | "INVESTIGATING"
  | "CONFIRMED"
  | "REMEDIATING"
  | "RESOLVED"
  | "WRITTEN_OFF"
  | "FALSE_POSITIVE"
  | "CLOSED";

export type CommissionPlanStatus = "DRAFT" | "ACTIVE" | "DEPRECATED" | "ARCHIVED";

export type CommissionCalculationStatus =
  | "CALCULATED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "SUPERSEDED";

export type Availability = "AVAILABLE" | "PARTIAL" | "UNAVAILABLE";

export type RevenueOverviewMetric = {
  metricCode: string;
  value: number | null;
  currency: string | null;
  dataQuality: DataQuality | string;
  definitionVersion: number | null;
  asOf: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  sourceProvenance: Record<string, unknown> | null;
  note?: string;
};

export type RevenueOverview = {
  availability: Availability | string;
  asOf: string;
  metrics: RevenueOverviewMetric[];
  note?: string;
};

export type MetricDefinition = {
  id: string;
  code: string;
  name: string;
  description: string;
  formula: string;
  sources: unknown[];
  currencyTreatment: CurrencyTreatment | string;
  timeBasis: TimeBasis | string;
  status: MetricDefinitionStatus | string;
  version: number;
  currentPublishedVersionId: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MetricDefinitionVersion = {
  id: string;
  definitionId: string;
  versionNumber: number;
  code: string;
  name: string;
  description: string;
  formula: string;
  sources: unknown[];
  currencyTreatment: string;
  timeBasis: string;
  publishedAt: string;
  publishedBy: string;
  immutable: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type MetricSnapshot = {
  id: string;
  metricCode: string;
  definitionVersion: number;
  definitionVersionId: string | null;
  businessUnitId: string | null;
  revenueStreamId: string | null;
  periodStart: string;
  periodEnd: string;
  asOf: string;
  value: number | null;
  currency: string;
  dataQuality: DataQuality | string;
  sourceProvenance: Record<string, unknown>;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type MrrAmountBucket = {
  amount: number | null;
  dataQuality: DataQuality | string;
};

export type MrrMovementResult = {
  currency: string | null;
  skippedLineCount: number;
  notes: string[];
  mrrEnding: MrrAmountBucket;
  mrrNew: MrrAmountBucket;
  mrrExpansion: MrrAmountBucket;
  mrrContraction: MrrAmountBucket;
  mrrChurned: MrrAmountBucket;
  mrrReactivation: MrrAmountBucket;
  mrrNetNew: MrrAmountBucket;
  arrEnding: MrrAmountBucket;
};

export type ComputeMrrMovementResponse = {
  result: MrrMovementResult;
  snapshots: MetricSnapshot[];
};

export type NormalizedSubscriptionRevenueLine = {
  subscriptionRefId: string;
  customerRefId?: string;
  amount: number;
  currency: string;
  billingPeriod: string;
  isFreeTrial?: boolean;
  paymentStatus?: string;
  movementType: string;
  activeAtPeriodEnd?: boolean;
  activeAtPeriodStart?: boolean;
};

export type RevenueForecast = {
  id: string;
  code: string;
  name: string;
  businessUnitId: string | null;
  horizonStart: string;
  horizonEnd: string;
  currency: string;
  status: ForecastStatus | string;
  publishedAt: string | null;
  publishedBy: string | null;
  immutableAfterPublish: boolean;
  assumptions: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type RevenueForecastScenario = {
  id: string;
  forecastId: string;
  code: string;
  name: string;
  scenarioType: ForecastScenarioType | string;
  assumptions: Record<string, unknown>;
  status: string;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type RevenueLeakageCase = {
  id: string;
  caseNumber: string;
  title: string;
  description: string | null;
  businessUnitId: string | null;
  revenueStreamId: string | null;
  subscriptionRefId: string | null;
  invoiceRefId: string | null;
  detectedAmount: number | null;
  currency: string | null;
  dataQuality: DataQuality | string;
  status: LeakageCaseStatus | string;
  detectionSource: string;
  sourceProvenance: Record<string, unknown>;
  assignedTo: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CommissionPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: CommissionPlanStatus | string;
  effectiveFrom: string;
  effectiveTo: string | null;
  currency: string;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CommissionRule = {
  id: string;
  planId: string;
  code: string;
  name: string;
  ruleType: string;
  rate: number | null;
  definition: Record<string, unknown>;
  status: string;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CommissionCalculation = {
  id: string;
  planId: string;
  calculationKey: string;
  periodStart: string;
  periodEnd: string;
  asOf: string;
  inputSnapshot: Record<string, unknown>;
  resultSnapshot: Record<string, unknown>;
  totalAmount: number | null;
  currency: string;
  dataQuality: DataQuality | string;
  definitionVersion: number;
  sourceProvenance: Record<string, unknown>;
  status: CommissionCalculationStatus | string;
  immutable: boolean;
  calculatedBy: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CommissionPlansReadPlaceholder = {
  availability: Availability | string;
  note: string;
};

export type RetentionOverview = {
  availability: Availability | string;
  asOf: string;
  grr: RevenueOverviewMetric | null;
  nrr: RevenueOverviewMetric | null;
  snapshots?: RetentionSnapshot[];
  note?: string;
};

export type RetentionSnapshot = {
  id: string;
  cohortId: string;
  periodStart: string;
  periodEnd: string;
  asOf: string;
  metricCode: string;
  value: number | null;
  currency: string;
  dataQuality: DataQuality | string;
  definitionVersion: number;
  sourceProvenance: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  version: number;
};

export type BusinessAuditEvent = {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  actorId: string | null;
  correlationId: string | null;
  details: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  version: number;
};

export type RevenueListPage<T> = {
  items: T[];
  total: number;
};

export type RegisterMetricDefinitionBody = {
  code: string;
  name?: string;
  description?: string;
  formula?: string;
  sources?: unknown[];
  currencyTreatment?: string;
  timeBasis?: string;
  metadata?: Record<string, unknown>;
};

export type RecordMetricSnapshotBody = {
  metricCode: string;
  periodStart: string;
  periodEnd: string;
  asOf: string;
  value?: number | null;
  currency: string;
  dataQuality: DataQuality | string;
  sourceProvenance: Record<string, unknown>;
  businessUnitId?: string;
  revenueStreamId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export type ComputeMrrMovementBody = {
  periodStart: string;
  periodEnd: string;
  currency?: string;
  businessUnitId?: string;
  lines?: NormalizedSubscriptionRevenueLine[];
  excludeFreeTrials?: boolean;
  persistSnapshots?: boolean;
};

export type CreateRevenueForecastBody = {
  code: string;
  name: string;
  businessUnitId?: string;
  horizonStart: string;
  horizonEnd: string;
  currency: string;
  assumptions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type CreateForecastScenarioBody = {
  code: string;
  name: string;
  scenarioType?: string;
  assumptions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type CreateLeakageCaseBody = {
  title: string;
  detectionSource: string;
  description?: string;
  businessUnitId?: string;
  subscriptionRefId?: string;
  invoiceRefId?: string;
  detectedAmount?: number;
  currency?: string;
  dataQuality?: string;
  sourceProvenance?: Record<string, unknown>;
  caseNumber?: string;
};

export type TransitionLeakageCaseBody = {
  toStatus: string;
  resolutionNotes?: string;
  assignedTo?: string;
  expectedVersion?: number;
};

export type CreateCommissionPlanBody = {
  code: string;
  name: string;
  description?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  currency?: string;
  rules?: Array<{
    code: string;
    name: string;
    ruleType?: string;
    rate?: number;
    definition?: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
};

export type CalculateCommissionBody = {
  planId: string;
  calculationKey: string;
  periodStart: string;
  periodEnd: string;
  asOf?: string;
  basisAmount?: number | null;
  currency?: string;
  dataQuality?: string;
  inputSnapshot?: Record<string, unknown>;
  sourceProvenance?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type AppendBusinessAuditBody = {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  details?: Record<string, unknown>;
  correlationId?: string;
};
