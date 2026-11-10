/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const listProductControlEndpoints = vi.fn();
const createProductControlEndpoint = vi.fn();
const listProductControlExchanges = vi.fn();
const reconcileProductControlExchange = vi.fn();
const listProductControlCredentials = vi.fn();
const listRegistryProducts = vi.fn();
const listRegistryPlatforms = vi.fn();
const listRegistryEnvironments = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
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
    listProductControlEndpoints: (...args: unknown[]) =>
      listProductControlEndpoints(...args),
    getProductControlEndpoint: vi.fn(),
    createProductControlEndpoint: (...args: unknown[]) =>
      createProductControlEndpoint(...args),
    patchProductControlEndpoint: vi.fn(),
    validateProductControlEndpoint: vi.fn(),
    handshakeProductControlEndpoint: vi.fn(),
    discoverProductControlContract: vi.fn(),
    discoverProductControlCapabilities: vi.fn(),
    healthCheckProductControlEndpoint: vi.fn(),
    quarantineProductControlEndpoint: vi.fn(),
    listProductControlEndpointExchanges: vi.fn(),
    listProductControlEndpointContracts: vi.fn(),
    listProductControlEndpointCapabilities: vi.fn(),
    listProductControlEndpointHealthChecks: vi.fn(),
    listProductControlEndpointHistory: vi.fn(),
    listProductControlExchanges: (...args: unknown[]) =>
      listProductControlExchanges(...args),
    getProductControlExchange: vi.fn(),
    reconcileProductControlExchange: (...args: unknown[]) =>
      reconcileProductControlExchange(...args),
    listProductControlCredentials: (...args: unknown[]) =>
      listProductControlCredentials(...args),
    listRegistryProducts: (...args: unknown[]) => listRegistryProducts(...args),
    listRegistryPlatforms: (...args: unknown[]) =>
      listRegistryPlatforms(...args),
    listRegistryEnvironments: (...args: unknown[]) =>
      listRegistryEnvironments(...args),
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

import ProductControlPage from "./page";

const ALL_PERMS = [
  "platform:product_control:read",
  "platform:product_control:manage",
  "platform:product_control:validate",
  "platform:product_control:handshake",
  "platform:product_control:discover",
  "platform:product_control:health",
  "platform:product_control:reconcile",
  "platform:product_control:quarantine",
  "platform:product_control:credentials:manage",
  "platform:product_control:history:read",
  "platform:product_registry:read",
  "platform:product_platforms:read",
  "platform:environments:read",
];

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <ProductControlPage />
    </QueryClientProvider>,
  );
}

