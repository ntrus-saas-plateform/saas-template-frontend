/** @vitest-environment jsdom */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const listConnectivityAgents = vi.fn();
const getConnectivityAgent = vi.fn();
const createConnectivityAgent = vi.fn();
const registerConnectivityAgent = vi.fn();
const commandConnectivityAgent = vi.fn();
const revokeConnectivityAgent = vi.fn();
const listConnectivityAgentEvidence = vi.fn();

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
    listConnectivityAgents: (...args: unknown[]) => listConnectivityAgents(...args),
    getConnectivityAgent: (...args: unknown[]) => getConnectivityAgent(...args),
    createConnectivityAgent: (...args: unknown[]) => createConnectivityAgent(...args),
    registerConnectivityAgent: (...args: unknown[]) =>
      registerConnectivityAgent(...args),
    commandConnectivityAgent: (...args: unknown[]) =>
      commandConnectivityAgent(...args),
    revokeConnectivityAgent: (...args: unknown[]) => revokeConnectivityAgent(...args),
    listConnectivityAgentEvidence: (...args: unknown[]) =>
      listConnectivityAgentEvidence(...args),
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

import { EdgeAgentsModule } from "./edge-agents-module";

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

const ALL_PERMS = [
  "platform:agents:read",
  "platform:agents:manage",
  "platform:agents:command",
  "platform:agents:revoke",
  "platform:agents:history:read",
];

const AGENT = {
  id: "agent-1",
  agentCode: "pc-agent-01",
  displayName: "Private Cloud Agent",
  tenantId: "tenant-1",
  productId: "product-1",
  deploymentProfileCode: "PRIVATE_CLOUD",
  agentStatus: "PENDING",
  publicKeyRef: "vault:agents/pubkey/pc-agent-01",
  certificateRef: null,
  outboundOnly: true,
  lastSeenAt: null,
  revokedAt: null,
  revocationReason: null,
  metadata: {},
  createdBy: "tester",
  updatedBy: "tester",
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
      <EdgeAgentsModule />
    </QueryClientProvider>,
  );
}

describe("EdgeAgentsModule (P7.14 console)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];
    listConnectivityAgents.mockResolvedValue({
      data: { items: [AGENT], total: 1 },
    });
    getConnectivityAgent.mockResolvedValue({
      data: {
        agent: AGENT,
        commands: [
          {
            id: "cmd-1",
            agentId: "agent-1",
            commandType: "HEALTH_CHECK",
            commandStatus: "QUEUED",
            nonce: "a".repeat(64),
            payloadRef: "vault:agent-cmd-payload/cmd-1",
            signatureRef: null,
            provisioningRequestId: null,
            authorizationRowId: null,
            authorizationVersion: null,
            workflowId: null,
            expiresAt: null,
            ackedAt: null,
            finishedAt: null,
            errorCode: null,
            errorMessage: null,
            metadata: {},
            createdBy: "tester",
            createdAt: "2026-11-01T00:00:00.000Z",
            updatedAt: "2026-11-01T00:00:00.000Z",
          },
        ],
        evidence: [],
        spool: [],
      },
    });
    listConnectivityAgentEvidence.mockResolvedValue({ data: [] });
  });

  it("shows the forbidden state without platform:agents:read", async () => {
    platformState.permissions = [];
    renderModule();
    expect(await screen.findByText("Access restricted")).toBeTruthy();
  });

  it("renders agents module when permitted without inventing ACTIVE", async () => {
    renderModule();
    expect(await screen.findByTestId("agents-module")).toBeTruthy();
    expect(await screen.findByLabelText("Liste des agents")).toBeTruthy();
    expect(listConnectivityAgents).toHaveBeenCalled();
    expect(screen.queryByTestId("agents-status")).toBeNull();
    expect(screen.queryByText("ACTIVE")).toBeNull();
  });

  it("shows agent detail with outbound_only and PENDING status from API", async () => {
    renderModule();
    fireEvent.click(await screen.findByLabelText("Choisir l'agent pc-agent-01"));

    expect(await screen.findByTestId("agents-detail")).toBeTruthy();
    const status = screen.getByTestId("agents-status").textContent?.trim();
    expect(status).toBe("PENDING");
    expect(status).not.toBe("ACTIVE");
    expect(status).not.toBe("REVOKED");
    expect(screen.getByTestId("agents-outbound")).toBeTruthy();
    expect(screen.getByTestId("agents-register")).toBeTruthy();
    expect(screen.getByTestId("agents-command")).toBeTruthy();
    expect(screen.getByTestId("agents-revoke")).toBeTruthy();
    expect(getConnectivityAgent).toHaveBeenCalledWith("agent-1");
    expect(screen.getByText(/vault:agents\/pubkey\/pc-agent-01/)).toBeTruthy();
  });
});
