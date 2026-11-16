/** @vitest-environment jsdom */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const listCertificationPackages = vi.fn();
const getCertificationPackage = vi.fn();
const createCertificationPackage = vi.fn();
const assembleCertificationPackage = vi.fn();
const certifyCertificationPackage = vi.fn();
const revokeCertificationPackage = vi.fn();
const attachCertificationEvidence = vi.fn();

vi.mock("@/lib/api/edge", () => ({
  EdgeApiError: class EdgeApiError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  edgeApi: {
    listCertificationPackages: (...args: unknown[]) =>
      listCertificationPackages(...args),
    getCertificationPackage: (...args: unknown[]) => getCertificationPackage(...args),
    createCertificationPackage: (...args: unknown[]) =>
      createCertificationPackage(...args),
    assembleCertificationPackage: (...args: unknown[]) =>
      assembleCertificationPackage(...args),
    certifyCertificationPackage: (...args: unknown[]) =>
      certifyCertificationPackage(...args),
    revokeCertificationPackage: (...args: unknown[]) =>
      revokeCertificationPackage(...args),
    attachCertificationEvidence: (...args: unknown[]) =>
      attachCertificationEvidence(...args),
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

import { EdgeCertificationModule } from "./edge-certification-module";

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

const ALL_PERMS = [
  "platform:certification:read",
  "platform:certification:manage",
  "platform:certification:certify",
  "platform:certification:revoke",
  "platform:certification:history:read",
];

const PKG = {
  id: "cert-1",
  code: "shared-saas-g1",
  name: "Shared SaaS gate",
  description: null,
  productId: null,
  deploymentProfileCode: "SHARED_SAAS",
  packageStatus: "READY",
  scope: {},
  gateResults: { ready: true },
  evidenceManifest: [],
  certifiedAt: null,
  revokedAt: null,
  revocationReason: null,
  workflowId: null,
  provisioningRequestId: null,
  authorizationRowId: null,
  authorizationVersion: null,
  metadata: {},
  createdBy: "tester",
  updatedBy: "tester",
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  version: 1,
};

function renderModule(initialTab?: "packages" | "evidence") {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <EdgeCertificationModule initialTab={initialTab} />
    </QueryClientProvider>,
  );
}

describe("EdgeCertificationModule (P7.15 console)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];
    listCertificationPackages.mockResolvedValue({
      data: { items: [PKG], total: 1 },
    });
    getCertificationPackage.mockResolvedValue({
      data: {
        package: PKG,
        evidenceItems: [
          {
            id: "e1",
            packageId: "cert-1",
            evidenceKey: "p713_reconciliation",
            phaseCode: "P7.13",
            required: true,
            itemStatus: "VERIFIED",
            sourceRef: "docs/p7.13",
            checksum: null,
            details: {},
            attachedAt: "2026-11-01T00:00:00.000Z",
            createdAt: "2026-11-01T00:00:00.000Z",
            updatedAt: "2026-11-01T00:00:00.000Z",
          },
          {
            id: "e2",
            packageId: "cert-1",
            evidenceKey: "p714_agents",
            phaseCode: "P7.14",
            required: false,
            itemStatus: "MISSING",
            sourceRef: null,
            checksum: null,
            details: {},
            attachedAt: null,
            createdAt: "2026-11-01T00:00:00.000Z",
            updatedAt: "2026-11-01T00:00:00.000Z",
          },
        ],
        runs: [],
        evidence: [],
      },
    });
  });

  it("shows the forbidden state without platform:certification:read", async () => {
    platformState.permissions = [];
    renderModule();
    expect(await screen.findByText("Access restricted")).toBeTruthy();
  });

  it("renders certification module when permitted without inventing CERTIFIED", async () => {
    renderModule();
    expect(await screen.findByTestId("cert-module")).toBeTruthy();
    expect(
      await screen.findByLabelText("Choisir un package de certification"),
    ).toBeTruthy();
    expect(listCertificationPackages).toHaveBeenCalled();
    expect(screen.queryByTestId("cert-package-status")).toBeNull();
    expect(screen.queryByText("CERTIFIED")).toBeNull();
  });

  it("shows package detail with optional p714_agents and never invents CERTIFIED", async () => {
    renderModule();
    fireEvent.click(
      await screen.findByLabelText("Choisir un package de certification"),
    );
    const option = await screen.findByRole("option", {
      name: /shared-saas-g1|READY/,
    });
    fireEvent.click(option);

    expect(await screen.findByTestId("cert-package-detail")).toBeTruthy();
    const status = screen.getByTestId("cert-package-status").textContent?.trim();
    expect(status).toBe("READY");
    expect(status).not.toBe("CERTIFIED");
    expect(screen.getByTestId("cert-item-p714_agents")).toBeTruthy();
    expect(screen.getByText("optional")).toBeTruthy();
    expect(screen.getByTestId("cert-assemble")).toBeTruthy();
    expect(screen.getByTestId("cert-certify")).toBeTruthy();
    expect(screen.getByTestId("cert-revoke")).toBeTruthy();
  });
});
