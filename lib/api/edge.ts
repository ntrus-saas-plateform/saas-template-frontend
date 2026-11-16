import {
  OKAPI_EDGE_CSRF_COOKIE,
  OKAPI_EDGE_CSRF_HEADER,
} from "@/lib/edge-bff/csrf-constants";
import type {
  CreateEdgeMarketSegmentInput,
  CreateEdgeProductInput,
  CreateEdgeProductVersionInput,
  EdgeActiveWorkspace,
  EdgeAdministrator,
  EdgeBackend,
  EdgeBootstrapPayload,
  EdgeBusinessProfile,
  EdgeCapability,
  EdgeCommercialAddon,
  EdgeCommercialMarketsPage,
  EdgeCommercialPlan,
  EdgeCommercialReadinessEvaluation,
  EdgeIcpDefinition,
  EdgeMarketSegment,
  EdgeOperatingModel,
  EdgePriceBook,
  EdgePricingUnit,
  EdgeProduct,
  EdgeProductBackendBinding,
  EdgeProductCapabilityMapping,
  EdgeProductCompatibility,
  EdgeProductLifecycleStatus,
  EdgeProductVersion,
  EdgeReadinessEvaluation,
  EdgeSolutionPackage,
  EdgeVertical,
  EdgeWorkspaceOption,
  EvaluateEdgeReadinessInput,
  PublishEdgeProductInput,
  UpdateEdgeProductInput,
} from "@/types/edge";
import type {
  CompatibilityEvaluation,
  CreateControlContractInput,
  CreateEnvironmentInput,
  CreatePlatformInput,
  CreateProductRegistryInput,
  CreateTechnicalVersionInput,
  DeploymentProfile,
  EvaluateCompatibilityInput,
  ProductControlContract,
  ProductPlatform,
  ProductRegistryRecord,
  ProductTechnicalVersion,
  RegistryHistoryEntry,
  RegistryListPage,
  RegistryListQuery,
  RegistryTransitionInput,
  RuntimeEnvironment,
  UpdateControlContractInput,
  UpdateEnvironmentInput,
  UpdatePlatformInput,
  UpdateProductRegistryInput,
  UpdateProfileInput,
} from "@/types/edge-registry";
import type {
  KeycloakCapabilitiesRecord,
  KeycloakClientRecord,
  KeycloakEvidenceRecord,
  KeycloakHealthCheckRecord,
  KeycloakHistoryRecord,
  KeycloakOidcConfigurationRecord,
  KeycloakProviderRecord,
  KeycloakRealmRecord,
  KeycloakReconciliationRunRecord,
  KeycloakServerRecord,
  KeycloakTopologyDetail,
  KeycloakTopologyRecord,
} from "@/types/edge-keycloak";
import type {
  ConfigurationBundleRecord,
  ConfigurationDeploymentRunRecord,
  ConfigurationEvidenceRecord,
  ConfigurationListPage,
  ConfigurationSchemaRecord,
  ConfigurationTemplateRecord,
  EntitlementDeploymentRecord,
  TenantConfigurationAssignmentDetail,
  TenantConfigurationAssignmentRecord,
} from "@/types/edge-configuration";
import type {
  ExperienceApplication,
  ExperienceDeploymentRun,
  ExperienceDomainBinding,
  ExperienceEvidence,
  ExperienceListPage,
  ExperienceProfile,
  TenantExperienceAssignment,
  TenantExperienceAssignmentDetail,
} from "@/types/edge-experience";
import type {
  ActivationEvidence,
  ActivationListPage,
  ActivationRecord,
  ActivationRecordDetail,
  ActivationRun,
  ReadinessEvaluationDetail,
  TenantReadinessEvaluation,
} from "@/types/edge-activation";
import type {
  LifecycleEvidence,
  LifecycleListPage,
  LifecycleRecordDetail,
  LifecycleRun,
  TenantLifecycleRecord,
} from "@/types/edge-lifecycle";
import type {
  OnboardingEvidence,
  OnboardingJourney,
  OnboardingJourneyDetail,
  OnboardingListPage,
  OnboardingRun,
  OnboardingTemplate,
} from "@/types/edge-onboarding";
import type {
  ReconciliationEvidence,
  ReconciliationFinding,
  ReconciliationListPage,
  ReconciliationPolicy,
  ReconciliationRun,
  ReconciliationRunDetail,
  ReconciliationWaiver,
} from "@/types/edge-reconciliation";
import type {
  AgentCommand,
  AgentEvidence,
  ConnectivityAgent,
  ConnectivityAgentDetail,
  ConnectivityAgentListPage,
} from "@/types/edge-connectivity-agent";
import type {
  CertificationEvidence,
  CertificationEvidenceItem,
  CertificationListPage,
  CertificationPackage,
  CertificationPackageDetail,
  CertificationRun,
} from "@/types/edge-certification";
import type {
  ActivityEventRecord,
  ExceptionRecord,
  LifecycleRequestRecord,
  MigrationRequestRecord,
  ReconciliationFindingRecord,
  ReconciliationRunRecord,
  RecoveryRequestRecord,
  Tenant360Overview,
  TenantBulkOperationRecord,
  TenantHealthSnapshotRecord,
  TenantManagementListPage,
  LegalHoldChangeRequestRecord,
  RequestLegalHoldChangeBody,
  AuthorizeTenantDeprovisionBody,
  TenantLegalHoldUpdate,
  TenantPoliciesPatch,
  TenantPortfolioMetrics,
  TenantRegistryRecord,
  TenantRiskAssessmentRecord,
  TerminationRequestRecord,
} from "@/types/edge-tenant-management";
import type {
  AckAlertBody,
  AddServiceDependencyBody,
  ApproveAutomationExecutionBody,
  ApproveChangeBody,
  ApproveStatusPublicationBody,
  AutomationDefinitionRecord,
  AutomationExecutionRecord,
  CapacityMeasurementRecord,
  ChangeRequestRecord,
  ConfirmRootCauseBody,
  CreateAutomationBody,
  ConnectMonitoringSourceBody,
  CreateChangeBody,
  CreateIncidentBody,
  CreateMaintenanceBody,
  CreateOnCallRotationBody,
  CreateOperationalExceptionBody,
  CreateOperationalRiskBody,
  CreateOperationalTaskBody,
  CreateProblemBody,
  CreateReleaseBody,
  CreateRunbookBody,
  CreateServiceRequestBody,
  CreateSloBody,
  DeclareMajorIncidentBody,
  ExecuteAutomationBody,
  IngestAlertBody,
  IngestAlertResult,
  IncidentRecord,
  LinkProblemIncidentBody,
  MaintenanceWindowRecord,
  MonitoringProbeRecord,
  MonitoringSourceRecord,
  NotificationDeliveryRecord,
  OnCallRotationRecord,
  OperationalAlertRecord,
  OperationalExceptionRecord,
  OperationalRiskRecord,
  OperationalTaskRecord,
  OperationsAnalytics,
  OperationsListFilter,
  OperationsListPage,
  OperationsOverview,
  PlatformServiceDetail,
  PlatformServiceRecord,
  ProblemRecord,
  PublishStatusBody,
  RecordCapacityBody,
  RecordHealthSnapshotBody,
  RecordMonitoringProbeBody,
  RecordNotificationDeliveryBody,
  RecordSloMeasurementBody,
  RecoveryOperationRecord,
  RegisterPlatformServiceBody,
  RejectChangeBody,
  ReleaseRecord,
  RequestAutomationExecutionBody,
  RequestRecoveryBody,
  ResolveAlertBody,
  RunbookRecord,
  ServiceCatalogListPage,
  ServiceDependencyRecord,
  ServiceRequestRecord,
  SloDefinitionRecord,
  SloMeasurementRecord,
  StatusComponentRecord,
  StatusPublicationRecord,
  SubmitChangeBody,
  TransitionIncidentBody,
  TransitionReleaseBody,
  UpdateNotificationDeliveryStatusBody,
  UpdatePlatformServiceBody,
  VerifyRecoveryBody,
} from "@/types/edge-platform-operations";
import type {
  AcquisitionCommunication,
  AcquisitionLead,
  AcquisitionListFilter,
  AcquisitionListPage,
  AcquisitionOverview,
  AdvanceJourneyBody,
  Application,
  AttachPaymentBody,
  AttachQuoteReferenceBody,
  CaptureLeadBody,
  CheckoutSession,
  CompleteHandoffBody,
  ConversionFunnel,
  CreateApplicationDraftBody,
  CreateCheckoutBody,
  InitiateAcquisitionPaymentBody,
  CreateFormSchemaBody,
  CreateFormVersionBody,
  CreatePlanPresentationBody,
  CreateProductPresentationBody,
  CreateProspectBody,
  CreateQuoteRequestBody,
  CreateSegmentPresentationBody,
  CustomerPortalSnapshot,
  DecideQualificationBody,
  DocumentReference,
  DocumentRequirement,
  FormSchema,
  FormVersion,
  JourneyInstance,
  PlanPresentation,
  ProductContentVersion,
  ProductPresentation,
  PromoteLeadBody,
  Prospect,
  PublicFormPayload,
  PublicProductDiscoveryItem,
  PublicProductPage,
  PublishContentBody,
  QueueCommunicationBody,
  QuoteReference,
  QuoteRequest,
  RecordAnalyticsBody,
  RecordPaymentResultBody,
  RegisterDocumentBody,
  RequestHandoffBody,
  RequestInformationBody,
  ReviewDocumentBody,
  SegmentPresentation,
  StartQualificationBody,
  SubscriptionHandoff,
  TransitionApplicationBody,
  TransitionProspectBody,
} from "@/types/edge-acquisition";
import type {
  AppendBusinessAuditBody,
  BusinessAuditEvent,
  CalculateCommissionBody,
  CommissionCalculation,
  CommissionPlan,
  CommissionPlansReadPlaceholder,
  ComputeMrrMovementBody,
  ComputeMrrMovementResponse,
  CreateCommissionPlanBody,
  CreateForecastScenarioBody,
  CreateLeakageCaseBody,
  CreateRevenueForecastBody,
  MetricDefinition,
  MetricDefinitionVersion,
  MetricSnapshot,
  RecordMetricSnapshotBody,
  RegisterMetricDefinitionBody,
  RetentionOverview,
  RevenueForecast,
  RevenueForecastScenario,
  RevenueLeakageCase,
  RevenueListPage,
  RevenueOverview,
  TransitionLeakageCaseBody,
} from "@/types/edge-revenue-operations";
import type {
  CancelPlacementInput,
  CapacityInventoryQuery,
  CapacityInventoryRecord,
  CapacityReservationRecord,
  CapacityReservationsQuery,
  ConfirmPlacementInput,
  CreatePlacementPolicyInput,
  CreatePlacementRequestInput,
  EvaluatePlacementInput,
  EvaluatePlacementResult,
  PatchCapacityInventoryInput,
  PatchPlacementPolicyInput,
  PlacementCandidateEvaluation,
  PlacementDecisionRecord,
  PlacementHistoryEntry,
  PlacementHistoryQuery,
  PlacementListPage,
  PlacementListQuery,
  PlacementPolicyRecord,
  PlacementRequestRecord,
  ReEvaluatePlacementInput,
  ReleaseReservationInput,
  UpsertCapacityInventoryInput,
} from "@/types/edge-placement";
import type {
  AssignWorkflowTaskInput,
  CreateWorkflowDefinitionInput,
  CreateWorkflowInstanceInput,
  DecideWorkflowTaskInput,
  RejectWorkflowTaskInput,
  RetryWorkflowInput,
  WorkflowAttemptRecord,
  WorkflowCheckpointRecord,
  WorkflowCompensationRecord,
  WorkflowDeadLetterRecord,
  WorkflowDefinitionRecord,
  WorkflowHistoryEntry,
  WorkflowHumanTaskRecord,
  WorkflowInstanceRecord,
  WorkflowListPage,
  WorkflowListQuery,
  WorkflowReasonInput,
  WorkflowStepRecord,
  WorkflowWorkerRecord,
} from "@/types/edge-workflow";
import type {
  ControlExchangeRecord,
  CredentialBindingRecord,
  NegotiatedContractRecord,
  PatchProductControlEndpointInput,
  ProductControlCapabilityRecord,
  ProductControlEndpointRecord,
  ProductControlHealthCheckRecord,
  ProductControlHistoryEntry,
  ProductControlListPage,
  ProductControlListQuery,
  QuarantineProductControlEndpointInput,
  RegisterProductControlEndpointInput,
} from "@/types/edge-product-control";
import type {
  DatabaseResourceRecord,
  InfrastructureProviderRecord,
  InfrastructureResourceRecord,
  ResourceBackupRecord,
  ResourceHistoryRecord,
  ResourcePlanRecord,
} from "@/types/edge-infrastructure";

function toQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export class EdgeApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "EdgeApiError";
    this.status = status;
    this.body = body;
  }
}

