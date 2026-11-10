/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const getProductControlEndpoint = vi.fn();
const validateProductControlEndpoint = vi.fn();
const handshakeProductControlEndpoint = vi.fn();
const discoverProductControlContract = vi.fn();
const discoverProductControlCapabilities = vi.fn();
const healthCheckProductControlEndpoint = vi.fn();
const quarantineProductControlEndpoint = vi.fn();
const listProductControlEndpointExchanges = vi.fn();
const listProductControlEndpointContracts = vi.fn();
const listProductControlEndpointCapabilities = vi.fn();
const listProductControlEndpointHealthChecks = vi.fn();
const listProductControlEndpointHistory = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" }),
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
    getProductControlEndpoint: (...args: unknown[]) =>
      getProductControlEndpoint(...args),
    validateProductControlEndpoint: (...args: unknown[]) =>
      validateProductControlEndpoint(...args),
    handshakeProductControlEndpoint: (...args: unknown[]) =>
      handshakeProductControlEndpoint(...args),
    discoverProductControlContract: (...args: unknown[]) =>
      discoverProductControlContract(...args),
    discoverProductControlCapabilities: (...args: unknown[]) =>
      discoverProductControlCapabilities(...args),
    healthCheckProductControlEndpoint: (...args: unknown[]) =>
      healthCheckProductControlEndpoint(...args),
    quarantineProductControlEndpoint: (...args: unknown[]) =>
      quarantineProductControlEndpoint(...args),
    listProductControlEndpointExchanges: (...args: unknown[]) =>
      listProductControlEndpointExchanges(...args),
    listProductControlEndpointContracts: (...args: unknown[]) =>
      listProductControlEndpointContracts(...args),
    listProductControlEndpointCapabilities: (...args: unknown[]) =>
      listProductControlEndpointCapabilities(...args),
    listProductControlEndpointHealthChecks: (...args: unknown[]) =>
      listProductControlEndpointHealthChecks(...args),
    listProductControlEndpointHistory: (...args: unknown[]) =>
      listProductControlEndpointHistory(...args),
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

import ProductControlEndpointDetailPage from "./page";

const ALL_PERMS = [
  "platform:product_control:read",
  "platform:product_control:validate",
  "platform:product_control:handshake",
  "platform:product_control:discover",
  "platform:product_control:health",
  "platform:product_control:quarantine",
  "platform:product_control:history:read",
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
      <ProductControlEndpointDetailPage />
    </QueryClientProvider>,
  );
}

describe("ProductControlEndpointDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];

    getProductControlEndpoint.mockResolvedValue({
      data: {
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
        contractFingerprint: "fp-contract",
        identityFingerprint: "fp-identity",
        registrationSource: "MANUAL",
        lastHandshakeAt: "2026-01-02T00:00:00.000Z",
        lastHandshakeStatus: "SUCCEEDED",
        lastHandshakeError: null,
        lastHealthCheckAt: "2026-01-02T01:00:00.000Z",
        lastHealthStatus: "HEALTHY",
        metadata: { apiToken: "should-not-leak", region: "eu" },
        version: 2,
        createdBy: "admin",
        updatedBy: "admin",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    });

    listProductControlEndpointContracts.mockResolvedValue({
      data: [
        {
          id: "nnnnnnnn-nnnn-4nnn-8nnn-nnnnnnnnnnnn",
          endpointId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          contractVersion: "1.0.0",
          fingerprint: "fp-contract",
          schemaSnapshot: {},
          supportedVersions: ["1.0.0"],
          status: "COMPATIBLE",
          discoveredAt: "2026-01-02T00:00:00.000Z",
          validatedAt: "2026-01-02T00:01:00.000Z",
          metadata: {},
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-02T00:01:00.000Z",
        },
      ],
    });

    listProductControlEndpointCapabilities.mockResolvedValue({
      data: [
        {
          id: "cap-1",
          endpointId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          capabilityCode: "provision.tenant",
          declaredAt: "2026-01-02T00:00:00.000Z",
          metadata: {},
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });

    listProductControlEndpointExchanges.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listProductControlEndpointHealthChecks.mockResolvedValue({
      data: [
        {
          id: "h1",
          endpointId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          checkedAt: "2026-01-02T01:00:00.000Z",
          result: "HEALTHY",
          latencyMs: 42,
          httpStatus: 200,
          errorClassification: null,
          details: {},
          createdAt: "2026-01-02T01:00:00.000Z",
        },
      ],
    });
    listProductControlEndpointHistory.mockResolvedValue({
      data: {
        items: [
          {
            id: "hist-1",
            resourceType: "ENDPOINT",
            resourceId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            fromStatus: "VALIDATING",
            toStatus: "ACTIVE",
            action: "HANDSHAKE",
            reason: null,
            actorId: "admin",
            details: {},
            createdAt: "2026-01-02T00:00:00.000Z",
          },
        ],
        total: 1,
      },
    });

    validateProductControlEndpoint.mockResolvedValue({ data: {} });
    handshakeProductControlEndpoint.mockResolvedValue({ data: {} });
    discoverProductControlContract.mockResolvedValue({ data: {} });
    discoverProductControlCapabilities.mockResolvedValue({ data: [] });
    healthCheckProductControlEndpoint.mockResolvedValue({ data: {} });
    quarantineProductControlEndpoint.mockResolvedValue({ data: {} });
  });

  it("forbids without read permission", async () => {
    platformState.permissions = [];
    renderPage();
    expect(
      await screen.findByText(/platform:product_control:read/),
    ).toBeTruthy();
  });

  it("renders endpoint details, contract and capabilities without secrets", async () => {
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "bb-pc-prod" }),
    ).toBeTruthy();
    expect(screen.getAllByText("ACTIVE").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("COMPATIBLE")).toBeTruthy();
    expect(screen.getByText("provision.tenant")).toBeTruthy();
    expect(screen.getAllByText("HEALTHY").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("•••••••• (ref present)")).toBeTruthy();
    expect(screen.queryByText("vault://edge/pc/prod")).toBeNull();
    expect(screen.queryByText("should-not-leak")).toBeNull();
    expect(screen.getByText(/"region": "eu"/)).toBeTruthy();
  });

  it("runs handshake, discover, health and quarantine actions", async () => {
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "bb-pc-prod" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Handshake" }));
    await waitFor(() => {
      expect(handshakeProductControlEndpoint).toHaveBeenCalledWith(
        "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Discover contract" }));
    await waitFor(() => {
      expect(discoverProductControlContract).toHaveBeenCalledWith(
        "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      );
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Discover capabilities" }),
    );
    await waitFor(() => {
      expect(discoverProductControlCapabilities).toHaveBeenCalledWith(
        "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Health check" }));
    await waitFor(() => {
      expect(healthCheckProductControlEndpoint).toHaveBeenCalledWith(
        "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      );
    });

    fireEvent.change(screen.getByLabelText("Quarantine reason"), {
      target: { value: "Suspicious TLS fingerprint" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Quarantine" }));
    await waitFor(() => {
      expect(quarantineProductControlEndpoint).toHaveBeenCalledWith(
        "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        { reason: "Suspicious TLS fingerprint" },
      );
    });
  });
});