describe("ProductControlPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];

    listProductControlEndpoints.mockResolvedValue({
      data: {
        items: [
          {
            id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            productRegistryId: "rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrrr",
            productId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
            platformId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
            environmentId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            deploymentProfileId: null,
            registryContractId: null,
            code: "bb-pc-prod",
            baseUrl: "https://pc.example",
            apiVersion: "v1",
            contractVersion: "1.0.0",
            authProfile: "OAUTH2_CC",
            credentialRef: "vault://edge/pc/prod",
            allowedScopes: [],
            status: "ACTIVE",
            contractFingerprint: "fp-1",
            identityFingerprint: "id-1",
            registrationSource: "MANUAL",
            lastHandshakeAt: "2026-01-02T00:00:00.000Z",
            lastHandshakeStatus: "SUCCEEDED",
            lastHandshakeError: null,
            lastHealthCheckAt: "2026-01-02T01:00:00.000Z",
            lastHealthStatus: "HEALTHY",
            metadata: {},
            version: 1,
            createdBy: "admin",
            updatedBy: "admin",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
          },
          {
            id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            productRegistryId: "rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrrr",
            productId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
            platformId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
            environmentId: null,
            deploymentProfileId: null,
            registryContractId: null,
            code: "bb-pc-deg",
            baseUrl: "https://pc-deg.example",
            apiVersion: "v1",
            contractVersion: "1.0.0",
            authProfile: "MTLS",
            credentialRef: "vault://edge/pc/deg",
            allowedScopes: [],
            status: "DEGRADED",
            contractFingerprint: null,
            identityFingerprint: null,
            registrationSource: "MANUAL",
            lastHandshakeAt: null,
            lastHandshakeStatus: null,
            lastHandshakeError: null,
            lastHealthCheckAt: null,
            lastHealthStatus: "DEGRADED",
            metadata: {},
            version: 1,
            createdBy: "admin",
            updatedBy: "admin",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-03T00:00:00.000Z",
          },
        ],
        total: 2,
      },
    });

    listProductControlExchanges.mockResolvedValue({
      data: {
        items: [
          {
            id: "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx",
            productId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
            endpointId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            workflowId: null,
            stepId: null,
            operationCode: "product_control.handshake",
            contractVersion: "1.0.0",
            requestId: "req-1",
            correlationId: "corr-1",
            causationId: null,
            idempotencyKey: "idem-1",
            requestDigest: "rd",
            responseDigest: null,
            requestTimestamp: "2026-01-02T00:00:00.000Z",
            responseTimestamp: null,
            status: "UNKNOWN_OUTCOME",
            attemptCount: 1,
            httpStatus: null,
            errorClassification: "TIMEOUT",
            durationMs: 5000,
            retryEligible: false,
            reconciliationStatus: "REQUIRED",
            requestPayload: { token: "leak" },
            responsePayload: {},
            diagnostics: {},
            version: 1,
            createdAt: "2026-01-02T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
          },
        ],
        total: 1,
      },
    });

    listProductControlCredentials.mockResolvedValue({
      data: {
        items: [
          {
            id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
            endpointId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            credentialRef: "vault://edge/pc/prod",
            authProfile: "OAUTH2_CC",
            status: "ACTIVE",
            boundAt: "2026-01-01T00:00:00.000Z",
            expiresAt: null,
            revokedAt: null,
            revokedBy: null,
            metadata: {},
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        total: 1,
      },
    });

    listRegistryProducts.mockResolvedValue({
      data: {
        items: [
          {
            id: "rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrrr",
            productId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
            code: "bb",
            name: "Business Backend",
            description: null,
            verticalCategory: null,
            registryStatus: "ACTIVE",
            certificationStatus: "CERTIFIED",
            provisionable: true,
            technicalConstraints: {},
            declaredCapabilities: [],
            compatiblePlatformIds: [],
            compatibleEnvironmentIds: [],
            compatibleProfileIds: [],
            compatibleContractIds: [],
            metadata: {},
            version: 1,
            createdBy: null,
            updatedBy: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        total: 1,
      },
    });
    listRegistryPlatforms.mockResolvedValue({
      data: {
        items: [
          {
            id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
            code: "saas",
            name: "SaaS",
            description: null,
            platformType: "SAAS",
            businessBackendId: null,
            allowedProductIds: [],
            supportedEnvironmentTypes: [],
            supportedProfileCodes: [],
            connectivityReference: null,
            secureConfigRef: null,
            integrationProtocolVersion: null,
            controlContractVersion: null,
            certificationStatus: "CERTIFIED",
            operationalStatus: "ACTIVE",
            declaredCapabilities: [],
            constraints: {},
            metadata: {},
            version: 1,
            createdBy: null,
            updatedBy: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        total: 1,
      },
    });
    listRegistryEnvironments.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    createProductControlEndpoint.mockResolvedValue({
      data: { id: "new-endpoint" },
    });
    reconcileProductControlExchange.mockResolvedValue({
      data: { id: "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx", status: "RECONCILED" },
    });
  });

  it("forbids access without product_control:read", async () => {
    platformState.permissions = [];
    renderPage();
    expect(
      await screen.findByText(/platform:product_control:read/),
    ).toBeTruthy();
  });

  it("renders overview counts from endpoints and exchanges", async () => {
    renderPage();
    expect(await screen.findByLabelText("Endpoints: 2")).toBeTruthy();
    expect(screen.getByLabelText("Active: 1")).toBeTruthy();
    expect(screen.getByLabelText("Degraded / unavailable: 1")).toBeTruthy();
    expect(screen.getByLabelText("Reconciliation required: 1")).toBeTruthy();
    expect(screen.getByText("bb-pc-prod")).toBeTruthy();
  });

  it("lists endpoints and registers via registry selects", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Endpoints" }));
    expect(await screen.findByText("Register endpoint")).toBeTruthy();
    expect(await screen.findByText("bb-pc-prod")).toBeTruthy();
    expect(screen.queryByText("vault://edge/pc/prod")).toBeNull();

    fireEvent.change(screen.getByLabelText("Product registry"), {
      target: { value: "rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrrr" },
    });
    fireEvent.change(screen.getByLabelText("Platform"), {
      target: { value: "ffffffff-ffff-4fff-8fff-ffffffffffff" },
    });
    fireEvent.change(screen.getByLabelText("Endpoint code"), {
      target: { value: "bb-pc-new" },
    });
    fireEvent.change(screen.getByLabelText("Base URL"), {
      target: { value: "https://pc-new.example" },
    });
    fireEvent.change(screen.getByLabelText("Contract version"), {
      target: { value: "1.1.0" },
    });
    fireEvent.change(screen.getByLabelText("Credential reference"), {
      target: { value: "vault://edge/pc/new" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(createProductControlEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          productRegistryId: "rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrrr",
          productId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
          platformId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
          code: "bb-pc-new",
          baseUrl: "https://pc-new.example",
          contractVersion: "1.1.0",
          credentialRef: "vault://edge/pc/new",
        }),
      );
    });
  });

  it("lists exchanges and can reconcile", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Exchanges" }));
    expect(await screen.findByText("product_control.handshake")).toBeTruthy();
    expect(
      screen.getAllByText("UNKNOWN_OUTCOME").length,
    ).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByRole("button", { name: "Reconcile" }));
    await waitFor(() => {
      expect(reconcileProductControlExchange).toHaveBeenCalledWith(
        "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx",
      );
    });
  });

  it("lists credentials without revealing secret refs", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Credentials" }));
    expect(await screen.findByText("OAUTH2_CC")).toBeTruthy();
    expect(screen.getByText("•••••••• (ref present)")).toBeTruthy();
    expect(screen.queryByText("vault://edge/pc/prod")).toBeNull();
  });
});
