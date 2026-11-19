/** @vitest-environment jsdom */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const getTenant360 = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/edge",
}));

vi.mock("@/lib/api/edge", () => ({
  EdgeApiError: class EdgeApiError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  edgeApi: {
    getTenant360: (...args: unknown[]) => getTenant360(...args),
    listTenantActivity: vi.fn().mockResolvedValue({ data: { items: [], total: 0 } }),
    listTenantLifecycleRequests: vi
      .fn()
      .mockResolvedValue({ data: { items: [], total: 0 } }),
    listTenantExceptions: vi.fn().mockResolvedValue({ data: { items: [], total: 0 } }),
    listTenantMigrations: vi.fn().mockResolvedValue({ data: { items: [], total: 0 } }),
    listTenantRecoveries: vi.fn().mockResolvedValue({ data: { items: [], total: 0 } }),
    listTenantReconciliationFindings: vi
      .fn()
      .mockResolvedValue({ data: { items: [], total: 0 } }),
    listTenantHealthSnapshots: vi
      .fn()
      .mockResolvedValue({ data: { items: [], total: 0 } }),
    listTenantRiskAssessments: vi
      .fn()
      .mockResolvedValue({ data: { items: [], total: 0 } }),
  },
}));

const platformState = vi.hoisted(() => ({
  permissions: [] as string[],
}));

vi.mock("@/providers/edge-platform-provider", () => ({
  useEdgePlatform: () => ({
    permissions: platformState.permissions,
    isLoading: false,
    me: null,
    workspaces: [],
    activeWorkspace: null,
    activeVerticalId: null,
    isError: false,
    error: null,
    refetch: async () => undefined,
    switchWorkspace: async () => undefined,
  }),
}));

import { EdgeTenantDetailModule } from "./edge-tenant-detail-module";

const REGISTRY = {
  id: "reg-1",
  productTenantId: "pt-1",
  tenantCode: "acme",
  tenantSlug: "acme",
  displayName: "Acme Corp",
  legalNameRef: null,
  productId: "prod-1",
  productCode: "CRM",
  accountId: null,
  subscriptionId: null,
  classification: "STANDARD",
  segment: null,
  deploymentProfile: null,
  environmentClassification: "PRODUCTION",
  region: "eu-west",
  administrativeStatus: "ACTIVE",
  technicalStatus: "READY",
  governanceStatus: "COMPLIANT",
  healthStatus: "UNKNOWN",
  riskLevel: "LOW",
  platformTenantRef: null,
  provisioningRequestId: null,
  activationRecordId: null,
  lifecycleRecordId: null,
  internalOwnerId: null,
  operationalTeam: null,
  supportClassification: null,
  locale: null,
  timezone: null,
  defaultLanguage: null,
  dataResidencyRef: null,
  retentionPolicyRef: null,
  securityPolicyRef: null,
  legalHold: false,
  deletionProtection: true,
  lastAdminActivityAt: null,
  lastSyncedAt: null,
  technicalObservedAt: null,
  healthObservedAt: null,
  metadata: {},
  createdBy: "tester",
  updatedBy: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  version: 1,
};

const OVERVIEW = {
  registry: REGISTRY,
  tags: [],
  notes: [],
  commercial: {
    accountId: null,
    subscriptionId: null,
    productId: "prod-1",
    source: "registry_projection",
    syncedAt: null,
    availability: "UNAVAILABLE" as const,
  },
  technical: {
    technicalStatus: "READY",
    lifecycleRecordId: null,
    activationRecordId: null,
    provisioningRequestId: null,
    observedAt: null,
    freshness: "UNKNOWN" as const,
    source: "p7_projection",
  },
  health: {
    status: "UNKNOWN",
    observedAt: null,
    freshness: "UNKNOWN" as const,
  },
  openExceptions: 0,
  pendingLifecycleRequests: 0,
  openFindings: 0,
};

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <EdgeTenantDetailModule tenantId="reg-1" />
    </QueryClientProvider>,
  );
}

describe("EdgeTenantDetailModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.permissions = ["platform:tenant_management:read"];
    getTenant360.mockResolvedValue({ data: OVERVIEW });
  });

  it("shows forbidden without read permission", async () => {
    platformState.permissions = [];
    renderDetail();
    expect(await screen.findByText("Access restricted")).toBeTruthy();
  });

  it("renders overview with API health status", async () => {
    renderDetail();
    expect(await screen.findByTestId("tm-detail-module")).toBeTruthy();
    expect(await screen.findByTestId("tm-detail-overview")).toBeTruthy();
    expect(screen.getByTestId("tm-detail-health")).toHaveTextContent("UNKNOWN");
    expect(getTenant360).toHaveBeenCalledWith("reg-1");
  });
});