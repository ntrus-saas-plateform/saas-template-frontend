/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import InfrastructurePage from "./page";

const listInfrastructureProviders = vi.fn();
const listResourcePlans = vi.fn();
const listInfrastructureResources = vi.fn();
const listDatabaseResources = vi.fn();
const listRegistryProducts = vi.fn();
const reconcileInfrastructureResource = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/api/edge", () => ({
  edgeApi: {
    listInfrastructureProviders: (...a: unknown[]) => listInfrastructureProviders(...a),
    listResourcePlans: (...a: unknown[]) => listResourcePlans(...a),
    listInfrastructureResources: (...a: unknown[]) => listInfrastructureResources(...a),
    listDatabaseResources: (...a: unknown[]) => listDatabaseResources(...a),
    listRegistryProducts: (...a: unknown[]) => listRegistryProducts(...a),
    createResourcePlan: vi.fn(),
    validateResourcePlan: vi.fn(),
    reconcileInfrastructureResource: (...a: unknown[]) =>
      reconcileInfrastructureResource(...a),
    deprovisionResource: vi.fn(),
    createResourceBackup: vi.fn(),
    verifyDatabaseResource: vi.fn(),
  },
}));

const platformState = vi.hoisted(() => ({
  permissions: [] as string[],
}));

vi.mock("@/providers/edge-platform-provider", () => ({
  useEdgePlatform: () => ({
    permissions: platformState.permissions,
    isLoading: false,
  }),
}));

vi.mock("@/components/edge/permission-gate", () => ({
  EdgePermissionGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <InfrastructurePage />
    </QueryClientProvider>,
  );
}

describe("InfrastructurePage", () => {
  beforeEach(() => {
    platformState.permissions = [
      "platform:infrastructure:read",
      "platform:infrastructure:reconcile",
      "platform:infrastructure:deprovision",
      "platform:database:read",
      "platform:database:backup",
    ];
    listInfrastructureProviders.mockResolvedValue({
      items: [
        {
          id: "prov-1",
          code: "local-managed-v1",
          name: "Local",
          providerVersion: "1.0.0",
          providerKind: "LOCAL_MANAGED",
          operationalStatus: "ACTIVE",
          supportedDatabaseEngines: ["POSTGRESQL"],
          supportedRegions: ["local"],
        },
      ],
      total: 1,
    });
    listResourcePlans.mockResolvedValue({ items: [], total: 0 });
    listInfrastructureResources.mockResolvedValue({
      items: [
        {
          id: "res-1",
          resourceType: "NETWORK",
          status: "READY",
          healthStatus: "HEALTHY",
          driftStatus: "NONE",
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
    });
    listDatabaseResources.mockResolvedValue({ items: [], total: 0 });
    listRegistryProducts.mockResolvedValue({ items: [], total: 0 });
    reconcileInfrastructureResource.mockResolvedValue({});
  });

  it("shows forbidden without permissions", () => {
    platformState.permissions = [];
    renderPage();
    expect(screen.getByText(/forbidden|accès|permission/i)).toBeTruthy();
  });

  it("renders overview counts", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Providers")).toBeTruthy());
    expect(screen.getByText("Infrastructure & Database Management")).toBeTruthy();
  });

  it("lists resources and allows reconcile", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Resources" }));
    await waitFor(() => expect(screen.getByText("NETWORK")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Reconcile" }));
    await waitFor(() => expect(reconcileInfrastructureResource).toHaveBeenCalled());
  });

  it("asks confirmation before deprovision", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Resources" }));
    await waitFor(() => expect(screen.getByText("Deprovision")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Deprovision" }));
    expect(screen.getByText(/Confirmer la suppression/i)).toBeTruthy();
  });
});
