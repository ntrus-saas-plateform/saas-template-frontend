/** @vitest-environment jsdom */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const listTenants = vi.fn();
const getTenantPortfolioAnalytics = vi.fn();
const listTenantLifecycleRequests = vi.fn();
const listTenantExceptions = vi.fn();
const listTenantReconciliationFindings = vi.fn();
const listTenantMigrations = vi.fn();
const listTenantRecoveries = vi.fn();
const listTenantTerminations = vi.fn();
const listTenantReconciliationRuns = vi.fn();
const listBulkTenantOperations = vi.fn();

vi.mock("@/lib/api/edge", () => ({
  EdgeApiError: class EdgeApiError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  edgeApi: {
    listTenants: (...args: unknown[]) => listTenants(...args),
    getTenantPortfolioAnalytics: (...args: unknown[]) =>
      getTenantPortfolioAnalytics(...args),
    listTenantLifecycleRequests: (...args: unknown[]) =>
      listTenantLifecycleRequests(...args),
    listTenantExceptions: (...args: unknown[]) =>
      listTenantExceptions(...args),
    listTenantReconciliationFindings: (...args: unknown[]) =>
      listTenantReconciliationFindings(...args),
    listTenantMigrations: (...args: unknown[]) => listTenantMigrations(...args),
    listTenantRecoveries: (...args: unknown[]) => listTenantRecoveries(...args),
    listTenantTerminations: (...args: unknown[]) =>
      listTenantTerminations(...args),
    listTenantReconciliationRuns: (...args: unknown[]) =>
      listTenantReconciliationRuns(...args),
    listBulkTenantOperations: (...args: unknown[]) =>
      listBulkTenantOperations(...args),
    syncTenantsFromP7: vi.fn(),
    exportTenants: vi.fn(),
    registerTenant: vi.fn(),
  },
}));

const platformState = vi.hoisted(() => ({
  permissions: [] as string[],
  isLoading: false,
}));

vi.mock("@/providers/edge-platform-provider", () => ({
  useEdgePlatform: () => ({
    permissions: platformState.permissions,
    isLoading: platformState.isLoading,
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

import { EdgeTenantManagementModule } from "./edge-tenant-management-module";

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

const ALL_PERMS = [
  "platform:tenant_management:search",
  "platform:tenant_management:analytics:read",
  "platform:tenant_management:lifecycle:request",
];

const TENANT = {
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

function renderModule() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <EdgeTenantManagementModule />
    </QueryClientProvider>,
  );
}

describe("EdgeTenantManagementModule (P8 console)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];
    getTenantPortfolioAnalytics.mockResolvedValue({
      data: {
        total: 1,
        active: 1,
        provisioning: 0,
        suspended: 0,
        degraded: 0,
        pendingReview: 0,
        exceptionsActive: 0,
        reconciliationOpen: 0,
        byProduct: [],
        byRegion: [],
        byClassification: [],
        byAdministrativeStatus: [],
        computedAt: "2026-11-01T00:00:00.000Z",
      },
    });
    listTenants.mockResolvedValue({ data: { items: [TENANT], total: 1 } });
    listTenantLifecycleRequests.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listTenantExceptions.mockResolvedValue({ data: { items: [], total: 0 } });
    listTenantReconciliationFindings.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listTenantMigrations.mockResolvedValue({ data: { items: [], total: 0 } });
    listTenantRecoveries.mockResolvedValue({ data: { items: [], total: 0 } });
    listTenantTerminations.mockResolvedValue({ data: { items: [], total: 0 } });
    listTenantReconciliationRuns.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listBulkTenantOperations.mockResolvedValue({ data: { items: [], total: 0 } });
  });

  it("shows the forbidden state without tenant management permissions", async () => {
    platformState.permissions = [];
    renderModule();
    expect(await screen.findByText("Access restricted")).toBeTruthy();
  });

  it("renders module with API portfolio metrics and tenant registry", async () => {
    renderModule();
    expect(await screen.findByTestId("tm-module")).toBeTruthy();
    expect(await screen.findByTestId("tm-metric-total")).toHaveTextContent("1");
    expect(await screen.findByTestId("tm-registry-table")).toBeTruthy();
    expect(listTenants).toHaveBeenCalled();
    expect(getTenantPortfolioAnalytics).toHaveBeenCalled();
    expect(screen.getByText("UNKNOWN")).toBeTruthy();
    expect(screen.queryByText("HEALTHY")).toBeNull();
  });

  it("submits registry search", async () => {
    renderModule();
    const input = await screen.findByLabelText("Tenant search");
    fireEvent.change(input, { target: { value: "acme" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByTestId("tm-registry-table");
    expect(listTenants).toHaveBeenCalledWith(
      expect.objectContaining({ q: "acme", limit: 50, sortBy: "updatedAt" }),
    );
  });

  it("exposes pagination controls in registry search", async () => {
    renderModule();
    expect(await screen.findByLabelText("Page limit")).toBeTruthy();
    expect(screen.getByLabelText("Page offset")).toBeTruthy();
    expect(screen.getByLabelText("Sort by")).toBeTruthy();
  });
});