function readEdgeCsrf(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${OKAPI_EDGE_CSRF_COOKIE}=([^;]*)`),
  );
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

async function edgeRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; pagination?: { total?: number } }> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Correlation-Id", crypto.randomUUID());

  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const csrf = readEdgeCsrf();
    if (csrf) headers.set(OKAPI_EDGE_CSRF_HEADER, csrf);
  }

  const url = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    pagination?: { total?: number };
    error?: { message?: string; code?: string };
  };

  if (!res.ok) {
    throw new EdgeApiError(
      json.error?.message ?? res.statusText ?? "Request failed",
      res.status,
      json,
    );
  }

  return { data: json.data as T, pagination: json.pagination };
}

async function edgeRequestText(
  path: string,
  init?: RequestInit,
): Promise<{ data: string; contentType: string | null }> {
  const headers = new Headers(init?.headers);
  headers.set("X-Correlation-Id", crypto.randomUUID());

  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const csrf = readEdgeCsrf();
    if (csrf) headers.set(OKAPI_EDGE_CSRF_HEADER, csrf);
  }

  const url = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new EdgeApiError(
      json.error?.message ?? res.statusText ?? "Request failed",
      res.status,
      json,
    );
  }

  const data = await res.text();
  return { data, contentType: res.headers.get("content-type") };
}

export const edgeApi = {
  bootstrap: () =>
    edgeRequest<EdgeBootstrapPayload>("/api/edge-bootstrap"),

  session: () =>
    edgeRequest<{
      authenticated: boolean;
      user: {
        id?: string;
        username?: string;
        email?: string;
        name?: string;
      } | null;
      csrfToken: string;
      hasWorkspaceSession?: boolean;
      activeVerticalId?: string | null;
    }>("/api/edge-auth/session"),

  logout: async () => {
    const headers = new Headers();
    const csrf = readEdgeCsrf();
    if (csrf) headers.set(OKAPI_EDGE_CSRF_HEADER, csrf);
    const res = await fetch("/api/edge-auth/logout", {
      method: "POST",
      credentials: "include",
      headers,
    });
    const json = (await res.json().catch(() => ({}))) as {
      data?: { logoutUrl?: string };
      error?: { code?: string; message?: string };
    };
    if (!res.ok) {
      throw new EdgeApiError(
        json.error?.message ?? "Logout failed",
        res.status,
        json,
      );
    }
    return json.data?.logoutUrl ?? "/edge/login";
  },

  me: () =>
    edgeRequest<EdgeAdministrator>("/api/edge-backend/administrators/me"),

  listWorkspaces: () =>
    edgeRequest<EdgeWorkspaceOption[]>("/api/edge-backend/workspaces"),

  switchWorkspace: (verticalId: string) =>
    edgeRequest<{ session?: { verticalId?: string } }>(
      "/api/edge-backend/workspaces/switch",
      {
        method: "POST",
        body: JSON.stringify({ verticalId }),
      },
    ),

  activeWorkspace: () =>
    edgeRequest<EdgeActiveWorkspace>("/api/edge-backend/workspaces/active"),

  listVerticals: (query = "") =>
    edgeRequest<EdgeVertical[]>(
      `/api/edge-backend/verticals${query ? `?${query}` : ""}`,
    ),

  getVertical: (id: string) =>
    edgeRequest<EdgeVertical>(`/api/edge-backend/verticals/${id}`),

  listAdministrators: (query = "page=1&limit=50") =>
    edgeRequest<EdgeAdministrator[]>(
      `/api/edge-backend/administrators?${query}`,
    ),

  getAdministrator: (id: string) =>
    edgeRequest<EdgeAdministrator>(`/api/edge-backend/administrators/${id}`),

  listSecuritySessions: () =>
    edgeRequest<unknown[]>("/api/edge-backend/security/sessions"),

  listAuditEvents: (query = "page=1&limit=50") =>
    edgeRequest<unknown[]>(`/api/edge-backend/security/events?${query}`),

  getWorkspaceConfiguration: (verticalId: string) =>
    edgeRequest<unknown>(
      `/api/edge-backend/verticals/${verticalId}/configuration`,
    ),

  listVerticalMemberships: (verticalId: string) =>
    edgeRequest<unknown[]>(
      `/api/edge-backend/verticals/${verticalId}/memberships`,
    ),

  listProducts: (opts?: {
    verticalId?: string;
    status?: EdgeProductLifecycleStatus | string;
    page?: number;
    limit?: number;
  }) =>
    edgeRequest<EdgeProduct[]>(
      `/api/edge-backend/products${toQuery({
        page: opts?.page ?? 1,
        limit: opts?.limit ?? 50,
        verticalId: opts?.verticalId,
        status: opts?.status,
      })}`,
    ),

  getProduct: (id: string) =>
    edgeRequest<EdgeProduct>(`/api/edge-backend/products/${id}`),

  createProduct: (body: CreateEdgeProductInput) =>
    edgeRequest<EdgeProduct>("/api/edge-backend/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateProduct: (id: string, body: UpdateEdgeProductInput) =>
    edgeRequest<EdgeProduct>(`/api/edge-backend/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  transitionProductLifecycle: (
    id: string,
    toStatus: EdgeProductLifecycleStatus | string,
  ) =>
    edgeRequest<EdgeProduct>(`/api/edge-backend/products/${id}/lifecycle`, {
      method: "POST",
      body: JSON.stringify({ toStatus }),
    }),

  publishProduct: (id: string, body: PublishEdgeProductInput) =>
    edgeRequest<unknown>(`/api/edge-backend/products/${id}/publish`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listProductVersions: (productId: string) =>
    edgeRequest<EdgeProductVersion[]>(
      `/api/edge-backend/products/${productId}/versions`,
    ),

  createProductVersion: (
    productId: string,
    body: CreateEdgeProductVersionInput,
  ) =>
    edgeRequest<EdgeProductVersion>(
      `/api/edge-backend/products/${productId}/versions`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  listCompatibilities: (productId: string) =>
    edgeRequest<EdgeProductCompatibility[]>(
      `/api/edge-backend/products/${productId}/compatibilities`,
    ),

  listProductCapabilityMappings: (productId: string) =>
    edgeRequest<EdgeProductCapabilityMapping[]>(
      `/api/edge-backend/products/${productId}/capabilities`,
    ),

  listProductBackendBindings: (productId: string) =>
    edgeRequest<EdgeProductBackendBinding[]>(
      `/api/edge-backend/products/${productId}/bindings`,
    ),

  listMarketSegments: (verticalId: string) =>
    edgeRequest<EdgeMarketSegment[]>(
      `/api/edge-backend/market-segments${toQuery({ verticalId })}`,
    ),

  createMarketSegment: (body: CreateEdgeMarketSegmentInput) =>
    edgeRequest<EdgeMarketSegment>("/api/edge-backend/market-segments", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listBusinessProfiles: (verticalId?: string) =>
    edgeRequest<EdgeBusinessProfile[]>(
      `/api/edge-backend/business-profiles${toQuery({ verticalId })}`,
    ),

  listOperatingModels: (verticalId?: string) =>
    edgeRequest<EdgeOperatingModel[]>(
      `/api/edge-backend/operating-models${toQuery({ verticalId })}`,
    ),

  listCapabilities: () =>
    edgeRequest<EdgeCapability[]>("/api/edge-backend/capabilities"),

  listBackends: () =>
    edgeRequest<EdgeBackend[]>("/api/edge-backend/backends"),

  evaluateReadiness: (productId: string, body: EvaluateEdgeReadinessInput) =>
    edgeRequest<EdgeReadinessEvaluation>(
      `/api/edge-backend/products/${productId}/readiness`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  listReadinessEvaluations: (opts?: {
    productId?: string;
    page?: number;
    limit?: number;
  }) =>
    edgeRequest<EdgeReadinessEvaluation[]>(
      `/api/edge-backend/readiness-evaluations${toQuery({
        page: opts?.page ?? 1,
        limit: opts?.limit ?? 50,
        productId: opts?.productId,
      })}`,
    ),

  listCommercialMarkets: (opts?: {
    verticalId?: string;
    page?: number;
    limit?: number;
  }) =>
    edgeRequest<EdgeCommercialMarketsPage>(
      `/api/edge-backend/commercial/markets${toQuery({
        page: opts?.page ?? 1,
        limit: opts?.limit ?? 50,
        verticalId: opts?.verticalId,
      })}`,
    ),

  createCommercialMarket: (body: {
    code: string;
    name: string;
    verticalId: string;
    description?: string | null;
    geographicScope?: string | null;
  }) =>
    edgeRequest("/api/edge-backend/commercial/markets", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listCommercialIcps: (productId?: string) =>
    edgeRequest<EdgeIcpDefinition[]>(
      `/api/edge-backend/commercial/icps${toQuery({ productId })}`,
    ),

  createCommercialIcp: (body: {
    code: string;
    name: string;
    verticalId: string;
    productId: string;
    description?: string | null;
    segmentIds?: string[];
  }) =>
    edgeRequest<EdgeIcpDefinition>("/api/edge-backend/commercial/icps", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSolutionPackages: (productId?: string) =>
    edgeRequest<EdgeSolutionPackage[]>(
      `/api/edge-backend/commercial/packages${toQuery({ productId })}`,
    ),

  createSolutionPackage: (body: {
    code: string;
    name: string;
    productId: string;
    description?: string | null;
    packageType?: string | null;
  }) =>
    edgeRequest<EdgeSolutionPackage>("/api/edge-backend/commercial/packages", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listCommercialPlans: (productId?: string) =>
    edgeRequest<EdgeCommercialPlan[]>(
      `/api/edge-backend/commercial/plans${toQuery({ productId })}`,
    ),

  getCommercialPlan: (planId: string) =>
    edgeRequest<EdgeCommercialPlan & { capabilities?: unknown[] }>(
      `/api/edge-backend/commercial/plans/${planId}`,
    ),

  listPriceBookEntries: (priceBookId: string) =>
    edgeRequest(
      `/api/edge-backend/commercial/price-books/${priceBookId}/entries`,
    ),

  createCommercialPlan: (body: {
    code: string;
    name: string;
    productId: string;
    planTier: string;
    description?: string | null;
    solutionPackageId?: string | null;
  }) =>
    edgeRequest<EdgeCommercialPlan>("/api/edge-backend/commercial/plans", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  evaluateCommercialPlanReadiness: (
    planId: string,
    body?: { priceBookId?: string | null },
  ) =>
    edgeRequest<EdgeCommercialReadinessEvaluation>(
      `/api/edge-backend/commercial/plans/${planId}/readiness`,
      {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      },
    ),

  publishCommercialPlan: (
    planId: string,
    body?: { priceBookId?: string | null; approvalRefs?: unknown[] },
  ) =>
    edgeRequest(`/api/edge-backend/commercial/plans/${planId}/publish`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  listCommercialAddons: (productId?: string) =>
    edgeRequest<EdgeCommercialAddon[]>(
      `/api/edge-backend/commercial/addons${toQuery({ productId })}`,
    ),

  createCommercialAddon: (body: {
    code: string;
    name: string;
    productId: string;
    description?: string | null;
    addonType?: string;
  }) =>
    edgeRequest<EdgeCommercialAddon>("/api/edge-backend/commercial/addons", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listPriceBooks: (productId?: string) =>
    edgeRequest<EdgePriceBook[]>(
      `/api/edge-backend/commercial/price-books${toQuery({ productId })}`,
    ),

  createPriceBook: (body: {
    code: string;
    name: string;
    productId: string;
    currency: string;
    geographicScope?: string | null;
  }) =>
    edgeRequest<EdgePriceBook>("/api/edge-backend/commercial/price-books", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  addPriceBookEntry: (
    priceBookId: string,
    body: {
      commercialItemType: string;
      commercialItemId: string;
      amount: string;
      currency?: string;
      billingFrequency?: string | null;
    },
  ) =>
    edgeRequest(
      `/api/edge-backend/commercial/price-books/${priceBookId}/entries`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  listPricingUnits: () =>
    edgeRequest<EdgePricingUnit[]>("/api/edge-backend/commercial/pricing-units"),

  previewCommercialPrice: (body: {
    baseAmount: string;
    currency: string;
    quantity?: number;
    modelType: string;
    tiers?: { upTo: number | null; unitAmount: string }[];
  }) =>
    edgeRequest("/api/edge-backend/commercial/pricing/preview", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  configureCommercialOffer: (body: {
    mode?: string;
    productId: string;
    planId: string;
    packageId?: string | null;
    addonIds?: string[];
    geographicScope?: string | null;
    deploymentMode?: string | null;
    allowedGeographicScopes?: string[] | null;
    validatedDeploymentModes?: string[] | null;
  }) =>
    edgeRequest("/api/edge-backend/commercial/offers/configure", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getCommercialCatalog: (opts?: {
    view?: string;
    productId?: string;
    verticalId?: string;
  }) =>
    edgeRequest(
      `/api/edge-backend/commercial/catalog${toQuery({
        view: opts?.view ?? "GLOBAL",
        productId: opts?.productId,
        verticalId: opts?.verticalId,
      })}`,
    ),

  listPublicationSnapshots: (opts?: {
    offerType?: string;
    offerId?: string;
    productId?: string;
  }) =>
    edgeRequest(
      `/api/edge-backend/commercial/publication-snapshots${toQuery({
        offerType: opts?.offerType,
        offerId: opts?.offerId,
        productId: opts?.productId,
      })}`,
    ),

  listResearchProjects: (marketId?: string) =>
    edgeRequest(
      `/api/edge-backend/commercial/research-projects${toQuery({ marketId })}`,
    ),

  listSegmentIntelligence: (segmentId?: string) =>
    edgeRequest(
      `/api/edge-backend/commercial/segment-intelligence${toQuery({
        segmentId,
      })}`,
    ),

  listEnterpriseTemplates: (productId?: string) =>
    edgeRequest(
      `/api/edge-backend/commercial/enterprise-templates${toQuery({
        productId,
      })}`,
    ),

  createEnterpriseTemplate: (body: {
    code: string;
    name: string;
    productId: string;
    description?: string | null;
    solutionPackageId?: string | null;
    deploymentProfile?: Record<string, unknown>;
    supportProfile?: Record<string, unknown>;
    slaProfile?: Record<string, unknown>;
  }) =>
    edgeRequest("/api/edge-backend/commercial/enterprise-templates", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listPersonas: (productId?: string) =>
    edgeRequest(
      `/api/edge-backend/commercial/personas${toQuery({ productId })}`,
    ),

  listValuePropositions: (productId?: string) =>
    edgeRequest(
      `/api/edge-backend/commercial/value-propositions${toQuery({
        productId,
      })}`,
    ),

  listEligibilityPolicies: (productId?: string) =>
    edgeRequest(
      `/api/edge-backend/commercial/eligibility-policies${toQuery({
        productId,
      })}`,
    ),

  publishSolutionPackage: (packageId: string) =>
    edgeRequest(`/api/edge-backend/commercial/packages/${packageId}/publish`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  publishPriceBook: (priceBookId: string) =>
    edgeRequest(
      `/api/edge-backend/commercial/price-books/${priceBookId}/publish`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    ),

  publishCommercialAddon: (addonId: string) =>
    edgeRequest(`/api/edge-backend/commercial/addons/${addonId}/publish`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  publishEnterpriseTemplate: (templateId: string) =>
    edgeRequest(
      `/api/edge-backend/commercial/enterprise-templates/${templateId}/publish`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    ),

  evaluateOfferReadiness: (
    offerType: string,
    offerId: string,
    body?: { priceBookId?: string | null },
  ) =>
    edgeRequest(
      `/api/edge-backend/commercial/offers/${offerType}/${offerId}/readiness`,
      {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      },
    ),

  // --- P3 Marketing ---
  listMarketingStrategies: (opts?: {
    productId?: string;
    verticalId?: string;
  }) =>
    edgeRequest(
      `/api/edge-backend/marketing/strategies${toQuery({
        productId: opts?.productId,
        verticalId: opts?.verticalId,
      })}`,
    ),

  createMarketingStrategy: (body: {
    code: string;
    name: string;
    scopeType: string;
    description?: string | null;
    productId?: string | null;
    verticalId?: string | null;
  }) =>
    edgeRequest("/api/edge-backend/marketing/strategies", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listMarketingAudiences: (productId?: string) =>
    edgeRequest(
      `/api/edge-backend/marketing/audiences${toQuery({ productId })}`,
    ),

  createMarketingAudience: (body: {
    code: string;
    name: string;
    description?: string | null;
    productId?: string | null;
    verticalId?: string | null;
    rules?: {
      ruleType: string;
      criterionType: string;
      criterionRef?: string | null;
    }[];
  }) =>
    edgeRequest("/api/edge-backend/marketing/audiences", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listMarketingCampaigns: (opts?: { productId?: string; status?: string }) =>
    edgeRequest(
      `/api/edge-backend/marketing/campaigns${toQuery({
        productId: opts?.productId,
        status: opts?.status,
      })}`,
    ),

  createMarketingCampaign: (body: {
    code: string;
    name: string;
    campaignType: string;
    productId: string;
    description?: string | null;
    objective?: string | null;
    verticalId?: string | null;
    audienceId?: string | null;
    offerType?: string | null;
    offerId?: string | null;
  }) =>
    edgeRequest("/api/edge-backend/marketing/campaigns", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  transitionMarketingCampaign: (id: string, toStatus: string) =>
    edgeRequest(`/api/edge-backend/marketing/campaigns/${id}/transition`, {
      method: "POST",
      body: JSON.stringify({ toStatus }),
    }),

  approveMarketingCampaign: (
    id: string,
    body: {
      approvalType: string;
      decision: "APPROVED" | "REJECTED";
      notes?: string | null;
    },
  ) =>
    edgeRequest(`/api/edge-backend/marketing/campaigns/${id}/approvals`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  publishMarketingCampaign: (id: string) =>
    edgeRequest(`/api/edge-backend/marketing/campaigns/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  listMarketingForms: (productId?: string) =>
    edgeRequest(`/api/edge-backend/marketing/forms${toQuery({ productId })}`),

  createMarketingForm: (body: {
    code: string;
    name: string;
    formType: string;
    slug: string;
    productId?: string | null;
    campaignId?: string | null;
    fields?: unknown[];
  }) =>
    edgeRequest("/api/edge-backend/marketing/forms", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  publishMarketingForm: (id: string) =>
    edgeRequest(`/api/edge-backend/marketing/forms/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  listMarketingLeads: (opts?: { status?: string; productId?: string }) =>
    edgeRequest(
      `/api/edge-backend/marketing/leads${toQuery({
        status: opts?.status,
        productId: opts?.productId,
      })}`,
    ),

  scoreMarketingLead: (
    id: string,
    body: {
      signals: Record<string, boolean | number | null | undefined>;
      qualifyThreshold?: number;
    },
  ) =>
    edgeRequest(`/api/edge-backend/marketing/leads/${id}/score`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listMarketingBudgets: () =>
    edgeRequest("/api/edge-backend/marketing/budgets"),

  createMarketingBudget: (body: {
    code: string;
    name: string;
    scopeType: string;
    currency: string;
    plannedAmount: string;
    productId?: string | null;
  }) =>
    edgeRequest("/api/edge-backend/marketing/budgets", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listMarketingContents: (productId?: string) =>
    edgeRequest(`/api/edge-backend/marketing/contents${toQuery({ productId })}`),

  createMarketingContent: (body: {
    code: string;
    name: string;
    contentType: string;
    productId?: string | null;
    body?: Record<string, unknown>;
  }) =>
    edgeRequest("/api/edge-backend/marketing/contents", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  approveMarketingContent: (id: string) =>
    edgeRequest(`/api/edge-backend/marketing/contents/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  publishMarketingContent: (id: string) =>
    edgeRequest(`/api/edge-backend/marketing/contents/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  updateMarketingContentStudio: (
    id: string,
    studio: { version: 1; blocks: unknown[] },
  ) =>
    edgeRequest(`/api/edge-backend/marketing/contents/${id}/studio`, {
      method: "PUT",
      body: JSON.stringify({ studio }),
    }),

  listMarketingLandingPages: (productId?: string) =>
    edgeRequest(
      `/api/edge-backend/marketing/landing-pages${toQuery({ productId })}`,
    ),

  createMarketingLandingPage: (body: {
    code: string;
    name: string;
    pageType: string;
    slug: string;
    productId?: string | null;
    layout?: Record<string, unknown>;
  }) =>
    edgeRequest("/api/edge-backend/marketing/landing-pages", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  publishMarketingLandingPage: (id: string) =>
    edgeRequest(`/api/edge-backend/marketing/landing-pages/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  updateMarketingLandingStudio: (
    id: string,
    studio: { version: 1; blocks: unknown[] },
  ) =>
    edgeRequest(`/api/edge-backend/marketing/landing-pages/${id}/studio`, {
      method: "PUT",
      body: JSON.stringify({ studio }),
    }),

  listMarketingChannels: () =>
    edgeRequest("/api/edge-backend/marketing/channels"),

  upsertMarketingChannel: (body: {
    code: string;
    channelType: string;
    displayName: string;
    status?: string;
    providerRef?: string | null;
    secretRef?: string | null;
  }) =>
    edgeRequest("/api/edge-backend/marketing/channels", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listMarketingJourneys: () =>
    edgeRequest("/api/edge-backend/marketing/journeys"),

  createMarketingJourney: (body: {
    code: string;
    name: string;
    triggerType: string;
    productId?: string | null;
    definition: {
      entryStepKey: string;
      steps: { key: string; type: string; next?: string | null; toStatus?: string }[];
    };
  }) =>
    edgeRequest("/api/edge-backend/marketing/journeys", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  activateMarketingJourney: (id: string) =>
    edgeRequest(`/api/edge-backend/marketing/journeys/${id}/activate`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  listMarketingAttributionModels: () =>
    edgeRequest("/api/edge-backend/marketing/attribution/models"),

  listMarketingAnalyticsSnapshots: (scopeType?: string) =>
    edgeRequest(
      `/api/edge-backend/marketing/analytics/snapshots${toQuery({ scopeType })}`,
    ),

  getMarketingAnalyticsSummary: (scopeType?: string) =>
    edgeRequest(
      `/api/edge-backend/marketing/analytics/summary${toQuery({ scopeType })}`,
    ),

  createMarketingAnalyticsSnapshot: (body: {
    scopeType: string;
    scopeId?: string | null;
    periodStart: string;
    periodEnd: string;
    metrics: Record<string, unknown>;
    metricQuality: Record<string, string>;
  }) =>
    edgeRequest("/api/edge-backend/marketing/analytics/snapshots", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  resumeMarketingJourneyWaits: (limit?: number) =>
    edgeRequest("/api/edge-backend/marketing/journeys/waits/resume", {
      method: "POST",
      body: JSON.stringify({ limit }),
    }),

  assignMarketingLead: (id: string, assignedTo: string) =>
    edgeRequest(`/api/edge-backend/marketing/leads/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ assignedTo }),
    }),

  mergeMarketingLeads: (keepLeadId: string, duplicateLeadId: string) =>
    edgeRequest("/api/edge-backend/marketing/leads/merge", {
      method: "POST",
      body: JSON.stringify({ keepLeadId, duplicateLeadId }),
    }),

  // --- P4 Sales ---
  getSalesOverview: () => edgeRequest("/api/edge-backend/sales/overview"),

  listSalesAccounts: (opts?: {
    status?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest(
      `/api/edge-backend/sales/accounts${toQuery({
        status: opts?.status,
        q: opts?.q,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  createSalesAccount: (body: {
    legalName: string;
    tradeName?: string | null;
    accountType?: string;
    country?: string | null;
    industry?: string | null;
    website?: string | null;
    emailDomain?: string | null;
    legalIdentifier?: string | null;
    forceCreateDespiteDuplicates?: boolean;
  }) =>
    edgeRequest("/api/edge-backend/sales/accounts", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getSalesAccount: (id: string) =>
    edgeRequest(`/api/edge-backend/sales/accounts/${id}`),

  getSalesAccountTimeline: (id: string) =>
    edgeRequest(`/api/edge-backend/sales/accounts/${id}/timeline`),

  listSalesContacts: (opts?: { accountId?: string; q?: string }) =>
    edgeRequest(
      `/api/edge-backend/sales/contacts${toQuery({
        accountId: opts?.accountId,
        q: opts?.q,
      })}`,
    ),

  createSalesContact: (body: {
    accountId: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    jobTitle?: string | null;
    stakeholderType?: string;
  }) =>
    edgeRequest("/api/edge-backend/sales/contacts", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSalesLeads: (opts?: { status?: string; limit?: number }) =>
    edgeRequest(
      `/api/edge-backend/sales/leads${toQuery({
        status: opts?.status,
        limit: opts?.limit,
      })}`,
    ),

  receiveSalesLead: (body: {
    marketingLeadId: string;
    salesPriority?: string;
    slaHours?: number;
  }) =>
    edgeRequest("/api/edge-backend/sales/leads/receive", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  acceptSalesLead: (
    id: string,
    body?: {
      accountId?: string | null;
      createAccount?: {
        legalName: string;
        country?: string | null;
        emailDomain?: string | null;
      };
      contact?: {
        firstName: string;
        lastName: string;
        email?: string | null;
      };
    },
  ) =>
    edgeRequest(`/api/edge-backend/sales/leads/${id}/acceptance`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  rejectSalesLead: (
    id: string,
    body: { reasonCode?: string; reasonText?: string },
  ) =>
    edgeRequest(`/api/edge-backend/sales/leads/${id}/rejection`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  qualifySalesLead: (
    id: string,
    body: {
      needConfirmed: boolean;
      productFit: boolean;
      decisionCapacity: boolean;
      budgetIndicative?: string | null;
      decisionTimeline?: string | null;
    },
  ) =>
    edgeRequest(`/api/edge-backend/sales/leads/${id}/qualification`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSalesTeams: () => edgeRequest("/api/edge-backend/sales/teams"),

  createSalesTeam: (body: {
    code: string;
    name: string;
    description?: string | null;
  }) =>
    edgeRequest("/api/edge-backend/sales/teams", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSalesTasks: (opts?: { accountId?: string; status?: string }) =>
    edgeRequest(
      `/api/edge-backend/sales/tasks${toQuery({
        accountId: opts?.accountId,
        status: opts?.status,
      })}`,
    ),

  createSalesTask: (body: {
    title: string;
    accountId?: string | null;
    salesLeadId?: string | null;
    priority?: string;
    dueAt?: string | null;
  }) =>
    edgeRequest("/api/edge-backend/sales/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSalesPipelines: () => edgeRequest("/api/edge-backend/sales/pipelines"),

  getSalesPipelineBoard: (pipelineId?: string) =>
    edgeRequest(
      `/api/edge-backend/sales/pipeline/board${toQuery({ pipelineId })}`,
    ),

  listSalesOpportunities: (opts?: {
    status?: string;
    accountId?: string;
    limit?: number;
  }) =>
    edgeRequest(
      `/api/edge-backend/sales/opportunities${toQuery({
        status: opts?.status,
        accountId: opts?.accountId,
        limit: opts?.limit,
      })}`,
    ),

  createSalesOpportunity: (body: {
    name: string;
    accountId: string;
    salesLeadId?: string | null;
    productId?: string | null;
    estimatedValue?: number | null;
    currency?: string;
    needSummary?: string | null;
  }) =>
    edgeRequest("/api/edge-backend/sales/opportunities", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getSalesOpportunity: (id: string) =>
    edgeRequest(`/api/edge-backend/sales/opportunities/${id}`),

  transitionSalesOpportunityStage: (
    id: string,
    body: {
      toStageId: string;
      reasonCode?: string | null;
      reasonText?: string | null;
    },
  ) =>
    edgeRequest(`/api/edge-backend/sales/opportunities/${id}/stages`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSalesActivities: (opts?: {
    accountId?: string;
    opportunityId?: string;
    status?: string;
  }) =>
    edgeRequest(
      `/api/edge-backend/sales/activities${toQuery({
        accountId: opts?.accountId,
        opportunityId: opts?.opportunityId,
        status: opts?.status,
      })}`,
    ),

  createSalesActivity: (body: {
    activityType: string;
    subject: string;
    accountId?: string | null;
    opportunityId?: string | null;
    description?: string | null;
  }) =>
    edgeRequest("/api/edge-backend/sales/activities", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSalesQuotes: (opts?: { opportunityId?: string; status?: string }) =>
    edgeRequest(
      `/api/edge-backend/sales/quotes${toQuery({
        opportunityId: opts?.opportunityId,
        status: opts?.status,
      })}`,
    ),

  createSalesQuote: (body: {
    opportunityId: string;
    offerConfigurationId?: string | null;
    lines: Array<{
      lineNumber: number;
      description: string;
      quantity: number;
      unitPrice: number;
      discountPercent?: number;
      planId?: string | null;
    }>;
  }) =>
    edgeRequest("/api/edge-backend/sales/quotes", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  transitionSalesQuote: (
    id: string,
    body: { toStatus: string; approvalRequired?: boolean },
  ) =>
    edgeRequest(`/api/edge-backend/sales/quotes/${id}/transition`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSalesDiscountRequests: (opts?: { status?: string }) =>
    edgeRequest(
      `/api/edge-backend/sales/discount-requests${toQuery({
        status: opts?.status,
      })}`,
    ),

  createSalesDiscountRequest: (body: {
    opportunityId: string;
    listAmount: number;
    requestedAmount: number;
    justification: string;
  }) =>
    edgeRequest("/api/edge-backend/sales/discount-requests", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  decideSalesDiscountRequest: (
    id: string,
    body: { decision: "APPROVED" | "REJECTED"; decisionNotes?: string },
  ) =>
    edgeRequest(`/api/edge-backend/sales/discount-requests/${id}/decision`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSalesContracts: (opts?: { opportunityId?: string; status?: string }) =>
    edgeRequest(
      `/api/edge-backend/sales/contracts${toQuery({
        opportunityId: opts?.opportunityId,
        status: opts?.status,
      })}`,
    ),

  createSalesContract: (body: {
    opportunityId: string;
    quoteId?: string | null;
    contractValue?: number | null;
  }) =>
    edgeRequest("/api/edge-backend/sales/contracts", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  transitionSalesContract: (
    id: string,
    body: {
      toStatus: string;
      signatureProviderConfirmed?: boolean;
      signatureProvider?: string;
      signatureExternalId?: string;
    },
  ) =>
    edgeRequest(`/api/edge-backend/sales/contracts/${id}/transition`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSalesOrders: (opts?: { status?: string }) =>
    edgeRequest(
      `/api/edge-backend/sales/orders${toQuery({ status: opts?.status })}`,
    ),

  createSalesOrder: (body: {
    opportunityId?: string | null;
    contractId?: string | null;
    quoteId?: string | null;
  }) =>
    edgeRequest("/api/edge-backend/sales/orders", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  requestSalesHandoff: (
    orderId: string,
    body?: {
      requireContract?: boolean;
      requireQuote?: boolean;
      idempotencyKey?: string;
    },
  ) =>
    edgeRequest(`/api/edge-backend/sales/orders/${orderId}/handoff`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  getSalesForecast: (opts?: {
    model?: string;
    productId?: string;
  }) =>
    edgeRequest(
      `/api/edge-backend/sales/forecast${toQuery({
        model: opts?.model,
        productId: opts?.productId,
      })}`,
    ),

  getSalesPerformance: () =>
    edgeRequest("/api/edge-backend/sales/analytics/performance"),

  listSalesProposals: (opportunityId?: string) =>
    edgeRequest(
      `/api/edge-backend/sales/proposals${toQuery({ opportunityId })}`,
    ),

  createSalesProposal: (body: {
    opportunityId: string;
    quoteId?: string | null;
    title: string;
    language?: string;
  }) =>
    edgeRequest("/api/edge-backend/sales/proposals", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  issueSalesProposal: (id: string) =>
    edgeRequest(`/api/edge-backend/sales/proposals/${id}/issue`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  listOpportunityAssessments: (opportunityId: string) =>
    edgeRequest(
      `/api/edge-backend/sales/opportunities/${opportunityId}/assessments`,
    ),

  createOpportunityAssessment: (
    opportunityId: string,
    body: {
      currentSituation?: string | null;
      objectives?: string | null;
    },
  ) =>
    edgeRequest(
      `/api/edge-backend/sales/opportunities/${opportunityId}/assessments`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  listSalesHandoffs: (opts?: { status?: string }) =>
    edgeRequest(
      `/api/edge-backend/sales/handoffs${toQuery({ status: opts?.status })}`,
    ),

  acceptSalesHandoff: (id: string) =>
    edgeRequest(`/api/edge-backend/sales/handoffs/${id}/accept`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  receiveSalesProvisioningStatus: (
    id: string,
    body: {
      confirmed: boolean;
      externalSystem?: string;
      externalRef?: string | null;
    },
  ) =>
    edgeRequest(
      `/api/edge-backend/sales/handoffs/${id}/provisioning-status`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  searchSales: (opts: {
    q: string;
    visibilityMode?: string;
    limit?: number;
  }) =>
    edgeRequest(
      `/api/edge-backend/sales/search${toQuery({
        q: opts.q,
        visibilityMode: opts.visibilityMode,
        limit: opts.limit,
      })}`,
    ),

  getSalesAccountHierarchy: (id: string) =>
    edgeRequest(`/api/edge-backend/sales/accounts/${id}/hierarchy`),

  listSalesQuestionnaires: () =>
    edgeRequest("/api/edge-backend/sales/questionnaires"),

  createSalesQuestionnaire: (body: {
    code: string;
    name: string;
    questions: unknown[];
  }) =>
    edgeRequest("/api/edge-backend/sales/questionnaires", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSalesSavedViews: (entityType?: string) =>
    edgeRequest(
      `/api/edge-backend/sales/views${toQuery({ entityType })}`,
    ),

  createSalesSavedView: (body: {
    name: string;
    scope: string;
    entityType: string;
    filters?: Record<string, unknown>;
  }) =>
    edgeRequest("/api/edge-backend/sales/views", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  exportSalesEntities: (body: {
    entityType: string;
    format?: "JSON" | "CSV";
  }) =>
    edgeRequest("/api/edge-backend/sales/exports", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  generateSalesProposalDocument: (id: string) =>
    edgeRequest(`/api/edge-backend/sales/proposals/${id}/document`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  listSalesApprovals: (opts?: { status?: string }) =>
    edgeRequest(
      `/api/edge-backend/sales/approvals${toQuery({ status: opts?.status })}`,
    ),

  persistSalesForecastSnapshot: (body: {
    periodType: string;
    periodKey: string;
    model?: string;
  }) =>
    edgeRequest("/api/edge-backend/sales/forecast/snapshots", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // --- P5 Subscriptions ---
  getSubscriptionOverview: () =>
    edgeRequest("/api/edge-backend/subscriptions/overview"),

  getSubscriptionAnalytics: () =>
    edgeRequest("/api/edge-backend/subscriptions/analytics"),

  listSubscriptions: (opts?: {
    accountId?: string;
    productId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest(
      `/api/edge-backend/subscriptions${toQuery({
        accountId: opts?.accountId,
        productId: opts?.productId,
        status: opts?.status,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getSubscription: (id: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}`),

  getSubscriptionWorkspace: (id: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/workspace`),

  getSubscriptionHistory: (id: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/history`),

  createSubscription: (body: {
    accountId: string;
    productId: string;
    contractId?: string;
    planId?: string;
    packageId?: string;
    currency?: string;
    billingFrequency?: string;
    correlationId?: string;
    enterpriseProfile?: Record<string, unknown>;
  }) =>
    edgeRequest("/api/edge-backend/subscriptions", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createSubscriptionFromHandoff: (body: {
    handoffId: string;
    acceptHandoff?: boolean;
  }) =>
    edgeRequest("/api/edge-backend/subscriptions/from-handoff", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  submitSubscription: (id: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  approveSubscription: (id: string, body?: { requestedBy?: string }) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  requestSubscriptionActivation: (id: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/activate-request`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  activateSubscription: (id: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/activate`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  suspendSubscription: (id: string, body: { reason: string }) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  reactivateSubscription: (id: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/reactivate`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  cancelSubscription: (
    id: string,
    body: { reason: string; noticeDays?: number },
  ) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  terminateSubscription: (id: string, body?: { reason?: string }) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/terminate`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  listSubscriptionItems: (id: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/items`),

  addSubscriptionItem: (
    id: string,
    body: {
      itemType: string;
      productId?: string;
      offerRef?: string;
      quantity?: number;
      snapshot?: Record<string, unknown>;
      available?: boolean;
      eligible?: boolean;
    },
  ) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/items`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSubscriptionEntitlements: (id: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/entitlements`),

  calculateSubscriptionEntitlements: (
    id: string,
    body?: { reason?: string },
  ) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/entitlements/calculate`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  publishSubscriptionEntitlements: (id: string, body?: { snapshotId?: string }) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/entitlements/publish`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  listSubscriptionChanges: (id: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/changes`),

  createSubscriptionChange: (
    id: string,
    body: {
      changeType: string;
      proposedConfig?: Record<string, unknown>;
      reason?: string;
    },
  ) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/changes`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  executeSubscriptionChange: (id: string, changeId: string) =>
    edgeRequest(
      `/api/edge-backend/subscriptions/${id}/changes/${changeId}/execute`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    ),

  listSubscriptionRenewals: (id: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/renewals`),

  createSubscriptionRenewal: (id: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/renewals`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  listSubscriptionTrials: (opts?: {
    accountId?: string;
    subscriptionId?: string;
    status?: string;
  }) =>
    edgeRequest(
      `/api/edge-backend/subscriptions/trials${toQuery({
        accountId: opts?.accountId,
        subscriptionId: opts?.subscriptionId,
        status: opts?.status,
      })}`,
    ),

  startSubscriptionTrial: (body: {
    accountId: string;
    productId: string;
    subscriptionId?: string;
    durationDays?: number;
    packageId?: string;
  }) =>
    edgeRequest("/api/edge-backend/subscriptions/trials", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  convertSubscriptionTrial: (trialId: string, body: { subscriptionId: string }) =>
    edgeRequest(`/api/edge-backend/subscriptions/trials/${trialId}/convert`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  expireSubscriptionTrial: (trialId: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/trials/${trialId}/expire`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  requestSubscriptionBillingCoordination: (
    id: string,
    body?: { billingAccountRef?: string },
  ) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/billing-coordination`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  confirmSubscriptionBillingCoordination: (
    id: string,
    coordId: string,
    body?: { externalRef?: string },
  ) =>
    edgeRequest(
      `/api/edge-backend/subscriptions/${id}/billing-coordination/${coordId}/confirm`,
      {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      },
    ),

  requestSubscriptionProvisioning: (id: string) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/provisioning`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  completeSubscriptionProvisioning: (
    id: string,
    reqId: string,
    body?: { tenantRef?: string; externalRef?: string },
  ) =>
    edgeRequest(
      `/api/edge-backend/subscriptions/${id}/provisioning/${reqId}/complete`,
      {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      },
    ),

  listSubscriptionBillingCoordination: (id: string) =>
    edgeRequest<unknown[]>(
      `/api/edge-backend/subscriptions/${id}/billing-coordination`,
    ),

  listSubscriptionProvisioning: (id: string) =>
    edgeRequest<unknown[]>(
      `/api/edge-backend/subscriptions/${id}/provisioning`,
    ),

  listSubscriptionSuspensions: (id: string) =>
    edgeRequest<unknown[]>(
      `/api/edge-backend/subscriptions/${id}/suspensions`,
    ),

  listSubscriptionCancellations: (id: string) =>
    edgeRequest<unknown[]>(
      `/api/edge-backend/subscriptions/${id}/cancellations`,
    ),

  approveSubscriptionChange: (id: string, changeId: string) =>
    edgeRequest(
      `/api/edge-backend/subscriptions/${id}/changes/${changeId}/approve`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    ),

  reconcileSubscriptionEntitlements: (
    id: string,
    body?: { reason?: string; force?: boolean },
  ) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}/entitlements/reconcile`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  patchSubscription: (
    id: string,
    body: {
      currency?: string;
      billingFrequency?: string;
      correlationId?: string;
      planId?: string;
      packageId?: string;
    },
  ) =>
    edgeRequest(`/api/edge-backend/subscriptions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  getSubscriptionPolicies: () =>
    edgeRequest<unknown[]>("/api/edge-backend/subscriptions/policies"),

  // --- P6 Billing ---
  getBillingOverview: () =>
    edgeRequest("/api/edge-backend/billing/overview"),

  getBillingAnalytics: () =>
    edgeRequest("/api/edge-backend/billing/analytics"),

  listBillingAccounts: () =>
    edgeRequest<unknown[]>("/api/edge-backend/billing/accounts"),

  getBillingAccount: (id: string) =>
    edgeRequest(`/api/edge-backend/billing/accounts/${id}`),

  createBillingAccount: (body: {
    commercialAccountId: string;
    currency?: string;
    paymentTermsDays?: number;
  }) =>
    edgeRequest("/api/edge-backend/billing/accounts", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createDraftInvoiceFromSubscription: (body: {
    subscriptionId: string;
    periodId?: string | null;
  }) =>
    edgeRequest("/api/edge-backend/billing/invoices/draft-from-subscription", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  approveBillingInvoice: (id: string) =>
    edgeRequest(`/api/edge-backend/billing/invoices/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  issueBillingInvoice: (id: string) =>
    edgeRequest(`/api/edge-backend/billing/invoices/${id}/issue`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  voidBillingInvoice: (id: string, body: { reason: string }) =>
    edgeRequest(`/api/edge-backend/billing/invoices/${id}/void`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createBillingPaymentIntent: (body: {
    billingAccountId: string;
    invoiceId?: string | null;
    amount: string;
    currency: string;
  }) =>
    edgeRequest("/api/edge-backend/billing/payments/intents", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  confirmBillingPaymentIntent: (id: string) =>
    edgeRequest(`/api/edge-backend/billing/payments/intents/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  approveBillingRefund: (id: string, body: { requesterId: string }) =>
    edgeRequest(`/api/edge-backend/billing/refunds/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listBillingInvoices: (params?: {
    billingAccountId?: string;
    status?: string;
    limit?: number;
  }) =>
    edgeRequest<unknown[]>(
      `/api/edge-backend/billing/invoices${toQuery({
        billingAccountId: params?.billingAccountId,
        status: params?.status,
        limit: params?.limit,
      })}`,
    ),

  getBillingInvoice: (id: string) =>
    edgeRequest(`/api/edge-backend/billing/invoices/${id}`),

  upsertBillingProfile: (
    accountId: string,
    body: {
      legalName: string;
      tradeName?: string | null;
      country?: string | null;
      currency: string;
      paymentTermsDays: number;
    },
  ) =>
    edgeRequest(`/api/edge-backend/billing/accounts/${accountId}/profiles`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  applyBillingTax: (
    invoiceId: string,
    body?: { country?: string | null; category?: string },
  ) =>
    edgeRequest(`/api/edge-backend/billing/invoices/${invoiceId}/apply-tax`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  createBillingRefund: (body: {
    paymentIntentId: string;
    amount: string;
    currency: string;
    reason?: string | null;
    invoiceId?: string | null;
  }) =>
    edgeRequest("/api/edge-backend/billing/refunds", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listBillingPayments: (params?: {
    billingAccountId?: string;
    status?: string;
    limit?: number;
  }) =>
    edgeRequest<unknown[]>(
      `/api/edge-backend/billing/payments${toQuery({
        billingAccountId: params?.billingAccountId,
        status: params?.status,
        limit: params?.limit,
      })}`,
    ),

  listCollectionCases: (params?: {
    billingAccountId?: string;
    status?: string;
  }) =>
    edgeRequest<unknown[]>(
      `/api/edge-backend/billing/collections${toQuery({
        billingAccountId: params?.billingAccountId,
        status: params?.status,
      })}`,
    ),

  openCollectionCase: (body: {
    billingAccountId: string;
    invoiceId: string;
  }) =>
    edgeRequest("/api/edge-backend/billing/collections", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  escalateCollectionCase: (id: string) =>
    edgeRequest(`/api/edge-backend/billing/collections/${id}/escalate`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  resolveCollectionCase: (id: string) =>
    edgeRequest(`/api/edge-backend/billing/collections/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  runBillingReconciliation: (body: { provider: string }) =>
    edgeRequest("/api/edge-backend/billing/reconciliation/runs", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listBillingReconciliationRuns: () =>
    edgeRequest<unknown[]>("/api/edge-backend/billing/reconciliation/runs"),

  listReconciliationExceptions: (params?: {
    runId?: string;
    status?: string;
  }) =>
    edgeRequest<unknown[]>(
      `/api/edge-backend/billing/reconciliation/exceptions${toQuery({
        runId: params?.runId,
        status: params?.status,
      })}`,
    ),

  resolveReconciliationException: (id: string) =>
    edgeRequest(
      `/api/edge-backend/billing/reconciliation/exceptions/${id}/resolve`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  listBillingPolicies: (policyType?: string) =>
    edgeRequest<unknown[]>(
      `/api/edge-backend/billing/policies${toQuery({ policyType })}`,
    ),

  listBillingFxRates: () =>
    edgeRequest<unknown[]>("/api/edge-backend/billing/fx/rates"),

  listBillingSettlements: () =>
    edgeRequest<unknown[]>("/api/edge-backend/billing/settlements"),

  listBillingDisputes: () =>
    edgeRequest<unknown[]>("/api/edge-backend/billing/disputes"),

  getBillingPortal: (billingAccountId: string) =>
    edgeRequest(`/api/edge-backend/billing/portal/${billingAccountId}`),

  processDueBillingSchedules: () =>
    edgeRequest("/api/edge-backend/billing/schedules/process-due", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  generateBillingExport: (body?: {
    exportType?: string;
    currency?: string;
    periodStart?: string | null;
    periodEnd?: string | null;
  }) =>
    edgeRequest("/api/edge-backend/billing/exports", {
      method: "POST",
      body: JSON.stringify(body ?? { exportType: "FULL" }),
    }),

  listBillingExports: () =>
    edgeRequest<unknown[]>("/api/edge-backend/billing/exports"),

  listRevenuePolicies: () =>
    edgeRequest<unknown[]>("/api/edge-backend/billing/revenue-policies"),

  // P7.1 — Provisioning requests (durable authorization foundation; not technical ACTIVE)
  getProvisioningRequestStats: () =>
    edgeRequest<{
      total: number;
      requested: number;
      accepted: number;
      rejected: number;
      cancelled: number;
      failed: number;
    }>("/api/edge-backend/provisioning-requests/stats"),

  listProvisioningRequests: (opts?: {
    status?: string;
    accountId?: string;
    productId?: string;
    subscriptionId?: string;
    environmentSlot?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<{ items: unknown[]; total: number }>(
      `/api/edge-backend/provisioning-requests${toQuery({
        status: opts?.status,
        accountId: opts?.accountId,
        productId: opts?.productId,
        subscriptionId: opts?.subscriptionId,
        environmentSlot: opts?.environmentSlot,
        from: opts?.from,
        to: opts?.to,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getProvisioningRequest: (id: string) =>
    edgeRequest(`/api/edge-backend/provisioning-requests/${id}`),

  getProvisioningRequestHistory: (id: string) =>
    edgeRequest<unknown[]>(`/api/edge-backend/provisioning-requests/${id}/history`),

  getProvisioningRequestAuthorization: (id: string) =>
    edgeRequest(`/api/edge-backend/provisioning-requests/${id}/authorization`),

  cancelProvisioningRequest: (id: string, reason: string) =>
    edgeRequest(`/api/edge-backend/provisioning-requests/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  getProvisioningEventCompatibility: () =>
    edgeRequest("/api/edge-backend/provisioning-requests/event-compatibility"),

  // P7.2 — Product / Platform / Runtime Registry
  listRegistryProducts: (opts?: RegistryListQuery) =>
    edgeRequest<RegistryListPage<ProductRegistryRecord>>(
      `/api/edge-backend/registry/products${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  getRegistryProduct: (id: string) =>
    edgeRequest<ProductRegistryRecord>(
      `/api/edge-backend/registry/products/${id}`,
    ),

  createRegistryProduct: (body: CreateProductRegistryInput) =>
    edgeRequest<ProductRegistryRecord>("/api/edge-backend/registry/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateRegistryProduct: (id: string, body: UpdateProductRegistryInput) =>
    edgeRequest<ProductRegistryRecord>(
      `/api/edge-backend/registry/products/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),

  transitionRegistryProduct: (id: string, body: RegistryTransitionInput) =>
    edgeRequest<ProductRegistryRecord>(
      `/api/edge-backend/registry/products/${id}/transition`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  listRegistryProductVersions: (
    productRegistryId: string,
    opts?: RegistryListQuery,
  ) =>
    edgeRequest<RegistryListPage<ProductTechnicalVersion>>(
      `/api/edge-backend/registry/products/${productRegistryId}/versions${toQuery(
        {
          limit: opts?.limit,
          offset: opts?.offset,
          status: opts?.status,
          q: opts?.q,
        },
      )}`,
    ),

  createRegistryProductVersion: (
    productRegistryId: string,
    body: CreateTechnicalVersionInput,
  ) =>
    edgeRequest<ProductTechnicalVersion>(
      `/api/edge-backend/registry/products/${productRegistryId}/versions`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  transitionRegistryVersion: (id: string, body: RegistryTransitionInput) =>
    edgeRequest<ProductTechnicalVersion>(
      `/api/edge-backend/registry/versions/${id}/transition`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  getRegistryVersion: (id: string) =>
    edgeRequest<ProductTechnicalVersion>(
      `/api/edge-backend/registry/versions/${id}`,
    ),

  listRegistryPlatforms: (opts?: RegistryListQuery) =>
    edgeRequest<RegistryListPage<ProductPlatform>>(
      `/api/edge-backend/registry/platforms${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  getRegistryPlatform: (id: string) =>
    edgeRequest<ProductPlatform>(`/api/edge-backend/registry/platforms/${id}`),

  createRegistryPlatform: (body: CreatePlatformInput) =>
    edgeRequest<ProductPlatform>("/api/edge-backend/registry/platforms", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateRegistryPlatform: (id: string, body: UpdatePlatformInput) =>
    edgeRequest<ProductPlatform>(
      `/api/edge-backend/registry/platforms/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),

  transitionRegistryPlatform: (id: string, body: RegistryTransitionInput) =>
    edgeRequest<ProductPlatform>(
      `/api/edge-backend/registry/platforms/${id}/transition`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  listRegistryEnvironments: (
    opts?: RegistryListQuery & { platformId?: string },
  ) =>
    edgeRequest<RegistryListPage<RuntimeEnvironment>>(
      `/api/edge-backend/registry/environments${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
        platformId: opts?.platformId,
      })}`,
    ),

  getRegistryEnvironment: (id: string) =>
    edgeRequest<RuntimeEnvironment>(
      `/api/edge-backend/registry/environments/${id}`,
    ),

  createRegistryEnvironment: (body: CreateEnvironmentInput) =>
    edgeRequest<RuntimeEnvironment>(
      "/api/edge-backend/registry/environments",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  updateRegistryEnvironment: (id: string, body: UpdateEnvironmentInput) =>
    edgeRequest<RuntimeEnvironment>(
      `/api/edge-backend/registry/environments/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),

  transitionRegistryEnvironment: (
    id: string,
    body: RegistryTransitionInput,
  ) =>
    edgeRequest<RuntimeEnvironment>(
      `/api/edge-backend/registry/environments/${id}/transition`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  listRegistryDeploymentProfiles: (opts?: RegistryListQuery) =>
    edgeRequest<RegistryListPage<DeploymentProfile>>(
      `/api/edge-backend/registry/deployment-profiles${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  getRegistryDeploymentProfile: (id: string) =>
    edgeRequest<DeploymentProfile>(
      `/api/edge-backend/registry/deployment-profiles/${id}`,
    ),

  updateRegistryDeploymentProfile: (id: string, body: UpdateProfileInput) =>
    edgeRequest<DeploymentProfile>(
      `/api/edge-backend/registry/deployment-profiles/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),

  transitionRegistryDeploymentProfile: (
    id: string,
    body: RegistryTransitionInput,
  ) =>
    edgeRequest<DeploymentProfile>(
      `/api/edge-backend/registry/deployment-profiles/${id}/transition`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  listRegistryControlContracts: (
    opts?: RegistryListQuery & { productId?: string; platformId?: string },
  ) =>
    edgeRequest<RegistryListPage<ProductControlContract>>(
      `/api/edge-backend/registry/control-contracts${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
        productId: opts?.productId,
        platformId: opts?.platformId,
      })}`,
    ),

  getRegistryControlContract: (id: string) =>
    edgeRequest<ProductControlContract>(
      `/api/edge-backend/registry/control-contracts/${id}`,
    ),

  createRegistryControlContract: (body: CreateControlContractInput) =>
    edgeRequest<ProductControlContract>(
      "/api/edge-backend/registry/control-contracts",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  updateRegistryControlContract: (
    id: string,
    body: UpdateControlContractInput,
  ) =>
    edgeRequest<ProductControlContract>(
      `/api/edge-backend/registry/control-contracts/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),

  transitionRegistryControlContract: (
    id: string,
    body: RegistryTransitionInput,
  ) =>
    edgeRequest<ProductControlContract>(
      `/api/edge-backend/registry/control-contracts/${id}/transition`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  evaluateRegistryCompatibility: (body: EvaluateCompatibilityInput) =>
    edgeRequest<CompatibilityEvaluation>(
      "/api/edge-backend/registry/compatibility/evaluate",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  listRegistryCompatibilityEvaluations: (opts?: RegistryListQuery) =>
    edgeRequest<RegistryListPage<CompatibilityEvaluation>>(
      `/api/edge-backend/registry/compatibility/evaluations${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  getRegistryCompatibilityEvaluation: (id: string) =>
    edgeRequest<CompatibilityEvaluation>(
      `/api/edge-backend/registry/compatibility/evaluations/${id}`,
    ),

  listRegistryHistory: (
    opts?: RegistryListQuery & {
      resourceType?: string;
      resourceId?: string;
    },
  ) =>
    edgeRequest<RegistryListPage<RegistryHistoryEntry>>(
      `/api/edge-backend/registry/history${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
        resourceType: opts?.resourceType,
        resourceId: opts?.resourceId,
      })}`,
    ),

  // P7.3 — Placement & Capacity
  listPlacementRequests: (opts?: PlacementListQuery) =>
    edgeRequest<PlacementListPage<PlacementRequestRecord>>(
      `/api/edge-backend/placement/requests${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  getPlacementRequest: (id: string) =>
    edgeRequest<PlacementRequestRecord>(
      `/api/edge-backend/placement/requests/${id}`,
    ),

  createPlacementRequest: (body: CreatePlacementRequestInput) =>
    edgeRequest<PlacementRequestRecord>(
      "/api/edge-backend/placement/requests",
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: body.idempotencyKey
          ? { "Idempotency-Key": body.idempotencyKey }
          : undefined,
      },
    ),

  evaluatePlacementRequest: (id: string, body?: EvaluatePlacementInput) =>
    edgeRequest<EvaluatePlacementResult>(
      `/api/edge-backend/placement/requests/${id}/evaluate`,
      {
        method: "POST",
        body: JSON.stringify(body ?? {}),
        headers: body?.idempotencyKey
          ? { "Idempotency-Key": body.idempotencyKey }
          : undefined,
      },
    ),

  confirmPlacementRequest: (id: string, body?: ConfirmPlacementInput) =>
    edgeRequest<PlacementDecisionRecord>(
      `/api/edge-backend/placement/requests/${id}/confirm`,
      {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      },
    ),

  cancelPlacementRequest: (id: string, body?: CancelPlacementInput) =>
    edgeRequest<PlacementRequestRecord>(
      `/api/edge-backend/placement/requests/${id}/cancel`,
      {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      },
    ),

  reEvaluatePlacementRequest: (id: string, body: ReEvaluatePlacementInput) =>
    edgeRequest<EvaluatePlacementResult>(
      `/api/edge-backend/placement/requests/${id}/re-evaluate`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Idempotency-Key": body.idempotencyKey },
      },
    ),

  getPlacementDecision: (id: string) =>
    edgeRequest<PlacementDecisionRecord>(
      `/api/edge-backend/placement/decisions/${id}`,
    ),

  listPlacementDecisionCandidates: (decisionId: string) =>
    edgeRequest<PlacementCandidateEvaluation[]>(
      `/api/edge-backend/placement/decisions/${decisionId}/candidates`,
    ),

  listPlacementHistory: (opts?: PlacementHistoryQuery) =>
    edgeRequest<PlacementListPage<PlacementHistoryEntry>>(
      `/api/edge-backend/placement/history${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
        resourceType: opts?.resourceType,
        resourceId: opts?.resourceId,
      })}`,
    ),

  listCapacityInventory: (opts?: CapacityInventoryQuery) =>
    edgeRequest<PlacementListPage<CapacityInventoryRecord>>(
      `/api/edge-backend/capacity/inventory${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
        platformId: opts?.platformId,
        environmentId: opts?.environmentId,
        resourceType: opts?.resourceType,
      })}`,
    ),

  upsertCapacityInventory: (body: UpsertCapacityInventoryInput) =>
    edgeRequest<CapacityInventoryRecord>(
      "/api/edge-backend/capacity/inventory",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  patchCapacityInventory: (id: string, body: PatchCapacityInventoryInput) =>
    edgeRequest<CapacityInventoryRecord>(
      `/api/edge-backend/capacity/inventory/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),

  listCapacityReservations: (opts?: CapacityReservationsQuery) =>
    edgeRequest<PlacementListPage<CapacityReservationRecord>>(
      `/api/edge-backend/capacity/reservations${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
        placementRequestId: opts?.placementRequestId,
        environmentId: opts?.environmentId,
      })}`,
    ),

  getCapacityReservation: (id: string) =>
    edgeRequest<CapacityReservationRecord>(
      `/api/edge-backend/capacity/reservations/${id}`,
    ),

  releaseCapacityReservation: (id: string, body: ReleaseReservationInput) =>
    edgeRequest<CapacityReservationRecord>(
      `/api/edge-backend/capacity/reservations/${id}/release`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  expireCapacityReservation: (
    id: string,
    body: { expectedVersion: number },
  ) =>
    edgeRequest<CapacityReservationRecord>(
      `/api/edge-backend/capacity/reservations/${id}/expire`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  listPlacementPolicies: (opts?: PlacementListQuery) =>
    edgeRequest<PlacementListPage<PlacementPolicyRecord>>(
      `/api/edge-backend/placement/policies${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  createPlacementPolicy: (body: CreatePlacementPolicyInput) =>
    edgeRequest<PlacementPolicyRecord>(
      "/api/edge-backend/placement/policies",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  patchPlacementPolicy: (id: string, body: PatchPlacementPolicyInput) =>
    edgeRequest<PlacementPolicyRecord>(
      `/api/edge-backend/placement/policies/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),

  // P7.4 — Workflow Operations
  listWorkflowDefinitions: (opts?: WorkflowListQuery) =>
    edgeRequest<WorkflowListPage<WorkflowDefinitionRecord>>(
      `/api/edge-backend/workflows/definitions${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  getWorkflowDefinition: (id: string) =>
    edgeRequest<WorkflowDefinitionRecord>(
      `/api/edge-backend/workflows/definitions/${id}`,
    ),

  createWorkflowDefinition: (body: CreateWorkflowDefinitionInput) =>
    edgeRequest<{
      definition: WorkflowDefinitionRecord;
      version?: { versionNumber?: number };
    }>("/api/edge-backend/workflows/definitions", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  validateWorkflowDefinition: (id: string) =>
    edgeRequest<WorkflowDefinitionRecord>(
      `/api/edge-backend/workflows/definitions/${id}/validate`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  publishWorkflowDefinition: (id: string) =>
    edgeRequest<{
      definition: WorkflowDefinitionRecord;
      version?: { versionNumber?: number };
    }>(`/api/edge-backend/workflows/definitions/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  deprecateWorkflowDefinition: (id: string, body?: WorkflowReasonInput) =>
    edgeRequest<WorkflowDefinitionRecord>(
      `/api/edge-backend/workflows/definitions/${id}/deprecate`,
      {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      },
    ),

  listWorkflowInstances: (opts?: WorkflowListQuery) =>
    edgeRequest<WorkflowListPage<WorkflowInstanceRecord>>(
      `/api/edge-backend/workflows${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  getWorkflowInstance: (id: string) =>
    edgeRequest<WorkflowInstanceRecord>(
      `/api/edge-backend/workflows/${id}`,
    ),

  createWorkflowInstance: (body: CreateWorkflowInstanceInput) =>
    edgeRequest<WorkflowInstanceRecord>("/api/edge-backend/workflows", {
      method: "POST",
      body: JSON.stringify(body),
      headers: body.idempotencyKey
        ? { "Idempotency-Key": body.idempotencyKey }
        : undefined,
    }),

  listWorkflowHistory: (id: string, opts?: WorkflowListQuery) =>
    edgeRequest<WorkflowListPage<WorkflowHistoryEntry>>(
      `/api/edge-backend/workflows/${id}/history${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  listWorkflowSteps: (id: string) =>
    edgeRequest<WorkflowStepRecord[] | WorkflowListPage<WorkflowStepRecord>>(
      `/api/edge-backend/workflows/${id}/steps`,
    ),

  listWorkflowAttempts: (id: string) =>
    edgeRequest<
      WorkflowAttemptRecord[] | WorkflowListPage<WorkflowAttemptRecord>
    >(`/api/edge-backend/workflows/${id}/attempts`),

  listWorkflowCheckpoints: (id: string) =>
    edgeRequest<
      WorkflowCheckpointRecord[] | WorkflowListPage<WorkflowCheckpointRecord>
    >(`/api/edge-backend/workflows/${id}/checkpoints`),

  listWorkflowCompensations: (id: string) =>
    edgeRequest<
      | WorkflowCompensationRecord[]
      | WorkflowListPage<WorkflowCompensationRecord>
    >(`/api/edge-backend/workflows/${id}/compensations`),

  startWorkflow: (id: string) =>
    edgeRequest<WorkflowInstanceRecord>(
      `/api/edge-backend/workflows/${id}/start`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  pauseWorkflow: (id: string, body?: WorkflowReasonInput) =>
    edgeRequest<WorkflowInstanceRecord>(
      `/api/edge-backend/workflows/${id}/pause`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  resumeWorkflow: (id: string) =>
    edgeRequest<WorkflowInstanceRecord>(
      `/api/edge-backend/workflows/${id}/resume`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  cancelWorkflow: (id: string, body?: WorkflowReasonInput) =>
    edgeRequest<WorkflowInstanceRecord>(
      `/api/edge-backend/workflows/${id}/cancel`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  retryWorkflow: (id: string, body?: RetryWorkflowInput) =>
    edgeRequest<unknown>(`/api/edge-backend/workflows/${id}/retry`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  reconcileWorkflow: (id: string) =>
    edgeRequest<unknown>(`/api/edge-backend/workflows/${id}/reconcile`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  listWorkflowTasks: (opts?: WorkflowListQuery) =>
    edgeRequest<WorkflowListPage<WorkflowHumanTaskRecord>>(
      `/api/edge-backend/workflow-tasks${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
        workflowId: opts?.workflowId,
      })}`,
    ),

  getWorkflowTask: (id: string) =>
    edgeRequest<WorkflowHumanTaskRecord>(
      `/api/edge-backend/workflow-tasks/${id}`,
    ),

  assignWorkflowTask: (id: string, body: AssignWorkflowTaskInput) =>
    edgeRequest<WorkflowHumanTaskRecord>(
      `/api/edge-backend/workflow-tasks/${id}/assign`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  approveWorkflowTask: (id: string, body?: DecideWorkflowTaskInput) =>
    edgeRequest<WorkflowHumanTaskRecord>(
      `/api/edge-backend/workflow-tasks/${id}/approve`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  rejectWorkflowTask: (id: string, body: RejectWorkflowTaskInput) =>
    edgeRequest<WorkflowHumanTaskRecord>(
      `/api/edge-backend/workflow-tasks/${id}/reject`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listWorkflowWorkers: (opts?: WorkflowListQuery) =>
    edgeRequest<WorkflowListPage<WorkflowWorkerRecord>>(
      `/api/edge-backend/workflow-workers${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  listWorkflowDeadLetters: (opts?: WorkflowListQuery) =>
    edgeRequest<WorkflowListPage<WorkflowDeadLetterRecord>>(
      `/api/edge-backend/workflows/dead-letters${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  // P7.5 — Product Control Integration
  listProductControlEndpoints: (opts?: ProductControlListQuery) =>
    edgeRequest<ProductControlListPage<ProductControlEndpointRecord>>(
      `/api/edge-backend/product-controls/endpoints${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
        productId: opts?.productId,
        platformId: opts?.platformId,
      })}`,
    ),

  getProductControlEndpoint: (id: string) =>
    edgeRequest<ProductControlEndpointRecord>(
      `/api/edge-backend/product-controls/endpoints/${id}`,
    ),

  createProductControlEndpoint: (body: RegisterProductControlEndpointInput) =>
    edgeRequest<ProductControlEndpointRecord>(
      "/api/edge-backend/product-controls/endpoints",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  patchProductControlEndpoint: (
    id: string,
    body: PatchProductControlEndpointInput,
  ) =>
    edgeRequest<ProductControlEndpointRecord>(
      `/api/edge-backend/product-controls/endpoints/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),

  validateProductControlEndpoint: (id: string) =>
    edgeRequest<ProductControlEndpointRecord>(
      `/api/edge-backend/product-controls/endpoints/${id}/validate`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  handshakeProductControlEndpoint: (id: string) =>
    edgeRequest<ProductControlEndpointRecord>(
      `/api/edge-backend/product-controls/endpoints/${id}/handshake`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  discoverProductControlContract: (id: string) =>
    edgeRequest<NegotiatedContractRecord | ProductControlEndpointRecord>(
      `/api/edge-backend/product-controls/endpoints/${id}/discover-contract`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  discoverProductControlCapabilities: (id: string) =>
    edgeRequest<
      | ProductControlCapabilityRecord[]
      | ProductControlListPage<ProductControlCapabilityRecord>
    >(
      `/api/edge-backend/product-controls/endpoints/${id}/discover-capabilities`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  healthCheckProductControlEndpoint: (id: string) =>
    edgeRequest<ProductControlHealthCheckRecord | ProductControlEndpointRecord>(
      `/api/edge-backend/product-controls/endpoints/${id}/health-check`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  quarantineProductControlEndpoint: (
    id: string,
    body: QuarantineProductControlEndpointInput,
  ) =>
    edgeRequest<ProductControlEndpointRecord>(
      `/api/edge-backend/product-controls/endpoints/${id}/quarantine`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  listProductControlEndpointExchanges: (
    id: string,
    opts?: ProductControlListQuery,
  ) =>
    edgeRequest<ProductControlListPage<ControlExchangeRecord>>(
      `/api/edge-backend/product-controls/endpoints/${id}/exchanges${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  listProductControlEndpointContracts: (id: string) =>
    edgeRequest<
      | NegotiatedContractRecord[]
      | ProductControlListPage<NegotiatedContractRecord>
    >(`/api/edge-backend/product-controls/endpoints/${id}/contracts`),

  listProductControlEndpointCapabilities: (id: string) =>
    edgeRequest<
      | ProductControlCapabilityRecord[]
      | ProductControlListPage<ProductControlCapabilityRecord>
    >(`/api/edge-backend/product-controls/endpoints/${id}/capabilities`),

  listProductControlEndpointHealthChecks: (
    id: string,
    opts?: ProductControlListQuery,
  ) =>
    edgeRequest<
      | ProductControlHealthCheckRecord[]
      | ProductControlListPage<ProductControlHealthCheckRecord>
    >(
      `/api/edge-backend/product-controls/endpoints/${id}/health-checks${toQuery(
        {
          limit: opts?.limit,
          offset: opts?.offset,
        },
      )}`,
    ),

  listProductControlEndpointHistory: (
    id: string,
    opts?: ProductControlListQuery,
  ) =>
    edgeRequest<ProductControlListPage<ProductControlHistoryEntry>>(
      `/api/edge-backend/product-controls/endpoints/${id}/history${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  listProductControlExchanges: (opts?: ProductControlListQuery) =>
    edgeRequest<ProductControlListPage<ControlExchangeRecord>>(
      `/api/edge-backend/product-controls/exchanges${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
        endpointId: opts?.endpointId,
      })}`,
    ),

  getProductControlExchange: (id: string) =>
    edgeRequest<ControlExchangeRecord>(
      `/api/edge-backend/product-controls/exchanges/${id}`,
    ),

  reconcileProductControlExchange: (id: string) =>
    edgeRequest<ControlExchangeRecord>(
      `/api/edge-backend/product-controls/exchanges/${id}/reconcile`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  listProductControlCredentials: (opts?: ProductControlListQuery) =>
    edgeRequest<ProductControlListPage<CredentialBindingRecord>>(
      `/api/edge-backend/product-controls/credentials${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
        endpointId: opts?.endpointId,
      })}`,
    ),

  // --- P7.6 Infrastructure & Database ---
  listInfrastructureProviders: () =>
    edgeRequest<{ items: InfrastructureProviderRecord[]; total: number }>(
      `/api/edge-backend/infrastructure/providers`,
    ),

  getInfrastructureProvider: (id: string) =>
    edgeRequest<InfrastructureProviderRecord>(
      `/api/edge-backend/infrastructure/providers/${id}`,
    ),

  listInfrastructureResources: (opts?: {
    limit?: number;
    offset?: number;
    status?: string;
    tenantId?: string;
    resourceType?: string;
  }) =>
    edgeRequest<{ items: InfrastructureResourceRecord[]; total: number }>(
      `/api/edge-backend/infrastructure/resources${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        tenantId: opts?.tenantId,
        resourceType: opts?.resourceType,
      })}`,
    ),

  getInfrastructureResource: (id: string) =>
    edgeRequest<InfrastructureResourceRecord>(
      `/api/edge-backend/infrastructure/resources/${id}`,
    ),

  reconcileInfrastructureResource: (id: string, body?: Record<string, unknown>) =>
    edgeRequest<InfrastructureResourceRecord>(
      `/api/edge-backend/infrastructure/resources/${id}/reconcile`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listResourcePlans: (opts?: {
    limit?: number;
    offset?: number;
    status?: string;
    tenantId?: string;
    productId?: string;
  }) =>
    edgeRequest<{ items: ResourcePlanRecord[]; total: number }>(
      `/api/edge-backend/infrastructure/resource-plans${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        tenantId: opts?.tenantId,
        productId: opts?.productId,
      })}`,
    ),

  getResourcePlan: (id: string) =>
    edgeRequest<ResourcePlanRecord>(
      `/api/edge-backend/infrastructure/resource-plans/${id}`,
    ),

  createResourcePlan: (body: Record<string, unknown>) =>
    edgeRequest<ResourcePlanRecord>(
      `/api/edge-backend/infrastructure/resource-plans`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  validateResourcePlan: (id: string, body?: Record<string, unknown>) =>
    edgeRequest<ResourcePlanRecord>(
      `/api/edge-backend/infrastructure/resource-plans/${id}/validate`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listDatabaseResources: (opts?: {
    limit?: number;
    offset?: number;
    status?: string;
    tenantId?: string;
    engine?: string;
  }) =>
    edgeRequest<{ items: DatabaseResourceRecord[]; total: number }>(
      `/api/edge-backend/databases/resources${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        tenantId: opts?.tenantId,
        engine: opts?.engine,
      })}`,
    ),

  getDatabaseResource: (id: string) =>
    edgeRequest<DatabaseResourceRecord>(
      `/api/edge-backend/databases/resources/${id}`,
    ),

  verifyDatabaseResource: (id: string, body?: Record<string, unknown>) =>
    edgeRequest<DatabaseResourceRecord>(
      `/api/edge-backend/databases/resources/${id}/verify`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  rotateDatabaseCredentials: (id: string, body?: Record<string, unknown>) =>
    edgeRequest<{ credentialRef: string }>(
      `/api/edge-backend/databases/resources/${id}/rotate-credentials`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listResourceHistory: (id: string, opts?: { limit?: number }) =>
    edgeRequest<{ items: ResourceHistoryRecord[]; total: number }>(
      `/api/edge-backend/resources/${id}/history${toQuery({ limit: opts?.limit })}`,
    ),

  listResourceBackups: (id: string) =>
    edgeRequest<{ items: ResourceBackupRecord[]; total: number }>(
      `/api/edge-backend/resources/${id}/backups`,
    ),

  createResourceBackup: (id: string, body?: Record<string, unknown>) =>
    edgeRequest<ResourceBackupRecord>(
      `/api/edge-backend/resources/${id}/backups`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  restoreResourceBackup: (id: string, body: Record<string, unknown>) =>
    edgeRequest<unknown>(`/api/edge-backend/resources/${id}/restore`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deprovisionResource: (id: string, body?: Record<string, unknown>) =>
    edgeRequest<InfrastructureResourceRecord>(
      `/api/edge-backend/resources/${id}/deprovision`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  // --- P7.7 Keycloak Topology & Identity Infrastructure ---
  listKeycloakProviders: () =>
    edgeRequest<{ items: KeycloakProviderRecord[]; total: number }>(
      `/api/edge-backend/keycloak/providers`,
    ),

  getKeycloakProvider: (id: string) =>
    edgeRequest<KeycloakProviderRecord>(
      `/api/edge-backend/keycloak/providers/${id}`,
    ),

  listKeycloakServers: () =>
    edgeRequest<{ items: KeycloakServerRecord[]; total: number }>(
      `/api/edge-backend/keycloak/servers`,
    ),

  getKeycloakServer: (id: string) =>
    edgeRequest<KeycloakServerRecord>(
      `/api/edge-backend/keycloak/servers/${id}`,
    ),

  registerKeycloakServer: (body: {
    providerId: string;
    code: string;
    name: string;
    baseUrl: string;
    adminRealm?: string;
    adminClientId: string;
    adminCredential?: string;
    tlsMode?: string;
    allowPrivateNetwork?: boolean;
    environment?: string;
  }) =>
    edgeRequest<KeycloakServerRecord>(`/api/edge-backend/keycloak/servers`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  discoverKeycloakCapabilities: (serverId: string, body?: Record<string, unknown>) =>
    edgeRequest<KeycloakCapabilitiesRecord>(
      `/api/edge-backend/keycloak/servers/${serverId}/capabilities`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  getKeycloakCapabilities: (serverId: string) =>
    edgeRequest<KeycloakCapabilitiesRecord | null>(
      `/api/edge-backend/keycloak/servers/${serverId}/capabilities`,
    ),

  listKeycloakTopologies: (opts?: {
    limit?: number;
    offset?: number;
    tenantId?: string;
    productId?: string;
    status?: string;
    topologyType?: string;
    serverId?: string;
  }) =>
    edgeRequest<{ items: KeycloakTopologyRecord[]; total: number }>(
      `/api/edge-backend/keycloak/topologies${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        tenantId: opts?.tenantId,
        productId: opts?.productId,
        status: opts?.status,
        topologyType: opts?.topologyType,
        serverId: opts?.serverId,
      })}`,
    ),

  getKeycloakTopology: (id: string) =>
    edgeRequest<KeycloakTopologyDetail>(`/api/edge-backend/keycloak/topologies/${id}`),

  createKeycloakTopology: (body: {
    tenantId: string;
    productId: string;
    providerId: string;
    serverId: string;
    topologyType: string;
    subscriptionId?: string;
    placementDecisionId?: string;
    deploymentProfileId?: string;
    runtimeProfileId?: string;
    profileOptions?: Record<string, unknown>;
    provisioningRequestId?: string;
  }) =>
    edgeRequest<KeycloakTopologyRecord>(`/api/edge-backend/keycloak/topologies`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  reconcileKeycloakTopology: (id: string, body?: Record<string, unknown>) =>
    edgeRequest<unknown>(`/api/edge-backend/keycloak/topologies/${id}/reconcile`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  deprovisionKeycloakTopology: (id: string, body: Record<string, unknown>) =>
    edgeRequest<unknown>(`/api/edge-backend/keycloak/topologies/${id}/deprovision`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  declareKeycloakClient: (body: Record<string, unknown>) =>
    edgeRequest<unknown>(`/api/edge-backend/keycloak/clients`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listKeycloakEvidence: (topologyId: string, opts?: { limit?: number }) =>
    edgeRequest<{ items: KeycloakEvidenceRecord[]; total: number }>(
      `/api/edge-backend/keycloak/topologies/${topologyId}/evidence${toQuery({
        limit: opts?.limit,
      })}`,
    ),

  listKeycloakHistory: (topologyId: string, opts?: { limit?: number }) =>
    edgeRequest<{ items: KeycloakHistoryRecord[]; total: number }>(
      `/api/edge-backend/keycloak/topologies/${topologyId}/history${toQuery({
        limit: opts?.limit,
      })}`,
    ),

  listKeycloakReconciliations: (topologyId: string, opts?: { limit?: number }) =>
    edgeRequest<{ items: KeycloakReconciliationRunRecord[]; total: number }>(
      `/api/edge-backend/keycloak/topologies/${topologyId}/reconciliations${toQuery({
        limit: opts?.limit,
      })}`,
    ),

  // --- P7.8 Configuration & Entitlement Deployment ---
  listConfigurationSchemas: (opts?: {
    limit?: number;
    offset?: number;
    status?: string;
    q?: string;
  }) =>
    edgeRequest<ConfigurationListPage<ConfigurationSchemaRecord>>(
      `/api/edge-backend/configuration/schemas${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  createConfigurationSchema: (body: {
    code: string;
    name: string;
    description?: string;
    productId?: string;
    schemaVersion?: number;
    jsonSchema: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<ConfigurationSchemaRecord>(
      `/api/edge-backend/configuration/schemas`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listConfigurationTemplates: (opts?: {
    limit?: number;
    offset?: number;
    status?: string;
    q?: string;
  }) =>
    edgeRequest<ConfigurationListPage<ConfigurationTemplateRecord>>(
      `/api/edge-backend/configuration/templates${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  createConfigurationTemplate: (body: {
    code: string;
    name: string;
    description?: string;
    productId?: string;
    schemaId: string;
    runtimeProfileCode?: string;
    deploymentProfileCode?: string;
    draftPayload: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<ConfigurationTemplateRecord>(
      `/api/edge-backend/configuration/templates`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  publishConfigurationTemplate: (
    id: string,
    body: { expectedVersion: number; versionNumber?: number },
  ) =>
    edgeRequest<ConfigurationTemplateRecord>(
      `/api/edge-backend/configuration/templates/${id}/publish`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listConfigurationBundles: (opts?: {
    limit?: number;
    offset?: number;
    status?: string;
    q?: string;
  }) =>
    edgeRequest<ConfigurationListPage<ConfigurationBundleRecord>>(
      `/api/edge-backend/configuration/bundles${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
      })}`,
    ),

  createConfigurationBundle: (body: {
    code: string;
    name: string;
    description?: string;
    productId?: string;
    templateRefs: Array<{ templateId: string; versionNumber: number }>;
    dependencyRefs?: string[];
    payload?: Record<string, unknown>;
    rolloutPolicy?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<ConfigurationBundleRecord>(
      `/api/edge-backend/configuration/bundles`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  publishConfigurationBundle: (
    id: string,
    body: { expectedVersion: number; versionNumber?: number },
  ) =>
    edgeRequest<ConfigurationBundleRecord>(
      `/api/edge-backend/configuration/bundles/${id}/publish`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listTenantConfigurationAssignments: (opts?: {
    tenantId?: string;
    productId?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<ConfigurationListPage<TenantConfigurationAssignmentRecord>>(
      `/api/edge-backend/configuration/assignments${toQuery({
        tenantId: opts?.tenantId,
        productId: opts?.productId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getTenantConfigurationAssignment: (id: string) =>
    edgeRequest<TenantConfigurationAssignmentDetail | null>(
      `/api/edge-backend/configuration/assignments/${id}`,
    ),

  assignTenantConfiguration: (body: {
    tenantId: string;
    productId: string;
    provisioningRequestId: string;
    bundleId: string;
    bundleVersion: number;
    desiredConfig: Record<string, unknown>;
    grantedEntitlements: {
      capabilities?: Record<string, unknown>;
      featureFlags?: Record<string, unknown>;
      quotas?: Record<string, unknown>;
      limits?: Record<string, unknown>;
    };
    subscriptionId?: string;
    accountId?: string;
    entitlementSnapshotRef?: string;
    entitlementVersion?: string;
    deploymentStrategy?: string;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<TenantConfigurationAssignmentRecord>(
      `/api/edge-backend/configuration/assignments`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  deployTenantConfiguration: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/configuration/assignments/${id}/deploy`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  rollbackTenantConfiguration: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      reason?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/configuration/assignments/${id}/rollback`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listConfigurationDeploymentRuns: (assignmentId: string) =>
    edgeRequest<ConfigurationListPage<ConfigurationDeploymentRunRecord>>(
      `/api/edge-backend/configuration/assignments/${assignmentId}/runs`,
    ),

  listConfigurationEvidence: (assignmentId: string) =>
    edgeRequest<ConfigurationListPage<ConfigurationEvidenceRecord>>(
      `/api/edge-backend/configuration/assignments/${assignmentId}/evidence`,
    ),

  listEntitlementDeployments: (assignmentId: string) =>
    edgeRequest<ConfigurationListPage<EntitlementDeploymentRecord>>(
      `/api/edge-backend/entitlements/assignments/${assignmentId}`,
    ),

  reconcileTenantEntitlements: (
    assignmentId: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      reason?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/entitlements/assignments/${assignmentId}/reconcile`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  // --- P7.9 Product Experience Provisioning ---
  listExperienceProfiles: (opts?: {
    limit?: number;
    offset?: number;
    status?: string;
    q?: string;
    productId?: string;
  }) =>
    edgeRequest<ExperienceListPage<ExperienceProfile>>(
      `/api/edge-backend/experience/profiles${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
        productId: opts?.productId,
      })}`,
    ),

  createExperienceProfile: (body: {
    code: string;
    name: string;
    description?: string;
    productId?: string;
    compatibleRuntimeCodes?: string[];
    compatibleDeploymentProfileCodes?: string[];
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<ExperienceProfile>(
      `/api/edge-backend/experience/profiles`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  publishExperienceProfile: (
    id: string,
    body: { expectedVersion: number },
  ) =>
    edgeRequest<ExperienceProfile>(
      `/api/edge-backend/experience/profiles/${id}/publish`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listExperienceApplications: (opts?: {
    limit?: number;
    offset?: number;
    status?: string;
    q?: string;
    productId?: string;
    experienceProfileId?: string;
  }) =>
    edgeRequest<ExperienceListPage<ExperienceApplication>>(
      `/api/edge-backend/experience/applications${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
        q: opts?.q,
        productId: opts?.productId,
        experienceProfileId: opts?.experienceProfileId,
      })}`,
    ),

  createExperienceApplication: (body: {
    code: string;
    name: string;
    description?: string;
    productId?: string;
    applicationKind: string;
    experienceProfileId?: string;
    draftManifest: Record<string, unknown>;
    productVersion?: string;
    runtimeVersion?: string;
    apiCompatibilityVersion?: string;
    deploymentProfileCode?: string;
    configurationBundleCode?: string;
    entitlementSnapshotVersion?: string;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<ExperienceApplication>(
      `/api/edge-backend/experience/applications`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  publishExperienceApplication: (
    id: string,
    body: { expectedVersion: number; versionNumber?: number },
  ) =>
    edgeRequest<ExperienceApplication>(
      `/api/edge-backend/experience/applications/${id}/publish`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listTenantExperienceAssignments: (opts?: {
    tenantId?: string;
    productId?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<ExperienceListPage<TenantExperienceAssignment>>(
      `/api/edge-backend/experience/assignments${toQuery({
        tenantId: opts?.tenantId,
        productId: opts?.productId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getTenantExperienceAssignment: (id: string) =>
    edgeRequest<TenantExperienceAssignmentDetail | null>(
      `/api/edge-backend/experience/assignments/${id}`,
    ),

  assignTenantExperience: (body: {
    tenantId: string;
    productId: string;
    provisioningRequestId: string;
    experienceProfileId?: string;
    desiredManifest: Record<string, unknown>;
    subscriptionId?: string;
    accountId?: string;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<TenantExperienceAssignment>(
      `/api/edge-backend/experience/assignments`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  provisionTenantExperience: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/experience/assignments/${id}/provision`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  deactivateTenantExperience: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/experience/assignments/${id}/deactivate`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listExperienceDeploymentRuns: (assignmentId: string) =>
    edgeRequest<ExperienceListPage<ExperienceDeploymentRun>>(
      `/api/edge-backend/experience/assignments/${assignmentId}/runs`,
    ),

  listExperienceEvidence: (assignmentId: string) =>
    edgeRequest<ExperienceListPage<ExperienceEvidence>>(
      `/api/edge-backend/experience/assignments/${assignmentId}/evidence`,
    ),

  listExperienceDomains: (assignmentId: string) =>
    edgeRequest<ExperienceListPage<ExperienceDomainBinding>>(
      `/api/edge-backend/experience/assignments/${assignmentId}/domains`,
    ),

  createExperienceDomain: (body: {
    assignmentId: string;
    hostname: string;
    domainKind?: "SUBDOMAIN" | "CUSTOM";
  }) =>
    edgeRequest<ExperienceDomainBinding>(
      `/api/edge-backend/experience/domains`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  // --- P7.10 Technical Readiness & Activation ---
  listActivationEvaluations: (opts?: {
    tenantId?: string;
    productId?: string;
    status?: string;
    provisioningRequestId?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<ActivationListPage<TenantReadinessEvaluation>>(
      `/api/edge-backend/activation/evaluations${toQuery({
        tenantId: opts?.tenantId,
        productId: opts?.productId,
        status: opts?.status,
        provisioningRequestId: opts?.provisioningRequestId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getActivationEvaluation: (id: string) =>
    edgeRequest<ReadinessEvaluationDetail | null>(
      `/api/edge-backend/activation/evaluations/${id}`,
    ),

  createActivationEvaluation: (body: {
    tenantId: string;
    productId: string;
    provisioningRequestId: string;
    subscriptionId?: string;
    accountId?: string;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<TenantReadinessEvaluation>(
      `/api/edge-backend/activation/evaluations`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  evaluateActivationEvaluation: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      activationRecordId?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/activation/evaluations/${id}/evaluate`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listActivationRecords: (opts?: {
    tenantId?: string;
    productId?: string;
    status?: string;
    provisioningRequestId?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<ActivationListPage<ActivationRecord>>(
      `/api/edge-backend/activation/records${toQuery({
        tenantId: opts?.tenantId,
        productId: opts?.productId,
        status: opts?.status,
        provisioningRequestId: opts?.provisioningRequestId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getActivationRecord: (id: string) =>
    edgeRequest<ActivationRecordDetail | null>(
      `/api/edge-backend/activation/records/${id}`,
    ),

  createActivationRecord: (body: {
    tenantId: string;
    productId: string;
    provisioningRequestId: string;
    readinessEvaluationId?: string;
    subscriptionId?: string;
    accountId?: string;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<ActivationRecord>(
      `/api/edge-backend/activation/records`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  evaluateActivationRecord: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/activation/records/${id}/evaluate`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  activateActivationRecord: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/activation/records/${id}/activate`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listActivationRuns: (recordId: string) =>
    edgeRequest<ActivationListPage<ActivationRun>>(
      `/api/edge-backend/activation/records/${recordId}/runs`,
    ),

  listActivationEvidence: (recordId: string) =>
    edgeRequest<ActivationListPage<ActivationEvidence>>(
      `/api/edge-backend/activation/records/${recordId}/evidence`,
    ),

  // --- P7.11 Tenant Technical Lifecycle ---
  listLifecycleRecords: (opts?: {
    tenantId?: string;
    productId?: string;
    status?: string;
    activationRecordId?: string;
    provisioningRequestId?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<LifecycleListPage<TenantLifecycleRecord>>(
      `/api/edge-backend/lifecycle/records${toQuery({
        tenantId: opts?.tenantId,
        productId: opts?.productId,
        status: opts?.status,
        activationRecordId: opts?.activationRecordId,
        provisioningRequestId: opts?.provisioningRequestId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getLifecycleRecord: (id: string) =>
    edgeRequest<LifecycleRecordDetail | null>(
      `/api/edge-backend/lifecycle/records/${id}`,
    ),

  createLifecycleRecord: (body: {
    activationRecordId: string;
    retentionPolicyRef?: string;
    exportEvidenceRef?: string;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<TenantLifecycleRecord>(
      `/api/edge-backend/lifecycle/records`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  suspendLifecycleRecord: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      reason?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/lifecycle/records/${id}/suspend`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  resumeLifecycleRecord: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      reason?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/lifecycle/records/${id}/resume`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  deprovisionLifecycleRecord: (
    id: string,
    body: {
      authorized: true;
      confirmed: true;
      reason: string;
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      exportEvidenceRef?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/lifecycle/records/${id}/deprovision`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listLifecycleRuns: (recordId: string) =>
    edgeRequest<LifecycleListPage<LifecycleRun>>(
      `/api/edge-backend/lifecycle/records/${recordId}/runs`,
    ),

  listLifecycleEvidence: (recordId: string) =>
    edgeRequest<LifecycleListPage<LifecycleEvidence>>(
      `/api/edge-backend/lifecycle/records/${recordId}/evidence`,
    ),

  // --- P7.12 Onboarding Operations ---
  listOnboardingTemplates: (opts?: {
    status?: string;
    productId?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<OnboardingListPage<OnboardingTemplate>>(
      `/api/edge-backend/onboarding/templates${toQuery({
        status: opts?.status,
        productId: opts?.productId,
        q: opts?.q,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getOnboardingTemplate: (id: string) =>
    edgeRequest<OnboardingTemplate | null>(
      `/api/edge-backend/onboarding/templates/${id}`,
    ),

  createOnboardingTemplate: (body: {
    code: string;
    name: string;
    description?: string;
    productId?: string;
    deploymentProfileCode?: string;
    stepPlan?: Array<Record<string, unknown>>;
    slaPolicy?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<OnboardingTemplate>(
      `/api/edge-backend/onboarding/templates`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  publishOnboardingTemplate: (
    id: string,
    body: { expectedVersion: number },
  ) =>
    edgeRequest<OnboardingTemplate>(
      `/api/edge-backend/onboarding/templates/${id}/publish`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listOnboardingJourneys: (opts?: {
    tenantId?: string;
    productId?: string;
    status?: string;
    activationRecordId?: string;
    templateId?: string;
    provisioningRequestId?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<OnboardingListPage<OnboardingJourney>>(
      `/api/edge-backend/onboarding/journeys${toQuery({
        tenantId: opts?.tenantId,
        productId: opts?.productId,
        status: opts?.status,
        activationRecordId: opts?.activationRecordId,
        templateId: opts?.templateId,
        provisioningRequestId: opts?.provisioningRequestId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getOnboardingJourney: (id: string) =>
    edgeRequest<OnboardingJourneyDetail | null>(
      `/api/edge-backend/onboarding/journeys/${id}`,
    ),

  createOnboardingJourney: (body: {
    activationRecordId: string;
    templateId?: string;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<OnboardingJourney>(
      `/api/edge-backend/onboarding/journeys`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  startOnboardingJourney: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      reason?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/onboarding/journeys/${id}/start`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  advanceOnboardingJourney: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      reason?: string;
      handoverEvidenceRef?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/onboarding/journeys/${id}/advance`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  closeOnboardingJourney: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      reason?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/onboarding/journeys/${id}/close`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  decideOnboardingTask: (
    journeyId: string,
    taskId: string,
    body: {
      decision: "APPROVE" | "REJECT";
      reason?: string;
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/onboarding/journeys/${journeyId}/tasks/${taskId}/decide`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listOnboardingRuns: (journeyId: string) =>
    edgeRequest<OnboardingListPage<OnboardingRun>>(
      `/api/edge-backend/onboarding/journeys/${journeyId}/runs`,
    ),

  listOnboardingEvidence: (journeyId: string) =>
    edgeRequest<OnboardingListPage<OnboardingEvidence>>(
      `/api/edge-backend/onboarding/journeys/${journeyId}/evidence`,
    ),

  // --- P7.13 Reconciliation & Operational Governance ---
  listReconciliationPolicies: (opts?: {
    status?: string;
    scope?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<ReconciliationListPage<ReconciliationPolicy>>(
      `/api/edge-backend/reconciliation/policies${toQuery({
        status: opts?.status,
        scope: opts?.scope,
        q: opts?.q,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getReconciliationPolicy: (id: string) =>
    edgeRequest<ReconciliationPolicy | null>(
      `/api/edge-backend/reconciliation/policies/${id}`,
    ),

  createReconciliationPolicy: (body: {
    code: string;
    name: string;
    description?: string;
    scope?: string;
    autoRemediate?: boolean;
    requireApproval?: boolean;
    rules?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<ReconciliationPolicy>(
      `/api/edge-backend/reconciliation/policies`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listReconciliationRuns: (opts?: {
    tenantId?: string;
    productId?: string;
    status?: string;
    policyId?: string;
    providerCode?: string;
    provisioningRequestId?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<ReconciliationListPage<ReconciliationRun>>(
      `/api/edge-backend/reconciliation/runs${toQuery({
        tenantId: opts?.tenantId,
        productId: opts?.productId,
        status: opts?.status,
        policyId: opts?.policyId,
        providerCode: opts?.providerCode,
        provisioningRequestId: opts?.provisioningRequestId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getReconciliationRun: (id: string) =>
    edgeRequest<ReconciliationRunDetail | null>(
      `/api/edge-backend/reconciliation/runs/${id}`,
    ),

  createReconciliationRun: (body: {
    tenantId?: string;
    productId?: string;
    providerCode?: string;
    policyId?: string;
    triggerKind?: string;
    provisioningRequestId?: string;
    authorizationRowId?: string;
    authorizationVersion?: number;
    desiredSnapshot?: Record<string, unknown>;
    observedSnapshot?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    correlationId?: string;
  }) =>
    edgeRequest<ReconciliationRun>(
      `/api/edge-backend/reconciliation/runs`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  observeReconciliationRun: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      desired?: Array<Record<string, unknown>>;
      observed?: Array<Record<string, unknown>>;
      providerUnreachable?: boolean;
      reason?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/reconciliation/runs/${id}/observe`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  remediateReconciliationRun: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      findingId?: string;
      remediationId?: string;
      reason?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/reconciliation/runs/${id}/remediate`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  decideReconciliationRemediation: (
    runId: string,
    remediationId: string,
    body: {
      decision: "APPROVE" | "REJECT";
      reason?: string;
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/reconciliation/runs/${runId}/remediations/${remediationId}/decide`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listReconciliationFindings: (opts?: {
    runId?: string;
    tenantId?: string;
    status?: string;
    observationClass?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<ReconciliationListPage<ReconciliationFinding>>(
      `/api/edge-backend/reconciliation/findings${toQuery({
        runId: opts?.runId,
        tenantId: opts?.tenantId,
        status: opts?.status,
        observationClass: opts?.observationClass,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  quarantineReconciliationFinding: (
    id: string,
    body?: { reason?: string; provisioningRequestId?: string },
  ) =>
    edgeRequest<ReconciliationFinding>(
      `/api/edge-backend/reconciliation/findings/${id}/quarantine`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  createReconciliationWaiver: (body: {
    waiverCode: string;
    reason: string;
    expiresAt: string;
    findingId?: string;
    tenantId?: string;
    productId?: string;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<ReconciliationWaiver>(
      `/api/edge-backend/reconciliation/waivers`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listReconciliationWaivers: (opts?: {
    findingId?: string;
    tenantId?: string;
    status?: string;
    limit?: number;
  }) =>
    edgeRequest<ReconciliationWaiver[]>(
      `/api/edge-backend/reconciliation/waivers${toQuery({
        findingId: opts?.findingId,
        tenantId: opts?.tenantId,
        status: opts?.status,
        limit: opts?.limit,
      })}`,
    ),

  listReconciliationEvidence: (runId: string, opts?: { limit?: number }) =>
    edgeRequest<ReconciliationEvidence[]>(
      `/api/edge-backend/reconciliation/runs/${runId}/evidence${toQuery({
        limit: opts?.limit,
      })}`,
    ),

  // --- P7.14 Connectivity Agent & Edge Agent Registry ---
  listConnectivityAgents: (opts?: {
    status?: string;
    tenantId?: string;
    productId?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<ConnectivityAgentListPage<ConnectivityAgent>>(
      `/api/edge-backend/agents${toQuery({
        status: opts?.status,
        tenantId: opts?.tenantId,
        productId: opts?.productId,
        q: opts?.q,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getConnectivityAgent: (id: string) =>
    edgeRequest<ConnectivityAgentDetail | null>(
      `/api/edge-backend/agents/${id}`,
    ),

  createConnectivityAgent: (body: {
    agentCode: string;
    displayName: string;
    publicKeyRef: string;
    tenantId?: string;
    productId?: string;
    deploymentProfileCode?: string;
    certificateRef?: string;
    outboundOnly?: boolean;
    provisioningRequestId?: string;
    authorizationRowId?: string;
    authorizationVersion?: number;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<ConnectivityAgent>(`/api/edge-backend/agents`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  registerConnectivityAgent: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      reason?: string;
    },
  ) =>
    edgeRequest<unknown>(`/api/edge-backend/agents/${id}/register`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  commandConnectivityAgent: (
    id: string,
    body: {
      commandType: string;
      nonce: string;
      payloadRef?: string;
      signatureRef?: string;
      expiresAt?: string;
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      authorizationRowId?: string;
      authorizationVersion?: number;
      reason?: string;
      metadata?: Record<string, unknown>;
    },
  ) =>
    edgeRequest<unknown>(`/api/edge-backend/agents/${id}/command`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  revokeConnectivityAgent: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      reason?: string;
    },
  ) =>
    edgeRequest<unknown>(`/api/edge-backend/agents/${id}/revoke`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  listConnectivityAgentCommands: (
    id: string,
    opts?: { status?: string; limit?: number; offset?: number },
  ) =>
    edgeRequest<ConnectivityAgentListPage<AgentCommand>>(
      `/api/edge-backend/agents/${id}/commands${toQuery({
        status: opts?.status,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  listConnectivityAgentEvidence: (id: string, opts?: { limit?: number }) =>
    edgeRequest<AgentEvidence[]>(
      `/api/edge-backend/agents/${id}/evidence${toQuery({
        limit: opts?.limit,
      })}`,
    ),

  // --- P7.15 Production Certification & Evidence Pack ---
  listCertificationPackages: (opts?: {
    status?: string;
    productId?: string;
    deploymentProfileCode?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<CertificationListPage<CertificationPackage>>(
      `/api/edge-backend/certification/packages${toQuery({
        status: opts?.status,
        productId: opts?.productId,
        deploymentProfileCode: opts?.deploymentProfileCode,
        q: opts?.q,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getCertificationPackage: (id: string) =>
    edgeRequest<CertificationPackageDetail | null>(
      `/api/edge-backend/certification/packages/${id}`,
    ),

  createCertificationPackage: (body: {
    code: string;
    name: string;
    description?: string;
    productId?: string;
    deploymentProfileCode?: string;
    scope?: Record<string, unknown>;
    provisioningRequestId?: string;
    authorizationRowId?: string;
    authorizationVersion?: number;
    metadata?: Record<string, unknown>;
  }) =>
    edgeRequest<CertificationPackage>(
      `/api/edge-backend/certification/packages`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  assembleCertificationPackage: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      reason?: string;
      includeOptionalAgents?: boolean;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/certification/packages/${id}/assemble`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  certifyCertificationPackage: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      reason?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/certification/packages/${id}/certify`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  revokeCertificationPackage: (
    id: string,
    body?: {
      idempotencyKey?: string;
      correlationId?: string;
      provisioningRequestId?: string;
      reason?: string;
    },
  ) =>
    edgeRequest<unknown>(
      `/api/edge-backend/certification/packages/${id}/revoke`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  attachCertificationEvidence: (
    id: string,
    body: {
      evidenceKey: string;
      phaseCode?: string;
      required?: boolean;
      itemStatus?: string;
      sourceRef?: string;
      checksum?: string;
      details?: Record<string, unknown>;
    },
  ) =>
    edgeRequest<CertificationEvidenceItem>(
      `/api/edge-backend/certification/packages/${id}/evidence`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listCertificationEvidenceItems: (id: string) =>
    edgeRequest<CertificationEvidenceItem[]>(
      `/api/edge-backend/certification/packages/${id}/evidence-items`,
    ),

  listCertificationRuns: (
    id: string,
    opts?: { operation?: string; outcome?: string; limit?: number; offset?: number },
  ) =>
    edgeRequest<CertificationListPage<CertificationRun>>(
      `/api/edge-backend/certification/packages/${id}/runs${toQuery({
        operation: opts?.operation,
        outcome: opts?.outcome,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  listCertificationEvidence: (id: string, opts?: { limit?: number }) =>
    edgeRequest<CertificationEvidence[]>(
      `/api/edge-backend/certification/packages/${id}/evidence${toQuery({
        limit: opts?.limit,
      })}`,
    ),

  // --- P8 Tenant Management & Governance ---
  listTenants: (opts?: {
    q?: string;
    productId?: string;
    accountId?: string;
    subscriptionId?: string;
    region?: string;
    classification?: string;
    administrativeStatus?: string;
    technicalStatus?: string;
    governanceStatus?: string;
    healthStatus?: string;
    riskLevel?: string;
    tagKey?: string;
    tagValue?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<TenantManagementListPage<TenantRegistryRecord>>(
      `/api/edge-backend/tenants${toQuery({
        q: opts?.q,
        productId: opts?.productId,
        accountId: opts?.accountId,
        subscriptionId: opts?.subscriptionId,
        region: opts?.region,
        classification: opts?.classification,
        administrativeStatus: opts?.administrativeStatus,
        technicalStatus: opts?.technicalStatus,
        governanceStatus: opts?.governanceStatus,
        healthStatus: opts?.healthStatus,
        riskLevel: opts?.riskLevel,
        tagKey: opts?.tagKey,
        tagValue: opts?.tagValue,
        sortBy: opts?.sortBy,
        sortDir: opts?.sortDir,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getTenant: (id: string) =>
    edgeRequest<TenantRegistryRecord | null>(
      `/api/edge-backend/tenants/${id}`,
    ),

  getTenant360: (id: string) =>
    edgeRequest<Tenant360Overview | null>(
      `/api/edge-backend/tenants/${id}/360`,
    ),

  getTenantPortfolioAnalytics: () =>
    edgeRequest<TenantPortfolioMetrics>(
      `/api/edge-backend/tenant-management/analytics/portfolio`,
    ),

  registerTenant: (body: {
    productTenantId: string;
    tenantCode: string;
    displayName: string;
    productId: string;
    tenantSlug?: string;
    productCode?: string;
    accountId?: string;
    subscriptionId?: string;
    classification?: string;
    region?: string;
    metadata?: Record<string, unknown>;
    correlationId?: string;
  }) =>
    edgeRequest<TenantRegistryRecord>(`/api/edge-backend/tenants`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  syncTenantsFromP7: () =>
    edgeRequest<unknown>(`/api/edge-backend/tenants/sync-from-p7`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  updateTenantMetadata: (
    id: string,
    body: {
      expectedVersion: number;
      displayName?: string;
      classification?: string;
      segment?: string | null;
      region?: string | null;
      locale?: string | null;
      timezone?: string | null;
      defaultLanguage?: string | null;
      supportClassification?: string | null;
      deploymentProfile?: string | null;
      environmentClassification?: string;
      metadata?: Record<string, unknown>;
      correlationId?: string;
    },
  ) =>
    edgeRequest<TenantRegistryRecord>(`/api/edge-backend/tenants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  assignTenantOwner: (
    id: string,
    body: {
      expectedVersion: number;
      internalOwnerId?: string | null;
      operationalTeam?: string | null;
      correlationId?: string;
    },
  ) =>
    edgeRequest<TenantRegistryRecord>(
      `/api/edge-backend/tenants/${id}/owner`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  addTenantTag: (
    id: string,
    body: { tagKey: string; tagValue: string },
  ) =>
    edgeRequest<unknown>(`/api/edge-backend/tenants/${id}/tags`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  removeTenantTag: (id: string, tagKey: string, tagValue: string) =>
    edgeRequest<unknown>(
      `/api/edge-backend/tenants/${id}/tags${toQuery({ tagKey, tagValue })}`,
      { method: "DELETE" },
    ),

  addTenantNote: (
    id: string,
    body: { body: string; noteType?: string },
  ) =>
    edgeRequest<unknown>(`/api/edge-backend/tenants/${id}/notes`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listTenantActivity: (
    id: string,
    opts?: { limit?: number; offset?: number },
  ) =>
    edgeRequest<TenantManagementListPage<ActivityEventRecord>>(
      `/api/edge-backend/tenants/${id}/activity${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  requestTenantLifecycle: (
    id: string,
    body: {
      requestType: string;
      justification: string;
      idempotencyKey: string;
      riskAssessment?: string;
      correlationId?: string;
    },
  ) =>
    edgeRequest<LifecycleRequestRecord>(
      `/api/edge-backend/tenants/${id}/lifecycle-requests`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listTenantLifecycleRequests: (opts?: {
    tenantRegistryId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<TenantManagementListPage<LifecycleRequestRecord>>(
      `/api/edge-backend/tenant-management/lifecycle-requests${toQuery({
        tenantRegistryId: opts?.tenantRegistryId,
        status: opts?.status,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  approveTenantLifecycleRequest: (id: string, body?: { correlationId?: string }) =>
    edgeRequest<LifecycleRequestRecord>(
      `/api/edge-backend/tenant-management/lifecycle-requests/${id}/approve`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  rejectTenantLifecycleRequest: (
    id: string,
    body: { rejectedReason: string; correlationId?: string },
  ) =>
    edgeRequest<LifecycleRequestRecord>(
      `/api/edge-backend/tenant-management/lifecycle-requests/${id}/reject`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listTenantExceptions: (opts?: {
    tenantRegistryId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<TenantManagementListPage<ExceptionRecord>>(
      `/api/edge-backend/tenant-management/exceptions${toQuery({
        tenantRegistryId: opts?.tenantRegistryId,
        status: opts?.status,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  requestTenantException: (body: {
    tenantRegistryId: string;
    exceptionType?: string;
    description: string;
    businessJustification: string;
    startsAt: string;
    expiresAt: string;
    idempotencyKey: string;
    riskAssessment?: string;
    scope?: Record<string, unknown>;
    correlationId?: string;
  }) =>
    edgeRequest<ExceptionRecord>(
      `/api/edge-backend/tenant-management/exceptions`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  approveTenantException: (id: string) =>
    edgeRequest<ExceptionRecord>(
      `/api/edge-backend/tenant-management/exceptions/${id}/approve`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  revokeTenantException: (
    id: string,
    body: { revokeReason: string; correlationId?: string },
  ) =>
    edgeRequest<ExceptionRecord>(
      `/api/edge-backend/tenant-management/exceptions/${id}/revoke`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  expireTenantExceptions: () =>
    edgeRequest<unknown>(
      `/api/edge-backend/tenant-management/exceptions/expire-due`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  runTenantReconciliation: (body?: {
    mode?: string;
    dryRun?: boolean;
    correlationId?: string;
  }) =>
    edgeRequest<unknown>(
      `/api/edge-backend/tenant-management/reconciliation/runs`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listTenantReconciliationFindings: (opts?: {
    tenantRegistryId?: string;
    status?: string;
    runId?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<TenantManagementListPage<ReconciliationFindingRecord>>(
      `/api/edge-backend/tenant-management/reconciliation/findings${toQuery({
        tenantRegistryId: opts?.tenantRegistryId,
        status: opts?.status,
        runId: opts?.runId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  listTenantReconciliationRuns: (opts?: {
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<TenantManagementListPage<ReconciliationRunRecord>>(
      `/api/edge-backend/tenant-management/reconciliation/runs${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  acknowledgeTenantFinding: (
    id: string,
    body?: { note?: string; correlationId?: string },
  ) =>
    edgeRequest<ReconciliationFindingRecord>(
      `/api/edge-backend/tenant-management/reconciliation/findings/${id}/acknowledge`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listTenantMigrations: (opts?: {
    tenantRegistryId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<TenantManagementListPage<MigrationRequestRecord>>(
      `/api/edge-backend/tenant-management/migrations${toQuery({
        tenantRegistryId: opts?.tenantRegistryId,
        status: opts?.status,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  requestTenantMigration: (body: {
    tenantRegistryId: string;
    migrationType: string;
    justification: string;
    idempotencyKey: string;
    impactAssessment?: string;
    compatibilityAssessment?: string;
    dataResidencyReview?: string;
    downtimeAssessment?: string;
    targetRef?: Record<string, unknown>;
    scheduleAt?: string;
    correlationId?: string;
  }) =>
    edgeRequest<MigrationRequestRecord>(
      `/api/edge-backend/tenant-management/migrations`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  approveTenantMigration: (id: string, body?: { correlationId?: string }) =>
    edgeRequest<MigrationRequestRecord>(
      `/api/edge-backend/tenant-management/migrations/${id}/approve`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  rejectTenantMigration: (
    id: string,
    body: { rejectedReason: string; correlationId?: string },
  ) =>
    edgeRequest<MigrationRequestRecord>(
      `/api/edge-backend/tenant-management/migrations/${id}/reject`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listTenantRecoveries: (opts?: {
    tenantRegistryId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<TenantManagementListPage<RecoveryRequestRecord>>(
      `/api/edge-backend/tenant-management/recoveries${toQuery({
        tenantRegistryId: opts?.tenantRegistryId,
        status: opts?.status,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  requestTenantRecovery: (body: {
    tenantRegistryId: string;
    recoveryType: string;
    justification: string;
    idempotencyKey: string;
    priority?: string;
    scope?: Record<string, unknown>;
    backupRef?: string;
    restorePointRef?: string;
    rpoAssessment?: string;
    rtoMeasurement?: string;
    correlationId?: string;
  }) =>
    edgeRequest<RecoveryRequestRecord>(
      `/api/edge-backend/tenant-management/recoveries`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  approveTenantRecovery: (id: string, body?: { correlationId?: string }) =>
    edgeRequest<RecoveryRequestRecord>(
      `/api/edge-backend/tenant-management/recoveries/${id}/approve`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  rejectTenantRecovery: (
    id: string,
    body: { rejectedReason: string; correlationId?: string },
  ) =>
    edgeRequest<RecoveryRequestRecord>(
      `/api/edge-backend/tenant-management/recoveries/${id}/reject`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listTenantTerminations: (opts?: {
    tenantRegistryId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<TenantManagementListPage<TerminationRequestRecord>>(
      `/api/edge-backend/tenant-management/terminations${toQuery({
        tenantRegistryId: opts?.tenantRegistryId,
        status: opts?.status,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  requestTenantTermination: (body: {
    tenantRegistryId: string;
    justification: string;
    idempotencyKey: string;
    dataExportRef?: string;
    graceUntil?: string;
    correlationId?: string;
  }) =>
    edgeRequest<TerminationRequestRecord>(
      `/api/edge-backend/tenant-management/terminations`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  approveTenantTermination: (id: string, body?: { correlationId?: string }) =>
    edgeRequest<TerminationRequestRecord>(
      `/api/edge-backend/tenant-management/terminations/${id}/approve`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  rejectTenantTermination: (
    id: string,
    body: { rejectedReason: string; correlationId?: string },
  ) =>
    edgeRequest<TerminationRequestRecord>(
      `/api/edge-backend/tenant-management/terminations/${id}/reject`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  exportTenants: (opts?: {
    q?: string;
    productId?: string;
    accountId?: string;
    subscriptionId?: string;
    region?: string;
    classification?: string;
    administrativeStatus?: string;
    technicalStatus?: string;
    governanceStatus?: string;
    healthStatus?: string;
    riskLevel?: string;
    tagKey?: string;
    tagValue?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    format?: string;
  }) =>
    edgeRequestText(
      `/api/edge-backend/tenants/export${toQuery({
        q: opts?.q,
        productId: opts?.productId,
        accountId: opts?.accountId,
        subscriptionId: opts?.subscriptionId,
        region: opts?.region,
        classification: opts?.classification,
        administrativeStatus: opts?.administrativeStatus,
        technicalStatus: opts?.technicalStatus,
        governanceStatus: opts?.governanceStatus,
        healthStatus: opts?.healthStatus,
        riskLevel: opts?.riskLevel,
        tagKey: opts?.tagKey,
        tagValue: opts?.tagValue,
        sortBy: opts?.sortBy,
        sortDir: opts?.sortDir,
        format: opts?.format,
      })}`,
    ),

  previewBulkTenantOperation: (body: {
    operationType: "TAG" | "ASSIGN" | "CLASSIFY";
    filter: Record<string, unknown>;
    payload: Record<string, unknown>;
    idempotencyKey: string;
    correlationId?: string;
  }) =>
    edgeRequest<TenantBulkOperationRecord>(
      `/api/edge-backend/tenant-management/bulk/preview`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  executeBulkTenantOperation: (
    id: string,
    body: {
      expectedPreviewCount: number;
      correlationId?: string;
    },
  ) =>
    edgeRequest<TenantBulkOperationRecord>(
      `/api/edge-backend/tenant-management/bulk/${id}/execute`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listBulkTenantOperations: (opts?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<TenantManagementListPage<TenantBulkOperationRecord>>(
      `/api/edge-backend/tenant-management/bulk${toQuery({
        status: opts?.status,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  recordTenantHealthSnapshot: (
    tenantId: string,
    body: {
      overallStatus?: string;
      indicators?: Record<string, unknown>;
      sourceSystem: string;
      observedAt: string;
      staleAfter: string;
      correlationId?: string;
    },
  ) =>
    edgeRequest<TenantHealthSnapshotRecord>(
      `/api/edge-backend/tenants/${tenantId}/health-snapshots`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listTenantHealthSnapshots: (
    tenantId: string,
    opts?: { limit?: number; offset?: number },
  ) =>
    edgeRequest<TenantManagementListPage<TenantHealthSnapshotRecord>>(
      `/api/edge-backend/tenants/${tenantId}/health-snapshots${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  evaluateTenantRisk: (
    tenantId: string,
    body?: { correlationId?: string; reviewerId?: string },
  ) =>
    edgeRequest<TenantRiskAssessmentRecord>(
      `/api/edge-backend/tenants/${tenantId}/risk-assessments`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listTenantRiskAssessments: (
    tenantId: string,
    opts?: { limit?: number; offset?: number },
  ) =>
    edgeRequest<TenantManagementListPage<TenantRiskAssessmentRecord>>(
      `/api/edge-backend/tenants/${tenantId}/risk-assessments${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  updateTenantPolicies: (tenantId: string, body: TenantPoliciesPatch) =>
    edgeRequest<TenantRegistryRecord>(
      `/api/edge-backend/tenants/${tenantId}/policies`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),

  updateTenantLegalHold: (tenantId: string, body: TenantLegalHoldUpdate) =>
    edgeRequest<TenantRegistryRecord>(
      `/api/edge-backend/tenants/${tenantId}/legal-hold`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  authorizeTenantDeprovision: (tenantId: string, body: AuthorizeTenantDeprovisionBody) =>
    edgeRequest<TenantRegistryRecord>(
      `/api/edge-backend/tenants/${tenantId}/deprovision-authorization`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  requestTenantLegalHoldChange: (tenantId: string, body: RequestLegalHoldChangeBody) =>
    edgeRequest<LegalHoldChangeRequestRecord>(
      `/api/edge-backend/tenants/${tenantId}/legal-hold-requests`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listTenantLegalHoldChangeRequests: (opts?: {
    tenantRegistryId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<TenantManagementListPage<LegalHoldChangeRequestRecord>>(
      `/api/edge-backend/tenant-management/legal-hold-requests${toQuery({
        tenantRegistryId: opts?.tenantRegistryId,
        status: opts?.status,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  approveTenantLegalHoldChangeRequest: (requestId: string) =>
    edgeRequest<{ request: LegalHoldChangeRequestRecord; tenant: TenantRegistryRecord }>(
      `/api/edge-backend/tenant-management/legal-hold-requests/${requestId}/approve`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  // --- P9 Platform Operations -------------------------------------------------
  listPlatformServices: (opts?: {
    q?: string;
    category?: string;
    environment?: string;
    observationStatus?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<ServiceCatalogListPage>(
      `/api/edge-backend/operations/services${toQuery({
        q: opts?.q,
        category: opts?.category,
        environment: opts?.environment,
        observationStatus: opts?.observationStatus,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getPlatformService: (id: string) =>
    edgeRequest<PlatformServiceDetail>(`/api/edge-backend/operations/services/${id}`),

  registerPlatformService: (body: RegisterPlatformServiceBody) =>
    edgeRequest<PlatformServiceRecord>(`/api/edge-backend/operations/services`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updatePlatformService: (id: string, body: UpdatePlatformServiceBody) =>
    edgeRequest<PlatformServiceRecord>(`/api/edge-backend/operations/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  addPlatformServiceDependency: (id: string, body: AddServiceDependencyBody) =>
    edgeRequest<ServiceDependencyRecord>(
      `/api/edge-backend/operations/services/${id}/dependencies`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  removePlatformServiceDependency: (
    id: string,
    opts: { dependsOnServiceId: string; dependencyType: string },
  ) =>
    edgeRequest<{ ok: true }>(
      `/api/edge-backend/operations/services/${id}/dependencies${toQuery({
        dependsOnServiceId: opts.dependsOnServiceId,
        dependencyType: opts.dependencyType,
      })}`,
      { method: "DELETE" },
    ),

  getOperationsOverview: () =>
    edgeRequest<OperationsOverview>(`/api/edge-backend/operations/overview`),

  /** Mandate alias of overview. */
  getOperationsHealth: () =>
    edgeRequest<OperationsOverview>(`/api/edge-backend/operations/health`),

  recordServiceHealthSnapshot: (body: RecordHealthSnapshotBody) =>
    edgeRequest<unknown>(`/api/edge-backend/operations/health/snapshots`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listOperationalAlerts: (opts?: OperationsListFilter) =>
    edgeRequest<OperationsListPage<OperationalAlertRecord>>(
      `/api/edge-backend/operations/alerts${toQuery({
        status: opts?.status,
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  ingestOperationalAlert: (body: IngestAlertBody) =>
    edgeRequest<IngestAlertResult>(`/api/edge-backend/operations/alerts`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  acknowledgeOperationalAlert: (id: string, body?: AckAlertBody) =>
    edgeRequest<OperationalAlertRecord>(
      `/api/edge-backend/operations/alerts/${id}/acknowledge`,
      {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      },
    ),

  resolveOperationalAlert: (id: string, body?: ResolveAlertBody) =>
    edgeRequest<OperationalAlertRecord>(
      `/api/edge-backend/operations/alerts/${id}/resolve`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listIncidents: (opts?: OperationsListFilter & { isMajor?: boolean }) =>
    edgeRequest<OperationsListPage<IncidentRecord>>(
      `/api/edge-backend/operations/incidents${toQuery({
        status: opts?.status,
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
        isMajor: opts?.isMajor === undefined ? undefined : opts.isMajor ? 1 : 0,
      })}`,
    ),

  listMajorIncidents: (opts?: OperationsListFilter) =>
    edgeRequest<OperationsListPage<IncidentRecord>>(
      `/api/edge-backend/operations/major-incidents${toQuery({
        status: opts?.status,
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  getIncident: (id: string) =>
    edgeRequest<IncidentRecord>(`/api/edge-backend/operations/incidents/${id}`),

  createIncident: (body: CreateIncidentBody) =>
    edgeRequest<IncidentRecord>(`/api/edge-backend/operations/incidents`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  transitionIncident: (id: string, body: TransitionIncidentBody) =>
    edgeRequest<IncidentRecord>(`/api/edge-backend/operations/incidents/${id}/transition`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  declareMajorIncident: (id: string, body?: DeclareMajorIncidentBody) =>
    edgeRequest<IncidentRecord>(`/api/edge-backend/operations/incidents/${id}/major`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  listProblems: (opts?: OperationsListFilter) =>
    edgeRequest<OperationsListPage<ProblemRecord>>(
      `/api/edge-backend/operations/problems${toQuery({
        status: opts?.status,
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  createProblem: (body: CreateProblemBody) =>
    edgeRequest<ProblemRecord>(`/api/edge-backend/operations/problems`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  confirmProblemRootCause: (id: string, body: ConfirmRootCauseBody) =>
    edgeRequest<ProblemRecord>(
      `/api/edge-backend/operations/problems/${id}/root-cause`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  linkProblemIncident: (id: string, body: LinkProblemIncidentBody) =>
    edgeRequest<{ ok: true }>(
      `/api/edge-backend/operations/problems/${id}/incidents`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listChanges: (opts?: OperationsListFilter) =>
    edgeRequest<OperationsListPage<ChangeRequestRecord>>(
      `/api/edge-backend/operations/changes${toQuery({
        status: opts?.status,
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  /** Real release registry (not change alias). DEPLOYED requires evidence. */
  listReleases: (opts?: OperationsListFilter) =>
    edgeRequest<OperationsListPage<ReleaseRecord>>(
      `/api/edge-backend/operations/releases${toQuery({
        status: opts?.status,
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  createRelease: (body: CreateReleaseBody) =>
    edgeRequest<ReleaseRecord>(`/api/edge-backend/operations/releases`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  transitionRelease: (id: string, body: TransitionReleaseBody) =>
    edgeRequest<ReleaseRecord>(`/api/edge-backend/operations/releases/${id}/transition`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createChange: (body: CreateChangeBody) =>
    edgeRequest<ChangeRequestRecord>(`/api/edge-backend/operations/changes`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  submitChange: (id: string, body?: SubmitChangeBody) =>
    edgeRequest<ChangeRequestRecord>(`/api/edge-backend/operations/changes/${id}/submit`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  approveChange: (id: string, body?: ApproveChangeBody) =>
    edgeRequest<ChangeRequestRecord>(`/api/edge-backend/operations/changes/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  rejectChange: (id: string, body: RejectChangeBody) =>
    edgeRequest<ChangeRequestRecord>(`/api/edge-backend/operations/changes/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listMaintenanceWindows: (opts?: OperationsListFilter) =>
    edgeRequest<OperationsListPage<MaintenanceWindowRecord>>(
      `/api/edge-backend/operations/maintenance${toQuery({
        status: opts?.status,
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  createMaintenanceWindow: (body: CreateMaintenanceBody) =>
    edgeRequest<MaintenanceWindowRecord>(`/api/edge-backend/operations/maintenance`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listServiceRequests: (opts?: OperationsListFilter) =>
    edgeRequest<OperationsListPage<ServiceRequestRecord>>(
      `/api/edge-backend/operations/requests${toQuery({
        status: opts?.status,
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  createServiceRequest: (body: CreateServiceRequestBody) =>
    edgeRequest<ServiceRequestRecord>(`/api/edge-backend/operations/requests`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listOperationalTasks: (opts?: OperationsListFilter) =>
    edgeRequest<OperationsListPage<OperationalTaskRecord>>(
      `/api/edge-backend/operations/tasks${toQuery({
        status: opts?.status,
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  createOperationalTask: (body: CreateOperationalTaskBody) =>
    edgeRequest<OperationalTaskRecord>(`/api/edge-backend/operations/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listOnCallRotations: (opts?: { teamId?: string; limit?: number; offset?: number }) =>
    edgeRequest<OperationsListPage<OnCallRotationRecord>>(
      `/api/edge-backend/operations/on-call/rotations${toQuery({
        teamId: opts?.teamId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  createOnCallRotation: (body: CreateOnCallRotationBody) =>
    edgeRequest<OnCallRotationRecord>(`/api/edge-backend/operations/on-call/rotations`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSloDefinitions: (opts?: { serviceId?: string; limit?: number; offset?: number }) =>
    edgeRequest<OperationsListPage<SloDefinitionRecord>>(
      `/api/edge-backend/operations/slo${toQuery({
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  createSloDefinition: (body: CreateSloBody) =>
    edgeRequest<SloDefinitionRecord>(`/api/edge-backend/operations/slo`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  recordSloMeasurement: (id: string, body: RecordSloMeasurementBody) =>
    edgeRequest<SloMeasurementRecord>(`/api/edge-backend/operations/slo/measurements`, {
      method: "POST",
      body: JSON.stringify({ ...body, sloId: id }),
    }),

  listCapacityMeasurements: (opts?: {
    serviceId?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<OperationsListPage<CapacityMeasurementRecord>>(
      `/api/edge-backend/operations/capacity${toQuery({
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  recordCapacityMeasurement: (body: RecordCapacityBody) =>
    edgeRequest<CapacityMeasurementRecord>(`/api/edge-backend/operations/capacity`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listRecoveryOperations: (opts?: OperationsListFilter) =>
    edgeRequest<OperationsListPage<RecoveryOperationRecord>>(
      `/api/edge-backend/operations/recovery${toQuery({
        status: opts?.status,
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  requestRecoveryOperation: (body: RequestRecoveryBody) =>
    edgeRequest<RecoveryOperationRecord>(`/api/edge-backend/operations/recovery`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verifyRecoveryOperation: (id: string, body: VerifyRecoveryBody) =>
    edgeRequest<RecoveryOperationRecord>(
      `/api/edge-backend/operations/recovery/${id}/verify`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listNotificationDeliveries: (opts?: OperationsListFilter) =>
    edgeRequest<OperationsListPage<NotificationDeliveryRecord>>(
      `/api/edge-backend/operations/notifications${toQuery({
        status: opts?.status,
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  recordNotificationDelivery: (body: RecordNotificationDeliveryBody) =>
    edgeRequest<NotificationDeliveryRecord>(`/api/edge-backend/operations/notifications`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateNotificationDeliveryStatus: (
    id: string,
    body: UpdateNotificationDeliveryStatusBody,
  ) =>
    edgeRequest<NotificationDeliveryRecord>(
      `/api/edge-backend/operations/notifications/${id}/status`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  connectMonitoringSource: (body: ConnectMonitoringSourceBody) =>
    edgeRequest<MonitoringSourceRecord>(`/api/edge-backend/operations/monitoring/sources`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  recordMonitoringProbe: (body: RecordMonitoringProbeBody) =>
    edgeRequest<MonitoringProbeRecord>(`/api/edge-backend/operations/monitoring/probes`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listMonitoringProbes: (opts?: { sourceId?: string; limit?: number }) =>
    edgeRequest<OperationsListPage<MonitoringProbeRecord> | MonitoringProbeRecord[]>(
      `/api/edge-backend/operations/monitoring/probes${toQuery({
        sourceId: opts?.sourceId,
        limit: opts?.limit,
      })}`,
    ),

  listRunbooks: (opts?: { serviceId?: string; limit?: number; offset?: number }) =>
    edgeRequest<OperationsListPage<RunbookRecord>>(
      `/api/edge-backend/operations/runbooks${toQuery({
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  createRunbook: (body: CreateRunbookBody) =>
    edgeRequest<{ runbook: RunbookRecord } | RunbookRecord>(
      `/api/edge-backend/operations/runbooks`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listStatusComponents: (opts?: { limit?: number; offset?: number }) =>
    edgeRequest<OperationsListPage<StatusComponentRecord>>(
      `/api/edge-backend/operations/status/components${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  /** Mandate alias of status/components. */
  listStatusPages: (opts?: { limit?: number; offset?: number }) =>
    edgeRequest<OperationsListPage<StatusComponentRecord>>(
      `/api/edge-backend/operations/status-pages${toQuery({
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  publishStatusUpdate: (body: PublishStatusBody) =>
    edgeRequest<StatusPublicationRecord>(
      `/api/edge-backend/operations/status/publications`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  approveStatusPublication: (id: string, body?: ApproveStatusPublicationBody) =>
    edgeRequest<StatusPublicationRecord>(
      `/api/edge-backend/operations/status/publications/${id}/approve`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listOperationalRisks: (opts?: OperationsListFilter) =>
    edgeRequest<OperationsListPage<OperationalRiskRecord>>(
      `/api/edge-backend/operations/risks${toQuery({
        status: opts?.status,
        serviceId: opts?.serviceId,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  createOperationalRisk: (body: CreateOperationalRiskBody) =>
    edgeRequest<OperationalRiskRecord>(`/api/edge-backend/operations/risks`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listOperationalExceptions: (opts?: OperationsListFilter) =>
    edgeRequest<OperationsListPage<OperationalExceptionRecord>>(
      `/api/edge-backend/operations/exceptions${toQuery({
        status: opts?.status,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  createOperationalException: (body: CreateOperationalExceptionBody) =>
    edgeRequest<OperationalExceptionRecord>(`/api/edge-backend/operations/exceptions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  flagExpiredOperationalExceptions: () =>
    edgeRequest<{ flagged: number } | { count: number } | unknown>(
      `/api/edge-backend/operations/exceptions/flag-expired`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  listAutomations: (opts?: OperationsListFilter) =>
    edgeRequest<OperationsListPage<AutomationDefinitionRecord>>(
      `/api/edge-backend/operations/automation${toQuery({
        status: opts?.status,
        limit: opts?.limit,
        offset: opts?.offset,
      })}`,
    ),

  createAutomation: (body: CreateAutomationBody) =>
    edgeRequest<AutomationDefinitionRecord>(`/api/edge-backend/operations/automation`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  requestAutomationExecution: (body: RequestAutomationExecutionBody) =>
    edgeRequest<AutomationExecutionRecord>(
      `/api/edge-backend/operations/automation/executions`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  approveAutomationExecution: (id: string, body?: ApproveAutomationExecutionBody) =>
    edgeRequest<AutomationExecutionRecord>(
      `/api/edge-backend/operations/automation/executions/${id}/approve`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  executeAutomation: (id: string, body?: ExecuteAutomationBody) =>
    edgeRequest<AutomationExecutionRecord>(
      `/api/edge-backend/operations/automation/executions/${id}/execute`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  getOperationsAnalytics: () =>
    edgeRequest<OperationsAnalytics>(`/api/edge-backend/operations/analytics`),

  // --- P10 Acquisition --------------------------------------------------------

  getAcquisitionOverview: () =>
    edgeRequest<AcquisitionOverview>(`/api/edge-backend/acquisition/overview`),

  listAcquisitionProducts: (params?: AcquisitionListFilter) =>
    edgeRequest<AcquisitionListPage<ProductPresentation>>(
      `/api/edge-backend/acquisition/products${toQuery({
        status: params?.status,
        productId: params?.productId,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  createAcquisitionProduct: (body: CreateProductPresentationBody) =>
    edgeRequest<ProductPresentation>(`/api/edge-backend/acquisition/products`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createAcquisitionProductContent: (
    presentationId: string,
    body: PublishContentBody,
  ) =>
    edgeRequest<ProductContentVersion>(
      `/api/edge-backend/acquisition/products/${presentationId}/content`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  publishAcquisitionProductContent: (
    presentationId: string,
    versionId: string,
    body?: PublishContentBody,
  ) =>
    edgeRequest<ProductContentVersion>(
      `/api/edge-backend/acquisition/products/${presentationId}/content/${versionId}/publish`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listAcquisitionPlans: (params?: AcquisitionListFilter) =>
    edgeRequest<AcquisitionListPage<PlanPresentation>>(
      `/api/edge-backend/acquisition/plans${toQuery({
        status: params?.status,
        productPresentationId: params?.productPresentationId,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  createAcquisitionPlan: (body: CreatePlanPresentationBody) =>
    edgeRequest<PlanPresentation>(`/api/edge-backend/acquisition/plans`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listAcquisitionSegments: (params?: AcquisitionListFilter) =>
    edgeRequest<AcquisitionListPage<SegmentPresentation>>(
      `/api/edge-backend/acquisition/segments${toQuery({
        status: params?.status,
        productPresentationId: params?.productPresentationId,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  createAcquisitionSegment: (body: CreateSegmentPresentationBody) =>
    edgeRequest<SegmentPresentation>(`/api/edge-backend/acquisition/segments`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listAcquisitionProspects: (params?: AcquisitionListFilter) =>
    edgeRequest<AcquisitionListPage<Prospect>>(
      `/api/edge-backend/acquisition/prospects${toQuery({
        status: params?.status,
        productId: params?.productId,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  createAcquisitionProspect: (body: CreateProspectBody) =>
    edgeRequest<Prospect>(`/api/edge-backend/acquisition/prospects`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  transitionAcquisitionProspect: (
    id: string,
    body: TransitionProspectBody,
  ) =>
    edgeRequest<Prospect>(
      `/api/edge-backend/acquisition/prospects/${id}/transition`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listAcquisitionLeads: (params?: AcquisitionListFilter) =>
    edgeRequest<AcquisitionListPage<AcquisitionLead>>(
      `/api/edge-backend/acquisition/leads${toQuery({
        status: params?.status,
        prospectId: params?.prospectId,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  captureAcquisitionLead: (body: CaptureLeadBody) =>
    edgeRequest<AcquisitionLead>(`/api/edge-backend/acquisition/leads`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  promoteAcquisitionLead: (id: string, body?: PromoteLeadBody) =>
    edgeRequest<AcquisitionLead>(
      `/api/edge-backend/acquisition/leads/${id}/promote`,
      { method: "POST", body: JSON.stringify(body ?? {}) },
    ),

  listAcquisitionForms: (params?: AcquisitionListFilter) =>
    edgeRequest<AcquisitionListPage<FormSchema>>(
      `/api/edge-backend/acquisition/forms${toQuery({
        status: params?.status,
        productId: params?.productId,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  createAcquisitionForm: (body: CreateFormSchemaBody) =>
    edgeRequest<FormSchema>(`/api/edge-backend/acquisition/forms`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Instantiate a product-owned acquisition contract template as a draft form (not auto-published). */
  createAcquisitionFormFromContract: (body: {
    productId: string;
    contractCode:
      | "pharmacy.retail.v1"
      | "restaurant.hospitality.v1"
      | "retail.commerce.v1"
      | "enterprise.deployment.v1"
      | string;
    code: string;
    name: string;
    correlationId?: string;
  }) =>
    edgeRequest<FormSchema>(`/api/edge-backend/acquisition/forms/from-contract`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createAcquisitionFormVersion: (
    formSchemaId: string,
    body: CreateFormVersionBody,
  ) =>
    edgeRequest<FormVersion>(
      `/api/edge-backend/acquisition/forms/${formSchemaId}/versions`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  publishAcquisitionFormVersion: (
    versionId: string,
    body?: {
      channel?: string;
      publicSlug?: string | null;
      expiresAt?: string;
      metadata?: Record<string, unknown>;
      correlationId?: string;
    },
  ) =>
    edgeRequest<FormVersion>(
      `/api/edge-backend/acquisition/forms/versions/${versionId}/publish`,
      {
        method: "POST",
        body: JSON.stringify(
          body ?? { channel: "PUBLIC_WEB", publicSlug: `form-${versionId.slice(0, 8)}` },
        ),
      },
    ),

  listAcquisitionCheckouts: (params?: AcquisitionListFilter) =>
    edgeRequest<AcquisitionListPage<CheckoutSession>>(
      `/api/edge-backend/acquisition/checkout${toQuery({
        status: params?.status,
        prospectId: params?.prospectId,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  getAcquisitionCheckout: (id: string) =>
    edgeRequest<CheckoutSession>(
      `/api/edge-backend/acquisition/checkout/${encodeURIComponent(id)}`,
    ),

  listAcquisitionHandoffs: (params?: AcquisitionListFilter) =>
    edgeRequest<AcquisitionListPage<SubscriptionHandoff>>(
      `/api/edge-backend/acquisition/handoffs${toQuery({
        status: params?.status,
        prospectId: params?.prospectId,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  listAcquisitionApplications: (params?: AcquisitionListFilter) =>
    edgeRequest<AcquisitionListPage<Application>>(
      `/api/edge-backend/acquisition/applications${toQuery({
        status: params?.status,
        prospectId: params?.prospectId,
        productId: params?.productId,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  createAcquisitionApplication: (body: CreateApplicationDraftBody) =>
    edgeRequest<Application>(`/api/edge-backend/acquisition/applications`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  saveAcquisitionApplicationAnswers: (
    id: string,
    body: {
      answers: Record<string, unknown> | Array<{ fieldKey: string; value: unknown }>;
      expectedVersion?: number;
      correlationId?: string;
    },
  ) =>
    edgeRequest<Application>(
      `/api/edge-backend/acquisition/applications/${id}/answers`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  submitAcquisitionApplication: (id: string) =>
    edgeRequest<Application>(
      `/api/edge-backend/acquisition/applications/${id}/submit`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  transitionAcquisitionApplication: (
    id: string,
    body: TransitionApplicationBody,
  ) =>
    edgeRequest<Application>(
      `/api/edge-backend/acquisition/applications/${id}/transition`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  requestAcquisitionApplicationInformation: (
    id: string,
    body: RequestInformationBody,
  ) =>
    edgeRequest<Application>(
      `/api/edge-backend/acquisition/applications/${id}/request-information`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  listAcquisitionDocuments: (params?: AcquisitionListFilter) =>
    edgeRequest<AcquisitionListPage<DocumentReference>>(
      `/api/edge-backend/acquisition/documents${toQuery({
        status: params?.status,
        applicationId: params?.applicationId,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  registerAcquisitionDocument: (body: RegisterDocumentBody) =>
    edgeRequest<DocumentReference>(`/api/edge-backend/acquisition/documents`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  reviewAcquisitionDocument: (id: string, body: ReviewDocumentBody) =>
    edgeRequest<DocumentReference>(
      `/api/edge-backend/acquisition/documents/${id}/review`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  createAcquisitionDocumentRequirement: (body: {
    code: string;
    name: string;
    documentType: string;
    description?: string | null;
    formSchemaId?: string | null;
    required?: boolean;
    conditionRules?: unknown;
    metadata?: Record<string, unknown>;
    correlationId?: string;
  }) =>
    edgeRequest<DocumentRequirement>(
      `/api/edge-backend/acquisition/document-requirements`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  startAcquisitionQualification: (body: StartQualificationBody) =>
    edgeRequest(`/api/edge-backend/acquisition/qualification/start`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  decideAcquisitionQualification: (
    applicationId: string,
    body: DecideQualificationBody,
  ) =>
    edgeRequest(`/api/edge-backend/acquisition/qualification/${applicationId}/decide`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listAcquisitionQuotations: (params?: AcquisitionListFilter) =>
    edgeRequest<AcquisitionListPage<QuoteRequest>>(
      `/api/edge-backend/acquisition/quotations${toQuery({
        status: params?.status,
        prospectId: params?.prospectId,
        applicationId: params?.applicationId,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  createAcquisitionQuotation: (body: CreateQuoteRequestBody) =>
    edgeRequest<QuoteRequest>(`/api/edge-backend/acquisition/quotations`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  attachAcquisitionQuoteReference: (
    quoteRequestId: string,
    body: AttachQuoteReferenceBody,
  ) =>
    edgeRequest<QuoteReference>(
      `/api/edge-backend/acquisition/quotations/${quoteRequestId}/references`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  acceptAcquisitionQuote: (quoteRequestId: string) =>
    edgeRequest<QuoteRequest>(
      `/api/edge-backend/acquisition/quotations/${quoteRequestId}/accept`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  createAcquisitionCheckout: (body: CreateCheckoutBody) =>
    edgeRequest<CheckoutSession>(`/api/edge-backend/acquisition/checkout`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  attachAcquisitionPaymentReference: (
    checkoutSessionId: string,
    body: AttachPaymentBody,
  ) =>
    edgeRequest<CheckoutSession>(
      `/api/edge-backend/acquisition/checkout/${checkoutSessionId}/payment-reference`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  /** P6 orchestration — no card credentials; amount/currency from revalidated terms. */
  initiateAcquisitionPayment: (
    checkoutSessionId: string,
    body: InitiateAcquisitionPaymentBody,
  ) =>
    edgeRequest<{
      checkout?: CheckoutSession;
      paymentIntent?: { id?: string; providerIntentRef?: string | null };
      providerResult?: { status?: string };
      paymentIntentRef?: string;
    }>(
      `/api/edge-backend/acquisition/checkout/${encodeURIComponent(checkoutSessionId)}/initiate-payment`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  recordAcquisitionPaymentResult: (
    checkoutSessionId: string,
    body: RecordPaymentResultBody,
  ) =>
    edgeRequest<CheckoutSession>(
      `/api/edge-backend/acquisition/checkout/${checkoutSessionId}/payment-result`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  revalidateAcquisitionPlanBeforeCheckout: (body: {
    commercialPlanId?: string;
    planPresentationId?: string;
  }) =>
    edgeRequest(`/api/edge-backend/acquisition/checkout/revalidate-plan`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  requestAcquisitionHandoff: (body: RequestHandoffBody) =>
    edgeRequest<SubscriptionHandoff>(`/api/edge-backend/acquisition/handoffs`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  completeAcquisitionHandoff: (id: string, body: CompleteHandoffBody) =>
    edgeRequest<SubscriptionHandoff>(
      `/api/edge-backend/acquisition/handoffs/${id}/complete`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  getAcquisitionJourneyByApplication: (applicationId: string) =>
    edgeRequest<JourneyInstance | null>(
      `/api/edge-backend/acquisition/journeys/${applicationId}`,
    ),

  advanceAcquisitionJourney: (id: string, body: AdvanceJourneyBody) =>
    edgeRequest<JourneyInstance>(
      `/api/edge-backend/acquisition/journeys/${id}/advance`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  getAcquisitionCustomerPortal: (prospectId: string) =>
    edgeRequest<CustomerPortalSnapshot>(
      `/api/edge-backend/acquisition/customer-portal/${prospectId}`,
    ),

  queueAcquisitionCommunication: (body: QueueCommunicationBody) =>
    edgeRequest<AcquisitionCommunication>(
      `/api/edge-backend/acquisition/communications`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  updateAcquisitionCommunicationStatus: (
    id: string,
    body: {
      status: string;
      providerRef?: string | null;
      metadata?: Record<string, unknown>;
      correlationId?: string;
    },
  ) =>
    edgeRequest<AcquisitionCommunication>(
      `/api/edge-backend/acquisition/communications/${id}/status`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),

  recordAcquisitionAnalyticsEvent: (body: RecordAnalyticsBody) =>
    edgeRequest(`/api/edge-backend/acquisition/analytics/events`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getAcquisitionConversionFunnel: (params?: {
    prospectId?: string;
    limit?: number;
  }) =>
    edgeRequest<ConversionFunnel>(
      `/api/edge-backend/acquisition/analytics/funnel${toQuery({
        prospectId: params?.prospectId,
        limit: params?.limit,
      })}`,
    ),

  /** Public acquisition — unauthenticated proxy (`/api/acquisition-public`). */
  getPublicAcquisitionProducts: (params?: AcquisitionListFilter) =>
    edgeRequest<AcquisitionListPage<PublicProductDiscoveryItem>>(
      `/api/acquisition-public/products${toQuery({
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  getPublicAcquisitionProduct: (slug: string) =>
    edgeRequest<PublicProductPage>(
      `/api/acquisition-public/products/${encodeURIComponent(slug)}`,
    ),

  getPublicAcquisitionPlans: (params?: {
    productPresentationId?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<AcquisitionListPage<PlanPresentation>>(
      `/api/acquisition-public/plans${toQuery({
        productPresentationId: params?.productPresentationId,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  getPublicAcquisitionForm: (publicSlug: string) =>
    edgeRequest<PublicFormPayload>(
      `/api/acquisition-public/forms/${encodeURIComponent(publicSlug)}`,
    ),

  getPublicAcquisitionCheckout: (id: string) =>
    edgeRequest<{
      id: string;
      status: string;
      applicationId: string | null;
      prospectId: string;
      planPresentationId: string | null;
      commercialPlanId: string | null;
      quoteReferenceId: string | null;
      createdAt: string;
      updatedAt: string;
      note?: string;
    }>(`/api/acquisition-public/checkout/${encodeURIComponent(id)}`),

  postPublicAcquisitionLead: (body: CaptureLeadBody) =>
    edgeRequest<AcquisitionLead>(`/api/acquisition-public/leads`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  postPublicAcquisitionAnalytics: (body: RecordAnalyticsBody) =>
    edgeRequest(`/api/acquisition-public/analytics/events`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // --- P11 Revenue Operations -------------------------------------------------

  getRevenueOverview: (params?: { businessUnitId?: string; asOf?: string }) =>
    edgeRequest<RevenueOverview>(
      `/api/edge-backend/revenue/overview${toQuery({
        businessUnitId: params?.businessUnitId,
        asOf: params?.asOf,
      })}`,
    ),

  getBusinessOverview: (params?: { businessUnitId?: string; asOf?: string }) =>
    edgeRequest<RevenueOverview>(
      `/api/edge-backend/business/overview${toQuery({
        businessUnitId: params?.businessUnitId,
        asOf: params?.asOf,
      })}`,
    ),

  listRevenueMetricDefinitions: (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<RevenueListPage<MetricDefinition>>(
      `/api/edge-backend/revenue/metrics/definitions${toQuery({
        status: params?.status,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  registerRevenueMetricDefinition: (body: RegisterMetricDefinitionBody) =>
    edgeRequest<MetricDefinition>(`/api/edge-backend/revenue/metrics/definitions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  publishRevenueMetricDefinition: (definitionId: string) =>
    edgeRequest<{ definition: MetricDefinition; version: MetricDefinitionVersion }>(
      `/api/edge-backend/revenue/metrics/definitions/${encodeURIComponent(definitionId)}/publish`,
      { method: "POST", body: JSON.stringify({}) },
    ),

  recordRevenueMetricSnapshot: (body: RecordMetricSnapshotBody) =>
    edgeRequest<MetricSnapshot>(`/api/edge-backend/revenue/metrics/snapshots`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  computeRevenueMrrMovement: (body: ComputeMrrMovementBody) =>
    edgeRequest<ComputeMrrMovementResponse>(`/api/edge-backend/revenue/mrr/compute`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Retention overview — GRR excludes expansion; missing snapshots → UNAVAILABLE. */
  getRevenueRetentionOverview: (params?: {
    businessUnitId?: string;
    cohortId?: string;
    asOf?: string;
  }) =>
    edgeRequest<RetentionOverview>(
      `/api/edge-backend/revenue/retention${toQuery({
        businessUnitId: params?.businessUnitId,
        cohortId: params?.cohortId,
        asOf: params?.asOf,
      })}`,
    ),

  getRenewalIntelligence: (params?: { withinDays?: number; limit?: number }) =>
    edgeRequest(
      `/api/edge-backend/revenue/renewals/intelligence${toQuery({
        withinDays: params?.withinDays,
        limit: params?.limit,
      })}`,
    ),

  listBusinessAlerts: (params?: { status?: string; limit?: number; offset?: number }) =>
    edgeRequest(
      `/api/edge-backend/business/alerts${toQuery({
        status: params?.status,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  acknowledgeBusinessAlert: (alertId: string) =>
    edgeRequest(`/api/edge-backend/business/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  listBusinessTargets: (params?: { limit?: number; offset?: number }) =>
    edgeRequest(
      `/api/edge-backend/business/targets${toQuery({
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  listBusinessReports: (params?: { limit?: number; offset?: number }) =>
    edgeRequest(
      `/api/edge-backend/business/reports${toQuery({
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  generateBusinessReport: (body: {
    code: string;
    title: string;
    reportType: string;
    periodStart: string;
    periodEnd: string;
    asOf?: string;
    currency?: string;
    businessUnitId?: string;
  }) =>
    edgeRequest(`/api/edge-backend/business/reports/generate`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  runRevenueAssuranceScan: (body?: Record<string, unknown>) =>
    edgeRequest(`/api/edge-backend/revenue/assurance/scan`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  createRevenueForecast: (body: CreateRevenueForecastBody) =>
    edgeRequest<RevenueForecast>(`/api/edge-backend/revenue/forecasts`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createRevenueForecastScenario: (
    forecastId: string,
    body: CreateForecastScenarioBody,
  ) =>
    edgeRequest<RevenueForecastScenario>(
      `/api/edge-backend/revenue/forecasts/${encodeURIComponent(forecastId)}/scenarios`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  createRevenueLeakageCase: (body: CreateLeakageCaseBody) =>
    edgeRequest<RevenueLeakageCase>(`/api/edge-backend/revenue/leakage-cases`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  transitionRevenueLeakageCase: (
    caseId: string,
    body: TransitionLeakageCaseBody,
  ) =>
    edgeRequest<RevenueLeakageCase>(
      `/api/edge-backend/revenue/leakage-cases/${encodeURIComponent(caseId)}/transition`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  createCommissionPlan: (body: CreateCommissionPlanBody) =>
    edgeRequest<CommissionPlan>(`/api/edge-backend/revenue/commission/plans`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Alias path when BFF exposes commission under /commission/* */
  createCommissionPlanAlias: (body: CreateCommissionPlanBody) =>
    edgeRequest<CommissionPlan>(`/api/edge-backend/commission/plans`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  calculateCommission: (body: CalculateCommissionBody) =>
    edgeRequest<CommissionCalculation>(
      `/api/edge-backend/revenue/commission/calculations`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  calculateCommissionAlias: (body: CalculateCommissionBody) =>
    edgeRequest<CommissionCalculation>(`/api/edge-backend/commission/calculations`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listCommissionPlans: () =>
    edgeRequest<CommissionPlansReadPlaceholder>(
      `/api/edge-backend/revenue/commission/plans`,
    ),

  listCommissionPlansAlias: () =>
    edgeRequest<CommissionPlansReadPlaceholder>(`/api/edge-backend/commission/plans`),

  listBusinessAudit: (params?: {
    aggregateType?: string;
    aggregateId?: string;
    eventType?: string;
    limit?: number;
    offset?: number;
  }) =>
    edgeRequest<RevenueListPage<BusinessAuditEvent>>(
      `/api/edge-backend/business/audit${toQuery({
        aggregateType: params?.aggregateType,
        aggregateId: params?.aggregateId,
        eventType: params?.eventType,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  appendBusinessAudit: (body: AppendBusinessAuditBody) =>
    edgeRequest<BusinessAuditEvent>(`/api/edge-backend/business/audit`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
