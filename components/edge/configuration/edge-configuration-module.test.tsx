/** @vitest-environment jsdom */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const listConfigurationSchemas = vi.fn();
const listConfigurationTemplates = vi.fn();
const listConfigurationBundles = vi.fn();
const listTenantConfigurationAssignments = vi.fn();
const getTenantConfigurationAssignment = vi.fn();
const listConfigurationDeploymentRuns = vi.fn();
const listConfigurationEvidence = vi.fn();
const listEntitlementDeployments = vi.fn();
const deployTenantConfiguration = vi.fn();
const rollbackTenantConfiguration = vi.fn();
const reconcileTenantEntitlements = vi.fn();
const createConfigurationSchema = vi.fn();
const createConfigurationTemplate = vi.fn();
const publishConfigurationTemplate = vi.fn();
const createConfigurationBundle = vi.fn();
const publishConfigurationBundle = vi.fn();
const assignTenantConfiguration = vi.fn();

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
    listConfigurationSchemas: (...args: unknown[]) =>
      listConfigurationSchemas(...args),
    listConfigurationTemplates: (...args: unknown[]) =>
      listConfigurationTemplates(...args),
    listConfigurationBundles: (...args: unknown[]) =>
      listConfigurationBundles(...args),
    listTenantConfigurationAssignments: (...args: unknown[]) =>
      listTenantConfigurationAssignments(...args),
    getTenantConfigurationAssignment: (...args: unknown[]) =>
      getTenantConfigurationAssignment(...args),
    listConfigurationDeploymentRuns: (...args: unknown[]) =>
      listConfigurationDeploymentRuns(...args),
    listConfigurationEvidence: (...args: unknown[]) =>
      listConfigurationEvidence(...args),
    listEntitlementDeployments: (...args: unknown[]) =>
      listEntitlementDeployments(...args),
    deployTenantConfiguration: (...args: unknown[]) =>
      deployTenantConfiguration(...args),
    rollbackTenantConfiguration: (...args: unknown[]) =>
      rollbackTenantConfiguration(...args),
    reconcileTenantEntitlements: (...args: unknown[]) =>
      reconcileTenantEntitlements(...args),
    createConfigurationSchema: (...args: unknown[]) =>
      createConfigurationSchema(...args),
    createConfigurationTemplate: (...args: unknown[]) =>
      createConfigurationTemplate(...args),
    publishConfigurationTemplate: (...args: unknown[]) =>
      publishConfigurationTemplate(...args),
    createConfigurationBundle: (...args: unknown[]) =>
      createConfigurationBundle(...args),
    publishConfigurationBundle: (...args: unknown[]) =>
      publishConfigurationBundle(...args),
    assignTenantConfiguration: (...args: unknown[]) =>
      assignTenantConfiguration(...args),
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

import { EdgeConfigurationModule } from "./edge-configuration-module";

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

const ALL_PERMS = [
  "platform:configuration:read",
  "platform:configuration:manage",
  "platform:configuration:deploy",
  "platform:configuration:rollback",
  "platform:configuration:history:read",
  "platform:entitlement:read",
  "platform:entitlement:reconcile",
];

const SCHEMA = {
  id: "sch-1",
  code: "runtime-knobs",
  name: "Runtime Knobs",
  description: null,
  productId: null,
  schemaVersion: 1,
  jsonSchema: { type: "object", properties: {} },
  checksum: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
  status: "ACTIVE",
  metadata: {},
  createdBy: "tester",
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

const ASSIGNMENT = {
  id: "asg-1",
  tenantId: "tenant-1",
  productId: "prod-1",
  subscriptionId: null,
  accountId: null,
  bundleId: "bun-1",
  bundleVersion: 1,
  bundleChecksum: "deadbeef",
  assignmentStatus: "ASSIGNED",
  desiredConfig: {},
  appliedConfig: { dbPassword: "should-never-show", featureFlags: { x: true } },
  appliedChecksum: null,
  entitlementSnapshotRef: "snap-1",
  entitlementVersion: "3",
  authorizationRowId: null,
  authorizationVersion: null,
  provisioningRequestId: "pr-1",
  workflowId: null,
  deploymentStrategy: "ATOMIC",
  driftStatus: "NONE",
  lastDeployedAt: null,
  lastReconciledAt: null,
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
      <EdgeConfigurationModule />
    </QueryClientProvider>,
  );
}

describe("EdgeConfigurationModule (P7.8 console)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];
    listConfigurationSchemas.mockResolvedValue({
      data: { items: [SCHEMA], total: 1 },
    });
    listConfigurationTemplates.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listConfigurationBundles.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listTenantConfigurationAssignments.mockResolvedValue({
      data: { items: [ASSIGNMENT], total: 1 },
    });
    getTenantConfigurationAssignment.mockResolvedValue({
      data: {
        assignment: ASSIGNMENT,
        runs: [],
        evidence: [],
        entitlements: [],
      },
    });
    listConfigurationDeploymentRuns.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listConfigurationEvidence.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listEntitlementDeployments.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    deployTenantConfiguration.mockResolvedValue({ data: {} });
    rollbackTenantConfiguration.mockResolvedValue({ data: {} });
    reconcileTenantEntitlements.mockResolvedValue({ data: {} });
  });

  it("shows the forbidden state without platform:configuration:read", async () => {
    platformState.permissions = [];
    renderModule();
    expect(await screen.findByText("Access restricted")).toBeTruthy();
  });

  it("renders schemas list when permitted", async () => {
    renderModule();
    expect(await screen.findByTestId("cfg-schemas-table")).toBeTruthy();
    expect(screen.getByText("runtime-knobs")).toBeTruthy();
    expect(screen.getByText("Runtime Knobs")).toBeTruthy();
    expect(listConfigurationSchemas).toHaveBeenCalled();
  });

  it("gates the Deploy button without platform:configuration:deploy", async () => {
    platformState.permissions = ALL_PERMS.filter(
      (p) => p !== "platform:configuration:deploy",
    );
    renderModule();
    fireEvent.click(await screen.findByRole("button", { name: "Tenant Assignments" }));
    fireEvent.click(await screen.findByLabelText("Choisir un assignment"));
    const option = await screen.findByRole("option", {
      name: /tenant-1 — ASSIGNED/,
    });
    fireEvent.click(option);
    expect(await screen.findByTestId("cfg-assignment-detail")).toBeTruthy();
    expect(screen.queryByTestId("cfg-deploy")).toBeNull();
    expect(screen.getByTestId("cfg-rollback")).toBeTruthy();
    // Secret values must never appear in the redacted applied config.
    expect(screen.queryByText("should-never-show")).toBeNull();
    expect(screen.getByText(/••••••••/)).toBeTruthy();
  });
});
