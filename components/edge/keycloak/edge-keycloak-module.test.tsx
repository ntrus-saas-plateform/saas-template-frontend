/** @vitest-environment jsdom */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const listKeycloakProviders = vi.fn();
const listKeycloakServers = vi.fn();
const listKeycloakTopologies = vi.fn();
const getKeycloakTopology = vi.fn();
const listKeycloakHistory = vi.fn();
const getKeycloakCapabilities = vi.fn();
const registerKeycloakServer = vi.fn();
const discoverKeycloakCapabilities = vi.fn();
const reconcileKeycloakTopology = vi.fn();
const deprovisionKeycloakTopology = vi.fn();

vi.mock("@/lib/api/edge", () => ({
  EdgeApiError: class EdgeApiError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  edgeApi: {
    listKeycloakProviders: (...args: unknown[]) =>
      listKeycloakProviders(...args),
    listKeycloakServers: (...args: unknown[]) => listKeycloakServers(...args),
    listKeycloakTopologies: (...args: unknown[]) =>
      listKeycloakTopologies(...args),
    getKeycloakTopology: (...args: unknown[]) =>
      getKeycloakTopology(...args),
    listKeycloakHistory: (...args: unknown[]) =>
      listKeycloakHistory(...args),
    getKeycloakCapabilities: (...args: unknown[]) =>
      getKeycloakCapabilities(...args),
    registerKeycloakServer: (...args: unknown[]) =>
      registerKeycloakServer(...args),
    discoverKeycloakCapabilities: (...args: unknown[]) =>
      discoverKeycloakCapabilities(...args),
    reconcileKeycloakTopology: (...args: unknown[]) =>
      reconcileKeycloakTopology(...args),
    deprovisionKeycloakTopology: (...args: unknown[]) =>
      deprovisionKeycloakTopology(...args),
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

import { EdgeKeycloakModule } from "./edge-keycloak-module";

// jsdom does not implement scrollIntoView (used by the custom Select).
beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

const ALL_PERMS = [
  "platform:keycloak:read",
  "platform:keycloak:manage",
  "platform:keycloak:capabilities",
  "platform:keycloak:provision",
  "platform:keycloak:reconcile",
  "platform:keycloak:deprovision",
  "platform:keycloak:history:read",
];

const SERVER = {
  id: "s1",
  providerId: "p1",
  code: "kc-prod-1",
  name: "Prod Keycloak",
  baseUrl: "https://kc.example.com",
  adminRealm: "master",
  adminClientId: "edge-topology-admin",
  // Opaque vault reference — never a plaintext secret.
  adminCredentialRef: "sec_abcdef1234567890",
  tlsMode: "REQUIRED",
  allowPrivateNetwork: false,
  environment: "production",
  operationalStatus: "ACTIVE",
  discoveredVersion: "26.0.7",
  lastConnectivityStatus: "OK",
  lastConnectivityAt: "2026-11-10T10:00:00.000Z",
  metadata: {},
  version: 1,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-10T10:00:00.000Z",
};

const TOPOLOGY = {
  id: "t1",
  tenantId: "tenant-1",
  productId: "prod-1",
  subscriptionId: null,
  authorizationId: null,
  authorizationVersion: null,
  placementDecisionId: null,
  deploymentProfileId: null,
  runtimeProfileId: null,
  providerId: "p1",
  serverId: "s1",
  topologyType: "DEDICATED_REALM",
  realmRef: "realm-ref",
  organizationRef: null,
  oidcConfigurationRef: null,
  externalRealmId: null,
  externalOrganizationId: null,
  keycloakVersion: "26.0.7",
  desiredConfigVersion: 1,
  appliedConfigVersion: null,
  resourceFingerprint: null,
  status: "READY",
  statusReason: null,
  lastHealthCheckAt: "2026-11-11T08:00:00.000Z",
  lastReconciliationAt: null,
  workflowId: "wf-1",
  deletionProtection: true,
  metadata: {},
  version: 3,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-11T08:00:00.000Z",
};

const DETAIL = {
  topology: TOPOLOGY,
  realm: {
    id: "r1",
    topologyId: "t1",
    tenantId: "tenant-1",
    realmName: "tenant-1-realm",
    externalRealmId: "ext-1",
    internalFingerprint: "fp-1",
    settings: {},
    status: "READY",
    version: 1,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
  },
  organization: null,
  clients: [
    {
      id: "c1",
      topologyId: "t1",
      realmId: "r1",
      tenantId: "tenant-1",
      clientId: "app-backend",
      clientUuid: null,
      clientKind: "CONFIDENTIAL",
      ownerFunction: "backend",
      documentedUsage: "service-to-service",
      redirectUris: ["https://app.example.com/callback"],
      webOrigins: ["https://app.example.com"],
      scopes: ["openid"],
      // Opaque vault ref only — the console must never receive a secret.
      secretCredentialRef: "sec_zzzzzzzzzzzzzzzz",
      secretRotatedAt: null,
      standardFlowEnabled: true,
      directAccessGrantsEnabled: false,
      serviceAccountsEnabled: true,
      pkceRequired: true,
      complianceStatus: "COMPLIANT",
      status: "ACTIVE",
      workflowId: "wf-1",
      evidence: {},
      version: 1,
      createdAt: "2026-11-01T00:00:00.000Z",
      updatedAt: "2026-11-01T00:00:00.000Z",
    },
  ],
  oidc: null,
  references: [],
  health: [
    {
      id: "h1",
      topologyId: "t1",
      serverId: null,
      checkType: "OIDC_DISCOVERY",
      outcome: "HEALTHY",
      latencyMs: 42,
      details: {},
      checkedAt: "2026-11-11T08:00:00.000Z",
    },
  ],
  reconciliations: [],
  evidence: [
    {
      id: "e1",
      topologyId: "t1",
      tenantId: "tenant-1",
      workflowId: "wf-1",
      stepKey: "provision_realm",
      operation: "create_realm",
      outcome: "SUCCESS",
      evidence: {},
      errorCode: null,
      errorMessage: null,
      durationMs: 120,
      performedBy: "workflow-worker",
      performedAt: "2026-11-01T00:00:00.000Z",
    },
  ],
};

/** Opens the custom Select and picks an option by visible label. */
async function pickTopology(label: RegExp) {
  fireEvent.click(await screen.findByLabelText("Choisir une topologie"));
  const option = await screen.findByRole("option", { name: label });
  fireEvent.click(option);
}

function renderModule() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <EdgeKeycloakModule />
    </QueryClientProvider>,
  );
}

describe("EdgeKeycloakModule (P7.7 console)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];
    listKeycloakProviders.mockResolvedValue({
      data: { items: [{ id: "p1" }], total: 1 },
    });
    listKeycloakServers.mockResolvedValue({
      data: { items: [SERVER], total: 1 },
    });
    listKeycloakTopologies.mockResolvedValue({
      data: { items: [TOPOLOGY], total: 1 },
    });
    getKeycloakTopology.mockResolvedValue({ data: DETAIL });
    listKeycloakHistory.mockResolvedValue({ data: { items: [], total: 0 } });
    getKeycloakCapabilities.mockResolvedValue({
      data: {
        id: "cap1",
        serverId: "s1",
        keycloakVersion: "26.0.7",
        features: { organization: true },
        organizationsSupported: true,
        realmsSupported: true,
        adminApiReachable: true,
        discoverySource: "SERVERINFO",
        rawEvidence: {},
        verifiedAt: "2026-11-10T10:00:00.000Z",
      },
    });
    registerKeycloakServer.mockResolvedValue({ data: SERVER });
    discoverKeycloakCapabilities.mockResolvedValue({ data: {} });
    reconcileKeycloakTopology.mockResolvedValue({ data: {} });
    deprovisionKeycloakTopology.mockResolvedValue({ data: {} });
  });

  it("renders servers without exposing any credential value", async () => {
    renderModule();
    expect(await screen.findByText("Prod Keycloak")).toBeTruthy();
    // Only the opaque ref semantics are shown, never a secret.
    expect(screen.getByText("Credential en Vault")).toBeTruthy();
    expect(screen.queryByDisplayValue(/EdgeAdmin|secret/i)).toBeNull();
  });

  it("shows the forbidden state without platform:keycloak:read", async () => {
    platformState.permissions = [];
    renderModule();
    expect(await screen.findByText("Access restricted")).toBeTruthy();
  });

  it("lists topologies and opens the detail panel with masked client secret", async () => {
    renderModule();
    fireEvent.click(await screen.findByRole("tab", { name: "Topologies" }));
    await pickTopology(/tenant-1 — DEDICATED_REALM — READY/);
    expect(await screen.findByTestId("kc-topology-detail")).toBeTruthy();
    expect(await screen.findByText(/tenant-1-realm/)).toBeTruthy();
    // The client secret credential ref must be masked, never rendered raw.
    expect(await screen.findByText("••••••••")).toBeTruthy();
    expect(screen.queryByText("sec_zzzzzzzzzzzzzzzz")).toBeNull();
    // State machine status is displayed read-only (topology + realm badges).
    expect(screen.getAllByText("READY").length).toBeGreaterThan(0);
    expect(screen.getByText("DEDICATED_REALM")).toBeTruthy();
  });

  it("renders health checks and evidence from the detail payload", async () => {
    renderModule();
    fireEvent.click(await screen.findByRole("tab", { name: "Topologies" }));
    await pickTopology(/tenant-1 — DEDICATED_REALM — READY/);
    expect(await screen.findByText("OIDC_DISCOVERY")).toBeTruthy();
    expect(await screen.findByText("create_realm")).toBeTruthy();
  });

  it("requires history:read permission for the history tab", async () => {
    platformState.permissions = ALL_PERMS.filter(
      (p) => p !== "platform:keycloak:history:read",
    );
    renderModule();
    expect(await screen.findByRole("tab", { name: "Serveurs Keycloak" })).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "Historique" })).toBeNull();
  });

  it("sends reconcile only after explicit user action", async () => {
    renderModule();
    fireEvent.click(await screen.findByRole("tab", { name: "Topologies" }));
    await pickTopology(/tenant-1 — DEDICATED_REALM — READY/);
    await screen.findByTestId("kc-reconcile");
    expect(reconcileKeycloakTopology).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("kc-reconcile"));
    await waitFor(() =>
      expect(reconcileKeycloakTopology).toHaveBeenCalledWith("t1", {
        operation: "reconcile",
      }),
    );
  });
});
