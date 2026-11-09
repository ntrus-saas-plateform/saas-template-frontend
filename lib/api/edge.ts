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
};
